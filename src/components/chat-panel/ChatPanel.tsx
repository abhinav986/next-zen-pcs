import React, { useState } from "react";
import { Send } from "lucide-react";
import OpenAI from "openai";

const ChatPanel = () => {
  const [messages, setMessages] = useState([
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
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: newMessages
      });

      const reply = res.choices[0].message.content;
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "⚠️ Error: Unable to fetch response." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border-l bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg ${
              m.role === "assistant"
                ? "bg-blue-100 text-gray-800"
                : "bg-green-100 text-gray-900 text-right"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 text-sm italic">Thinking...</div>
        )}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your Polity doubt..."
          className="flex-1 border rounded-lg p-2"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-1"
        >
          <Send className="w-4 h-4" /> Ask
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;