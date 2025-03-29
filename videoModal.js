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

    // Load frenchBookVideoLinks.json
    fetch("https://talq2me.github.io/Baeren/frenchBookVideoLinks.json")
        .then(response => response.json())
        .then(data => {
            frenchVideoData = data;
            initializeButtons();
        })
        .catch(error => console.error("Error loading French book video data:", error));

    // Load videoLinks.json
    fetch("https://talq2me.github.io/Baeren/videoLinks.json")
        .then(response => response.json())
        .then(data => {
            otherVideoData = data;
            initializeButtons();
        })
        .catch(error => console.error("Error loading general video data:", error));

    function initializeButtons() {
        document.querySelectorAll("[data-video-button]").forEach((button) => {
            const buttonType = button.getAttribute("data-video-button");

            if (buttonType === "frenchBookVideo") {
                // Handle French book videos (random selection)
                if (frenchVideoData && Object.keys(frenchVideoData).length > 0) {
                    const randomKey = getRandomKey(frenchVideoData);
                    button.textContent = randomKey || "Loading...";
                    const videoId = frenchVideoData[randomKey];

                    button.addEventListener("click", function () {
                        openVideoModal(videoId);
                    });

                    delete frenchVideoData[randomKey]; // Ensure uniqueness
                } else {
                    button.textContent = "Video Not Found";
                    button.disabled = true;
                }
            } else {
                // Handle general video links
                if (otherVideoData[buttonType]) {
                    button.addEventListener("click", function () {
                        openVideoModal(otherVideoData[buttonType]);
                    });
                } else {
                    button.textContent = "Video Not Found";
                    button.disabled = true;
                }
            }
        });
    }

    window.openVideoModal = function (videoId) {
        modal.style.display = "flex";
        if (videoId === "J-q7npqaYoI") {
            iframe.src = "https://www.youtube.com/embed/J-q7npqaYoI?start=163&end=240&autoplay=1&rel=0"; 
        } else {
            iframe.src = "https://www.youtube.com/embed/" + videoId + "?enablejsapi=1&autoplay=1&rel=0";
        }

        createYouTubePlayer();
    };

    window.closeModal = function () {
        modal.style.display = "none";
        iframe.src = ""; // Stop video when closing
    };

    function createYouTubePlayer() {
        if (!player) {
            player = new YT.Player('youtubePlayer', {
                events: {
                    'onStateChange': onPlayerStateChange
                }
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
