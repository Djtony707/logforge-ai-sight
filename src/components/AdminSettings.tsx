
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Plus, Trash } from "lucide-react";

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

interface NewAlert {
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
}

const DEFAULT_NEW_ALERT: NewAlert = {
  name: "",
  description: "",
  severity: "warning",
  query: "",
  is_active: true,
};

const severityColors: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  critical: "bg-red-700",
};

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [newAlert, setNewAlert] = useState<NewAlert>(DEFAULT_NEW_ALERT);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch alerts
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetchApi<Alert[]>("/alerts"),
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: (alert: NewAlert) => fetchApi<Alert>("/alerts", {
      method: "POST",
      body: alert,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setNewAlert(DEFAULT_NEW_ALERT);
      setIsCreating(false);
      toast({
        title: "Alert created",
        description: "Your alert rule has been created successfully.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create alert",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update alert mutation
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

  // Delete alert mutation
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

  const toggleAlertActive = (alert: Alert) => {
    updateAlertMutation.mutate({
      id: alert.id,
      data: { is_active: !alert.is_active },
    });
  };

  const handleCreateAlert = () => {
    if (!newAlert.name || !newAlert.query) {
      toast({
        title: "Validation Error",
        description: "Please provide both a name and a query for the alert.",
        variant: "destructive",
      });
      return;
    }
    
    createAlertMutation.mutate(newAlert);
  };

  const handleDeleteAlert = (alertId: number) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteAlertMutation.mutate(alertId);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Alert Management</h2>
        <div className="bg-red-50 p-4 rounded-lg text-red-800">
          <div className="flex items-center mb-2">
            <AlertCircle className="mr-2" />
            <h3 className="font-semibold">Error loading alerts</h3>
          </div>
          <p>{error instanceof Error ? error.message : "Unknown error occurred"}</p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alert Management</h2>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Alert
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>Configure a new log alert rule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Alert Name</Label>
                <Input
                  id="name"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                  placeholder="High CPU Usage Alert"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({...newAlert, description: e.target.value})}
                  placeholder="Alert triggered when CPU usage is consistently high"
                  rows={2}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={newAlert.severity}
                  onValueChange={(value) => setNewAlert({...newAlert, severity: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="query">
                  Query (SQL WHERE clause)
                  <span className="text-xs text-gray-500 ml-2">
                    Example: host = 'web-server' AND severity = 'error'
                  </span>
                </Label>
                <Textarea
                  id="query"
                  value={newAlert.query}
                  onChange={(e) => setNewAlert({...newAlert, query: e.target.value})}
                  placeholder="msg LIKE '%CPU usage > 90%'"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newAlert.is_active}
                  onCheckedChange={(checked) => setNewAlert({...newAlert, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert} disabled={createAlertMutation.isPending}>
              {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && alerts.length === 0 && !isCreating ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No alerts configured yet. Create your first alert to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
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
                    onClick={() => handleDeleteAlert(alert.id)}
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
                    onCheckedChange={() => toggleAlertActive(alert)}
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
