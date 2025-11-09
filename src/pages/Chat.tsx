import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

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

    try {
      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          userMessage: inputValue,
          persona,
          tone,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        persona,
        tone,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save messages to database
      if (user) {
        await supabase.from('messages').insert([
          {
            user_id: user.id,
            role: userMessage.role,
            content: userMessage.content,
            persona,
            tone
          },
          {
            user_id: user.id,
            role: assistantMessage.role,
            content: assistantMessage.content,
            persona,
            tone
          }
        ]);
      }
    } catch (error: any) {
      console.error('Error calling AI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({
      title: "OCR Feature",
      description: "Image OCR feature will be implemented in the next update.",
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6">
        <aside className="w-64 space-y-4 hidden lg:block">
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <PersonaSelector value={persona} onChange={setPersona} />
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <ToneSelector value={tone} onChange={setTone} />
          </Card>
        </aside>

        <div className="flex-1 flex flex-col">
          <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col">
            <div className="lg:hidden p-4 border-b border-border/50 grid grid-cols-2 gap-4">
              <PersonaSelector value={persona} onChange={setPersona} />
              <ToneSelector value={tone} onChange={setTone} />
            </div>

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
