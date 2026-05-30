(function () {
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function setupMenu() {
        var button = document.querySelector('.menu-button');
        var menu = document.querySelector('.mobile-menu');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            var open = menu.hasAttribute('hidden');
            if (open) {
                menu.removeAttribute('hidden');
            } else {
                menu.setAttribute('hidden', '');
            }
            button.setAttribute('aria-expanded', String(open));
        });
    }

    function setupHero() {
        var carousel = document.querySelector('.hero-carousel');
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
        var next = carousel.querySelector('.hero-next');
        var prev = carousel.querySelector('.hero-prev');
        var index = 0;
        var timer = null;
        function show(newIndex) {
            if (!slides.length) {
                return;
            }
            index = (newIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                var active = slideIndex === index;
                slide.classList.toggle('is-active', active);
                Array.prototype.slice.call(slide.querySelectorAll('.hero-mini-dot')).forEach(function (dot, dotIndex) {
                    dot.classList.toggle('is-active', dotIndex === index);
                });
            });
        }
        function play() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                play();
            });
        }
        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                play();
            });
        }
        carousel.addEventListener('mouseenter', function () {
            window.clearInterval(timer);
        });
        carousel.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function setupLocalFilter() {
        var panel = document.querySelector('.filter-panel');
        var grid = document.querySelector('.category-movie-grid');
        if (!panel || !grid) {
            return;
        }
        var input = panel.querySelector('.local-filter-input');
        var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-type]'));
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
        var type = 'all';
        function apply() {
            var query = input ? input.value.trim().toLowerCase() : '';
            cards.forEach(function (card) {
                var matchType = type === 'all' || card.getAttribute('data-type') === type;
                var haystack = [
                    card.getAttribute('data-title') || '',
                    card.getAttribute('data-year') || '',
                    card.getAttribute('data-region') || '',
                    card.getAttribute('data-tags') || ''
                ].join(' ');
                var matchQuery = !query || haystack.indexOf(query) !== -1;
                card.hidden = !(matchType && matchQuery);
            });
        }
        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                type = button.getAttribute('data-filter-type') || 'all';
                buttons.forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                apply();
            });
        });
        if (input) {
            input.addEventListener('input', apply);
        }
    }

    function renderCard(item) {
        var tags = (item.tags || []).slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');
        return '<article class="movie-card">' +
            '<a class="movie-cover" href="./' + escapeAttr(item.url) + '" aria-label="' + escapeAttr(item.title) + '">' +
            '<img src="' + escapeAttr(item.cover) + '" alt="' + escapeAttr(item.title) + '" loading="lazy">' +
            '<span class="cover-badge">' + escapeHtml(item.year) + '</span>' +
            '</a>' +
            '<div class="movie-card-body">' +
            '<div class="movie-meta-line"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
            '<h3><a href="./' + escapeAttr(item.url) + '">' + escapeHtml(item.title) + '</a></h3>' +
            '<p>' + escapeHtml(item.line) + '</p>' +
            '<div class="tag-row">' + tags + '</div>' +
            '</div>' +
            '</article>';
    }

    function setupSearch() {
        var results = document.getElementById('search-results');
        var input = document.getElementById('page-search-input');
        var title = document.getElementById('search-title');
        if (!results || !window.SEARCH_INDEX) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        if (input) {
            input.value = query;
        }
        if (!query) {
            return;
        }
        var words = query.toLowerCase().split(/\s+/).filter(Boolean);
        var matched = window.SEARCH_INDEX.filter(function (item) {
            var text = [item.title, item.region, item.type, item.year, item.genre, item.category, (item.tags || []).join(' '), item.line].join(' ').toLowerCase();
            return words.every(function (word) {
                return text.indexOf(word) !== -1;
            });
        }).slice(0, 120);
        if (title) {
            title.textContent = '搜索结果：' + query;
        }
        if (matched.length) {
            results.innerHTML = matched.map(renderCard).join('');
        } else {
            results.innerHTML = '<div class="empty-state"><h2>未找到相关影片</h2><p>可以尝试更换片名、地区、年份或题材关键词。</p></div>';
        }
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[char];
        });
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/'/g, '&#39;');
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupLocalFilter();
        setupSearch();
    });
})();

function initMoviePlayer(videoId, sourceUrl) {
    var video = document.getElementById(videoId);
    if (!video) {
        return;
    }
    var box = video.closest('.player-box');
    var overlay = box ? box.querySelector('.player-overlay') : null;
    var hls = null;
    var loaded = false;
    function load() {
        if (loaded) {
            return;
        }
        loaded = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
        } else {
            video.src = sourceUrl;
        }
    }
    function play() {
        load();
        if (overlay) {
            overlay.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
        }
    }
    if (overlay) {
        overlay.addEventListener('click', play);
    }
    video.addEventListener('click', function () {
        if (video.paused) {
            play();
        }
    });
    video.addEventListener('play', function () {
        if (overlay) {
            overlay.classList.add('is-hidden');
        }
    });
    video.addEventListener('error', function () {
        if (hls) {
            hls.destroy();
            hls = null;
        }
        loaded = false;
    });
}
