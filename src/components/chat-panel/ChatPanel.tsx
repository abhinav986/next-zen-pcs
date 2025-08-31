import React, { useState } from "react";
import { Send } from "lucide-react";
import OpenAI from "openai";
import { Button } from "@/components/ui/button";

const ChatPanel = () => {
  const [messages, setMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([
    { role: "assistant", content: "Hi! 👋 Ask me anything about Indian Polity." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔑 Load your OpenAI API key from env
  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // ⚠️ For demo only, better proxy via backend
  });

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: Array<{role: "user" | "assistant", content: string}> = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: newMessages as any
      });

      const reply = res.choices[0].message.content || "No response";
      setMessages([...newMessages, { role: "assistant" as const, content: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant" as const, content: "⚠️ Error: Unable to fetch response." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">AI Study Assistant</h3>
        <p className="text-sm text-muted-foreground">Ask questions about Indian Polity</p>
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