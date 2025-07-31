import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../utils/database';
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
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRES_IN }
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
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRES_IN }
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
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN }
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

  async logout(req: Request, res: Response, next: NextFunction) {
    res.json({ success: true, message: 'Logged out successfully' });
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }
      res.json({ success: true, message: 'Token refresh not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const resetToken = uuidv4();

      await sendEmail({
        to: email,
        subject: 'Réinitialisation de mot de passe',
        html: `
          <h1>Réinitialisation de mot de passe</h1>
          <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">Réinitialiser mon mot de passe</a>
        `
      });

      res.json({ success: true, message: 'Reset email sent' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      res.json({ success: true, message: 'Password reset not implemented' });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      res.json({ success: true, message: 'Email verified' });
    } catch (error) {
      next(error);
    }
  }
}