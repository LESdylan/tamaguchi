/**
 * Mini-games System for Tamastudi
 * This file handles all mini-game functionality
 */

// Mini-game rewards
const GAME_REWARDS = {
    SMALL: 0.5,
    MEDIUM: 1,
    LARGE: 2
};

// Track if games are available
let gamesUnlocked = {
    memory: true,
    quiz: true,
    catchfood: false  // Requires adult stage
};

// Initialize mini-games
const initMinigames = () => {
    // Set up event listeners
    document.querySelector('.js-show-minigames').addEventListener('click', () => {
        document.querySelector('.js-minigames-panel').classList.remove('hidden');
        updateMinigamesUI();
        sound.play('sound-click');
    });
    
    document.querySelector('.js-close-minigames').addEventListener('click', () => {
        document.querySelector('.js-minigames-panel').classList.add('hidden');
        sound.play('sound-click');
    });
    
    document.querySelector('.js-close-minigame-modal').addEventListener('click', () => {
        document.querySelector('.js-minigame-modal').classList.add('hidden');
        sound.play('sound-click');
        resumeDesires();
    });
    
    // Add click handlers for each game
    document.querySelector('.js-play-memory').addEventListener('click', () => {
        if (gamesUnlocked.memory) {
            startMinigame('memory');
        }
    });
    
    document.querySelector('.js-play-quiz').addEventListener('click', () => {
        if (gamesUnlocked.quiz) {
            startMinigame('quiz');
        }
    });
    
    document.querySelector('.js-play-catchfood').addEventListener('click', () => {
        if (gamesUnlocked.catchfood) {
            startMinigame('catchfood');
        }
    });
};

// Update mini-games UI based on unlock status
const updateMinigamesUI = () => {
    // Check if catchfood game should be unlocked (adult stage)
    if (myTama.stage === CONFIG.EVOLUTION_STAGES.ADULT || 
        myTama.stage === CONFIG.EVOLUTION_STAGES.SPECIAL) {
        gamesUnlocked.catchfood = true;
        const catchfoodCard = document.querySelector('[data-game="catchfood"]');
        const catchfoodButton = document.querySelector('.js-play-catchfood');
        
        if (catchfoodCard) {
            catchfoodCard.classList.remove('locked');
        }
        
        if (catchfoodButton) {
            catchfoodButton.disabled = false;
            catchfoodButton.textContent = 'Jouer';
        }
    }
    
    // Disable all games if Tama is sleeping or dead
    const allGameButtons = document.querySelectorAll('.minigame-button');
    allGameButtons.forEach(button => {
        if (myTama.sleeping || !myTama.alive) {
            button.disabled = true;
            button.textContent = myTama.sleeping ? 'Indisponible (tama endormi)' : 'Indisponible';
        } else if (!button.classList.contains('js-play-catchfood') || gamesUnlocked.catchfood) {
            button.disabled = false;
            button.textContent = 'Jouer';
        }
    });
};

// Start a mini-game
const startMinigame = (gameType) => {
    if (!myTama.alive || myTama.sleeping) {
        showNotification("Votre Tamastudi ne peut pas jouer maintenant!", true);
        return;
    }
    
    sound.play('sound-click');
    
    // Pause any ongoing desires (we don't want the Tama to lose vitals while playing)
    pauseDesires();
    
    // Show the mini-game modal
    const minigameModal = document.querySelector('.js-minigame-modal');
    const minigameTitle = document.querySelector('.js-minigame-title');
    const minigameContainer = document.querySelector('.js-minigame-container');
    
    minigameModal.classList.remove('hidden');
    
    // Set up the specific game
    switch(gameType) {
        case 'memory':
            minigameTitle.textContent = 'Memory';
            // Using the dedicated Memory game implementation
            launchMemoryGame(minigameContainer, (scoreLevel) => {
                let reward;
                if (scoreLevel === 'large') {
                    reward = GAME_REWARDS.LARGE;
                } else if (scoreLevel === 'medium') {
                    reward = GAME_REWARDS.MEDIUM;
                } else {
                    reward = GAME_REWARDS.SMALL;
                }
                giveGameReward(reward);
                endMinigame();
            });
            break;
        case 'quiz':
            minigameTitle.textContent = 'Quiz Animaux';
            setupQuizGame(minigameContainer);
            break;
        case 'catchfood':
            minigameTitle.textContent = 'Attrapez la Nourriture';
            setupCatchFoodGame(minigameContainer);
            break;
    }
};

// Pause desires during minigame
const pauseDesires = () => {
    if (timeoutWaitForAction) {
        clearTimeout(timeoutWaitForAction);
    }
};

// Resume desires after minigame
const resumeDesires = () => {
    if (myTama.alive && !myTama.sleeping) {
        wantsTo((desire) => {
            mood();
            cycleOfAdultLife(desire);
        });
    }
};

// Give rewards based on mini-game performance
const giveGameReward = (rewardSize) => {
    if (!myTama.alive) return;
    
    // Different reward based on the size
    let reward = 0;
    
    switch(rewardSize) {
        case GAME_REWARDS.SMALL:
            reward = 0.5;
            showNotification('Petite récompense obtenue! (+0.5 à tous les indicateurs)');
            break;
        case GAME_REWARDS.MEDIUM:
            reward = 1;
            showNotification('Récompense moyenne obtenue! (+1 à tous les indicateurs)');
            break;
        case GAME_REWARDS.LARGE:
            reward = 2;
            showNotification('Grande récompense obtenue! (+2 à tous les indicateurs)');
            break;
    }
    
    // Increase all vitals
    if (myTama.fed < CONFIG.MAX_SCORE) {
        myTama.fed = Math.min(CONFIG.MAX_SCORE, myTama.fed + reward);
    }
    
    if (myTama.playfull < CONFIG.MAX_SCORE) {
        myTama.playfull = Math.min(CONFIG.MAX_SCORE, myTama.playfull + reward);
    }
    
    if (myTama.cleaned < CONFIG.MAX_SCORE) {
        myTama.cleaned = Math.min(CONFIG.MAX_SCORE, myTama.cleaned + reward);
    }
    
    // Update UI
    updateVitals();
    mood();
    
    // Show reward animation
    showRewardAnimation(reward);
};

// Show reward animation
const showRewardAnimation = (reward) => {
    const effects = document.querySelector('.js-effects');
    
    // Different effects based on reward size
    const emoji = '⭐';
    const count = reward <= 0.5 ? 3 : (reward <= 1 ? 6 : 10);
    
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.textContent = emoji;
        star.style.position = 'absolute';
        star.style.fontSize = '2rem';
        star.style.opacity = '1';
        star.style.zIndex = '5';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        
        // Animate
        star.style.animation = `sparkle 1s ease-out, fadeOut 1s ease-out`;
        
        effects.appendChild(star);
        
        // Remove after animation
        setTimeout(() => {
            if (effects.contains(star)) {
                effects.removeChild(star);
            }
        }, 1000);
    }
};

// End current minigame
const endMinigame = () => {
    document.querySelector('.js-minigame-modal').classList.add('hidden');
    document.querySelector('.js-minigame-container').innerHTML = '';
    
    // Resume normal game cycle
    resumeDesires();
};

// ====== QUIZ GAME ======
const setupQuizGame = (container) => {
    container.innerHTML = `
        <div class="quiz-game">
            <div class="quiz-info">
                <p>Testez vos connaissances sur les animaux!</p>
                <p>Score: <span class="quiz-score">0</span> / 5</p>
            </div>
            <div class="quiz-question-container">
                <p class="quiz-question"></p>
                <div class="quiz-options"></div>
            </div>
        </div>
    `;
    
    // Quiz questions
    const questions = [
        {
            question: "Quel animal peut vivre le plus longtemps ?",
            options: ["Éléphant", "Tortue géante", "Baleine bleue", "Perroquet"],
            correctAnswer: "Tortue géante"
        },
        {
            question: "Quel animal est connu pour être le plus rapide sur terre ?",
            options: ["Lion", "Guépard", "Antilope", "Autruche"],
            correctAnswer: "Guépard"
        },
        {
            question: "Quel animal a le plus grand cœur ?",
            options: ["Éléphant", "Baleine bleue", "Girafe", "Gorille"],
            correctAnswer: "Baleine bleue"
        },
        {
            question: "Quel animal peut régénérer une partie de son corps ?",
            options: ["Lézard", "Étoile de mer", "Araignée", "Grenouille"],
            correctAnswer: "Étoile de mer"
        },
        {
            question: "Quel animal est connu pour dormir debout ?",
            options: ["Cheval", "Girafe", "Éléphant", "Flamant rose"],
            correctAnswer: "Cheval"
        }
    ];
    
    // Quiz state
    const quizState = {
        currentQuestion: 0,
        score: 0,
        questions: shuffleArray([...questions]).slice(0, 5) // Take 5 random questions
    };
    
    // Display first question
    displayQuestion();
    
    function displayQuestion() {
        const question = quizState.questions[quizState.currentQuestion];
        container.querySelector('.quiz-question').textContent = question.question;
        
        const optionsContainer = container.querySelector('.quiz-options');
        optionsContainer.innerHTML = '';
        
        // Shuffle options for more randomness
        const shuffledOptions = shuffleArray([...question.options]);
        
        shuffledOptions.forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.className = 'quiz-option';
            optionButton.textContent = option;
            
            optionButton.addEventListener('click', () => {
                sound.play('sound-click');
                
                // Check if correct
                if (option === question.correctAnswer) {
                    optionButton.classList.add('correct');
                    quizState.score++;
                    container.querySelector('.quiz-score').textContent = quizState.score;
                } else {
                    optionButton.classList.add('incorrect');
                    // Highlight correct answer
                    const correctButton = Array.from(container.querySelectorAll('.quiz-option'))
                                              .find(btn => btn.textContent === question.correctAnswer);
                    if (correctButton) {
                        correctButton.classList.add('correct');
                    }
                }
                
                // Disable all options after an answer
                const allOptions = container.querySelectorAll('.quiz-option');
                allOptions.forEach(btn => {
                    btn.disabled = true;
                });
                
                // Move to next question or end quiz
                setTimeout(() => {
                    quizState.currentQuestion++;
                    
                    if (quizState.currentQuestion < quizState.questions.length) {
                        displayQuestion();
                    } else {
                        // Quiz completed
                        endQuiz();
                    }
                }, 1500);
            });
            
            optionsContainer.appendChild(optionButton);
        });
    }
    
    function endQuiz() {
        // Calculate reward based on score
        let reward;
        if (quizState.score >= 4) {
            reward = GAME_REWARDS.LARGE;
        } else if (quizState.score >= 2) {
            reward = GAME_REWARDS.MEDIUM;
        } else {
            reward = GAME_REWARDS.SMALL;
        }
        
        // Show completion message
        container.innerHTML = `
            <div class="game-completed">
                <h3>Quiz terminé!</h3>
                <p>Votre score final est de ${quizState.score} / 5</p>
                <button class="game-button js-close-game">Fermer</button>
            </div>
        `;
        
        container.querySelector('.js-close-game').addEventListener('click', endMinigame);
        
        // Give reward
        giveGameReward(reward);
    }
    
    // Add game styles
    const style = document.createElement('style');
    style.textContent = `
        .quiz-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        
        .quiz-info {
            text-align: center;
            margin-bottom: 10px;
        }
        
        .quiz-question-container {
            width: 100%;
            max-width: 600px;
        }
        
        .quiz-question {
            font-size: 1.2rem;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .quiz-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .quiz-option {
            padding: 15px;
            border-radius: 8px;
            background-color: #3a86ff;
            color: white;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s;
            text-align: left;
        }
        
        .quiz-option:hover {
            background-color: #2a76ef;
        }
        
        .quiz-option.correct {
            background-color: #4caf50;
        }
        
        .quiz-option.incorrect {
            background-color: #f44336;
        }
        
        .quiz-option:disabled {
            cursor: default;
            opacity: 0.8;
        }
    `;
    
    document.head.appendChild(style);
};

// ====== CATCH FOOD GAME ======
const setupCatchFoodGame = (container) => {
    container.innerHTML = `
        <div class="catchfood-game">
            <div class="game-info">
                <p>Attrapez autant de nourriture que possible en 30 secondes!</p>
                <p>Score: <span class="catchfood-score">0</span></p>
                <p>Temps: <span class="catchfood-timer">30</span>s</p>
            </div>
            <div class="catchfood-area">
                <div class="catchfood-character">
                    ${myTama.stage}
                </div>
            </div>
        </div>
    `;
    
    // Game state
    const gameState = {
        score: 0,
        timeLeft: 30,
        timer: null,
        foodInterval: null,
        characterPos: 50, // percentage from left
        movingLeft: false,
        movingRight: false
    };
    
    // Set up game area
    const gameArea = container.querySelector('.catchfood-area');
    const character = container.querySelector('.catchfood-character');
    
    // Food items
    const foodItems = ['🍎', '🍌', '🍓', '🍕', '🍔', '🍦', '🍪', '🥩'];
    
    // Start the game
    startGame();
    
    function startGame() {
        // Set timer
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            container.querySelector('.catchfood-timer').textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
        
        // Start food dropping
        gameState.foodInterval = setInterval(dropFood, 800);
        
        // Set up keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Set up touch controls for mobile
        const touchLeftButton = document.createElement('button');
        touchLeftButton.className = 'touch-control left';
        touchLeftButton.innerHTML = '←';
        
        const touchRightButton = document.createElement('button');
        touchRightButton.className = 'touch-control right';
        touchRightButton.innerHTML = '→';
        
        container.appendChild(touchLeftButton);
        container.appendChild(touchRightButton);
        
        touchLeftButton.addEventListener('touchstart', () => { gameState.movingLeft = true; });
        touchLeftButton.addEventListener('touchend', () => { gameState.movingLeft = false; });
        touchRightButton.addEventListener('touchstart', () => { gameState.movingRight = true; });
        touchRightButton.addEventListener('touchend', () => { gameState.movingRight = false; });
        
        // Animation loop for character movement
        function moveCharacter() {
            if (gameState.movingLeft && gameState.characterPos > 5) {
                gameState.characterPos -= 2;
            }
            if (gameState.movingRight && gameState.characterPos < 95) {
                gameState.characterPos += 2;
            }
            
            character.style.left = `${gameState.characterPos}%`;
            
            // Continue animation if game is still running
            if (gameState.timeLeft > 0) {
                requestAnimationFrame(moveCharacter);
            }
        }
        
        // Start the animation
        requestAnimationFrame(moveCharacter);
    }
    
    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            gameState.movingLeft = true;
        } else if (e.key === 'ArrowRight') {
            gameState.movingRight = true;
        }
    }
    
    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft') {
            gameState.movingLeft = false;
        } else if (e.key === 'ArrowRight') {
            gameState.movingRight = false;
        }
    }
    
    function dropFood() {
        const food = document.createElement('div');
        food.className = 'food-item';
        food.textContent = foodItems[Math.floor(Math.random() * foodItems.length)];
        
        // Random position
        const leftPos = Math.random() * 100;
        food.style.left = `${leftPos}%`;
        
        gameArea.appendChild(food);
        
        // Animate falling
        let topPos = 0;
        const fallInterval = setInterval(() => {
            topPos += 2;
            food.style.top = `${topPos}%`;
            
            // Check collision with character
            if (topPos >= 80 && topPos <= 100) {
                const foodLeft = leftPos;
                const characterLeft = gameState.characterPos;
                
                if (Math.abs(foodLeft - characterLeft) < 10) {
                    // Food caught
                    gameState.score++;
                    container.querySelector('.catchfood-score').textContent = gameState.score;
                    sound.play('sound-eat');
                    
                    // Add visual effect
                    food.classList.add('caught');
                    setTimeout(() => {
                        if (gameArea.contains(food)) {
                            gameArea.removeChild(food);
                        }
                    }, 300);
                    
                    clearInterval(fallInterval);
                }
            }
            
            // Remove if it passes bottom
            if (topPos > 100) {
                clearInterval(fallInterval);
                if (gameArea.contains(food)) {
                    gameArea.removeChild(food);
                }
            }
        }, 50);
    }
    
    function endGame() {
        // Clean up intervals
        clearInterval(gameState.timer);
        clearInterval(gameState.foodInterval);
        
        // Remove keyboard listeners
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        
        // Remove touch controls
        const touchControls = container.querySelectorAll('.touch-control');
        touchControls.forEach(control => control.remove());
        
        // Calculate reward based on score
        let reward;
        if (gameState.score >= 15) {
            reward = GAME_REWARDS.LARGE;
        } else if (gameState.score >= 8) {
            reward = GAME_REWARDS.MEDIUM;
        } else {
            reward = GAME_REWARDS.SMALL;
        }
        
        // Show game over message
        container.innerHTML = `
            <div class="game-completed">
                <h3>Temps écoulé!</h3>
                <p>Vous avez attrapé ${gameState.score} aliments.</p>
                <button class="game-button js-close-game">Fermer</button>
            </div>
        `;
        
        container.querySelector('.js-close-game').addEventListener('click', endMinigame);
        
        // Give reward
        giveGameReward(reward);
    }
    
    // Add game styles
    const style = document.createElement('style');
    style.textContent = `
        .catchfood-game {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        
        .game-info {
            text-align: center;
            margin-bottom: 10px;
        }
        
        .catchfood-area {
            width: 100%;
            height: 400px;
            background-color: rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            border-radius: 8px;
        }
        
        .catchfood-character {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            font-size: 2.5rem;
            transition: left 0.1s linear;
        }
        
        .food-item {
            position: absolute;
            top: 0;
            font-size: 1.5rem;
        }
        
        .food-item.caught {
            animation: catch 0.3s forwards;
        }
        
        .touch-control {
            position: absolute;
            bottom: 20px;
            width: 50px;
            height: 50px;
            background-color: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            font-size: 1.5rem;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
        }
        
        .touch-control.left {
            left: 20px;
        }
        
        .touch-control.right {
            right: 20px;
        }
        
        @keyframes catch {
            to {
                transform: scale(0);
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
};

// Helper function to shuffle an array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
