
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

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

interface AlertFormProps {
  onCancel: () => void;
}

const AlertForm = ({ onCancel }: AlertFormProps) => {
  const queryClient = useQueryClient();
  const [newAlert, setNewAlert] = useState<NewAlert>(DEFAULT_NEW_ALERT);

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: (alert: NewAlert) => fetchApi<any>("/alerts", {
      method: "POST",
      body: alert,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setNewAlert(DEFAULT_NEW_ALERT);
      onCancel();
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

  return (
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
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleCreateAlert} disabled={createAlertMutation.isPending}>
          {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AlertForm;
