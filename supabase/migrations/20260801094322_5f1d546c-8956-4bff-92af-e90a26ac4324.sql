CREATE OR REPLACE FUNCTION public.claim_studio_invite(_invite_code TEXT)
RETURNS TABLE (account_id UUID, studio_name TEXT, joined BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account public.teacher_accounts;
  v_email TEXT;
  v_row public.teacher_students;
  v_used INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'not_authenticated';
    RETURN;
  END IF;

  SELECT * INTO v_account FROM public.teacher_accounts
    WHERE invite_code = _invite_code LIMIT 1;

  IF v_account.id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'invalid_code';
    RETURN;
  END IF;

  IF v_account.status NOT IN ('trial', 'active') THEN
    RETURN QUERY SELECT v_account.id, v_account.studio_name, false, 'studio_inactive';
    RETURN;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  -- ya vinculado
  SELECT * INTO v_row FROM public.teacher_students
    WHERE teacher_account_id = v_account.id AND student_user_id = auth.uid() LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    IF v_row.status <> 'active' THEN
      UPDATE public.teacher_students
        SET status = 'active', joined_at = COALESCE(joined_at, now())
        WHERE id = v_row.id;
    END IF;
    RETURN QUERY SELECT v_account.id, v_account.studio_name, true, 'already_member';
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_used FROM public.teacher_students
    WHERE teacher_account_id = v_account.id AND status <> 'inactive';

  -- invitación previa por email
  SELECT * INTO v_row FROM public.teacher_students
    WHERE teacher_account_id = v_account.id
      AND lower(email) = lower(v_email)
      AND student_user_id IS NULL
    LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    UPDATE public.teacher_students
      SET student_user_id = auth.uid(), status = 'active', joined_at = now()
      WHERE id = v_row.id;
    RETURN QUERY SELECT v_account.id, v_account.studio_name, true, 'claimed';
    RETURN;
  END IF;

  IF v_used >= v_account.seat_limit THEN
    RETURN QUERY SELECT v_account.id, v_account.studio_name, false, 'seats_full';
    RETURN;
  END IF;

  INSERT INTO public.teacher_students
    (teacher_account_id, student_user_id, full_name, email, instrument, status, joined_at)
  VALUES (
    v_account.id,
    auth.uid(),
    COALESCE((SELECT full_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1), v_email),
    v_email,
    v_account.primary_instrument,
    'active',
    now()
  );

  RETURN QUERY SELECT v_account.id, v_account.studio_name, true, 'joined';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_studio_invite(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_teacher_account_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_teacher_account(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_studio_account_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_student_of_account(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.teacher_seats_used(UUID) FROM anon;