(function () {
    var heroTimer = null;

    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var toggle = document.querySelector('[data-mobile-toggle]');
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
        var current = 0;
        if (slides.length < 2) {
            return;
        }
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                slide.classList.toggle('is-active', position === current);
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle('is-active', position === current);
            });
        }
        function move(step) {
            show(current + step);
        }
        function restart() {
            window.clearInterval(heroTimer);
            heroTimer = window.setInterval(function () {
                move(1);
            }, 5200);
        }
        if (prev) {
            prev.addEventListener('click', function () {
                move(-1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                move(1);
                restart();
            });
        }
        dots.forEach(function (dot, position) {
            dot.addEventListener('click', function () {
                show(position);
                restart();
            });
        });
        restart();
    }

    function setupHeaderSearch() {
        selectAll('[data-site-search]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var query = input ? input.value.trim() : '';
                var target = 'all-movies.html';
                if (query) {
                    target += '?q=' + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function textMatch(card, query) {
        if (!query) {
            return true;
        }
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        return text.indexOf(query.toLowerCase()) !== -1;
    }

    function valueMatch(card, key, value) {
        if (!value) {
            return true;
        }
        var cardValue = card.getAttribute('data-' + key) || '';
        return cardValue.indexOf(value) !== -1;
    }

    function setupFilters() {
        var list = document.querySelector('[data-filter-list]');
        if (!list) {
            return;
        }
        var input = document.querySelector('[data-filter-input]');
        var selects = selectAll('[data-filter-select]');
        var cards = selectAll('[data-movie-card]', list);
        var empty = document.querySelector('[data-empty-state]');
        var params = new URLSearchParams(window.location.search);
        var queryParam = params.get('q');
        if (queryParam && input) {
            input.value = queryParam;
        }
        function apply() {
            var query = input ? input.value.trim() : '';
            var visible = 0;
            var filters = {};
            selects.forEach(function (select) {
                filters[select.getAttribute('data-filter-select')] = select.value;
            });
            cards.forEach(function (card) {
                var matched = textMatch(card, query);
                Object.keys(filters).forEach(function (key) {
                    matched = matched && valueMatch(card, key, filters[key]);
                });
                card.hidden = !matched;
                if (matched) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }
        if (input) {
            input.addEventListener('input', apply);
        }
        selects.forEach(function (select) {
            select.addEventListener('change', apply);
        });
        apply();
    }

    function setupPlayer() {
        selectAll('[data-player]').forEach(function (shell) {
            var video = shell.querySelector('video');
            var overlay = shell.querySelector('[data-player-start]');
            var playButton = shell.querySelector('[data-player-play]');
            var muteButton = shell.querySelector('[data-player-mute]');
            var fullscreenButton = shell.querySelector('[data-player-fullscreen]');
            var message = shell.querySelector('[data-player-message]');
            var hls = null;
            if (!video) {
                return;
            }
            function showMessage(text) {
                if (!message) {
                    return;
                }
                message.textContent = text;
                message.hidden = !text;
            }
            function load() {
                var stream = video.getAttribute('data-stream');
                if (!stream || video.getAttribute('data-ready') === '1') {
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            showMessage('网络异常，正在重新加载');
                            hls.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            showMessage('播放异常，正在恢复');
                            hls.recoverMediaError();
                        } else {
                            showMessage('视频加载失败，请稍后重试');
                            hls.destroy();
                        }
                    });
                } else {
                    video.src = stream;
                }
                video.setAttribute('data-ready', '1');
            }
            function start() {
                load();
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
                video.controls = true;
                var result = video.play();
                if (result && typeof result.catch === 'function') {
                    result.catch(function () {
                        showMessage('点击播放按钮开始观看');
                    });
                }
            }
            function togglePlay() {
                if (video.paused) {
                    start();
                } else {
                    video.pause();
                }
            }
            if (overlay) {
                overlay.addEventListener('click', start);
            }
            if (playButton) {
                playButton.addEventListener('click', togglePlay);
            }
            if (muteButton) {
                muteButton.addEventListener('click', function () {
                    video.muted = !video.muted;
                    muteButton.textContent = video.muted ? '🔇' : '🔊';
                });
            }
            if (fullscreenButton) {
                fullscreenButton.addEventListener('click', function () {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else if (shell.requestFullscreen) {
                        shell.requestFullscreen();
                    }
                });
            }
            video.addEventListener('play', function () {
                if (playButton) {
                    playButton.textContent = 'Ⅱ';
                }
                showMessage('');
            });
            video.addEventListener('pause', function () {
                if (playButton) {
                    playButton.textContent = '▶';
                }
            });
            window.addEventListener('beforeunload', function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupHero();
        setupHeaderSearch();
        setupFilters();
        setupPlayer();
    });
})();
