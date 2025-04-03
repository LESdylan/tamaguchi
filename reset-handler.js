/**
 * Emergency Reset Handler
 * This script helps recover from stuck game states
 */

// Detect if there is an ongoing issue with the game getting stuck
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reset handler initialized');
    
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
        forceResetGame();
    });
    
    document.body.appendChild(emergencyResetBtn);
    
    // Global force reset function that can be used from anywhere
    window.forceResetGame = function() {
        console.log('Forcing game reset...');
        
        // Clean localStorage
        localStorage.removeItem('tamastudi_save');
        localStorage.removeItem('tamastudi_achievements');
        
        // Clear all overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            console.log('Hiding overlay:', overlay.className);
            overlay.classList.add('hidden');
        });
        
        // Force page reload
        console.log('Reloading page...');
        window.location.reload();
    };
    
    // Monkey patch the restart button with a direct solution
    const patchGameOverButtons = function() {
        console.log('Patching game over buttons');
        
        // Handle restart button
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', function(event) {
                console.log('Restart button clicked from reset handler patch');
                event.preventDefault();
                event.stopPropagation();
                
                // Force reset the game
                forceResetGame();
            }, true);
        }
        
        // Also patch any js-restart-button class elements
        const restartButtons = document.querySelectorAll('.js-restart-button');
        restartButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                console.log('js-restart-button clicked from reset handler patch');
                event.preventDefault();
                event.stopPropagation();
                
                // Force reset the game
                forceResetGame();
            }, true);
        });
    };
    
    // Try to patch immediately
    patchGameOverButtons();
    
    // Also patch after a delay to catch late-rendered buttons
    setTimeout(patchGameOverButtons, 1000);
    setTimeout(patchGameOverButtons, 2000);
    
    // Monitor for game over screen appearance
    const gameOverObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' &&
                !mutation.target.classList.contains('hidden')) {
                    
                console.log('Game over screen appeared, patching buttons');
                patchGameOverButtons();
            }
        });
    });
    
    const gameOverScreen = document.querySelector('.js-game-over');
    if (gameOverScreen) {
        gameOverObserver.observe(gameOverScreen, { attributes: true });
    }
});
