
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Trash2 } from "lucide-react";
import AlertCard from "@/components/alerts/AlertCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlerts, deleteAlert, updateAlert, Alert } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AlertList = () => {
  const queryClient = useQueryClient();
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
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
      setConfirmDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete alert", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setConfirmDialogOpen(false);
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

  const handleDeleteClick = (id: number) => {
    setAlertToDelete(id);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (alertToDelete !== null) {
      deleteMutation.mutate(alertToDelete);
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
    <>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDelete={() => handleDeleteClick(alert.id)}
            onToggleActive={() => handleToggleActive(alert.id, alert.is_active)}
          />
        ))}
      </div>
      
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this alert? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AlertList;
