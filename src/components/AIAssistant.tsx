import { useState, useEffect } from "react";
import { Send, Sparkles, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { llmService, LLMModel, Message } from "@/services/llmService";
import { useToast } from "@/hooks/use-toast";

export const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  // Load API key and fetch models on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    return (
      <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/70 to-accent text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Assistant
                </p>
                <h3 className="text-base font-semibold text-foreground">AI scheduling co-pilot</h3>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                Explore prompts
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/70 bg-gradient-to-br from-secondary/80 to-white/90 p-4 text-sm text-muted-foreground shadow-inner">
              Hi! I can rearrange plans, block focus time, or even prep automations so the week runs smoother. Ask me anything and I'll draft the plan for you.
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for a smarter schedule..."
                className="flex-1 rounded-full border-border/60 bg-white/80"
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!message.trim()}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
    }

    const userMessage: Message = {
      role: 'user',
      content: message.trim()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await llmService.chat({
        messages: [...chatHistory, userMessage],
        model: selectedModel
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from LLM",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Your personal scheduling expert</p>
          </div>
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Settings</DialogTitle>
              <DialogDescription>
                Configure your AI model preferences
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Model Selection */}
      <div className="mb-4">
        <Select
          value={selectedModel?.id}
          onValueChange={(value) => {
            const model = models.find(m => m.id === value);
            setSelectedModel(model || null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.length === 0 ? (
              <SelectItem value="none" disabled>
                No models available - configure settings
              </SelectItem>
            ) : (
              models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} ({model.vendor})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="mb-4 max-h-96 space-y-3 overflow-y-auto rounded-lg bg-secondary p-4">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary/10 ml-8'
                  : 'bg-accent/10 mr-8'
              }`}
            >
              <div className="text-xs font-semibold mb-1 text-muted-foreground">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Initial Prompt */}
      {chatHistory.length === 0 && (
        <div className="mb-4 rounded-lg bg-secondary p-4">
          <p className="text-sm text-foreground">
            Hi! I'm your AI calendar assistant. I can help you schedule tasks, break down complex
            projects, create prep time, and even suggest recipes or shopping lists. What would you
            like to schedule today?
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          placeholder="Ask me to schedule something..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          size="icon"
          disabled={!message.trim() || isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
