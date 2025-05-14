
import { Badge } from "@/components/ui/badge";
import { Anomaly } from "@/hooks/useAnomalyWebSocket";

interface AnomalyCardProps {
  anomaly: Anomaly;
}

const AnomalyCard = ({ anomaly }: AnomalyCardProps) => {
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

export default AnomalyCard;
