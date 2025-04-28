// static/js/search_results.js

/**
 * Arama sonuçlarını getirip ekrana basar.
 * apiFetch fonksiyonu global scope'ta tanımlı ve JSON döndürüyor.
 */

// Ürün beğeni toggle
async function toggleLike(productId, iconEl) {
    try {
        const res = await apiFetch(`/api/products/${productId}/toggle-like/`, { method: 'POST' });
        await res.json();

        // ikon sınıfını toggle et
        const isNowLiked = iconEl.classList.toggle('fa-solid');
        iconEl.classList.toggle('fa-regular', !isNowLiked);
    } catch (err) {
        console.error('toggleLike error:', err);
    }
}

// Kullanıcının beğendiği ürün ID'lerini getirir
async function fetchLikedProductIds() {
    try {
        const liked = await apiFetch('/api/products/liked/');
        console.log('Fetched liked IDs:', liked);
        return Array.isArray(liked) ? liked.map(p => p.id) : [];
    } catch (err) {
        console.error('fetchLikedProductIds error:', err);
        return [];
    }
}

// Arama sonuçlarını çeken fonksiyon
async function fetchSearchProducts() {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    try {
        const products = await apiFetch(
            `/api/search/products/?search=${encodeURIComponent(q)}`
        );
        console.log('Fetched search products:', products);
        return Array.isArray(products) ? products : [];
    } catch (err) {
        console.error('fetchSearchProducts error:', err);
        return [];
    }
}

// Ürünleri ekrana bas
async function displayProducts() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const summaryEl = document.getElementById('search-summary');
    const container = document.getElementById('product-container');

    if (!query) {
        summaryEl.textContent = 'Arama sorgusu bulunamadı.';
        return;
    }

    summaryEl.textContent = `"${query}" için arama yapılıyor...`;
    console.log('Search query:', query);

    // Ürün ve beğeni ID'lerini aynı anda çek
    const [products, likedIds] = await Promise.all([
        fetchSearchProducts(),
        fetchLikedProductIds()
    ]);

    console.log('Products array:', products);
    console.log('Liked IDs array:', likedIds);

    summaryEl.textContent = `"${query}" için ${products.length} sonuç bulundu`;

    if (!products.length) {
        container.innerHTML = '<p>Hiçbir sonuç bulunamadı.</p>';
        return;
    }

    container.innerHTML = '';
    const tpl = document.getElementById('product-card-template').content;

    products.forEach(product => {
        const frag = tpl.cloneNode(true);

        // Görsel ve like ikonu
        const imgDiv = frag.querySelector('.product-images');
        imgDiv.innerHTML = `
            <img src="${product.images?.[0]?.image || '/static/images/no_image.png'}" alt="${product.title}">
            <i class="heart-icon fa-regular fa-heart"></i>
        `;
        const heartIcon = frag.querySelector('.heart-icon');
        const liked = likedIds.includes(product.id);
        heartIcon.classList.toggle('fa-solid', liked);
        heartIcon.classList.toggle('fa-regular', !liked);
        heartIcon.addEventListener('click', e => {
            e.stopPropagation();
            toggleLike(product.id, heartIcon);
        });

        // Başlık
        frag.querySelector('.product-title').textContent = product.title;

        // Yıldız değerlendirme
        const reviews = Array.isArray(product.reviews) ? product.reviews : [];
        const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0);
        const avg = reviews.length ? Math.round(sum / reviews.length) : 0;
        const stars = '★'.repeat(avg) + '☆'.repeat(5 - avg);
        frag.querySelector('.product-rating').innerHTML =
            `<span class="stars">${stars}</span> <span class="review-count">(${reviews.length})</span>`;

        // Fiyat
        frag.querySelector('.product-price').textContent = `${product.price} TL`;

        // Kart tıklama: detay sayfasına git
        frag.querySelector('.product-card').addEventListener('click', () => {
            window.location.href = `/product-detail/${product.id}/`;
        });

        container.appendChild(frag);
    });
}

window.addEventListener('DOMContentLoaded', displayProducts);

