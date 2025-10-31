import db from '../utils/database';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';

interface TwoFactorSetup {
  userId: string;
  userType: 'user' | 'attorney';
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorVerification {
  isValid: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

interface TwoFactorSettings {
  userId: string;
  userType: 'user' | 'attorney';
  isEnabled: boolean;
  method: 'totp' | 'sms' | 'email';
  phoneNumber?: string;
  email?: string;
  lastUsed?: Date;
  createdAt: Date;
}

export class TwoFactorAuthService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes for SMS/email tokens

  async setupTwoFactor(
    userId: string,
    userType: 'user' | 'attorney',
    method: 'totp' | 'sms' | 'email',
    contactInfo?: { phoneNumber?: string; email?: string }
  ): Promise<TwoFactorSetup> {
    try {
      // Check if 2FA is already enabled
      const existing2FA = await db('two_factor_settings')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_enabled', true)
        .first();

      if (existing2FA) {
        throw new Error('Two-factor authentication is already enabled');
      }

      let setupData: TwoFactorSetup;

      switch (method) {
        case 'totp':
          setupData = await this.setupTOTP(userId, userType);
          break;
        case 'sms':
          if (!contactInfo?.phoneNumber) {
            throw new Error('Phone number required for SMS authentication');
          }
          setupData = await this.setupSMS(userId, userType, contactInfo.phoneNumber);
          break;
        case 'email':
          if (!contactInfo?.email) {
            throw new Error('Email required for email authentication');
          }
          setupData = await this.setupEmail(userId, userType, contactInfo.email);
          break;
        default:
          throw new Error('Invalid 2FA method');
      }

      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId, userType);
      setupData.backupCodes = backupCodes;

      // Store initial settings (not enabled yet - requires verification)
      await db('two_factor_settings').insert({
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        method,
        is_enabled: false,
        phone_number: contactInfo?.phoneNumber,
        email: contactInfo?.email,
        secret: method === 'totp' ? setupData.secret : null,
        backup_codes_generated: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      return setupData;
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw new Error('Failed to setup two-factor authentication');
    }
  }

  async verifyAndEnable2FA(
    userId: string,
    userType: 'user' | 'attorney',
    verificationCode: string
  ): Promise<boolean> {
    try {
      const settings = await db('two_factor_settings')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_enabled', false)
        .first();

      if (!settings) {
        throw new Error('No pending 2FA setup found');
      }

      let isValid = false;

      switch (settings.method) {
        case 'totp':
          isValid = await this.verifyTOTP(settings.secret, verificationCode);
          break;
        case 'sms':
        case 'email':
          isValid = await this.verifyToken(userId, userType, verificationCode);
          break;
      }

      if (isValid) {
        // Enable 2FA
        await db('two_factor_settings')
          .where('user_id', userId)
          .where('user_type', userType)
          .update({
            is_enabled: true,
            verified_at: new Date(),
            updated_at: new Date()
          });

        // Log the activation
        await this.logAuthEvent(userId, userType, '2fa_enabled', {
          method: settings.method
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw new Error('Failed to verify two-factor authentication');
    }
  }

  async verify2FA(
    userId: string,
    userType: 'user' | 'attorney',
    code: string,
    isBackupCode = false
  ): Promise<TwoFactorVerification> {
    try {
      // Check if user is locked out
      const lockout = await this.checkLockout(userId, userType);
      if (lockout.isLocked) {
        return {
          isValid: false,
          remainingAttempts: 0,
          lockedUntil: lockout.lockedUntil
        };
      }

      const settings = await db('two_factor_settings')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_enabled', true)
        .first();

      if (!settings) {
        return { isValid: false };
      }

      let isValid = false;

      if (isBackupCode) {
        isValid = await this.verifyBackupCode(userId, userType, code);
      } else {
        switch (settings.method) {
          case 'totp':
            isValid = await this.verifyTOTP(settings.secret, code);
            break;
          case 'sms':
          case 'email':
            isValid = await this.verifyToken(userId, userType, code);
            break;
        }
      }

      if (isValid) {
        // Reset failed attempts
        await this.resetFailedAttempts(userId, userType);
        
        // Update last used
        await db('two_factor_settings')
          .where('user_id', userId)
          .where('user_type', userType)
          .update({
            last_used: new Date(),
            updated_at: new Date()
          });

        // Log successful verification
        await this.logAuthEvent(userId, userType, '2fa_verified', {
          method: isBackupCode ? 'backup_code' : settings.method
        });

        return { isValid: true };
      } else {
        // Increment failed attempts
        const remainingAttempts = await this.incrementFailedAttempts(userId, userType);
        
        // Log failed attempt
        await this.logAuthEvent(userId, userType, '2fa_failed', {
          method: isBackupCode ? 'backup_code' : settings.method
        });

        return {
          isValid: false,
          remainingAttempts
        };
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw new Error('Failed to verify two-factor authentication');
    }
  }

  async disable2FA(
    userId: string,
    userType: 'user' | 'attorney',
    password: string
  ): Promise<boolean> {
    try {
      // Verify password first
      const user = await db(userType === 'user' ? 'users' : 'attorneys')
        .where('id', userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Disable 2FA
      await db('two_factor_settings')
        .where('user_id', userId)
        .where('user_type', userType)
        .update({
          is_enabled: false,
          disabled_at: new Date(),
          updated_at: new Date()
        });

      // Remove backup codes
      await db('two_factor_backup_codes')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_used', false)
        .delete();

      // Log the event
      await this.logAuthEvent(userId, userType, '2fa_disabled', {});

      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable two-factor authentication');
    }
  }

  async sendVerificationCode(
    userId: string,
    userType: 'user' | 'attorney'
  ): Promise<void> {
    try {
      const settings = await db('two_factor_settings')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_enabled', true)
        .first();

      if (!settings) {
        throw new Error('Two-factor authentication not enabled');
      }

      if (settings.method === 'totp') {
        throw new Error('TOTP does not require sending codes');
      }

      // Generate 6-digit code
      const code = this.generateNumericCode(6);
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);

      // Store the code
      await db('two_factor_tokens').insert({
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        token: await bcrypt.hash(code, 10),
        method: settings.method,
        expires_at: expiresAt,
        created_at: new Date()
      });

      // Send the code
      if (settings.method === 'sms') {
        await this.sendSMS(settings.phone_number, `Your Judge.ca verification code is: ${code}`);
      } else if (settings.method === 'email') {
        await this.sendEmail(settings.email, 'Judge.ca Verification Code', `Your verification code is: ${code}`);
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw new Error('Failed to send verification code');
    }
  }

  async regenerateBackupCodes(
    userId: string,
    userType: 'user' | 'attorney',
    password: string
  ): Promise<string[]> {
    try {
      // Verify password
      const user = await db(userType === 'user' ? 'users' : 'attorneys')
        .where('id', userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Delete old unused backup codes
      await db('two_factor_backup_codes')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_used', false)
        .delete();

      // Generate new backup codes
      const backupCodes = await this.generateBackupCodes(userId, userType);

      // Log the event
      await this.logAuthEvent(userId, userType, 'backup_codes_regenerated', {});

      return backupCodes;
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  async get2FAStatus(
    userId: string,
    userType: 'user' | 'attorney'
  ): Promise<{
    isEnabled: boolean;
    method?: 'totp' | 'sms' | 'email';
    backupCodesRemaining?: number;
    lastUsed?: Date;
  }> {
    try {
      const settings = await db('two_factor_settings')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_enabled', true)
        .first();

      if (!settings) {
        return { isEnabled: false };
      }

      const backupCodesRemaining = await db('two_factor_backup_codes')
        .where('user_id', userId)
        .where('user_type', userType)
        .where('is_used', false)
        .count('* as count')
        .first();

      return {
        isEnabled: true,
        method: settings.method,
        backupCodesRemaining: parseInt(backupCodesRemaining?.count || '0'),
        lastUsed: settings.last_used
      };
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw new Error('Failed to get 2FA status');
    }
  }

  private async setupTOTP(userId: string, userType: 'user' | 'attorney'): Promise<TwoFactorSetup> {
    // Get user info for label
    const user = await db(userType === 'user' ? 'users' : 'attorneys')
      .where('id', userId)
      .first();

    const secret = speakeasy.generateSecret({
      length: 32,
      name: `Judge.ca (${user.email})`,
      issuer: 'Judge.ca'
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      userId,
      userType,
      secret: secret.base32,
      qrCodeUrl,
      backupCodes: []
    };
  }

  private async setupSMS(userId: string, userType: 'user' | 'attorney', phoneNumber: string): Promise<TwoFactorSetup> {
    // Send initial verification code
    const code = this.generateNumericCode(6);
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);

    await db('two_factor_tokens').insert({
      id: uuidv4(),
      user_id: userId,
      user_type: userType,
      token: await bcrypt.hash(code, 10),
      method: 'sms',
      phone_number: phoneNumber,
      expires_at: expiresAt,
      created_at: new Date()
    });

    await this.sendSMS(phoneNumber, `Your Judge.ca verification code is: ${code}`);

    return {
      userId,
      userType,
      secret: '',
      qrCodeUrl: '',
      backupCodes: []
    };
  }

  private async setupEmail(userId: string, userType: 'user' | 'attorney', email: string): Promise<TwoFactorSetup> {
    // Send initial verification code
    const code = this.generateNumericCode(6);
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);

    await db('two_factor_tokens').insert({
      id: uuidv4(),
      user_id: userId,
      user_type: userType,
      token: await bcrypt.hash(code, 10),
      method: 'email',
      email,
      expires_at: expiresAt,
      created_at: new Date()
    });

    await this.sendEmail(email, 'Judge.ca Verification Code', `Your verification code is: ${code}`);

    return {
      userId,
      userType,
      secret: '',
      qrCodeUrl: '',
      backupCodes: []
    };
  }

  private async verifyTOTP(secret: string, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after for clock skew
    });
  }

  private async verifyToken(userId: string, userType: 'user' | 'attorney', token: string): Promise<boolean> {
    const storedTokens = await db('two_factor_tokens')
      .where('user_id', userId)
      .where('user_type', userType)
      .where('is_used', false)
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .limit(1);

    for (const storedToken of storedTokens) {
      const isValid = await bcrypt.compare(token, storedToken.token);
      if (isValid) {
        // Mark token as used
        await db('two_factor_tokens')
          .where('id', storedToken.id)
          .update({
            is_used: true,
            used_at: new Date()
          });
        return true;
      }
    }

    return false;
  }

  private async verifyBackupCode(userId: string, userType: 'user' | 'attorney', code: string): Promise<boolean> {
    const backupCodes = await db('two_factor_backup_codes')
      .where('user_id', userId)
      .where('user_type', userType)
      .where('is_used', false);

    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code_hash);
      if (isValid) {
        // Mark backup code as used
        await db('two_factor_backup_codes')
          .where('id', backupCode.id)
          .update({
            is_used: true,
            used_at: new Date()
          });
        return true;
      }
    }

    return false;
  }

  private async generateBackupCodes(userId: string, userType: 'user' | 'attorney'): Promise<string[]> {
    const codes: string[] = [];
    const codeRecords: any[] = [];

    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = this.generateAlphanumericCode(8);
      codes.push(code);
      
      codeRecords.push({
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        code_hash: await bcrypt.hash(code, 10),
        is_used: false,
        created_at: new Date()
      });
    }

    await db('two_factor_backup_codes').insert(codeRecords);

    return codes;
  }

  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  private generateAlphanumericCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async checkLockout(userId: string, userType: 'user' | 'attorney'): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
  }> {
    const lockout = await db('two_factor_lockouts')
      .where('user_id', userId)
      .where('user_type', userType)
      .where('locked_until', '>', new Date())
      .first();

    return {
      isLocked: !!lockout,
      lockedUntil: lockout?.locked_until
    };
  }

  private async incrementFailedAttempts(userId: string, userType: 'user' | 'attorney'): Promise<number> {
    const attempts = await db('two_factor_attempts')
      .where('user_id', userId)
      .where('user_type', userType)
      .where('created_at', '>', new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      .count('* as count')
      .first();

    const attemptCount = parseInt(attempts?.count || '0') + 1;

    await db('two_factor_attempts').insert({
      id: uuidv4(),
      user_id: userId,
      user_type: userType,
      created_at: new Date()
    });

    if (attemptCount >= this.MAX_ATTEMPTS) {
      // Create lockout
      await db('two_factor_lockouts').insert({
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        locked_until: new Date(Date.now() + this.LOCKOUT_DURATION),
        created_at: new Date()
      });
      return 0;
    }

    return this.MAX_ATTEMPTS - attemptCount;
  }

  private async resetFailedAttempts(userId: string, userType: 'user' | 'attorney'): Promise<void> {
    await db('two_factor_attempts')
      .where('user_id', userId)
      .where('user_type', userType)
      .delete();
  }

  private async logAuthEvent(
    userId: string,
    userType: 'user' | 'attorney',
    eventType: string,
    metadata: any
  ): Promise<void> {
    try {
      await db('two_factor_logs').insert({
        id: uuidv4(),
        user_id: userId,
        user_type: userType,
        event_type: eventType,
        metadata: JSON.stringify(metadata),
        ip_address: 'hidden', // In production, capture from request
        user_agent: 'hidden', // In production, capture from request
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error logging auth event:', error);
    }
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // Mock implementation - in production, use Twilio, AWS SNS, etc.
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
  }

  private async sendEmail(email: string, subject: string, body: string): Promise<void> {
    // Mock implementation - in production, use SendGrid, AWS SES, etc.
    console.log(`Sending email to ${email}: ${subject} - ${body}`);
  }
}

// Database schema additions needed:
/*
CREATE TABLE two_factor_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  method VARCHAR(20) NOT NULL CHECK (method IN ('totp', 'sms', 'email')),
  is_enabled BOOLEAN DEFAULT FALSE,
  secret VARCHAR(255),
  phone_number VARCHAR(20),
  email VARCHAR(255),
  backup_codes_generated BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  disabled_at TIMESTAMP,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_type)
);

CREATE TABLE two_factor_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  token VARCHAR(255) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('sms', 'email')),
  phone_number VARCHAR(20),
  email VARCHAR(255),
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE two_factor_backup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  code_hash VARCHAR(255) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE two_factor_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  locked_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE two_factor_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_two_factor_settings_user ON two_factor_settings(user_id, user_type);
CREATE INDEX idx_two_factor_tokens_user ON two_factor_tokens(user_id, user_type);
CREATE INDEX idx_two_factor_tokens_expires ON two_factor_tokens(expires_at);
CREATE INDEX idx_two_factor_backup_codes_user ON two_factor_backup_codes(user_id, user_type);
CREATE INDEX idx_two_factor_attempts_user ON two_factor_attempts(user_id, user_type);
CREATE INDEX idx_two_factor_lockouts_user ON two_factor_lockouts(user_id, user_type);
CREATE INDEX idx_two_factor_logs_user ON two_factor_logs(user_id, user_type);
*/