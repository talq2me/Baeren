document.addEventListener("DOMContentLoaded", function () {
    // Modal setup
    let modal = document.createElement("div");
    modal.id = "youtubeModal";
    modal.style.cssText = `
        display:none;
        position:fixed;
        top:0;left:0;
        width:100vw;height:100vh;
        background:rgba(0,0,0,0.95);
        z-index:9999;
        align-items:center;
        justify-content:center;
        margin:0;padding:0;
    `;
    modal.innerHTML = `
        <div id="ytPlayerContainer" style="width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:0;">
            <div id="ytPlayer" style="width:100vw;height:100vh;margin:0;padding:0;"></div>
        </div>
    `;
    document.body.appendChild(modal);

    let player = null;

    // Helper: get next video key for sequential mode
    function getNextVideoKey(keys, storageKey) {
        const today = new Date().toISOString().slice(0, 10);
        let lastDate = localStorage.getItem(storageKey + "_date");
        let idx = parseInt(localStorage.getItem(storageKey + "_idx") || "0", 10);

        if (lastDate !== today) {
            idx = (idx + 1) % keys.length;
            localStorage.setItem(storageKey + "_idx", idx);
            localStorage.setItem(storageKey + "_date", today);
        }
        return keys[idx];
    }


    // Launch YouTube player in modal
    function launchYouTubeModal(videoId, onEnd) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        // Clean up previous player if any
        document.getElementById("ytPlayerContainer").innerHTML = `<div id="ytPlayer"></div>`;
        // Wait for YT API
        function createPlayer() {
            if (!window.YT || !window.YT.Player) {
                setTimeout(createPlayer, 200);
                return;
            }
            player = new YT.Player("ytPlayer", {
                width: "100%",
                height: "100%",
                videoId: videoId,
                events: {
                    onStateChange: function (event) {
                        if (event.data === YT.PlayerState.ENDED) {
                            modal.style.display = "none";
                            document.body.style.overflow = "";
                            if (typeof onEnd === "function") onEnd();
                        }
                    }
                },
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    fs: 1
                }
            });
        }
        createPlayer();
    }

    // Load YouTube API if not present
    if (!window.YT) {
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }

    // Attach to all video buttons
    document.querySelectorAll(".video-button").forEach((button, btnIndex) => {
        const jsonFile = button.getAttribute("data-json-file");
        const selectionMode = button.getAttribute("data-selection-mode");

        if (!jsonFile || !selectionMode) {
            button.textContent = "Invalid Config";
            button.disabled = true;
            return;
        }

        fetch(jsonFile)
            .then(resp => resp.json())
            .then(videoData => {
                const keys = Object.keys(videoData);
                // Set button label to current video name for sequential mode
                let videoKey;
                if (selectionMode === "sequential") {
                    videoKey = getNextVideoKey(keys, "ytseq_btn" + btnIndex);
                } else {
                    videoKey = keys[0];
                }
                button.textContent = videoKey.replace(/([A-Z])/g, ' $1').trim();

                button.addEventListener("click", function () {
                    // Recompute videoKey in case day changed
                    let key = videoKey;
                    if (selectionMode === "sequential") {
                        key = getNextVideoKey(keys, "ytseq_btn" + btnIndex);
                    }
                    const videoId = videoData[key];

                    // Unlock code piece when video opens
                    //const codeDisplay = document.getElementById("codeDisplay");
                    //const kid = codeDisplay ? codeDisplay.getAttribute("data-kid") : null;
                    //if (kid && typeof unlockNextPiece === "function") {
                    //    unlockNextPiece(kid, "btn" + btnIndex);
                    //}

                    // Now launch the video modal
                    launchYouTubeModal(videoId, function () {
                        // (optional: you can still do something on close if you want)
                    });
                });
            })
            .catch(() => {
                button.textContent = "Video Load Error";
                button.disabled = true;
            });
    });
});