
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const NaturalLanguageSearch = () => {
  const [nlQuery, setNlQuery] = useState("");
  const [isNlProcessing, setIsNlProcessing] = useState(false);
  const { toast } = useToast();

  const handleNlSearch = async () => {
    if (!nlQuery.trim()) return;
    
    setIsNlProcessing(true);
    try {
      // In a real implementation, this would call an actual NL processing API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Query processed",
        description: `Your query "${nlQuery}" has been processed.`,
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process natural language query",
      });
    } finally {
      setIsNlProcessing(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Input
        placeholder="e.g., 'Show me all error logs from the database server in the last hour'"
        value={nlQuery}
        onChange={(e) => setNlQuery(e.target.value)}
      />
      <Button onClick={handleNlSearch} disabled={isNlProcessing || !nlQuery.trim()}>
        <Search className="mr-2 h-4 w-4" />
        {isNlProcessing ? "Processing..." : "Search"}
      </Button>
    </div>
  );
};

export default NaturalLanguageSearch;
