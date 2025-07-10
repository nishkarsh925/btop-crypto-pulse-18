
import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Wifi, WifiOff, Settings } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  className?: string;
  interval?: string;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  className = "",
  interval = "1H",
  theme = "dark"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  // Load TradingView library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      console.log('TradingView library loaded successfully');
      initializeChart();
    };
    script.onerror = () => {
      setError('Failed to load TradingView library');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.log('Widget cleanup error:', e);
        }
      }
    };
  }, []);

  // Initialize chart when symbol or interval changes
  useEffect(() => {
    if (window.TradingView && containerRef.current) {
      initializeChart();
    }
  }, [symbol, interval, theme]);

  const initializeChart = () => {
    if (!containerRef.current || !window.TradingView) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clear existing widget
      if (widgetRef.current) {
        widgetRef.current.remove();
      }

      // Convert symbol to TradingView format (e.g., BTC -> BTCUSDT)
      const tradingViewSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;

      console.log(`Initializing TradingView chart for ${tradingViewSymbol}`);

      const widget = new window.TradingView.widget({
        autosize: true,
        symbol: tradingViewSymbol,
        interval: interval,
        container: containerRef.current,
        locale: "en",
        disabled_features: [
          "use_localstorage_for_settings",
          "volume_force_overlay",
          "header_symbol_search",
          "header_screenshot",
          "header_chart_type",
          "header_compare",
          "header_undo_redo",
          "header_settings"
        ],
        enabled_features: [
          "study_templates"
        ],
        fullscreen: false,
        theme: theme,
        style: "1",
        toolbar_bg: theme === 'dark' ? '#1e293b' : '#ffffff',
        loading_screen: {
          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          foregroundColor: theme === 'dark' ? '#64748b' : '#475569'
        },
        overrides: {
          "paneProperties.background": theme === 'dark' ? "#0f172a" : "#ffffff",
          "paneProperties.vertGridProperties.color": theme === 'dark' ? "#374151" : "#e5e7eb",
          "paneProperties.horzGridProperties.color": theme === 'dark' ? "#374151" : "#e5e7eb",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor": theme === 'dark' ? "#94a3b8" : "#475569",
          "mainSeriesProperties.candleStyle.upColor": "#10b981",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.drawWick": true,
          "mainSeriesProperties.candleStyle.drawBorder": true,
          "mainSeriesProperties.candleStyle.borderColor": "#374151",
          "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
          "volumePaneSize": "medium"
        },
        studies_overrides: {
          "volume.volume.color.0": "#ef4444",
          "volume.volume.color.1": "#10b981"
        }
      });

      widget.onChartReady(() => {
        console.log('TradingView chart ready');
        setIsLoading(false);
        setIsConnected(true);

        // Subscribe to real-time data
        widget.subscribe('onTick', (data: any) => {
          if (data && data.price) {
            setCurrentPrice(data.price);
            setPriceChange(data.change || 0);
          }
        });

        // Get current symbol info
        widget.symbolInfo((symbolInfo: any) => {
          console.log('Symbol info:', symbolInfo);
          if (symbolInfo) {
            setCurrentPrice(symbolInfo.last_price || 0);
            setPriceChange(symbolInfo.change || 0);
          }
        });
      });

      widgetRef.current = widget;

    } catch (err) {
      console.error('Error initializing TradingView chart:', err);
      setError('Failed to initialize TradingView chart. Using fallback data.');
      setIsLoading(false);
      setIsConnected(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: symbol === 'BTC' ? 2 : 4,
    }).format(price);
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
                {symbol.toUpperCase()}/USDT
              </h2>
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <div className="flex items-center space-x-1" title="Connected to TradingView">
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1" title="Disconnected">
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">OFFLINE</span>
                  </div>
                )}
              </div>
            </div>
            
            {currentPrice > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-white">
                  {formatPrice(currentPrice)}
                </span>
                <div className={`flex items-center space-x-1 ${
                  priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-semibold">
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Powered by TradingView</span>
            <Settings className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm z-10 rounded-b-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2 mx-auto"></div>
              <p className="text-slate-400 text-sm">Loading TradingView chart...</p>
            </div>
          </div>
        )}
        
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm z-10 rounded-b-lg">
            <div className="text-center max-w-md p-4">
              <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-sm mb-2">Chart Loading Error</p>
              <p className="text-slate-400 text-xs">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                Reload Chart
              </button>
            </div>
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className="w-full rounded-b-lg"
          style={{ height: '500px' }}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
