
import TradingViewChart from './TradingViewChart';

interface TradingChartProps {
  symbol: string;
  chartType: "candlestick" | "line" | "area";
  timeframe: string;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol, chartType, timeframe }) => {
  // Convert timeframe to TradingView format
  const convertTimeframe = (tf: string) => {
    const mapping: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '1d': '1D',
      '1w': '1W'
    };
    return mapping[tf.toLowerCase()] || '60';
  };

  return (
    <div className="h-full">
      <TradingViewChart 
        symbol={symbol}
        interval={convertTimeframe(timeframe)}
        theme="dark"
        className="h-full"
      />
    </div>
  );
};

export default TradingChart;
