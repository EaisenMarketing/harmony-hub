// Central checkout-intent builder: guarantees that the instrument the user
// picked in the UI is exactly what gets billed in the subscription flow.
import { INSTRUMENT_PLAN_MAP, isValidInstrument, type InstrumentSlug } from '@/lib/instrument-access';

export interface CheckoutIntent {
  instrument: InstrumentSlug;
  plan: InstrumentSlug; // one plan per instrument → same slug
  label: string;
  billingInterval: 'month';
}

const PENDING_CHECKOUT_KEY = 'acorde:pending-checkout';

export const buildCheckoutIntent = (instrument: InstrumentSlug): CheckoutIntent => {
  const info = INSTRUMENT_PLAN_MAP[instrument];
  return {
    instrument,
    plan: instrument,
    label: info.label,
    billingInterval: 'month',
  };
};

export const savePendingCheckout = (instrument: InstrumentSlug) => {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(buildCheckoutIntent(instrument)));
  } catch { /* noop */ }
};

export const readPendingCheckout = (): CheckoutIntent | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutIntent>;
    if (!isValidInstrument(parsed.instrument)) return null;
    return buildCheckoutIntent(parsed.instrument);
  } catch {
    return null;
  }
};

export const clearPendingCheckout = () => {
  try { sessionStorage.removeItem(PENDING_CHECKOUT_KEY); } catch { /* noop */ }
};
