import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Square, Download, Trash2, Eye, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as MediaTrackConstraints,
        audio: false
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setAnalysisResult(null);
      toast({
        title: "Recording started",
        description: "Your screen is now being recorded"
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not start screen recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Your recording is ready for analysis"
      });
    }
  };

  const captureScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as MediaTrackConstraints
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotUrl(dataUrl);
      setAnalysisResult(null);
      
      toast({
        title: "Screenshot captured",
        description: "Ready for analysis"
      });
    } catch (error) {
      toast({
        title: "Screenshot failed",
        description: "Could not capture screenshot",
        variant: "destructive"
      });
    }
  };

  const analyzeMedia = async (type: 'video' | 'screenshot', analysisType: string = 'screen_analysis') => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let imageBase64 = '';

      if (type === 'screenshot' && screenshotUrl) {
        imageBase64 = screenshotUrl;
      } else if (type === 'video' && recordedBlob) {
        // Extract a frame from the video for analysis
        const video = document.createElement('video');
        video.src = recordedUrl!;
        
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => {
            video.currentTime = Math.min(video.duration / 2, 5); // Get middle frame or 5 seconds
          };
          video.onseeked = () => resolve();
          video.load();
        });

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        imageBase64 = canvas.toDataURL('image/png');
      }

      if (!imageBase64) {
        throw new Error('No media to analyze');
      }

      const { data, error } = await supabase.functions.invoke('vision-analyze', {
        body: { 
          imageBase64,
          analysisType
        }
      });

      if (error) throw error;

      setAnalysisResult(data.analysis);
      toast({
        title: "Analysis complete",
        description: "Vision AI has analyzed your media"
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze media",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadRecording = () => {
    if (recordedUrl) {
      const a = document.createElement('a');
      a.href = recordedUrl;
      a.download = `screen-recording-${Date.now()}.webm`;
      a.click();
    }
  };

  const downloadScreenshot = () => {
    if (screenshotUrl) {
      const a = document.createElement('a');
      a.href = screenshotUrl;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
    }
  };

  const clearRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
      setRecordedBlob(null);
      setAnalysisResult(null);
      chunksRef.current = [];
    }
  };

  const clearScreenshot = () => {
    setScreenshotUrl(null);
    setAnalysisResult(null);
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="record" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="record">Screen Record</TabsTrigger>
          <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Screen Recorder with Vision AI</h3>
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording}>
                <Video className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {recordedUrl && (
            <div className="space-y-4">
              <video
                src={recordedUrl}
                controls
                className="w-full rounded-lg border max-h-64"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadRecording} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={() => analyzeMedia('video', 'screen_analysis')} 
                  size="sm" 
                  variant="secondary"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Analyze Content
                </Button>
                <Button 
                  onClick={() => analyzeMedia('video', 'social_reply')} 
                  size="sm" 
                  variant="secondary"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Suggest Reply
                </Button>
                <Button onClick={clearRecording} size="sm" variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="screenshot" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Screenshot with Vision AI</h3>
          </div>

          <Button onClick={captureScreenshot}>
            <Camera className="w-4 h-4 mr-2" />
            Capture Screenshot
          </Button>

          {screenshotUrl && (
            <div className="space-y-4">
              <img
                src={screenshotUrl}
                alt="Screenshot"
                className="w-full rounded-lg border max-h-64 object-contain"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadScreenshot} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={() => analyzeMedia('screenshot', 'screen_analysis')} 
                  size="sm" 
                  variant="secondary"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Analyze Content
                </Button>
                <Button 
                  onClick={() => analyzeMedia('screenshot', 'social_reply')} 
                  size="sm" 
                  variant="secondary"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Suggest Reply
                </Button>
                <Button 
                  onClick={() => analyzeMedia('screenshot', 'ocr')} 
                  size="sm" 
                  variant="secondary"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Extract Text (OCR)
                </Button>
                <Button onClick={clearScreenshot} size="sm" variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {analysisResult && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Vision AI Analysis
          </h4>
          <div className="text-sm whitespace-pre-wrap">{analysisResult}</div>
        </div>
      )}
    </Card>
  );
};
