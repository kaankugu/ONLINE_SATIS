// static/js/menu.js

/**
 * Arama çubuğu için canlı öneri (autocomplete) özelliği.
 * apiFetch fonksiyonu global scope'ta tanımlı ve doğrudan JSON döndürüyor.
 */

document.addEventListener('DOMContentLoaded', () => {
  const searchContainer = document.querySelector('.search-container');
  const searchInput = searchContainer.querySelector('.search-input');

  // Öneri kutusunu oluştur ve stil uygula
  const suggestionBox = document.createElement('ul');
  suggestionBox.id = 'search-suggestions';
  suggestionBox.className = 'suggestion-list';
  Object.assign(suggestionBox.style, {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderTop: 'none',
    listStyle: 'none',
    margin: '0',
    padding: '0',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: '1000',
    display: 'none'
  });
  // parent relative konumda olmalı
  searchContainer.style.position = 'relative';
  searchContainer.appendChild(suggestionBox);

  let timeoutId;

  searchInput.addEventListener('keyup', (e) => {
    const query = searchInput.value.trim();
    clearTimeout(timeoutId);

    // Enter basılırsa arama sayfasına yönlendir
    if (e.key === 'Enter' && query) {
      window.location.href = `/search-results/?q=${encodeURIComponent(query)}`;
      return;
    }

    if (!query) {
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
      return;
    }

    // debounce
    timeoutId = setTimeout(async () => {
      try {
        // apiFetch doğrudan JSON dizi döner
        const suggestions = await apiFetch(
          `/api/products/suggestions/?q=${encodeURIComponent(query)}`
        );

        if (!Array.isArray(suggestions) || suggestions.length === 0) {
          suggestionBox.innerHTML = '';
          suggestionBox.style.display = 'none';
          return;
        }

        // önerileri göster
        suggestionBox.innerHTML = '';
        suggestions.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          Object.assign(li.style, {
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: '1px solid #eee'
          });
          li.addEventListener('mouseenter', () => li.style.backgroundColor = '#f5f5f5');
          li.addEventListener('mouseleave', () => li.style.backgroundColor = '');
          li.addEventListener('click', () => {
            const val = item.trim();
            if (!val) return;
            searchInput.value = val;
            suggestionBox.innerHTML = '';
            suggestionBox.style.display = 'none';
            window.location.href = `/search-results/?q=${encodeURIComponent(val)}`;
          });
          suggestionBox.appendChild(li);
        });
        suggestionBox.style.display = 'block';

      } catch (err) {
        console.error('Öneri alınamadı:', err);
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'none';
      }
    }, 300);
  });

  // input dışına tıklandığında öneri kutusunu gizle
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      suggestionBox.style.display = 'none';
    }
  });
});
