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
  | "navy-officer"
  | "teacher"
  | "chef"
  | "fitness-trainer"
  | "therapist"
  | "real-estate-agent"
  | "marketing-expert"
  | "data-scientist"
  | "architect"
  | "love"
  | "introduction"
  | "online-banking"
  | "oil-company"
  | "male"
  | "female"
  | "femo"
  | "getting-to-know"
  | "romance"
  | "dating"
  | "blackmailing"
  | "customer-service";

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
  imageUrl?: string;
  isBookmarked?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Bookmark {
  id: string;
  message_id: string;
  created_at: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
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
  teacher: { label: "Teacher", icon: "👨‍🏫" },
  chef: { label: "Chef", icon: "👨‍🍳" },
  "fitness-trainer": { label: "Fitness Trainer", icon: "💪" },
  therapist: { 
    label: "Therapist", 
    icon: "🧠",
    disclaimer: "This is for informational purposes only and not a substitute for professional mental health services."
  },
  "real-estate-agent": { label: "Real Estate Agent", icon: "🏡" },
  "marketing-expert": { label: "Marketing Expert", icon: "📊" },
  "data-scientist": { label: "Data Scientist", icon: "📈" },
  architect: { label: "Architect", icon: "📐" },
  love: { label: "Love", icon: "💕" },
  introduction: { label: "Introduction", icon: "👋" },
  "online-banking": { label: "Online Banking", icon: "🏦" },
  "oil-company": { label: "Oil Company", icon: "🛢️" },
  male: { label: "Male", icon: "👨" },
  female: { label: "Female", icon: "👩" },
  femo: { label: "Femo", icon: "🌟" },
  "getting-to-know": { label: "Getting to Know Each Other", icon: "🤝" },
  romance: { label: "Romance", icon: "💖" },
  dating: { label: "Dating", icon: "💑" },
  blackmailing: { label: "Blackmailing", icon: "🎭" },
  "customer-service": { label: "Customer Service", icon: "📞" },
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
