import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AIAssistant = () => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Connect to AI backend
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Your personal scheduling expert</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-secondary p-4">
        <p className="text-sm text-foreground">
          Hi! I'm your AI calendar assistant. I can help you schedule tasks, break down complex
          projects, create prep time, and even suggest recipes or shopping lists. What would you
          like to schedule today?
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me to schedule something..."
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          size="icon"
          disabled={!message.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
