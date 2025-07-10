
// CoinGecko API service for fetching real-time crypto data
export interface CoinGeckoPriceData {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

export interface CoinGeckoOHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface FormattedCandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Mapping of common symbols to CoinGecko IDs
const SYMBOL_TO_ID_MAP: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'UNI': 'uniswap',
  'MATIC': 'polygon',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'ICP': 'internet-computer',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic'
};

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private corsProxyUrl = 'https://corsproxy.io/?';

  // Convert symbol to CoinGecko ID
  private symbolToId(symbol: string): string {
    return SYMBOL_TO_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  // Retry mechanism with exponential backoff
  private async fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch: ${url}`);
        
        // Try direct API call first
        let response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error);
        
        // If it's a CORS error or network error, try with CORS proxy
        if (attempt === 1) {
          try {
            console.log(`Trying with CORS proxy: ${this.corsProxyUrl}${encodeURIComponent(url)}`);
            const proxyResponse = await fetch(`${this.corsProxyUrl}${encodeURIComponent(url)}`);
            
            if (proxyResponse.ok) {
              console.log('CORS proxy request successful');
              return proxyResponse;
            }
          } catch (proxyError) {
            console.log('CORS proxy also failed:', proxyError);
          }
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  // Fetch current price and market data
  async getCurrentPrice(symbols: string[]): Promise<{ [key: string]: CoinGeckoPriceData }> {
    try {
      const ids = symbols.map(symbol => this.symbolToId(symbol)).join(',');
      const url = `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
      
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      
      // Convert array response to object with symbol keys
      const result: { [key: string]: CoinGeckoPriceData } = {};
      
      data.forEach((coin: any) => {
        // Find the symbol that matches this coin ID
        const symbol = Object.keys(SYMBOL_TO_ID_MAP).find(
          key => SYMBOL_TO_ID_MAP[key] === coin.id
        ) || coin.symbol.toUpperCase();
        
        result[symbol] = {
          id: coin.id,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0,
          total_volume: coin.total_volume || 0,
          high_24h: coin.high_24h || coin.current_price,
          low_24h: coin.low_24h || coin.current_price,
          last_updated: coin.last_updated
        };
      });

      console.log('Successfully fetched price data:', result);
      return result;
    } catch (error) {
      console.error('Error fetching price data:', error);
      
      // Return fallback data if API fails
      return this.getFallbackPriceData(symbols);
    }
  }

  // Fallback price data when API is unavailable
  private getFallbackPriceData(symbols: string[]): { [key: string]: CoinGeckoPriceData } {
    console.log('Using fallback price data for symbols:', symbols);
    
    const fallbackPrices: { [key: string]: number } = {
      'BTC': 111000,
      'ETH': 4200,
      'SOL': 240,
      'XRP': 2.10,
      'ADA': 1.15,
      'DOT': 18.50,
      'LINK': 28.30,
      'LTC': 350
    };

    const result: { [key: string]: CoinGeckoPriceData } = {};
    
    symbols.forEach(symbol => {
      const basePrice = fallbackPrices[symbol.toUpperCase()] || 100;
      const randomChange = (Math.random() - 0.5) * 10; // -5% to +5% random change
      
      result[symbol.toUpperCase()] = {
        id: this.symbolToId(symbol),
        current_price: basePrice,
        price_change_percentage_24h: randomChange,
        market_cap: basePrice * 19000000, // Mock market cap
        total_volume: basePrice * 1000000, // Mock volume
        high_24h: basePrice * 1.05,
        low_24h: basePrice * 0.95,
        last_updated: new Date().toISOString()
      };
    });

    return result;
  }

  // Fetch OHLC data for candlestick chart
  async getOHLCData(symbol: string, days: number = 1): Promise<FormattedCandleData[]> {
    try {
      const coinId = this.symbolToId(symbol);
      const url = `${this.baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
      
      const response = await this.fetchWithRetry(url);
      const data: number[][] = await response.json();
      
      // Convert CoinGecko OHLC format to our format
      const formattedData = data.map((item, index) => ({
        time: Math.floor(item[0] / 1000), // Convert to seconds
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: Math.random() * 1000000 + 500000 // CoinGecko OHLC doesn't include volume
      }));

      console.log(`Successfully fetched OHLC data for ${symbol}:`, formattedData.length, 'candles');
      return formattedData;
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      // Fallback: generate some sample data based on current price
      return this.generateFallbackData(symbol);
    }
  }

  // Generate fallback candlestick data when OHLC is not available
  private async generateFallbackData(symbol: string): Promise<FormattedCandleData[]> {
    try {
      console.log(`Generating fallback OHLC data for ${symbol}`);
      
      const priceData = await this.getCurrentPrice([symbol]);
      const currentPrice = priceData[symbol]?.current_price || 100;
      
      const candles: FormattedCandleData[] = [];
      const now = Date.now();
      const intervalMs = 30 * 60 * 1000; // 30 minute intervals
      
      for (let i = 100; i >= 0; i--) {
        const timestamp = Math.floor((now - (i * intervalMs)) / 1000);
        const volatility = 0.02;
        const basePrice = currentPrice + (Math.random() - 0.5) * currentPrice * 0.1;
        
        const open = basePrice;
        const change = (Math.random() - 0.5) * volatility * open;
        const close = open + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.random() * 1000000 + 500000;
        
        candles.push({
          time: timestamp,
          open: parseFloat(open.toFixed(6)),
          high: parseFloat(high.toFixed(6)),
          low: parseFloat(low.toFixed(6)),
          close: parseFloat(close.toFixed(6)),
          volume: parseFloat(volume.toFixed(0))
        });
      }
      
      return candles;
    } catch (error) {
      console.error('Error generating fallback data:', error);
      return [];
    }
  }

  // Get detailed coin information
  async getCoinDetails(symbol: string): Promise<any> {
    try {
      const coinId = this.symbolToId(symbol);
      const url = `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
      
      const response = await this.fetchWithRetry(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching coin details:', error);
      throw error;
    }
  }

  // Get list of available coins
  async getAvailableCoins(): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/coins/list`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      return data.map((coin: any) => coin.symbol.toUpperCase()).slice(0, 100);
    } catch (error) {
      console.error('Error fetching coins list:', error);
      return Object.keys(SYMBOL_TO_ID_MAP);
    }
  }
}

export const coinGeckoService = new CoinGeckoService();
