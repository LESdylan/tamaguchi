/**
 * Achievements System for Tamastudi
 * This file manages all achievement-related functionality
 */

// Achievement definitions
const ACHIEVEMENTS = [
    {
        id: 'first_steps',
        name: 'Premiers pas',
        description: 'Faire naître un Tamastudi',
        icon: '🐣',
        unlocked: false,
        condition: (tama) => tama.stage !== CONFIG.EVOLUTION_STAGES.EGG
    },
    {
        id: 'growing_up',
        name: 'Il grandit si vite',
        description: 'Faire évoluer votre Tamastudi en poussin',
        icon: '🐤',
        unlocked: false,
        condition: (tama) => tama.stage === CONFIG.EVOLUTION_STAGES.CHILD || 
                             tama.stage === CONFIG.EVOLUTION_STAGES.TEEN || 
                             tama.stage === CONFIG.EVOLUTION_STAGES.ADULT ||
                             tama.stage === CONFIG.EVOLUTION_STAGES.SPECIAL
    },
    {
        id: 'adolescence',
        name: 'Adolescence',
        description: 'Faire évoluer votre Tamastudi en caneton',
        icon: '🦆',
        unlocked: false,
        condition: (tama) => tama.stage === CONFIG.EVOLUTION_STAGES.TEEN || 
                             tama.stage === CONFIG.EVOLUTION_STAGES.ADULT ||
                             tama.stage === CONFIG.EVOLUTION_STAGES.SPECIAL
    },
    {
        id: 'adulthood',
        name: 'Âge adulte',
        description: 'Faire évoluer votre Tamastudi en forme adulte',
        icon: '🦢',
        unlocked: false,
        condition: (tama) => tama.stage === CONFIG.EVOLUTION_STAGES.ADULT ||
                             tama.stage === CONFIG.EVOLUTION_STAGES.SPECIAL
    },
    {
        id: 'final_form',
        name: 'Forme finale',
        description: 'Faire évoluer votre Tamastudi en forme spéciale',
        icon: '🦚',
        unlocked: false,
        condition: (tama) => tama.stage === CONFIG.EVOLUTION_STAGES.SPECIAL
    },
    {
        id: 'perfect_mood',
        name: 'Parfaitement heureux',
        description: 'Atteindre l\'humeur maximale',
        icon: '🥰',
        unlocked: false,
        condition: (tama) => tama.mood === CONFIG.MAX_SCORE
    },
    {
        id: 'caretaker',
        name: 'Bon gardien',
        description: 'Garder tous les indicateurs au-dessus de 3 pendant 5 minutes',
        icon: '👨‍⚕️',
        unlocked: false,
        // This one is checked by a timer in the main game logic
    },
    {
        id: 'long_life',
        name: 'Longue vie',
        description: 'Garder votre Tamastudi en vie pendant 10 minutes',
        icon: '⏱️',
        unlocked: false,
        condition: (tama) => tama.lifeDuration >= 10
    },
    {
        id: 'survival_expert',
        name: 'Expert en survie',
        description: 'Garder votre Tamastudi en vie pendant 30 minutes',
        icon: '🏆',
        unlocked: false,
        condition: (tama) => tama.lifeDuration >= 30
    },
    {
        id: 'night_owl',
        name: 'Oiseau de nuit',
        description: 'Survivre à 5 cycles jour/nuit',
        icon: '🌙',
        unlocked: false,
        // This one is managed by a counter in day/night cycle
    },
    {
        id: 'gourmet',
        name: 'Gourmet',
        description: 'Nourrir votre Tamastudi 20 fois',
        icon: '🍽️',
        unlocked: false,
        // This one requires a counter for feeding actions
    },
    {
        id: 'clean_freak',
        name: 'Maniaque de la propreté',
        description: 'Nettoyer votre Tamastudi 15 fois',
        icon: '✨',
        unlocked: false,
        // This one requires a counter for cleaning actions
    }
];

// Game statistics for achievements
const gameStats = {
    feedCount: 0,
    cleanCount: 0,
    playCount: 0,
    nightCyclesSurvived: 0,
    timeWithHighStats: 0,
    totalScore: 0
};

// Initialize achievements system
const initAchievements = () => {
    // Load saved achievements if they exist
    loadAchievements();
    
    // Populate the achievements list in the UI
    updateAchievementsUI();
    
    // Set up the event listeners
    document.querySelector('.js-show-achievements').addEventListener('click', () => {
        document.querySelector('.js-achievements-panel').classList.remove('hidden');
        sound.play('sound-click');
    });
    
    document.querySelector('.js-close-achievements').addEventListener('click', () => {
        document.querySelector('.js-achievements-panel').classList.add('hidden');
        sound.play('sound-click');
    });
};

// Check achievements against conditions
const checkAchievements = () => {
    let newUnlocks = false;
    
    ACHIEVEMENTS.forEach(achievement => {
        if (!achievement.unlocked && achievement.condition && achievement.condition(myTama)) {
            unlockAchievement(achievement.id);
            newUnlocks = true;
        }
    });
    
    // Special case achievements
    checkSpecialAchievements();
    
    // Update UI if any achievements were unlocked
    if (newUnlocks) {
        updateAchievementsUI();
        saveAchievements();
    }
};

// Check achievements with special conditions
const checkSpecialAchievements = () => {
    // Check "Gourmet" achievement
    if (!getAchievement('gourmet').unlocked && gameStats.feedCount >= 20) {
        unlockAchievement('gourmet');
    }
    
    // Check "Clean Freak" achievement
    if (!getAchievement('clean_freak').unlocked && gameStats.cleanCount >= 15) {
        unlockAchievement('clean_freak');
    }
    
    // Check "Night Owl" achievement
    if (!getAchievement('night_owl').unlocked && gameStats.nightCyclesSurvived >= 5) {
        unlockAchievement('night_owl');
    }
    
    // Check "Caretaker" achievement - needs to be managed in the game loop
};

// Record an action for statistics
const recordAction = (action) => {
    switch(action) {
        case 'eat':
            gameStats.feedCount++;
            break;
        case 'clean':
            gameStats.cleanCount++;
            break;
        case 'play':
            gameStats.playCount++;
            break;
    }
    
    // Check if any achievements were unlocked by this action
    checkAchievements();
};

// Record a night cycle survived
const recordNightCycle = () => {
    gameStats.nightCyclesSurvived++;
    checkAchievements();
};

// Calculate the total score based on achievements and stats
const calculateScore = () => {
    // Base score is the life duration multiplied by evolution stage
    let evolutionMultiplier = 1;
    
    switch(myTama.stage) {
        case CONFIG.EVOLUTION_STAGES.BABY:
            evolutionMultiplier = 1;
            break;
        case CONFIG.EVOLUTION_STAGES.CHILD:
            evolutionMultiplier = 2;
            break;
        case CONFIG.EVOLUTION_STAGES.TEEN:
            evolutionMultiplier = 3;
            break;
        case CONFIG.EVOLUTION_STAGES.ADULT:
            evolutionMultiplier = 4;
            break;
        case CONFIG.EVOLUTION_STAGES.SPECIAL:
            evolutionMultiplier = 5;
            break;
    }
    
    // Basic score calculation
    let score = myTama.lifeDuration * evolutionMultiplier;
    
    // Bonus for achievements
    score += getUnlockedAchievementsCount() * 10;
    
    // Bonus for perfect mood times
    score += myTama.evolutionPoints * 5;
    
    gameStats.totalScore = Math.round(score);
    
    // Update the score display
    if (document.querySelector('.js-score')) {
        document.querySelector('.js-score').textContent = gameStats.totalScore;
    }
    
    if (document.querySelector('.js-final-score')) {
        document.querySelector('.js-final-score').textContent = gameStats.totalScore;
    }
    
    return gameStats.totalScore;
};

// Unlock an achievement
const unlockAchievement = (achievementId) => {
    const achievement = getAchievement(achievementId);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        
        // Play sound and show notification
        sound.play('sound-achievement');
        showAchievementNotification(achievement);
        
        // Update counters and UI
        updateAchievementsCount();
        
        // Calculate new score
        calculateScore();
    }
};

// Get an achievement by ID
const getAchievement = (achievementId) => {
    return ACHIEVEMENTS.find(a => a.id === achievementId);
};

// Count unlocked achievements
const getUnlockedAchievementsCount = () => {
    return ACHIEVEMENTS.filter(a => a.unlocked).length;
};

// Update the achievements counter in the UI
const updateAchievementsCount = () => {
    const count = getUnlockedAchievementsCount();
    const total = ACHIEVEMENTS.length;
    document.querySelector('.js-achievements-count').textContent = `${count}/${total}`;
};

// Show a notification when an achievement is unlocked
const showAchievementNotification = (achievement) => {
    // Show the notification
    showNotification(`🏆 Succès débloqué: ${achievement.name}`, false, '🏆');
    
    // Also show on game over screen if it's visible
    if (!document.querySelector('.js-game-over').classList.contains('hidden')) {
        const achievementDisplay = document.querySelector('.js-achievement-display');
        const achievementName = document.querySelector('.js-achievement-name');
        
        achievementName.textContent = achievement.name;
        achievementDisplay.classList.remove('hidden');
        
        // Add a close button handler
        const closeBtn = document.querySelector('.achievement-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                achievementDisplay.classList.add('hidden');
            });
        }
        
        // Auto-hide achievement after 5 seconds
        setTimeout(() => {
            achievementDisplay.classList.add('hidden');
        }, 5000);
    }
};

// Update the achievements UI in the side panel
const updateAchievementsUI = () => {
    const achievementsList = document.querySelector('.js-achievements-list');
    achievementsList.innerHTML = '';
    
    ACHIEVEMENTS.forEach(achievement => {
        const achievementItem = document.createElement('li');
        achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        achievementItem.innerHTML = `
            <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        achievementsList.appendChild(achievementItem);
    });
    
    updateAchievementsCount();
};

// Save achievements to localStorage
const saveAchievements = () => {
    const saveData = {
        achievements: ACHIEVEMENTS.map(a => ({
            id: a.id,
            unlocked: a.unlocked
        })),
        stats: gameStats
    };
    
    localStorage.setItem('tamastudi_achievements', JSON.stringify(saveData));
};

// Load achievements from localStorage
const loadAchievements = () => {
    const savedData = localStorage.getItem('tamastudi_achievements');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restore achievement unlocks
        if (data.achievements) {
            data.achievements.forEach(savedAchievement => {
                const achievement = getAchievement(savedAchievement.id);
                if (achievement) {
                    achievement.unlocked = savedAchievement.unlocked;
                }
            });
        }
        
        // Restore game stats
        if (data.stats) {
            Object.assign(gameStats, data.stats);
        }
    }
};

// Reset achievements (for new game)
const resetAchievements = () => {
    // Hide any visible achievement notifications
    const achievementDisplay = document.querySelector('.js-achievement-display');
    if (achievementDisplay) {
        achievementDisplay.classList.add('hidden');
    }
    
    // Reset unlocked status
    ACHIEVEMENTS.forEach(achievement => {
        achievement.unlocked = false;
    });
    
    // Reset game stats
    gameStats.feedCount = 0;
    gameStats.cleanCount = 0;
    gameStats.playCount = 0;
    gameStats.nightCyclesSurvived = 0;
    gameStats.timeWithHighStats = 0;
    gameStats.totalScore = 0;
    
    // Update UI
    updateAchievementsUI();
    calculateScore();
    
    // Clear local storage
    localStorage.removeItem('tamastudi_achievements');
};

// Enhance the existing manageIndicators function to record actions
const originalManageIndicators = manageIndicators;
manageIndicators = function(desire, hasSucceeded) {
    originalManageIndicators(desire, hasSucceeded);
    
    if (hasSucceeded) {
        const action = translateEmoji(desire);
        if (action) {
            recordAction(action);
        }
    }
};
