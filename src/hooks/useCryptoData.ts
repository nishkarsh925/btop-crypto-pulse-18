import { useState, useEffect, useCallback } from 'react';
import { binanceService, BinancePriceData } from '@/services/binanceApi';
import { websocketService } from '@/services/websocketService';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
  logo: string;
  isFavorite: boolean;
}

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'DOT', 'LINK', 'LTC', 'DOGE'];

const CRYPTO_CONFIG = {
  'BTC': { name: 'Bitcoin', logo: '₿' },
  'ETH': { name: 'Ethereum', logo: 'Ξ' },
  'XRP': { name: 'XRP', logo: '◊' },
  'ADA': { name: 'Cardano', logo: '₳' },
  'SOL': { name: 'Solana', logo: '◎' },
  'DOT': { name: 'Polkadot', logo: '●' },
  'LINK': { name: 'Chainlink', logo: '⬢' },
  'LTC': { name: 'Litecoin', logo: 'Ł' },
  'DOGE': { name: 'Dogecoin', logo: 'Ð' }
};

export const useCryptoData = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const convertApiDataToCryptoData = useCallback((apiData: { [key: string]: BinancePriceData }): CryptoData[] => {
    return Object.entries(apiData).map(([symbol, data]) => ({
      id: symbol.toLowerCase(),
      symbol: symbol.toUpperCase(),
      name: CRYPTO_CONFIG[symbol as keyof typeof CRYPTO_CONFIG]?.name || symbol,
      pair: `${symbol.toUpperCase()}/USDT`,
      price: data.current_price,
      change24h: data.price_change_percentage_24h,
      high24h: data.high_24h,
      low24h: data.low_24h,
      marketCap: data.market_cap || 0,
      volume24h: data.total_volume,
      logo: CRYPTO_CONFIG[symbol as keyof typeof CRYPTO_CONFIG]?.logo || '●',
      isFavorite: symbol === 'ETH'
    }));
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching initial crypto data...');
      
      // Try to get server time first (this will trigger fallback mode if needed)
      await binanceService.getServerTime();
      
      const apiData = await binanceService.getCurrentPrice(CRYPTO_SYMBOLS);
      
      if (Object.keys(apiData).length === 0) {
        throw new Error('No data received from API');
      }
      
      const formattedData = convertApiDataToCryptoData(apiData);
      
      setCryptoData(formattedData);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      // Check if we're using fallback data
      if (binanceService.isUsingFallback()) {
        console.log('Using fallback data due to API connectivity issues');
        setError('Using demo data - Binance API unavailable due to browser CORS restrictions');
      } else {
        console.log('Successfully loaded live data from Binance:', formattedData.length, 'coins');
      }
      
    } catch (err) {
      console.error('Failed to fetch crypto data:', err);
      
      let errorMessage = 'Failed to load cryptocurrency data';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
          errorMessage = 'Browser security restrictions prevent direct API access. Using demo data instead.';
        } else if (err.message.includes('401')) {
          errorMessage = 'Authentication error: Invalid API credentials.';
        } else if (err.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
        } else {
          errorMessage = `API Error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [convertApiDataToCryptoData]);

  const handlePriceUpdate = useCallback((update: { symbol: string; price: number; change24h: number }) => {
    console.log('Received price update:', update);
    
    setCryptoData(prevData => 
      prevData.map(crypto => 
        crypto.symbol.toLowerCase() === update.symbol.toLowerCase()
          ? { ...crypto, price: update.price, change24h: update.change24h }
          : crypto
      )
    );
    setLastUpdate(new Date());
    setIsConnected(true);
  }, []);

  useEffect(() => {
    fetchInitialData();

    // Only try WebSocket if not in fallback mode
    let unsubscribe: (() => void) | undefined;
    let wsTimer: NodeJS.Timeout | undefined;
    let statusTimer: NodeJS.Timeout | undefined;

    // Check if we should use WebSocket after initial data load
    const setupWebSocket = () => {
      if (!binanceService.isUsingFallback()) {
        unsubscribe = websocketService.subscribe(handlePriceUpdate);
        
        wsTimer = setTimeout(() => {
          websocketService.connect(CRYPTO_SYMBOLS);
        }, 1000);

        statusTimer = setInterval(() => {
          const connected = websocketService.isConnected();
          setIsConnected(connected);
          
          if (!connected && !binanceService.isUsingFallback()) {
            console.log('WebSocket disconnected, attempting to reconnect...');
            websocketService.connect(CRYPTO_SYMBOLS);
          }
        }, 5000);
      } else {
        console.log('Skipping WebSocket connection due to fallback mode');
      }
    };

    // Setup WebSocket after a short delay to allow initial data to load
    const setupTimer = setTimeout(setupWebSocket, 2000);

    return () => {
      clearTimeout(setupTimer);
      if (wsTimer) clearTimeout(wsTimer);
      if (statusTimer) clearInterval(statusTimer);
      if (unsubscribe) unsubscribe();
      websocketService.disconnect();
    };
  }, [fetchInitialData, handlePriceUpdate]);

  const toggleFavorite = useCallback((id: string) => {
    setCryptoData(prevData =>
      prevData.map(crypto =>
        crypto.id === id ? { ...crypto, isFavorite: !crypto.isFavorite } : crypto
      )
    );
  }, []);

  const refetch = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    cryptoData,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    toggleFavorite,
    refetch
  };
};
