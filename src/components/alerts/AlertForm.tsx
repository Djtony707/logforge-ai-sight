
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createAlert, NewAlert } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface AlertFormProps {
  onCancel: () => void;
  existingAlert?: {
    id: number;
    name: string;
    description: string;
    severity: string;
    query: string;
    is_active: boolean;
  };
}

const severityOptions = ["info", "warning", "error", "critical"];

const AlertForm = ({ onCancel, existingAlert }: AlertFormProps) => {
  const [name, setName] = useState(existingAlert?.name || "");
  const [description, setDescription] = useState(existingAlert?.description || "");
  const [severity, setSeverity] = useState(existingAlert?.severity || "warning");
  const [query, setQuery] = useState(existingAlert?.query || "");
  const [isActive, setIsActive] = useState(existingAlert?.is_active || true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !query) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const alertData: NewAlert = {
        name,
        description,
        severity,
        query,
        is_active: isActive
      };
      
      await createAlert(alertData);
      
      // Invalidate alerts cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      
      toast.success("Alert created successfully");
      onCancel(); // Close the form
    } catch (error) {
      console.error("Failed to create alert:", error);
      toast.error("Failed to create alert", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center mb-6">
        <ShieldCheck className="h-6 w-6 mr-2 text-primary" />
        <h3 className="text-xl font-semibold">
          {existingAlert ? "Edit Alert" : "Create New Alert"}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Alert Name</Label>
            <Input
              id="name"
              placeholder="Failed Login Attempts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Alert triggers when multiple failed login attempts are detected..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="query">Query Pattern</Label>
          <Textarea
            id="query"
            placeholder="app='auth' AND msg LIKE '%failed login%'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            className="font-mono"
          />
          <p className="text-sm text-gray-500 mt-1">
            Example: app='nginx' AND severity='error' OR msg LIKE '%permission denied%'
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            type="button"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : existingAlert ? "Update Alert" : "Create Alert"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AlertForm;
