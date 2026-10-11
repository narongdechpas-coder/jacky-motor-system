import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { BrandLogo } from './common';

/**
 * Staff password for the Jacky system (back office, products, partner channel, reports, demo tools).
 * This is a demo gate in the page itself, not real security: anyone can read it in the page source.
 */
const STAFF_PASSWORD = '5228';
const KEY = 'abc-staff-ok';
const MAX_TRIES = 5;
const LOCK_SECONDS = 30;

/** Unlocked for this browser tab (asked again in a new tab or after signing out). */
export function staffUnlocked() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
export function setStaffUnlocked(on: boolean) {
  try {
    if (on) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: unlocked for this page load only */
  }
}

export function StaffGate({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  const { t } = useT();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [tries, setTries] = useState(0);
  const [wait, setWait] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), [wait]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  useEffect(() => {
    if (!wait) return;
    const h = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(h);
  }, [wait]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wait) return;
    if (pw === STAFF_PASSWORD) {
      setStaffUnlocked(true);
      return onOk();
    }
    const n = tries + 1;
    setPw('');
    if (n >= MAX_TRIES) {
      setTries(0);
      setWait(LOCK_SECONDS);
      return setErr(t('sgLocked', { s: LOCK_SECONDS }));
    }
    setTries(n);
    setErr(t('sgWrong', { n: MAX_TRIES - n }));
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal staff-gate" role="dialog" aria-modal="true" aria-labelledby="sg-title" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <div className="modal-head">
          <h3 id="sg-title" className="modal-brand"><BrandLogo size={36} /> {t('sgTitle')}</h3>
          <button type="button" className="btn ghost small" onClick={onCancel} aria-label={t('close')}>×</button>
        </div>
        <p className="hint">{t('sgLead')}</p>
        <label htmlFor="sg-password" className="field-label">{t('sgPassword')}</label>
        <input
          ref={input}
          id="sg-password"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={12}
          value={pw}
          disabled={wait > 0}
          aria-invalid={!!err}
          onChange={(e) => { setPw(e.target.value); setErr(''); }}
        />
        {(err || wait > 0) && <p className="error" role="alert">{wait > 0 ? t('sgLocked', { s: wait }) : err}</p>}
        <p className="hint sg-note">{t('sgNote')}</p>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onCancel}>{t('cancel')}</button>
          <button type="submit" className="btn primary" disabled={!pw || wait > 0}>{t('sgEnter')}</button>
        </div>
      </form>
    </div>
  );
}
