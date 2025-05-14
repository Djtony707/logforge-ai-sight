
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAlert } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { severityOptions } from "@/lib/constants";

interface AlertFormProps {
  onCancel: () => void;
}

const AlertForm = ({ onCancel }: AlertFormProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("warning");
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(true);

  const mutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("Alert created successfully");
      onCancel();
    },
    onError: (error) => {
      toast.error("Failed to create alert", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      toast.error("Alert name is required");
      return;
    }
    
    if (!query.trim()) {
      toast.error("Alert query is required");
      return;
    }
    
    mutation.mutate({
      name,
      description,
      severity,
      query,
      is_active: isActive
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-medium mb-4">Create New Alert</h3>
      
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Alert Name</Label>
          <Input 
            id="name" 
            placeholder="E.g., 'Critical Errors'" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="What does this alert detect?" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="severity">Severity Level</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger id="severity">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="query">Query Pattern</Label>
          <Input 
            id="query" 
            placeholder="E.g., 'error' or 'database connection'" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">
            Simple text pattern to match in log messages
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            id="active" 
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="active">Alert Active</Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating..." : "Create Alert"}
        </Button>
      </div>
    </form>
  );
};

export default AlertForm;
