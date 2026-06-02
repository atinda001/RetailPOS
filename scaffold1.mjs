import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const BASE = 'c:/Users/HomePC/Desktop/RetailPOS/apps/pos/src';
const w = (rel, content) => {
  const p = join(BASE, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
  console.log('OK:', rel);
};

const L = '\u003C';
const G = '\u003E';
const Q = '\u0022';
const B = '\u0060';

// ── LoginPage ──
w('pages/auth/LoginPage.tsx', `
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/pos'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    ${L}div className=${Q}min-h-screen flex items-center justify-center bg-muted/40${Q}${G}
      ${L}div className=${Q}w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border${Q}${G}
        ${L}div className=${Q}text-center${Q}${G}
          ${L}h1 className=${Q}text-3xl font-bold text-primary${Q}${G}RetailPOS${L}/h1${G}
          ${L}p className=${Q}text-muted-foreground mt-2${Q}${G}Sign in to your account${L}/p${G}
        ${L}/div${G}
        ${L}form onSubmit={handleSubmit} className=${Q}space-y-4${Q}${G}
          {error && ${L}div className=${Q}p-3 text-sm bg-destructive/10 text-destructive rounded-md${Q}${G}{error}${L}/div${G}}
          ${L}div${G}
            ${L}label htmlFor=${Q}email${Q} className=${Q}block text-sm font-medium mb-1${Q}${G}Email${L}/label${G}
            ${L}input id=${Q}email${Q} type=${Q}email${Q} value={email} onChange={(e) => setEmail(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} required autoFocus /${G}
          ${L}/div${G}
          ${L}div${G}
            ${L}label htmlFor=${Q}password${Q} className=${Q}block text-sm font-medium mb-1${Q}${G}Password${L}/label${G}
            ${L}input id=${Q}password${Q} type=${Q}password${Q} value={password} onChange={(e) => setPassword(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} required /${G}
          ${L}/div${G}
          ${L}button type=${Q}submit${Q} disabled={loading}
            className=${Q}w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50${Q}${G}
            {loading ? 'Signing in...' : 'Sign In'}
          ${L}/button${G}
        ${L}/form${G}
        ${L}p className=${Q}text-center text-sm text-muted-foreground${Q}${G}
          ${L}Link to=${Q}/pin-login${Q} className=${Q}text-primary hover:underline${Q}${G}PIN Login (Cashier)${L}/Link${G}
        ${L}/p${G}
      ${L}/div${G}
    ${L}/div${G}
  );
}
`.trim());

// ── PinLoginPage ──
w('pages/auth/PinLoginPage.tsx', `
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function PinLoginPage() {
  const [terminalId, setTerminalId] = useState(localStorage.getItem('terminalId') ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinLogin = useAuthStore((s) => s.pinLogin);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { localStorage.setItem('terminalId', terminalId); await pinLogin(terminalId, pin); navigate('/pos'); }
    catch (err) { setError(err instanceof Error ? err.message : 'PIN login failed'); }
    finally { setLoading(false); }
  };

  return (
    ${L}div className=${Q}min-h-screen flex items-center justify-center bg-muted/40${Q}${G}
      ${L}div className=${Q}w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border${Q}${G}
        ${L}div className=${Q}text-center${Q}${G}
          ${L}h1 className=${Q}text-3xl font-bold text-primary${Q}${G}RetailPOS${L}/h1${G}
          ${L}p className=${Q}text-muted-foreground mt-2${Q}${G}Cashier PIN Login${L}/p${G}
        ${L}/div${G}
        ${L}form onSubmit={handleSubmit} className=${Q}space-y-4${Q}${G}
          {error && ${L}div className=${Q}p-3 text-sm bg-destructive/10 text-destructive rounded-md${Q}${G}{error}${L}/div${G}}
          ${L}div${G}
            ${L}label htmlFor=${Q}terminalId${Q} className=${Q}block text-sm font-medium mb-1${Q}${G}Terminal ID${L}/label${G}
            ${L}input id=${Q}terminalId${Q} type=${Q}text${Q} value={terminalId} onChange={(e) => setTerminalId(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background${Q} required autoFocus /${G}
          ${L}/div${G}
          ${L}div${G}
            ${L}label htmlFor=${Q}pin${Q} className=${Q}block text-sm font-medium mb-1${Q}${G}PIN${L}/label${G}
            ${L}input id=${Q}pin${Q} type=${Q}password${Q} maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)}
              className=${Q}w-full px-3 py-2 border rounded-md bg-background text-2xl tracking-widest text-center${Q} required /${G}
          ${L}/div${G}
          ${L}button type=${Q}submit${Q} disabled={loading}
            className=${Q}w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50${Q}${G}
            {loading ? 'Verifying...' : 'Enter'}
          ${L}/button${G}
        ${L}/form${G}
        ${L}p className=${Q}text-center text-sm text-muted-foreground${Q}${G}
          ${L}Link to=${Q}/login${Q} className=${Q}text-primary hover:underline${Q}${G}Admin Login${L}/Link${G}
        ${L}/p${G}
      ${L}/div${G}
    ${L}/div${G}
  );
}
`.trim());

console.log('Auth pages done. Run scaffold2.mjs next.');
