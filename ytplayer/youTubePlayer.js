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
                    fs: 1,
                    host: "https://www.youtube-nocookie.com"
                }
            });
        }
        
        createPlayer();
    }

    // Load YouTube API if not present
    if (!window.YT) {
        let tag = document.createElement('script');
        tag.src = "https://www.youtube-nocookie.com/iframe_api";
        document.body.appendChild(tag);
    }

    // Initialize video buttons
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
                let videoKey;

                // Determine the video key based on the selection mode
                if (selectionMode === "sequential") {
                    videoKey = getNextVideoKey(keys, "ytseq_btn" + btnIndex);
                } else if (selectionMode === "exact") {
                    videoKey = button.textContent.trim(); // Use the button's text as the key
                } else if (selectionMode === "random") {
                    videoKey = keys[Math.floor(Math.random() * keys.length)]; // Pick a random key
                }

                // Get the video ID from the JSON data
                const videoId = videoData[videoKey];

                // Set the button text to the video name (formatted for readability)
                button.textContent = videoKey.replace(/([A-Z])/g, ' $1').trim();

                // Add click event to launch the video modal
                button.addEventListener("click", function () {
                    // Recompute videoKey in case day changed (for sequential mode)
                    let key = videoKey;
                    if (selectionMode === "sequential") {
                        key = getNextVideoKey(keys, "ytseq_btn" + btnIndex);
                    }
                    const videoId = videoData[key];

                    // Launch the YouTube modal
                    launchYouTubeModal(videoId, function () {
                        // Optional: Add logic to execute when the modal closes
                    });
                });
            })
            .catch(() => {
                button.textContent = "Video Load Error";
                button.disabled = true;
            });
    });
});