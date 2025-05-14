
import AnomalyCard from "./AnomalyCard";
import { useAnomalyWebSocket } from "@/hooks/useAnomalyWebSocket";

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

export default AnomalySection;
