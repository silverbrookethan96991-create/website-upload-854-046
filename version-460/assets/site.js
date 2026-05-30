(function () {
    function queryAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        var panel = document.querySelector('[data-mobile-panel]');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function setupHeroCarousel() {
        var slides = queryAll('[data-hero-slide]');
        var dots = queryAll('[data-hero-dot]');
        var prev = document.querySelector('[data-hero-prev]');
        var next = document.querySelector('[data-hero-next]');
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

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        show(0);
        start();
    }

    function normalize(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function setupFilters() {
        var list = document.querySelector('[data-filter-list]');
        if (!list) {
            return;
        }
        var cards = queryAll('.movie-card', list);
        var searchInput = document.querySelector('[data-filter-search]');
        var typeSelect = document.querySelector('[data-filter-type]');
        var regionSelect = document.querySelector('[data-filter-region]');
        var yearSelect = document.querySelector('[data-filter-year]');
        var resetButton = document.querySelector('[data-filter-reset]');
        var countLabel = document.querySelector('[data-filter-count]');
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');

        if (query && searchInput) {
            searchInput.value = query;
        }

        function applyFilter() {
            var keyword = normalize(searchInput && searchInput.value);
            var typeValue = normalize(typeSelect && typeSelect.value);
            var regionValue = normalize(regionSelect && regionSelect.value);
            var yearValue = normalize(yearSelect && yearSelect.value);
            var visible = 0;

            cards.forEach(function (card) {
                var text = normalize(card.getAttribute('data-search'));
                var type = normalize(card.getAttribute('data-type'));
                var region = normalize(card.getAttribute('data-region'));
                var year = normalize(card.getAttribute('data-year'));
                var matched = true;

                if (keyword && text.indexOf(keyword) === -1) {
                    matched = false;
                }
                if (typeValue && type !== typeValue) {
                    matched = false;
                }
                if (regionValue && region !== regionValue) {
                    matched = false;
                }
                if (yearValue && year !== yearValue) {
                    matched = false;
                }

                card.classList.toggle('is-filter-hidden', !matched);
                if (matched) {
                    visible += 1;
                }
            });

            if (countLabel) {
                countLabel.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部影片';
            }
        }

        [searchInput, typeSelect, regionSelect, yearSelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            }
        });

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                if (searchInput) {
                    searchInput.value = '';
                }
                if (typeSelect) {
                    typeSelect.value = '';
                }
                if (regionSelect) {
                    regionSelect.value = '';
                }
                if (yearSelect) {
                    yearSelect.value = '';
                }
                applyFilter();
            });
        }

        applyFilter();
    }

    function setupHlsPlayers() {
        queryAll('[data-player]').forEach(function (player) {
            var video = player.querySelector('[data-hls-video]');
            var playButton = player.querySelector('[data-play-button]');
            var message = player.querySelector('[data-player-message]');
            if (!video) {
                return;
            }
            var source = video.getAttribute('data-src');
            var prepared = false;
            var hlsInstance = null;

            function setMessage(text) {
                if (message) {
                    message.textContent = text;
                }
            }

            function prepare() {
                if (prepared || !source) {
                    return;
                }
                prepared = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    setMessage('正在使用浏览器原生 HLS 播放。');
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setMessage('播放源加载完成。');
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setMessage('播放源加载异常，请稍后重试。');
                        }
                    });
                    return;
                }
                video.src = source;
                setMessage('当前浏览器不支持 HLS.js，已尝试直接加载播放源。');
            }

            function play() {
                prepare();
                var promise = video.play();
                if (promise && promise.then) {
                    promise.then(function () {
                        if (playButton) {
                            playButton.classList.add('is-hidden');
                        }
                    }).catch(function () {
                        setMessage('浏览器阻止自动播放，请再次点击播放器。');
                    });
                } else if (playButton) {
                    playButton.classList.add('is-hidden');
                }
            }

            if (playButton) {
                playButton.addEventListener('click', play);
            }
            video.addEventListener('play', function () {
                if (playButton) {
                    playButton.classList.add('is-hidden');
                }
            });
            video.addEventListener('pause', function () {
                if (playButton && video.currentTime === 0) {
                    playButton.classList.remove('is-hidden');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupHeroCarousel();
        setupFilters();
        setupHlsPlayers();
    });
})();
