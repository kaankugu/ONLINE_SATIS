$(function () {
  fetch('/orders/orders/', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => renderOrders(data))
    .catch(() => {
      $('#orders-container').html("<p>❌ Siparişler yüklenemedi.</p>");
    });
});

function renderOrders(orders) {
  if (orders.length === 0) {
    $('#orders-container').html("<p>Henüz bir siparişiniz yok.</p>");
    return;
  }

  const html = orders.map(order => `
    <div class="order-card" data-order-id="${order.id}">
      <h4>Sipariş #${order.id} - ${formatDate(order.created_at)}</h4>
      <p>Durum: <strong>${formatStatus(order.status)}</strong></p>
      <p>Toplam: <strong>${order.total_amount}₺</strong></p>
      <ul>
        ${order.items.map(item => `
          <li>${item.product_title} — ${item.quantity} adet</li>
        `).join('')}
      </ul>
      <button class="delete-order-btn" data-id="${order.id}">🗑️ Sil</button>
    </div>
  `).join('');

  $('#orders-container').html(html);

  // butonlara tıklama olayı bağla
  $('.delete-order-btn').click(function () {
    const orderId = $(this).data('id');
    if (!confirm(`Sipariş #${orderId} silinsin mi?`)) return;

    fetch(`/orders/delete/${orderId}/`, {
      method: "DELETE",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        alert("✅ Sipariş silindi!");
        $(`.order-card[data-order-id="${orderId}"]`).remove();
      })
      .catch(() => {
        alert("❌ Sipariş silinemedi.");
      });
  });
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleString('tr-TR');
}

function formatStatus(status) {
  const labels = {
    pending: "Bekliyor",
    approved: "Onaylandı",
    shipped: "Kargoya Verildi",
    delivered: "Teslim Edildi",
    cancelled: "İptal Edildi"
  };
  return labels[status] || status;
}
