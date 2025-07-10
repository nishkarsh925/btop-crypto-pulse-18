
export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeframeData {
  [key: string]: CandleData[];
}

// Generate realistic mock candlestick data
const generateMockCandles = (symbol: string, timeframe: string, count: number): CandleData[] => {
  const basePrice = symbol === "BTC" ? 45000 : symbol === "ETH" ? 2800 : symbol === "XRP" ? 0.6 : 400;
  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  
  const now = new Date();
  const timeframeMinutes = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '1d': 1440,
    '1w': 10080
  }[timeframe] || 60;

  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * timeframeMinutes * 60 * 1000));
    
    // Generate realistic OHLC data
    const volatility = 0.02 + Math.random() * 0.02; // 2-4% volatility
    const open = currentPrice;
    const change = (Math.random() - 0.5) * volatility * open;
    const close = open + change;
    
    const high = Math.max(open, close) + Math.random() * 0.01 * Math.max(open, close);
    const low = Math.min(open, close) - Math.random() * 0.01 * Math.min(open, close);
    
    const volume = Math.random() * 1000000 + 500000;
    
    candles.push({
      time: timestamp.toISOString().split('T')[0] + ' ' + timestamp.toTimeString().split(' ')[0],
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      volume: parseFloat(volume.toFixed(0))
    });
    
    currentPrice = close;
  }
  
  return candles;
};

export const getMockKlineData = (symbol: string): TimeframeData => {
  return {
    '1m': generateMockCandles(symbol, '1m', 100),
    '5m': generateMockCandles(symbol, '5m', 200),
    '15m': generateMockCandles(symbol, '15m', 300),
    '1h': generateMockCandles(symbol, '1h', 168),
    '1d': generateMockCandles(symbol, '1d', 30),
    '1w': generateMockCandles(symbol, '1w', 52)
  };
};

export const timeframes = [
  { key: '1m', label: '1m' },
  { key: '5m', label: '5m' },
  { key: '15m', label: '15m' },
  { key: '1h', label: '1h' },
  { key: '1d', label: '1d' },
  { key: '1w', label: '1w' }
];
