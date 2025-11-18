import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, Square, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
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
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
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
        description: "Your recording is ready to download"
      });
    }
  };

  const downloadRecording = () => {
    if (recordedUrl) {
      const a = document.createElement('a');
      a.href = recordedUrl;
      a.download = `screen-recording-${Date.now()}.webm`;
      a.click();
      toast({
        title: "Download started",
        description: "Your recording is being saved"
      });
    }
  };

  const clearRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
      chunksRef.current = [];
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Screen Recorder</h3>
        </div>

        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} disabled={isRecording}>
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
              className="w-full rounded-lg border"
            />
            <div className="flex gap-2">
              <Button onClick={downloadRecording}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={clearRecording} variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
