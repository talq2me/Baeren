        // Function to go back to the previous page
        function goBack() {
            if (document.referrer) {
                window.location.href = document.referrer; // Takes you back to the referring page
            } else {
                window.history.back(); // Fallback method
            }
        }