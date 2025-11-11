import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeItem } from "@/types/chat";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Brain, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface KnowledgeBaseProps {
  userId: string;
}

const KnowledgeBase = ({ userId }: KnowledgeBaseProps) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledge();
  }, [userId]);

  const fetchKnowledge = async () => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge:', error);
      return;
    }

    setItems(data || []);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingItem) {
      const { error } = await supabase
        .from('knowledge_base')
        .update({
          title,
          content,
          tags: tagsArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update knowledge item",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          user_id: userId,
          title,
          content,
          tags: tagsArray,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create knowledge item",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Success",
      description: editingItem ? "Knowledge updated" : "Knowledge added",
    });

    resetForm();
    fetchKnowledge();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete knowledge item",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Knowledge item deleted successfully",
    });

    fetchKnowledge();
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setTags(item.tags?.join(', ') || '');
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setTags("");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Knowledge Base
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Knowledge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
              <Input
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <Button onClick={handleSave} className="w-full">
                {editingItem ? 'Update' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No knowledge items yet</p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{item.content}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-accent px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default KnowledgeBase;
