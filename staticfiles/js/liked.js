async function fetchLikedProducts() {
    try {
        const res = await apiFetch('/api/products/liked/');
        if (!res.ok) throw new Error("Beğenilen ürünleri alırken hata oluştu.");
        return await res.json();
    } catch (err) {
        console.error("Liked API hatası:", err);
        return [];
    }
}

async function toggleLike(productId) {
    try {
        const res = await apiFetch(`/api/products/${productId}/toggle-like/`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error("Beğeni kaldırılamadı.");
        // Sayfayı yeniden yükle
        window.location.reload();
    } catch (err) {
        alert("Beğeni kaldırılamadı. Giriş yapmış olmalısın.");
        console.error(err);
    }
}

async function displayLikedProducts() {
    const products = await fetchLikedProducts();
    const likedContainer = document.getElementById('liked-container');

    if (!likedContainer) return;

    if (!products || products.length === 0) {
        likedContainer.innerHTML = "<p>Henüz beğendiğin bir ürün yok.</p>";
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        const productImageDiv = document.createElement('div');
        productImageDiv.classList.add('product-images');

        if (!product.images || product.images.length === 0) {
            productImageDiv.innerHTML = "<img src='/static/images/no_image.png' alt='Görsel yok'>";
        } else {
            if (product.images && product.images.length > 0) {
                const firstImage = product.images[0];
                if (firstImage && firstImage.image) {
                    const imgEl = document.createElement('img');
                    imgEl.src = firstImage.image;
                    imgEl.alt = product.title;
                    productImageDiv.appendChild(imgEl);
                }
            } else {
                productImageDiv.innerHTML = "<img src='/static/images/no_image.png' alt='Görsel yok'>";
            }
        }

        const heartBtn = document.createElement('button');
        heartBtn.classList.add('liked-heart-btn');
        heartBtn.innerHTML = '❤️';
        heartBtn.onclick = () => toggleLike(product.id);

        productCard.innerHTML = `
            ${productImageDiv.outerHTML}
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <p>Fiyat: ₺${product.price}</p>
        `;

        productCard.appendChild(heartBtn);
        likedContainer.appendChild(productCard);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    displayLikedProducts();
});
