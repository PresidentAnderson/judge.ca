// Real-Time Communication System for PVT Ecosystem
// WebSocket connections, live chat, notifications, and collaboration features

class RealTimeCommunication {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageQueue = [];
        this.subscriptions = new Map();
        this.eventHandlers = new Map();
        this.userStatus = 'online';
        this.connectionId = null;
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupChatSystem();
        this.setupNotifications();
        this.setupCollaboration();
        this.setupPresence();
        this.setupOfflineSupport();
    }

    // WebSocket Management
    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = (event) => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.userStatus = 'online';
            this.processMessageQueue();
            this.sendPresenceUpdate();
            this.emit('connection:open', event);
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected');
            this.userStatus = 'offline';
            this.emit('connection:close', event);
            this.scheduleReconnect();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('connection:error', error);
        };
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
                this.setupWebSocket();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('connection:failed');
        }
    }

    // Message Handling
    handleMessage(data) {
        const { type, payload, timestamp, sender } = data;
        
        switch (type) {
            case 'chat:message':
                this.handleChatMessage(payload);
                break;
            case 'notification':
                this.handleNotification(payload);
                break;
            case 'presence:update':
                this.handlePresenceUpdate(payload);
                break;
            case 'collaboration:update':
                this.handleCollaborationUpdate(payload);
                break;
            case 'system:announcement':
                this.handleSystemAnnouncement(payload);
                break;
            case 'course:progress':
                this.handleCourseProgress(payload);
                break;
            case 'support:ticket':
                this.handleSupportTicket(payload);
                break;
            default:
                console.warn('Unknown message type:', type);
        }
        
        this.emit(`message:${type}`, payload);
    }

    send(type, payload) {
        const message = {
            type,
            payload,
            timestamp: Date.now(),
            sender: this.getUserId()
        };
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.socket.send(JSON.stringify(message));
        }
    }

    // Chat System
    setupChatSystem() {
        this.chatSystem = new ChatSystem(this);
        this.createChatWidget();
    }

    createChatWidget() {
        const chatWidget = document.createElement('div');
        chatWidget.id = 'chat-widget';
        chatWidget.className = 'chat-widget';
        chatWidget.innerHTML = `
            <div class="chat-header">
                <h3>Support Chat</h3>
                <div class="chat-controls">
                    <button class="chat-minimize">−</button>
                    <button class="chat-close">×</button>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <input type="text" id="chat-input" placeholder="Type your message..." />
                <button id="chat-send">Send</button>
            </div>
            <div class="chat-status">
                <span id="chat-status-text">Online</span>
                <span id="typing-indicator" class="typing-indicator" style="display: none;">
                    Support is typing...
                </span>
            </div>
        `;
        
        document.body.appendChild(chatWidget);
        this.setupChatEvents();
    }

    setupChatEvents() {
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const chatMinimize = document.querySelector('.chat-minimize');
        const chatClose = document.querySelector('.chat-close');
        const chatWidget = document.getElementById('chat-widget');
        
        chatSend.addEventListener('click', () => {
            this.sendChatMessage(chatInput.value);
            chatInput.value = '';
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage(chatInput.value);
                chatInput.value = '';
            }
        });
        
        chatInput.addEventListener('input', () => {
            this.send('chat:typing', { typing: true });
        });
        
        chatMinimize.addEventListener('click', () => {
            chatWidget.classList.toggle('minimized');
        });
        
        chatClose.addEventListener('click', () => {
            chatWidget.style.display = 'none';
        });
        
        // Auto-open chat for new users
        if (this.isNewUser()) {
            this.openChat();
        }
    }

    sendChatMessage(message) {
        if (!message.trim()) return;
        
        this.send('chat:message', {
            message: message.trim(),
            timestamp: Date.now(),
            userId: this.getUserId(),
            sessionId: this.getSessionId()
        });
        
        this.addChatMessage(message, 'user');
    }

    handleChatMessage(payload) {
        if (payload.userId !== this.getUserId()) {
            this.addChatMessage(payload.message, 'support');
            this.showNotification('New message from support', payload.message);
        }
    }

    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        messageElement.innerHTML = `
            <div class="message-content">${this.escapeHtml(message)}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    openChat() {
        const chatWidget = document.getElementById('chat-widget');
        chatWidget.style.display = 'block';
        chatWidget.classList.remove('minimized');
        
        // Send initial greeting
        this.send('chat:join', {
            userId: this.getUserId(),
            page: window.location.pathname,
            timestamp: Date.now()
        });
    }

    // Notification System
    setupNotifications() {
        this.notificationSystem = new NotificationSystem();
        this.requestNotificationPermission();
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }

    showNotification(title, body, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: '/images/icons/icon-192x192.png',
                badge: '/images/icons/badge-72x72.png',
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                if (options.url) {
                    window.location.href = options.url;
                }
            };
            
            setTimeout(() => notification.close(), 5000);
        } else {
            // Fallback to in-app notification
            this.showInAppNotification(title, body);
        }
    }

    showInAppNotification(title, body) {
        const notification = document.createElement('div');
        notification.className = 'in-app-notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${body}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    handleNotification(payload) {
        this.showNotification(payload.title, payload.body, payload.options);
    }

    // Presence System
    setupPresence() {
        this.presenceSystem = new PresenceSystem(this);
        this.trackUserPresence();
    }

    trackUserPresence() {
        // Track mouse movement
        let mouseTimeout;
        document.addEventListener('mousemove', () => {
            clearTimeout(mouseTimeout);
            this.updateStatus('active');
            mouseTimeout = setTimeout(() => {
                this.updateStatus('idle');
            }, 300000); // 5 minutes
        });
        
        // Track keyboard activity
        let keyboardTimeout;
        document.addEventListener('keypress', () => {
            clearTimeout(keyboardTimeout);
            this.updateStatus('active');
            keyboardTimeout = setTimeout(() => {
                this.updateStatus('idle');
            }, 300000);
        });
        
        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.updateStatus('away');
            } else {
                this.updateStatus('active');
            }
        });
        
        // Track online/offline status
        window.addEventListener('online', () => {
            this.updateStatus('online');
        });
        
        window.addEventListener('offline', () => {
            this.updateStatus('offline');
        });
    }

    updateStatus(status) {
        if (this.userStatus !== status) {
            this.userStatus = status;
            this.sendPresenceUpdate();
        }
    }

    sendPresenceUpdate() {
        this.send('presence:update', {
            userId: this.getUserId(),
            status: this.userStatus,
            timestamp: Date.now(),
            page: window.location.pathname
        });
    }

    handlePresenceUpdate(payload) {
        this.emit('presence:update', payload);
        this.updatePresenceIndicator(payload);
    }

    updatePresenceIndicator(payload) {
        const indicator = document.querySelector(`[data-user-id="${payload.userId}"]`);
        if (indicator) {
            indicator.className = `presence-indicator ${payload.status}`;
            indicator.title = `${payload.status} - Last seen: ${new Date(payload.timestamp).toLocaleString()}`;
        }
    }

    // Collaboration System
    setupCollaboration() {
        this.collaborationSystem = new CollaborationSystem(this);
        this.setupRealTimeEditing();
    }

    setupRealTimeEditing() {
        // Track form inputs for real-time collaboration
        const forms = document.querySelectorAll('form[data-collaborative]');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    this.sendCollaborationUpdate('input', {
                        formId: form.id,
                        inputId: input.id,
                        value: input.value,
                        timestamp: Date.now()
                    });
                });
            });
        });
    }

    sendCollaborationUpdate(type, data) {
        this.send('collaboration:update', {
            type,
            data,
            userId: this.getUserId(),
            timestamp: Date.now()
        });
    }

    handleCollaborationUpdate(payload) {
        if (payload.userId !== this.getUserId()) {
            this.applyCollaborationUpdate(payload);
        }
    }

    applyCollaborationUpdate(payload) {
        const { type, data } = payload;
        
        switch (type) {
            case 'input':
                const input = document.getElementById(data.inputId);
                if (input && input.value !== data.value) {
                    input.value = data.value;
                    this.showCollaborationIndicator(input, payload.userId);
                }
                break;
            case 'cursor':
                this.updateCursorPosition(payload.userId, data.position);
                break;
            case 'selection':
                this.updateUserSelection(payload.userId, data.selection);
                break;
        }
    }

    showCollaborationIndicator(element, userId) {
        const indicator = document.createElement('div');
        indicator.className = 'collaboration-indicator';
        indicator.textContent = `User ${userId} is editing`;
        element.parentNode.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }

    // Offline Support
    setupOfflineSupport() {
        this.offlineQueue = [];
        
        window.addEventListener('online', () => {
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            this.showOfflineNotification();
        });
    }

    processOfflineQueue() {
        while (this.offlineQueue.length > 0) {
            const message = this.offlineQueue.shift();
            this.send(message.type, message.payload);
        }
    }

    showOfflineNotification() {
        this.showInAppNotification(
            'Connection Lost',
            'You are now offline. Messages will be sent when connection is restored.'
        );
    }

    // Event System
    on(event, callback) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    // Utility Methods
    getUserId() {
        return localStorage.getItem('user_id') || 'anonymous';
    }

    getSessionId() {
        return sessionStorage.getItem('session_id') || 'unknown';
    }

    isNewUser() {
        return !localStorage.getItem('user_visited');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Course-specific handlers
    handleCourseProgress(payload) {
        this.showNotification(
            'Course Progress Updated',
            `${payload.courseName}: ${payload.progress}% complete`
        );
    }

    handleSupportTicket(payload) {
        this.showNotification(
            'Support Ticket Update',
            `Ticket #${payload.ticketId}: ${payload.status}`
        );
    }

    handleSystemAnnouncement(payload) {
        this.showNotification(
            'System Announcement',
            payload.message,
            { requireInteraction: true }
        );
    }

    // Cleanup
    destroy() {
        if (this.socket) {
            this.socket.close();
        }
        this.eventHandlers.clear();
        this.subscriptions.clear();
    }
}

// Chat System Class
class ChatSystem {
    constructor(rtc) {
        this.rtc = rtc;
        this.chatHistory = [];
        this.typingUsers = new Set();
        this.chatRooms = new Map();
    }

    joinRoom(roomId) {
        this.rtc.send('chat:join_room', { roomId });
        this.chatRooms.set(roomId, { users: [], messages: [] });
    }

    leaveRoom(roomId) {
        this.rtc.send('chat:leave_room', { roomId });
        this.chatRooms.delete(roomId);
    }

    sendMessage(message, roomId = 'general') {
        this.rtc.send('chat:message', {
            message,
            roomId,
            timestamp: Date.now()
        });
    }

    startTyping(roomId = 'general') {
        this.rtc.send('chat:typing_start', { roomId });
    }

    stopTyping(roomId = 'general') {
        this.rtc.send('chat:typing_stop', { roomId });
    }
}

// Notification System Class
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.settings = {
            enabled: true,
            sound: true,
            desktop: true,
            email: false
        };
    }

    createNotification(type, title, body, options = {}) {
        const notification = {
            id: Date.now().toString(),
            type,
            title,
            body,
            timestamp: Date.now(),
            read: false,
            ...options
        };
        
        this.notifications.push(notification);
        this.displayNotification(notification);
        
        return notification;
    }

    displayNotification(notification) {
        if (!this.settings.enabled) return;
        
        // Show desktop notification if permitted
        if (this.settings.desktop && 'Notification' in window) {
            new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon || '/images/icons/icon-192x192.png'
            });
        }
        
        // Play sound if enabled
        if (this.settings.sound) {
            this.playNotificationSound();
        }
    }

    playNotificationSound() {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Could not play notification sound'));
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
}

// Presence System Class
class PresenceSystem {
    constructor(rtc) {
        this.rtc = rtc;
        this.users = new Map();
        this.currentStatus = 'online';
    }

    updateUserPresence(userId, status, metadata = {}) {
        this.users.set(userId, {
            status,
            lastSeen: Date.now(),
            metadata
        });
        
        this.rtc.emit('presence:user_update', {
            userId,
            status,
            metadata
        });
    }

    getUserPresence(userId) {
        return this.users.get(userId) || { status: 'offline', lastSeen: null };
    }

    getAllUsers() {
        return Array.from(this.users.entries()).map(([userId, presence]) => ({
            userId,
            ...presence
        }));
    }

    getOnlineUsers() {
        return this.getAllUsers().filter(user => user.status === 'online');
    }
}

// Collaboration System Class
class CollaborationSystem {
    constructor(rtc) {
        this.rtc = rtc;
        this.collaborators = new Map();
        this.documents = new Map();
    }

    joinDocument(documentId) {
        this.rtc.send('collaboration:join_document', { documentId });
        this.documents.set(documentId, { users: [], changes: [] });
    }

    leaveDocument(documentId) {
        this.rtc.send('collaboration:leave_document', { documentId });
        this.documents.delete(documentId);
    }

    sendChange(documentId, change) {
        this.rtc.send('collaboration:change', {
            documentId,
            change,
            timestamp: Date.now()
        });
    }

    applyChange(documentId, change, userId) {
        const document = this.documents.get(documentId);
        if (document) {
            document.changes.push({
                ...change,
                userId,
                timestamp: Date.now()
            });
            
            this.rtc.emit('collaboration:change_applied', {
                documentId,
                change,
                userId
            });
        }
    }
}

// Initialize Real-Time Communication
const rtc = new RealTimeCommunication();

// Export for global use
window.RealTimeCommunication = rtc;
window.ChatSystem = ChatSystem;
window.NotificationSystem = NotificationSystem;
window.PresenceSystem = PresenceSystem;
window.CollaborationSystem = CollaborationSystem;

// Add CSS for real-time communication components
const rtcStyles = document.createElement('style');
rtcStyles.textContent = `
    .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .chat-widget.minimized {
        height: 50px;
    }
    
    .chat-widget.minimized .chat-messages,
    .chat-widget.minimized .chat-input-container,
    .chat-widget.minimized .chat-status {
        display: none;
    }
    
    .chat-header {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .chat-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }
    
    .chat-controls button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        margin-left: 4px;
    }
    
    .chat-controls button:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f8fafc;
    }
    
    .chat-message {
        margin-bottom: 12px;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
    }
    
    .chat-message.user {
        background: #3b82f6;
        color: white;
        margin-left: auto;
    }
    
    .chat-message.support {
        background: white;
        color: #1f2937;
        border: 1px solid #e5e7eb;
    }
    
    .message-content {
        word-wrap: break-word;
    }
    
    .message-time {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 4px;
    }
    
    .chat-input-container {
        display: flex;
        padding: 12px;
        background: white;
        border-top: 1px solid #e5e7eb;
    }
    
    .chat-input-container input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        outline: none;
        font-size: 14px;
    }
    
    .chat-input-container input:focus {
        border-color: #3b82f6;
    }
    
    .chat-input-container button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        margin-left: 8px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .chat-input-container button:hover {
        background: #2563eb;
    }
    
    .chat-status {
        padding: 8px 16px;
        background: #f1f5f9;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #64748b;
    }
    
    .typing-indicator {
        color: #3b82f6;
        font-style: italic;
    }
    
    .in-app-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        max-width: 300px;
        z-index: 10001;
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }
    
    .notification-icon {
        color: #3b82f6;
        font-size: 20px;
    }
    
    .notification-content h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
    }
    
    .notification-content p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
    }
    
    .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        font-size: 16px;
        padding: 0;
        margin-left: auto;
    }
    
    .notification-close:hover {
        color: #374151;
    }
    
    .presence-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
    }
    
    .presence-indicator.online {
        background: #10b981;
    }
    
    .presence-indicator.idle {
        background: #f59e0b;
    }
    
    .presence-indicator.away {
        background: #64748b;
    }
    
    .presence-indicator.offline {
        background: #ef4444;
    }
    
    .collaboration-indicator {
        position: absolute;
        top: -25px;
        left: 0;
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 1000;
    }
    
    .collaboration-indicator::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 10px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid #3b82f6;
    }
`;
document.head.appendChild(rtcStyles);

console.log('Real-Time Communication System initialized');
console.log('WebSocket URL:', rtc.socket?.url);
console.log('Connection status:', rtc.userStatus);