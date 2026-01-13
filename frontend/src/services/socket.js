import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(investigationId) {
    if (this.socket) {
      this.socket.emit('subscribe', { investigation_id: investigationId });
      console.log('📡 Subscribed to investigation:', investigationId);
    }
  }

  unsubscribe(investigationId) {
    if (this.socket) {
      this.socket.emit('unsubscribe', { investigation_id: investigationId });
      console.log('🔕 Unsubscribed from investigation:', investigationId);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export default new SocketService();