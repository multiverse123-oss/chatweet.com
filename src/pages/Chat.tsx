import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Image as ImageIcon, Settings, LogOut } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import PersonaSelector from "@/components/PersonaSelector";
import ToneSelector from "@/components/ToneSelector";
import { Message, Persona, Tone, PERSONAS } from "@/types/chat";
import logo from "@/assets/logo.png";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>("general");
  const [tone, setTone] = useState<Tone>("neutral");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // TODO: Implement actual AI integration with Lovable AI
    // For now, simulate a response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `As a ${PERSONAS[persona].label} in a ${tone} tone: I've received your message. This is a placeholder response. Connect Lovable Cloud to enable AI responses.`,
        timestamp: new Date(),
        persona,
        tone,
      };

      // Add disclaimer if persona requires it
      if (PERSONAS[persona].disclaimer) {
        assistantMessage.content += `\n\n⚠️ ${PERSONAS[persona].disclaimer}`;
      }

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implement OCR integration
    toast({
      title: "OCR Feature",
      description: "Image uploaded. OCR integration will be added with Lovable Cloud.",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ChatWeet" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ChatWeet
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 space-y-4 hidden lg:block">
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <PersonaSelector value={persona} onChange={setPersona} />
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <ToneSelector value={tone} onChange={setTone} />
          </Card>
        </aside>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col">
            {/* Mobile Selectors */}
            <div className="lg:hidden p-4 border-b border-border/50 grid grid-cols-2 gap-4">
              <PersonaSelector value={persona} onChange={setPersona} />
              <ToneSelector value={tone} onChange={setTone} />
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="space-y-4">
                    <div className="text-6xl">👋</div>
                    <h2 className="text-2xl font-semibold">Welcome to ChatWeet</h2>
                    <p className="text-muted-foreground max-w-md">
                      Select a persona and tone, then start chatting. Upload images for OCR text extraction.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  variant="hero"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
