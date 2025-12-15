import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const RESPONSE_STYLES = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'witty', label: 'Witty' },
  { value: 'empathetic', label: 'Empathetic' },
];

export const SocialMediaBot = () => {
  const [autoReply, setAutoReply] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [responseStyle, setResponseStyle] = useState('friendly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [botResponse, setBotResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTestMessage = async () => {
    if (!testMessage.trim()) return;

    setIsProcessing(true);
    setBotResponse(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          userMessage: `You are responding to a ${platform} message. Respond in a ${responseStyle} tone. The message is: "${testMessage}"`,
          persona: 'customer-service',
          tone: responseStyle === 'witty' ? 'humorous' : responseStyle === 'empathetic' ? 'sad' : 'neutral',
          model: 'gpt4omini'
        }
      });

      if (error) throw error;

      setBotResponse(data.response);
      toast({
        title: "Response Generated",
        description: "Bot response ready using GPT-4o Mini"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get bot response",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyResponse = () => {
    if (botResponse) {
      navigator.clipboard.writeText(botResponse);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard"
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Social Media Auto-Reply Bot</h3>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="auto-reply">Auto-Reply Mode</Label>
            <p className="text-sm text-muted-foreground">
              Automatically respond to incoming messages
            </p>
          </div>
          <Switch
            id="auto-reply"
            checked={autoReply}
            onCheckedChange={setAutoReply}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Response Style</Label>
            <Select value={responseStyle} onValueChange={setResponseStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_STYLES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Incoming Message</Label>
          <Textarea
            placeholder="Paste the message you want to reply to..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleTestMessage}
            disabled={!testMessage.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? 'Generating Response...' : 'Generate Reply (GPT-4o Mini)'}
          </Button>
        </div>

        {botResponse && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Suggested Reply:</Label>
              <Button size="sm" variant="ghost" onClick={copyResponse}>
                Copy
              </Button>
            </div>
            <p className="text-sm">{botResponse}</p>
          </div>
        )}

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Powered by GPT-4o Mini:</strong> This bot uses OpenAI's GPT-4o Mini for intelligent social media replies. 
            For full automation, connect to actual social media APIs.
          </p>
        </div>
      </div>
    </Card>
  );
};
