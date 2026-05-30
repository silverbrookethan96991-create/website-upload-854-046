(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });
    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }
    restart();
  }

  function setupFilters() {
    var input = document.querySelector('[data-filter-input]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var cards = selectAll('[data-card]');
    var empty = document.querySelector('[data-empty-state]');
    if (!cards.length || !input) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');
    if (initialQuery) {
      input.value = initialQuery;
    }

    function matchYear(card, value) {
      if (!value) {
        return true;
      }
      var year = Number(card.getAttribute('data-year')) || 0;
      if (value === '2010') {
        return year <= 2010;
      }
      return String(year) === value;
    }

    function apply() {
      var query = input.value.trim().toLowerCase();
      var yearValue = yearSelect ? yearSelect.value : '';
      var visible = 0;
      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-type') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-tags') || ''
        ].join(' ').toLowerCase();
        var isVisible = (!query || text.indexOf(query) !== -1) && matchYear(card, yearValue);
        card.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    input.addEventListener('input', apply);
    if (yearSelect) {
      yearSelect.addEventListener('change', apply);
    }
    apply();
  }

  window.initStaticPlayer = function (videoId, buttonId, coverId, streamUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var cover = document.getElementById(coverId);
    if (!video || !button || !cover || !streamUrl) {
      return;
    }
    var prepared = false;
    var hlsInstance = null;

    function prepare() {
      if (prepared) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
      prepared = true;
    }

    function play() {
      prepare();
      cover.classList.add('is-hidden');
      video.setAttribute('controls', 'controls');
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          cover.classList.remove('is-hidden');
        });
      }
    }

    cover.addEventListener('click', play);
    button.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
}());
