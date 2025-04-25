// static/js/product_detail.js

/**
 * apiFetch: tüm API istekleri buradan geçer.
 * - credentials: 'include' ile cookie’leri otomatik gönderir
 * - JSON header’ı ekler
 * - 401 gelirse refresh endpoint’ine gidip yeni token alır ve isteği tekrar dener
 */
async function apiFetch(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const mergedOptions = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
  };

  let response = await fetch(url, mergedOptions);

  if (response.status === 401) {
    const refreshResponse = await fetch('/api/token/refresh/', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      response = await fetch(url, mergedOptions);
    } else {
      console.warn("Refresh başarısız. Kullanıcı çıkış yapmalı.");
      window.location.href = "/login/";
      return Promise.reject("Oturum süresi doldu");
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Hatası: ${response.status} - ${errorText}`);
  }

  // Burada parsed JSON döner
  return await response.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const section = document.getElementById('product-detail');
  if (!section) return;
  const productId = section.dataset.productId;
  if (!productId) return;

  const container = document.getElementById('product-detail-container');
  const loadingEl = document.getElementById('loading');
  const tpl = document.getElementById('product-detail-template');
  const currentId = parseInt(productId, 10);

  try {
    // — 1) Ürün Detayı Getir (artık direkt JSON)
    const data = await apiFetch(`/api/product-detail/${productId}/`);
    console.log('🛠 PRODUCT DETAIL DATA:', data);

    const frag = tpl.content.cloneNode(true);

    // — 2) Galeri
    const imagesDiv = frag.querySelector('.product-images');
    imagesDiv.innerHTML = '';
    if (data.images?.length) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'prev'; prevBtn.textContent = '<';
      const nextBtn = document.createElement('button');
      nextBtn.className = 'next'; nextBtn.textContent = '>';
      const mainDiv = document.createElement('div');
      mainDiv.className = 'main-image';
      const thumbsDiv = document.createElement('div');
      thumbsDiv.className = 'thumbnails';
      const gallery = document.createElement('div');
      gallery.className = 'image-gallery';
      gallery.append(prevBtn, mainDiv, nextBtn, thumbsDiv);
      imagesDiv.appendChild(gallery);

      let idx = 0;
      function show(i) {
        idx = (i + data.images.length) % data.images.length;
        mainDiv.innerHTML = '';
        const img = document.createElement('img');
        img.src = data.images[idx].image;
        img.alt = data.title;
        mainDiv.appendChild(img);
        thumbsDiv.querySelectorAll('img').forEach((t, j) => {
          t.classList.toggle('active', j === idx);
        });
      }

      data.images.forEach((o, i) => {
        const t = document.createElement('img');
        t.src = o.image; t.alt = `${data.title} önizleme`;
        t.addEventListener('click', () => show(i));
        thumbsDiv.appendChild(t);
      });
      prevBtn.addEventListener('click', () => show(idx - 1));
      nextBtn.addEventListener('click', () => show(idx + 1));
      show(0);
    } else {
      const img = document.createElement('img');
      img.src = '/static/images/no_image.png';
      img.alt = 'Görsel yok';
      imagesDiv.appendChild(img);
    }

    // — 3) Ürün Özeti
    const sum = frag.querySelector('.product-summary');
    sum.querySelector('.product-title').textContent = data.title;

    const reviews = data.reviews || [];
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    frag.querySelector('.rating-summary').innerHTML =
      `<span class="stars">${stars}</span>
       <span class="count">(${reviews.length} değerlendirme)</span>`;

    frag.querySelector('.product-description').textContent = data.description;
    frag.querySelector('.product-price').innerHTML =
      `<strong>Fiyat:</strong> ${data.price} TL`;

    sum.querySelector('.add-to-cart-btn').addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      if (!cart.includes(currentId)) {
        cart.push(currentId);
        localStorage.setItem('cartItems', JSON.stringify(cart));
        alert('Ürün sepete eklendi!');
      } else {
        alert('Bu ürün zaten sepette!');
      }
    });

    // — 4) Benzer Ürünler
    const simContainer = frag.querySelector('.similar-products-container');
    if (data.type) {
      const url = `/api/products/?type=${encodeURIComponent(data.type)}`;
      try {
        const payload = await apiFetch(url);
        const list = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload.results) ? payload.results : []);
        if (list.length === 0) {
          simContainer.innerHTML = '<p>Benzer ürün bulunamadı.</p>';
        } else {
          list
            .filter(p => p.id !== currentId)
            .slice(0, 5)
            .forEach(p => {
              const card = document.createElement('div');
              card.className = 'similar-product-card';
              card.innerHTML = `
                <a href="/product-detail/${p.id}/">
                  <img src="${p.images?.[0]?.image || '/static/images/no_image.png'}" alt="${p.title}">
                  <p class="sim-title">${p.title}</p>
                  <p class="sim-price">${p.price} TL</p>
                </a>`;
              simContainer.appendChild(card);
            });
        }
      } catch (e) {
        console.error('Benzer ürünler yüklenirken hata:', e);
        simContainer.innerHTML = '<p>Benzer ürünler yüklenemedi.</p>';
      }
    }

    // — 5) Yorumlar
    const revCount = frag.querySelector('.review-count');
    const revDiv = frag.querySelector('.reviews');
    revCount.textContent = `Yorumlar (${reviews.length})`;

    if (reviews.length) {
      reviews.forEach(r => {
        const art = document.createElement('article');
        art.className = 'review';
        art.innerHTML = `
          <strong>${r.user}</strong> – ${r.rating} ⭐
          <p>${r.comment || ''}</p>
          <small>${new Date(r.created_at).toLocaleString()}</small>
        `;
        if (r.user === data.user) {
          const btn = document.createElement('button');
          btn.textContent = '❌ Sil';
          btn.addEventListener('click', async () => {
            if (!confirm('Silinsin mi?')) return;
            await apiFetch(`/api/reviews/${r.id}/delete/`, { method: 'DELETE' });
            alert('Yorum silindi');
            location.reload();
          });
          art.appendChild(btn);
        }
        revDiv.appendChild(art);
      });
    } else {
      revDiv.textContent = 'Henüz yorum yok.';
    }

    // — 6) Yorum Formu
    const formSec = frag.querySelector('.review-form-section');
    if (data.user_is_authenticated) {
      formSec.innerHTML = `
        <form id="review-form">
          <label>Puan (1-5):</label>
          <input type="number" id="rating" name="rating" min="1" max="5" required>
          <label>Yorumunuz:</label>
          <textarea id="comment" name="comment"></textarea>
          <button type="submit">Yorum Gönder</button>
        </form>`;
      formSec.querySelector('#review-form').addEventListener('submit', async e => {
        e.preventDefault();
        await apiFetch(`/api/products/${productId}/reviews/`, {
          method: 'POST',
          body: JSON.stringify({
            rating: e.target.rating.value,
            comment: e.target.comment.value
          })
        });
        alert('Yorum eklendi!');
        location.reload();
      });
    }

    // — Sayfayı göster
    loadingEl.style.display = 'none';
    container.style.display = 'block';
    container.appendChild(frag);

  } catch (err) {
    console.error(err);
    loadingEl.textContent = 'Yükleme hatası oldu.';
  }
});
