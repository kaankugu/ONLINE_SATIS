import React, { useEffect, useState } from 'react';
import '../css/admin_product.css';
import axios from 'axios';

const AdminProduct = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products/');
      setProducts(res.data);
    } catch (err) {
      console.error('Ürünler alınırken hata:', err);
    }
  };

  const updatePermission = async (id) => {
    try {
      const res = await axios.post('/update-permission/', { id });
      alert(res.data.message);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`/api/product/${id}/`);
      alert('Ürün silindi.');
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="admin-product-page">
      {products.map((product) => {
        const permission = product.permission;
        const permissionStatus = permission ? 'Ürün yayında' : 'Ürün yayında değil';
        const permissionButtonText = permission ? 'Ürünü Yayından Kaldır' : 'Ürünü Yayınla';

        return (
          <div className="card" key={product.id}>
            <div className="card-body">
              <h3 className="card-title">{product.title}</h3>
              <p className="card-text">{product.description}</p>
              <p className="card-text">Fiyat: ₺{product.price}</p>
              <p className="card-text">{permissionStatus}</p>
              <div className="card-images">
                {(product.images || []).slice(0, 6).map((img, i) => (
                  <img key={i} src={img.image} alt={`${product.title}-${i}`} className="card-img-top" />
                ))}
              </div>
              <div className="button-group">
                <button className="update-button" onClick={() => updatePermission(product.id)}>
                  {permissionButtonText}
                </button>
                <button className="update-button" onClick={() => deleteProduct(product.id)}>
                  Ürünü Sil
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminProduct;
