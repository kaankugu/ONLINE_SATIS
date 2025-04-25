// static/js/addresses.js

/**
 * apiFetch: tüm API istekleri buradan geçer.
 * - credentials: 'include' ile cookie’leri gönderir
 * - JSON header’ı ekler ve Authorization header'ını cookie'deki access_token ile doldurur
 * - 401 gelirse refresh token endpoint’ine POST atar, ardından orijinal isteği tekrar dener
 */

// Cookie'den token okuma yardımcı fonksiyonu
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  async function apiFetch(url, options = {}) {
    // Mevcut access token
    const token = getCookie('access_token');
    
    // Başlangıç header'ları
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
  
    const opts = {
      ...options,
      credentials: 'include',
      headers
    };
  
    let response = await fetch(url, opts);
  
    // Access token süresi dolduysa 401 dönebilir
    if (response.status === 401) {
      // Refresh isteği
      const refresh_token = getCookie('refresh_token');
      if (!refresh_token) {
        window.location.href = '/login/';
        throw new Error('Refresh token bulunamadı, tekrar giriş yapın');
      }
      const refreshRes = await fetch('/api/token/refresh/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh_token })
      });
  
      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        // Yeni access token'ı cookie'ye yaz (isteğe bağlı)
        document.cookie = `access_token=${access}; path=/; SameSite=None; Secure`;
        // Authorization header güncelle
        opts.headers['Authorization'] = `Bearer ${access}`;
        // Orijinal isteği tekrar dene
        response = await fetch(url, opts);
      } else {
        window.location.href = '/login/';
        throw new Error('Session expired, please login again');
      }
    }
  
    return response;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const addressList     = document.getElementById('addressList');
    const addAddressForm  = document.getElementById('addAddressForm');
    const collapseEl      = document.getElementById('addAddressCollapse');
  
    // Adresleri getir & render et
    async function loadAddresses() {
      try {
        const res = await apiFetch('/api/addresses/', { method: 'GET' });
        if (!res.ok) throw new Error('Adresler yüklenemedi.');
        const data = await res.json();
  
        addressList.innerHTML = '';
        data.forEach(addr => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.id = `address-${addr.id}`;
          li.innerHTML = `
            <div>
              <strong>${addr.title}</strong><br>
              ${addr.district}, ${addr.city}<br>
              <small class="text-muted">${addr.full_address}</small>
            </div>
            <button class="btn btn-sm btn-danger delete-address" data-id="${addr.id}">Sil</button>
          `;
          addressList.appendChild(li);
        });
      } catch (err) {
        console.error('Adresler yükleme hatası:', err);
      }
    }
  
    // Yeni adres ekleme
    addAddressForm.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        title:        document.getElementById('title').value,
        city:         document.getElementById('city').value,
        district:     document.getElementById('district').value,
        full_address: document.getElementById('full_address').value
      };
      try {
        const res = await apiFetch('/api/addresses/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Adres ekleme başarısız.');
        await res.json();
        addAddressForm.reset();
        if (collapseEl) new bootstrap.Collapse(collapseEl, { toggle: false }).hide();
        loadAddresses();
      } catch (err) {
        console.error('Adres ekleme hatası:', err);
      }
    });
  
    // Adres silme
    addressList.addEventListener('click', async e => {
      if (!e.target.classList.contains('delete-address')) return;
      const id = e.target.dataset.id;
      if (!confirm('Bu adresi silmek istediğine emin misin?')) return;
      try {
        const res = await apiFetch(`/api/addresses/${id}/`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Adres silme başarısız.');
        document.getElementById(`address-${id}`).remove();
      } catch (err) {
        console.error('Adres silme hatası:', err);
      }
    });
  
    // İlk yükleme
    loadAddresses();
  });
  