
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
        description="Comprehensive notes on Indian Constitution, governance systems, and political processes for UPSC Civil Services preparation."
        keywords="Indian polity, UPSC governance, constitution notes, political science UPSC, civil services polity"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background pt-16">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Indian Polity & Governance</h1>
              <p className="text-muted-foreground">Interactive study materials with AI assistance</p>
            </div>
          </div>
        </header>
        
        <div className="relative h-[calc(100vh-120px)]">
          <PolityBook />
          
          {/* Floating Chat Toggle Button */}
          <Button
            onClick={() => setShowChat(!showChat)}
            className={`fixed z-50 rounded-full h-12 w-12 shadow-lg ${
              isMobile 
                ? "bottom-40 right-4" 
                : "bottom-6 right-6 h-14 w-14"
            }`}
            size="icon"
            variant={showChat ? "default" : "secondary"}
          >
            <MessageCircle className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
          </Button>

          {/* Floating Chat Panel */}
          {showChat && (
            <div className={`fixed z-40 bg-card border border-border rounded-lg shadow-2xl ${
              isMobile 
                ? "inset-x-4 bottom-56 top-32" 
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