
-- Free materials (lead magnets) that admin uploads
CREATE TABLE public.free_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_image_url text,
  pdf_path text NOT NULL,
  instagram_keyword text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.free_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_materials TO authenticated;
GRANT ALL ON public.free_materials TO service_role;

ALTER TABLE public.free_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active materials"
  ON public.free_materials FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage materials insert"
  ON public.free_materials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage materials update"
  ON public.free_materials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage materials delete"
  ON public.free_materials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_free_materials_updated_at
  BEFORE UPDATE ON public.free_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads captured from the landing page
CREATE TABLE public.material_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.free_materials(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  instagram_handle text,
  source text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.material_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_leads TO authenticated;
GRANT ALL ON public.material_leads TO service_role;

ALTER TABLE public.material_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a lead"
  ON public.material_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.material_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.material_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
  ON public.material_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_material_leads_updated_at
  BEFORE UPDATE ON public.material_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_material_leads_material ON public.material_leads(material_id);
CREATE INDEX idx_material_leads_created ON public.material_leads(created_at DESC);
