/**
 * Memory Game for Tamastudi
 * Simple but fully functional memory matching game
 */

class MemoryGame {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      pairs: 6,
      symbols: ['🐶', '🐱', '🐰', '🐼', '🦊', '🐵', '🐮', '🐷', '🦁', '🐸', '🐢', '🦉'],
      onComplete: null,
      onMatch: null
    }, options);
    
    this.state = {
      cards: [],
      flippedCards: [],
      matchedPairs: 0,
      tries: 0,
      totalPairs: this.options.pairs,
      canFlip: true
    };
    
    this.init();
  }
  
  init() {
    // Setup game UI
    this.container.innerHTML = `
      <div class="memory-game">
        <div class="game-info">
          <p>Trouvez toutes les paires!</p>
          <div class="memory-stats">
            <div>Essais: <span class="memory-tries">0</span></div>
            <div>Paires: <span class="memory-pairs">0</span>/${this.state.totalPairs}</div>
          </div>
        </div>
        <div class="memory-grid"></div>
      </div>
      <style>
        .memory-game {
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
        
        .memory-stats {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-top: 10px;
          font-weight: bold;
        }
        
        .memory-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          width: 100%;
          max-width: 500px;
        }
        
        .memory-card {
          aspect-ratio: 1/1;
          perspective: 1000px;
          cursor: pointer;
        }
        
        .memory-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .memory-card.flipped .memory-card-inner {
          transform: rotateY(180deg);
        }
        
        .memory-card-front, .memory-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 2rem;
        }
        
        .memory-card-front {
          background-color: #3a86ff;
          color: white;
        }
        
        .memory-card-back {
          background-color: #ffbe0b;
          transform: rotateY(180deg);
        }
        
        .memory-card.matched .memory-card-back {
          background-color: #8338ec;
          animation: pulse 1s infinite;
        }
        
        .game-completed {
          text-align: center;
          padding: 20px;
        }
        
        .game-button {
          background-color: #3a86ff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 20px;
        }
        
        .game-button:hover {
          background-color: #2a76ef;
        }
      </style>
    `;
    
    // Generate the cards
    this.generateCards();
    
    // Set up the grid
    this.renderCards();
  }
  
  generateCards() {
    // Select symbols and create pairs
    const symbols = [...this.options.symbols];
    let selectedSymbols = [];
    
    // Randomly select symbols for the game
    for (let i = 0; i < this.state.totalPairs; i++) {
      const randomIndex = Math.floor(Math.random() * symbols.length);
      selectedSymbols.push(symbols.splice(randomIndex, 1)[0]);
    }
    
    // Create pairs
    this.state.cards = [...selectedSymbols, ...selectedSymbols];
    
    // Shuffle cards
    this.shuffleCards();
  }
  
  shuffleCards() {
    // Fisher-Yates shuffle algorithm
    for (let i = this.state.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.state.cards[i], this.state.cards[j]] = [this.state.cards[j], this.state.cards[i]];
    }
  }
  
  renderCards() {
    const grid = this.container.querySelector('.memory-grid');
    grid.innerHTML = '';
    
    this.state.cards.forEach((symbol, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.index = index;
      card.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-front">❓</div>
          <div class="memory-card-back">${symbol}</div>
        </div>
      `;
      
      card.addEventListener('click', () => this.flipCard(card, index, symbol));
      
      grid.appendChild(card);
    });
  }
  
  flipCard(card, index, symbol) {
    // Check if can flip
    if (!this.state.canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
      return;
    }
    
    // Flip card
    card.classList.add('flipped');
    this.state.flippedCards.push({ index, symbol });
    
    // Play sound
    if (typeof sound !== 'undefined' && sound.play) {
      sound.play('sound-click');
    }
    
    // Check if two cards are flipped
    if (this.state.flippedCards.length === 2) {
      this.state.tries++;
      this.container.querySelector('.memory-tries').textContent = this.state.tries;
      
      // Check for match
      this.checkForMatch();
    }
  }
  
  checkForMatch() {
    const [card1, card2] = this.state.flippedCards;
    
    if (card1.symbol === card2.symbol) {
      // It's a match!
      this.handleMatch();
    } else {
      // No match
      this.handleMismatch();
    }
  }
  
  handleMatch() {
    // Mark cards as matched
    const matchedIndexes = this.state.flippedCards.map(card => card.index);
    matchedIndexes.forEach(index => {
      const card = this.container.querySelector(`.memory-card[data-index="${index}"]`);
      card.classList.add('matched');
    });
    
    // Update matched pairs count
    this.state.matchedPairs++;
    this.container.querySelector('.memory-pairs').textContent = this.state.matchedPairs;
    
    // Reset flipped cards array
    this.state.flippedCards = [];
    
    // Check if game is complete
    if (this.state.matchedPairs === this.state.totalPairs) {
      this.gameComplete();
    }
    
    // Call onMatch callback if provided
    if (this.options.onMatch) {
      this.options.onMatch();
    }
  }
  
  handleMismatch() {
    // Temporarily disable flipping while cards are being flipped back
    this.state.canFlip = false;
    
    // Flip cards back after a delay
    setTimeout(() => {
      this.state.flippedCards.forEach(card => {
        const element = this.container.querySelector(`.memory-card[data-index="${card.index}"]`);
        element.classList.remove('flipped');
      });
      
      // Reset and enable flipping again
      this.state.flippedCards = [];
      this.state.canFlip = true;
    }, 1000);
  }
  
  gameComplete() {
    setTimeout(() => {
      // Calculate score based on number of tries
      const maxTries = this.state.totalPairs * 2;
      const minTries = this.state.totalPairs;
      let score;
      
      if (this.state.tries <= minTries + 2) {
        score = 'large';
      } else if (this.state.tries <= maxTries) {
        score = 'medium';
      } else {
        score = 'small';
      }
      
      // Show completion UI
      this.container.querySelector('.memory-game').innerHTML = `
        <div class="game-completed">
          <h3>Félicitations!</h3>
          <p>Vous avez trouvé toutes les paires en ${this.state.tries} essais.</p>
          <button class="game-button js-memory-close">Fermer</button>
        </div>
      `;
      
      // Handle close button
      this.container.querySelector('.js-memory-close').addEventListener('click', () => {
        if (this.options.onComplete) {
          this.options.onComplete(score);
        }
      });
    }, 500);
  }
}

// Function to launch memory game
function launchMemoryGame(container, callback) {
  new MemoryGame(container, {
    pairs: 6,
    onComplete: (score) => {
      if (callback) callback(score);
    }
  });
}
