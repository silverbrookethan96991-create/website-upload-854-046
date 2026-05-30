(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  var grid = document.querySelector('[data-catalog-grid]');

  if (!grid) {
    return;
  }

  var searchInput = document.querySelector('[data-search-input]');
  var sortSelect = document.querySelector('[data-sort-select]');
  var categorySelect = document.querySelector('[data-category-select]');
  var viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function matchesSearch(card, keyword) {
    if (!keyword) {
      return true;
    }

    var haystack = [
      card.getAttribute('data-title'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-year'),
      card.getAttribute('data-region'),
      card.textContent
    ].join(' ').toLowerCase();

    return haystack.indexOf(keyword) !== -1;
  }

  function matchesCategory(card, value) {
    if (!value || value === 'all') {
      return true;
    }

    return card.getAttribute('data-category') === value;
  }

  function sortCards(value) {
    var sorted = cards.slice();

    if (value === 'score-desc') {
      sorted.sort(function (a, b) {
        return Number(b.getAttribute('data-score')) - Number(a.getAttribute('data-score'));
      });
    }

    if (value === 'year-desc') {
      sorted.sort(function (a, b) {
        return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
      });
    }

    if (value === 'title-asc') {
      sorted.sort(function (a, b) {
        return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-Hans-CN');
      });
    }

    sorted.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  function applyFilters() {
    var keyword = normalize(searchInput ? searchInput.value : '');
    var category = categorySelect ? categorySelect.value : 'all';

    cards.forEach(function (card) {
      var visible = matchesSearch(card, keyword) && matchesCategory(card, category);
      card.hidden = !visible;
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', applyFilters);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      sortCards(sortSelect.value);
      applyFilters();
    });
  }

  viewButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      viewButtons.forEach(function (item) {
        item.classList.remove('active');
      });

      button.classList.add('active');

      if (button.getAttribute('data-view') === 'list') {
        grid.classList.add('list-mode');
      } else {
        grid.classList.remove('list-mode');
      }
    });
  });
})();
