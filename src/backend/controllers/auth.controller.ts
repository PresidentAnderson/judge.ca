import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import db from '../utils/database';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, barNumber, phone } = req.body;

      const existingUser = await db('users').where({ email }).first();
      const existingAttorney = await db('attorneys').where({ email }).first();

      if (existingUser || existingAttorney) {
        throw new AppError('Email already registered', 400);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = uuidv4();

      if (role === 'attorney') {
        if (!barNumber) {
          throw new AppError('Bar number required for attorney registration', 400);
        }

        const [attorney] = await db('attorneys').insert({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          bar_number: barNumber,
          phone: phone || '',
          languages: JSON.stringify(['fr'])
        }).returning('*');

        await sendEmail({
          to: email,
          subject: 'Vérifiez votre compte Judge.ca',
          html: `
            <h1>Bienvenue sur Judge.ca</h1>
            <p>Cliquez sur le lien suivant pour vérifier votre compte:</p>
            <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">Vérifier mon compte</a>
          `
        });

        const token = jwt.sign(
          { id: attorney.id, email: attorney.email, role: 'attorney' },
          process.env.JWT_SECRET || 'secret-key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
        );

        res.status(201).json({
          success: true,
          token,
          user: {
            id: attorney.id,
            email: attorney.email,
            firstName: attorney.first_name,
            lastName: attorney.last_name,
            role: 'attorney'
          }
        });
      } else {
        const [user] = await db('users').insert({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone
        }).returning('*');

        await sendEmail({
          to: email,
          subject: 'Vérifiez votre compte Judge.ca',
          html: `
            <h1>Bienvenue sur Judge.ca</h1>
            <p>Cliquez sur le lien suivant pour vérifier votre compte:</p>
            <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">Vérifier mon compte</a>
          `
        });

        const token = jwt.sign(
          { id: user.id, email: user.email, role: 'user' },
          process.env.JWT_SECRET || 'secret-key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
        );

        res.status(201).json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: 'user'
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      let user = await db('users').where({ email }).first();
      let role = 'user';

      if (!user) {
        user = await db('attorneys').where({ email }).first();
        role = 'attorney';
      }

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      let user = await db('users').where({ email }).first();
      let role = 'user';

      if (!user) {
        user = await db('attorneys').where({ email }).first();
        role = 'attorney';
      }

      if (!user) {
        throw new AppError('No account found with that email', 404);
      }

      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      const table = role === 'attorney' ? 'attorneys' : 'users';
      await db(table)
        .where({ id: user.id })
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires
        });

      await sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe Judge.ca',
        html: `
          <h1>Réinitialisation du mot de passe</h1>
          <p>Vous avez demandé une réinitialisation de mot de passe.</p>
          <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">Réinitialiser mon mot de passe</a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        `
      });

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      let user = await db('users')
        .where({ reset_token: token })
        .where('reset_token_expires', '>', new Date())
        .first();
      let role = 'user';

      if (!user) {
        user = await db('attorneys')
          .where({ reset_token: token })
          .where('reset_token_expires', '>', new Date())
          .first();
        role = 'attorney';
      }

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const table = role === 'attorney' ? 'attorneys' : 'users';

      await db(table)
        .where({ id: user.id })
        .update({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null
        });

      res.json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      let user = await db('users')
        .where({ verification_token: token })
        .first();
      let role = 'user';

      if (!user) {
        user = await db('attorneys')
          .where({ verification_token: token })
          .first();
        role = 'attorney';
      }

      if (!user) {
        throw new AppError('Invalid verification token', 400);
      }

      const table = role === 'attorney' ? 'attorneys' : 'users';
      await db(table)
        .where({ id: user.id })
        .update({
          email_verified: true,
          verification_token: null
        });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token from storage. Here we can blacklist the token
      // if we implement a token blacklist system

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;
      
      // Generate new access token
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      res.json({
        success: true,
        token: newToken
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError('Invalid refresh token', 401));
      } else {
        next(error);
      }
    }
  }
}

export default new AuthController();