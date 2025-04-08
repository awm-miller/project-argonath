import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Create Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user has black classification
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('classification:user_classifications(name)')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.classification?.name !== 'black') {
      throw new Error('Unauthorized');
    }

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role:user_roles(id, name),
        classification:user_classifications(id, name, level)
      `);
    if (profilesError) throw profilesError;

    // Combine auth users with their profiles
    const combinedUsers = users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id) || null;
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.email?.split('@')[0] || 'Unknown',
        role: profile?.role || null,
        classification: profile?.classification || null,
        created_at: authUser.created_at,
      };
    });

    return new Response(JSON.stringify(combinedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Unauthorized' ? 403 : 500,
    });
  }
});