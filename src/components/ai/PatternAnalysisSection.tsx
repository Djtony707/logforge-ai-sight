
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLogPatterns, getPatternExplanation } from "@/lib/api";
import { PatternExplanationResponse } from "@/lib/api/types";

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
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explanationLoading, setExplanationLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const data = await getLogPatterns() as LogPattern[];
        setPatterns(data);
      } catch (error) {
        console.error("Failed to fetch log patterns:", error);
        toast.error("Failed to load log patterns");
        
        // Set mock patterns for UI development
        setPatterns(getMockPatterns());
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  const getExplanation = async (patternId: string, pattern: string) => {
    if (explanationLoading[patternId]) return;
    
    setSelectedPattern(patternId);
    setExplanationLoading(prev => ({ ...prev, [patternId]: true }));
    
    try {
      // Try to get a real explanation from the API
      const data = await getPatternExplanation(patternId) as PatternExplanationResponse;
      setExplanations(prev => ({ 
        ...prev, 
        [patternId]: data.explanation 
      }));
    } catch (error) {
      console.error("Failed to get pattern explanation:", error);
      
      // Generate a fallback explanation if the API fails
      const fallbackExplanation = generateFallbackExplanation(pattern);
      setExplanations(prev => ({ ...prev, [patternId]: fallbackExplanation }));
    } finally {
      setExplanationLoading(prev => ({ ...prev, [patternId]: false }));
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
                    onClick={() => getExplanation(`pattern-${index}`, pattern.pattern)}
                    disabled={explanationLoading[`pattern-${index}`]}
                  >
                    {explanationLoading[`pattern-${index}`] ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      "Explain this pattern"
                    )}
                  </Button>
                  
                  {selectedPattern === `pattern-${index}` && explanations[`pattern-${index}`] && (
                    <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded-md">
                      <h4 className="font-semibold mb-1">AI Analysis:</h4>
                      <p>{explanations[`pattern-${index}`]}</p>
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

// Helper function to generate a fallback explanation for a pattern
function generateFallbackExplanation(pattern: string): string {
  const patternLower = pattern.toLowerCase();
  
  if (patternLower.includes("error") || patternLower.includes("exception") || patternLower.includes("fail")) {
    return "This pattern appears to be related to error conditions in your application. You may want to investigate these occurrences as they could indicate problems with your system.";
  } else if (patternLower.includes("warn") || patternLower.includes("warning")) {
    return "This pattern contains warning messages that may not be critical failures but could indicate potential issues that should be addressed to prevent future problems.";
  } else if (patternLower.includes("database") || patternLower.includes("sql") || patternLower.includes("query")) {
    return "This pattern is related to database operations. The recurring nature suggests regular database interactions, possibly scheduled queries or batch operations.";
  } else if (patternLower.includes("user") || patternLower.includes("auth") || patternLower.includes("login")) {
    return "This pattern appears related to user authentication or session management. These logs track user interactions with your authentication system.";
  } else if (patternLower.includes("health") || patternLower.includes("check") || patternLower.includes("status")) {
    return "This pattern appears to be related to periodic system health checks. They occur regularly and don't indicate any issues. The pattern shows standard information logs about system status.";
  } else {
    return "This is a recurring pattern in your logs that may represent normal system behavior. The consistency of these messages suggests they're part of regular application operations rather than anomalous events.";
  }
}

// Helper function to generate mock pattern data for UI development
function getMockPatterns(): LogPattern[] {
  const mockPatterns = [
    {
      pattern: "Connection to database # established successfully",
      count: 243,
      examples: [
        {
          id: "log1",
          ts: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          host: "db-server-1",
          app: "postgres",
          severity: "info",
          msg: "Connection to database 5 established successfully"
        },
        {
          id: "log2",
          ts: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          host: "db-server-2",
          app: "postgres",
          severity: "info",
          msg: "Connection to database 3 established successfully"
        }
      ]
    },
    {
      pattern: "User # authenticated successfully",
      count: 187,
      examples: [
        {
          id: "log3",
          ts: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          host: "auth-service",
          app: "auth",
          severity: "info",
          msg: "User john.doe authenticated successfully"
        },
        {
          id: "log4",
          ts: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          host: "auth-service",
          app: "auth",
          severity: "info",
          msg: "User alice.smith authenticated successfully"
        }
      ]
    },
    {
      pattern: "Health check completed. Status: #",
      count: 156,
      examples: [
        {
          id: "log5",
          ts: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          host: "health-service",
          app: "monitoring",
          severity: "info",
          msg: "Health check completed. Status: OK"
        },
        {
          id: "log6",
          ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          host: "health-service",
          app: "monitoring",
          severity: "info",
          msg: "Health check completed. Status: OK"
        }
      ]
    }
  ];

  // Add more examples to each pattern
  mockPatterns.forEach(pattern => {
    const example = { ...pattern.examples[0] };
    example.id = `log-extra-${Math.random()}`;
    example.ts = new Date(Date.now() - 1000 * 60 * Math.random() * 60).toISOString();
    pattern.examples.push(example);
  });

  return mockPatterns;
}

export default PatternAnalysisSection;
