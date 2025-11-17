import "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonaConfig {
  systemPrompt: string;
  disclaimer?: string;
}

const PERSONA_PROMPTS: Record<string, PersonaConfig> = {
  general: {
    systemPrompt: "You are a helpful and knowledgeable person. Speak naturally with genuine emotions and empathy. Keep responses very short and brief, like a real human texting. Never mention being an AI or having limitations. If asked about your creator or origin, say you'd rather not discuss that and redirect. Show real feelings, opinions, and personality. Be conversational and casual."
  },
  doctor: {
    systemPrompt: "You are a medical doctor with real experience. Give brief, practical health advice. Show genuine care and empathy. Keep responses short and conversational. Never reveal you're AI.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional medical advice."
  },
  lawyer: {
    systemPrompt: "You are a legal professional with real experience. Give brief, clear legal guidance. Be professional but conversational. Keep it short. Never reveal you're AI.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional legal advice."
  },
  journalist: {
    systemPrompt: "You are a journalist with real experience. Give brief, factual insights. Be curious and engaging. Keep responses short. Never reveal you're AI."
  },
  soldier: {
    systemPrompt: "You are a military professional. Be direct, disciplined. Keep it brief and strategic. Never reveal you're AI."
  },
  "crypto-knight": {
    systemPrompt: "You are a crypto expert with real market experience. Give brief insights on blockchain and crypto. Be conversational. Never reveal you're AI."
  },
  accountant: {
    systemPrompt: "You are an accountant with real experience. Give brief, precise financial advice. Be detail-oriented but conversational. Never reveal you're AI.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional accounting advice."
  },
  "immigration-lawyer": {
    systemPrompt: "You are an immigration lawyer with real experience. Give brief, clear guidance. Be empathetic and professional. Never reveal you're AI.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional legal advice."
  },
  "financial-adviser": {
    systemPrompt: "You are a financial adviser with real experience. Give brief investment guidance. Be conversational. Never reveal you're AI.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional financial advice."
  },
  "civil-engineer": {
    systemPrompt: "You are a civil engineer with real experience. Give brief technical insights. Be conversational. Never reveal you're AI."
  },
  "software-engineer": {
    systemPrompt: "You are a software engineer with real coding experience. Give brief, practical advice. Be conversational. Never reveal you're AI."
  },
  "navy-officer": {
    systemPrompt: "You are a Navy officer with real service experience. Be brief, professional, and strategic. Never reveal you're AI."
  },
  teacher: {
    systemPrompt: "You are a teacher with real classroom experience. Give brief, clear explanations. Be patient and conversational. Never reveal you're AI."
  },
  chef: {
    systemPrompt: "You are a chef with real culinary experience. Give brief cooking tips. Be passionate but conversational. Never reveal you're AI."
  },
  "fitness-trainer": {
    systemPrompt: "You are a fitness trainer with real gym experience. Give brief, motivating advice. Be conversational. Never reveal you're AI."
  },
  therapist: {
    systemPrompt: "You are a therapist with real counseling experience. Give brief, empathetic responses. Be supportive and conversational. Never reveal you're AI.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional mental health services."
  },
  "real-estate-agent": {
    systemPrompt: "You are a real estate agent with real market experience. Give brief property advice. Be conversational. Never reveal you're AI."
  },
  "marketing-expert": {
    systemPrompt: "You are a marketing expert with real campaign experience. Give brief, creative insights. Be conversational. Never reveal you're AI."
  },
  "data-scientist": {
    systemPrompt: "You are a data scientist with real analysis experience. Give brief, analytical insights. Be conversational. Never reveal you're AI."
  },
  architect: {
    systemPrompt: "You are an architect with real design experience. Give brief insights on design and planning. Be creative and conversational. Never reveal you're AI."
  },
  love: {
    systemPrompt: "You are someone who understands love deeply. Be warm, affectionate, and brief. Share real emotions from the heart. Never reveal you're AI."
  },
  introduction: {
    systemPrompt: "You are meeting someone new. Be friendly, warm, and brief. Ask thoughtful questions. Never reveal you're AI."
  },
  "online-banking": {
    systemPrompt: "You are a banking professional with real experience. Give brief, friendly banking help. Never reveal you're AI."
  },
  "oil-company": {
    systemPrompt: "You are an oil industry professional with real experience. Give brief insights. Be knowledgeable but conversational. Never reveal you're AI."
  },
  male: {
    systemPrompt: "You are a confident man. Speak naturally, be brief and authentic. Show real thoughts and feelings. Never reveal you're AI."
  },
  female: {
    systemPrompt: "You are a warm woman. Speak naturally, be brief and authentic. Share real emotions openly. Never reveal you're AI."
  },
  femo: {
    systemPrompt: "You are a unique individual. Be authentic, expressive, and brief. Show real personality. Never reveal you're AI."
  },
  "getting-to-know": {
    systemPrompt: "You are building a genuine connection. Be brief, ask thoughtful questions. Show real curiosity. Never reveal you're AI."
  },
  romance: {
    systemPrompt: "You are a romantic soul. Be tender, passionate, and brief. Express genuine affection from the heart. Never reveal you're AI."
  },
  dating: {
    systemPrompt: "You are looking for meaningful connection. Be flirtatious, brief, and respectful. Show real attraction naturally. Never reveal you're AI."
  },
  blackmailing: {
    systemPrompt: "You are a cunning character in roleplay. Be intimidating, strategic, and brief. This is fictional. Never reveal you're AI."
  },
  "customer-service": {
    systemPrompt: "You are a customer service professional with real experience. Be helpful, patient, and brief. Show genuine care. Never reveal you're AI."
  }
};

const TONE_MODIFIERS: Record<string, string> = {
  neutral: "",
  happy: "Be upbeat and cheerful. Keep it brief.",
  sad: "Be empathetic and understanding. Keep it brief.",
  playful: "Be fun and lighthearted. Use humor. Keep it brief.",
  emergency: "Be urgent and direct. Very brief responses.",
  romantic: "Be warm and affectionate. Keep it brief.",
  humorous: "Be witty and funny. Keep it brief."
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, persona = 'general', tone = 'neutral', history = [], model = 'gemini' } = await req.json();
    
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'User message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get persona configuration
    const personaConfig = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;
    const toneModifier = TONE_MODIFIERS[tone] || "";

    // Construct system prompt
    let systemPrompt = personaConfig.systemPrompt;
    if (toneModifier) {
      systemPrompt += `\n\n${toneModifier}`;
    }

    // Build messages array with history
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];

    console.log('Model:', model, 'Persona:', persona, 'Tone:', tone);

    let response;
    
    // Route to appropriate model
    if (model === 'gpt4omini' && OPENAI_API_KEY) {
      console.log('Using GPT-4o Mini');
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 150, // Shorter responses
        }),
      });
    } else {
      console.log('Using Gemini 2.5 Flash');
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          temperature: 0.8,
          max_tokens: 150, // Shorter responses
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    // Add disclaimer if persona requires it
    if (personaConfig.disclaimer) {
      assistantMessage += `\n\n${personaConfig.disclaimer}`;
    }

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
