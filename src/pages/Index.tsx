
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveFeed from "@/components/LiveFeed";
import SearchLogs from "@/components/SearchLogs";
import AIInsights from "@/components/AIInsights";
import LoginForm from "@/components/LoginForm";
import Dashboard from "@/components/Dashboard";
import AdminSettings from "@/components/AdminSettings";

interface IndexProps {
  isLoggedIn: boolean;
  userRole: string | null;
  onLogin: (token: string, role: string) => void;
  onLogout: () => void;
}

const Index = ({ isLoggedIn, userRole, onLogin, onLogout }: IndexProps) => {
  if (!isLoggedIn) {
    return <LoginForm onLogin={onLogin} />;
  }

  return (
    <Dashboard role={userRole as "admin" | "viewer" | null} onLogout={onLogout}>
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          {userRole === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>
        <TabsContent value="live" className="space-y-4">
          <LiveFeed />
        </TabsContent>
        <TabsContent value="search" className="space-y-4">
          <SearchLogs role={userRole as "admin" | "viewer" | null} />
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <AIInsights />
        </TabsContent>
        {userRole === "admin" && (
          <TabsContent value="admin" className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <AdminSettings />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Dashboard>
  );
};

export default Index;
