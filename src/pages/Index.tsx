
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LiveFeed from "@/components/LiveFeed";
import SearchLogs from "@/components/SearchLogs";
import AIInsights from "@/components/AIInsights";
import LoginForm from "@/components/LoginForm";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<"admin" | "viewer" | null>(null);

  const handleLogin = (userRole: "admin" | "viewer") => {
    setIsAuthenticated(true);
    setRole(userRole);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole(null);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Dashboard role={role} onLogout={handleLogout}>
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          {role === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
        <TabsContent value="live" className="space-y-4">
          <LiveFeed />
        </TabsContent>
        <TabsContent value="search" className="space-y-4">
          <SearchLogs role={role} />
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <AIInsights />
        </TabsContent>
        {role === "admin" && (
          <TabsContent value="admin" className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Admin Settings</h2>
              <p className="text-gray-600 mb-4">Configure system settings and alerts</p>
              {/* Admin settings will be implemented later */}
              <Button variant="outline">Configure Alerts</Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Dashboard>
  );
};

export default Index;
