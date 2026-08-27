
CREATE OR REPLACE FUNCTION public.game_place_bet(_aposta numeric, _is_demo boolean DEFAULT false)
RETURNS TABLE (session_id uuid, saldo numeric, saldo_bonus numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  _uid uuid := auth.uid();
  _min numeric;
  _max numeric;
  _p record;
  _from_bonus numeric;
  _from_saldo numeric;
  _sid uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF _aposta IS NULL OR _aposta <= 0 THEN
    RAISE EXCEPTION 'Aposta inválida';
  END IF;

  SELECT COALESCE((SELECT gs.value FROM public.game_settings gs WHERE gs.slug = 'aposta_min' AND gs.user_id IS NULL), 1),
         COALESCE((SELECT gs.value FROM public.game_settings gs WHERE gs.slug = 'aposta_max' AND gs.user_id IS NULL), 500)
    INTO _min, _max;

  IF _aposta < _min OR _aposta > _max THEN
    RAISE EXCEPTION 'Aposta deve estar entre % e %', _min, _max;
  END IF;

  SELECT p.* INTO _p FROM public.profiles p WHERE p.id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  IF _p.bloqueado THEN
    RAISE EXCEPTION 'Conta bloqueada';
  END IF;

  IF COALESCE(_p.saldo, 0) + COALESCE(_p.saldo_bonus, 0) < _aposta THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  _from_bonus := LEAST(COALESCE(_p.saldo_bonus, 0), _aposta);
  _from_saldo := _aposta - _from_bonus;

  UPDATE public.profiles p
     SET saldo_bonus = COALESCE(p.saldo_bonus, 0) - _from_bonus,
         saldo = COALESCE(p.saldo, 0) - _from_saldo,
         total_apostado = COALESCE(p.total_apostado, 0) + _aposta
   WHERE p.id = _uid;

  INSERT INTO public.game_sessions (user_id, aposta, status, is_demo)
  VALUES (_uid, _aposta, 'open', COALESCE(_is_demo, false))
  RETURNING id INTO _sid;

  RETURN QUERY
  SELECT _sid, p.saldo, p.saldo_bonus FROM public.profiles p WHERE p.id = _uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.game_settle_bet(
  _session_id uuid,
  _ganho numeric,
  _resultado text DEFAULT NULL,
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (saldo numeric, saldo_bonus numeric, ganho numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  _uid uuid := auth.uid();
  _s record;
  _win numeric := GREATEST(COALESCE(_ganho, 0), 0);
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT s.* INTO _s FROM public.game_sessions s
   WHERE s.id = _session_id AND s.user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rodada não encontrada';
  END IF;
  IF _s.status <> 'open' THEN
    RAISE EXCEPTION 'Rodada já encerrada';
  END IF;

  IF _win > _s.aposta * 1000 THEN
    RAISE EXCEPTION 'Ganho inválido';
  END IF;

  UPDATE public.game_sessions s
     SET status = 'closed', ganho = _win, ended_at = now(), updated_at = now(),
         data = COALESCE(_data, '{}'::jsonb)
   WHERE s.id = _session_id;

  IF NOT _s.is_demo AND _win > 0 THEN
    UPDATE public.profiles p SET saldo = COALESCE(p.saldo, 0) + _win WHERE p.id = _uid;
  END IF;

  INSERT INTO public.game_history (user_id, session_id, aposta, ganho, resultado, is_demo, data)
  VALUES (_uid, _session_id, _s.aposta, _win, _resultado, _s.is_demo, COALESCE(_data, '{}'::jsonb));

  RETURN QUERY
  SELECT p.saldo, p.saldo_bonus, _win FROM public.profiles p WHERE p.id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.game_place_bet(numeric, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.game_settle_bet(uuid, numeric, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.game_place_bet(numeric, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.game_settle_bet(uuid, numeric, text, jsonb) TO authenticated;
