$(function () {
    fetchOrders();
  });
  
  function fetchOrders() {
    fetch("/orders/all/", { credentials: "include" })
      .then(res => res.json())
      .then(data => renderOrderTable(data))
      .catch(err => {
        console.error("❌ Siparişler alınamadı:", err);
        $('#orders-body').html('<tr><td colspan="6">Siparişler yüklenemedi.</td></tr>');
      });
  }
  
  function renderOrderTable(orders) {
    if (!orders.length) {
      $('#orders-body').html('<tr><td colspan="6">Henüz sipariş yok.</td></tr>');
      return;
    }
  
    const statusOptions = {
      pending: "Bekliyor",
      approved: "Onaylandı",
      shipped: "Kargoya Verildi",
      delivered: "Teslim Edildi",
      cancelled: "İptal Edildi"
    };
  
    const rows = orders.map(order => {
      const optionsHtml = Object.keys(statusOptions).map(status => `
        <option value="${status}" ${order.status === status ? 'selected' : ''}>
          ${statusOptions[status]}
        </option>`).join('');
  
      return `
        <tr data-id="${order.id}">
          <td>#${order.id}</td>
          <td>${order.user}</td>
          <td>${new Date(order.created_at).toLocaleString("tr-TR")}</td>
          <td>${parseFloat(order.total_amount).toFixed(2)} ₺</td>
          <td>
            <select class="status-select">${optionsHtml}</select>
          </td>
          <td>
            <button class="update-btn">Güncelle</button>
          </td>
        </tr>
      `;
    }).join('');
  
    $('#orders-body').html(rows);
  
    // Butonlara click eventi bağla
    $('.update-btn').click(function () {
      const row = $(this).closest('tr');
      const orderId = row.data('id');
      const newStatus = row.find('.status-select').val();
  
      updateOrderStatus(orderId, newStatus);
    });
  }
  
  function updateOrderStatus(orderId, status) {
    fetch(`/orders/orders/${orderId}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: status })
    })
    .then(res => {
      if (!res.ok) throw new Error("Durum güncellenemedi");
      return res.json();
    })
    .then(data => {
      alert(`✅ Sipariş #${data.id} durumu "${formatStatus(data.status)}" olarak güncellendi.`);
    })
    .catch(err => {
      alert("❌ Güncelleme hatası");
      console.error(err);
    });
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
  