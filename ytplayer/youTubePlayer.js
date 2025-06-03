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
    let lastVideoButtonKid = null;
    let lastVideoButtonKey = null; // Use data-key instead of idx

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
        document.getElementById("ytPlayerContainer").innerHTML = `<div id="ytPlayer"></div>`;

        let lastTime = 0;
        let watchedTime = 0;
        let duration = 0;
        let interval = null;
        let skipped = false;

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
                    onReady: function (event) {
                        duration = event.target.getDuration();
                        lastTime = event.target.getCurrentTime();
                        interval = setInterval(() => {
                            let currentTime = event.target.getCurrentTime();
                            // If user skips ahead by more than 2 seconds, mark as skipped
                            if (currentTime - lastTime > 2.5) {
                                skipped = true;
                            }
                            // Only count forward progress
                            if (currentTime > lastTime) {
                                watchedTime += (currentTime - lastTime);
                            }
                            lastTime = currentTime;
                        }, 1000);
                    },
                    onStateChange: function (event) {
                        if (event.data === YT.PlayerState.ENDED) {
                            clearInterval(interval);
                            modal.style.display = "none";
                            document.body.style.overflow = "";
                            // Only count as watched if not skipped and watched at least 90% of the video
                            if (!skipped && watchedTime > 0.9 * duration) {
                                if (typeof onEnd === "function") onEnd();
                            } else {
                                alert("Please watch the whole video without skipping to count as complete.");
                            }
                        }
                    }
                },
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    fs: 1,
                    disablekb: 1 // disables keyboard controls
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

    // Initialize video buttons
    document.querySelectorAll(".video-button").forEach((button) => {
        const kid = button.getAttribute("data-kid") || (document.getElementById("codeDisplay")?.getAttribute("data-kid") || "kid1");
        const jsonFile = button.getAttribute("data-json-file");
        const selectionMode = button.getAttribute("data-selection-mode");
        const dataKey = button.getAttribute("data-key"); // Use data-key

        if (!jsonFile || !selectionMode || !dataKey) {
            button.textContent = "Invalid Config";
            button.disabled = true;
            return;
        }

        fetch(jsonFile)
            .then(resp => resp.json())
            .then(videoData => {
                const keys = Object.keys(videoData);
                let videoKey;

                // Determine the video key based on the selection mode
                if (selectionMode === "sequential") {
                    videoKey = getNextVideoKey(keys, "ytseq_btn_" + dataKey);
                } else if (selectionMode === "exact") {
                    videoKey = button.textContent.trim();
                } else if (selectionMode === "random") {
                    videoKey = keys[Math.floor(Math.random() * keys.length)];
                }

                const videoId = videoData[videoKey];
                button.textContent = videoKey.replace(/([A-Z])/g, ' $1').trim();

                button.addEventListener("click", function () {
                    lastVideoButtonKid = kid;
                    lastVideoButtonKey = dataKey;

                    // Recompute videoKey in case day changed (for sequential mode)
                    let key = videoKey;
                    if (selectionMode === "sequential") {
                        key = getNextVideoKey(keys, "ytseq_btn_" + dataKey);
                    }
                    const videoId = videoData[key];

                    launchYouTubeModal(videoId, function () {
                        if (typeof unlockNextPiece === "function" && lastVideoButtonKid && lastVideoButtonKey) {
                            unlockNextPiece(lastVideoButtonKid, lastVideoButtonKey);

                            // Immediately mark the video button as completed
                            button.classList.add('completed');
                        }
                    });
                });
            })
            .catch(() => {
                button.textContent = "Video Load Error";
                button.disabled = true;
            });
    });
});