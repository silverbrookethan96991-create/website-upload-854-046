function initMoviePlayer(source) {
  var shell = document.querySelector("[data-player]");

  if (!shell) {
    return;
  }

  var video = shell.querySelector("video");
  var overlay = shell.querySelector(".play-overlay");
  var hlsInstance = null;
  var ready = false;

  function bind() {
    if (ready || !video || !source) {
      return;
    }

    ready = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        maxBufferLength: 30,
        backBufferLength: 30
      });
      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);
      return;
    }

    video.src = source;
  }

  function play() {
    bind();

    if (overlay) {
      overlay.classList.add("hidden");
    }

    var promise = video.play();

    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {});
    }
  }

  if (overlay) {
    overlay.addEventListener("click", play);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      play();
    }
  });

  video.addEventListener("play", function () {
    if (overlay) {
      overlay.classList.add("hidden");
    }
  });

  window.addEventListener("pagehide", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
}
