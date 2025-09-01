import React, { useState } from "react";
import { Send, X } from "lucide-react";
// Free AI using Hugging Face API
import { Button } from "@/components/ui/button";

interface ChatPanelProps {
  onClose?: () => void;
}

const ChatPanel = ({ onClose }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([
    { role: "assistant", content: "Hi! 👋 Ask me anything about Indian Polity." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Using free Hugging Face API for AI assistance
  const callFreeAI = async (message: string) => {
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Question about Indian Polity: ${message}`,
          parameters: {
            max_length: 200,
            temperature: 0.7,
          }
        })
      });
      
      if (!response.ok) {
        // Fallback to a simple knowledge-based response
        return getPolityResponse(message);
      }
      
      const data = await response.json();
      return data.generated_text || getPolityResponse(message);
    } catch (error) {
      return getPolityResponse(message);
    }
  };

  // Simple knowledge-based responses for Indian Polity
  const getPolityResponse = (question: string) => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('constitution')) {
      return "The Indian Constitution came into effect on 26th January 1950. It has 395 articles in 22 parts and 12 schedules. Key features include federal structure, parliamentary system, and fundamental rights.";
    }
    if (lowerQ.includes('fundamental rights')) {
      return "There are 6 Fundamental Rights: Right to Equality, Right to Freedom, Right against Exploitation, Right to Freedom of Religion, Cultural and Educational Rights, and Right to Constitutional Remedies.";
    }
    if (lowerQ.includes('directive principles')) {
      return "Directive Principles of State Policy are guidelines for governance. They are non-justiciable but fundamental in governance, covering social, economic and political justice.";
    }
    if (lowerQ.includes('parliament')) {
      return "Indian Parliament consists of President, Lok Sabha (House of People) and Rajya Sabha (Council of States). Maximum strength: Lok Sabha 552, Rajya Sabha 250.";
    }
    if (lowerQ.includes('president')) {
      return "The President is the Head of State, elected by Electoral College. Term: 5 years. Key powers include executive, legislative, judicial, and emergency powers.";
    }
    if (lowerQ.includes('prime minister')) {
      return "Prime Minister is the Head of Government, leader of the party/coalition with majority in Lok Sabha. Appointed by President, heads the Council of Ministers.";
    }
    if (lowerQ.includes('supreme court')) {
      return "Supreme Court is the apex court with original, appellate and advisory jurisdiction. Guardian of Constitution with power of judicial review.";
    }
    if (lowerQ.includes('federalism')) {
      return "India follows quasi-federal structure with unitary bias. Division of powers through Union, State and Concurrent lists in 7th Schedule.";
    }
    
    return "I can help with Indian Polity topics like Constitution, Fundamental Rights, Parliament, President, Prime Minister, Supreme Court, Federalism, etc. Please ask a specific question!";
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: Array<{role: "user" | "assistant", content: string}> = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await callFreeAI(input);
      setMessages([...newMessages, { role: "assistant" as const, content: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant" as const, content: "⚠️ Error: Unable to fetch response. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">AI Study Assistant</h3>
          <p className="text-sm text-muted-foreground">Ask questions about Indian Polity</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              m.role === "assistant"
                ? "bg-accent/50 text-foreground"
                : "bg-primary/10 text-foreground text-right ml-8"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-muted-foreground text-sm italic">Thinking...</div>
        )}
      </div>
      <div className="p-4 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your Polity doubt..."
          className="flex-1 border border-border rounded-lg p-2 bg-background text-foreground"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button
          onClick={sendMessage}
          size="sm"
          className="flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;