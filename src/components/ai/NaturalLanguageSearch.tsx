
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

const NaturalLanguageSearch = () => {
  const [nlQuery, setNlQuery] = useState("");
  const [isNlProcessing, setIsNlProcessing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleNlSearch = async () => {
    if (!nlQuery.trim()) return;
    
    setIsNlProcessing(true);
    setResults(null);
    
    try {
      // Call our AI backend service
      const response = await fetchApi('/ai/natural_language_query', {
        method: 'POST',
        body: { query: nlQuery }
      });
      
      setResults(response.results || []);
      
      toast.success("Query processed successfully");
      
    } catch (error) {
      console.error("Error processing natural language query:", error);
      toast.error("Failed to process natural language query");
      setResults(null);
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

export default NaturalLanguageSearch;
