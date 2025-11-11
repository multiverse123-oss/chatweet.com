import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PersonaSelector from "./PersonaSelector";
import ToneSelector from "./ToneSelector";
import { Persona, Tone } from "@/types/chat";

interface UserProfileProps {
  userId: string;
  email: string;
}

const UserProfile = ({ userId, email }: UserProfileProps) => {
  const [defaultPersona, setDefaultPersona] = useState<Persona>("general");
  const [defaultTone, setDefaultTone] = useState<Tone>("neutral");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('default_persona, default_tone')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setDefaultPersona((data.default_persona as Persona) || "general");
      setDefaultTone((data.default_tone as Tone) || "neutral");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        default_persona: defaultPersona,
        default_tone: defaultTone,
      })
      .eq('id', userId);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Account Information</h3>
          <div className="space-y-2">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input value={email} disabled />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Default Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Default Persona
              </label>
              <PersonaSelector value={defaultPersona} onChange={setDefaultPersona} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Default Tone
              </label>
              <ToneSelector value={defaultTone} onChange={setDefaultTone} />
            </div>
          </div>
        </Card>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
