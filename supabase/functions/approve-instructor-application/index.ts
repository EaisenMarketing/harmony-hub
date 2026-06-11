import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin
    const { data: isAdmin } = await userClient.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { applicationId } = await req.json();
    if (!applicationId) {
      return new Response(JSON.stringify({ error: 'applicationId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: app, error: appErr } = await admin
      .from('instructor_applications')
      .select('*')
      .eq('id', applicationId)
      .single();
    if (appErr || !app) throw new Error('Application not found');
    if (app.status === 'approved') {
      return new Response(JSON.stringify({ error: 'Ya aprobada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate temp password
    const tempPassword = `Acorde${Math.random().toString(36).slice(2, 10)}!`;

    // Check if a user with this email already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    let userId: string;
    const existing = existingUsers?.users?.find((u) => u.email?.toLowerCase() === app.email.toLowerCase());

    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: app.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: app.full_name },
      });
      if (createErr || !created.user) throw new Error(createErr?.message || 'No se pudo crear el usuario');
      userId = created.user.id;
    }

    // Assign instructor role (idempotent)
    await admin.from('user_roles').upsert(
      { user_id: userId, role: 'instructor' },
      { onConflict: 'user_id,role' }
    );

    // Create instructor_profile if not present
    const { data: existingProfile } = await admin
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const instrumentValue = ['guitar', 'piano', 'drums', 'banjo'].includes(app.instrument)
        ? app.instrument
        : 'guitar';
      await admin.from('instructor_profiles').insert({
        user_id: userId,
        instrument: instrumentValue,
        years_experience: app.years_experience,
        bio: app.bio,
        is_active: true,
      });
    }

    // Mark application approved
    await admin
      .from('instructor_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user.id,
      })
      .eq('id', applicationId);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        tempPassword: existing ? null : tempPassword,
        alreadyExisted: !!existing,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('approve-instructor-application error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
