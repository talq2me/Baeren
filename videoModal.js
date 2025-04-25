document.addEventListener("DOMContentLoaded", function () {
    var modal = document.createElement("div");
    modal.id = "videoModal";
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" id="closeModalBtn" disabled>×</button>
            <iframe id="youtubePlayer" src="" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(modal);

    var iframe = document.getElementById("youtubePlayer");
    var closeBtn = document.getElementById("closeModalBtn");
    var player;
    var frenchVideoData = {};
    var otherVideoData = {};
    var novKungFuVideoData = {};
    var intKungFuVideoData = {};
    var advKungFuVideoData = {};
    var displayedVideos = new Set();
    var videoEnded = false; // Track if video has ended

    // Load JSON files
    Promise.all([
        fetch("../frenchBookVideoLinks.json").then(response => response.json()).catch(() => ({})),
        fetch("../videoLinks.json").then(response => response.json()).catch(() => ({})),
        fetch("../noviceKungFuVideos.json").then(response => response.json()).catch(() => ({})),
        fetch("../intermediateKungFuVideos.json").then(response => response.json()).catch(() => ({})),
        fetch("../advancedKungFuVideos.json").then(response => response.json()).catch(() => ({}))
    ])
    .then(([frenchData, generalData, novKF, intKF, advKF]) => {
        frenchVideoData = frenchData;
        otherVideoData = generalData;
        novKungFuVideoData = novKF;
        intKungFuVideoData = intKF;
        advKungFuVideoData = advKF;
        initializeButtons();
    })
    .catch(error => console.error("Error loading video data:", error));

    function initializeButtons() {
        document.querySelectorAll("[data-video-button]").forEach((button) => {
            const buttonType = button.getAttribute("data-video-button");

            let videoId = null;
            let videoName = buttonType;

            if (buttonType === "randFrenchBook") {
                videoName = getUniqueRandomKey(frenchVideoData);
                videoId = frenchVideoData[videoName];
            } else if (buttonType === "randNoviceKungFuVid") {
                videoName = getUniqueRandomKey(novKungFuVideoData);
                videoId = novKungFuVideoData[videoName];
            } else if (buttonType === "randIntermediateKungFuVid") {
                videoName = getUniqueRandomKey(intKungFuVideoData);
                videoId = intKungFuVideoData[videoName];
            } else if (buttonType === "randAdvancedKungFuVid") {
                videoName = getUniqueRandomKey(advKungFuVideoData);
                videoId = advKungFuVideoData[videoName];
            } else if (otherVideoData.hasOwnProperty(buttonType)) {
                videoName = buttonType;
                videoId = otherVideoData[buttonType];
            }

            if (videoId) {
                displayedVideos.add(videoId);
                button.textContent = videoName;
                button.onclick = function () {
                    openVideoModal(videoId);
                };
            } else {
                button.textContent = "Video Not Found";
                button.disabled = true;
            }
        });
    }

    function openVideoModal(videoId) {
        videoEnded = false;
        closeBtn.disabled = true; // Disable close button until video ends
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
            closeBtn.disabled = true;
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
            closeBtn.disabled = false; // Enable close button
            closeModal(); // Auto-close modal
        }
    }

    function checkVideoState() {
        if (!player || !player.getPlayerState) return;

        const state = player.getPlayerState();
        if (state === YT.PlayerState.ENDED && !videoEnded) {
            videoEnded = true;
            closeBtn.disabled = false;
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

    // Attach close button event listener programmatically
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('touchend', closeModal); // Explicit touch support

    // Load YouTube API
    if (!document.getElementById("youtubeAPI")) {
        var tag = document.createElement('script');
        tag.id = "youtubeAPI";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }

});