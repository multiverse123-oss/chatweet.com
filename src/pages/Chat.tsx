import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Image as ImageIcon, 
  LogOut, 
  MessageSquare, 
  Bookmark, 
  Brain, 
  User, 
  Camera,
  Menu,
  Video
} from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatHistory from "@/components/ChatHistory";
import BookmarksList from "@/components/BookmarksList";
import KnowledgeBase from "@/components/KnowledgeBase";
import UserProfile from "@/components/UserProfile";
import PersonaSelector from "@/components/PersonaSelector";
import ToneSelector from "@/components/ToneSelector";
import MediaProcessor from "@/components/MediaProcessor";
import { Message, Persona, Tone } from "@/types/chat";
import { takeScreenshot } from "@/utils/screenshot";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type SidebarView = 'history' | 'bookmarks' | 'knowledge' | 'profile' | 'media';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>("general");
  const [tone, setTone] = useState<Tone>("neutral");
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt4omini'>('gemini');
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [sidebarView, setSidebarView] = useState<SidebarView>('history');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data.id;
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(undefined);
  };

  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading conversation:', error);
      return;
    }

    const loadedMessages: Message[] = data.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      persona: msg.persona,
      tone: msg.tone,
    }));

    setMessages(loadedMessages);
    setCurrentConversationId(conversationId);
    setIsMobileSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }
      setCurrentConversationId(convId);
    }

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
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          userMessage: inputValue,
          persona,
          tone,
          model: selectedModel,
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
      
      await supabase.from('messages').insert([
        {
          user_id: user.id,
          conversation_id: convId,
          role: userMessage.role,
          content: userMessage.content,
          persona,
          tone
        },
        {
          user_id: user.id,
          conversation_id: convId,
          role: assistantMessage.role,
          content: assistantMessage.content,
          persona,
          tone
        }
      ]);
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

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('chat-ocr', {
          body: { imageBase64: base64Image }
        });

        if (error) throw error;

        setInputValue(data.extractedText);
        toast({
          title: "OCR Complete",
          description: "Text extracted from image successfully",
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('OCR error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to extract text from image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshot = async () => {
    try {
      const url = window.location.href;
      const screenshotUrl = await takeScreenshot(url);
      
      toast({
        title: "Screenshot Taken",
        description: "Screenshot captured successfully",
      });

      window.open(screenshotUrl, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to take screenshot",
        variant: "destructive",
      });
    }
  };

  const handleEnableRecording = () => {
    setIsRecordingEnabled(true);
    toast({
      title: "Recording Enabled",
      description: "Session recording is now active via Inspectlet",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderSidebar = () => {
    switch (sidebarView) {
      case 'history':
        return (
          <ChatHistory
            currentConversationId={currentConversationId}
            onSelectConversation={loadConversation}
            onNewConversation={handleNewConversation}
            userId={user.id}
          />
        );
      case 'bookmarks':
        return <BookmarksList userId={user.id} />;
      case 'knowledge':
        return <KnowledgeBase userId={user.id} />;
      case 'profile':
        return <UserProfile userId={user.id} email={user.email || ''} />;
      case 'media':
        return <MediaProcessor />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 backdrop-blur-lg bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border/50 flex gap-2">
                    <Button
                      variant={sidebarView === 'history' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSidebarView('history')}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={sidebarView === 'bookmarks' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSidebarView('bookmarks')}
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={sidebarView === 'knowledge' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSidebarView('knowledge')}
                    >
                      <Brain className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={sidebarView === 'media' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSidebarView('media')}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={sidebarView === 'profile' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSidebarView('profile')}
                    >
                      <User className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {renderSidebar()}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="ChatWeet" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ChatWeet
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!isRecordingEnabled && (
              <Button variant="ghost" size="sm" onClick={handleEnableRecording}>
                Enable Recording
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleScreenshot}>
              <Camera className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden">
        <aside className="w-80 hidden lg:flex flex-col gap-4">
          <Card className="p-2 bg-card/50 backdrop-blur-sm border-border/50 flex gap-2">
            <Button
              variant={sidebarView === 'history' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSidebarView('history')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button
              variant={sidebarView === 'bookmarks' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSidebarView('bookmarks')}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Saved
            </Button>
          </Card>
          <Card className="p-2 bg-card/50 backdrop-blur-sm border-border/50 flex gap-2">
            <Button
              variant={sidebarView === 'knowledge' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSidebarView('knowledge')}
            >
              <Brain className="w-4 h-4 mr-2" />
              Knowledge
            </Button>
            <Button
              variant={sidebarView === 'media' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSidebarView('media')}
            >
              <Video className="w-4 h-4 mr-2" />
              Media
            </Button>
          </Card>
          <Card className="p-2 bg-card/50 backdrop-blur-sm border-border/50 flex gap-2">
            <Button
              variant={sidebarView === 'profile' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setSidebarView('profile')}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </Card>
          <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
            {renderSidebar()}
          </Card>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col overflow-hidden">
            <div className="lg:hidden p-4 border-b border-border/50 grid grid-cols-2 gap-4">
              <PersonaSelector value={persona} onChange={setPersona} />
              <ToneSelector value={tone} onChange={setTone} />
            </div>

            <div className="hidden lg:block p-4 border-b border-border/50">
              <div className="flex gap-4">
                <PersonaSelector value={persona} onChange={setPersona} />
                <ToneSelector value={tone} onChange={setTone} />
              </div>
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

            <div className="p-4 border-t border-border/50 space-y-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Switch Models</span>
                <div className="flex gap-2">
                  <Button
                    variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs px-3 h-8"
                    onClick={() => setSelectedModel('gemini')}
                  >
                    Gemini 2.5
                  </Button>
                  <Button
                    variant={selectedModel === 'gpt4omini' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs px-3 h-8"
                    onClick={() => setSelectedModel('gpt4omini')}
                  >
                    GPT-4o Mini
                  </Button>
                </div>
              </div>
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
                  variant="default"
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
