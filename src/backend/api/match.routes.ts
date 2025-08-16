import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { MatchingService } from '../services/matching.service';
import db from '../utils/database';
import { AppError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const matchingService = new MatchingService();

const matchRequestSchema = z.object({
  body: z.object({
    legalNeed: z.string(),
    caseDescription: z.string().min(50),
    budgetType: z.enum(['hourly', 'fixed', 'contingency', 'flexible']),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    urgency: z.enum(['immediate', 'within_week', 'within_month', 'flexible']),
    preferredLanguage: z.enum(['fr', 'en']),
    location: z.string(),
    specificRequirements: z.string().optional()
  })
});

router.post('/request', authenticate, validateRequest(matchRequestSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { legalNeed, ...requestData } = req.body;

    // Get practice area ID from legal need
    const practiceArea = await db('practice_areas')
      .where('name_en', legalNeed)
      .orWhere('name_fr', legalNeed)
      .first();

    if (!practiceArea) {
      throw new AppError('Invalid practice area', 400);
    }

    // Create match request
    const [matchRequest] = await db('match_requests').insert({
      user_id: userId,
      practice_area_id: practiceArea.id,
      case_description: requestData.caseDescription,
      budget_type: requestData.budgetType,
      budget_min: requestData.budgetMin,
      budget_max: requestData.budgetMax,
      urgency: requestData.urgency,
      preferred_language: requestData.preferredLanguage,
      additional_requirements: requestData.specificRequirements,
      status: 'pending'
    }).returning('*');

    // Find matches
    const matches = await matchingService.findMatches({
      userId,
      practiceAreaId: practiceArea.id,
      ...requestData
    });

    // Create match records
    const matchRecords = await Promise.all(
      matches.map(match => 
        matchingService.createMatchRecord(matchRequest.id, match.attorneyId, match.totalScore)
      )
    );

    res.json({
      success: true,
      matchRequestId: matchRequest.id,
      matchCount: matches.length,
      matches: matches.map((match, index) => ({
        matchId: matchRecords[index],
        attorneyId: match.attorneyId,
        matchScore: match.totalScore,
        explanation: match.explanation
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my-matches', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let matches;
    if (role === 'user') {
      matches = await db('matches')
        .join('match_requests', 'matches.match_request_id', 'match_requests.id')
        .join('attorneys', 'matches.attorney_id', 'attorneys.id')
        .where('match_requests.user_id', userId)
        .select(
          'matches.*',
          'attorneys.first_name',
          'attorneys.last_name',
          'attorneys.firm_name',
          'attorneys.profile_photo_url',
          'attorneys.rating_average',
          'attorneys.hourly_rate_min',
          'attorneys.hourly_rate_max'
        )
        .orderBy('matches.created_at', 'desc');
    } else if (role === 'attorney') {
      matches = await db('matches')
        .join('match_requests', 'matches.match_request_id', 'match_requests.id')
        .join('users', 'match_requests.user_id', 'users.id')
        .where('matches.attorney_id', userId)
        .select(
          'matches.*',
          'match_requests.case_description',
          'match_requests.urgency',
          'match_requests.budget_type',
          'users.first_name',
          'users.last_name'
        )
        .orderBy('matches.created_at', 'desc');
    }

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:matchId/accept', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { matchId } = req.params;
    const attorneyId = req.user!.id;

    const match = await db('matches')
      .where({ id: matchId, attorney_id: attorneyId })
      .first();

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    await db('matches')
      .where({ id: matchId })
      .update({
        status: 'accepted',
        attorney_response: req.body.message || 'Attorney has accepted your request'
      });

    res.json({
      success: true,
      message: 'Match accepted successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:matchId/reject', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { matchId } = req.params;
    const attorneyId = req.user!.id;

    const match = await db('matches')
      .where({ id: matchId, attorney_id: attorneyId })
      .first();

    if (!match) {
      throw new AppError('Match not found', 404);
    }

    await db('matches')
      .where({ id: matchId })
      .update({
        status: 'rejected',
        attorney_response: req.body.reason || 'Attorney is not available for this case'
      });

    res.json({
      success: true,
      message: 'Match rejected'
    });
  } catch (error) {
    next(error);
  }
});

export default router;