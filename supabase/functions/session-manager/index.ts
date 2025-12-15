import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, deviceId, userAgent, ipAddress, sessionToken } = await req.json();

    console.log('Session manager action:', action, 'for user:', userId);

    switch (action) {
      case 'create_session': {
        // Invalidate all existing sessions for this user
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('is_active', true);

        // Log forced logout
        await supabase.from('login_history').insert({
          user_id: userId,
          device_id: deviceId,
          ip_address: ipAddress,
          action: 'forced_logout'
        });

        // Create new session token
        const newSessionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        const { data: session, error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            session_token: newSessionToken,
            device_id: deviceId,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating session:', error);
          throw error;
        }

        // Log login
        await supabase.from('login_history').insert({
          user_id: userId,
          device_id: deviceId,
          ip_address: ipAddress,
          action: 'login'
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            sessionToken: newSessionToken,
            expiresAt,
            message: 'Session created, other devices logged out'
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'validate_session': {
        const { data: session, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('device_id', deviceId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !session) {
          return new Response(
            JSON.stringify({ valid: false, message: 'Session invalid or expired' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update last activity
        await supabase
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('session_token', sessionToken);

        return new Response(
          JSON.stringify({ valid: true, session }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'logout': {
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken)
          .eq('device_id', deviceId);

        await supabase.from('login_history').insert({
          user_id: userId,
          device_id: deviceId,
          ip_address: ipAddress,
          action: 'logout'
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Logged out successfully' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'get_active_sessions': {
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('last_activity', { ascending: false });

        return new Response(
          JSON.stringify({ sessions: sessions || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'cleanup_expired': {
        const { error } = await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .lt('expires_at', new Date().toISOString())
          .eq('is_active', true);

        return new Response(
          JSON.stringify({ success: true, message: 'Expired sessions cleaned up' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in session-manager function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
