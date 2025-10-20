import db from '../utils/database';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

interface SharedDocument {
  id: string;
  ownerId: string;
  ownerType: 'user' | 'attorney';
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  encryptionKey: string;
  storageUrl: string;
  downloadUrl?: string;
  description?: string;
  category: 'contract' | 'evidence' | 'correspondence' | 'identification' | 'legal_brief' | 'court_filing' | 'other';
  isPrivate: boolean;
  expiresAt?: Date;
  downloadCount: number;
  maxDownloads?: number;
  password?: string;
  watermarkEnabled: boolean;
  versionNumber: number;
  parentDocumentId?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentPermission {
  id: string;
  documentId: string;
  userId: string;
  userType: 'user' | 'attorney';
  permissionType: 'view' | 'download' | 'edit' | 'share';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
}

interface DocumentShare {
  id: string;
  documentId: string;
  shareToken: string;
  shareUrl: string;
  sharedBy: string;
  shareType: 'public' | 'protected' | 'private';
  expiresAt?: Date;
  maxAccess?: number;
  accessCount: number;
  requiresAuthentication: boolean;
  allowDownload: boolean;
  watermarkText?: string;
  notifyOnAccess: boolean;
  accessLog: any[];
  createdAt: Date;
}

interface DocumentFolder {
  id: string;
  name: string;
  ownerId: string;
  ownerType: 'user' | 'attorney';
  parentFolderId?: string;
  path: string;
  description?: string;
  isShared: boolean;
  sharePermissions: any;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DocumentSharingService {
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 16;
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly STORAGE_BASE_PATH = process.env.DOCUMENT_STORAGE_PATH || '/secure-documents';

  async uploadDocument(
    ownerId: string,
    ownerType: 'user' | 'attorney',
    file: Express.Multer.File,
    options: {
      description?: string;
      category?: string;
      folderId?: string;
      isPrivate?: boolean;
      expiresAt?: Date;
      maxDownloads?: number;
      password?: string;
      watermarkEnabled?: boolean;
    } = {}
  ): Promise<SharedDocument> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate encryption key and IV
      const encryptionKey = crypto.randomBytes(this.KEY_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Encrypt file content
      const encryptedContent = this.encryptFileContent(file.buffer, encryptionKey, iv);

      // Generate file hash for integrity
      const fileHash = crypto.createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Generate secure filename
      const fileExtension = path.extname(file.originalname);
      const secureFileName = `${uuidv4()}${fileExtension}`;
      
      // Store encrypted file
      const storageUrl = await this.storeEncryptedFile(
        encryptedContent,
        secureFileName,
        ownerId,
        ownerType
      );

      // Create document record
      const documentData = {
        id: uuidv4(),
        owner_id: ownerId,
        owner_type: ownerType,
        file_name: secureFileName,
        original_file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        file_hash: fileHash,
        encryption_key: encryptionKey.toString('hex'),
        encryption_iv: iv.toString('hex'),
        storage_url: storageUrl,
        description: options.description,
        category: options.category || 'other',
        folder_id: options.folderId,
        is_private: options.isPrivate !== false, // Default to private
        expires_at: options.expiresAt,
        max_downloads: options.maxDownloads,
        password_hash: options.password ? await this.hashPassword(options.password) : null,
        watermark_enabled: options.watermarkEnabled || false,
        version_number: 1,
        download_count: 0,
        metadata: JSON.stringify({
          uploadIp: 'hidden', // In production, capture from request
          userAgent: 'hidden', // In production, capture from request
          originalSize: file.size,
          encryptionAlgorithm: this.ENCRYPTION_ALGORITHM
        }),
        created_at: new Date(),
        updated_at: new Date()
      };

      const [document] = await db('shared_documents')
        .insert(documentData)
        .returning('*');

      // Update folder document count
      if (options.folderId) {
        await this.updateFolderCount(options.folderId);
      }

      // Create activity log
      await this.logDocumentActivity(document.id, 'uploaded', ownerId, ownerType);

      return this.transformDocument(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async shareDocument(
    documentId: string,
    userId: string,
    userType: 'user' | 'attorney',
    shareOptions: {
      shareType: 'public' | 'protected' | 'private';
      expiresAt?: Date;
      maxAccess?: number;
      requiresAuthentication?: boolean;
      allowDownload?: boolean;
      watermarkText?: string;
      notifyOnAccess?: boolean;
      recipientEmails?: string[];
    }
  ): Promise<DocumentShare> {
    try {
      // Verify document ownership or permissions
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const hasPermission = await this.checkDocumentPermission(documentId, userId, userType, 'share');
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      // Generate share token
      const shareToken = crypto.randomBytes(32).toString('hex');
      const shareUrl = `${process.env.BASE_URL}/share/${shareToken}`;

      // Create share record
      const shareData = {
        id: uuidv4(),
        document_id: documentId,
        share_token: shareToken,
        share_url: shareUrl,
        shared_by: userId,
        share_type: shareOptions.shareType,
        expires_at: shareOptions.expiresAt,
        max_access: shareOptions.maxAccess,
        access_count: 0,
        requires_authentication: shareOptions.requiresAuthentication || false,
        allow_download: shareOptions.allowDownload !== false,
        watermark_text: shareOptions.watermarkText,
        notify_on_access: shareOptions.notifyOnAccess || false,
        access_log: JSON.stringify([]),
        created_at: new Date()
      };

      const [share] = await db('document_shares')
        .insert(shareData)
        .returning('*');

      // Send share notifications to recipients
      if (shareOptions.recipientEmails?.length) {
        await this.sendShareNotifications(
          shareOptions.recipientEmails,
          shareUrl,
          document,
          userId,
          userType
        );
      }

      // Log sharing activity
      await this.logDocumentActivity(documentId, 'shared', userId, userType, {
        shareType: shareOptions.shareType,
        shareToken,
        recipientCount: shareOptions.recipientEmails?.length || 0
      });

      return this.transformShare(share);
    } catch (error) {
      console.error('Error sharing document:', error);
      throw new Error('Failed to share document');
    }
  }

  async downloadDocument(
    documentId: string,
    userId?: string,
    userType?: 'user' | 'attorney',
    shareToken?: string,
    password?: string
  ): Promise<{
    content: Buffer;
    fileName: string;
    mimeType: string;
    watermarked?: boolean;
  }> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check access permissions
      if (shareToken) {
        await this.validateShareAccess(shareToken, documentId);
      } else if (userId && userType) {
        const hasPermission = await this.checkDocumentPermission(documentId, userId, userType, 'download');
        if (!hasPermission) {
          throw new Error('Permission denied');
        }
      } else {
        throw new Error('Authentication required');
      }

      // Check password if required
      if (document.password && password) {
        const isValidPassword = await this.verifyPassword(password, document.password);
        if (!isValidPassword) {
          throw new Error('Invalid password');
        }
      }

      // Check download limits
      if (document.maxDownloads && document.downloadCount >= document.maxDownloads) {
        throw new Error('Download limit exceeded');
      }

      // Check expiration
      if (document.expiresAt && new Date() > document.expiresAt) {
        throw new Error('Document has expired');
      }

      // Decrypt file content
      const encryptedContent = await this.retrieveEncryptedFile(document.storageUrl);
      const decryptedContent = this.decryptFileContent(
        encryptedContent,
        Buffer.from(document.encryptionKey, 'hex'),
        Buffer.from(document.metadata.encryptionIv || '', 'hex')
      );

      // Apply watermark if enabled
      let finalContent = decryptedContent;
      let watermarked = false;

      if (document.watermarkEnabled) {
        finalContent = await this.applyWatermark(
          decryptedContent,
          document.mimeType,
          `Downloaded by ${userId || 'Anonymous'} on ${new Date().toISOString()}`
        );
        watermarked = true;
      }

      // Update download count
      await db('shared_documents')
        .where('id', documentId)
        .increment('download_count', 1)
        .update({ last_downloaded_at: new Date() });

      // Update share access count if applicable
      if (shareToken) {
        await this.updateShareAccess(shareToken);
      }

      // Log download activity
      await this.logDocumentActivity(documentId, 'downloaded', userId || 'anonymous', userType || 'anonymous', {
        shareToken,
        watermarked
      });

      return {
        content: finalContent,
        fileName: document.originalFileName,
        mimeType: document.mimeType,
        watermarked
      };
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  async getUserDocuments(
    userId: string,
    userType: 'user' | 'attorney',
    folderId?: string,
    category?: string,
    page = 1,
    limit = 20
  ): Promise<{ documents: SharedDocument[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let query = db('shared_documents')
        .where('owner_id', userId)
        .where('owner_type', userType);

      if (folderId) {
        query = query.where('folder_id', folderId);
      } else {
        query = query.whereNull('folder_id'); // Root level documents
      }

      if (category) {
        query = query.where('category', category);
      }

      const documents = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('shared_documents')
        .where('owner_id', userId)
        .where('owner_type', userType)
        .modify((builder) => {
          if (folderId) {builder.where('folder_id', folderId);}
          else {builder.whereNull('folder_id');}
          if (category) {builder.where('category', category);}
        })
        .count('* as count')
        .first();

      return {
        documents: documents.map(doc => this.transformDocument(doc)),
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw new Error('Failed to get user documents');
    }
  }

  async createFolder(
    ownerId: string,
    ownerType: 'user' | 'attorney',
    name: string,
    parentFolderId?: string,
    description?: string
  ): Promise<DocumentFolder> {
    try {
      // Generate folder path
      let folderPath = name;
      if (parentFolderId) {
        const parentFolder = await db('document_folders')
          .where('id', parentFolderId)
          .first();
        
        if (parentFolder) {
          folderPath = `${parentFolder.path}/${name}`;
        }
      }

      const folderData = {
        id: uuidv4(),
        name,
        owner_id: ownerId,
        owner_type: ownerType,
        parent_folder_id: parentFolderId,
        path: folderPath,
        description,
        is_shared: false,
        share_permissions: JSON.stringify({}),
        document_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [folder] = await db('document_folders')
        .insert(folderData)
        .returning('*');

      return this.transformFolder(folder);
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  async grantDocumentPermission(
    documentId: string,
    granterId: string,
    granterType: 'user' | 'attorney',
    recipientId: string,
    recipientType: 'user' | 'attorney',
    permissionType: 'view' | 'download' | 'edit' | 'share',
    expiresAt?: Date
  ): Promise<DocumentPermission> {
    try {
      // Verify granter has permission to grant
      const hasPermission = await this.checkDocumentPermission(documentId, granterId, granterType, 'share');
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      // Check if permission already exists
      const existingPermission = await db('document_permissions')
        .where('document_id', documentId)
        .where('user_id', recipientId)
        .where('user_type', recipientType)
        .where('permission_type', permissionType)
        .first();

      if (existingPermission) {
        throw new Error('Permission already granted');
      }

      const permissionData = {
        id: uuidv4(),
        document_id: documentId,
        user_id: recipientId,
        user_type: recipientType,
        permission_type: permissionType,
        granted_by: granterId,
        granted_at: new Date(),
        expires_at: expiresAt,
        access_count: 0,
        created_at: new Date()
      };

      const [permission] = await db('document_permissions')
        .insert(permissionData)
        .returning('*');

      // Log permission grant
      await this.logDocumentActivity(documentId, 'permission_granted', granterId, granterType, {
        recipientId,
        recipientType,
        permissionType
      });

      return this.transformPermission(permission);
    } catch (error) {
      console.error('Error granting document permission:', error);
      throw new Error('Failed to grant document permission');
    }
  }

  async searchDocuments(
    userId: string,
    userType: 'user' | 'attorney',
    query: string,
    filters: {
      category?: string;
      dateFrom?: Date;
      dateTo?: Date;
      fileType?: string;
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ documents: SharedDocument[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let searchQuery = db('shared_documents')
        .where(function() {
          this.where('owner_id', userId).where('owner_type', userType)
            .orWhereExists(function() {
              this.select('*')
                .from('document_permissions')
                .whereRaw('document_permissions.document_id = shared_documents.id')
                .where('document_permissions.user_id', userId)
                .where('document_permissions.user_type', userType);
            });
        })
        .where(function() {
          this.where('original_file_name', 'ilike', `%${query}%`)
            .orWhere('description', 'ilike', `%${query}%`);
        });

      // Apply filters
      if (filters.category) {
        searchQuery = searchQuery.where('category', filters.category);
      }

      if (filters.dateFrom) {
        searchQuery = searchQuery.where('created_at', '>=', filters.dateFrom);
      }

      if (filters.dateTo) {
        searchQuery = searchQuery.where('created_at', '<=', filters.dateTo);
      }

      if (filters.fileType) {
        searchQuery = searchQuery.where('mime_type', 'like', `${filters.fileType}%`);
      }

      const documents = await searchQuery
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await searchQuery
        .clone()
        .count('* as count')
        .first();

      return {
        documents: documents.map(doc => this.transformDocument(doc)),
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check for malicious file types
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error('File type not allowed for security reasons');
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('File type not supported');
    }
  }

  private encryptFileContent(content: Buffer, key: Buffer, iv: Buffer): Buffer {
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    cipher.setAutoPadding(true);

    const encrypted = Buffer.concat([
      cipher.update(content),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted content
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decryptFileContent(encryptedContent: Buffer, key: Buffer, iv: Buffer): Buffer {
    try {
      // Extract components
      const authTag = encryptedContent.slice(this.IV_LENGTH, this.IV_LENGTH + 16);
      const encrypted = encryptedContent.slice(this.IV_LENGTH + 16);

      const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
      decipher.setAuthTag(authTag);
      decipher.setAutoPadding(true);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt file content');
    }
  }

  private async storeEncryptedFile(
    encryptedContent: Buffer,
    fileName: string,
    ownerId: string,
    ownerType: string
  ): Promise<string> {
    try {
      const storagePath = path.join(this.STORAGE_BASE_PATH, ownerType, ownerId);
      const fullPath = path.join(storagePath, fileName);

      // Ensure directory exists
      await fs.mkdir(storagePath, { recursive: true });

      // Write encrypted file
      await fs.writeFile(fullPath, encryptedContent);

      return fullPath;
    } catch (error) {
      console.error('Error storing encrypted file:', error);
      throw new Error('Failed to store encrypted file');
    }
  }

  private async retrieveEncryptedFile(storageUrl: string): Promise<Buffer> {
    try {
      return await fs.readFile(storageUrl);
    } catch (error) {
      console.error('Error retrieving encrypted file:', error);
      throw new Error('Failed to retrieve encrypted file');
    }
  }

  private async applyWatermark(
    content: Buffer,
    mimeType: string,
    watermarkText: string
  ): Promise<Buffer> {
    // Mock implementation - in production, use libraries like sharp for images, PDFtk for PDFs
    // For now, return original content
    return content;
  }

  private async hashPassword(password: string): Promise<string> {
    return crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashVerify = crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
  }

  private async getDocument(documentId: string): Promise<any> {
    return await db('shared_documents')
      .where('id', documentId)
      .first();
  }

  private async checkDocumentPermission(
    documentId: string,
    userId: string,
    userType: 'user' | 'attorney',
    permissionType: string
  ): Promise<boolean> {
    try {
      // Check if user is owner
      const document = await db('shared_documents')
        .where('id', documentId)
        .where('owner_id', userId)
        .where('owner_type', userType)
        .first();

      if (document) {return true;}

      // Check explicit permissions
      const permission = await db('document_permissions')
        .where('document_id', documentId)
        .where('user_id', userId)
        .where('user_type', userType)
        .where('permission_type', permissionType)
        .where(function() {
          this.whereNull('expires_at')
            .orWhere('expires_at', '>', new Date());
        })
        .first();

      return !!permission;
    } catch (error) {
      console.error('Error checking document permission:', error);
      return false;
    }
  }

  private async validateShareAccess(shareToken: string, documentId: string): Promise<void> {
    const share = await db('document_shares')
      .where('share_token', shareToken)
      .where('document_id', documentId)
      .first();

    if (!share) {
      throw new Error('Invalid share link');
    }

    if (share.expires_at && new Date() > share.expires_at) {
      throw new Error('Share link has expired');
    }

    if (share.max_access && share.access_count >= share.max_access) {
      throw new Error('Share link access limit exceeded');
    }
  }

  private async updateShareAccess(shareToken: string): Promise<void> {
    await db('document_shares')
      .where('share_token', shareToken)
      .increment('access_count', 1)
      .update({ last_accessed_at: new Date() });
  }

  private async updateFolderCount(folderId: string): Promise<void> {
    const count = await db('shared_documents')
      .where('folder_id', folderId)
      .count('* as count')
      .first();

    await db('document_folders')
      .where('id', folderId)
      .update({ 
        document_count: parseInt(count?.count || '0'),
        updated_at: new Date()
      });
  }

  private async logDocumentActivity(
    documentId: string,
    action: string,
    userId: string,
    userType: string,
    metadata?: any
  ): Promise<void> {
    try {
      await db('document_activity_logs').insert({
        id: uuidv4(),
        document_id: documentId,
        user_id: userId,
        user_type: userType,
        action,
        metadata: JSON.stringify(metadata || {}),
        ip_address: 'hidden', // In production, capture from request
        user_agent: 'hidden', // In production, capture from request
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error logging document activity:', error);
    }
  }

  private async sendShareNotifications(
    emails: string[],
    shareUrl: string,
    document: any,
    sharedBy: string,
    sharedByType: string
  ): Promise<void> {
    // Mock implementation - in production, send emails via SendGrid, AWS SES, etc.
    console.log(`Sending share notifications to ${emails.length} recipients for document ${document.id}`);
  }

  private transformDocument(document: any): SharedDocument {
    return {
      id: document.id,
      ownerId: document.owner_id,
      ownerType: document.owner_type,
      fileName: document.file_name,
      originalFileName: document.original_file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      fileHash: document.file_hash,
      encryptionKey: document.encryption_key,
      storageUrl: document.storage_url,
      downloadUrl: document.download_url,
      description: document.description,
      category: document.category,
      isPrivate: document.is_private,
      expiresAt: document.expires_at,
      downloadCount: document.download_count,
      maxDownloads: document.max_downloads,
      password: document.password_hash,
      watermarkEnabled: document.watermark_enabled,
      versionNumber: document.version_number,
      parentDocumentId: document.parent_document_id,
      metadata: JSON.parse(document.metadata || '{}'),
      createdAt: document.created_at,
      updatedAt: document.updated_at
    };
  }

  private transformShare(share: any): DocumentShare {
    return {
      id: share.id,
      documentId: share.document_id,
      shareToken: share.share_token,
      shareUrl: share.share_url,
      sharedBy: share.shared_by,
      shareType: share.share_type,
      expiresAt: share.expires_at,
      maxAccess: share.max_access,
      accessCount: share.access_count,
      requiresAuthentication: share.requires_authentication,
      allowDownload: share.allow_download,
      watermarkText: share.watermark_text,
      notifyOnAccess: share.notify_on_access,
      accessLog: JSON.parse(share.access_log || '[]'),
      createdAt: share.created_at
    };
  }

  private transformPermission(permission: any): DocumentPermission {
    return {
      id: permission.id,
      documentId: permission.document_id,
      userId: permission.user_id,
      userType: permission.user_type,
      permissionType: permission.permission_type,
      grantedBy: permission.granted_by,
      grantedAt: permission.granted_at,
      expiresAt: permission.expires_at,
      accessCount: permission.access_count,
      lastAccessedAt: permission.last_accessed_at
    };
  }

  private transformFolder(folder: any): DocumentFolder {
    return {
      id: folder.id,
      name: folder.name,
      ownerId: folder.owner_id,
      ownerType: folder.owner_type,
      parentFolderId: folder.parent_folder_id,
      path: folder.path,
      description: folder.description,
      isShared: folder.is_shared,
      sharePermissions: JSON.parse(folder.share_permissions || '{}'),
      documentCount: folder.document_count,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE shared_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('user', 'attorney')),
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  encryption_key VARCHAR(64) NOT NULL,
  encryption_iv VARCHAR(32) NOT NULL,
  storage_url VARCHAR(500) NOT NULL,
  download_url VARCHAR(500),
  description TEXT,
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('contract', 'evidence', 'correspondence', 'identification', 'legal_brief', 'court_filing', 'other')),
  folder_id UUID REFERENCES document_folders(id),
  is_private BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  password_hash VARCHAR(128),
  watermark_enabled BOOLEAN DEFAULT FALSE,
  version_number INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES shared_documents(id),
  metadata JSONB DEFAULT '{}',
  last_downloaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'attorney')),
  permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('view', 'download', 'edit', 'share')),
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  share_url VARCHAR(500) NOT NULL,
  shared_by UUID NOT NULL,
  share_type VARCHAR(20) DEFAULT 'private' CHECK (share_type IN ('public', 'protected', 'private')),
  expires_at TIMESTAMP,
  max_access INTEGER,
  access_count INTEGER DEFAULT 0,
  requires_authentication BOOLEAN DEFAULT FALSE,
  allow_download BOOLEAN DEFAULT TRUE,
  watermark_text VARCHAR(255),
  notify_on_access BOOLEAN DEFAULT FALSE,
  access_log JSONB DEFAULT '[]',
  last_accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('user', 'attorney')),
  parent_folder_id UUID REFERENCES document_folders(id),
  path VARCHAR(1000) NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  share_permissions JSONB DEFAULT '{}',
  document_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES shared_documents(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  user_type VARCHAR(20),
  action VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_documents_owner ON shared_documents(owner_id, owner_type);
CREATE INDEX idx_shared_documents_folder ON shared_documents(folder_id);
CREATE INDEX idx_shared_documents_category ON shared_documents(category);
CREATE INDEX idx_shared_documents_hash ON shared_documents(file_hash);
CREATE INDEX idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON document_permissions(user_id, user_type);
CREATE INDEX idx_document_shares_token ON document_shares(share_token);
CREATE INDEX idx_document_folders_owner ON document_folders(owner_id, owner_type);
CREATE INDEX idx_document_folders_parent ON document_folders(parent_folder_id);
CREATE INDEX idx_document_activity_logs_document ON document_activity_logs(document_id);
*/