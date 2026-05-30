(function () {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
  }

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    start();
  }

  var list = document.querySelector("[data-card-list]");
  var search = document.querySelector("[data-card-search]");
  var emptyState = document.querySelector("[data-empty-state]");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var activeFilter = "all";

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function applyFilters() {
    if (!list) {
      return;
    }

    var keyword = normalize(search ? search.value : "");
    var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
    var visibleCount = 0;

    cards.forEach(function (card) {
      var haystack = normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-year"),
        card.getAttribute("data-region"),
        card.getAttribute("data-type"),
        card.getAttribute("data-genre")
      ].join(" "));
      var typeText = normalize(card.getAttribute("data-type") + " " + card.getAttribute("data-genre"));
      var filterMatch = activeFilter === "all" || typeText.indexOf(normalize(activeFilter)) !== -1;
      var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
      var isVisible = filterMatch && keywordMatch;

      card.style.display = isVisible ? "" : "none";

      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle("visible", visibleCount === 0);
    }
  }

  if (search) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");

    if (query) {
      search.value = query;
    }

    search.addEventListener("input", applyFilters);
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-filter") || "all";
      filterButtons.forEach(function (item) {
        item.classList.toggle("active", item === button);
      });
      applyFilters();
    });
  });

  applyFilters();
})();
