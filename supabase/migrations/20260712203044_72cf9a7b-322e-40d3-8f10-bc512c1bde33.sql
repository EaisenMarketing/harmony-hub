
-- 1) Ampliar courses con campos que la web pública necesita
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS preview_video_url text,
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'plan',
  ADD COLUMN IF NOT EXISTS individual_price_cents integer,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES public.instructor_profiles(id) ON DELETE SET NULL;

-- Slug helper (unaccent-lite)
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' FROM regexp_replace(
    lower(
      translate(
        coalesce(input, ''),
        'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
      )
    ),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

-- Backfill de slugs (título + sufijo corto si colisiona)
UPDATE public.courses c
SET slug = base.slug
FROM (
  SELECT id,
    CASE
      WHEN row_number() OVER (PARTITION BY public.slugify(title) ORDER BY created_at) = 1
        THEN public.slugify(title)
      ELSE public.slugify(title) || '-' || substr(id::text, 1, 6)
    END AS slug
  FROM public.courses
  WHERE slug IS NULL OR slug = ''
) base
WHERE c.id = base.id;

-- Unicidad del slug
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique ON public.courses(slug);

-- 2) Testimonios moderados
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  role_or_instrument text,
  quote text NOT NULL,
  avatar_url text,
  is_approved boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved testimonials"
  ON public.testimonials FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Authenticated users can submit testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_approved = false);

CREATE POLICY "Admins manage testimonials"
  ON public.testimonials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
