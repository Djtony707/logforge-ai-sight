
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";

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

interface AlertCardProps {
  alert: Alert;
}

const severityColors: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  critical: "bg-red-700",
};

const AlertCard = ({ alert }: AlertCardProps) => {
  const queryClient = useQueryClient();
  
  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Alert> }) => 
      fetchApi<Alert>(`/alerts/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast({
        title: "Alert updated",
        description: "The alert has been updated successfully.",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: number) => 
      fetchApi(`/alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast({
        title: "Alert deleted",
        description: "The alert has been deleted successfully.",
      });
    },
  });

  const toggleAlertActive = () => {
    updateAlertMutation.mutate({
      id: alert.id,
      data: { is_active: !alert.is_active },
    });
  };

  const handleDeleteAlert = () => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteAlertMutation.mutate(alert.id);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {alert.name}
              <Badge className={`${severityColors[alert.severity]} text-white`}>
                {alert.severity}
              </Badge>
              {!alert.is_active && (
                <Badge variant="outline" className="ml-2">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{alert.description}</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-red-600 hover:text-red-800 hover:bg-red-100"
            onClick={handleDeleteAlert}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto">
          <code>{alert.query}</code>
        </div>
        <div className="mt-3 text-sm flex justify-between">
          <span className="text-muted-foreground">
            Created: {new Date(alert.created_at).toLocaleDateString()}
          </span>
          {alert.last_triggered && (
            <span className="text-amber-600">
              Last triggered: {new Date(alert.last_triggered).toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center space-x-2 w-full justify-end">
          <Label htmlFor={`active-${alert.id}`} className="cursor-pointer">
            {alert.is_active ? "Active" : "Inactive"}
          </Label>
          <Switch
            id={`active-${alert.id}`}
            checked={alert.is_active}
            onCheckedChange={toggleAlertActive}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default AlertCard;
