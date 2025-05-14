
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Trash2 } from "lucide-react";
import AlertCard from "@/components/alerts/AlertCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlerts, deleteAlert, updateAlert } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export interface Alert {
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
  const queryClient = useQueryClient();
  
  // Fetch alerts from the API with proper typing
  const { data: alerts, isLoading, error } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("Alert deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete alert", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Update alert status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alert> }) => updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("Alert updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update alert", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      data: { is_active: !currentStatus },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <AlertCircle className="text-red-500 mr-2" />
        <p className="text-red-700">Failed to load alerts</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">No alerts configured</p>
        <p className="text-gray-400 text-sm mb-4">Create an alert to get notified about important log events</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert: Alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDelete={() => handleDelete(alert.id)}
          onToggleActive={() => handleToggleActive(alert.id, alert.is_active)}
        />
      ))}
    </div>
  );
};

export default AlertList;
