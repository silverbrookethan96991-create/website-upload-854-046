(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }

    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupGridFilter() {
    var grid = document.querySelector('[data-filter-grid]');
    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
    var searchInput = document.querySelector('[data-grid-search]');
    var yearSelect = document.querySelector('[data-grid-year]');
    var typeSelect = document.querySelector('[data-grid-type]');
    var empty = document.querySelector('[data-empty-state]');
    var urlQuery = new URLSearchParams(window.location.search).get('q') || '';
    var pageSearchInput = document.querySelector('[data-search-page-input]');

    if (pageSearchInput) {
      pageSearchInput.value = urlQuery;
    }
    if (searchInput && urlQuery) {
      searchInput.value = urlQuery;
    }
    if (yearSelect && yearSelect.options.length === 1) {
      var years = [];
      cards.forEach(function (card) {
        var year = card.getAttribute('data-year');
        if (year && /^[0-9]{4}$/.test(year) && years.indexOf(year) === -1) {
          years.push(year);
        }
      });
      years.sort().reverse().slice(0, 24).forEach(function (year) {
        var option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
    }

    function apply() {
      var query = normalize(searchInput && searchInput.value);
      var year = normalize(yearSelect && yearSelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.textContent
        ].join(' '));
        var matched = true;
        if (query && haystack.indexOf(query) === -1) {
          matched = false;
        }
        if (year && normalize(card.getAttribute('data-year')) !== year) {
          matched = false;
        }
        if (type && normalize(card.getAttribute('data-type')).indexOf(type) === -1) {
          matched = false;
        }
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [searchInput, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }

  function setupPlayer() {
    var video = document.getElementById('moviePlayer');
    var shell = document.querySelector('[data-player-shell]');
    var button = document.querySelector('[data-player-start]');
    if (!video || !button) {
      return;
    }

    var source = video.getAttribute('data-src');
    var hlsInstance = null;

    function loadSource() {
      if (!source || video.getAttribute('data-ready') === 'true') {
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        video.src = source;
      }

      video.setAttribute('data-ready', 'true');
    }

    function playVideo() {
      loadSource();
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          video.controls = true;
        });
      }
      if (shell) {
        shell.classList.add('is-playing');
      }
    }

    button.addEventListener('click', playVideo);
    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });
    video.addEventListener('play', function () {
      if (shell) {
        shell.classList.add('is-playing');
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  setupHero();
  setupGridFilter();
  setupPlayer();
})();
