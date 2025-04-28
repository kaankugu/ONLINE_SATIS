import React, { useState } from 'react';
import '../css/login.css';

// Ortak apiFetch’in yoksa buradaki fonksiyonu kullan
async function apiFetch(url, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const merged = {
    ...options,
    credentials: 'include',
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  };

  let res = await fetch(url, merged);

  if (res.status === 401) {
    const refresh = await fetch('/api/token/refresh/', {
      method: 'POST',
      credentials: 'include',
    });
    if (refresh.ok) {
      res = await fetch(url, merged);
    } else {
      alert('Oturum süresi doldu, lütfen tekrar giriş yapın.');
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API Hatası: ${res.status} – ${txt}`);
  }

  return res.json();
}

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();              // ← Mutlaka engelle!
    setLoading(true);
    try {
      const data = await apiFetch('/api/login/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      console.log('Response:', data);
      // tam sayfa reload ile yönlendir
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Giriş başarısız. Bilgilerini kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${window.location.origin}/accounts/google/login/`;
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>Giriş Yap</h2>

        <label htmlFor="email">E‑posta</label>
        <input
          type="email" id="email" name="email"
          value={form.email} onChange={handleChange}
          placeholder="you@example.com" required
        />

        <label htmlFor="password">Şifre</label>
        <input
          type="password" id="password" name="password"
          value={form.password} onChange={handleChange}
          placeholder="••••••••" required
        />

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        <div className="divider">veya</div>

        <button
          type="button"
          className="btn google"
          onClick={handleGoogle}
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google logo"
          />
          Google ile Giriş
        </button>
      </form>
    </div>
  );
};

export default Login;
