import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'course-content';
const EXPIRES_IN = 60 * 60; // 1 hour

function extractPath(input: string): string | null {
  if (!input) return null;
  // Strip full public/signed URL down to storage path
  const marker = `/${BUCKET}/`;
  const idx = input.indexOf(marker);
  if (idx >= 0) {
    let p = input.slice(idx + marker.length);
    // Remove sub-prefix like "public/" if present in old URLs
    p = p.replace(/^public\//, '');
    // Strip any query params
    const q = p.indexOf('?');
    if (q >= 0) p = p.slice(0, q);
    return decodeURIComponent(p);
  }
  return input; // assume it's already a path
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const lessonId: string | undefined = body?.lessonId;
    if (!lessonId || typeof lessonId !== 'string') {
      return new Response(JSON.stringify({ error: 'lessonId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Look up lesson + course
    const { data: lesson, error: lessonErr } = await admin
      .from('lessons')
      .select('id, video_url, module:course_modules(course_id)')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonErr || !lesson || !lesson.video_url) {
      return new Response(JSON.stringify({ error: 'Lesson not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If video is external (not in our bucket), just return as-is
    const rawUrl: string = lesson.video_url;
    if (!rawUrl.includes(`/${BUCKET}/`) && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
      return new Response(JSON.stringify({ url: rawUrl, external: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Access control
    const courseId = (lesson.module as { course_id: string } | null)?.course_id;
    if (!courseId) {
      return new Response(JSON.stringify({ error: 'Course not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAccess, error: accessErr } = await admin.rpc('has_course_access', {
      _user_id: userId,
      _course_id: courseId,
    });
    if (accessErr || !hasAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const path = extractPath(rawUrl);
    if (!path) {
      return new Response(JSON.stringify({ error: 'Invalid video path' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, EXPIRES_IN);

    if (signErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: signErr?.message || 'Sign failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
