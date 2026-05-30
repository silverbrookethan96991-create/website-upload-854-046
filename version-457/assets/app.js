(function () {
  'use strict';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initMobileMenu() {
    var button = $('.js-menu-toggle');
    var panel = $('.mobile-panel');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      var willOpen = panel.hasAttribute('hidden');
      if (willOpen) {
        panel.removeAttribute('hidden');
        button.textContent = '×';
      } else {
        panel.setAttribute('hidden', '');
        button.textContent = '☰';
      }
      button.setAttribute('aria-expanded', String(willOpen));
    });
  }

  function initHeroCarousel() {
    var root = $('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = $all('[data-hero-slide]', root);
    var dots = $all('[data-hero-dot]', root);
    var prev = $('[data-hero-prev]', root);
    var next = $('[data-hero-next]', root);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
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
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot') || 0));
        start();
      });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initCardFilters() {
    var form = $('.js-filter-form');
    var cards = $all('[data-card]');
    if (!form || !cards.length) {
      return;
    }
    var region = $('[data-filter="region"]', form);
    var year = $('[data-filter="year"]', form);
    var keyword = $('[data-filter="keyword"]', form);
    var count = $('.js-filter-count', form);
    var empty = $('.js-empty-state');

    function apply() {
      var regionValue = region ? region.value : '';
      var yearValue = year ? year.value : '';
      var keywordValue = keyword ? keyword.value.trim().toLowerCase() : '';
      var visible = 0;
      cards.forEach(function (card) {
        var ok = true;
        if (regionValue && card.getAttribute('data-region') !== regionValue) {
          ok = false;
        }
        if (yearValue && card.getAttribute('data-year') !== yearValue) {
          ok = false;
        }
        if (keywordValue && !(card.getAttribute('data-text') || '').includes(keywordValue)) {
          ok = false;
        }
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部影片';
      }
      if (empty) {
        empty.classList.toggle('hidden', visible !== 0);
      }
    }

    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    form.addEventListener('reset', function () {
      window.setTimeout(apply, 0);
    });
    apply();
  }

  function initPlayers() {
    $all('[data-player]').forEach(function (shell) {
      var video = $('.js-hls-player', shell);
      var playButton = $('[data-play-trigger]', shell);
      var status = $('[data-player-status]', shell);
      if (!video) {
        return;
      }
      var source = video.getAttribute('data-hls-src');
      var hlsInstance = null;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      if (source && window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus('播放源加载完成，点击播放。');
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setStatus('网络加载异常，正在重新尝试。');
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setStatus('媒体解码异常，正在恢复播放。');
            hlsInstance.recoverMediaError();
          } else {
            setStatus('视频加载失败，请稍后重试。');
            hlsInstance.destroy();
          }
        });
      } else if (source && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setStatus('浏览器原生 HLS 已启用，点击播放。');
      } else {
        setStatus('当前浏览器不支持该 m3u8 播放源。');
      }

      function togglePlay() {
        if (video.paused) {
          var playPromise = video.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(function () {
              setStatus('浏览器阻止了自动播放，请再次点击视频控件。');
            });
          }
        } else {
          video.pause();
        }
      }

      if (playButton) {
        playButton.addEventListener('click', togglePlay);
      }
      video.addEventListener('play', function () {
        shell.classList.add('is-playing');
        setStatus('正在播放。');
      });
      video.addEventListener('pause', function () {
        shell.classList.remove('is-playing');
        setStatus('已暂停，点击播放按钮继续。');
      });
      video.addEventListener('ended', function () {
        shell.classList.remove('is-playing');
        setStatus('播放结束。');
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function createSearchCard(item) {
    return '' +
      '<article class="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">' +
        '<a href="' + escapeHtml(item.url) + '" class="block">' +
          '<div class="relative aspect-video overflow-hidden bg-slate-200">' +
            '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">' +
            '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>' +
            '<div class="absolute top-3 left-3"><span class="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">' + escapeHtml(item.type) + '</span></div>' +
            '<div class="absolute bottom-3 right-3 text-white text-sm bg-black/50 px-2 py-1 rounded">' + escapeHtml(item.year) + '</div>' +
          '</div>' +
        '</a>' +
        '<div class="p-4">' +
          '<a href="' + escapeHtml(item.url) + '"><h2 class="text-base font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">' + escapeHtml(item.title) + '</h2></a>' +
          '<p class="text-gray-600 text-sm line-clamp-2 mb-3">' + escapeHtml(item.oneLine) + '</p>' +
          '<div class="flex items-center justify-between gap-3 text-sm text-gray-500">' +
            '<span class="truncate">' + escapeHtml(item.region) + '</span>' +
            '<a href="' + escapeHtml(item.categoryUrl) + '" class="text-orange-500 hover:text-pink-500 font-medium">' + escapeHtml(item.category) + '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function initSearchPage() {
    var data = window.MOVIE_SEARCH_DATA;
    var form = $('.js-search-form');
    var results = $('[data-search-results]');
    if (!data || !form || !results) {
      return;
    }
    var input = $('[data-search-input]', form);
    var region = $('[data-search-region]', form);
    var year = $('[data-search-year]', form);
    var category = $('[data-search-category]', form);
    var count = $('[data-search-count]');
    var empty = $('[data-search-empty]');
    var params = new URLSearchParams(window.location.search);

    function fillSelect(select, values) {
      values.forEach(function (value) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    fillSelect(region, Array.from(new Set(data.map(function (item) { return item.region; }))).sort());
    fillSelect(year, Array.from(new Set(data.map(function (item) { return item.year; }))).sort().reverse());
    fillSelect(category, Array.from(new Set(data.map(function (item) { return item.category; }))).sort());

    if (params.get('q')) {
      input.value = params.get('q');
    }

    function apply() {
      var query = input.value.trim().toLowerCase();
      var regionValue = region.value;
      var yearValue = year.value;
      var categoryValue = category.value;
      var matched = data.filter(function (item) {
        if (regionValue && item.region !== regionValue) {
          return false;
        }
        if (yearValue && item.year !== yearValue) {
          return false;
        }
        if (categoryValue && item.category !== categoryValue) {
          return false;
        }
        if (!query) {
          return true;
        }
        return item.searchText.indexOf(query) !== -1;
      }).slice(0, 200);
      results.innerHTML = matched.map(createSearchCard).join('');
      if (count) {
        count.textContent = '找到 ' + matched.length + ' 条结果' + (matched.length >= 200 ? '，已显示前 200 条' : '');
      }
      if (empty) {
        empty.hidden = matched.length !== 0;
      }
      var newParams = new URLSearchParams();
      if (query) {
        newParams.set('q', input.value.trim());
      }
      var newUrl = window.location.pathname + (newParams.toString() ? '?' + newParams.toString() : '');
      window.history.replaceState(null, '', newUrl);
    }

    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      apply();
    });
    form.addEventListener('reset', function () {
      window.setTimeout(apply, 0);
    });
    apply();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHeroCarousel();
    initCardFilters();
    initPlayers();
    initSearchPage();
  });
})();
