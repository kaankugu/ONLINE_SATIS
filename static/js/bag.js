document.addEventListener("DOMContentLoaded", function () {

    async function apiFetch(url, opts = {}) {
        const response = await fetch(url, {
            ...opts,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response;
    }

    const productContainer = document.getElementById('bag-container');
    const apiUrl = '/api/product/';
    const savedProducts = JSON.parse(localStorage.getItem('cartItems')) || [];

    function updateCartStorage(productId, action) {
        let items = JSON.parse(localStorage.getItem('cartItems')) || [];
        if (action === 'add') {
            items.push(productId);
        } else if (action === 'remove') {
            const index = items.indexOf(productId);
            if (index !== -1) items.splice(index, 1);
        } else if (action === 'deleteAll') {
            items = items.filter(id => id !== productId);
        }
        localStorage.setItem('cartItems', JSON.stringify(items));
    }

    function createProductCard(product, productCount, images) {
        const card = document.createElement('div');
        card.classList.add('product-card');

        const link = document.createElement('a');
        link.href = `/product-detail/${product.id}/`;
        link.style.display = "flex";
        link.style.alignItems = "center";
        link.style.textDecoration = "none";
        link.style.flex = "1";
        link.style.gap = "20px";
        link.style.color = "inherit";

        const image = document.createElement('img');
        image.src = (images && images.length > 0 && images[0].image) ? images[0].image : "/static/images/no_image.png";
        image.alt = product.title || "Ürün";
        image.classList.add('product-image');

        const details = document.createElement('div');
        details.classList.add('product-details');

        const title = document.createElement('div');
        title.classList.add('product-title');
        title.textContent = product.title || "Başlık yok";

        const desc = document.createElement('div');
        desc.classList.add('product-description');
        desc.textContent = product.description || "Açıklama yok";

        details.append(title, desc);
        link.append(image, details);

        const price = document.createElement('div');
        price.classList.add('product-price');
        price.textContent = `${product.price} TL`;

        const actions = document.createElement('div');
        actions.classList.add('product-actions');

        const minusBtn = document.createElement('button');
        minusBtn.textContent = "-";
        minusBtn.onclick = () => {
            updateCartStorage(product.id, 'remove');
            const countEl = document.getElementById(`count-${product.id}`);
            let currentCount = parseInt(countEl.textContent);
            if (currentCount > 1) {
                countEl.textContent = currentCount - 1;
            } else {
                card.remove();
            }

            const remaining = JSON.parse(localStorage.getItem('cartItems')).filter(id => id === product.id).length;
            if (remaining === 0) {
                card.remove();
                if (productContainer.children.length === 0) showEmptyMessage();
            }

            updateCartSummary();
        };

        const count = document.createElement('span');
        count.classList.add('product-count');
        count.id = `count-${product.id}`;
        count.textContent = productCount;

        const plusBtn = document.createElement('button');
        plusBtn.textContent = "+";
        plusBtn.onclick = () => {
            updateCartStorage(product.id, 'add');
            document.getElementById(`count-${product.id}`).textContent++;
            updateCartSummary();
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "Sil";
        deleteBtn.onclick = () => {
            updateCartStorage(product.id, 'deleteAll');
            card.remove();
            if (productContainer.children.length === 0) showEmptyMessage();
            updateCartSummary();
        };

        actions.append(minusBtn, count, plusBtn, deleteBtn);
        card.append(link, price, actions);
        return card;
    }

    function updateCartSummary() {
        const items = JSON.parse(localStorage.getItem('cartItems')) || [];
        const count = items.length;
        let total = 0;

        document.querySelectorAll('.product-card').forEach(card => {
            const priceText = card.querySelector('.product-price').textContent;
            const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
            const count = parseInt(card.querySelector('.product-count').textContent);
            total += price * count;
        });

        const summaryEl = document.getElementById('cart-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `<p>Toplam Ürün: <strong>${count}</strong></p><p>Toplam Tutar: <strong>${total.toFixed(2)} ₺</strong></p>`;
        }
    }

    function showEmptyMessage() {
        const msg = document.createElement('p');
        msg.className = "no-products";
        msg.textContent = "Henüz ürün yok.";
        productContainer.innerHTML = '';
        productContainer.appendChild(msg);
    }

    if (savedProducts.length > 0) {
        const uniqueProducts = [...new Set(savedProducts)];
        uniqueProducts.forEach(productId => {
            const countVal = savedProducts.filter(id => id === productId).length;
            apiFetch(`${apiUrl}${productId}/`)
                .then(async res => {
                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`API Hatası: ${res.status} – ${errorText}`);
                    }
                    return res.json();
                })
                .then(data => {
                    const card = createProductCard(data, countVal, data.images || []);
                    productContainer.appendChild(card);
                    updateCartSummary();
                })
                .catch(err => {
                    console.warn(`❌ Ürün ID ${productId} atlandı: ${err.message}`);
                });
        });
    } else {
        showEmptyMessage();
    }

    // ✅ Satın al butonu
    document.getElementById('checkout-button')?.addEventListener('click', () => {
        window.location.href = '/orders/checkout/';
      });    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const address = document.getElementById('checkout-address').value.trim();
            const items = JSON.parse(localStorage.getItem('cartItems')) || [];

            if (!address) return alert("Lütfen teslimat adresinizi girin.");
            if (items.length === 0) return alert("Sepetiniz boş.");

            console.log("🚀 Sipariş oluşturuluyor:", {
                address: address,
                products: items
            });

            alert("Satın alma işlemi başlatıldı!");
            // fetch('/api/order/', {...}) şeklinde buradan backend'e gönderilebilir.
        });
    }

});
