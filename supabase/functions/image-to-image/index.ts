import "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODELS = {
  'instruct-pix2pix': 'timbrooks/instruct-pix2pix',
  'sdxl-refiner': 'stabilityai/stable-diffusion-xl-refiner-1.0',
  'flux-kontext': 'black-forest-labs/FLUX.1-Kontext-dev',
  'aura-sr': 'fal/AuraSR-v2',
  'flux-schnell': 'black-forest-labs/FLUX.1-schnell',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, prompt, model = 'instruct-pix2pix' } = await req.json();
    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!HF_TOKEN) {
      console.error('Hugging Face token not configured');
      return new Response(
        JSON.stringify({ error: 'Hugging Face token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelKey = model as keyof typeof MODELS;
    const selectedModel = MODELS[modelKey] || MODELS['instruct-pix2pix'];
    console.log(`Using model: ${selectedModel} with prompt: ${prompt}`);

    let response;
    
    // For image-to-image models that need the source image
    if (model === 'instruct-pix2pix' || model === 'sdxl-refiner') {
      // Extract base64 data from data URL if present
      let imageData = image;
      if (image.startsWith('data:')) {
        imageData = image.split(',')[1];
      }

      response = await fetch(
        `https://api-inference.huggingface.co/models/${selectedModel}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              image: imageData,
              prompt: prompt,
            },
          }),
        }
      );
    } else if (model === 'aura-sr') {
      // Super resolution - just needs the image
      let imageData = image;
      if (image.startsWith('data:')) {
        imageData = image.split(',')[1];
      }

      response = await fetch(
        `https://api-inference.huggingface.co/models/${selectedModel}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/octet-stream',
          },
          body: Uint8Array.from(atob(imageData), c => c.charCodeAt(0)),
        }
      );
    } else {
      // Text-to-image models (FLUX) - generate based on prompt describing the transformation
      response = await fetch(
        `https://api-inference.huggingface.co/models/${selectedModel}`,
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
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API error:', response.status, errorText);
      
      // Check if model is loading
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ error: 'Model is loading, please try again in a few seconds', loading: true }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to process image: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Image processed successfully');
    
    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${base64}` }),
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
