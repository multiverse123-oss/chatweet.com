import "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video, prompt } = await req.json();
    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!HF_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Hugging Face token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try video generation model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('HF API error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Video processing is currently unavailable. This feature requires advanced models that may need warm-up time.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoBlob = await response.blob();
    const arrayBuffer = await videoBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ video: `data:video/mp4;base64,${base64}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
