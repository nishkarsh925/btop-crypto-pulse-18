import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { timeframes } from '@/data/mockKlines';
import { binanceService, FormattedCandleData } from '@/services/binanceApi';
import { TrendingUp, TrendingDown, BarChart3, Wifi, WifiOff } from 'lucide-react';

interface CandlestickChartProps {
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
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  symbol, 
  pair = "USDT",
  className = "" 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [chartData, setChartData] = useState<FormattedCandleData[]>([]);
  const [stats, setStats] = useState<ChartStats>({
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    change24h: 0,
    currentPrice: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from chart data
  const calculateStats = (data: FormattedCandleData[]): ChartStats => {
    if (data.length === 0) return { high24h: 0, low24h: 0, volume24h: 0, change24h: 0, currentPrice: 0 };
    
    const high24h = Math.max(...data.slice(-24).map(d => d.high));
    const low24h = Math.min(...data.slice(-24).map(d => d.low));
    const volume24h = data.slice(-24).reduce((sum, d) => sum + d.volume, 0);
    const currentPrice = data[data.length - 1].close;
    const previousPrice = data[data.length - 2]?.close || currentPrice;
    const change24h = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    return { high24h, low24h, volume24h, change24h, currentPrice };
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
      height: 400,
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

    // Create candlestick series using correct API
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    // Create volume series using correct API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#06b6d4',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Configure volume series positioning
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
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

  // Load data when symbol or timeframe changes
  useEffect(() => {
    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch real-time data from Binance API
        const klineData = await binanceService.getKlineData(symbol, selectedTimeframe, 500);
        const tickerData = await binanceService.getTicker24hr(symbol);
        
        setChartData(klineData);
        
        // Calculate stats from API data
        const statsFromApi = {
          high24h: parseFloat(tickerData.highPrice),
          low24h: parseFloat(tickerData.lowPrice),
          volume24h: parseFloat(tickerData.volume),
          change24h: parseFloat(tickerData.priceChangePercent),
          currentPrice: parseFloat(tickerData.lastPrice)
        };
        
        setStats(statsFromApi);
        setIsConnected(true);
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

    // Convert data for lightweight-charts
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

    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Add custom tooltip
    if (chartRef.current) {
      chartRef.current.subscribeCrosshairMove((param) => {
        if (!param.time || !param.point) return;
        
        const data = param.seriesData.get(candlestickSeriesRef.current!);
        if (data) {
          // Custom tooltip logic can be added here
          console.log('Hover data:', data);
        }
      });
    }
  }, [chartData]);

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
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

          {/* Timeframe Selector */}
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

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 text-sm">
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
          className="w-full h-96 rounded-b-lg"
          style={{ height: '400px' }}
        />
      </div>
    </div>
  );
};

export default CandlestickChart;
