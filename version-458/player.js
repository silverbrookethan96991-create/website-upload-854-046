(function() {
    function setupVideoPlayer(mediaUrl) {
        var video = document.getElementById("video-player");
        var button = document.getElementById("play-toggle");
        var overlay = document.querySelector(".player-overlay");
        var loaded = false;
        var hls = null;

        if (!video || !button || !mediaUrl) {
            return;
        }

        function load() {
            if (loaded) {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = mediaUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(mediaUrl);
                hls.attachMedia(video);
            } else {
                video.src = mediaUrl;
            }
            loaded = true;
        }

        function start() {
            load();
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var attempt = video.play();
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(function() {
                    if (overlay) {
                        overlay.classList.remove("is-hidden");
                    }
                });
            }
        }

        button.addEventListener("click", start);
        if (overlay) {
            overlay.addEventListener("click", function(event) {
                if (event.target === overlay) {
                    start();
                }
            });
        }
        video.addEventListener("play", function() {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
        });
        window.addEventListener("pagehide", function() {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        });
    }

    window.setupVideoPlayer = setupVideoPlayer;
})();
