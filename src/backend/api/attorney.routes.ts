import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import db from '../utils/database';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now() }-${ Math.round(Math.random() * 1E9)}`;
    cb(null, `profile-${ uniqueSuffix }${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/profile', authenticate, authorize(['attorney']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attorneyId = req.user!.id;

    const attorney = await db('attorneys')
      .where({ id: attorneyId })
      .first();

    if (!attorney) {
      throw new AppError('Attorney not found', 404);
    }

    // Get practice areas
    const practiceAreas = await db('attorney_practice_areas')
      .join('practice_areas', 'attorney_practice_areas.practice_area_id', 'practice_areas.id')
      .where('attorney_practice_areas.attorney_id', attorneyId)
      .select(
        'practice_areas.id',
        'practice_areas.name_fr as name',
        'attorney_practice_areas.is_primary',
        'attorney_practice_areas.years_experience'
      );

    res.json({
      success: true,
      profile: {
        firstName: attorney.first_name,
        lastName: attorney.last_name,
        firmName: attorney.firm_name,
        email: attorney.email,
        phone: attorney.phone,
        barNumber: attorney.bar_number,
        yearsExperience: attorney.years_experience,
        languages: JSON.parse(attorney.languages || '["fr"]'),
        bioFr: attorney.bio_fr,
        bioEn: attorney.bio_en,
        profilePhotoUrl: attorney.profile_photo_url,
        addressLine1: attorney.address_line1,
        addressLine2: attorney.address_line2,
        city: attorney.city,
        postalCode: attorney.postal_code,
        hourlyRateMin: attorney.hourly_rate_min,
        hourlyRateMax: attorney.hourly_rate_max,
        fixedFeeAvailable: attorney.fixed_fee_available,
        contingencyAvailable: attorney.contingency_available,
        freeConsultation: attorney.free_consultation,
        consultationFee: attorney.consultation_fee,
        availabilityStatus: attorney.availability_status,
        practiceAreas
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticate, authorize(['attorney']), upload.single('profilePhoto'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attorneyId = req.user!.id;
    const profileData = req.body;

    // Handle file upload
    if (req.file) {
      profileData.profile_photo_url = `/uploads/profiles/${req.file.filename}`;
    }

    // Convert form data to database format
    const updateData: any = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      firm_name: profileData.firmName,
      phone: profileData.phone,
      years_experience: parseInt(profileData.yearsExperience),
      bio_fr: profileData.bioFr,
      bio_en: profileData.bioEn,
      address_line1: profileData.addressLine1,
      address_line2: profileData.addressLine2,
      city: profileData.city,
      postal_code: profileData.postalCode,
      hourly_rate_min: parseFloat(profileData.hourlyRateMin),
      hourly_rate_max: parseFloat(profileData.hourlyRateMax),
      fixed_fee_available: profileData.fixedFeeAvailable === 'true',
      contingency_available: profileData.contingencyAvailable === 'true',
      free_consultation: profileData.freeConsultation === 'true',
      consultation_fee: profileData.consultationFee ? parseFloat(profileData.consultationFee) : null,
      availability_status: profileData.availabilityStatus
    };

    if (profileData.languages) {
      updateData.languages = typeof profileData.languages === 'string' 
        ? profileData.languages 
        : JSON.stringify(profileData.languages);
    }

    if (req.file) {
      updateData.profile_photo_url = `/uploads/profiles/${req.file.filename}`;
    }

    await db('attorneys')
      .where({ id: attorneyId })
      .update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/stats', authenticate, authorize(['attorney']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attorneyId = req.user!.id;

    // Get profile views (simplified - in production you'd track this properly)
    const profileViews = Math.floor(Math.random() * 100) + 50;

    // Get match statistics
    const matchStats = await db('matches')
      .where('attorney_id', attorneyId)
      .select(
        db.raw('COUNT(*) as total_matches'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as accepted_matches', ['accepted'])
      )
      .first();

    // Get rating info
    const ratingInfo = await db('attorneys')
      .where('id', attorneyId)
      .select('rating_average', 'rating_count')
      .first();

    res.json({
      success: true,
      stats: {
        profileViews,
        totalMatches: parseInt(matchStats.total_matches) || 0,
        acceptedMatches: parseInt(matchStats.accepted_matches) || 0,
        averageRating: ratingInfo?.rating_average || 0,
        reviewCount: ratingInfo?.rating_count || 0,
        monthlyRevenue: 0 // Would be calculated from accepted matches
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', authenticate, authorize(['attorney']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attorneyId = req.user!.id;

    // Get recent matches
    const recentMatches = await db('matches')
      .join('match_requests', 'matches.match_request_id', 'match_requests.id')
      .join('users', 'match_requests.user_id', 'users.id')
      .join('practice_areas', 'match_requests.practice_area_id', 'practice_areas.id')
      .where('matches.attorney_id', attorneyId)
      .orderBy('matches.created_at', 'desc')
      .limit(10)
      .select(
        'matches.id',
        'matches.status',
        'matches.created_at',
        'users.first_name',
        'users.last_name',
        'practice_areas.name_fr as practice_area',
        'match_requests.urgency'
      );

    res.json({
      success: true,
      recentMatches: recentMatches.map(match => ({
        id: match.id,
        userName: `${match.first_name} ${match.last_name}`,
        practiceArea: match.practice_area,
        urgency: match.urgency,
        status: match.status,
        createdAt: match.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.put('/availability', authenticate, authorize(['attorney']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attorneyId = req.user!.id;
    const { status, schedule } = req.body;

    // Update availability status
    await db('attorneys')
      .where({ id: attorneyId })
      .update({ availability_status: status });

    // Update schedule if provided
    if (schedule) {
      await db('attorney_availability')
        .where({ attorney_id: attorneyId })
        .del();

      const scheduleInserts = schedule.map((slot: any) => ({
        attorney_id: attorneyId,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable
      }));

      await db('attorney_availability').insert(scheduleInserts);
    }

    res.json({
      success: true,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;