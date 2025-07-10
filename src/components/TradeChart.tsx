import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, LineData, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { timeframes } from '@/data/mockKlines';
import { binanceService, FormattedCandleData, BinancePriceData } from '@/services/binanceApi';
import { TrendingUp, TrendingDown, BarChart3, Wifi, WifiOff, Activity } from 'lucide-react';

interface TradeChartProps {
  symbol: string;
  pair?: string;
  className?: string;
}

interface ChartStats {
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  currentPrice: number;
  marketCap: number;
}

const TradeChart: React.FC<TradeChartProps> = ({ 
  symbol, 
  pair = "USDT",
  className = "" 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma10SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [chartData, setChartData] = useState<FormattedCandleData[]>([]);
  const [showMA, setShowMA] = useState(true);
  const [stats, setStats] = useState<ChartStats>({
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    change24h: 0,
    currentPrice: 0,
    marketCap: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate Moving Average
  const calculateMA = (data: FormattedCandleData[], period: number): LineData[] => {
    const result: LineData[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.close, 0);
      const ma = sum / period;
      
      result.push({
        time: data[i].time as any,
        value: ma
      });
    }
    
    return result;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      grid: {
        vertLines: {
          color: '#374151',
          style: 1,
        },
        horzLines: {
          color: '#374151',
          style: 1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#06b6d4',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#06b6d4',
          width: 1,
          style: 3,
        },
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#06b6d4',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    const ma10Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'MA10',
    });

    const ma20Series = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      title: 'MA20',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    ma10SeriesRef.current = ma10Series;
    ma20SeriesRef.current = ma20Series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Load data from Binance when symbol or timeframe changes
  useEffect(() => {
    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Loading chart data for ${symbol} from Binance...`);
        
        // Fetch candlestick data and ticker data from Binance
        const [klineData, tickerData] = await Promise.all([
          binanceService.getKlineData(symbol, selectedTimeframe, 500),
          binanceService.getTicker24hr(symbol)
        ]);
        
        setChartData(klineData);
        
        // Calculate stats from Binance API data
        const statsFromApi = {
          high24h: parseFloat(tickerData.highPrice),
          low24h: parseFloat(tickerData.lowPrice),
          volume24h: parseFloat(tickerData.volume),
          change24h: parseFloat(tickerData.priceChangePercent),
          currentPrice: parseFloat(tickerData.lastPrice),
          marketCap: 0 // Binance doesn't provide market cap
        };
        
        setStats(statsFromApi);
        setIsConnected(true);
        console.log(`Successfully loaded ${klineData.length} candles for ${symbol}`);
      } catch (error) {
        console.error('Failed to fetch data from Binance API:', error);
        setError('Failed to connect to Binance API. Please check your connection.');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [symbol, selectedTimeframe]);

  // Update chart when data changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !chartData.length) return;

    const candleData: CandlestickData[] = chartData.map(item => ({
      time: item.time as any,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    const volumeData: HistogramData[] = chartData.map(item => ({
      time: item.time as any,
      value: item.volume,
      color: item.close >= item.open ? '#10b981' : '#ef4444',
    }));

    const ma10Data = calculateMA(chartData, 10);
    const ma20Data = calculateMA(chartData, 20);

    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (ma10SeriesRef.current && ma20SeriesRef.current) {
      if (showMA) {
        ma10SeriesRef.current.setData(ma10Data);
        ma20SeriesRef.current.setData(ma20Data);
      } else {
        ma10SeriesRef.current.setData([]);
        ma20SeriesRef.current.setData([]);
      }
    }

    if (chartRef.current) {
      chartRef.current.subscribeCrosshairMove((param) => {
        if (!param.time || !param.point) return;
        
        const data = param.seriesData.get(candlestickSeriesRef.current!);
        if (data) {
          console.log('Hover data:', data);
        }
      });
    }
  }, [chartData, showMA]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: symbol === 'BTC' ? 2 : 4,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(0);
  };

  return (
    <div className={`bg-slate-800/30 backdrop-blur-lg border border-slate-700/50 rounded-lg ${className}`}>
      {/* Chart Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">
                {symbol.toUpperCase()}/{pair}
              </h2>
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <div className="flex items-center space-x-1" title="Connected to Binance API">
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1" title="Disconnected from Binance API">
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">OFFLINE</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                {formatPrice(stats.currentPrice)}
              </span>
              <div className={`flex items-center space-x-1 ${
                stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.change24h >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowMA(!showMA)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                showMA
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-600/50 border border-slate-600/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>MA</span>
            </button>

            <div className="flex bg-slate-700/50 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setSelectedTimeframe(tf.key)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === tf.key
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-400">24h High</span>
            <div className="text-green-400 font-semibold">{formatPrice(stats.high24h)}</div>
          </div>
          <div>
            <span className="text-slate-400">24h Low</span>
            <div className="text-red-400 font-semibold">{formatPrice(stats.low24h)}</div>
          </div>
          <div>
            <span className="text-slate-400">24h Volume</span>
            <div className="text-cyan-400 font-semibold">{formatVolume(stats.volume24h)}</div>
          </div>
        </div>

        {showMA && (
          <div className="flex items-center space-x-4 mt-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-amber-500"></div>
              <span className="text-amber-500">MA10</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-violet-500"></div>
              <span className="text-violet-500">MA20</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm z-10 rounded-b-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2 mx-auto"></div>
              <p className="text-slate-400 text-sm">Loading live data from Binance...</p>
            </div>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm z-10 rounded-b-lg">
            <div className="text-center max-w-md p-4">
              <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-sm mb-2">Connection Error</p>
              <p className="text-slate-400 text-xs">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
        <div 
          ref={chartContainerRef} 
          className="w-full rounded-b-lg"
          style={{ height: '500px' }}
        />
      </div>
    </div>
  );
};

export default TradeChart;
