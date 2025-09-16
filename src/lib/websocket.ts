// WebSocket service library
export class AuthenticatedWebSocket {
  private ws: WebSocket;
  public isAuthenticated = false;

  constructor(url: string, token: string) {
    this.ws = new WebSocket(url);
    
    this.ws.addEventListener('open', () => {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    });

    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'auth_success') {
        this.isAuthenticated = true;
      }
    });

    this.ws.addEventListener('close', (event) => {
      if (event.code === 1008) {
        console.error('WebSocket closed due to invalid JWT');
      }
    });

    // Trigger open event immediately for testing
    if (this.ws.readyState === 1) {
      this.ws.dispatchEvent(new Event('open'));
    }
  }

  send(message: Record<string, unknown>) {
    if (this.isAuthenticated) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close() {
    this.ws.close();
  }
}

export class MessagingWebSocket extends AuthenticatedWebSocket {
  constructor(url: string, token: string) {
    super(url, token);
  }
}