
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import AlertCard from "./AlertCard";
import { toast } from "sonner";

interface AlertItem {
  id: number;
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
}

const AlertList = () => {
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  
  const { data: alerts, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mock data for development without a backend
  const mockAlerts: AlertItem[] = [
    {
      id: 1,
      name: "Critical System Errors",
      description: "Monitor for any critical system errors across all services",
      severity: "critical",
      query: "severity='critical'",
      is_active: true,
    },
    {
      id: 2,
      name: "Failed Login Attempts",
      description: "Alert when multiple failed login attempts are detected",
      severity: "warning",
      query: "app='auth' AND msg LIKE '%failed login%'",
      is_active: true,
    },
    {
      id: 3,
      name: "Disk Space Warnings",
      description: "Monitor low disk space warnings",
      severity: "warning",
      query: "msg LIKE '%disk space%'",
      is_active: false,
    }
  ];

  const displayAlerts = process.env.NODE_ENV === "development" && !alerts ? mockAlerts : alerts;

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p>Loading alerts...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        Failed to load alerts. Please try again later.
      </Alert>
    );
  }

  if (!displayAlerts || displayAlerts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No alerts configured yet.</p>
        <p className="text-sm text-gray-400 mt-2">
          Create your first alert to start monitoring for important log events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayAlerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onEdit={() => setEditingAlert(alert)}
          onToggle={(isActive) => {
            // In development mode with mock data, just show toast
            if (process.env.NODE_ENV === "development" && !alerts) {
              toast.success(`Alert "${alert.name}" ${isActive ? "activated" : "deactivated"}`);
              return;
            }
            
            // Actual API call would go here
          }}
          onDelete={() => {
            // In development mode with mock data, just show toast
            if (process.env.NODE_ENV === "development" && !alerts) {
              toast.success(`Alert "${alert.name}" deleted`);
              return;
            }
            
            // Actual API call would go here
          }}
        />
      ))}
    </div>
  );
};

export default AlertList;
