/* 
États de notre Tamastudi possibles :
- 🥚 : partie non lancée
- 🐣 : naissance pendant tant qu'il n'a pas fait son 1er caca
Ensuite il devient un "grand" avec une humeur variable
- 😢 : triste 0/5
- 🙁 : pas content 1/5
- 🙂 : normal 2/5
- 😄 : content 3/5
- 🤗 : heureux 4/5
- 🥰 : très heureux 5/5
- 👻 : mort 0/5
Ses envies :
- 😋 : faim, aléatoire minimum 30 sec et max 3 minutes
- 🥱 : jouer, aléatoire minimum 30 sec et max 3 minutes
- 💩 : caca, aléatoire minimum 30 sec et max 1.30 minutes uniquement après avoir mangé
*/

// Configuration
const CONFIG = {
  DEFAULT_SCORE: 3,
  MAX_SCORE: 5,
  MIN_SCORE: 0,
  ACTION_TIMEOUT: 5000,
  DESIRE_MIN_INTERVAL: 10000,
  DESIRE_MAX_INTERVAL: 30000,
  DAY_DURATION: 60000,
  EVOLUTION_STAGES: {
    EGG: '🥚',
    BABY: '🐣',
    CHILD: '🐤',
    TEEN: '🦆',
    ADULT: '🦢',
    SPECIAL: '🦚'
  },
  MOODS: ['😢', '🙁', '🙂', '😄', '🤗', '🥰'],
  NEEDS: {
    EAT: '😋',
    PLAY: '🥱',
    CLEAN: '💩'
  }
};

// Sound control
const sound = {
  enabled: true,
  play: function(id) {
    if (!this.enabled) return;
    const audio = document.getElementById(id);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error('Error playing sound:', e));
    }
  },
  toggle: function() {
    this.enabled = !this.enabled;
    showNotification(this.enabled ? 'Sons activés' : 'Sons désactivés');
  }
};

// Game state
const myTama = {
  name: "",
  alive: false,
  stage: CONFIG.EVOLUTION_STAGES.EGG,
  fed: CONFIG.DEFAULT_SCORE,
  playfull: CONFIG.DEFAULT_SCORE,
  cleaned: CONFIG.DEFAULT_SCORE,
  lifeDuration: 0,
  desire: "",
  evolutionPoints: 0,
  sleeping: false,
  mood: CONFIG.DEFAULT_SCORE
};

// Game timers
let timeoutWaitForAction = null;
let intervalLifeDuration = null;
let dayNightCycleInterval = null;

// UI Elements
const elements = {
  character: document.querySelector('.js-character'),
  desire: document.querySelector('.js-desire'),
  vitals: document.querySelector('.js-vitals'),
  actions: document.querySelector('.js-actions'),
  buttons: {
    buttonCenter: document.querySelector('.js-button[data-direction="center"]'),
    actionButtons: document.querySelectorAll('.js-button-action'),
    startButton: document.querySelector('.js-start-button'),
    restartButton: document.querySelector('.js-restart-button'),
    saveGameButton: document.querySelector('.js-save-game'),
    loadGameButton: document.querySelector('.js-load-game'),
    toggleModeButton: document.querySelector('.js-toggle-mode')
  },
  displays: {
    nameDisplay: document.querySelector('.js-tamaName'),
    nameGameOverDisplay: document.querySelector('.js-tamaName-gameover'),
    lifeDurationDisplay: document.querySelector('.js-life-duration'),
    lifeDurationGameOverDisplay: document.querySelector('.js-life-duration-gameover'),
    moodDisplay: document.querySelector('.js-mood'),
    eatScoreDisplay: document.querySelector('.js-score--eat'),
    playScoreDisplay: document.querySelector('.js-score--play'),
    cleanScoreDisplay: document.querySelector('.js-score--clean'),
    timeIndicator: document.querySelector('.js-time-indicator'),
    effects: document.querySelector('.js-effects')
  },
  screens: {
    startScreen: document.querySelector('.js-start-screen'),
    gameOverScreen: document.querySelector('.js-game-over')
  },
  progress: {
    eatProgress: document.querySelector('.js-progress--eat'),
    playProgress: document.querySelector('.js-progress--play'),
    cleanProgress: document.querySelector('.js-progress--clean'),
    moodProgress: document.querySelector('.js-progress--mood')
  }
};

// Initialize the game
const initGame = () => {
  // Show start screen
  elements.screens.startScreen.classList.remove('hidden');
  
  // Add event listeners
  elements.buttons.startButton.addEventListener('click', () => {
    elements.screens.startScreen.classList.add('hidden');
    sound.play('sound-click');
    start();
  });
  
  elements.buttons.restartButton.addEventListener('click', () => {
    elements.screens.gameOverScreen.classList.add('hidden');
    sound.play('sound-click');
    resetGame();
    start();
  });
  
  document.querySelector('.js-sound-toggle').addEventListener('change', (e) => {
    sound.enabled = e.target.checked;
  });
  
  elements.buttons.saveGameButton.addEventListener('click', () => {
    saveGame();
    sound.play('sound-click');
  });
  
  elements.buttons.loadGameButton.addEventListener('click', () => {
    loadGame();
    sound.play('sound-click');
  });
  
  elements.buttons.toggleModeButton.addEventListener('click', toggleDayNightMode);
  
  // Add direct event listener for restart button in addition to the one in elements
  const restartButton = document.querySelector('.js-restart-button');
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      elements.screens.gameOverScreen.classList.add('hidden');
      sound.play('sound-click');
      resetGame();
      start();
    });
  }
  
  // Initialize day/night cycle
  initDayNightCycle();
};

/* PHASE 0 : activer le tamastudi */
const start = () => {
  console.log('Starting game...');
  
  let count = 0;
  
  // First remove any existing click listeners on the center button to prevent duplicates
  const centerButton = elements.buttons.buttonCenter;
  const newCenterButton = centerButton.cloneNode(true);
  centerButton.parentNode.replaceChild(newCenterButton, centerButton);
  elements.buttons.buttonCenter = newCenterButton;
  
  // Ensure the game over screen is hidden
  elements.screens.gameOverScreen.classList.add('hidden');
  
  elements.buttons.buttonCenter.addEventListener("click", () => {
    sound.play('sound-click');
    count++;
    addClickEffect(elements.buttons.buttonCenter);
    
    // Visual feedback for each click
    elements.character.classList.add('bounce');
    setTimeout(() => {
      elements.character.classList.remove('bounce');
    }, 500);
    
    if (count === 5) {
      birth();
    } else {
      showNotification(`Encore ${5-count} clics pour faire éclore l'oeuf!`);
    }
  });
  
  // Check if there's a saved game
  if (localStorage.getItem('tamastudi_save')) {
    showNotification('Jeu sauvegardé disponible! Cliquez sur "Charger"');
  }
};

/* PHASE 1 : la naissance de mon tama */
const birth = () => {
  sound.play('sound-birth');
  
  // Demander le prénom
  myTama.name = prompt("Quel nom a votre tamastudi ?") || "Tamastudi";
  
  // Animation de naissance
  elements.character.classList.add('shake');
  setTimeout(() => {
    elements.character.classList.remove('shake');
    
    // Fait éclore mon oeuf pour passer au poussin
    showInScreen(CONFIG.EVOLUTION_STAGES.BABY);
    myTama.stage = CONFIG.EVOLUTION_STAGES.BABY;
    
    // Affiche mes vitals
    elements.vitals.classList.remove("hidden");
    
    // Affiche le nom de mon tama dans les vitals
    elements.displays.nameDisplay.textContent = myTama.name;
    
    // Mettre les scores des vitals à 3
    myTama.fed = CONFIG.DEFAULT_SCORE;
    myTama.playfull = CONFIG.DEFAULT_SCORE;
    myTama.cleaned = CONFIG.DEFAULT_SCORE;
    updateVitals();
    
    // Afficher les actions
    elements.actions.classList.remove("hidden");
    
    // Appel de la fonction pour le faire "grandir"
    evolve();
    
    // Calcule de la durée de vie
    myTama.alive = true;
    calcLifeDuration();
    
    showNotification(`${myTama.name} est né! Prenez soin de lui.`);
  }, 1000);
};

/* PHASE 2 : l'évolution de mon tama */
const evolve = () => {
  const functionToExecute = (desire) => {
    mood();
    cycleOfAdultLife(desire);
  };
  wantsTo(functionToExecute);
};

/* GESTION DES ENVIES */
const wantsTo = (callback) => {
  if (!myTama.alive) return;
  
  const needs = [CONFIG.NEEDS.EAT, CONFIG.NEEDS.PLAY, CONFIG.NEEDS.CLEAN];
  const duration = getRandomInt({
    min: CONFIG.DESIRE_MIN_INTERVAL,
    max: CONFIG.DESIRE_MAX_INTERVAL,
  });
  
  setTimeout(() => {
    if (!myTama.alive) return;
    
    const randomIndexNeeds = getRandomInt({
      max: needs.length,
    });
    const desire = needs[randomIndexNeeds];
    
    // Skip desires if sleeping
    if (myTama.sleeping) {
      wantsTo(callback);
      return;
    }
    
    if (callback) {
      callback(desire);
    } else {
      showInScreen(desire, true);
    }
  }, duration);
};

/* HUMEUR GÉNÉRALE */
const mood = () => {
  if (!myTama.alive) return;
  
  // Partie 1 : calcul de l'humeur
  const sum = myTama.fed + myTama.playfull + myTama.cleaned;
  const average = sum / 3;
  const rounded = Math.round(average);
  myTama.mood = rounded;
  
  // Mise à jour de l'affichage
  elements.displays.moodDisplay.textContent = rounded;
  elements.progress.moodProgress.style.width = `${(rounded / CONFIG.MAX_SCORE) * 100}%`;
  
  // Affichage visuel de l'humeur
  showInScreen(CONFIG.MOODS[rounded]);
  
  // Vérifier la mort
  if (rounded === 0) {
    die();
  }
  
  // Vérifier l'évolution
  checkEvolution();
};

/* EVOLUTION STAGES */
const checkEvolution = () => {
  // Chaque fois que l'humeur est au maximum, on gagne un point d'évolution
  if (myTama.mood === CONFIG.MAX_SCORE) {
    myTama.evolutionPoints++;
    
    // Vérification des étapes d'évolution
    if (myTama.evolutionPoints === 5 && myTama.stage === CONFIG.EVOLUTION_STAGES.BABY) {
      myTama.stage = CONFIG.EVOLUTION_STAGES.CHILD;
      showInScreen(CONFIG.EVOLUTION_STAGES.CHILD);
      showNotification(`${myTama.name} a évolué en poussin!`, true);
      elements.character.classList.add('spin');
      sound.play('sound-birth');
      setTimeout(() => elements.character.classList.remove('spin'), 500);
    } 
    else if (myTama.evolutionPoints === 10 && myTama.stage === CONFIG.EVOLUTION_STAGES.CHILD) {
      myTama.stage = CONFIG.EVOLUTION_STAGES.TEEN;
      showInScreen(CONFIG.EVOLUTION_STAGES.TEEN);
      showNotification(`${myTama.name} a évolué en caneton!`, true);
      elements.character.classList.add('spin');
      sound.play('sound-birth');
      setTimeout(() => elements.character.classList.remove('spin'), 500);
    }
    else if (myTama.evolutionPoints === 15 && myTama.stage === CONFIG.EVOLUTION_STAGES.TEEN) {
      myTama.stage = CONFIG.EVOLUTION_STAGES.ADULT;
      showInScreen(CONFIG.EVOLUTION_STAGES.ADULT);
      showNotification(`${myTama.name} a atteint sa forme adulte!`, true);
      elements.character.classList.add('spin');
      sound.play('sound-birth');
      setTimeout(() => elements.character.classList.remove('spin'), 500);
    }
    else if (myTama.evolutionPoints === 25 && myTama.stage === CONFIG.EVOLUTION_STAGES.ADULT) {
      myTama.stage = CONFIG.EVOLUTION_STAGES.SPECIAL;
      showInScreen(CONFIG.EVOLUTION_STAGES.SPECIAL);
      showNotification(`${myTama.name} a évolué en forme spéciale!`, true);
      elements.character.classList.add('spin');
      sound.play('sound-birth');
      setTimeout(() => elements.character.classList.remove('spin'), 500);
    }
  }
};

/* DURÉE DE VIE */
const calcLifeDuration = () => {
  const duration = 60_000; // 60 secondes
  
  // Arrêter l'intervalle précédent si existant
  if (intervalLifeDuration) {
    clearInterval(intervalLifeDuration);
  }
  
  intervalLifeDuration = setInterval(() => {
    if (!myTama.alive) {
      clearInterval(intervalLifeDuration);
      return;
    }
    
    myTama.lifeDuration++;
    elements.displays.lifeDurationDisplay.textContent = myTama.lifeDuration;
    
    // Réduire aléatoirement un indicateur toutes les minutes
    reduceRandomIndicator();
  }, duration);
};

/* GESTION DE VIE "ADULTE" */
const cycleOfAdultLife = (desire) => {
  if (myTama.alive) {
    showInScreen(desire, true);
    myTama.desire = desire;
    waitForAction();
  } else {
    showInScreen("👻");
  }
};

const waitForAction = () => {
  // Clear any existing timeout
  if (timeoutWaitForAction) {
    clearTimeout(timeoutWaitForAction);
  }
  
  timeoutWaitForAction = setTimeout(() => {
    manageIndicators(myTama.desire, false);
    showInScreen("", true);
    showNotification(`${myTama.name} n'a pas reçu ce qu'il voulait...`, true);
    myTama.desire = "";
    wantsTo((desire) => {
      mood();
      cycleOfAdultLife(desire);
    });
  }, CONFIG.ACTION_TIMEOUT);
};

/* GESTION DES ACTIONS */
elements.buttons.actionButtons.forEach(button => {
  button.addEventListener('click', () => {
    sound.play('sound-click');
    
    if (!myTama.alive || myTama.sleeping) return;
    
    const associateDesire = button.getAttribute('data-desire');
    
    if (associateDesire === 'pet') {
      // Action spéciale: caresser le Tamastudi
      petTamastudi();
      return;
    }
    
    const tamaDesireString = translateEmoji(myTama.desire);
    const isGoodButton = tamaDesireString === associateDesire;
    
    if (isGoodButton) {
      // Animation de l'action
      elements.character.classList.add('bounce');
      setTimeout(() => elements.character.classList.remove('bounce'), 500);
      
      // Son correspondant à l'action
      sound.play(`sound-${associateDesire}`);
      
      // Effet visuel
      addActionEffect(associateDesire);
      
      // Gestion des indicateurs
      clearTimeout(timeoutWaitForAction);
      manageIndicators(myTama.desire, true);
      showNotification(`${myTama.name} est ${associateDesire === 'eat' ? 'rassasié' : associateDesire === 'play' ? 'heureux de jouer' : 'propre'} !`);
      
      // Continuer le cycle
      myTama.desire = "";
      wantsTo((desire) => {
        mood();
        cycleOfAdultLife(desire);
      });
    } else if (myTama.desire) {
      // Mauvaise action
      showNotification("Ce n'est pas ce que votre Tamastudi veut!", true);
      sound.play('sound-error');
      elements.character.classList.add('shake');
      setTimeout(() => elements.character.classList.remove('shake'), 500);
    }
  });
});

/* ACTION SPÉCIALE: CARESSER */
const petTamastudi = () => {
  if (!myTama.alive || myTama.sleeping) return;
  
  sound.play('sound-pet');
  elements.character.classList.add('bounce');
  showNotification(`${myTama.name} adore vos caresses!`);
  
  // Légère augmentation de l'humeur
  if (myTama.playfull < CONFIG.MAX_SCORE) {
    myTama.playfull += 0.5;
    if (myTama.playfull > CONFIG.MAX_SCORE) myTama.playfull = CONFIG.MAX_SCORE;
    updateVitals();
    mood();
  }
  
  addActionEffect('pet');
  
  setTimeout(() => elements.character.classList.remove('bounce'), 500);
};

/* GESTION DES INDICATEURS */
const manageIndicators = (desire, hasSucceeded) => {
  const numberToAdd = hasSucceeded ? 1 : -1;
  const calculName = hasSucceeded ? 'addition' : 'substraction';
  
  if (desire === CONFIG.NEEDS.EAT && verifyIndicatorBeforeCalcul(myTama.fed, calculName)) {
    myTama.fed += numberToAdd;
  } 
  else if (desire === CONFIG.NEEDS.PLAY && verifyIndicatorBeforeCalcul(myTama.playfull, calculName)) {
    myTama.playfull += numberToAdd;
  } 
  else if (desire === CONFIG.NEEDS.CLEAN && verifyIndicatorBeforeCalcul(myTama.cleaned, calculName)) {
    myTama.cleaned += numberToAdd;
  }
  
  updateVitals();
  mood();
  
  if (hasSucceeded) {
    showInScreen("", true);
  }
};

const reduceRandomIndicator = () => {
  if (!myTama.alive || myTama.sleeping) return;
  
  const indicators = ['fed', 'playfull', 'cleaned'];
  const randomIndex = getRandomInt({ max: indicators.length });
  const indicator = indicators[randomIndex];
  
  if (myTama[indicator] > CONFIG.MIN_SCORE) {
    myTama[indicator] -= 0.5;
    updateVitals();
    mood();
    showNotification(`${myTama.name} a besoin de votre attention!`);
  }
};

const verifyIndicatorBeforeCalcul = (value, calcul) => {
  if (calcul === 'addition') {
    return value < CONFIG.MAX_SCORE;
  }
  else {
    return value > CONFIG.MIN_SCORE;
  }
};

const updateVitals = () => {
  // Mise à jour des valeurs
  elements.displays.eatScoreDisplay.textContent = Math.floor(myTama.fed);
  elements.displays.playScoreDisplay.textContent = Math.floor(myTama.playfull);
  elements.displays.cleanScoreDisplay.textContent = Math.floor(myTama.cleaned);
  
  // Mise à jour des barres de progression
  elements.progress.eatProgress.style.width = `${(myTama.fed / CONFIG.MAX_SCORE) * 100}%`;
  elements.progress.playProgress.style.width = `${(myTama.playfull / CONFIG.MAX_SCORE) * 100}%`;
  elements.progress.cleanProgress.style.width = `${(myTama.cleaned / CONFIG.MAX_SCORE) * 100}%`;
};

/* GESTION JOUR/NUIT */
const initDayNightCycle = () => {
  let isDay = true;
  
  const toggleDayNight = () => {
    if (!myTama.alive) return;
    
    isDay = !isDay;
    document.querySelector('.tamastudi__screen').classList.toggle('night', !isDay);
    elements.displays.timeIndicator.textContent = isDay ? '☀️ Jour' : '🌙 Nuit';
    
    // Pendant la nuit, le Tamastudi dort
    if (!isDay) {
      myTama.sleeping = true;
      if (myTama.desire) {
        clearTimeout(timeoutWaitForAction);
        showInScreen("", true);
      }
      showInScreen("😴");
      showNotification(`${myTama.name} s'est endormi...`);
    } else {
      myTama.sleeping = false;
      mood();
      showNotification(`${myTama.name} s'est réveillé!`);
      
      // Restaure un peu d'énergie au réveil
      const smallBoost = 0.5;
      if (myTama.fed < CONFIG.MAX_SCORE) myTama.fed += smallBoost;
      if (myTama.fed > CONFIG.MAX_SCORE) myTama.fed = CONFIG.MAX_SCORE;
      
      if (myTama.playfull < CONFIG.MAX_SCORE) myTama.playfull += smallBoost;
      if (myTama.playfull > CONFIG.MAX_SCORE) myTama.playfull = CONFIG.MAX_SCORE;
      
      updateVitals();
      
      // Relance le cycle des envies
      wantsTo((desire) => {
        mood();
        cycleOfAdultLife(desire);
      });
    }
  };
  
  // Changer jour/nuit toutes les minutes (pour la démo, normalement plus long)
  dayNightCycleInterval = setInterval(toggleDayNight, CONFIG.DAY_DURATION);
};

const toggleDayNightMode = () => {
  document.body.classList.toggle('night-mode');
  const button = elements.buttons.toggleModeButton;
  button.textContent = document.body.classList.contains('night-mode') ? '🌙' : '☀️';
  sound.play('sound-click');
  showNotification(document.body.classList.contains('night-mode') ? 'Mode nuit activé' : 'Mode jour activé');
};

/* MORT */
const die = () => {
  console.log('Game over triggered');
  
  if (!myTama.alive) {
    console.log('Tama already dead, preventing double game over');
    return; // Prevent multiple calls
  }
  
  myTama.alive = false;
  showInScreen("👻");
  sound.play('sound-death');
  
  // Clear all intervals to prevent further state changes
  clearTimeout(timeoutWaitForAction);
  clearInterval(intervalLifeDuration);
  clearInterval(dayNightCycleInterval);
  
  // Hide any achievement displays that might be visible
  const achievementDisplay = document.querySelector('.js-achievement-display');
  if (achievementDisplay) {
    achievementDisplay.classList.add('hidden');
  }
  
  // Set the final information
  elements.displays.nameGameOverDisplay.textContent = myTama.name;
  elements.displays.lifeDurationGameOverDisplay.textContent = myTama.lifeDuration;
  
  // Calculate final score and update display
  const finalScore = calculateScore ? calculateScore() : myTama.lifeDuration;
  const finalStage = getStageName(myTama.stage);
  
  // Update final score and stage
  const finalScoreElement = document.querySelector('.js-final-score');
  const finalStageElement = document.querySelector('.js-final-stage');
  if (finalScoreElement) finalScoreElement.textContent = finalScore;
  if (finalStageElement) finalStageElement.textContent = finalStage;
  
  // Set up fresh event listeners for game over buttons before showing the screen
  setupGameOverButtons();
  
  // Ensure the game over screen is visible (after buttons are set up)
  elements.screens.gameOverScreen.classList.remove('hidden');
  
  showNotification(`${myTama.name} n'est plus parmi nous... 👻`, true);
};

// Function to set up game over buttons with direct force reset
const setupGameOverButtons = () => {
  console.log('Setting up game over buttons');
  
  // Handle Restart button
  const restartButton = document.getElementById('restart-button');
  if (restartButton) {
    // Remove existing event listeners to avoid duplicates
    const newRestartButton = restartButton.cloneNode(true);
    restartButton.parentNode.replaceChild(newRestartButton, restartButton);
    
    newRestartButton.addEventListener('click', function(event) {
      console.log('Restart button clicked in setupGameOverButtons');
      event.stopPropagation();
      
      // Hide game over screen
      elements.screens.gameOverScreen.classList.add('hidden');
      
      // Play sound
      sound.play('sound-click');
      
      // Hard reset: use window.location.reload() instead of soft reset
      window.location.reload();
    });
  } else {
    console.warn('Restart button not found in setupGameOverButtons');
  }
  
  // Similar approach for Share button
  const shareButton = document.getElementById('share-button');
  if (shareButton) {
    const newShareButton = shareButton.cloneNode(true);
    shareButton.parentNode.replaceChild(newShareButton, shareButton);
    
    newShareButton.addEventListener('click', function(event) {
      event.stopPropagation();
      console.log('Share button clicked');
      
      // Implement share functionality
      shareScore();
      sound.play('sound-click');
    });
  } else {
    console.warn('Share button not found');
  }
};

/* RESET GAME */
const resetGame = () => {
  console.log('Resetting game...');
  
  // Reset all timers
  clearTimeout(timeoutWaitForAction);
  clearInterval(intervalLifeDuration);
  clearInterval(dayNightCycleInterval);  // Also clear day/night cycle
  
  // Reset Tama state
  myTama.name = "";
  myTama.alive = false;  // We'll set this to true when the egg hatches
  myTama.stage = CONFIG.EVOLUTION_STAGES.EGG;
  myTama.fed = CONFIG.DEFAULT_SCORE;
  myTama.playfull = CONFIG.DEFAULT_SCORE;
  myTama.cleaned = CONFIG.DEFAULT_SCORE;
  myTama.lifeDuration = 0;
  myTama.desire = "";
  myTama.evolutionPoints = 0;
  myTama.sleeping = false;
  myTama.mood = CONFIG.DEFAULT_SCORE;
  
  // Make sure all overlays are hidden, especially game over
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.classList.add('hidden');
  });
  
  // Hide achievement displays
  const achievementDisplay = document.querySelector('.js-achievement-display');
  if (achievementDisplay) {
    achievementDisplay.classList.add('hidden');
  }
  
  // Reset UI
  showInScreen(CONFIG.EVOLUTION_STAGES.EGG);
  showInScreen("", true);
  elements.vitals.classList.add("hidden");
  elements.actions.classList.add("hidden");
  
  // Remove all effects
  elements.displays.effects.innerHTML = '';
  
  // Reset any UI elements that might be displaying old values
  updateVitals();
  
  // Reset achievements if the function exists
  if (typeof resetAchievements === 'function') {
    resetAchievements();
  }
  
  // Re-initialize day/night cycle (but don't start it until birth)
  initDayNightCycle();
  
  console.log('Game reset complete, myTama state:', {...myTama});
};

/* SAUVEGARDE ET CHARGEMENT */
const saveGame = () => {
  if (!myTama.alive) {
    showNotification("Impossible de sauvegarder un Tamastudi mort!", true);
    return;
  }
  
  const gameData = JSON.stringify(myTama);
  localStorage.setItem('tamastudi_save', gameData);
  showNotification("Jeu sauvegardé avec succès!");
};

const loadGame = () => {
  const savedGame = localStorage.getItem('tamastudi_save');
  if (savedGame) {
    const gameData = JSON.parse(savedGame);
    Object.assign(myTama, gameData);
    
    // Mise à jour de l'interface
    showInScreen(myTama.stage);
    elements.displays.nameDisplay.textContent = myTama.name;
    updateVitals();
    mood();
    
    // Affiche les éléments nécessaires
    elements.vitals.classList.remove("hidden");
    elements.actions.classList.remove("hidden");
    
    // Relance le calcul de durée de vie
    calcLifeDuration();
    
    // Relance le cycle des envies
    wantsTo((desire) => {
      mood();
      cycleOfAdultLife(desire);
    });
    
    showNotification(`${myTama.name} a été chargé avec succès!`);
  } else {
    showNotification("Aucune sauvegarde trouvée!", true);
  }
};

/* HELPERS */
const translateEmoji = (emoji) => {
  let word = '';
  if (emoji === CONFIG.NEEDS.EAT) word = 'eat';
  else if (emoji === CONFIG.NEEDS.PLAY) word = 'play';
  else if (emoji === CONFIG.NEEDS.CLEAN) word = 'clean';
  return word;
};

const getRandomInt = (props) => {
  const max = props.max;
  const min = props.min ? props.min : 0;
  return Math.floor(Math.random() * (max - min) + min);
};

const showInScreen = (display, isDesire) => {
  if(isDesire) {
    elements.desire.textContent = display;
  } else {
    if (display === CONFIG.EVOLUTION_STAGES.EGG) {
      // Use the CSS egg
      elements.character.innerHTML = `
        <div class="egg-character">
          <div class="egg-top"></div>
          <div class="egg-bottom"></div>
        </div>
      `;
    } else {
      // Just show the emoji for other stages
      elements.character.innerHTML = display;
    }
  }
};

const showNotification = (message, isError = false) => {
  const notification = document.querySelector('.js-notification');
  const notificationText = notification.querySelector('.notification__text');
  
  // Set message and style
  notificationText.textContent = message;
  notification.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)';
  
  // Show notification
  notification.classList.remove('hidden');
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
};

/* VISUAL EFFECTS */
const addActionEffect = (action) => {
  let emoji = '';
  
  switch(action) {
    case 'eat':
      emoji = '🍖';
      break;
    case 'play':
      emoji = '🎮';
      break;
    case 'clean':
      emoji = '✨';
      break;
    case 'pet':
      emoji = '❤️';
      break;
    default:
      return;
  }
  
  // Create and animate particle effects
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.textContent = emoji;
    particle.style.position = 'absolute';
    particle.style.fontSize = '1.5rem';
    particle.style.opacity = '1';
    particle.style.zIndex = '5';
    
    // Random position around character
    const centerX = 50;
    const centerY = 50;
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;
    
    // Animate
    particle.style.animation = `float 1s ease-out, fadeOut 1s ease-out`;
    particle.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * -30 - 10}px)`;
    
    elements.displays.effects.appendChild(particle);
    
    // Remove after animation
    setTimeout(() => {
      if (elements.displays.effects.contains(particle)) {
        elements.displays.effects.removeChild(particle);
      }
    }, 1000);
  }
};

const addClickEffect = (element) => {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('div');
  ripple.style.position = 'absolute';
  ripple.style.width = '20px';
  ripple.style.height = '20px';
  ripple.style.background = 'rgba(255, 255, 255, 0.7)';
  ripple.style.borderRadius = '50%';
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.animation = 'fadeOut 0.5s ease-out';
  
  // Position at click location
  ripple.style.left = `${rect.width / 2}px`;
  ripple.style.top = `${rect.height / 2}px`;
  
  // Add to element
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  // Remove after animation
  setTimeout(() => {
    if (element.contains(ripple)) {
      element.removeChild(ripple);
    }
  }, 500);
};

// At the start of the script, add this function to ensure all event listeners are properly set up
document.addEventListener('DOMContentLoaded', function() {
  // Make sure our restart button has the direct listener
  const restartButton = document.getElementById('restart-button');
  if (restartButton) {
    restartButton.addEventListener('click', function(event) {
      event.stopPropagation();
      elements.screens.gameOverScreen.classList.add('hidden');
      sound.play('sound-click');
      resetGame();
      start();
    });
  }
  
  // Handle achievement close buttons
  const achievementCloseButtons = document.querySelectorAll('.achievement-close');
  achievementCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const achievementDisplay = this.closest('.js-achievement-display');
      if (achievementDisplay) {
        achievementDisplay.classList.add('hidden');
      }
    });
  });
  
  // Set up game over buttons when the page loads
  setupGameOverButtons();
});

// Start with the egg design
window.addEventListener('DOMContentLoaded', () => {
  showInScreen(CONFIG.EVOLUTION_STAGES.EGG);
});

// Start the game
initGame();
