import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Star, Heart, BarChart3, Activity, TrendingUp as LineChart, AreaChart, Clock, DollarSign, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingChart from "@/components/TradingChart";
import { coinGeckoService, CoinGeckoPriceData } from "@/services/coinGeckoApi";

// Static crypto details for basic info (name, logo, description)
const cryptoBasicInfo: Record<string, any> = {
  btc: {
    symbol: "BTC",
    name: "Bitcoin",
    logo: "₿",
    description: "Bitcoin is the world's first cryptocurrency and digital payment system."
  },
  eth: {
    symbol: "ETH", 
    name: "Ethereum",
    logo: "Ξ",
    description: "Ethereum is a decentralized platform for smart contracts and DApps."
  },
  bnb: {
    symbol: "BNB",
    name: "BNB",
    logo: "⬡",
    description: "BNB is the native token of the Binance ecosystem."
  },
  ada: {
    symbol: "ADA",
    name: "Cardano",
    logo: "₳",
    description: "Cardano is a blockchain platform for smart contracts."
  },
  sol: {
    symbol: "SOL",
    name: "Solana",
    logo: "◎",
    description: "Solana is a high-performance blockchain for DeFi and Web3."
  },
  dot: {
    symbol: "DOT",
    name: "Polkadot",
    logo: "●",
    description: "Polkadot enables cross-blockchain transfers and interoperability."
  },
  link: {
    symbol: "LINK",
    name: "Chainlink",
    logo: "⬢",
    description: "Chainlink provides real-world data to smart contracts."
  },
  ltc: {
    symbol: "LTC",
    name: "Litecoin",
    logo: "Ł",
    description: "Litecoin is a peer-to-peer cryptocurrency for fast, low-cost payments."
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
};

const formatMarketCap = (value: number) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
};

const Trade = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  const [timeframe, setTimeframe] = useState("1D");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [cryptoData, setCryptoData] = useState<CoinGeckoPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const basicInfo = symbol ? cryptoBasicInfo[symbol.toLowerCase()] : null;

  // Fetch real-time data with improved error handling
  const fetchCryptoData = async () => {
    if (!symbol) return;
    
    try {
      setError(null);
      
      console.log(`Fetching data for ${symbol.toUpperCase()}`);
      const data = await coinGeckoService.getCurrentPrice([symbol.toUpperCase()]);
      const cryptoInfo = data[symbol.toUpperCase()];
      
      if (cryptoInfo) {
        setCryptoData(cryptoInfo);
        console.log('Successfully updated crypto data:', cryptoInfo);
      } else {
        throw new Error('Cryptocurrency data not found in response');
      }
    } catch (err) {
      console.error('Failed to fetch crypto data:', err);
      setError('Unable to fetch real-time data. Using fallback data.');
      
      // Set fallback data
      const fallbackData: CoinGeckoPriceData = {
        id: symbol.toLowerCase(),
        current_price: 111000,
        price_change_percentage_24h: 1.5,
        market_cap: 2200000000000,
        total_volume: 40000000000,
        high_24h: 112000,
        low_24h: 109000,
        last_updated: new Date().toISOString()
      };
      setCryptoData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCryptoData();
  }, [symbol]);

  // Auto-refresh data every 1 second with connection status
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchCryptoData();
    }, 1000);

    return () => clearInterval(interval);
  }, [symbol]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setQuantityPercent = (percent: number) => {
    setOrderQuantity((1000 * percent / 100).toString()); // Mock calculation
  };

  if (!basicInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Cryptocurrency Not Found</h1>
          <p className="text-slate-400 mb-8">The cryptocurrency you're looking for doesn't exist.</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Markets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Market Data</h2>
          <p className="text-slate-400">Connecting to live market data...</p>
        </div>
      </div>
    );
  }

  if (!cryptoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Error Loading Data</h1>
          <p className="text-slate-400 mb-8">Failed to load cryptocurrency data</p>
          <div className="space-y-4">
            <Button 
              onClick={fetchCryptoData}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 mr-4"
            >
              Retry Connection
            </Button>
            <Link to="/">
              <Button variant="outline" className="border-slate-600 text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Markets</span>
            </Link>
            <div className="h-6 w-px bg-slate-600"></div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {basicInfo.logo}
              </div>
              <div>
                <span className="text-white font-semibold">{basicInfo.name}</span>
                <span className="text-slate-400 ml-2">{basicInfo.symbol}/USDT</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-white">{formatPrice(cryptoData.current_price)}</span>
            <div className={`flex items-center space-x-1 ${
              cryptoData.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {cryptoData.price_change_percentage_24h >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-semibold">
                {cryptoData.price_change_percentage_24h >= 0 ? '+' : ''}{cryptoData.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCryptoData}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Trading Chart */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/30 backdrop-blur-lg border-slate-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <span>{basicInfo.name} Chart</span>
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    {/* Chart Type Selector */}
                    <div className="flex bg-slate-700/50 rounded-lg p-1">
                      <button
                        onClick={() => setChartType("candlestick")}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          chartType === "candlestick" 
                            ? 'bg-cyan-500 text-white' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChartType("line")}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          chartType === "line" 
                            ? 'bg-cyan-500 text-white' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChartType("area")}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          chartType === "area" 
                            ? 'bg-cyan-500 text-white' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AreaChart className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Timeframe Selector */}
                    <div className="flex bg-slate-700/50 rounded-lg p-1">
                      {["1m", "5m", "15m", "30m", "1h", "1d", "1w"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-3 py-1 rounded text-sm transition-all ${
                            timeframe === tf 
                              ? 'bg-cyan-500 text-white' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TradingChart 
                  symbol={basicInfo.symbol}
                  chartType={chartType}
                  timeframe={timeframe}
                />
              </CardContent>
            </Card>

            {/* Trading Tabs */}
            <div className="mt-6">
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                  <TabsTrigger value="positions">Position Orders</TabsTrigger>
                  <TabsTrigger value="history">Historical Orders</TabsTrigger>
                  <TabsTrigger value="invites">Invites</TabsTrigger>
                  <TabsTrigger value="followup">Follow-Up Plan</TabsTrigger>
                </TabsList>
                <TabsContent value="positions" className="bg-slate-800/30 backdrop-blur-lg rounded-lg p-6 border border-slate-700/50">
                  <p className="text-slate-400">No active positions</p>
                </TabsContent>
                <TabsContent value="history" className="bg-slate-800/30 backdrop-blur-lg rounded-lg p-6 border border-slate-700/50">
                  <p className="text-slate-400">No historical orders</p>
                </TabsContent>
                <TabsContent value="invites" className="bg-slate-800/30 backdrop-blur-lg rounded-lg p-6 border border-slate-700/50">
                  <p className="text-slate-400">No invites</p>
                </TabsContent>
                <TabsContent value="followup" className="bg-slate-800/30 backdrop-blur-lg rounded-lg p-6 border border-slate-700/50">
                  <p className="text-slate-400">No follow-up plans</p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Enhanced Trading Sidebar */}
          <div className="space-y-6">
            {/* Trading Panel */}
            <Card className="bg-slate-800/30 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  <span>Trade {basicInfo.symbol}</span>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Call/Put Options */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="text-green-400 font-semibold text-sm">CALL</div>
                    <div className="text-green-400 text-xs">
                      {cryptoData.price_change_percentage_24h >= 0 ? '+' : ''}{cryptoData.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="text-red-400 font-semibold text-sm">PUT</div>
                    <div className="text-red-400 text-xs">
                      {cryptoData.price_change_percentage_24h >= 0 ? '' : '+'}{(-cryptoData.price_change_percentage_24h).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Order Quantity */}
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Order Quantity (USDT)</label>
                  <input
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
                  />
                  <div className="flex space-x-2 mt-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setQuantityPercent(percent)}
                        className="flex-1 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg hover:shadow-green-500/25 transition-all duration-200 hover:scale-105">
                    Buy {basicInfo.symbol}
                  </Button>
                  <Button className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-105">
                    Sell {basicInfo.symbol}
                  </Button>
                </div>

                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-cyan-500/25 transition-all duration-200">
                  Advanced Trade
                </Button>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((180 - timeRemaining) / 180) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Assets Panel */}
            <Card className="bg-slate-800/30 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available Balance</span>
                    <span className="text-white font-semibold">$12,450.67</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">In Orders</span>
                    <span className="text-white font-semibold">$2,340.12</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700/50">
                    Deposit
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700/50">
                    Withdraw
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700/50">
                    Transfer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Market Stats */}
            <Card className="bg-slate-800/30 backdrop-blur-lg border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Market Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h High</span>
                    <span className="text-green-400 font-semibold">{formatPrice(cryptoData.high_24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Low</span>
                    <span className="text-red-400 font-semibold">{formatPrice(cryptoData.low_24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Volume</span>
                    <span className="text-white font-semibold">{formatMarketCap(cryptoData.total_volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Cap</span>
                    <span className="text-white font-semibold">{formatMarketCap(cryptoData.market_cap)}</span>
                  </div>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => setIsWatchlisted(!isWatchlisted)}
                  className={`w-full border-slate-600 transition-all duration-200 ${
                    isWatchlisted 
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Star className={`w-4 h-4 mr-2 ${isWatchlisted ? 'fill-current' : ''}`} />
                  {isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
