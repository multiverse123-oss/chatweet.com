import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const SocialMediaBot = () => {
  const [autoReply, setAutoReply] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTestMessage = async () => {
    if (!testMessage.trim()) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          userMessage: testMessage,
          persona: 'general',
          tone: 'neutral',
          model: 'gpt4omini'
        }
      });

      if (error) throw error;

      toast({
        title: "Bot Response",
        description: data.response
      });
      setTestMessage('');
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

        <div className="space-y-2">
          <Label>Test Bot Response</Label>
          <Textarea
            placeholder="Enter a test message to see how the bot would respond..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleTestMessage}
            disabled={!testMessage.trim() || isProcessing}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Test Bot Response'}
          </Button>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Full social media integration requires API access to platforms like Twitter, Instagram, etc. 
            This is a demo using the chat AI. For production use, you'll need to connect to actual social media APIs.
          </p>
        </div>
      </div>
    </Card>
  );
};
