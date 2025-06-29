export class SSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.withCredentials = false; // Set to false to avoid CORS issues
  }

  connect() {
    try {
      console.log(`SSEClient: Connecting to ${this.url}`);
      
      // Create EventSource with options
      this.eventSource = new EventSource(this.url, { 
        withCredentials: this.withCredentials 
      });
      
      // Add additional properties for debugging
      this.readyState = this.eventSource.readyState;
      
      this.eventSource.onopen = () => {
        console.log('SSEClient: Connection opened successfully');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay on successful connection
        this.readyState = this.eventSource.readyState;
        this.emit('open');
      };
  
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSEClient: Received message:', data.type);
          this.emit(data.type, data);
          
          // Update readyState for debugging
          this.readyState = this.eventSource.readyState;
        } catch (error) {
          console.error('SSEClient: Error parsing SSE message:', error, 'Raw data:', event.data);
        }
      };
      
      this.eventSource.onerror = (err) => {
        // Update readyState for debugging
        this.readyState = this.eventSource ? this.eventSource.readyState : -1;
        
        console.error('SSEClient: Connection error', err, {
          readyState: this.readyState,
          url: this.url,
          withCredentials: this.withCredentials
        });
        
        // Always close the connection on error
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        
        this.emit('error', { 
          message: 'SSE connection error',
          readyState: this.readyState,
          url: this.url
        });
        
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