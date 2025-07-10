// Enhanced Binance API service for fetching real-time crypto data
export interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface BinanceTicker {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  count: number;
}

export interface BinancePriceData {
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

export interface FormattedCandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Fallback data for when API is not accessible
const FALLBACK_CRYPTO_DATA = {
  'BTC': {
    symbol: 'BTCUSDT',
    current_price: 43500.00,
    price_change_percentage_24h: 2.5,
    market_cap: 0,
    total_volume: 28000000000,
    high_24h: 44200.00,
    low_24h: 42800.00,
    last_updated: new Date().toISOString()
  },
  'ETH': {
    symbol: 'ETHUSDT',
    current_price: 2650.00,
    price_change_percentage_24h: 3.2,
    market_cap: 0,
    total_volume: 15000000000,
    high_24h: 2720.00,
    low_24h: 2580.00,
    last_updated: new Date().toISOString()
  },
  'XRP': {
    symbol: 'XRPUSDT',
    current_price: 0.62,
    price_change_percentage_24h: 1.8,
    market_cap: 0,
    total_volume: 2500000000,
    high_24h: 0.65,
    low_24h: 0.60,
    last_updated: new Date().toISOString()
  },
  'ADA': {
    symbol: 'ADAUSDT',
    current_price: 0.48,
    price_change_percentage_24h: -0.5,
    market_cap: 0,
    total_volume: 800000000,
    high_24h: 0.50,
    low_24h: 0.46,
    last_updated: new Date().toISOString()
  },
  'SOL': {
    symbol: 'SOLUSDT',
    current_price: 105.50,
    price_change_percentage_24h: 4.1,
    market_cap: 0,
    total_volume: 3200000000,
    high_24h: 108.00,
    low_24h: 102.00,
    last_updated: new Date().toISOString()
  },
  'DOT': {
    symbol: 'DOTUSDT',
    current_price: 7.25,
    price_change_percentage_24h: 1.2,
    market_cap: 0,
    total_volume: 450000000,
    high_24h: 7.45,
    low_24h: 7.10,
    last_updated: new Date().toISOString()
  },
  'LINK': {
    symbol: 'LINKUSDT',
    current_price: 15.80,
    price_change_percentage_24h: 2.8,
    market_cap: 0,
    total_volume: 680000000,
    high_24h: 16.20,
    low_24h: 15.40,
    last_updated: new Date().toISOString()
  },
  'LTC': {
    symbol: 'LTCUSDT',
    current_price: 75.20,
    price_change_percentage_24h: 1.5,
    market_cap: 0,
    total_volume: 950000000,
    high_24h: 76.80,
    low_24h: 73.90,
    last_updated: new Date().toISOString()
  },
  'DOGE': {
    symbol: 'DOGEUSDT',
    current_price: 0.085,
    price_change_percentage_24h: 5.2,
    market_cap: 0,
    total_volume: 1200000000,
    high_24h: 0.089,
    low_24h: 0.081,
    last_updated: new Date().toISOString()
  }
};

class BinanceService {
  private baseUrl = 'https://api.binance.com/api/v3';
  private useFallback = false;

  constructor() {
    console.log('BinanceService initialized');
  }

  // Convert timeframe to Binance interval format
  private formatInterval(timeframe: string): string {
    const intervalMap: { [key: string]: string } = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    return intervalMap[timeframe] || '1h';
  }

  // Generate mock kline data
  private generateMockKlineData(symbol: string, interval: string, limit: number): FormattedCandleData[] {
    const basePrice = FALLBACK_CRYPTO_DATA[symbol as keyof typeof FALLBACK_CRYPTO_DATA]?.current_price || 100;
    const data: FormattedCandleData[] = [];
    const now = Date.now();
    const intervalMs = this.getIntervalMs(interval);

    for (let i = limit - 1; i >= 0; i--) {
      const time = Math.floor((now - (i * intervalMs)) / 1000);
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      const open = basePrice * (1 + change);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;

      data.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
    }

    return data;
  }

  private getIntervalMs(interval: string): number {
    const intervalMap: { [key: string]: number } = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000
    };
    return intervalMap[interval] || 3600000;
  }

  // Fetch kline/candlestick data
  async getKlineData(symbol: string, interval: string, limit: number = 500): Promise<FormattedCandleData[]> {
    if (this.useFallback) {
      console.log('Using fallback mock data for kline data');
      return this.generateMockKlineData(symbol, interval, limit);
    }

    try {
      const binanceInterval = this.formatInterval(interval);
      const response = await fetch(
        `${this.baseUrl}/klines?symbol=${symbol.toUpperCase()}USDT&interval=${binanceInterval}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch kline data: ${response.statusText}`);
      }

      const data: BinanceKlineData[] = await response.json();
      
      return data.map(item => ({
        time: Math.floor(item.openTime / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume)
      }));
    } catch (error) {
      console.error('Error fetching kline data, using fallback:', error);
      this.useFallback = true;
      return this.generateMockKlineData(symbol, interval, limit);
    }
  }

  // Fetch 24hr ticker statistics for a single symbol
  async getTicker24hr(symbol: string): Promise<BinanceTicker> {
    if (this.useFallback) {
      const fallbackData = FALLBACK_CRYPTO_DATA[symbol.toUpperCase() as keyof typeof FALLBACK_CRYPTO_DATA];
      if (fallbackData) {
        return {
          symbol: fallbackData.symbol,
          price: fallbackData.current_price.toString(),
          priceChange: (fallbackData.current_price * fallbackData.price_change_percentage_24h / 100).toString(),
          priceChangePercent: fallbackData.price_change_percentage_24h.toString(),
          highPrice: fallbackData.high_24h.toString(),
          lowPrice: fallbackData.low_24h.toString(),
          volume: fallbackData.total_volume.toString(),
          quoteVolume: fallbackData.total_volume.toString(),
          openPrice: (fallbackData.current_price * 0.98).toString(),
          prevClosePrice: (fallbackData.current_price * 0.99).toString(),
          lastPrice: fallbackData.current_price.toString(),
          count: 50000
        };
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ticker data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ticker data, using fallback:', error);
      this.useFallback = true;
      return this.getTicker24hr(symbol); // Retry with fallback
    }
  }

  // Fetch 24hr ticker statistics for multiple symbols
  async getAllTickers(): Promise<BinanceTicker[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/24hr`);

      if (!response.ok) {
        throw new Error(`Failed to fetch all tickers: ${response.statusText}`);
      }

      const data = await response.json();
      // Filter only USDT pairs
      return data.filter((ticker: BinanceTicker) => ticker.symbol.endsWith('USDT'));
    } catch (error) {
      console.error('Error fetching all tickers:', error);
      throw error;
    }
  }

  // Fetch current price for multiple symbols
  async getCurrentPrice(symbols: string[]): Promise<{ [key: string]: BinancePriceData }> {
    if (this.useFallback) {
      console.log('Using fallback data for price data');
      const result: { [key: string]: BinancePriceData } = {};
      symbols.forEach(symbol => {
        const fallbackData = FALLBACK_CRYPTO_DATA[symbol.toUpperCase() as keyof typeof FALLBACK_CRYPTO_DATA];
        if (fallbackData) {
          result[symbol.toUpperCase()] = fallbackData;
        }
      });
      return result;
    }

    try {
      const result: { [key: string]: BinancePriceData } = {};
      
      console.log('Fetching price data from Binance for symbols:', symbols);
      
      // Simple GET request without any headers to avoid CORS issues
      const response = await fetch(`${this.baseUrl}/ticker/24hr`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Binance API response error:', response.status, errorText);
        throw new Error(`Binance API Error ${response.status}: ${errorText}`);
      }

      const allTickers: BinanceTicker[] = await response.json();
      console.log('Successfully fetched', allTickers.length, 'tickers from Binance');
      
      symbols.forEach(symbol => {
        const ticker = allTickers.find(t => t.symbol === `${symbol.toUpperCase()}USDT`);
        if (ticker) {
          result[symbol.toUpperCase()] = {
            symbol: ticker.symbol,
            current_price: parseFloat(ticker.lastPrice),
            price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
            market_cap: 0,
            total_volume: parseFloat(ticker.volume),
            high_24h: parseFloat(ticker.highPrice),
            low_24h: parseFloat(ticker.lowPrice),
            last_updated: new Date().toISOString()
          };
        } else {
          console.warn(`Symbol ${symbol}USDT not found in Binance tickers`);
        }
      });

      console.log('Successfully processed price data for symbols:', Object.keys(result));
      return result;
    } catch (error) {
      console.error('Error fetching price data from Binance, switching to fallback:', error);
      this.useFallback = true;
      return this.getCurrentPrice(symbols); // Retry with fallback
    }
  }

  // Fetch current price for a single symbol
  async getSinglePrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ticker/price?symbol=${symbol.toUpperCase()}USDT`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch current price: ${response.statusText}`);
      }

      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  }

  // Get all available USDT trading pairs
  async getExchangeInfo(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/exchangeInfo`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
      }

      const data = await response.json();
      return data.symbols
        .filter((symbol: any) => symbol.quoteAsset === 'USDT' && symbol.status === 'TRADING')
        .map((symbol: any) => symbol.baseAsset);
    } catch (error) {
      console.error('Error fetching exchange info:', error);
      throw error;
    }
  }

  // Get server time
  async getServerTime(): Promise<number> {
    if (this.useFallback) {
      return Date.now();
    }

    try {
      const response = await fetch(`${this.baseUrl}/time`);
      if (!response.ok) {
        throw new Error('Failed to fetch server time');
      }
      const data = await response.json();
      console.log('Binance server time fetched successfully');
      return data.serverTime;
    } catch (error) {
      console.warn('Error fetching server time, using fallback:', error);
      this.useFallback = true;
      return Date.now();
    }
  }

  // Check if using fallback mode
  isUsingFallback(): boolean {
    return this.useFallback;
  }

  // Force fallback mode (for testing)
  setFallbackMode(useFallback: boolean): void {
    this.useFallback = useFallback;
  }
}

export const binanceService = new BinanceService();
