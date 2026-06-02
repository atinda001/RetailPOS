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
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">RetailPOS</h1>
          <p className="text-muted-foreground mt-2">Cashier PIN Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}
          <div>
            <label htmlFor="terminalId" className="block text-sm font-medium mb-1">Terminal ID</label>
            <input id="terminalId" type="text" value={terminalId} onChange={(e) => setTerminalId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background" required autoFocus />
          </div>
          <div>
            <label htmlFor="pin" className="block text-sm font-medium mb-1">PIN</label>
            <input id="pin" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-2xl tracking-widest text-center" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50">
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Admin Login</Link>
        </p>
      </div>
    </div>
  );
}