
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AlertCard from "./AlertCard";

interface Alert {
  id: number;
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
  created_at: string;
  last_triggered?: string;
}

const AlertList = () => {
  const { data: alerts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetchApi<Alert[]>("/alerts"),
  });

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-800">
        <div className="flex items-center mb-2">
          <AlertCircle className="mr-2" />
          <h3 className="font-semibold">Error loading alerts</h3>
        </div>
        <p>{error instanceof Error ? error.message : "Unknown error occurred"}</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No alerts configured yet. Create your first alert to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
};

export default AlertList;
