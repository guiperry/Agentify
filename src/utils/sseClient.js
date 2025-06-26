export class SSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.eventSource = new EventSource(this.url);
    
    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('open');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = () => {
      this.eventSource.close();
      this.emit('error', { message: 'SSE connection error' });
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectDelay = Math.min(
            this.reconnectDelay * 2,
            30000
          );
          this.connect();
        }, this.reconnectDelay);
      } else {
        this.emit('close');
      }
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.emit('close');
    }
  }
}