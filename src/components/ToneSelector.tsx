import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tone, TONES } from "@/types/chat";

interface ToneSelectorProps {
  value: Tone;
  onChange: (value: Tone) => void;
}

const ToneSelector = ({ value, onChange }: ToneSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Tone</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TONES).map(([key, { label, icon }]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ToneSelector;
