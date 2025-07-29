document.addEventListener("DOMContentLoaded", function () {
    var modal = document.createElement("div");
    modal.id = "videoModal";
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <iframe id="youtubePlayer" src="" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(modal);

    var iframe = document.getElementById("youtubePlayer");
    var player;
    var frenchVideoData = {};
    var otherVideoData = {};
    var novKungFuVideoData = {};
    var intKungFuVideoData = {};
    var advKungFuVideoData = {};
    var heggertyVideoData = {};
    var displayedVideos = new Set();
    var videoEnded = false; // Track if video has ended

    // Load JSON files
    Promise.all([
        fetch("../frenchBookVideoLinks.json").then(response => response.json()).catch(() => ({})),
        fetch("../videoLinks.json").then(response => response.json()).catch(() => ({})),
        fetch("../noviceKungFuVideos.json").then(response => response.json()).catch(() => ({})),
        fetch("../intermediateKungFuVideos.json").then(response => response.json()).catch(() => ({})),
        fetch("../advancedKungFuVideos.json").then(response => response.json()).catch(() => ({})),
        fetch("../heggertyVideos.json").then(response => response.json()).catch(() => ({}))
    ])
    .then(([frenchData, generalData, novKF, intKF, advKF, hegg]) => {
        frenchVideoData = frenchData;
        otherVideoData = generalData;
        novKungFuVideoData = novKF;
        intKungFuVideoData = intKF;
        advKungFuVideoData = advKF;
        heggertyVideoData = hegg;
        initializeButtons();
    })
    .catch(error => console.error("Error loading video data:", error));

    function initializeButtons() {
        document.querySelectorAll("[data-video-button]").forEach((button) => {
            const buttonType = button.getAttribute("data-video-button");
            const jsonFile = button.getAttribute("data-json-file");
            const selectionMode = button.getAttribute("data-selection-mode");
            const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
            const storageKey = `dailyVideo_${buttonType}`;
            const lastDateKey = `lastDate_${buttonType}`;

            if (!jsonFile || !selectionMode) {
                button.textContent = "Invalid Configuration";
                button.disabled = true;
                return;
            }

            fetch(jsonFile)
                .then(response => response.json())
                .then(dataSet => {
                    let videoName, videoId;

                    if (selectionMode === "exact") {
                        videoId = dataSet[buttonType];
                        videoName = buttonType;
                    } else if (selectionMode === "random") {
                        videoName = getUniqueRandomKey(dataSet);
                        videoId = dataSet[videoName];
                    } else if (selectionMode === "sequential") {
                        const keys = Object.keys(dataSet);
                        const lastDate = localStorage.getItem(lastDateKey);
                        let currentIndex = parseInt(localStorage.getItem(storageKey) || "0", 10);

                        // If the date has changed, move to the next video
                        if (lastDate !== today) {
                            currentIndex = (currentIndex + 1) % keys.length; // Loop back to the start if at the end
                            localStorage.setItem(storageKey, currentIndex);
                            localStorage.setItem(lastDateKey, today);
                        }

                        videoName = keys[currentIndex];
                        videoId = dataSet[videoName];
                    }

                    if (videoId) {
                        button.textContent = videoName || buttonType;
                        button.onclick = function () {
                            openVideoModal(videoId);
                        };
                    } else {
                        button.textContent = "Video Not Found";
                        button.disabled = true;
                    }
                })
                .catch(error => {
                    console.error(`Error loading JSON file ${jsonFile}:`, error);
                    button.textContent = "Error Loading Video";
                    button.disabled = true;
                });
        });
    }

    function openVideoModal(videoId) {
        videoEnded = false;
        modal.style.display = "flex";
        iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0`;
        createYouTubePlayer();
    }

    function closeModal() {
        if (videoEnded) { // Only allow closing if video has ended
            modal.style.display = "none";
            iframe.src = "";
            player = null; // Reset player
            videoEnded = false;
        }
    }

    function createYouTubePlayer() {
        if (!window.YT || !window.YT.Player) {
            console.warn("YouTube API not loaded yet, retrying...");
            setTimeout(createYouTubePlayer, 500);
            return;
        }

        if (!player) {
            player = new YT.Player('youtubePlayer', {
                events: {
                    'onStateChange': onPlayerStateChange,
                    'onError': (event) => console.error("YouTube Player Error:", event.data)
                }
            });
        }

        // Fallback polling for Android
        checkVideoState();
    }

    function onPlayerStateChange(event) {
        console.log("Player state:", event.data); // Debug state changes
        if (event.data === YT.PlayerState.ENDED) {
            videoEnded = true;
            closeModal(); // Auto-close modal
        }
    }

    function checkVideoState() {
        if (!player || !player.getPlayerState) return;

        const state = player.getPlayerState();
        if (state === YT.PlayerState.ENDED && !videoEnded) {
            videoEnded = true;
            closeModal();
        }

        // Continue polling until video ends or modal closes
        if (modal.style.display === "flex") {
            setTimeout(checkVideoState, 1000);
        }
    }

    function getUniqueRandomKey(data) {
        const availableKeys = Object.keys(data).filter(key => !displayedVideos.has(data[key]));
        if (availableKeys.length === 0) return getRandomKey(data);
        return availableKeys[Math.floor(Math.random() * availableKeys.length)];
    }

    function getRandomKey(data) {
        const keys = Object.keys(data);
        return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
    }


    // Load YouTube API
    if (!document.getElementById("youtubeAPI")) {
        var tag = document.createElement('script');
        tag.id = "youtubeAPI";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }

    // filter keys that start with "Heggerty"
    const heggertyKeys = Object.keys(heggertyVideoData).filter(key => key.startsWith("Heggerty"));

    const totalVideos = heggertyKeys.length;

    const today = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem("heggertyLastDate");
    let currentIndex = parseInt(localStorage.getItem("heggertyIndex") || "0", 10);

    // advance to the next video if the date has changed
    if (today !== lastDate) {
        currentIndex = (currentIndex + 1) % totalVideos;
        localStorage.setItem("heggertyIndex", currentIndex);
        localStorage.setItem("heggertyLastDate", today);
    }

    const videoKey = heggertyKeys[currentIndex];
    const videoId = heggertyVideoData[videoKey];


    const button = document.querySelector("#heggertyVideoBtn");
    if (button) {
        button.textContent = videoKey; // shows "Heggerty23", etc.
        button.addEventListener("click", () => {
            openVideoModal(videoId); // replace with your actual video player logic
        });
    }

});