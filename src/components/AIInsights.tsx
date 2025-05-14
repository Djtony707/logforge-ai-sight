
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Search, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useAnomalyWebSocket, Anomaly } from "@/hooks/useAnomalyWebSocket";
import { useToast } from "@/components/ui/use-toast";

interface ForecastDataPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

const AnomalySection = () => {
  const { anomalies } = useAnomalyWebSocket(10);
  
  if (anomalies.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No anomalies detected yet</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 max-h-[300px] overflow-auto">
      {anomalies.map((anomaly) => (
        <AnomalyCard key={anomaly.id} anomaly={anomaly} />
      ))}
    </div>
  );
};

const AnomalyCard = ({ anomaly }: { anomaly: Anomaly }) => {
  return (
    <div 
      className="p-3 bg-red-50 border border-red-100 rounded-md"
    >
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium">{anomaly.host} - {anomaly.app}</div>
        <Badge variant="outline" className="ml-2 border-red-300 text-red-700">
          Score: {anomaly.anomaly_score.toFixed(2)}
        </Badge>
      </div>
      <div className="text-sm font-mono">{anomaly.msg}</div>
      <div className="text-xs text-gray-500 mt-1">
        {new Date(anomaly.ts).toLocaleString()}
      </div>
    </div>
  );
};

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

const NaturalLanguageSearch = () => {
  const [nlQuery, setNlQuery] = useState("");
  const [isNlProcessing, setIsNlProcessing] = useState(false);
  const { toast } = useToast();

  const handleNlSearch = async () => {
    if (!nlQuery.trim()) return;
    
    setIsNlProcessing(true);
    try {
      // In a real implementation, this would call an actual NL processing API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Query processed",
        description: `Your query "${nlQuery}" has been processed.`,
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process natural language query",
      });
    } finally {
      setIsNlProcessing(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Input
        placeholder="e.g., 'Show me all error logs from the database server in the last hour'"
        value={nlQuery}
        onChange={(e) => setNlQuery(e.target.value)}
      />
      <Button onClick={handleNlSearch} disabled={isNlProcessing || !nlQuery.trim()}>
        <Search className="mr-2 h-4 w-4" />
        {isNlProcessing ? "Processing..." : "Search"}
      </Button>
    </div>
  );
};

const AIInsights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Natural Language Search
          </CardTitle>
          <CardDescription>
            Ask questions about your logs in plain English
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NaturalLanguageSearch />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Log Volume Forecast (7 Days)
          </CardTitle>
          <CardDescription>
            Predicted daily log volume for the next week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastSection />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Live Anomalies
          </CardTitle>
          <CardDescription>
            Unusual log patterns detected in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnomalySection />
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
