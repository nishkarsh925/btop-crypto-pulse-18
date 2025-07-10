
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

  // Load TradingView Advanced Charts widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol.toUpperCase()}USDT`,
      interval: interval,
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      backgroundColor: theme === 'dark' ? "#0f172a" : "#ffffff",
      gridColor: theme === 'dark' ? "#374151" : "#e5e7eb",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: "tradingview_chart"
    });
    
    if (containerRef.current) {
      containerRef.current.appendChild(script);
      setIsLoading(false);
      setIsConnected(true);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, interval, theme]);

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
          id="tradingview_chart"
          className="w-full rounded-b-lg"
          style={{ height: '500px' }}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
