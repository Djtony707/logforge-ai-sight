
import { useState } from "react";
import { useAnomalyWebSocket } from "@/hooks/useAnomalyWebSocket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import AnomalyDisplay from "@/components/ai/AnomalyDisplay";

const AnomalySection = () => {
  const { anomalies, clearAnomalies } = useAnomalyWebSocket(10);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async () => {
    if (anomalies.length === 0 || isExplaining) return;
    
    setIsExplaining(true);
    
    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      setExplanation(
        "Recent anomalies appear to be related to spike in database connection failures. " +
        "This could indicate a potential issue with the database server or connection pool configuration. " +
        "Recommendation: Check database server health and connection settings."
      );
    } catch (error) {
      console.error("Failed to get anomaly explanation:", error);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Anomalies: {anomalies.length}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAnomalies}
            disabled={anomalies.length === 0}
          >
            <RefreshCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No anomalies detected</p>
          <p className="text-xs">Real-time anomalies will appear here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {anomalies.map((anomaly) => (
            <AnomalyDisplay key={anomaly.id} anomaly={anomaly} />
          ))}
          
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleExplain}
              disabled={isExplaining}
            >
              {isExplaining ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Analyzing anomalies...
                </>
              ) : (
                "Explain these anomalies"
              )}
            </Button>
            
            {explanation && (
              <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                <h4 className="font-semibold mb-1">AI Analysis:</h4>
                <p>{explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalySection;
