document.addEventListener("DOMContentLoaded", function () {
    var modal = document.createElement("div");
    modal.id = "videoModal";
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="closeModal()">×</button>
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

    // Load JSON files before initializing buttons
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
            let videoName = buttonType; // Default name is buttonType

            if (buttonType === "randFrenchBook") {
                videoName = getRandomKey(frenchVideoData);
                videoId = frenchVideoData[videoName];
            } else if (buttonType === "randNoviceKungFuVid") {
                videoName = getRandomKey(novKungFuVideoData);
                videoId = novKungFuVideoData[videoName];
            } else if (buttonType === "randIntermediateKungFuVid") {
                videoName = getRandomKey(intKungFuVideoData);
                videoId = intKungFuVideoData[videoName];
            } else if (buttonType === "randAdvancedKungFuVid") {
                videoName = getRandomKey(advKungFuVideoData);
                videoId = advKungFuVideoData[videoName];
            } else if (otherVideoData.hasOwnProperty(buttonType)) {
                videoName = buttonType; // Use exact match from videoLinks.json
                videoId = otherVideoData[buttonType];
            }

            if (videoId) {
                button.textContent = videoName; // Display video name instead of buttonType
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
        modal.style.display = "flex";
        iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0`;
        createYouTubePlayer();
    }

    function closeModal() {
        modal.style.display = "none";
        iframe.src = ""; // Stop video when closing
    }

    function createYouTubePlayer() {
        if (!player) {
            player = new YT.Player('youtubePlayer', {
                events: { 'onStateChange': onPlayerStateChange }
            });
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === 0) { // Video ended
            closeModal();
        }
    }

    function getRandomKey(data) {
        const keys = Object.keys(data);
        return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
    }

    // Load YouTube API if not already loaded
    if (!document.getElementById("youtubeAPI")) {
        var tag = document.createElement('script');
        tag.id = "youtubeAPI";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }
});
