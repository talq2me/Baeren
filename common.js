        // Function to go back to the previous page
        function goBack() {
            if (document.referrer) {
                window.location.href = document.referrer; // Takes you back to the referring page
            } else {
                window.history.back(); // Fallback method
            }
        }

        document.addEventListener("DOMContentLoaded", function () {
            const checkboxes = document.querySelectorAll("input[type='checkbox']");
            
            // Load saved state from localStorage
            checkboxes.forEach(checkbox => {
                const isChecked = localStorage.getItem(checkbox.id) === "true";
                checkbox.checked = isChecked;
                
                checkbox.addEventListener("change", () => {
                    localStorage.setItem(checkbox.id, checkbox.checked);
                });
            });
        });
        