
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AlertForm from "@/components/alerts/AlertForm";
import AlertList from "@/components/alerts/AlertList";

const AdminSettings = () => {
  const [isCreating, setIsCreating] = useState(false);

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

      {isCreating ? (
        <AlertForm onCancel={() => setIsCreating(false)} />
      ) : (
        <AlertList />
      )}
    </div>
  );
};

export default AdminSettings;
