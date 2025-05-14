
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getLogForecast, ForecastResponse } from "@/lib/api";
import { toast } from "sonner";

const ForecastSection = () => {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom date formatter to display dates nicely
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Fetch forecast data when component mounts
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const data = await getLogForecast();
        setForecastData(data);
      } catch (error) {
        console.error("Failed to fetch forecast data:", error);
        toast.error("Failed to load forecast data");
        
        // Set mock data for UI development
        setForecastData(getMockForecastData());
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  // Prepare data for the chart
  const prepareChartData = () => {
    if (!forecastData) return [];
    
    // Combine historical and forecast data
    const chartData = [
      ...(forecastData.historical || []).map(item => ({
        date: formatDate(item.date),
        value: item.count,
        type: "Historical"
      })),
      ...(forecastData.forecast || []).map(item => ({
        date: formatDate(item.date),
        value: item.predicted_count,
        lowerBound: item.lower_bound,
        upperBound: item.upper_bound,
        type: "Forecast"
      }))
    ];
    
    return chartData;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-44">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "8px" }}
            formatter={(value: number, name: string) => [value.toLocaleString(), name === "value" ? "Log count" : name]}
          />
          <Area 
            type="monotone" 
            dataKey="upperBound" 
            stackId="1" 
            stroke="none" 
            fill="url(#colorRange)" 
            name="Upper bound"
          />
          <Area 
            type="monotone" 
            dataKey="lowerBound" 
            stackId="2" 
            stroke="none" 
            fill="url(#colorRange)" 
            name="Lower bound"
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            fill="url(#colorHistorical)" 
            strokeWidth={2}
            name="Log volume" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Helper function to generate mock forecast data
function getMockForecastData(): ForecastResponse {
  const today = new Date();
  
  // Generate historical data (past 7 days)
  const historical = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (7 - i));
    return {
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 1000) + 1500
    };
  });
  
  // Generate forecast data (next 7 days)
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + (i + 1));
    const predicted = Math.floor(Math.random() * 800) + 1800;
    return {
      date: date.toISOString().split('T')[0],
      predicted_count: predicted,
      lower_bound: Math.floor(predicted * 0.8),
      upper_bound: Math.floor(predicted * 1.2)
    };
  });
  
  return { historical, forecast };
}

export default ForecastSection;
