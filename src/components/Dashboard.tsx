
import React from "react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  children: React.ReactNode;
  role: "admin" | "viewer" | null;
  onLogout: () => void;
}

const Dashboard = ({ children, role, onLogout }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">LogForge AI</h1>
            <span className="bg-white/20 px-2 py-1 rounded text-xs">
              {role === "admin" ? "Admin" : "Viewer"}
            </span>
          </div>
          <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6">
        {children}
      </main>
      <footer className="container mx-auto p-4 text-center text-sm text-gray-500 border-t">
        <p>LogForge AI - Local-only syslog dashboard with AI insights</p>
      </footer>
    </div>
  );
};

export default Dashboard;
