import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { MessagingService } from '../services/messaging.service';
import { NotificationService } from '../services/notification.service';

interface SocketUser {
  userId: string;
  userType: 'user' | 'attorney';
  socketId: string;
}

export class ChatWebSocketServer {
  private io: Server;
  private messagingService: MessagingService;
  private notificationService: NotificationService;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.messagingService = new MessagingService();
    this.notificationService = new NotificationService();

    this.initialize();
  }

  private initialize() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.userId = decoded.userId;
        socket.data.userType = decoded.userType;
        
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.data.userId} connected`);
      
      // Store connected user
      this.connectedUsers.set(socket.data.userId, {
        userId: socket.data.userId,
        userType: socket.data.userType,
        socketId: socket.id
      });

      // Join user to their rooms
      socket.join(`user:${socket.data.userId}`);

      // Handle joining conversation rooms
      socket.on('join:conversation', async (conversationId: string) => {
        try {
          // Verify user has access to this conversation
          const hasAccess = await this.messagingService.userHasAccessToConversation(
            socket.data.userId,
            conversationId
          );

          if (hasAccess) {
            socket.join(`conversation:${conversationId}`);
            socket.emit('joined:conversation', { conversationId });
          } else {
            socket.emit('error', { message: 'Access denied to conversation' });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle sending messages
      socket.on('send:message', async (data: {
        conversationId: string;
        content: string;
        messageType: 'text' | 'file' | 'voice';
        fileData?: {
          url: string;
          name: string;
          size: number;
        };
      }) => {
        try {
          // Create message
          const message = await this.messagingService.sendMessage({
            conversationId: data.conversationId,
            senderId: socket.data.userId,
            senderType: socket.data.userType,
            content: data.content,
            messageType: data.messageType,
            fileUrl: data.fileData?.url,
            fileName: data.fileData?.name,
            fileSize: data.fileData?.size
          });

          // Emit to all users in conversation
          this.io.to(`conversation:${data.conversationId}`).emit('new:message', message);

          // Send push notification to offline recipient
          const conversation = await this.messagingService.getConversation(data.conversationId);
          const recipientId = socket.data.userType === 'user' 
            ? conversation.attorneyId 
            : conversation.userId;

          if (!this.connectedUsers.has(recipientId)) {
            await this.notificationService.sendPushNotification({
              userId: recipientId,
              title: 'New Message',
              body: data.messageType === 'text' ? data.content : `Sent a ${data.messageType}`,
              data: {
                conversationId: data.conversationId,
                messageId: message.id
              }
            });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing:start', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId: socket.data.userId,
          userType: socket.data.userType
        });
      });

      socket.on('typing:stop', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user:stopped:typing', {
          userId: socket.data.userId
        });
      });

      // Handle message read receipts
      socket.on('mark:read', async (messageIds: string[]) => {
        try {
          await this.messagingService.markMessagesAsRead(messageIds, socket.data.userId);
          
          // Notify sender that messages were read
          messageIds.forEach(async (messageId) => {
            const message = await this.messagingService.getMessage(messageId);
            if (message) {
              this.io.to(`user:${message.senderId}`).emit('message:read', {
                messageId,
                readBy: socket.data.userId
              });
            }
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle message deletion
      socket.on('delete:message', async (messageId: string) => {
        try {
          const message = await this.messagingService.getMessage(messageId);
          
          if (message && message.senderId === socket.data.userId) {
            await this.messagingService.deleteMessage(messageId);
            
            this.io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
              messageId,
              conversationId: message.conversationId
            });
          } else {
            socket.emit('error', { message: 'Unauthorized to delete this message' });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // Handle video call initiation
      socket.on('call:initiate', async (data: {
        conversationId: string;
        callType: 'audio' | 'video';
      }) => {
        try {
          const conversation = await this.messagingService.getConversation(data.conversationId);
          const recipientId = socket.data.userType === 'user' 
            ? conversation.attorneyId 
            : conversation.userId;

          // Notify recipient of incoming call
          this.io.to(`user:${recipientId}`).emit('call:incoming', {
            callerId: socket.data.userId,
            callerName: socket.data.userName,
            conversationId: data.conversationId,
            callType: data.callType
          });

          // Send push notification if recipient is offline
          if (!this.connectedUsers.has(recipientId)) {
            await this.notificationService.sendPushNotification({
              userId: recipientId,
              title: 'Incoming Call',
              body: `${socket.data.userName} is calling you`,
              data: {
                conversationId: data.conversationId,
                callType: data.callType
              }
            });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to initiate call' });
        }
      });

      // Handle call response
      socket.on('call:answer', (data: {
        conversationId: string;
        answer: 'accept' | 'reject';
        sdpAnswer?: any;
      }) => {
        const conversation = this.io.sockets.adapter.rooms.get(`conversation:${data.conversationId}`);
        if (conversation) {
          socket.to(`conversation:${data.conversationId}`).emit('call:answered', {
            answer: data.answer,
            sdpAnswer: data.sdpAnswer
          });
        }
      });

      // Handle WebRTC signaling
      socket.on('webrtc:offer', (data: {
        conversationId: string;
        offer: any;
      }) => {
        socket.to(`conversation:${data.conversationId}`).emit('webrtc:offer', data.offer);
      });

      socket.on('webrtc:answer', (data: {
        conversationId: string;
        answer: any;
      }) => {
        socket.to(`conversation:${data.conversationId}`).emit('webrtc:answer', data.answer);
      });

      socket.on('webrtc:ice-candidate', (data: {
        conversationId: string;
        candidate: any;
      }) => {
        socket.to(`conversation:${data.conversationId}`).emit('webrtc:ice-candidate', data.candidate);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.data.userId} disconnected`);
        this.connectedUsers.delete(socket.data.userId);
        
        // Notify all conversations that user is offline
        socket.rooms.forEach(room => {
          if (room.startsWith('conversation:')) {
            socket.to(room).emit('user:offline', {
              userId: socket.data.userId
            });
          }
        });
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }
}