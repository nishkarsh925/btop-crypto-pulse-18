
export interface TradingViewConfig {
  datafeedUrl: string;
  supportedResolutions: string[];
  symbols: Record<string, string>;
  exchanges: string[];
}

export const tradingViewConfig: TradingViewConfig = {
  datafeedUrl: 'https://api.binance.com/api/v3',
  supportedResolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
  symbols: {
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'BNB': 'BINANCE:BNBUSDT',
    'ADA': 'BINANCE:ADAUSDT',
    'SOL': 'BINANCE:SOLUSDT',
    'DOT': 'BINANCE:DOTUSDT',
    'LINK': 'BINANCE:LINKUSDT',
    'LTC': 'BINANCE:LTCUSDT'
  },
  exchanges: ['BINANCE', 'COINBASE', 'KRAKEN', 'BITFINEX']
};

export const getTradingViewSymbol = (symbol: string): string => {
  const upperSymbol = symbol.toUpperCase();
  return tradingViewConfig.symbols[upperSymbol] || `BINANCE:${upperSymbol}USDT`;
};

export const formatInterval = (interval: string): string => {
  const mapping: Record<string, string> = {
    '1m': '1',
    '5m': '5', 
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': '1D',
    '1w': '1W',
    '1M': '1M'
  };
  
  return mapping[interval.toLowerCase()] || '60';
};
