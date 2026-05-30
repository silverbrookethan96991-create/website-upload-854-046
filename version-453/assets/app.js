(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var menuButton = document.querySelector("[data-menu-button]");
        var mobileNav = document.querySelector("[data-mobile-nav]");
        if (menuButton && mobileNav) {
            menuButton.addEventListener("click", function () {
                mobileNav.classList.toggle("open");
            });
        }

        document.querySelectorAll("[data-site-search]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input");
                var query = input ? input.value.trim() : "";
                if (!query) {
                    return;
                }
                var target = form.getAttribute("data-search-url") || "./search.html";
                window.location.href = target + "?q=" + encodeURIComponent(query);
            });
        });

        setupHero();
        setupFilters();
        setupSearchQuery();
    });

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                restart();
            });
        });
        show(0);
        restart();
    }

    function setupFilters() {
        var form = document.querySelector("[data-filter-form]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        if (!form || !cards.length) {
            return;
        }
        var queryInput = form.querySelector("[data-filter-query]");
        var yearSelect = form.querySelector("[data-filter-year]");
        var regionSelect = form.querySelector("[data-filter-region]");
        var empty = document.querySelector("[data-empty]");

        function apply() {
            var query = queryInput ? queryInput.value.trim().toLowerCase() : "";
            var year = yearSelect ? yearSelect.value : "";
            var region = regionSelect ? regionSelect.value : "";
            var shown = 0;
            cards.forEach(function (card) {
                var terms = (card.getAttribute("data-terms") || "").toLowerCase();
                var cardYear = card.getAttribute("data-year") || "";
                var cardRegion = card.getAttribute("data-region") || "";
                var ok = true;
                if (query && terms.indexOf(query) === -1) {
                    ok = false;
                }
                if (year && cardYear !== year) {
                    ok = false;
                }
                if (region && cardRegion !== region) {
                    ok = false;
                }
                card.classList.toggle("hide-card", !ok);
                if (ok) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.style.display = shown ? "none" : "block";
            }
        }

        form.addEventListener("input", apply);
        form.addEventListener("change", apply);
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            apply();
        });
        apply();
    }

    function setupSearchQuery() {
        var input = document.querySelector("[data-filter-query]");
        if (!input) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var q = params.get("q");
        if (q) {
            input.value = q;
            var event = new Event("input", { bubbles: true });
            input.dispatchEvent(event);
        }
    }

    window.initPlayer = function (url) {
        var video = document.getElementById("movie-video");
        var cover = document.getElementById("player-cover");
        var button = document.getElementById("player-button");
        var started = false;
        var hls = null;

        if (!video || !url) {
            return;
        }

        function bindVideo() {
            if (started) {
                return;
            }
            started = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
        }

        function start() {
            bindVideo();
            if (cover) {
                cover.classList.add("hidden");
            }
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {});
            }
        }

        if (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                start();
            });
        }
        if (cover) {
            cover.addEventListener("click", start);
        }
        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };
})();
