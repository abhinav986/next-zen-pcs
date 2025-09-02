
import { SEOHead } from "@/components/SEOHead";
import ChatPanel from "../../chat-panel/ChatPanel";
import PolityBook from "./PolityBook";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const PolityApp = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);

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
        description="Show to ankush polity book"
        keywords="Show to anksuh polity"
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
        
        <div className="relative h-[calc(100vh-120px)]">
          <PolityBook />
          
          {/* Floating Chat Toggle Button */}
          <Button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg"
            size="icon"
            variant={showChat ? "default" : "secondary"}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>

          {/* Floating Chat Panel */}
          {showChat && (
            <div className={`fixed z-40 bg-card border border-border rounded-lg shadow-2xl ${
              isMobile 
                ? "inset-x-4 bottom-24 top-32" 
                : "bottom-24 right-6 w-96 h-[500px]"
            }`}>
              <ChatPanel onClose={() => setShowChat(false)} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PolityApp;