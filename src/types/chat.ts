export type Persona = 
  | "general"
  | "doctor"
  | "lawyer"
  | "journalist"
  | "soldier"
  | "crypto-knight"
  | "accountant"
  | "immigration-lawyer"
  | "financial-adviser"
  | "civil-engineer"
  | "software-engineer"
  | "navy-officer";

export type Tone = 
  | "neutral"
  | "happy"
  | "sad"
  | "playful"
  | "emergency"
  | "romantic"
  | "humorous";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  persona?: Persona;
  tone?: Tone;
}

export const PERSONAS: Record<Persona, { label: string; icon: string; disclaimer?: string }> = {
  general: { label: "General Assistant", icon: "💬" },
  doctor: { 
    label: "Doctor", 
    icon: "⚕️",
    disclaimer: "This is for informational purposes only and not a substitute for professional medical advice."
  },
  lawyer: { 
    label: "Lawyer", 
    icon: "⚖️",
    disclaimer: "This is for informational purposes only and not a substitute for professional legal advice."
  },
  journalist: { label: "Journalist", icon: "📰" },
  soldier: { label: "Soldier", icon: "🎖️" },
  "crypto-knight": { label: "Crypto Knight", icon: "₿" },
  accountant: { 
    label: "Accountant", 
    icon: "🧮",
    disclaimer: "This is for informational purposes only and not a substitute for professional accounting advice."
  },
  "immigration-lawyer": { 
    label: "Immigration Lawyer", 
    icon: "🛂",
    disclaimer: "This is for informational purposes only and not a substitute for professional legal advice."
  },
  "financial-adviser": { 
    label: "Financial Adviser", 
    icon: "💰",
    disclaimer: "This is for informational purposes only and not a substitute for professional financial advice."
  },
  "civil-engineer": { label: "Civil Engineer", icon: "🏗️" },
  "software-engineer": { label: "Software Engineer", icon: "💻" },
  "navy-officer": { label: "Navy Officer", icon: "⚓" },
};

export const TONES: Record<Tone, { label: string; icon: string }> = {
  neutral: { label: "Neutral", icon: "😐" },
  happy: { label: "Happy", icon: "😊" },
  sad: { label: "Sad", icon: "😢" },
  playful: { label: "Playful", icon: "😜" },
  emergency: { label: "Emergency", icon: "🚨" },
  romantic: { label: "Romantic", icon: "❤️" },
  humorous: { label: "Humorous", icon: "😂" },
};
