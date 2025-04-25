// static/js/cards.js

/**
 * apiFetch: tüm API istekleri buradan geçer.
 * - credentials: 'include' ile cookie’leri otomatik gönderir
 * - JSON header’ı ekler
 * - 401 gelirse refresh endpoint’ine gidip yeni token alır ve isteği tekrar dener
 */
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const opts = {
    ...options,
    credentials: 'include',
    headers
  };

  let response = await fetch(url, opts);

  // Eğer access token süresi dolduysa
  if (response.status === 401) {
    // Refresh isteği
    const refreshRes = await fetch('/api/token/refresh/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (refreshRes.ok) {
      // Yenilenen token sonrası isteği tekrar dene
      response = await fetch(url, opts);
    } else {
      // Refresh başarısızsa login sayfasına yönlendir
      window.location.href = '/login/';
      throw new Error('Session expired, please login again');
    }
  }

  return response;
}

document.addEventListener('DOMContentLoaded', () => {
  const cardList    = document.getElementById('cardList');
  const editModalEl = document.getElementById('editCardModal');
  const editModal   = new bootstrap.Modal(editModalEl);

  // MM/YY formatı için otomatik "/"
  function addSlashOnInput(input) {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g, '');
      if (v.length > 2) {
        input.value = v.slice(0,2) + '/' + v.slice(2,4);
      } else {
        input.value = v;
      }
    });
  }
  ['expiration_date','edit_expiration_date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) addSlashOnInput(el);
  });

  // Kartları getir ve render et
  async function loadCards() {
    try {
      const res  = await apiFetch('/api/cards/', { method: 'GET' });
      if (!res.ok) throw new Error('Kartlar yüklenemedi.');
      const data = await res.json();

      cardList.innerHTML = '';
      data.forEach(card => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.id = `card-${card.id}`;
        li.innerHTML = `
          <span>**** **** **** ${card.card_number.slice(-4)} – ${card.card_holder}</span>
          <div>
            <button class="btn btn-sm btn-secondary edit-card" data-id="${card.id}">Düzenle</button>
            <button class="btn btn-sm btn-danger delete-card" data-id="${card.id}">Sil</button>
          </div>`;
        cardList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Kart silme işlemi
  cardList.addEventListener('click', async e => {
    if (!e.target.classList.contains('delete-card')) return;
    const id = e.target.dataset.id;
    if (!confirm('Kartı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await apiFetch(`/api/cards/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme hatası');
      document.getElementById(`card-${id}`).remove();
    } catch (err) {
      console.error(err);
    }
  });

  // Düzenleme modalını doldur
  cardList.addEventListener('click', async e => {
    if (!e.target.classList.contains('edit-card')) return;
    const id = e.target.dataset.id;
    try {
      const res  = await apiFetch(`/api/cards/${id}/`, { method: 'GET' });
      if (!res.ok) throw new Error('Detay yüklenemedi');
      const card = await res.json();

      document.getElementById('editCardId').value           = card.id;
      document.getElementById('edit_card_holder').value     = card.card_holder;
      document.getElementById('edit_card_number').value     = card.card_number;
      document.getElementById('edit_expiration_date').value = card.expiration_date;
      document.getElementById('edit_cvv').value             = card.cvv;
      editModal.show();
    } catch (err) {
      console.error(err);
    }
  });

  // Düzenlemeyi kaydet
  document.getElementById('saveEditCard').addEventListener('click', async () => {
    const id = document.getElementById('editCardId').value;
    const payload = {
      card_holder:      document.getElementById('edit_card_holder').value,
      card_number:      document.getElementById('edit_card_number').value,
      expiration_date:  document.getElementById('edit_expiration_date').value,
      cvv:              document.getElementById('edit_cvv').value
    };
    try {
      const res = await apiFetch(`/api/cards/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Güncellenemedi');
      await res.json();
      editModal.hide();
      loadCards();
    } catch (err) {
      console.error(err);
    }
  });

  // Yeni kart ekleme
  document.getElementById('addCardForm').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      card_holder:     document.getElementById('card_holder').value,
      card_number:     document.getElementById('card_number').value,
      expiration_date: document.getElementById('expiration_date').value,
      cvv:             document.getElementById('cvv').value
    };
    try {
      const res = await apiFetch('/api/cards/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Eklenemedi');
      await res.json();
      e.target.reset();
      new bootstrap.Collapse(document.getElementById('addCardCollapse'), { toggle: false }).hide();
      loadCards();
    } catch (err) {
      console.error(err);
    }
  });

  // Sayfa yüklendiğinde kartları getir
  loadCards();
});