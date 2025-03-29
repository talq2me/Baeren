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

    // Load video data from frenchBookVideoLinks.json
    fetch("https://talq2me.github.io/Baeren/frenchBookVideoLinks.json")
        .then(response => response.json())
        .then(data => {
            videoData = data;

            // Find all buttons with data-video-button="frenchBookVideo"
            document.querySelectorAll("[data-video-button='frenchBookVideo']").forEach((button) => {
                if (videoData && Object.keys(videoData).length > 0) {
                    // Get a random key (button text) from the videoData object
                    const randomKey = getRandomKey(videoData);

                    // Set the button text to the random key (button label)
                    button.textContent = randomKey || "Loading...";

                    // Get the corresponding video ID for the random key
                    const videoId = videoData[randomKey];

                    // Add click event to open the video modal
                    button.addEventListener("click", function () {
                        openVideoModal(videoId);
                    });

                    // Remove the selected key from the videoData object to ensure a unique video for each button
                    delete videoData[randomKey];
                } else {
                    button.textContent = "Video Not Found";
                    button.disabled = true;
                }
            });
        })
        .catch(error => console.error("Error loading video data:", error));

    window.openVideoModal = function (videoId) {
        modal.style.display = "flex";
        //cases for specific videos that have a start and end because they are in a larger video
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

    // Function to get a random key from an object
    function getRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    // Load YouTube API Script if not already loaded
    if (!document.getElementById("youtubeAPI")) {
        var tag = document.createElement('script');
        tag.id = "youtubeAPI";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }
});
