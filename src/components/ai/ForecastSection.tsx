
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

interface ForecastDataPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

const ForecastSection = () => {
  const { data: forecastData = [], isLoading } = useQuery({
    queryKey: ['forecast'],
    queryFn: () => fetchApi<ForecastDataPoint[]>('/logs/forecast'),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p>Loading forecast data...</p>
      </div>
    );
  }

  if (forecastData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No forecast data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={forecastData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={value => formatDate(value)} 
          formatter={(value) => [Number(value).toLocaleString(), ""]}
        />
        <Area 
          type="monotone" 
          dataKey="upper" 
          stroke="#8884d8" 
          fillOpacity={0.1} 
          fill="#8884d8" 
          strokeWidth={1}
        />
        <Area 
          type="monotone" 
          dataKey="predicted" 
          stroke="#8884d8" 
          fillOpacity={0.6} 
          fill="#8884d8" 
          strokeWidth={2}
        />
        <Area 
          type="monotone" 
          dataKey="lower" 
          stroke="#8884d8" 
          fillOpacity={0.1} 
          fill="#8884d8" 
          strokeWidth={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ForecastSection;
