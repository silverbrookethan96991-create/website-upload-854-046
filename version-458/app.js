(function() {
    function setupMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var mobile = document.querySelector("[data-mobile-nav]");
        if (!toggle || !mobile) {
            return;
        }
        toggle.addEventListener("click", function() {
            mobile.classList.toggle("open");
        });
    }

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
            slides.forEach(function(slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function(dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function() {
                show(index + 1);
            }, 5000);
        }

        if (prev) {
            prev.addEventListener("click", function() {
                show(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function() {
                show(index + 1);
                restart();
            });
        }
        dots.forEach(function(dot) {
            dot.addEventListener("click", function() {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });
        show(0);
        restart();
    }

    function setupFilters() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));
        if (!inputs.length) {
            return;
        }
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var empty = document.querySelector("[data-empty-state]");
        var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter-value]"));
        var chipValue = "";

        function apply() {
            var query = inputs.map(function(input) {
                return input.value.trim().toLowerCase();
            }).filter(Boolean).join(" ");
            var matched = 0;
            cards.forEach(function(card) {
                var haystack = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
                var okQuery = !query || haystack.indexOf(query) !== -1;
                var okChip = !chipValue || haystack.indexOf(chipValue.toLowerCase()) !== -1;
                var visible = okQuery && okChip;
                card.style.display = visible ? "" : "none";
                if (visible) {
                    matched += 1;
                }
            });
            if (empty) {
                empty.hidden = matched !== 0;
            }
        }

        inputs.forEach(function(input) {
            input.addEventListener("input", apply);
        });

        chips.forEach(function(chip) {
            chip.addEventListener("click", function() {
                chipValue = chip.getAttribute("data-filter-value") || "";
                chips.forEach(function(item) {
                    item.classList.toggle("is-active", item === chip);
                });
                apply();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function() {
        setupMenu();
        setupHero();
        setupFilters();
    });
})();
