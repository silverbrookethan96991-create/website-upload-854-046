(function () {
  var loader = {
    loading: false,
    callbacks: []
  };

  function loadHls(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    loader.callbacks.push(callback);

    if (loader.loading) {
      return;
    }

    loader.loading = true;
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    script.async = true;
    script.onload = function () {
      loader.callbacks.splice(0).forEach(function (item) {
        item();
      });
    };
    document.head.appendChild(script);
  }

  function attach(video, src, onReady) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      onReady();
      return;
    }

    loadHls(function () {
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, onReady);
      } else {
        video.src = src;
        onReady();
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (box) {
    var video = box.querySelector('video');
    var button = box.querySelector('.play-cover');
    var src = box.getAttribute('data-m3u8');
    var initialized = false;

    function start() {
      if (!video || !src) {
        return;
      }

      var begin = function () {
        if (button) {
          button.classList.add('hidden');
        }

        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            if (button) {
              button.classList.remove('hidden');
            }
          });
        }
      };

      if (!initialized) {
        initialized = true;
        attach(video, src, begin);
      } else {
        begin();
      }
    }

    if (button) {
      button.addEventListener('click', start);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
    }
  });
})();
