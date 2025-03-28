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
    var videoData = {};

    // Load video data from JSON file
    fetch("https://talq2me.github.io/Baeren/videoLinks.json")
        .then(response => response.json())
        .then(data => {
            videoData = data;

            // Find all buttons with data-video-button attribute
            document.querySelectorAll("[data-video-button]").forEach(button => {
                var buttonId = button.getAttribute("data-video-button");
                
                if (videoData[buttonId]) {
                    button.textContent = buttonId; // Set button text to match ID
                    button.addEventListener("click", function () {
                        openVideoModal(videoData[buttonId]);
                    });
                } else {
                    button.textContent = "Video Not Found";
                    button.disabled = true;
                }
            });
        })
        .catch(error => console.error("Error loading video data:", error));

    window.openVideoModal = function (videoId) {
        modal.style.display = "flex";
        iframe.src = "https://www.youtube.com/embed/" + videoId + "?enablejsapi=1&autoplay=1&rel=0";
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

    // Load YouTube API Script if not already loaded
    if (!document.getElementById("youtubeAPI")) {
        var tag = document.createElement('script');
        tag.id = "youtubeAPI";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }
});
