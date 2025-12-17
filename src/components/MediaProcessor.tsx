import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Video, Mic, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IMAGE_MODELS = [
  { id: 'instruct-pix2pix', name: 'Instruct Pix2Pix', description: 'Edit images with text instructions' },
  { id: 'sdxl-refiner', name: 'SDXL Refiner', description: 'Refine and enhance images' },
  { id: 'flux-kontext', name: 'FLUX Kontext', description: 'Creative image transformations' },
  { id: 'aura-sr', name: 'Aura SR v2', description: 'Super resolution upscaling' },
  { id: 'flux-schnell', name: 'FLUX Schnell', description: 'Fast image generation' },
];

const MediaProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedMedia, setProcessedMedia] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("instruct-pix2pix");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageToImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: "Missing input",
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    if (!prompt && selectedModel !== 'aura-sr') {
      toast({
        title: "Missing prompt",
        description: "Please provide a prompt describing the transformation",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedMedia(null);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('image-to-image', {
          body: { image: base64Image, prompt, model: selectedModel }
        });

        if (error) throw error;
        
        if (data.loading) {
          toast({
            title: "Model Loading",
            description: "The model is warming up. Please try again in 20-30 seconds.",
          });
          setIsProcessing(false);
          return;
        }
        
        setProcessedMedia(data.image);
        toast({
          title: "Success!",
          description: "Image transformed successfully",
        });
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleVideoToVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !prompt) {
      toast({
        title: "Missing input",
        description: "Please provide both a video and a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Video = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('video-to-video', {
          body: { video: base64Video, prompt }
        });

        if (error) throw error;
        
        setProcessedMedia(data.video);
        toast({
          title: "Success!",
          description: "Video processed successfully",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Video processing unavailable. Models may need warm-up time.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceChange = async (e: React.ChangeEvent<HTMLInputElement>, gender: 'male' | 'female') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioData = reader.result;
        
        const { data, error } = await supabase.functions.invoke('voice-changer', {
          body: { audio: audioData, targetGender: gender }
        });

        if (error) throw error;
        
        setProcessedMedia(data.audio);
        toast({
          title: "Success!",
          description: `Voice changed to ${gender}`,
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Voice processing unavailable. Models may need initialization time.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Media Processing</h3>
      
      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">
            <ImageIcon className="w-4 h-4 mr-2" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-4 h-4 mr-2" />
            Video
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="w-4 h-4 mr-2" />
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI Model" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedModel !== 'aura-sr' && (
            <Input
              placeholder="Describe how to transform the image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          )}
          
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageToImage}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => imageInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing with {IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...
              </>
            ) : (
              `Upload & Transform Image`
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            {IMAGE_MODELS.find(m => m.id === selectedModel)?.description}
          </p>
        </TabsContent>

        <TabsContent value="video" className="space-y-3">
          <Input
            placeholder="Describe video transformation..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoToVideo}
            accept="video/*"
            className="hidden"
          />
          <Button
            onClick={() => videoInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload & Transform Video"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="voice" className="space-y-3">
          <input
            type="file"
            ref={audioInputRef}
            accept="audio/*"
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                audioInputRef.current?.click();
                audioInputRef.current?.addEventListener('change', (e) => 
                  handleVoiceChange(e as any, 'male')
                );
              }}
              disabled={isProcessing}
            >
              Change to Male
            </Button>
            <Button
              onClick={() => {
                audioInputRef.current?.click();
                audioInputRef.current?.addEventListener('change', (e) => 
                  handleVoiceChange(e as any, 'female')
                );
              }}
              disabled={isProcessing}
            >
              Change to Female
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {processedMedia && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Processed Result:</h4>
          {processedMedia.startsWith('data:image') && (
            <img src={processedMedia} alt="Processed" className="w-full rounded-lg" />
          )}
          {processedMedia.startsWith('data:video') && (
            <video src={processedMedia} controls className="w-full rounded-lg" />
          )}
          {processedMedia.startsWith('data:audio') && (
            <audio src={processedMedia} controls className="w-full" />
          )}
        </div>
      )}
    </Card>
  );
};

export default MediaProcessor;
