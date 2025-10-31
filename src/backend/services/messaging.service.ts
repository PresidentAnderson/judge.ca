import db from '../utils/database';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'attorney';
  recipientId: string;
  recipientType: 'user' | 'attorney';
  content: string;
  encryptedContent: string;
  messageType: 'text' | 'file' | 'voice' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  isDeleted: boolean;
  editedAt?: Date;
  replyToId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: string;
  userId: string;
  attorneyId: string;
  matchId?: string;
  title: string;
  status: 'active' | 'archived' | 'blocked';
  lastMessageAt: Date;
  encryptionKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingService {
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;

  async userHasAccessToConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      const conversation = await db('conversations')
        .where({ id: conversationId })
        .andWhere(function() {
          this.where({ user_id: userId }).orWhere({ attorney_id: userId });
        })
        .first();
      
      return !!conversation;
    } catch (error) {
      console.error('Error checking conversation access:', error);
      return false;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const conversation = await db('conversations')
      .where({ id: conversationId })
      .first();
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    return {
      id: conversation.id,
      userId: conversation.user_id,
      attorneyId: conversation.attorney_id,
      matchId: conversation.match_id,
      title: conversation.title,
      status: conversation.status,
      lastMessageAt: conversation.last_message_at,
      encryptionKey: conversation.encryption_key,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    };
  }

  async getMessage(messageId: string): Promise<Message | null> {
    try {
      const message = await db('messages')
        .where({ id: messageId })
        .first();
      
      if (!message) {return null;}
      
      return {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        senderType: message.sender_type,
        recipientId: message.recipient_id,
        recipientType: message.recipient_type,
        content: message.content,
        encryptedContent: message.encrypted_content,
        messageType: message.message_type,
        fileUrl: message.file_url,
        fileName: message.file_name,
        fileSize: message.file_size,
        isRead: message.is_read,
        isDeleted: message.is_deleted,
        editedAt: message.edited_at,
        replyToId: message.reply_to_id,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      };
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }


  async createConversation(userId: string, attorneyId: string, matchId?: string): Promise<Conversation> {
    try {
      // Check if conversation already exists
      const existing = await db('conversations')
        .where({ user_id: userId, attorney_id: attorneyId })
        .first();

      if (existing) {
        return this.transformConversation(existing);
      }

      // Generate encryption key for this conversation
      const encryptionKey = crypto.randomBytes(this.KEY_LENGTH).toString('hex');
      
      const conversationData = {
        id: uuidv4(),
        user_id: userId,
        attorney_id: attorneyId,
        match_id: matchId,
        title: 'Consultation juridique',
        status: 'active',
        encryption_key: encryptionKey,
        last_message_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      const [conversation] = await db('conversations')
        .insert(conversationData)
        .returning('*');

      // Create welcome message
      await this.sendSystemMessage(
        conversation.id,
        'Conversation sécurisée établie. Tous les messages sont chiffrés de bout en bout.'
      );

      return this.transformConversation(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'user' | 'attorney',
    content: string,
    messageType: 'text' | 'file' | 'voice' = 'text',
    fileData?: { url: string; name: string; size: number }
  ): Promise<Message> {
    try {
      // Get conversation and encryption key
      const conversation = await db('conversations')
        .where('id', conversationId)
        .first();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Verify sender is part of conversation
      const isAuthorized = (senderType === 'user' && conversation.user_id === senderId) ||
                          (senderType === 'attorney' && conversation.attorney_id === senderId);

      if (!isAuthorized) {
        throw new Error('Unauthorized to send message');
      }

      // Encrypt message content
      const encryptedContent = this.encryptMessage(content, conversation.encryption_key);
      
      // Determine recipient
      const recipientId = senderType === 'user' ? conversation.attorney_id : conversation.user_id;
      const recipientType = senderType === 'user' ? 'attorney' : 'user';

      const messageData = {
        id: uuidv4(),
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        recipient_id: recipientId,
        recipient_type: recipientType,
        content, // Store plaintext for search (in production, use searchable encryption)
        encrypted_content: encryptedContent,
        message_type: messageType,
        file_url: fileData?.url,
        file_name: fileData?.name,
        file_size: fileData?.size,
        is_read: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [message] = await db('messages')
        .insert(messageData)
        .returning('*');

      // Update conversation last message timestamp
      await db('conversations')
        .where('id', conversationId)
        .update({
          last_message_at: new Date(),
          updated_at: new Date()
        });

      // Send real-time notification (implement with WebSocket/Socket.io)
      await this.sendNotification(recipientId, recipientType, {
        type: 'new_message',
        conversationId,
        senderName: await this.getSenderName(senderId, senderType),
        preview: content.substring(0, 100)
      });

      return this.transformMessage(message, conversation.encryption_key);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    userType: 'user' | 'attorney',
    page = 1,
    limit = 50
  ): Promise<{ messages: Message[]; total: number }> {
    try {
      // Verify user has access to conversation
      const conversation = await db('conversations')
        .where('id', conversationId)
        .first();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const hasAccess = (userType === 'user' && conversation.user_id === userId) ||
                       (userType === 'attorney' && conversation.attorney_id === userId);

      if (!hasAccess) {
        throw new Error('Unauthorized access to conversation');
      }

      // Get messages with pagination
      const offset = (page - 1) * limit;
      
      const messages = await db('messages')
        .where('conversation_id', conversationId)
        .where('is_deleted', false)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('messages')
        .where('conversation_id', conversationId)
        .where('is_deleted', false)
        .count('* as count')
        .first();

      // Decrypt messages
      const decryptedMessages = messages.map(msg => 
        this.transformMessage(msg, conversation.encryption_key)
      ).reverse();

      // Mark unread messages as read for the requesting user
      const unreadMessageIds = messages
        .filter(msg => msg.recipient_id === userId && !msg.is_read)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await db('messages')
          .whereIn('id', unreadMessageIds)
          .update({
            is_read: true,
            updated_at: new Date()
          });
      }

      return {
        messages: decryptedMessages,
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to retrieve messages');
    }
  }

  async getUserConversations(
    userId: string,
    userType: 'user' | 'attorney',
    page = 1,
    limit = 20
  ): Promise<{ conversations: any[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      const userColumn = userType === 'user' ? 'user_id' : 'attorney_id';
      
      const conversations = await db('conversations')
        .where(userColumn, userId)
        .where('status', '!=', 'archived')
        .orderBy('last_message_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('conversations')
        .where(userColumn, userId)
        .where('status', '!=', 'archived')
        .count('* as count')
        .first();

      // Get conversation details with last message and unread count
      const conversationDetails = await Promise.all(
        conversations.map(async (conv) => {
          const lastMessage = await db('messages')
            .where('conversation_id', conv.id)
            .where('is_deleted', false)
            .orderBy('created_at', 'desc')
            .first();

          const unreadCount = await db('messages')
            .where('conversation_id', conv.id)
            .where('recipient_id', userId)
            .where('is_read', false)
            .where('is_deleted', false)
            .count('* as count')
            .first();

          // Get other participant details
          const otherUserId = userType === 'user' ? conv.attorney_id : conv.user_id;
          const otherParticipant = await this.getParticipantDetails(otherUserId, userType === 'user' ? 'attorney' : 'user');

          return {
            ...this.transformConversation(conv),
            lastMessage: lastMessage ? this.transformMessage(lastMessage, conv.encryption_key) : null,
            unreadCount: parseInt(unreadCount?.count || '0'),
            participant: otherParticipant
          };
        })
      );

      return {
        conversations: conversationDetails,
        total: parseInt(total?.count || '0')
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw new Error('Failed to retrieve conversations');
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await db('messages')
        .where('conversation_id', conversationId)
        .where('recipient_id', userId)
        .where('is_read', false)
        .update({
          is_read: true,
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const message = await db('messages')
        .where('id', messageId)
        .where('sender_id', userId)
        .first();

      if (!message) {
        throw new Error('Message not found or unauthorized');
      }

      await db('messages')
        .where('id', messageId)
        .update({
          is_deleted: true,
          updated_at: new Date()
        });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async searchMessages(
    userId: string,
    userType: 'user' | 'attorney',
    query: string,
    conversationId?: string
  ): Promise<Message[]> {
    try {
      let searchQuery = db('messages')
        .join('conversations', 'messages.conversation_id', 'conversations.id')
        .where('messages.is_deleted', false)
        .where('messages.content', 'ilike', `%${query}%`);

      // Filter by user's conversations
      if (userType === 'user') {
        searchQuery = searchQuery.where('conversations.user_id', userId);
      } else {
        searchQuery = searchQuery.where('conversations.attorney_id', userId);
      }

      // Filter by specific conversation if provided
      if (conversationId) {
        searchQuery = searchQuery.where('messages.conversation_id', conversationId);
      }

      const messages = await searchQuery
        .select('messages.*', 'conversations.encryption_key')
        .orderBy('messages.created_at', 'desc')
        .limit(50);

      return messages.map(msg => this.transformMessage(msg, msg.encryption_key));
    } catch (error) {
      console.error('Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  private async sendSystemMessage(conversationId: string, content: string): Promise<void> {
    const messageData = {
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: 'system',
      sender_type: 'system',
      recipient_id: 'system',
      recipient_type: 'system',
      content,
      encrypted_content: content, // System messages aren't encrypted
      message_type: 'system',
      is_read: true,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('messages').insert(messageData);
  }

  private encryptMessage(content: string, key: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
      cipher.setAutoPadding(true);

      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      
      return `${iv.toString('hex') }:${ authTag.toString('hex') }:${ encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return content; // Fallback to plaintext in case of error
    }
  }

  private decryptMessage(encryptedContent: string, key: string): string {
    try {
      const parts = encryptedContent.split(':');
      if (parts.length !== 3) {return encryptedContent;} // Not encrypted format

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
      decipher.setAuthTag(authTag);
      decipher.setAutoPadding(true);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedContent; // Fallback to encrypted content
    }
  }

  private async getSenderName(senderId: string, senderType: 'user' | 'attorney'): Promise<string> {
    try {
      if (senderType === 'user') {
        const user = await db('users').where('id', senderId).first();
        return user ? `${user.first_name} ${user.last_name}` : 'Utilisateur';
      } else {
        const attorney = await db('attorneys').where('id', senderId).first();
        return attorney ? `Me ${attorney.first_name} ${attorney.last_name}` : 'Avocat';
      }
    } catch (error) {
      return senderType === 'user' ? 'Utilisateur' : 'Avocat';
    }
  }

  private async getParticipantDetails(participantId: string, participantType: 'user' | 'attorney') {
    try {
      if (participantType === 'user') {
        const user = await db('users').where('id', participantId).first();
        return user ? {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          type: 'user'
        } : null;
      } else {
        const attorney = await db('attorneys').where('id', participantId).first();
        return attorney ? {
          id: attorney.id,
          name: `Me ${attorney.first_name} ${attorney.last_name}`,
          email: attorney.email,
          firmName: attorney.firm_name,
          profilePhoto: attorney.profile_photo_url,
          type: 'attorney'
        } : null;
      }
    } catch (error) {
      return null;
    }
  }

  private async sendNotification(
    recipientId: string,
    recipientType: 'user' | 'attorney',
    notificationData: any
  ): Promise<void> {
    // Implement real-time notification (WebSocket, push notifications, email)
    // For now, store in notifications table
    try {
      const notificationPayload = {
        id: uuidv4(),
        [recipientType === 'user' ? 'user_id' : 'attorney_id']: recipientId,
        type: notificationData.type,
        title: 'Nouveau message',
        message: `${notificationData.senderName}: ${notificationData.preview}`,
        data: JSON.stringify(notificationData),
        is_read: false,
        created_at: new Date()
      };

      await db('notifications').insert(notificationPayload);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private transformConversation(conversation: any): Conversation {
    return {
      id: conversation.id,
      userId: conversation.user_id,
      attorneyId: conversation.attorney_id,
      matchId: conversation.match_id,
      title: conversation.title,
      status: conversation.status,
      lastMessageAt: conversation.last_message_at,
      encryptionKey: conversation.encryption_key,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    };
  }

  private transformMessage(message: any, encryptionKey?: string): Message {
    const decryptedContent = encryptionKey && message.encrypted_content
      ? this.decryptMessage(message.encrypted_content, encryptionKey)
      : message.content;

    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      recipientId: message.recipient_id,
      recipientType: message.recipient_type,
      content: decryptedContent,
      encryptedContent: message.encrypted_content,
      messageType: message.message_type,
      fileUrl: message.file_url,
      fileName: message.file_name,
      fileSize: message.file_size,
      isRead: message.is_read,
      isDeleted: message.is_deleted,
      editedAt: message.edited_at,
      replyToId: message.reply_to_id,
      createdAt: message.created_at,
      updatedAt: message.updated_at
    };
  }
}

// Database schema additions needed:
/*
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  encryption_key VARCHAR(255) NOT NULL,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attorney_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'attorney', 'system')),
  recipient_id VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'attorney', 'system')),
  content TEXT,
  encrypted_content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'voice', 'system')),
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  reply_to_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_attorney_id ON conversations(attorney_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_content ON messages USING gin(to_tsvector('french', content));
*/