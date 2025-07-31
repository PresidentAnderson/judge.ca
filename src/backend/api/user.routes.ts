import { Router } from 'express';
import { UserModel, MatchRequestModel } from '../models';
import { authenticate, requireUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { MatchingService } from '../services/matching.service';
import db from '../utils/database';
import { z } from 'zod';
import { Request, Response } from 'express';

const router = Router();
const userModel = new UserModel(db);
const matchRequestModel = new MatchRequestModel(db);
const matchingService = new MatchingService();

interface AuthenticatedRequest extends Request {
  user?: any;
  userType?: string;
}

const createMatchRequestSchema = z.object({
  body: z.object({
    practiceAreaId: z.string().uuid(),
    caseDescription: z.string().min(50),
    budgetType: z.enum(['hourly', 'fixed', 'contingency', 'flexible']),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    urgency: z.enum(['immediate', 'within_week', 'within_month', 'flexible']),
    preferredLanguage: z.enum(['fr', 'en']),
    additionalRequirements: z.string().optional()
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    preferredLanguage: z.enum(['fr', 'en']).optional()
  })
});

router.get('/profile', authenticate, requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userModel.findById(req.user!.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

router.put('/profile', authenticate, requireUser, validateRequest(updateProfileSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedUser = await userModel.update(req.user!.id, req.body);
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

router.post('/match-requests', authenticate, requireUser, validateRequest(createMatchRequestSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchRequest = await matchRequestModel.create({
      userId: req.user!.id,
      ...req.body
    });

    const matches = await matchingService.findMatches(matchRequest as any);
    
    if (matches.length > 0) {
      await matchingService.createMatches(matchRequest.id, matches);
      
      await db('match_requests')
        .where('id', matchRequest.id)
        .update({ status: 'matched' });
    }

    res.status(201).json({
      success: true,
      data: {
        matchRequest,
        matchCount: matches.length
      }
    });
  } catch (error) {
    console.error('Error creating match request:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la demande'
    });
  }
});

router.get('/match-requests', authenticate, requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchRequests = await matchRequestModel.findByUserId(req.user!.id);
    
    res.json({
      success: true,
      data: matchRequests
    });
  } catch (error) {
    console.error('Error fetching match requests:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des demandes'
    });
  }
});

router.get('/dashboard', authenticate, requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matchRequests = await matchRequestModel.findByUserId(req.user!.id);
    const recentRequests = matchRequests.slice(0, 5);
    
    const stats = {
      totalRequests: matchRequests.length,
      pendingRequests: matchRequests.filter(r => r.status === 'pending').length,
      matchedRequests: matchRequests.filter(r => r.status === 'matched').length
    };

    res.json({
      success: true,
      data: {
        stats,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données'
    });
  }
});

export default router;