
interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
}

type PriceUpdateCallback = (update: PriceUpdate) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private callbacks: Set<PriceUpdateCallback> = new Set();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private symbols: string[] = [];
  private wsUrl = 'wss://stream.binance.com:9443/ws/';

  connect(symbols: string[]) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.symbols = symbols;
    this.isConnecting = true;

    try {
      // Create stream names for Binance WebSocket
      const streams = symbols.map(symbol => 
        `${symbol.toLowerCase()}usdt@ticker`
      ).join('/');
      
      const wsUrl = `${this.wsUrl}${streams}`;
      
      console.log('Connecting to Binance WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Binance WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle single stream data
          if (data.stream && data.data) {
            this.handleTickerUpdate(data.data);
          } 
          // Handle multi-stream data
          else if (data.e === '24hrTicker') {
            this.handleTickerUpdate(data);
          }
          // Handle combined stream data
          else if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.data && item.data.e === '24hrTicker') {
                this.handleTickerUpdate(item.data);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Binance WebSocket closed:', event.code, event.reason);
        this.ws = null;
        this.isConnecting = false;
        
        if (event.code !== 1000) { // Not a normal closure
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
        this.scheduleReconnect();
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleTickerUpdate(tickerData: any) {
    if (!tickerData.s || !tickerData.c || !tickerData.P) return;

    // Extract symbol without USDT suffix
    const symbol = tickerData.s.replace('USDT', '').toLowerCase();
    const price = parseFloat(tickerData.c);
    const change24h = parseFloat(tickerData.P);

    const update: PriceUpdate = {
      symbol,
      price,
      change24h
    };

    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in callback:', error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect(this.symbols);
    }, delay);
  }

  subscribe(callback: PriceUpdateCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    console.log('Binance WebSocket disconnected');
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }
}

export const websocketService = new WebSocketService();
