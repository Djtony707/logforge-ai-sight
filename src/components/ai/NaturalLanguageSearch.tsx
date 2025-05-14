
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { nlQueryLogs, NLQueryResponse } from "@/lib/api";

const NaturalLanguageSearch = () => {
  const [nlQuery, setNlQuery] = useState("");
  const [isNlProcessing, setIsNlProcessing] = useState(false);
  const [results, setResults] = useState<Array<any> | null>(null);

  const handleNlSearch = async () => {
    if (!nlQuery.trim()) return;
    
    setIsNlProcessing(true);
    setResults(null);
    
    try {
      // Call our AI backend service with proper typing
      const response = await nlQueryLogs(nlQuery);
      
      setResults(response.results || []);
      
      if (response.results?.length === 0) {
        toast.info("No results found for your query");
      } else {
        toast.success("Query processed successfully");
      }
      
    } catch (error) {
      console.error("Error processing natural language query:", error);
      toast.error("Failed to process natural language query");
      
      // For development purposes, generate mock results when the API fails
      if (import.meta.env.DEV) {
        const mockResults = generateMockResults(nlQuery);
        setResults(mockResults);
      } else {
        setResults(null);
      }
    } finally {
      setIsNlProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="e.g., 'Show me all error logs from the database server in the last hour'"
          value={nlQuery}
          onChange={(e) => setNlQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNlSearch()}
        />
        <Button onClick={handleNlSearch} disabled={isNlProcessing || !nlQuery.trim()}>
          <Search className="mr-2 h-4 w-4" />
          {isNlProcessing ? "Processing..." : "Search"}
        </Button>
      </div>
      
      {isNlProcessing && (
        <div className="text-center py-8">
          <div className="animate-pulse">Processing your query...</div>
        </div>
      )}
      
      {results && results.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Host</th>
                <th className="px-4 py-2 text-left">Application</th>
                <th className="px-4 py-2 text-left">Severity</th>
                <th className="px-4 py-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {results.map((log, index) => (
                <tr key={log.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2">{new Date(log.ts).toLocaleString()}</td>
                  <td className="px-4 py-2">{log.host}</td>
                  <td className="px-4 py-2">{log.app}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-sm">{log.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : results && results.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No results found for your query
        </div>
      ) : null}
    </div>
  );
};

// Helper function to get color based on severity
const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'emergency':
    case 'alert':
    case 'critical':
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'notice':
    case 'info':
      return 'bg-blue-100 text-blue-800';
    case 'debug':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Generate mock results for development purposes
function generateMockResults(query: string) {
  const now = new Date();
  const hosts = ['db-server', 'app-server', 'auth-service', 'api-gateway', 'web-frontend'];
  const apps = ['postgres', 'nginx', 'auth', 'api', 'react-app'];
  const severities = ['info', 'warning', 'error', 'debug'];
  
  const queryLower = query.toLowerCase();
  let filteredHosts = hosts;
  let filteredApps = apps;
  let filteredSeverities = severities;
  
  // Filter based on the query
  if (queryLower.includes('database') || queryLower.includes('db')) {
    filteredHosts = hosts.filter(h => h.includes('db'));
    filteredApps = ['postgres', 'mysql', 'mongodb'];
  }
  
  if (queryLower.includes('error')) {
    filteredSeverities = ['error', 'critical'];
  } else if (queryLower.includes('warning')) {
    filteredSeverities = ['warning'];
  }
  
  // Generate some random logs
  return Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => {
    const timestamp = new Date(now);
    timestamp.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
    
    const host = filteredHosts[Math.floor(Math.random() * filteredHosts.length)];
    const app = filteredApps[Math.floor(Math.random() * filteredApps.length)];
    const severity = filteredSeverities[Math.floor(Math.random() * filteredSeverities.length)];
    
    let msg = '';
    if (severity === 'error') {
      msg = `Failed to execute query: timeout after 30s`;
    } else if (severity === 'warning') {
      msg = `High CPU usage detected (89%)`;
    } else if (severity === 'info') {
      msg = `User session started: user_${Math.floor(Math.random() * 1000)}`;
    } else {
      msg = `Processing request ${Math.floor(Math.random() * 10000)}`;
    }
    
    return {
      id: `mock-${i}-${Date.now()}`,
      ts: timestamp.toISOString(),
      host,
      app,
      severity,
      msg
    };
  });
}

export default NaturalLanguageSearch;
