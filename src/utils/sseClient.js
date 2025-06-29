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
    try {
      console.log(`SSEClient: Connecting to ${this.url}`);
      this.eventSource = new EventSource(this.url);
      
      this.eventSource.onopen = () => {
        console.log('SSEClient: Connection opened successfully');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay on successful connection
        this.emit('open');
      };
  
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (error) {
          console.error('SSEClient: Error parsing SSE message:', error);
        }
      };
  
      this.eventSource.onerror = (err) => {
        console.error('SSEClient: Connection error', err);
        
        // Always close the connection on error
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        
        this.emit('error', { message: 'SSE connection error' });
        
        // Don't attempt to reconnect here - let the SSEManager handle it
        this.emit('close');
      };
    } catch (error) {
      console.error('SSEClient: Failed to create EventSource:', error);
      this.emit('error', { message: `Failed to create EventSource: ${error.message}` });
      this.emit('close');
    }
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
    console.log('SSEClient: Closing connection');
    if (this.eventSource) {
      try {
        this.eventSource.close();
        this.eventSource = null;
      } catch (error) {
        console.error('SSEClient: Error closing EventSource:', error);
      }
      this.emit('close');
    }
  }
}