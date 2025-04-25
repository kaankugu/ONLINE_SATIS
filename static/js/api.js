function getCookie(name) {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

async function apiFetch(url, opts = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const merged = {
    credentials: 'include',
    ...opts,
    headers: { ...defaultHeaders, ...(opts.headers || {}) },
  };

  let res = await fetch(url, merged);

  if (res.status === 401) {
    // Eğer token yenileme isteğiyse ve 401 döndüyse → login'e yönlendir
    if (url.endsWith('/token/refresh/')) {
      window.location.href = '/login/';
      return Promise.reject('❌ Refresh başarısız');
    }

    // access_token expired → refresh_token ile yenile
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) {
      window.location.href = '/login/';
      return Promise.reject('❌ Refresh token bulunamadı');
    }

    const refreshRes = await fetch('/api/token/refresh/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!refreshRes.ok) {
      window.location.href = '/login/';
      return Promise.reject('❌ Refresh isteği başarısız');
    }

    const { access } = await refreshRes.json();

    // access_token'ı tekrar Authorization header olarak ekle
    merged.headers['Authorization'] = `Bearer ${access}`;

    // access_token'ı isteğe bağlı cookie’ye de yaz (güvenli değilse devrede bırakabilirsin)
    document.cookie = `access_token=${access}; path=/; SameSite=Lax;`;

    // orijinal isteği tekrar gönder
    res = await fetch(url, merged);
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API Hatası: ${res.status} – ${txt}`);
  }

  return res.json();
}
