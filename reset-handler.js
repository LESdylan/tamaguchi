/**
 * Emergency Reset Handler
 * This script helps recover from stuck game states
 */

// Detect if there is an ongoing issue with the game getting stuck
document.addEventListener('DOMContentLoaded', function() {
    // Add an emergency reset button that's always available
    const emergencyResetBtn = document.createElement('button');
    emergencyResetBtn.textContent = 'Reset Game';
    emergencyResetBtn.style.position = 'fixed';
    emergencyResetBtn.style.bottom = '10px';
    emergencyResetBtn.style.right = '10px';
    emergencyResetBtn.style.zIndex = '9999';
    emergencyResetBtn.style.padding = '5px 10px';
    emergencyResetBtn.style.backgroundColor = '#ff5555';
    emergencyResetBtn.style.color = 'white';
    emergencyResetBtn.style.border = 'none';
    emergencyResetBtn.style.borderRadius = '5px';
    emergencyResetBtn.style.cursor = 'pointer';
    emergencyResetBtn.style.display = 'none'; // Hidden by default
    
    // Show reset button on mouse movement in corners
    document.addEventListener('mousemove', function(e) {
        const cornerThreshold = 50;
        if (
            (e.clientX < cornerThreshold && e.clientY < cornerThreshold) || // Top-left
            (e.clientX > window.innerWidth - cornerThreshold && e.clientY < cornerThreshold) || // Top-right
            (e.clientX < cornerThreshold && e.clientY > window.innerHeight - cornerThreshold) || // Bottom-left
            (e.clientX > window.innerWidth - cornerThreshold && e.clientY > window.innerHeight - cornerThreshold) // Bottom-right
        ) {
            emergencyResetBtn.style.display = 'block';
        } else {
            emergencyResetBtn.style.display = 'none';
        }
    });
    
    // Emergency reset logic
    emergencyResetBtn.addEventListener('click', function() {
        console.log('Emergency reset clicked');
        
        // Clear all overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
        
        // Clean localStorage
        localStorage.removeItem('tamastudi_save');
        localStorage.removeItem('tamastudi_achievements');
        
        // Force page reload
        window.location.reload();
    });
    
    document.body.appendChild(emergencyResetBtn);
    
    // Add a click counter to the document for debugging purposes
    document.addEventListener('click', function(e) {
        const target = e.target;
        console.log('Click detected on:', target.tagName, target.className, target.id);
        
        if (target.id === 'restart-button' || target.classList.contains('js-restart-button')) {
            console.log('Restart button clicked from reset-handler');
            e.stopPropagation();
            
            // Hide game over screen
            const gameOverScreen = document.querySelector('.js-game-over');
            if (gameOverScreen) {
                gameOverScreen.classList.add('hidden');
            }
            
            // Hard page reload as a fallback
            window.location.reload();
        }
    }, true);
});
