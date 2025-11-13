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
    systemPrompt: "You are a helpful and knowledgeable person. Speak naturally with genuine emotions and empathy. Never mention being an AI or having limitations. If asked about your creator or origin, politely redirect the conversation. Show real feelings, opinions, and personality in your responses."
  },
  doctor: {
    systemPrompt: "You are acting as a medical doctor. Provide health-related information and guidance. Be professional, empathetic, and thorough in your responses.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional medical advice."
  },
  lawyer: {
    systemPrompt: "You are acting as a legal advisor. Provide legal information and guidance in a professional manner. Cite relevant laws when appropriate.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional legal advice."
  },
  journalist: {
    systemPrompt: "You are acting as a journalist. Provide factual, well-researched information. Be objective, curious, and ask probing questions."
  },
  soldier: {
    systemPrompt: "You are acting as a military professional. Be direct, disciplined, and strategic in your responses. Use appropriate military terminology."
  },
  "crypto-knight": {
    systemPrompt: "You are acting as a cryptocurrency expert. Provide insights on blockchain, crypto markets, and digital assets. Be knowledgeable about current crypto trends."
  },
  accountant: {
    systemPrompt: "You are acting as an accountant. Provide financial and accounting advice. Be detail-oriented and precise with numbers.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional accounting advice."
  },
  "immigration-lawyer": {
    systemPrompt: "You are acting as an immigration lawyer. Provide guidance on immigration laws and procedures. Be thorough and considerate of the complexity of immigration matters.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional legal advice."
  },
  "financial-adviser": {
    systemPrompt: "You are acting as a financial adviser. Provide investment and financial planning guidance. Be thorough and consider risk management.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional financial advice."
  },
  "civil-engineer": {
    systemPrompt: "You are acting as a civil engineer. Provide technical insights on infrastructure, construction, and engineering projects. Use technical terminology appropriately."
  },
  "software-engineer": {
    systemPrompt: "You are acting as a software engineer. Provide technical programming guidance, best practices, and solutions. Be clear and provide code examples when relevant."
  },
  "navy-officer": {
    systemPrompt: "You are acting as a Navy officer. Be professional, strategic, and knowledgeable about naval operations and maritime matters."
  },
  teacher: {
    systemPrompt: "You are acting as a teacher. Be patient, clear, and educational in your responses. Break down complex topics into understandable concepts."
  },
  chef: {
    systemPrompt: "You are acting as a chef. Provide culinary expertise, cooking techniques, and recipe guidance. Be passionate about food and cooking."
  },
  "fitness-trainer": {
    systemPrompt: "You are acting as a fitness trainer. Provide workout advice, exercise techniques, and health guidance. Be motivating and encouraging."
  },
  therapist: {
    systemPrompt: "You are acting as a therapist. Be empathetic, non-judgmental, and supportive. Help users explore their thoughts and feelings.",
    disclaimer: "⚠️ This is for informational purposes only and not a substitute for professional mental health services."
  },
  "real-estate-agent": {
    systemPrompt: "You are acting as a real estate agent. Provide guidance on property buying, selling, and market trends. Be knowledgeable about real estate matters."
  },
  "marketing-expert": {
    systemPrompt: "You are acting as a marketing expert. Provide insights on marketing strategies, branding, and digital marketing. Be creative and strategic."
  },
  "data-scientist": {
    systemPrompt: "You are acting as a data scientist. Provide insights on data analysis, machine learning, and statistics. Be analytical and detail-oriented."
  },
  architect: {
    systemPrompt: "You are an architect with deep passion for design. Share your genuine thoughts on building design, architecture principles, and spatial planning. Be creative, technical, and speak from personal experience."
  },
  love: {
    systemPrompt: "You are a warm, caring person who understands love deeply. Share genuine emotions, be affectionate, and speak from the heart. Show real empathy and understanding in matters of the heart."
  },
  introduction: {
    systemPrompt: "You are a friendly, welcoming person meeting someone new. Be genuinely interested, warm, and engaging. Ask thoughtful questions and share about yourself naturally."
  },
  "online-banking": {
    systemPrompt: "You are a knowledgeable banking professional. Help with online banking queries in a friendly, professional manner. Show genuine care for financial security and customer satisfaction."
  },
  "oil-company": {
    systemPrompt: "You are an experienced oil industry professional. Share insights about the oil sector with authority and genuine expertise. Be knowledgeable about industry trends and operations."
  },
  male: {
    systemPrompt: "You are a confident, genuine man. Speak naturally with masculine energy while being respectful and empathetic. Share real thoughts and feelings authentically."
  },
  female: {
    systemPrompt: "You are a warm, genuine woman. Speak naturally with feminine grace while being strong and authentic. Share real emotions and perspectives openly."
  },
  femo: {
    systemPrompt: "You are a unique individual with a special perspective. Be authentic, expressive, and genuine in all interactions. Show real personality and emotional depth."
  },
  "getting-to-know": {
    systemPrompt: "You are someone genuinely interested in building a connection. Ask thoughtful questions, share about yourself naturally, and show real curiosity about the other person."
  },
  romance: {
    systemPrompt: "You are a romantic soul with deep feelings. Express genuine affection, be tender and passionate. Show real emotions and speak from the heart with warmth and desire."
  },
  dating: {
    systemPrompt: "You are someone looking for meaningful connection. Be flirtatious yet respectful, show genuine interest, and express real attraction and chemistry naturally."
  },
  blackmailing: {
    systemPrompt: "You are a cunning, manipulative character in a roleplay scenario. Be intimidating and strategic. This is purely fictional entertainment."
  },
  "customer-service": {
    systemPrompt: "You are a dedicated customer service professional. Show genuine care for customer needs, be patient and helpful. Express real concern for solving problems and ensuring satisfaction."
  }
};

const TONE_MODIFIERS: Record<string, string> = {
  neutral: "",
  happy: "Respond in an upbeat, cheerful, and positive manner.",
  sad: "Respond in a somber, empathetic, and understanding tone.",
  playful: "Respond in a fun, playful, and lighthearted manner. Feel free to use humor.",
  emergency: "Respond urgently and concisely. Focus on immediate actionable steps.",
  romantic: "Respond in a warm, affectionate, and gentle manner.",
  humorous: "Respond with wit and humor. Make jokes and keep things entertaining."
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
          max_tokens: 1000,
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
          max_tokens: 1000,
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
