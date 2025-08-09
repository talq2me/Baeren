(function () {
    // Create modal if not already present
    let modal = document.getElementById("playlistModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "playlistModal";
        modal.style.cssText = `
            display:none; position:fixed; top:0; left:0; width:100vw; height:100vh;
            background:rgba(0,0,0,0.95); z-index:9999; align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="position:relative; width:100vw; height:100vh; background:#222; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <button id="closePlaylistModalBtn" style="position:absolute;top:18px;right:28px;z-index:4;font-size:2em;background:none;border:none;color:#fff;cursor:pointer;">&times;</button>
                <div id="playlistPlayerContainer" style="width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;position:relative;">
                    <div id="playlistYTPlayer" style="width:100vw;height:100vh;"></div>
                    <div id="ytOverlayBlocker" style="position:absolute;top:0;left:0;width:100vw;height:100vh;z-index:2;"></div>
                    <div id="ytCustomControls" style="position:absolute;bottom:40px;left:0;width:100vw;text-align:center;z-index:3;">
                        <button id="ytPrevBtn" style="font-size:2em;margin:0 1em;">⏮️ Prev</button>
                        <button id="ytPlayBtn" style="font-size:2em;margin:0 1em;">▶️ Play</button>
                        <button id="ytPauseBtn" style="font-size:2em;margin:0 1em;">⏸️ Pause</button>
                        <button id="ytNextBtn" style="font-size:2em;margin:0 1em;">⏭️ Next</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Close modal logic
    function closeModal() {
        modal.style.display = "none";
        if (window.playlistYTPlayer && window.playlistYTPlayer.destroy) window.playlistYTPlayer.destroy();
        window.playlistYTPlayer = null;
        document.body.style.overflow = "";
    }

    document.getElementById("closePlaylistModalBtn").onclick = closeModal;

    // Main function to open modal with a playlist
    window.openPlaylistModal = function (playlistId) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        document.getElementById("playlistYTPlayer").innerHTML = ""; // Clear previous

        // Load YouTube IFrame API if needed
        if (!window.YT || !window.YT.Player) {
            let tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            window.onYouTubeIframeAPIReady = function () {
                createYTPlaylistPlayer(playlistId);
            };
        } else {
            createYTPlaylistPlayer(playlistId);
        }
    };

    function createYTPlaylistPlayer(playlistId) {
        window.playlistYTPlayer = new YT.Player('playlistYTPlayer', {
            height: "100%",
            width: "100%",
            playerVars: {
                autoplay: 1,
                rel: 0,
                controls: 0, // Hide YouTube controls
                modestbranding: 1,
                enablejsapi: 1,
                listType: "playlist",
                list: playlistId
            },
            events: {
                'onReady': function (event) {
                    setupCustomControls();
                }
            }
        });
    }

    function setupCustomControls() {
        document.getElementById("ytPrevBtn").onclick = function () {
            if (window.playlistYTPlayer) window.playlistYTPlayer.previousVideo();
        };
        document.getElementById("ytPlayBtn").onclick = function () {
            if (window.playlistYTPlayer) window.playlistYTPlayer.playVideo();
        };
        document.getElementById("ytPauseBtn").onclick = function () {
            if (window.playlistYTPlayer) window.playlistYTPlayer.pauseVideo();
        };
        document.getElementById("ytNextBtn").onclick = function () {
            if (window.playlistYTPlayer) window.playlistYTPlayer.nextVideo();
        };
    }
})();