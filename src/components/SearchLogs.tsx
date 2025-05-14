
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { fetchApi, SearchLogsParams } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import SearchForm from "@/components/search/SearchForm";
import SearchResults, { LogEntry } from "@/components/search/SearchResults";
import ExportButtons from "@/components/search/ExportButtons";

interface SearchLogsProps {
  role: "admin" | "viewer" | null;
}

const SearchLogs = ({ role }: SearchLogsProps) => {
  const [searchResults, setSearchResults] = useState<LogEntry[]>([]);
  const toast = useToast();
  
  const searchMutation = useMutation({
    mutationFn: async (params: SearchLogsParams) => {
      return fetchApi<LogEntry[]>("/logs/search", {
        method: "POST",
        body: params,
      });
    },
    onSuccess: (data) => {
      setSearchResults(data);
      toast.success("Search completed", `Found ${data.length} results`);
    },
    onError: (error) => {
      console.error("Search failed:", error);
      toast.error("Search Failed", error instanceof Error ? error.message : "An unknown error occurred");
      setSearchResults([]);
    }
  });
  
  const handleSearch = (params: SearchLogsParams) => {
    // In development mode without backend, use mock data
    if (process.env.NODE_ENV === "development" && !import.meta.env.VITE_API_URL) {
      const mockResults: LogEntry[] = Array(20).fill(0).map((_, i) => ({
        id: `mock-${i}`,
        ts: new Date(Date.now() - i * 3600000).toISOString(),
        host: ["server1", "db-primary", "web-frontend"][i % 3] + ".example.com",
        app: ["nginx", "postgres", "app-server"][i % 3],
        severity: ["info", "warning", "error", "critical"][i % 4] as any,
        msg: `Sample log message ${i} matching "${params.message || ''}"`,
        is_anomaly: i % 7 === 0,
        anomaly_score: i % 7 === 0 ? Math.random() : undefined
      }));
      setSearchResults(mockResults);
      return;
    }
    
    // Use React Query for real API call
    searchMutation.mutate(params);
  };

  return (
    <div className="space-y-6">
      <SearchForm 
        onSearch={handleSearch}
        isSearching={searchMutation.isPending}
      />
      
      {searchResults.length > 0 && role === "admin" && (
        <div className="flex justify-end">
          <ExportButtons results={searchResults} />
        </div>
      )}
      
      <SearchResults results={searchResults} />
    </div>
  );
};

export default SearchLogs;
