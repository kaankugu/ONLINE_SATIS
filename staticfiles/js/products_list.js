async function toggleLike(productId, heartIcon) {
    try {
        const res = await fetch(`/api/products/${productId}/toggle-like/`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await res.json();
        heartIcon.textContent = heartIcon.textContent === '❤️' ? '🤍' : '❤️';
        alert('Beğeni işlemi başarıyla gerçekleşmiştir.');
    } catch (err) {
        alert('Beğeni işlemi başarısız oldu.');
        console.error(err);
    }
}

// ✅ Beğenilen ürün ID'lerini getir
async function fetchLikedProductIds() {
    try {
        const likedProducts = await apiFetch('/api/products/liked/');
        return likedProducts.map(p => p.id);
    } catch (error) {
        console.error("fetchLikedProductIds hatası:", error);
        return [];
    }
}
// Ürünleri backend'den getir
async function fetchProducts() {
    try {
        const data = await apiFetch('/api/products/');
        return data;
    } catch (error) {
        console.error("fetchProducts hatası:", error);
        return [];
    }
}

async function displayProducts() {
    const products = await fetchProducts();
    const likedProductIds = await fetchLikedProductIds();

    console.log("✅ Ürünler:", products);
    console.log("✅ Beğenilen ID'ler:", likedProductIds);
    const productContainer = document.getElementById('product-container');
    const template = document.getElementById('product-card-template');

    if (!productContainer) return;

    if (!products || products.length === 0) {
        productContainer.innerHTML = "<p>Hiç ürün bulunamadı.</p>";
        return;
    }

    productContainer.innerHTML = "";

    try {
        products.forEach(product => {
            const productCardFragment = template.content.cloneNode(true);
            const cardDiv = productCardFragment.querySelector('.product-card');

            // 👇 RESİM
            let imgHtml = "";
            if (!product.images || product.images.length === 0) {
                imgHtml = "<img src='/static/images/no_image.png' alt='Görsel yok'>";
            } else {
                const firstImage = product.images[0];
                if (firstImage && firstImage.image) {
                    imgHtml = `<img src="${firstImage.image}" alt="${product.title}">`;
                } else {
                    imgHtml = "<img src='/static/images/no_image.png' alt='Görsel yok'>";
                }
            }

            const imagesDiv = productCardFragment.querySelector('.product-images');
            if (imagesDiv) {
                imagesDiv.innerHTML = "";
                imagesDiv.insertAdjacentHTML("beforeend", imgHtml);
            }

            // 👇 BAŞLIK
            const titleElement = productCardFragment.querySelector('.product-title');
            if (titleElement) titleElement.textContent = product.title;

            // 👇 YILDIZ
            const ratingElement = productCardFragment.querySelector('.product-rating');
            if (ratingElement) {
                const reviews = product.reviews || [];
                const totalRatings = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;
                const rounded = Math.round(averageRating);
                const fullStars = '★'.repeat(rounded);
                const emptyStars = '☆'.repeat(5 - rounded);
                const reviewCountText = ` <span class="review-count">(${reviews.length})</span>`;

                ratingElement.innerHTML = `<span class="stars">${fullStars}${emptyStars}</span>${reviewCountText}`;
            }


            // 👇 FİYAT
            const priceElement = productCardFragment.querySelector('.product-price');
            if (priceElement) priceElement.textContent = `${product.price} TL`;

            // 👇 KALP
            const heartIcon = productCardFragment.querySelector('.heart-icon');
            if (heartIcon) {
                const isLiked = likedProductIds.includes(product.id);
                heartIcon.textContent = isLiked ? '❤️' : '🤍';
                heartIcon.classList.add("no-redirect");
                heartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleLike(product.id, heartIcon);
                });
            }

            cardDiv.addEventListener('click', function (e) {
                if (e.target.closest('.no-redirect')) return;
                window.location.href = `/product-detail/${product.id}/`;
            });

            productContainer.appendChild(productCardFragment);
        });
    } catch (e) {
        console.error("🧨 Kart oluştururken hata:", e);
    }
}

window.addEventListener("DOMContentLoaded", function () {
    displayProducts();

    const productContainer = document.getElementById('product-container');
    if (productContainer) {
        productContainer.addEventListener("click", function (event) {
            const addToCartBtn = event.target.closest('.add-to-cart-btn');
            if (addToCartBtn) {
                event.stopPropagation();
                const productId = parseInt(addToCartBtn.dataset.productId);
                if (isNaN(productId)) {
                    console.error("Geçersiz ürün ID");
                    return;
                }
                let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
                cartItems.push(productId);
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
                alert("Ürün sepete eklendi!");
            }
        });
    }
});
