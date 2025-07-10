import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Star, Menu, Bell, User, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCryptoData } from "@/hooks/useCryptoData";
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 4 : 2
  }).format(price);
};
const formatMarketCap = (value: number) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
};
const formatVolume = (volume: number) => {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toFixed(0);
};
type SortField = "name" | "price" | "change24h" | "marketCap" | "volume24h";
type SortDirection = "asc" | "desc";
const Index = () => {
  const {
    cryptoData,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    toggleFavorite,
    refetch
  } = useCryptoData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("marketCap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["ethereum"]));
  const featuredCoins = cryptoData.slice(0, 4);
  const handleFavoriteToggle = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    toggleFavorite(id);
  };
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  const filteredAndSortedData = useMemo(() => {
    let filtered = cryptoData.filter(crypto => crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) || crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || crypto.pair.toLowerCase().includes(searchTerm.toLowerCase()));
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      switch (sortField) {
        case "name":
          return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "change24h":
          aValue = a.change24h;
          bValue = b.change24h;
          break;
        case "marketCap":
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case "volume24h":
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        default:
          return 0;
      }
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
    return filtered;
  }, [cryptoData, searchTerm, sortField, sortDirection]);
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Binance Connection Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={refetch} className="bg-red-500 hover:bg-red-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                  B
                </div>
                <span className="text-2xl font-bold text-white">Btop Exchange</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-6">
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Markets</a>
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Futures</a>
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Assets</a>
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Support Center</a>
                <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Announcements</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input type="text" placeholder="Search cryptocurrencies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20" />
              </div>
              
              {/* Binance Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected && !isLoading && !error ? <div className="flex items-center space-x-1" title="Connected to Binance">
                    <Wifi className="w-4 h-4 text-green-400" />
                    
                  </div> : isLoading ? <div className="flex items-center space-x-1" title="Connecting to Binance...">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-yellow-400 hidden sm:inline">SYNC</span>
                  </div> : <div className="flex items-center space-x-1" title="Disconnected from Binance">
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 hidden sm:inline">OFFLINE</span>
                  </div>}
              </div>

              <Button onClick={refetch} variant="ghost" size="icon" className="text-slate-300 hover:text-white" title="Refresh Data">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <User className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {isLoading && <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading real-time data from Binance...</p>
          </div>
        </div>}

      {/* Main Content */}
      {!isLoading && <div className="container mx-auto px-4 py-8">
          {/* Last Update Indicator */}
          {lastUpdate && <div className="text-center mb-6">
              
            </div>}

          {/* Featured Coins Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredCoins.map(coin => <div key={coin.id} className="bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {coin.logo}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{coin.symbol}</h3>
                      <p className="text-slate-400 text-sm">{coin.name}</p>
                    </div>
                  </div>
                  <button onClick={() => handleFavoriteToggle(coin.id)} className="text-slate-400 hover:text-yellow-400 transition-colors">
                    <Star className={`w-5 h-5 ${favorites.has(coin.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">{formatPrice(coin.price)}</div>
                  <div className={`flex items-center space-x-1 ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-semibold">
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400 text-xs">Live Chart</span>
                  </div>
                </div>
              </div>)}
          </div>

          {/* Markets Table */}
          <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/50 overflow-hidden">
            
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold">Favorite</th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => handleSort("name")}>
                      Pair
                      {sortField === "name" && <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>}
                    </th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => handleSort("price")}>
                      Price
                      {sortField === "price" && <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>}
                    </th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => handleSort("change24h")}>
                      24H Change
                      {sortField === "change24h" && <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>}
                    </th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold">24H High</th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold">24H Low</th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => handleSort("volume24h")}>
                      24H Volume
                      {sortField === "volume24h" && <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>}
                    </th>
                    <th className="text-left py-4 px-6 text-slate-300 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((crypto, index) => <tr key={crypto.id} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-all duration-200 group">
                      <td className="py-4 px-6">
                        <button onClick={() => handleFavoriteToggle(crypto.id)} className="text-slate-400 hover:text-yellow-400 transition-colors">
                          <Star className={`w-4 h-4 ${favorites.has(crypto.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {crypto.logo}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{crypto.pair}</div>
                            <div className="text-sm text-slate-400">{crypto.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white font-semibold">
                        {formatPrice(crypto.price)}
                      </td>
                      <td className="py-4 px-6">
                        <div className={`flex items-center space-x-1 ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {crypto.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-semibold">
                            {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-green-400 font-medium">
                        {formatPrice(crypto.high24h)}
                      </td>
                      <td className="py-4 px-6 text-red-400 font-medium">
                        {formatPrice(crypto.low24h)}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {formatVolume(crypto.volume24h)}
                      </td>
                      <td className="py-4 px-6">
                        <Link to={`/trade/${crypto.symbol.toLowerCase()}`}>
                          <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 group-hover:scale-105">
                            Trade
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>}
    </div>;
};
export default Index;