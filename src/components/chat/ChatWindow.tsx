import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { FiSend, FiPaperclip, FiPhone, FiVideo, FiMoreVertical, FiCheck, FiCheckCircle } from 'react-icons/fi';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'attorney';
  recipientId: string;
  content: string;
  messageType: 'text' | 'file' | 'voice' | 'system';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatWindowProps {
  conversationId: string;
  recipientName: string;
  recipientAvatar?: string;
  recipientId: string;
  recipientType: 'user' | 'attorney';
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  recipientName,
  recipientAvatar,
  recipientId,
  recipientType
}) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useEffect(() => {
    if (!token) {return;}

    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
      auth: {
        token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Join conversation room
      newSocket.emit('join:conversation', conversationId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('new:message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      // Mark message as read if it's from recipient
      if (message.senderId === recipientId) {
        newSocket.emit('mark:read', [message.id]);
      }
    });

    newSocket.on('user:typing', (data: { userId: string }) => {
      if (data.userId === recipientId) {
        setRecipientTyping(true);
      }
    });

    newSocket.on('user:stopped:typing', (data: { userId: string }) => {
      if (data.userId === recipientId) {
        setRecipientTyping(false);
      }
    });

    newSocket.on('message:read', (data: { messageId: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    newSocket.on('message:deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Chat error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, conversationId, recipientId]);

  // Load conversation history
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) {return;}
    if (!socket || !isConnected) {return;}

    let fileData = undefined;
    
    // Handle file upload if present
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          fileData = {
            url: data.url,
            name: selectedFile.name,
            size: selectedFile.size
          };
        }
      } catch (error) {
        console.error('File upload failed:', error);
        return;
      }
    }

    // Send message via socket
    socket.emit('send:message', {
      conversationId,
      content: inputMessage || `Sent a file: ${selectedFile?.name}`,
      messageType: selectedFile ? 'file' : 'text',
      fileData
    });

    // Clear input
    setInputMessage('');
    setSelectedFile(null);
    
    // Stop typing indicator
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!socket || !isConnected) {return;}
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', conversationId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (!socket || !isConnected || !isTyping) {return;}
    
    setIsTyping(false);
    socket.emit('typing:stop', conversationId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const initiateCall = (callType: 'audio' | 'video') => {
    if (!socket || !isConnected) {return;}
    
    socket.emit('call:initiate', {
      conversationId,
      callType
    });
  };

  const deleteMessage = (messageId: string) => {
    if (!socket || !isConnected) {return;}
    
    if (confirm('Are you sure you want to delete this message?')) {
      socket.emit('delete:message', messageId);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isOwn = message.senderId === user?.id;
    
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          <div className={`px-4 py-2 rounded-lg ${
            isOwn 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            {message.messageType === 'text' ? (
              <p className="text-sm">{message.content}</p>
            ) : message.messageType === 'file' ? (
              <div className="flex items-center space-x-2">
                <FiPaperclip className="w-4 h-4" />
                <a 
                  href={message.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline text-sm"
                >
                  {message.fileName}
                </a>
              </div>
            ) : null}
            
            <div className={`flex items-center justify-end mt-1 space-x-1 ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span className="text-xs">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isOwn && (
                message.isRead ? (
                  <FiCheckCircle className="w-3 h-3" />
                ) : (
                  <FiCheck className="w-3 h-3" />
                )
              )}
            </div>
          </div>
          
          {isOwn && (
            <button
              onClick={() => deleteMessage(message.id)}
              className="text-xs text-gray-500 hover:text-red-500 mt-1"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          {recipientAvatar ? (
            <img 
              src={recipientAvatar} 
              alt={recipientName}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-lg font-semibold">
                {recipientName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold">{recipientName}</h3>
            <p className="text-xs text-blue-100">
              {recipientTyping ? 'Typing...' : isConnected ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => initiateCall('audio')}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            title="Voice Call"
          >
            <FiPhone className="w-5 h-5" />
          </button>
          <button
            onClick={() => initiateCall('video')}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            title="Video Call"
          >
            <FiVideo className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            title="More Options"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {recipientTyping && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">{recipientName} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-6 py-2 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiPaperclip className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition"
            title="Attach File"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || (!inputMessage.trim() && !selectedFile)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Send Message"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Connection lost. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};