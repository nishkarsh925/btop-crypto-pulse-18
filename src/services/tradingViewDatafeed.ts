
import { binanceService } from './binanceApi';

export class BinanceDatafeed {
  private lastBarsCache = new Map();
  private subscriptions = new Map();

  constructor() {
    console.log('Binance Datafeed initialized');
  }

  // Configuration
  onReady(callback: any) {
    console.log('TradingView requesting configuration');
    setTimeout(() => {
      callback({
        exchanges: [
          { value: 'BINANCE', name: 'Binance', desc: 'Binance Exchange' }
        ],
        symbols_types: [
          { name: 'crypto', value: 'crypto' }
        ],
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
        futures_regex: null
      });
    }, 0);
  }

  // Search symbols
  searchSymbols(userInput: string, exchange: string, symbolType: string, onResultReadyCallback: any) {
    console.log('Searching symbols:', userInput);
    const symbols = [
      { symbol: 'BTCUSDT', full_name: 'BINANCE:BTCUSDT', description: 'Bitcoin / Tether', exchange: 'BINANCE', ticker: 'BTCUSDT', type: 'crypto' },
      { symbol: 'ETHUSDT', full_name: 'BINANCE:ETHUSDT', description: 'Ethereum / Tether', exchange: 'BINANCE', ticker: 'ETHUSDT', type: 'crypto' },
      { symbol: 'BNBUSDT', full_name: 'BINANCE:BNBUSDT', description: 'BNB / Tether', exchange: 'BINANCE', ticker: 'BNBUSDT', type: 'crypto' }
    ];
    
    const filteredSymbols = symbols.filter(s => 
      s.symbol.toLowerCase().includes(userInput.toLowerCase()) ||
      s.description.toLowerCase().includes(userInput.toLowerCase())
    );
    
    onResultReadyCallback(filteredSymbols);
  }

  // Resolve symbol
  resolveSymbol(symbolName: string, onSymbolResolvedCallback: any, onResolveErrorCallback: any) {
    console.log('Resolving symbol:', symbolName);
    
    const symbolInfo = {
      ticker: symbolName,
      name: symbolName,
      description: symbolName.replace('USDT', ' / USDT'),
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'BINANCE',
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_no_volume: false,
      has_weekly_and_monthly: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
      volume_precision: 2,
      data_status: 'streaming',
      full_name: `BINANCE:${symbolName}`
    };

    setTimeout(() => {
      onSymbolResolvedCallback(symbolInfo);
    }, 0);
  }

  // Get historical data
  async getBars(symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: any, onErrorCallback: any) {
    console.log('Getting bars for:', symbolInfo.ticker, resolution);
    
    try {
      const symbol = symbolInfo.ticker.replace('USDT', '');
      const interval = this.convertResolution(resolution);
      const klineData = await binanceService.getKlineData(symbol, interval, 500);
      
      const bars = klineData.map(item => ({
        time: item.time * 1000, // Convert to milliseconds
        low: item.low,
        high: item.high,
        open: item.open,
        close: item.close,
        volume: item.volume
      }));

      if (bars.length > 0) {
        this.lastBarsCache.set(symbolInfo.ticker, bars[bars.length - 1]);
      }

      onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (error) {
      console.error('Error fetching bars:', error);
      onErrorCallback('Failed to fetch historical data');
    }
  }

  // Subscribe to real-time data
  subscribeBars(symbolInfo: any, resolution: string, onRealtimeCallback: any, subscriberUID: string, onResetCacheNeededCallback?: any) {
    console.log('Subscribing to real-time data for:', symbolInfo.ticker);
    
    const symbol = symbolInfo.ticker;
    this.subscriptions.set(subscriberUID, { symbol, callback: onRealtimeCallback });

    // Start WebSocket connection for real-time data
    this.startWebSocketConnection(symbol, onRealtimeCallback);
  }

  // Unsubscribe from real-time data  
  unsubscribeBars(subscriberUID: string) {
    console.log('Unsubscribing from real-time data:', subscriberUID);
    this.subscriptions.delete(subscriberUID);
  }

  // WebSocket connection for real-time data
  private startWebSocketConnection(symbol: string, callback: any) {
    const wsSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_1m`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const kline = data.k;
        const bar = {
          time: kline.t,
          low: parseFloat(kline.l),
          high: parseFloat(kline.h),
          open: parseFloat(kline.o),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v)
        };
        
        callback(bar);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private convertResolution(resolution: string): string {
    const mapping: Record<string, string> = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '240': '4h',
      '1D': '1d',
      '1W': '1w'
    };
    
    return mapping[resolution] || '1h';
  }
}

export const binanceDatafeed = new BinanceDatafeed();
