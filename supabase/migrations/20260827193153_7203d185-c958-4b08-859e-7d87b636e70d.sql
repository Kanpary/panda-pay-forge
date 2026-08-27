CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_code text;
  v_referrer uuid;
  v_code text;
BEGIN
  v_ref_code := nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'affiliate_code', '')), '');

  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer FROM public.profiles
    WHERE lower(affiliate_code) = lower(v_ref_code) LIMIT 1;
  END IF;

  LOOP
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE affiliate_code = v_code);
  END LOOP;

  INSERT INTO public.profiles (id, email, nome, telefone, cpf, affiliate_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'nome', '')), ''),
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'telefone', '')), ''),
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'cpf', '')), ''),
    v_code,
    v_referrer
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, nome, affiliate_code)
SELECT u.id, u.email, nullif(trim(coalesce(u.raw_user_meta_data ->> 'nome','')),''),
       lower(substr(replace(gen_random_uuid()::text,'-',''),1,8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;