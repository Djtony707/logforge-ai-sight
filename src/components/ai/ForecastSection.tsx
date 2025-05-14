
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ForecastData {
  date: string;
  actual?: number;
  predicted: number;
  lower_bound?: number;
  upper_bound?: number;
}

const ForecastSection = () => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        // In a real implementation, we would call our API
        // const data = await fetchApi<ForecastData[]>("/ai/forecast");
        
        // For demonstration, we'll use mock data
        // This simulates 3 days of historical data and 7 days of forecast
        const mockData: ForecastData[] = [];
        
        // Historical data (past 3 days)
        for (let i = 10; i >= 1; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            actual: Math.floor(Math.random() * 500) + 1500,
            predicted: Math.floor(Math.random() * 500) + 1500,
            lower_bound: Math.floor(Math.random() * 400) + 1300,
            upper_bound: Math.floor(Math.random() * 400) + 1900
          });
        }
        
        // Today
        mockData.push({
          date: new Date().toISOString().split('T')[0],
          actual: Math.floor(Math.random() * 500) + 1600,
          predicted: Math.floor(Math.random() * 500) + 1600,
          lower_bound: Math.floor(Math.random() * 400) + 1400,
          upper_bound: Math.floor(Math.random() * 400) + 2000
        });
        
        // Future data (next 7 days)
        for (let i = 1; i <= 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            predicted: Math.floor(Math.random() * 500) + 1700,
            lower_bound: Math.floor(Math.random() * 400) + 1400,
            upper_bound: Math.floor(Math.random() * 400) + 2100
          });
        }
        
        setForecastData(mockData);
      } catch (error) {
        console.error("Failed to fetch forecast:", error);
        toast.error("Failed to load forecast data");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="h-[300px] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={forecastData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            tick={{ fontSize: 12 }} 
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`${value} logs`, '']}
            labelFormatter={formatDate}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#8884d8"
            name="Actual"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#82ca9d"
            name="Forecast"
            strokeWidth={2}
            strokeDasharray={forecastData.findIndex(d => !d.actual) > -1 ? "0" : "3 3"}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="upper_bound"
            stroke="#ccc"
            name="Upper Bound"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="lower_bound"
            stroke="#ccc"
            name="Lower Bound"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-xs text-center text-gray-500 mt-2">
        Forecasted log volume based on historical patterns
      </div>
    </div>
  );
};

export default ForecastSection;
