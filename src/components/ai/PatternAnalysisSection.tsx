
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface LogPattern {
  pattern: string;
  count: number;
  examples: Array<{
    id: string;
    ts: string;
    host: string;
    app: string;
    severity: string;
    msg: string;
  }>;
}

const PatternAnalysisSection = () => {
  const [patterns, setPatterns] = useState<LogPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const data = await fetchApi<LogPattern[]>("/logs/patterns");
        setPatterns(data);
      } catch (error) {
        console.error("Failed to fetch log patterns:", error);
        toast.error("Failed to load log patterns");
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  const getExplanation = async (patternId: string) => {
    if (explanationLoading) return;
    
    setSelectedPattern(patternId);
    setExplanationLoading(true);
    
    try {
      // In a real app, we'd call our API
      // const data = await fetchApi(`/ai/explain_pattern/${patternId}`);
      // setExplanation(data.explanation);
      
      // For demonstration, simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      setExplanation(
        "This pattern appears to be related to periodic system health checks. " +
        "They occur regularly and don't indicate any issues. The pattern shows " +
        "standard information logs about system status."
      );
      
    } catch (error) {
      console.error("Failed to get pattern explanation:", error);
      toast.error("Failed to analyze pattern");
      setExplanation(null);
    } finally {
      setExplanationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading patterns...</span>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="text-center py-4">
        <p>No recurring patterns detected in recent logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {patterns.map((pattern, index) => (
          <AccordionItem key={index} value={`pattern-${index}`}>
            <AccordionTrigger className="hover:bg-gray-50 px-4">
              <div className="flex justify-between items-center w-full pr-4">
                <div className="font-mono text-sm truncate max-w-[500px]">
                  {pattern.pattern}
                </div>
                <div className="text-muted-foreground">
                  {pattern.count} occurrences
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Examples:</h4>
                  {pattern.examples.slice(0, 3).map((example, i) => (
                    <div key={i} className="mb-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {new Date(example.ts).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          {example.host} / {example.app}
                        </span>
                      </div>
                      <div className="font-mono">{example.msg}</div>
                    </div>
                  ))}
                </div>
                
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getExplanation(`pattern-${index}`)}
                    disabled={explanationLoading && selectedPattern === `pattern-${index}`}
                  >
                    {explanationLoading && selectedPattern === `pattern-${index}` ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      "Explain this pattern"
                    )}
                  </Button>
                  
                  {selectedPattern === `pattern-${index}` && explanation && (
                    <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded-md">
                      <h4 className="font-semibold mb-1">AI Analysis:</h4>
                      <p>{explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PatternAnalysisSection;
