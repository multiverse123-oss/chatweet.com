import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/chat";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "./ChatMessage";

interface BookmarksListProps {
  userId: string;
}

const BookmarksList = ({ userId }: BookmarksListProps) => {
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarks();
  }, [userId]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        message_id,
        messages (
          id,
          role,
          content,
          created_at,
          persona,
          tone
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return;
    }

    const messages = data?.map((b: any) => ({
      id: b.messages.id,
      role: b.messages.role,
      content: b.messages.content,
      timestamp: new Date(b.messages.created_at),
      persona: b.messages.persona,
      tone: b.messages.tone,
      isBookmarked: true,
    })) || [];

    setBookmarkedMessages(messages);
  };

  const removeBookmark = async (messageId: string) => {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('message_id', messageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Removed",
      description: "Bookmark removed successfully",
    });

    fetchBookmarks();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5" />
          Bookmarks
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {bookmarkedMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <BookmarkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No bookmarks yet</p>
            </div>
          ) : (
            bookmarkedMessages.map((message) => (
              <div key={message.id} className="relative group">
                <ChatMessage message={message} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() => removeBookmark(message.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BookmarksList;
