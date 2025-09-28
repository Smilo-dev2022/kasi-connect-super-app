// WebSocket service with JWT authentication
// Handles real-time communication with authentication

export interface WebSocketMessage {
  type: string;
  data?: any;
  token?: string;
}

export interface AuthenticatedWebSocketOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
}

export class AuthenticatedWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private options: AuthenticatedWebSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string, token: string, options: AuthenticatedWebSocketOptions = {}) {
    this.url = url;
    this.token = token;
    this.options = options;
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleError(error as Event);
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.addEventListener('open', (event) => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send authentication message
      this.send({
        type: 'auth',
        token: this.token
      });

      this.options.onOpen?.(event);
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle authentication response
        if (message.type === 'auth_response') {
          if (!message.success) {
            console.error('Authentication failed:', message.error);
            this.close(1008, 'Authentication failed');
            return;
          }
          console.log('WebSocket authenticated successfully');
          return;
        }

        this.options.onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      
      // Handle authentication failure
      if (event.code === 1008) {
        console.error('WebSocket closed due to authentication failure');
        this.options.onClose?.(event);
        return;
      }

      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        this.options.onClose?.(event);
      }
    });

    this.ws.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      this.handleError(event);
    });
  }

  private handleError(error: Event): void {
    this.options.onError?.(error);
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  close(code: number = 1000, reason: string = 'Normal closure'): void {
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Factory function for creating authenticated WebSocket connections
export function createAuthenticatedWebSocket(
  url: string, 
  token: string, 
  options: AuthenticatedWebSocketOptions = {}
): AuthenticatedWebSocket {
  return new AuthenticatedWebSocket(url, token, options);
}

// Utility function to get WebSocket URL based on environment
export function getWebSocketUrl(path: string = '/ws'): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.VITE_WS_HOST || window.location.host;
  return `${protocol}//${host}${path}`;
}