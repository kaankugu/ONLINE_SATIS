const orderId = window.location.pathname.split('/').filter(x => x).pop();

$(function () {
  fetch(`/api/orders/${orderId}/`, { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error("Yüklenemedi");
      return res.json();
    })
    .then(order => renderOrderDetail(order))
    .catch(() => {
      $('#order-detail-container').html("<p>❌ Sipariş bilgisi yüklenemedi.</p>");
    });
});

function renderOrderDetail(order) {
  const html = `
    <div class="order-detail-card">
      <h4>Sipariş #${order.id}</h4>
      <p><strong>Tarih:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Durum:</strong> ${formatStatus(order.status)}</p>
      <p><strong>Toplam:</strong> ${order.total_amount}₺</p>
      <p><strong>Adres:</strong> ${order.address}</p>
      <ul>
        ${order.items.map(item => `
          <li>${item.product_title} — ${item.quantity} adet — ${item.price_at_order}₺</li>
        `).join('')}
      </ul>
    </div>
  `;
  $('#order-detail-container').html(html);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
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
