import db from '../utils/database';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface Attorney {
  id: string;
  email: string;
  barNumber: string;
  firstName: string;
  lastName: string;
  firmName?: string;
  province: string;
  isVerified: boolean;
}

interface VerificationDocument {
  id: string;
  attorneyId: string;
  documentType: 'bar_certificate' | 'law_degree' | 'insurance_certificate' | 'practice_license' | 'identity_document';
  fileName: string;
  fileUrl: string;
  fileHash: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  rejectionReason?: string;
  notes?: string;
}

interface VerificationStatus {
  attorneyId: string;
  overallStatus: 'not_started' | 'in_progress' | 'under_review' | 'verified' | 'rejected';
  requiredDocuments: string[];
  submittedDocuments: string[];
  approvedDocuments: string[];
  pendingDocuments: string[];
  rejectedDocuments: string[];
  completionPercentage: number;
  lastUpdated: Date;
  estimatedCompletionDays: number;
}

export class AttorneyVerificationService {
  private readonly REQUIRED_DOCUMENTS = {
    'QC': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'ON': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'BC': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'AB': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'MB': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'SK': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'NS': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'NB': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'PE': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'NL': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'YT': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'NT': ['bar_certificate', 'insurance_certificate', 'identity_document'],
    'NU': ['bar_certificate', 'insurance_certificate', 'identity_document']
  };

  private readonly PROVINCIAL_BAR_APIS = {
    'QC': 'https://www.barreau.qc.ca/api/verify', // Mock API endpoints
    'ON': 'https://lso.ca/api/verify',
    'BC': 'https://lawsociety.bc.ca/api/verify',
    'AB': 'https://lawsociety.ab.ca/api/verify'
  };

  async initializeVerification(attorneyId: string): Promise<VerificationStatus> {
    try {
      // Get attorney details
      const attorney = await db('attorneys')
        .where('id', attorneyId)
        .first();

      if (!attorney) {
        throw new Error('Attorney not found');
      }

      const requiredDocs = this.REQUIRED_DOCUMENTS[attorney.province as keyof typeof this.REQUIRED_DOCUMENTS] || 
                          this.REQUIRED_DOCUMENTS['QC'];

      // Create verification record
      const verificationData = {
        id: uuidv4(),
        attorney_id: attorneyId,
        status: 'not_started',
        required_documents: JSON.stringify(requiredDocs),
        submitted_documents: JSON.stringify([]),
        approved_documents: JSON.stringify([]),
        pending_documents: JSON.stringify([]),
        rejected_documents: JSON.stringify([]),
        completion_percentage: 0,
        estimated_completion_days: 5,
        created_at: new Date(),
        updated_at: new Date()
      };

      await db('attorney_verifications').insert(verificationData);

      return this.getVerificationStatus(attorneyId);
    } catch (error) {
      console.error('Error initializing verification:', error);
      throw new Error('Failed to initialize verification');
    }
  }

  async uploadDocument(
    attorneyId: string,
    documentType: string,
    file: Express.Multer.File,
    additionalInfo?: any
  ): Promise<VerificationDocument> {
    try {
      // Validate file type and size
      this.validateDocument(file, documentType);

      // Generate file hash for integrity
      const fileHash = crypto.createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Upload to secure storage (implement with AWS S3, Cloudinary, etc.)
      const fileUrl = await this.uploadToSecureStorage(file, attorneyId, documentType);

      // Create document record
      const documentData = {
        id: uuidv4(),
        attorney_id: attorneyId,
        document_type: documentType,
        file_name: file.originalname,
        file_url: fileUrl,
        file_hash: fileHash,
        file_size: file.size,
        mime_type: file.mimetype,
        additional_info: JSON.stringify(additionalInfo || {}),
        status: 'pending',
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      const [document] = await db('attorney_verification_documents')
        .insert(documentData)
        .returning('*');

      // Update verification status
      await this.updateVerificationProgress(attorneyId);

      // Trigger automatic verification for certain documents
      await this.attemptAutomaticVerification(document);

      return this.transformDocument(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async getVerificationStatus(attorneyId: string): Promise<VerificationStatus> {
    try {
      const verification = await db('attorney_verifications')
        .where('attorney_id', attorneyId)
        .first();

      if (!verification) {
        // Initialize verification if not exists
        return await this.initializeVerification(attorneyId);
      }

      return {
        attorneyId,
        overallStatus: verification.status,
        requiredDocuments: JSON.parse(verification.required_documents || '[]'),
        submittedDocuments: JSON.parse(verification.submitted_documents || '[]'),
        approvedDocuments: JSON.parse(verification.approved_documents || '[]'),
        pendingDocuments: JSON.parse(verification.pending_documents || '[]'),
        rejectedDocuments: JSON.parse(verification.rejected_documents || '[]'),
        completionPercentage: verification.completion_percentage || 0,
        lastUpdated: verification.updated_at,
        estimatedCompletionDays: verification.estimated_completion_days || 5
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw new Error('Failed to get verification status');
    }
  }

  async reviewDocument(
    documentId: string,
    reviewerId: string,
    decision: 'approve' | 'reject',
    notes?: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      const document = await db('attorney_verification_documents')
        .where('id', documentId)
        .first();

      if (!document) {
        throw new Error('Document not found');
      }

      const updateData = {
        status: decision === 'approve' ? 'approved' : 'rejected',
        verified_at: new Date(),
        verified_by: reviewerId,
        notes,
        rejection_reason: rejectionReason,
        updated_at: new Date()
      };

      await db('attorney_verification_documents')
        .where('id', documentId)
        .update(updateData);

      // Update verification progress
      await this.updateVerificationProgress(document.attorney_id);

      // Send notification to attorney
      await this.sendVerificationNotification(document.attorney_id, decision, {
        documentType: document.document_type,
        rejectionReason,
        notes
      });

      // If all documents approved, complete verification
      const status = await this.getVerificationStatus(document.attorney_id);
      if (status.completionPercentage === 100) {
        await this.completeVerification(document.attorney_id);
      }
    } catch (error) {
      console.error('Error reviewing document:', error);
      throw new Error('Failed to review document');
    }
  }

  async verifyBarMembership(attorneyId: string, barNumber: string, province: string): Promise<{
    isValid: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      const apiUrl = this.PROVINCIAL_BAR_APIS[province as keyof typeof this.PROVINCIAL_BAR_APIS];
      
      if (!apiUrl) {
        return { isValid: false, error: 'Bar verification not available for this province' };
      }

      // Mock API call (in production, implement actual API calls)
      const mockResponse = {
        isValid: true,
        details: {
          barNumber,
          firstName: 'John',
          lastName: 'Doe',
          status: 'Active',
          admissionDate: '2010-05-15',
          disciplines: [],
          specializations: ['Civil Law', 'Corporate Law']
        }
      };

      // Store verification result
      await db('attorney_bar_verifications').insert({
        id: uuidv4(),
        attorney_id: attorneyId,
        bar_number: barNumber,
        province,
        verification_result: JSON.stringify(mockResponse),
        verified_at: new Date(),
        is_valid: mockResponse.isValid,
        created_at: new Date()
      });

      return mockResponse;
    } catch (error) {
      console.error('Error verifying bar membership:', error);
      return { isValid: false, error: 'Failed to verify bar membership' };
    }
  }

  async getVerificationDocuments(attorneyId: string): Promise<VerificationDocument[]> {
    try {
      const documents = await db('attorney_verification_documents')
        .where('attorney_id', attorneyId)
        .orderBy('created_at', 'desc');

      return documents.map(doc => this.transformDocument(doc));
    } catch (error) {
      console.error('Error getting verification documents:', error);
      throw new Error('Failed to get verification documents');
    }
  }

  async resubmitDocument(
    attorneyId: string,
    documentId: string,
    file: Express.Multer.File,
    additionalInfo?: any
  ): Promise<VerificationDocument> {
    try {
      // Mark old document as superseded
      await db('attorney_verification_documents')
        .where('id', documentId)
        .update({
          status: 'superseded',
          updated_at: new Date()
        });

      // Get document type from old document
      const oldDocument = await db('attorney_verification_documents')
        .where('id', documentId)
        .first();

      if (!oldDocument) {
        throw new Error('Original document not found');
      }

      // Upload new document
      return await this.uploadDocument(attorneyId, oldDocument.document_type, file, additionalInfo);
    } catch (error) {
      console.error('Error resubmitting document:', error);
      throw new Error('Failed to resubmit document');
    }
  }

  private validateDocument(file: Express.Multer.File, documentType: string): void {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Additional validations based on document type
    if (documentType === 'bar_certificate' && file.mimetype !== 'application/pdf') {
      throw new Error('Bar certificate must be a PDF document.');
    }
  }

  private async uploadToSecureStorage(
    file: Express.Multer.File,
    attorneyId: string,
    documentType: string
  ): Promise<string> {
    // Mock implementation - in production, use AWS S3, Cloudinary, etc.
    const fileName = `${attorneyId}/${documentType}/${Date.now()}_${file.originalname}`;
    const mockUrl = `https://secure-storage.judge.ca/documents/${fileName}`;
    
    // Here you would implement actual file upload
    // const uploadResult = await s3.upload({
    //   Bucket: 'attorney-documents',
    //   Key: fileName,
    //   Body: file.buffer,
    //   ContentType: file.mimetype,
    //   ACL: 'private'
    // }).promise();
    
    return mockUrl;
  }

  private async attemptAutomaticVerification(document: any): Promise<void> {
    try {
      // Implement automatic verification for certain document types
      if (document.document_type === 'bar_certificate') {
        // Extract text using OCR and verify against bar database
        const extractedData = await this.extractDocumentData(document);
        
        if (extractedData.barNumber) {
          const verification = await this.verifyBarMembership(
            document.attorney_id,
            extractedData.barNumber,
            extractedData.province || 'QC'
          );

          if (verification.isValid) {
            await db('attorney_verification_documents')
              .where('id', document.id)
              .update({
                status: 'approved',
                verified_at: new Date(),
                verified_by: 'system_auto',
                notes: 'Automatically verified against bar database',
                updated_at: new Date()
              });
          }
        }
      }
    } catch (error) {
      console.error('Error in automatic verification:', error);
      // Don't throw - automatic verification is optional
    }
  }

  private async extractDocumentData(document: any): Promise<any> {
    // Mock OCR/text extraction - in production, use AWS Textract, Google Vision, etc.
    return {
      barNumber: '12345-QC',
      province: 'QC',
      name: 'John Doe',
      admissionDate: '2010-05-15'
    };
  }

  private async updateVerificationProgress(attorneyId: string): Promise<void> {
    try {
      const verification = await db('attorney_verifications')
        .where('attorney_id', attorneyId)
        .first();

      if (!verification) return;

      const documents = await db('attorney_verification_documents')
        .where('attorney_id', attorneyId)
        .where('status', '!=', 'superseded');

      const requiredDocs = JSON.parse(verification.required_documents || '[]');
      const submittedDocs = documents.map(doc => doc.document_type);
      const approvedDocs = documents.filter(doc => doc.status === 'approved').map(doc => doc.document_type);
      const pendingDocs = documents.filter(doc => doc.status === 'pending').map(doc => doc.document_type);
      const rejectedDocs = documents.filter(doc => doc.status === 'rejected').map(doc => doc.document_type);

      const completionPercentage = Math.round((approvedDocs.length / requiredDocs.length) * 100);

      let overallStatus = 'not_started';
      if (submittedDocs.length === 0) {
        overallStatus = 'not_started';
      } else if (completionPercentage === 100) {
        overallStatus = 'verified';
      } else if (rejectedDocs.length > 0) {
        overallStatus = 'needs_revision';
      } else if (pendingDocs.length > 0) {
        overallStatus = 'under_review';
      } else {
        overallStatus = 'in_progress';
      }

      await db('attorney_verifications')
        .where('attorney_id', attorneyId)
        .update({
          status: overallStatus,
          submitted_documents: JSON.stringify([...new Set(submittedDocs)]),
          approved_documents: JSON.stringify([...new Set(approvedDocs)]),
          pending_documents: JSON.stringify([...new Set(pendingDocs)]),
          rejected_documents: JSON.stringify([...new Set(rejectedDocs)]),
          completion_percentage: completionPercentage,
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error updating verification progress:', error);
    }
  }

  private async completeVerification(attorneyId: string): Promise<void> {
    try {
      // Update attorney as verified
      await db('attorneys')
        .where('id', attorneyId)
        .update({
          is_verified: true,
          verified_at: new Date(),
          updated_at: new Date()
        });

      // Update verification record
      await db('attorney_verifications')
        .where('attorney_id', attorneyId)
        .update({
          status: 'verified',
          verified_at: new Date(),
          updated_at: new Date()
        });

      // Send completion notification
      await this.sendVerificationNotification(attorneyId, 'complete');

      // Create verification certificate
      await this.generateVerificationCertificate(attorneyId);
    } catch (error) {
      console.error('Error completing verification:', error);
    }
  }

  private async generateVerificationCertificate(attorneyId: string): Promise<void> {
    try {
      const attorney = await db('attorneys')
        .where('id', attorneyId)
        .first();

      const certificateData = {
        id: uuidv4(),
        attorney_id: attorneyId,
        certificate_number: `JUDGE-${Date.now()}-${attorneyId.substring(0, 8).toUpperCase()}`,
        issued_at: new Date(),
        valid_until: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year
        attorney_name: `${attorney.first_name} ${attorney.last_name}`,
        bar_number: attorney.bar_number,
        province: attorney.province,
        verification_level: 'full',
        created_at: new Date()
      };

      await db('attorney_verification_certificates').insert(certificateData);
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  }

  private async sendVerificationNotification(
    attorneyId: string,
    type: 'approve' | 'reject' | 'complete',
    details?: any
  ): Promise<void> {
    try {
      const attorney = await db('attorneys')
        .where('id', attorneyId)
        .first();

      if (!attorney) return;

      const notificationData = {
        id: uuidv4(),
        attorney_id: attorneyId,
        type: `verification_${type}`,
        title: this.getNotificationTitle(type),
        message: this.getNotificationMessage(type, details),
        data: JSON.stringify(details || {}),
        is_read: false,
        created_at: new Date()
      };

      await db('notifications').insert(notificationData);

      // Send email notification (implement with SendGrid, AWS SES, etc.)
      // await this.sendEmailNotification(attorney.email, notificationData);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private getNotificationTitle(type: string): string {
    const titles = {
      approve: 'Document Approved',
      reject: 'Document Needs Revision',
      complete: 'Verification Complete'
    };
    return titles[type as keyof typeof titles] || 'Verification Update';
  }

  private getNotificationMessage(type: string, details?: any): string {
    switch (type) {
      case 'approve':
        return `Your ${details?.documentType} has been approved.`;
      case 'reject':
        return `Your ${details?.documentType} needs revision: ${details?.rejectionReason}`;
      case 'complete':
        return 'Congratulations! Your attorney verification is complete. You can now receive client matches.';
      default:
        return 'Your verification status has been updated.';
    }
  }

  private transformDocument(document: any): VerificationDocument {
    return {
      id: document.id,
      attorneyId: document.attorney_id,
      documentType: document.document_type,
      fileName: document.file_name,
      fileUrl: document.file_url,
      fileHash: document.file_hash,
      uploadedAt: document.uploaded_at,
      verifiedAt: document.verified_at,
      verifiedBy: document.verified_by,
      status: document.status,
      rejectionReason: document.rejection_reason,
      notes: document.notes
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE attorney_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'under_review', 'verified', 'rejected', 'needs_revision')),
  required_documents JSONB NOT NULL,
  submitted_documents JSONB DEFAULT '[]',
  approved_documents JSONB DEFAULT '[]',
  pending_documents JSONB DEFAULT '[]',
  rejected_documents JSONB DEFAULT '[]',
  completion_percentage INTEGER DEFAULT 0,
  estimated_completion_days INTEGER DEFAULT 5,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attorney_verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('bar_certificate', 'law_degree', 'insurance_certificate', 'practice_license', 'identity_document')),
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  additional_info JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision', 'superseded')),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attorney_bar_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  bar_number VARCHAR(50) NOT NULL,
  province VARCHAR(2) NOT NULL,
  verification_result JSONB,
  is_valid BOOLEAN NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attorney_verification_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL,
  attorney_name VARCHAR(255) NOT NULL,
  bar_number VARCHAR(50) NOT NULL,
  province VARCHAR(2) NOT NULL,
  verification_level VARCHAR(20) DEFAULT 'full',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attorney_verifications_attorney_id ON attorney_verifications(attorney_id);
CREATE INDEX idx_attorney_verification_documents_attorney_id ON attorney_verification_documents(attorney_id);
CREATE INDEX idx_attorney_verification_documents_type ON attorney_verification_documents(document_type);
CREATE INDEX idx_attorney_bar_verifications_attorney_id ON attorney_bar_verifications(attorney_id);
CREATE INDEX idx_attorney_bar_verifications_bar_number ON attorney_bar_verifications(bar_number);
CREATE INDEX idx_attorney_verification_certificates_attorney_id ON attorney_verification_certificates(attorney_id);
*/