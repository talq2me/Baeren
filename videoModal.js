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

    // Load both JSON files before initializing buttons
    Promise.all([
        fetch("https://talq2me.github.io/Baeren/frenchBookVideoLinks.json").then(response => response.json()).catch(() => ({})),
        fetch("https://talq2me.github.io/Baeren/videoLinks.json").then(response => response.json()).catch(() => ({}))
    ])
    .then(([frenchData, generalData]) => {
        frenchVideoData = frenchData;
        otherVideoData = generalData;
        initializeButtons(); // Now both files are loaded before running this
    })
    .catch(error => console.error("Error loading video data:", error));

    function initializeButtons() {
        document.querySelectorAll("[data-video-button]").forEach((button) => {
            const buttonType = button.getAttribute("data-video-button");

            if (buttonType === "frenchBookVideo") {
                // Handle random French book videos
                if (Object.keys(frenchVideoData).length > 0) {
                    const randomKey = getRandomKey(frenchVideoData);
                    button.textContent = randomKey || "Loading...";
                    const videoId = frenchVideoData[randomKey];

                    button.onclick = function () {
                        openVideoModal(videoId);
                    };

                    delete frenchVideoData[randomKey]; // Ensure uniqueness
                } else {
                    button.textContent = "No Videos Available";
                    button.disabled = true;
                }
            } else {
                // Handle specific video button cases from videoLinks.json
                if (otherVideoData.hasOwnProperty(buttonType)) {
                    button.textContent = buttonType; // Show button label
                    const videoId = otherVideoData[buttonType];

                    button.onclick = function () {
                        openVideoModal(videoId);
                    };
                } else {
                    button.textContent = "Video Not Found";
                    button.disabled = true;
                }
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

    function getRandomKey(obj) {
        const keys = Object.keys(obj);
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
