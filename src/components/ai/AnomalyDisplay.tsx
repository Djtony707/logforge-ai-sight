
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Anomaly } from "@/hooks/useAnomalyWebSocket";

interface AnomalyDisplayProps {
  anomaly: Anomaly;
}

const AnomalyDisplay = ({ anomaly }: AnomalyDisplayProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'emergency':
      case 'alert':
      case 'critical':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'notice':
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const anomalyScoreColor = () => {
    const score = anomaly.anomaly_score || 0;
    if (score > 0.8) return 'text-red-600';
    if (score > 0.5) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <Card className={`p-3 mb-2 ${getSeverityColor(anomaly.severity)} border`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{new Date(anomaly.ts).toLocaleTimeString()}</p>
            <span className={`text-xs font-semibold ${anomalyScoreColor()}`}>
              Score: {(anomaly.anomaly_score * 100).toFixed(2)}%
            </span>
          </div>
          
          <p className="text-sm mt-1 font-mono">{anomaly.msg}</p>
          
          <div className="flex justify-between text-xs mt-2 text-gray-600">
            <span>Host: {anomaly.host}</span>
            <span>App: {anomaly.app}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AnomalyDisplay;
