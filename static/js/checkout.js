document.addEventListener("DOMContentLoaded", () => {
    const addressSelect = document.getElementById("address-select");
    const cardSelect = document.getElementById("card-select");
    const cartSummary = document.getElementById("cart-summary");
    const checkoutBtn = document.getElementById("final-checkout-button");

    async function apiFetch(url, options = {}) {
        return fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async function loadAddresses() {
        try {
            const res = await apiFetch('/api/addresses/');
            const data = await res.json();

            addressSelect.innerHTML = '';
            if (data.length === 0) {
                addressSelect.style.display = 'none';
                document.getElementById('new-address-form').style.display = 'block';
                return;
            }

            document.getElementById('new-address-form').style.display = 'none';
            addressSelect.style.display = 'block';

            data.forEach(addr => {
                const opt = document.createElement('option');
                opt.value = addr.id;
                opt.textContent = `${addr.title} – ${addr.city}/${addr.district}`;
                addressSelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Adresler alınamadı", err);
        }
    }

    async function loadCards() {
        try {
            const res = await apiFetch('/api/cards/');
            const data = await res.json();

            cardSelect.innerHTML = '';
            if (data.length === 0) {
                cardSelect.style.display = 'none';
                document.getElementById('new-card-form').style.display = 'block';
                return;
            }

            document.getElementById('new-card-form').style.display = 'none';
            cardSelect.style.display = 'block';

            data.forEach(card => {
                const opt = document.createElement('option');
                opt.value = card.id;
                opt.textContent = `**** **** **** ${card.card_number.slice(-4)} – ${card.card_holder}`;
                cardSelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Kartlar alınamadı", err);
        }
    }

    document.getElementById('add-address-btn').addEventListener('click', async () => {
        const payload = {
            title: document.getElementById('addr-title').value,
            city: document.getElementById('addr-city').value,
            district: document.getElementById('addr-district').value,
            full_address: document.getElementById('addr-full').value
        };
        try {
            const res = await apiFetch('/api/addresses/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            await res.json();
            await loadAddresses();
        } catch (err) {
            alert("Adres eklenemedi.");
        }
    });

    document.getElementById('add-card-btn').addEventListener('click', async () => {
        const payload = {
            card_holder: document.getElementById('card-holder').value,
            card_number: document.getElementById('card-number').value,
            expiration_date: document.getElementById('card-expiration').value,
            cvv: document.getElementById('card-cvv').value,
        };
        try {
            const res = await apiFetch('/api/cards/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            await res.json();
            await loadCards();
        } catch (err) {
            alert("Kart eklenemedi.");
        }
    });

    function updateCartSummary() {
        const items = JSON.parse(localStorage.getItem('cartItems')) || [];
        const count = items.length;
        let total = 0;
        const productMap = {};

        items.forEach(id => {
            if (!productMap[id]) productMap[id] = 0;
            productMap[id]++;
        });

        const promises = Object.keys(productMap).map(id =>
            fetch(`/api/product/${id}/`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    total += parseFloat(data.price) * productMap[id];
                })
        );

        Promise.all(promises).then(() => {
            cartSummary.innerHTML = `
          <p>Toplam Ürün: <strong>${count}</strong></p>
          <p>Toplam Tutar: <strong>${total.toFixed(2)} ₺</strong></p>
        `;
        });
    }

    checkoutBtn.addEventListener('click', () => {
        const addressId = parseInt(addressSelect?.value);
        const cardId = parseInt(cardSelect?.value);

        const items = JSON.parse(localStorage.getItem('cartItems')) || [];

        if (!addressId || !cardId || items.length === 0) {
            alert("Tüm bilgileri eksiksiz doldurun.");
            return;
        }

        const orderPayload = {
            address_id: addressId,
            card_id: cardId,
            products: items
        };

        fetch('/orders/create/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(orderPayload)
        })
            .then(res => {
                if (!res.ok) throw new Error('Sipariş başarısız.');
                return res.json();
            })
            .then(data => {
                alert("✅ Sipariş başarıyla oluşturuldu!");
                localStorage.removeItem('cartItems');
                window.location.href = "/";
            })
            .catch(err => {
                alert("❌ Sipariş oluşturulamadı.");
                console.error(err);
            });

    });

    loadAddresses();
    loadCards();
    updateCartSummary();
});
