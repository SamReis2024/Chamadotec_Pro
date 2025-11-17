import React, { useEffect, useState } from 'react';

type LoginResponse = {
  token?: string;
};

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const shouldRemember = localStorage.getItem('auth.remember') === 'true';
      if (shouldRemember) {
        const savedEmail = localStorage.getItem('auth.email') ?? '';
        setEmail(savedEmail);
        setRemember(true);
        // Intentionally do not load password from storage for security reasons.
      } else {
        setEmail('');
        setPassword('');
        setRemember(false);
      }
    } catch (e) {
      setEmail('');
      setPassword('');
      setRemember(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Replace with the project's real login API call
      const result: LoginResponse = await fakeLoginApi(email, password);

      if (remember) {
        localStorage.setItem('auth.remember', 'true');
        localStorage.setItem('auth.email', email);
      } else {
        localStorage.removeItem('auth.remember');
        localStorage.removeItem('auth.email');
      }

      if (result.token) {
        localStorage.setItem('auth.token', result.token);
      }

      // TODO: redirect or update auth state
    } catch (err: any) {
      setError(err?.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      {/* Hidden field to help prevent some browser autofill behaviors */}
      <input style={{ display: 'none' }} type="text" name="prevent_autofill" autoComplete="off" />

      <div>
        <label htmlFor="email">E‑mail</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="seu@exemplo.com"
        />
      </div>

      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Sua senha"
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          Lembrar meu login
        </label>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

/* Mock da API de login apenas para exemplo */
async function fakeLoginApi(email: string, password: string): Promise<LoginResponse> {
  await new Promise(r => setTimeout(r, 500));
  if (email === 'teste@ex.com' && password === '123') return { token: 'fake-token' };
  throw new Error('Credenciais inválidas');
}