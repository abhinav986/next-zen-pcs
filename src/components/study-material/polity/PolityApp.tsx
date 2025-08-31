
import { SEOHead } from "@/components/SEOHead";
import ChatPanel from "../../chat-panel/ChatPanel";
import PolityBook from "./PolityBook";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PolityApp = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Indian Polity & Governance",
    "description": "Comprehensive study materials for UPSC Indian Polity and Governance",
    "provider": {
      "@type": "Organization",
      "name": "UPSC Study Platform"
    }
  };

  return (
    <>
      <SEOHead
        title="Indian Polity & Governance - UPSC Study Materials"
        description="Comprehensive notes on Indian Constitution, governance systems, and political processes for UPSC Civil Services preparation."
        keywords="Indian polity, UPSC governance, constitution notes, political science UPSC, civil services polity"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/study-materials')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Study Materials
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Indian Polity & Governance</h1>
                <p className="text-muted-foreground">Interactive study materials with AI assistance</p>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex h-[calc(100vh-120px)]">
          <div className="flex-1">
            <PolityBook />
          </div>
          <div className="w-96 border-l border-border">
            {/* <ChatPanel /> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default PolityApp;