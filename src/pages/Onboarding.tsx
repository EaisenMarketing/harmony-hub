import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, CreditCard, Loader2, Music, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Seo } from '@/lib/seo';
import { useToast } from '@/hooks/use-toast';
import {
  MEMBERSHIP_PLANS, MEMBERSHIP_PLAN_MAP, isMembershipPlan, LEVELS, TRIAL_DISCLAIMER,
  formatMoney, trialEndCopy, browserTimezone, nextGroupOccurrence, formatInTimezone,
  type PlanKeyNew,
} from '@/lib/membership';
import {
  useEntitlement, useInstrumentsCatalog, useCompatibleGroups, useStartTrial,
  useSetActiveInstrument, useJoinGroup, useSaveTimezone, useSavePaymentMethod, useCanStartTrial,
} from '@/hooks/useMembership';
import type { InstrumentSlug } from '@/lib/instrument-access';

const TOTAL_STEPS = 6;
const STEP_TITLES = [
  'Elige tu plan',
  'Crea tu cuenta',
  'Método de pago',
  'Elige tu instrumento',
  'Nivel y horario',
  '¡Bienvenido a Acorde Live!',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, signUp, signIn } = useAuth();
  const { toast } = useToast();

  const planParam = params.get('plan');
  const [plan, setPlan] = useState<PlanKeyNew>(isMembershipPlan(planParam) ? planParam : 'pro');
  const [step, setStep] = useState(1);

  const { data: ent } = useEntitlement();
  const { data: canTrial } = useCanStartTrial();
  const { data: instruments } = useInstrumentsCatalog();
  const startTrial = useStartTrial();
  const setInstrument = useSetActiveInstrument();
  const joinGroup = useJoinGroup();
  const saveTz = useSaveTimezone();
  const savePm = useSavePaymentMethod();

  // Paso 2 — cuenta
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Paso 3 — pago
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [acceptTrial, setAcceptTrial] = useState(false);

  // Paso 4/5
  const [instrument, setInstrumentSel] = useState<InstrumentSlug | null>(null);
  const [confirmInstrument, setConfirmInstrument] = useState(false);
  const [level, setLevel] = useState<string | null>(null);
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

  const tz = browserTimezone();
  const { data: groups, isLoading: loadingGroups } = useCompatibleGroups(
    step >= 5 ? instrument : null,
    level,
  );

  const planInfo = MEMBERSHIP_PLAN_MAP[plan];

  // Si ya hay sesión, salta el paso de cuenta.
  useEffect(() => {
    if (user && step === 2) setStep(3);
  }, [user, step]);

  useEffect(() => {
    if (ent?.instrument_slug && !instrument) setInstrumentSel(ent.instrument_slug);
    if (ent?.level_key && !level) setLevel(ent.level_key);
  }, [ent, instrument, level]);

  // Candado: no se puede llegar a los pasos posteriores al pago sin sesión
  // y sin una membresía real (prueba activa / suscripción / estudio).
  useEffect(() => {
    if (step >= 3 && !user) setStep(2);
    const hasMembership = !!ent && (ent.status === 'trialing' || ent.status === 'active' || ent.is_admin);
    if (step >= 4 && !hasMembership) setStep(3);
  }, [step, user, ent]);

  const progress = useMemo(() => (step / TOTAL_STEPS) * 100, [step]);

  const handleAccount = async () => {
    if (!email || password.length < 6) {
      toast({ title: 'Datos incompletos', description: 'Ingresa un correo válido y una contraseña de 6+ caracteres.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { error } = mode === 'signup'
      ? await signUp(email, password, fullName)
      : await signIn(email, password);
    setBusy(false);
    if (error) {
      toast({ title: 'No pudimos continuar', description: error.message, variant: 'destructive' });
      return;
    }
    saveTz.mutate(tz);
    setStep(3);
  };

  const handlePayment = async () => {
    if (!acceptTrial) {
      toast({ title: 'Falta confirmar', description: 'Confirma los términos de la prueba gratuita.', variant: 'destructive' });
      return;
    }
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || cardCvc.replace(/\D/g, '').length < 3 || !/^\d{2}\/\d{2}$/.test(cardExp)) {
      toast({ title: 'Método de pago inválido', description: 'Revisa el número, la fecha (MM/AA) y el CVC.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const [mm, yy] = cardExp.split('/');
    await savePm.mutateAsync({
      brand: 'card', last4: digits.slice(-4),
      exp_month: Number(mm), exp_year: 2000 + Number(yy),
    });
    if (canTrial !== false) {
      try {
        await startTrial.mutateAsync({ plan, instrument: null });
      } catch {
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    // Nunca conservamos los datos completos de la tarjeta en memoria.
    setCardNumber('');
    setCardCvc('');
    setCardExp('');
    setStep(4);
  };

  const handleInstrument = async () => {
    if (!instrument) return;
    setBusy(true);
    try {
      await setInstrument.mutateAsync({ instrument });
      setStep(5);
    } finally {
      setBusy(false);
    }
  };

  const handleLevel = async (key: string) => {
    setLevel(key);
    if (instrument) await setInstrument.mutateAsync({ instrument, level: key });
  };

  const handleJoin = async (groupId: string) => {
    try {
      await joinGroup.mutateAsync(groupId);
      setJoinedGroupId(groupId);
      setStep(6);
    } catch { /* toast en el hook */ }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)] text-white">
      <Seo title="Empezar en Acorde Live" description="Activa tu prueba gratis de 3 días, elige tu instrumento y tu horario de clase grupal." path="/empezar" />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
              className="text-sm text-white/50 hover:text-white flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
            <span className="text-xs uppercase tracking-widest text-white/50">
              Paso {step} de {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
          <h1 className="text-2xl md:text-3xl font-black mt-5">{STEP_TITLES[step - 1]}</h1>
        </div>

        {/* PASO 1 — PLAN */}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-3">
            {MEMBERSHIP_PLANS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => { setPlan(p.key); setStep(2); }}
                className={cn(
                  'relative text-left rounded-2xl border p-5 transition-all hover:scale-[1.01]',
                  p.key === plan ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]',
                )}
              >
                {p.popular && (
                  <Badge className="absolute -top-3 left-4 bg-emerald-500 hover:bg-emerald-500">MÁS POPULAR</Badge>
                )}
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="text-3xl font-black mt-1">{formatMoney(p.priceUsd)}<span className="text-sm font-normal text-white/50">/mes</span></p>
                <p className="text-xs text-white/50 mt-1 mb-4">{p.tagline}</p>
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-white/70">
                      <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
            <p className="md:col-span-3 text-center text-xs text-white/40">
              Todos los planes incluyen <strong className="text-white/70">1 instrumento</strong>. Los planes cambian los beneficios, no la cantidad de instrumentos.
            </p>
          </div>
        )}

        {/* PASO 2 — CUENTA */}
        {step === 2 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => setMode('signup')} className={cn('px-3 py-1.5 rounded-lg', mode === 'signup' ? 'bg-white/10' : 'text-white/50')}>Crear cuenta</button>
              <button type="button" onClick={() => setMode('signin')} className={cn('px-3 py-1.5 rounded-lg', mode === 'signin' ? 'bg-white/10' : 'text-white/50')}>Ya tengo cuenta</button>
            </div>
            {mode === 'signup' && (
              <div>
                <Label htmlFor="ob-name">Nombre completo</Label>
                <Input id="ob-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            )}
            <div>
              <Label htmlFor="ob-email">Correo electrónico</Label>
              <Input id="ob-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label htmlFor="ob-pass">Contraseña</Label>
              <Input id="ob-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <Button onClick={handleAccount} disabled={busy} className="w-full">
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Continuar
            </Button>
            <p className="text-xs text-white/40">
              Plan seleccionado: <strong className="text-white/70">{planInfo.name}</strong> · {formatMoney(planInfo.priceUsd)}/mes después de la prueba.
            </p>
          </div>
        )}

        {/* PASO 3 — PAGO */}
        {step === 3 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-300 mb-1">Prueba gratis de 3 días</p>
              <p className="text-sm text-white/80">{TRIAL_DISCLAIMER}</p>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="pm-name">Nombre en la tarjeta</Label>
                <Input id="pm-name" value={cardName} onChange={(e) => setCardName(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div>
                <Label htmlFor="pm-num">Número de tarjeta</Label>
                <Input id="pm-num" inputMode="numeric" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pm-exp">Vencimiento (MM/AA)</Label>
                  <Input id="pm-exp" placeholder="08/29" value={cardExp} onChange={(e) => setCardExp(e.target.value)} className="bg-white/5 border-white/10" />
                </div>
                <div>
                  <Label htmlFor="pm-cvc">CVC</Label>
                  <Input id="pm-cvc" inputMode="numeric" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} className="bg-white/5 border-white/10" />
                </div>
              </div>
            </div>
            <label className="flex gap-3 items-start text-sm text-white/70">
              <Checkbox checked={acceptTrial} onCheckedChange={(v) => setAcceptTrial(!!v)} className="mt-0.5" />
              <span>
                Confirmo los términos de la prueba: hoy pago $0 y, si no cancelo antes de 3 días,
                se activará mi plan <strong className="text-white">{planInfo.name}</strong> por {formatMoney(planInfo.priceUsd)}/mes.
              </span>
            </label>
            <Button onClick={handlePayment} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Activar prueba de 3 días
            </Button>
            <p className="text-[11px] text-white/40">
              El cobro real se procesa con nuestro proveedor de pagos al finalizar la prueba. No almacenamos los datos completos de tu tarjeta.
            </p>
          </div>
        )}

        {/* PASO 4 — INSTRUMENTO */}
        {step === 4 && !confirmInstrument && (
          <div>
            <p className="text-white/60 mb-5">¿Qué instrumento quieres aprender? Puedes elegir solamente uno.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(instruments ?? []).map((i) => (
                <button
                  key={i.slug}
                  type="button"
                  onClick={() => setInstrumentSel(i.slug)}
                  className={cn(
                    'rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]',
                    instrument === i.slug ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]',
                  )}
                >
                  <div className="text-4xl mb-2">{i.emoji ?? '🎵'}</div>
                  <div className="text-sm font-semibold">{i.name}</div>
                </button>
              ))}
            </div>
            <Button className="w-full mt-6" disabled={!instrument} onClick={() => setConfirmInstrument(true)}>
              Continuar
            </Button>
          </div>
        )}

        {step === 4 && confirmInstrument && instrument && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <Music className="w-10 h-10 mx-auto text-emerald-400 mb-4" />
            <p className="text-lg font-semibold mb-2">
              Estás eligiendo {(instruments ?? []).find((i) => i.slug === instrument)?.name} como tu instrumento principal.
            </p>
            <p className="text-sm text-white/60 mb-6">Tu membresía estará asociada a este instrumento.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => setConfirmInstrument(false)} className="border-white/20">
                CAMBIAR SELECCIÓN
              </Button>
              <Button onClick={handleInstrument} disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} CONFIRMAR INSTRUMENTO
              </Button>
            </div>
          </div>
        )}

        {/* PASO 5 — NIVEL Y GRUPO */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <p className="text-white/60 mb-3">¿Cuál es tu nivel?</p>
              <div className="grid gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => handleLevel(l.key)}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left text-sm transition-all',
                      level === l.key ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]',
                    )}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            {level && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/60">Grupos compatibles</p>
                  <span className="text-[11px] text-white/40">Horario mostrado en tu zona horaria ({tz})</span>
                </div>
                {loadingGroups ? (
                  <div className="text-sm text-white/50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Buscando grupos…</div>
                ) : (groups ?? []).length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
                    Todavía no hay grupos abiertos para este instrumento y nivel. Te asignaremos uno en cuanto abra;
                    ya puedes entrar a tu dashboard.
                    <Button className="mt-4 w-full" onClick={() => setStep(6)}>Continuar</Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {(groups ?? []).map((g: any) => {
                      const when = nextGroupOccurrence(g.weekday, g.start_time_utc);
                      const full = g.seats_left <= 0;
                      const trialFull = ent?.status === 'trialing' && g.trial_seats_left <= 0;
                      return (
                        <div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">{g.name} — Grupo {g.code}</p>
                            <p className="text-xs text-white/60">{formatInTimezone(when, tz)}</p>
                            <p className="text-xs text-white/40">
                              {g.teacher_name ? `Maestro ${g.teacher_name} · ` : ''}{g.seats_left} lugares disponibles
                              {ent?.status === 'trialing' ? ` · ${g.trial_seats_left} cupos de prueba` : ''}
                            </p>
                          </div>
                          <Button size="sm" disabled={full || trialFull} onClick={() => handleJoin(g.id)}>
                            {full ? 'Lleno' : trialFull ? 'Sin cupo de prueba' : 'Elegir horario'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 6 — BIENVENIDA */}
        {step === 6 && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-emerald-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Bienvenido a Acorde Live</h2>
            <p className="text-sm text-white/80 mb-1">Tu prueba gratuita de 3 días ya está activa.</p>
            <p className="text-sm text-white/60 mb-6">{trialEndCopy(plan, ent?.trial_ends_at)}</p>
            <Button onClick={() => navigate('/portal')} className="w-full sm:w-auto">Entrar a Mi Acorde Live</Button>
            {joinedGroupId && <p className="text-xs text-white/40 mt-4">Ya quedaste inscrito en tu grupo.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
