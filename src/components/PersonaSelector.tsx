import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Persona, PERSONAS } from "@/types/chat";

interface PersonaSelectorProps {
  value: Persona;
  onChange: (value: Persona) => void;
}

const PersonaSelector = ({ value, onChange }: PersonaSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Persona</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PERSONAS).map(([key, { label, icon }]) => (
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

export default PersonaSelector;
