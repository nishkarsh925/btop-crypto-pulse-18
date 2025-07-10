
import TradeChart from './TradeChart';

interface TradingChartProps {
  symbol: string;
  chartType: "candlestick" | "line" | "area";
  timeframe: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol, chartType, timeframe }) => {
  // Use the new TradeChart component with CoinGecko API
  
  return (
    <div className="h-full">
      <TradeChart 
        symbol={symbol} 
        pair="USD"
        className="h-full"
      />
    </div>
  );
};

export default TradingChart;
