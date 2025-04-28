document.addEventListener('DOMContentLoaded', () => {
  const [form, setForm] = [{ username: '', email: '', password: '', password2: '' }, () => {}]; // dummy setForm
  const registerForm = document.getElementById('register-form');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;

    if (password !== password2) {
      alert('Şifreler eşleşmiyor!');
      return;
    }

    const formData = {
      username: username,
      email: email,
      password: password,
      password2: password2
    };

    try {
      const res = await apiFetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Kayıt hatası:', errorData);
        alert('Kayıt başarısız!');
        return;
      }

      alert('✅ Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      window.location.href = '/login';

    } catch (err) {
      console.error('❌ Sunucu hatası:', err);
      alert('Sunucu hatası. Lütfen tekrar deneyin.');
    }
  });
});