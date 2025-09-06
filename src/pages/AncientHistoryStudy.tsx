import { SEOHead } from "@/components/SEOHead";
import ChatPanel from "../components/chat-panel/ChatPanel";
import PolityBook from "../components/study-material/polity/PolityBook";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { chapters } from "@/components/study-material/polity/AncientHistoryConst";

const AncientHistoryStudy = () => {
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Ancient Indian History",
    "description": "Comprehensive study materials for UPSC Ancient Indian History preparation",
    "provider": {
      "@type": "Organization",
      "name": "UPSC Study Platform"
    }
  };

  return (
    <>
      <SEOHead
        title="Ancient Indian History - UPSC Study Materials"
        description="Comprehensive notes on Ancient Indian History, civilizations, dynasties, and cultural developments for UPSC Civil Services preparation."
        keywords="ancient Indian history, UPSC history, Indus valley civilization, Mauryan empire, Gupta dynasty, ancient India UPSC"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background pt-16">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ancient Indian History</h1>
              <p className="text-muted-foreground">Interactive study materials with AI assistance</p>
            </div>
          </div>
        </header>
        
        <div className="relative h-[calc(100vh-120px)]">
          <PolityBook chapters={chapters} subjectId="ancient-history" />
          
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

export default AncientHistoryStudy;