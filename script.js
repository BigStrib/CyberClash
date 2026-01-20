// ==================== GAME CONFIGURATION ====================
const CONFIG = {
  GAME_DURATION: 180,
  MAX_ELIXIR: 10,
  ELIXIR_REGEN_RATE: 0.5, // per second
  TOWER_HEALTH: 1000,

  // Single lane
  LANE_Y: 150,
  PLAYER_SPAWN_X: 150,
  ENEMY_SPAWN_X: 1050,
  PLAYER_TOWER_X: 90,
  ENEMY_TOWER_X: 1145,

  // Tower defense
  TOWER_ATTACK_RANGE: 120,
  TOWER_DAMAGE: 25,
  TOWER_ATTACK_SPEED: 1.5
};

// ==================== CARD DEFINITIONS ====================
const CARDS = {
  scout: {
    id: 'scout', name: 'Scout Drone', level: 2, cost: 2,
    health: 80, damage: 15, attackSpeed: 0.8, moveSpeed: 2.5, range: 150,
    type: 'ranged', color: '#00f0ff', size: 18
  },
  archer: {
    id: 'archer', name: 'Plasma Archer', level: 2, cost: 2,
    health: 60, damage: 20, attackSpeed: 1, moveSpeed: 2.2, range: 180,
    type: 'ranged', color: '#ffff00', size: 17
  },
  warrior: {
    id: 'warrior', name: 'Cyber Knight', level: 4, cost: 4,
    health: 220, damage: 40, attackSpeed: 1.2, moveSpeed: 1.8, range: 35,
    type: 'melee', color: '#4488ff', size: 26
  },
  sniper: {
    id: 'sniper', name: 'Laser Sniper', level: 4, cost: 4,
    health: 90, damage: 65, attackSpeed: 2.2, moveSpeed: 1.4, range: 280,
    type: 'ranged', color: '#ff00ff', size: 20
  },
  guardian: {
    id: 'guardian', name: 'Shield Core', level: 4, cost: 4,
    health: 380, damage: 25, attackSpeed: 1.5, moveSpeed: 1.2, range: 40,
    type: 'melee', color: '#0088ff', size: 30
  },
  tank: {
    id: 'tank', name: 'Mech Tank', level: 5, cost: 5,
    health: 450, damage: 55, attackSpeed: 2, moveSpeed: 1, range: 40,
    type: 'melee', color: '#00aa44', size: 34
  },
  assassin: {
    id: 'assassin', name: 'Shadow Blade', level: 5, cost: 5,
    health: 160, damage: 90, attackSpeed: 0.7, moveSpeed: 3.5, range: 30,
    type: 'melee', color: '#aa00ff', size: 22
  },
  berserker: {
    id: 'berserker', name: 'Rage Bot', level: 5, cost: 5,
    health: 280, damage: 75, attackSpeed: 0.9, moveSpeed: 2.2, range: 35,
    type: 'melee', color: '#ff3300', size: 28
  },
  golem: {
    id: 'golem', name: 'Titan Golem', level: 7, cost: 7,
    health: 900, damage: 120, attackSpeed: 2.5, moveSpeed: 0.7, range: 45,
    type: 'melee', color: '#ff8800', size: 42
  },
  destroyer: {
    id: 'destroyer', name: 'Omega Unit', level: 9, cost: 9,
    health: 1400, damage: 180, attackSpeed: 3, moveSpeed: 0.5, range: 50,
    type: 'melee', color: '#ff0044', size: 50
  }
};

// ==================== GAME STATE ====================
let gameState = {
  screen: 'main-menu',
  mode: null, // 'computer' | 'multiplayer'

  // Multiplayer state
  isHost: false,
  roomCode: null,
  mpConnected: false,
  mpLocalReady: false,
  mpRemoteReady: false,
  mpStarted: false,

  // Runtime
  gameRunning: false,
  gamePaused: false,
  timeRemaining: CONFIG.GAME_DURATION,

  // Player
  playerElixir: 5,
  playerTowerHealth: CONFIG.TOWER_HEALTH,
  playerDeck: ['scout', 'warrior', 'tank', 'sniper', 'assassin'],
  playerHand: [],
  selectedCard: null,

  // Enemy
  enemyElixir: 5,
  enemyTowerHealth: CONFIG.TOWER_HEALTH,
  enemyDeck: ['scout', 'warrior', 'tank', 'archer', 'guardian'],

  // Entities
  units: [],
  projectiles: [],

  // Stats
  unitsDeployed: 0,
  damageDealt: 0,

  // Towers
  lastPlayerTowerAttack: 0,
  lastEnemyTowerAttack: 0,

  // WebRTC
  peerConnection: null,
  dataChannel: null
};

let elixirInterval = null;
let timerInterval = null;
let lastFrameTime = 0;
let gameLoopId = null;
let aiOpponent = null;

// ==================== DOM HELPERS ====================
function $(id) { return document.getElementById(id); }

function safeOn(id, event, handler, opts) {
  const el = $(id);
  if (!el) return false;
  el.addEventListener(event, handler, opts);
  return true;
}

// ==================== POPUP SYSTEM ====================
const Popup = {
  show(options) {
    const {
      title,
      message,
      type = 'info',
      showCancel = false,
      onConfirm,
      onCancel,
      confirmText = 'OK',
      cancelText = 'Cancel',
      disableConfirm = false
    } = options;

    const overlay = $('custom-popup');
    const iconEl = $('popup-icon');
    const titleEl = $('popup-title');
    const messageEl = $('popup-message');
    const confirmBtn = $('popup-confirm-btn');
    const cancelBtn = $('popup-cancel-btn');

    if (!overlay || !iconEl || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
      // last resort
      alert(message);
      return;
    }

    iconEl.className = `popup-icon ${type}`;
    iconEl.innerHTML = this.getIcon(type);

    titleEl.textContent = title || 'Notification';
    messageEl.textContent = message || '';

    // Toggle cancel visibility
    if (showCancel) cancelBtn.classList.remove('hidden');
    else cancelBtn.classList.add('hidden');

    // Remove old listeners by cloning
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newConfirm.textContent = confirmText;
    newConfirm.disabled = !!disableConfirm;
    newConfirm.style.opacity = disableConfirm ? '0.6' : '1';
    newConfirm.style.pointerEvents = disableConfirm ? 'none' : 'auto';

    newCancel.textContent = cancelText;

    newConfirm.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
      if (onConfirm) onConfirm();
    });

    if (showCancel) {
      newCancel.classList.remove('hidden');
      newCancel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
        if (onCancel) onCancel();
      });
    }

    overlay.classList.remove('hidden');
  },

  hide() {
    const overlay = $('custom-popup');
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('fade-out');
    }, 250);
  },

  getIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      error: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>`,
      warning: `<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`,
      info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>`
    };
    return icons[type] || icons.info;
  },

  success(title, message, onConfirm) { this.show({ title, message, type: 'success', onConfirm }); },
  error(title, message, onConfirm) { this.show({ title, message, type: 'error', onConfirm }); },
  warning(title, message, onConfirm) { this.show({ title, message, type: 'warning', onConfirm }); },
  info(title, message, onConfirm) { this.show({ title, message, type: 'info', onConfirm }); },
  confirm(title, message, onConfirm, onCancel) {
    this.show({ title, message, type: 'warning', showCancel: true, onConfirm, onCancel, confirmText: 'OK', cancelText: 'Cancel' });
  }
};

// ==================== SVG GENERATORS ====================
const SVGGenerators = {
  darkenColor(hex, percent) {
    try {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return `#${(1 << 24 | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
    } catch {
      return hex;
    }
  },

  createUnitSVG(card, isEnemy = false) {
    const baseColor = isEnemy ? '#ff0055' : card.color;
    const secondary = isEnemy ? '#cc0044' : this.darkenColor(card.color, 30);
    const size = card.size;

    if (card.type === 'ranged') {
      return `
        <g class="unit ${isEnemy ? 'enemy' : 'player'}">
          <ellipse cx="0" cy="${size * 0.5}" rx="${size * 0.4}" ry="${size * 0.15}" fill="rgba(0,0,0,0.3)"/>
          <circle cx="0" cy="0" r="${size * 0.45}" fill="${secondary}"/>
          <circle cx="0" cy="0" r="${size * 0.35}" fill="${baseColor}"/>
          <circle cx="0" cy="0" r="${size * 0.15}" fill="white" opacity="0.9"/>
          <rect x="${isEnemy ? -size * 0.7 : size * 0.2}" y="-4" width="${size * 0.5}" height="8" fill="${secondary}" rx="2"/>
          <circle cx="0" cy="${-size * 0.55}" r="9" fill="#1a1a3e" stroke="${baseColor}" stroke-width="2"/>
          <text x="0" y="${-size * 0.55 + 4}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${card.level}</text>
          <rect x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="6" fill="#333" rx="3"/>
          <rect class="unit-health-bar" x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="6" fill="${isEnemy ? '#ff0055' : '#00ff88'}" rx="3"/>
        </g>
      `;
    }

    const armor = this.darkenColor(baseColor, 20);
    return `
      <g class="unit ${isEnemy ? 'enemy' : 'player'}">
        <ellipse cx="0" cy="${size * 0.5}" rx="${size * 0.45}" ry="${size * 0.15}" fill="rgba(0,0,0,0.3)"/>
        <rect x="${-size * 0.4}" y="${-size * 0.45}" width="${size * 0.8}" height="${size * 0.9}" fill="${secondary}" rx="8"/>
        <rect x="${-size * 0.35}" y="${-size * 0.4}" width="${size * 0.7}" height="${size * 0.8}" fill="${baseColor}" rx="6"/>
        <rect x="${-size * 0.3}" y="${-size * 0.35}" width="${size * 0.6}" height="${size * 0.15}" fill="${armor}" rx="3"/>
        <rect x="${-size * 0.3}" y="${size * 0.05}" width="${size * 0.6}" height="${size * 0.15}" fill="${armor}" rx="3"/>
        <rect x="${isEnemy ? -size * 0.75 : size * 0.3}" y="${-size * 0.1}" width="${size * 0.45}" height="${size * 0.2}" fill="${armor}" rx="4"/>
        <circle cx="0" cy="${-size * 0.6}" r="10" fill="#1a1a3e" stroke="${baseColor}" stroke-width="2"/>
        <text x="0" y="${-size * 0.6 + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${card.level}</text>
        <rect x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="7" fill="#333" rx="3"/>
        <rect class="unit-health-bar" x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="7" fill="${isEnemy ? '#ff0055' : '#00ff88'}" rx="3"/>
      </g>
    `;
  },

  createProjectileSVG(isEnemy = false) {
    const color = isEnemy ? '#ff0055' : '#00f0ff';
    return `
      <g class="projectile">
        <ellipse cx="0" cy="0" rx="8" ry="4" fill="${color}" opacity="0.85"/>
        <ellipse cx="0" cy="0" rx="5" ry="2.5" fill="white" opacity="0.9"/>
      </g>
    `;
  },

  createCardSVG(card) {
    if (card.type === 'ranged') {
      return `
        <svg viewBox="0 0 60 60" class="card-image">
          <circle cx="30" cy="28" r="16" fill="${card.color}30" stroke="${card.color}" stroke-width="2"/>
          <circle cx="30" cy="28" r="10" fill="${card.color}"/>
          <circle cx="30" cy="28" r="5" fill="white"/>
          <rect x="42" y="25" width="14" height="6" fill="${card.color}" rx="2"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 60 60" class="card-image">
        <rect x="20" y="10" width="20" height="36" fill="${card.color}50" stroke="${card.color}" stroke-width="2" rx="4"/>
        <rect x="23" y="14" width="14" height="28" fill="${card.color}" rx="3"/>
        <rect x="38" y="27" width="12" height="6" fill="${card.color}" rx="2"/>
      </svg>
    `;
  }
};

// ==================== ENTITIES ====================
class Unit {
  constructor(cardId, isEnemy = false) {
    this.id = Date.now() + Math.random();
    this.card = { ...CARDS[cardId] };
    this.isEnemy = isEnemy;
    this.x = isEnemy ? CONFIG.ENEMY_SPAWN_X : CONFIG.PLAYER_SPAWN_X;
    this.y = CONFIG.LANE_Y;

    this.currentHealth = this.card.health;
    this.maxHealth = this.card.health;

    this.lastAttackTime = 0;
    this.target = null;
    this.element = null;

    this.createSVGElement();
    this.spawnEffect();
  }

  createSVGElement() {
    const container = $('units-container');
    if (!container) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    g.innerHTML = SVGGenerators.createUnitSVG(this.card, this.isEnemy);
    g.dataset.unitId = this.id;
    container.appendChild(g);
    this.element = g;
  }

  spawnEffect() {
    const effects = $('effects-container');
    if (!effects) return;

    const color = this.isEnemy ? '#ff0055' : '#00f0ff';
    const fx = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fx.innerHTML = `
      <circle cx="${this.x}" cy="${this.y}" r="5" fill="none" stroke="${color}" stroke-width="3" opacity="0.8">
        <animate attributeName="r" from="5" to="40" dur="0.35s" fill="freeze"/>
        <animate attributeName="opacity" from="0.8" to="0" dur="0.35s" fill="freeze"/>
      </circle>
    `;
    effects.appendChild(fx);
    setTimeout(() => fx.remove(), 400);
  }

  update(deltaTime, allUnits) {
    if (this.currentHealth <= 0) return false;

    this.target = this.findTarget(allUnits);

    if (this.target) {
      const distance = Math.abs(this.target.x - this.x);

      if (distance <= this.card.range) {
        this.attack();
      } else {
        this.moveTowards(this.target.x, deltaTime);
      }
    } else {
      const towerX = this.isEnemy ? CONFIG.PLAYER_TOWER_X : CONFIG.ENEMY_TOWER_X;
      const distToTower = Math.abs(towerX - this.x);

      if (distToTower <= this.card.range) {
        this.attackTower();
      } else {
        this.moveTowards(towerX, deltaTime);
      }
    }

    this.updatePosition();
    return true;
  }

  findTarget(allUnits) {
    let closest = null;
    let closestDist = Infinity;
    for (const u of allUnits) {
      if (u.currentHealth > 0 && u.isEnemy !== this.isEnemy) {
        const d = Math.abs(u.x - this.x);
        if (d < closestDist) {
          closestDist = d;
          closest = u;
        }
      }
    }
    return closest;
  }

  moveTowards(targetX, deltaTime) {
    const direction = targetX > this.x ? 1 : -1;
    const move = this.card.moveSpeed * direction * deltaTime * 60;

    if (Math.abs(targetX - this.x) < Math.abs(move)) this.x = targetX;
    else this.x += move;

    this.x = Math.max(CONFIG.PLAYER_TOWER_X + 30, Math.min(CONFIG.ENEMY_TOWER_X - 30, this.x));
  }

  attack() {
    const now = Date.now();
    if (now - this.lastAttackTime < this.card.attackSpeed * 1000) return;
    this.lastAttackTime = now;

    if (this.card.type === 'ranged') this.fireProjectile();
    else this.meleeAttack();
  }

  fireProjectile() {
    if (!this.target || this.target.currentHealth <= 0) return;
    gameState.projectiles.push(new Projectile(this.x, this.y, this.target, this.card.damage, this.isEnemy));
  }

  meleeAttack() {
    if (!this.target || this.target.currentHealth <= 0) return;
    this.target.takeDamage(this.card.damage);
    this.damageNumber(this.target.x, this.target.y - 20, this.card.damage);
    if (!this.isEnemy) gameState.damageDealt += this.card.damage;
  }

  attackTower() {
    const now = Date.now();
    if (now - this.lastAttackTime < this.card.attackSpeed * 1000) return;
    this.lastAttackTime = now;

    if (this.isEnemy) {
      gameState.playerTowerHealth = Math.max(0, gameState.playerTowerHealth - this.card.damage);
      this.damageNumber(CONFIG.PLAYER_TOWER_X + 35, 120, this.card.damage);
      // host tells client? (optional - we keep local tower health authoritative per side)
    } else {
      gameState.enemyTowerHealth = Math.max(0, gameState.enemyTowerHealth - this.card.damage);
      this.damageNumber(CONFIG.ENEMY_TOWER_X + 35, 120, this.card.damage);
      gameState.damageDealt += this.card.damage;
    }

    updateTowerHealth();

    // If multiplayer, optionally sync tower damage (simple/naive):
    if (gameState.mode === 'multiplayer') {
      if (this.isEnemy) {
        // enemy unit damaged player's tower on THIS client; no need to send
      } else {
        // player unit damaged enemy tower on THIS client; no need to send
      }
    }
  }

  takeDamage(amount) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateHealthBar();
    if (this.currentHealth <= 0) this.destroy();
  }

  updateHealthBar() {
    if (!this.element) return;
    const bar = this.element.querySelector('.unit-health-bar');
    if (!bar) return;
    const w = (this.currentHealth / this.maxHealth) * this.card.size;
    bar.setAttribute('width', Math.max(0, w));
  }

  updatePosition() {
    if (this.element) this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);
  }

  damageNumber(x, y, dmg) {
    const effects = $('effects-container');
    if (!effects) return;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', '#ff4444');
    t.setAttribute('font-size', '14');
    t.setAttribute('font-weight', '800');
    t.classList.add('damage-number');
    t.textContent = `-${dmg}`;
    effects.appendChild(t);
    setTimeout(() => t.remove(), 850);
  }

  destroy() {
    if (this.element) this.element.remove();

    const effects = $('effects-container');
    if (!effects) return;
    const color = this.isEnemy ? '#ff0055' : '#00f0ff';
    const fx = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fx.innerHTML = `
      <circle cx="${this.x}" cy="${this.y}" r="10" fill="${color}" opacity="0.8">
        <animate attributeName="r" from="10" to="35" dur="0.25s" fill="freeze"/>
        <animate attributeName="opacity" from="0.8" to="0" dur="0.25s" fill="freeze"/>
      </circle>
    `;
    effects.appendChild(fx);
    setTimeout(() => fx.remove(), 300);
  }
}

class Projectile {
  constructor(x, y, target, damage, isEnemy) {
    this.id = Date.now() + Math.random();
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.isEnemy = isEnemy;
    this.speed = 10;
    this.element = null;

    this.createSVGElement();
  }

  createSVGElement() {
    const container = $('projectiles-container');
    if (!container) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    g.innerHTML = SVGGenerators.createProjectileSVG(this.isEnemy);
    container.appendChild(g);
    this.element = g;
  }

  update(deltaTime) {
    if (!this.target || this.target.currentHealth <= 0) {
      this.destroy();
      return false;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {
      this.target.takeDamage(this.damage);
      if (!this.isEnemy) gameState.damageDealt += this.damage;
      this.destroy();
      return false;
    }

    const step = this.speed * deltaTime * 60;
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (this.element) this.element.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${angle})`);
    return true;
  }

  destroy() {
    if (this.element) this.element.remove();
  }
}

class TowerProjectile extends Projectile {
  constructor(x, y, target, damage, isEnemyTower) {
    super(x, y, target, damage, isEnemyTower);
    this.speed = 12;
  }

  createSVGElement() {
    const container = $('projectiles-container');
    if (!container) return;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    const color = this.isEnemy ? '#ff0055' : '#00f0ff';
    g.innerHTML = `
      <g class="projectile">
        <circle cx="0" cy="0" r="6" fill="${color}" opacity="0.9"/>
        <circle cx="0" cy="0" r="3" fill="white"/>
      </g>
    `;
    container.appendChild(g);
    this.element = g;
  }
}

// ==================== AI OPPONENT ====================
class AIOpponent {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.lastPlayTime = 0;
    this.playDelay = this.baseDelay();
    this.thinking = false;
  }

  baseDelay() {
    if (this.difficulty === 'easy') return 4000;
    if (this.difficulty === 'hard') return 1500;
    return 2500;
  }

  update() {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    if (this.thinking) return;

    const now = Date.now();
    if (now - this.lastPlayTime < this.playDelay) return;
    if (gameState.enemyElixir < 2) return;

    this.thinking = true;
    setTimeout(() => {
      if (!gameState.gameRunning) return;
      this.makePlay();
      this.lastPlayTime = Date.now();
      this.playDelay = this.baseDelay() + (Math.random() * 1500 - 750);
      this.thinking = false;
    }, 250 + Math.random() * 450);
  }

  makePlay() {
    const affordable = gameState.enemyDeck.filter(id => CARDS[id] && CARDS[id].cost <= gameState.enemyElixir);
    if (!affordable.length) return;

    const playerUnits = gameState.units.filter(u => !u.isEnemy && u.currentHealth > 0).length;
    const enemyUnits = gameState.units.filter(u => u.isEnemy && u.currentHealth > 0).length;

    let cardId;
    if (playerUnits > enemyUnits + 1) {
      // defend: higher HP
      const defensive = affordable.filter(id => CARDS[id].health >= 200);
      cardId = (defensive.length ? defensive : affordable)[Math.floor(Math.random() * (defensive.length ? defensive.length : affordable.length))];
    } else {
      cardId = affordable[Math.floor(Math.random() * affordable.length)];
    }

    const card = CARDS[cardId];
    gameState.units.push(new Unit(cardId, true));
    gameState.enemyElixir -= card.cost;
  }
}

// ==================== MULTIPLAYER ====================
class MultiplayerManager {
  constructor() {
    this.configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    this.pollInterval = null;
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  updateConnectionStatus(message, state) {
    const status = $('connection-status');
    if (!status) return;
    const txt = status.querySelector('.status-text');
    if (txt) txt.textContent = message;
    status.className = `status-container ${state || ''}`.trim();
  }

  async createRoom() {
    try {
      gameState.isHost = true;
      gameState.roomCode = this.generateRoomCode();

      // reset match readiness
      gameState.mpConnected = false;
      gameState.mpLocalReady = false;
      gameState.mpRemoteReady = false;
      gameState.mpStarted = false;

      // Show waiting popup immediately
      Popup.show({
        title: 'Room Created',
        message: `Share this code with your opponent:\n\n${gameState.roomCode}\n\nWaiting for opponent to connect...`,
        type: 'info',
        confirmText: 'WAITING',
        disableConfirm: true,
        showCancel: true,
        cancelText: 'CLOSE',
        onCancel: () => {
          this.cleanup();
          showScreen('multiplayer-lobby');
        }
      });

      gameState.peerConnection = new RTCPeerConnection(this.configuration);
      gameState.dataChannel = gameState.peerConnection.createDataChannel('game');
      this.setupDataChannel();

      gameState.peerConnection.onicecandidate = (event) => {
        if (event.candidate === null) {
          localStorage.setItem(`room_${gameState.roomCode}`, JSON.stringify({
            offer: gameState.peerConnection.localDescription,
            timestamp: Date.now()
          }));
        }
      };

      const offer = await gameState.peerConnection.createOffer();
      await gameState.peerConnection.setLocalDescription(offer);

      // UI room code
      if ($('room-code')) $('room-code').textContent = gameState.roomCode;
      if ($('room-code-display')) $('room-code-display').classList.remove('hidden');
      this.updateConnectionStatus('Waiting for opponent...', 'waiting');

      this.pollForAnswer();
    } catch (e) {
      console.error(e);
      Popup.error('Connection Error', 'Failed to create room. Please try again.');
    }
  }

  pollForAnswer() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      const data = localStorage.getItem(`room_${gameState.roomCode}_answer`);
      if (!data) return;

      try {
        const { answer } = JSON.parse(data);
        await gameState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

        clearInterval(this.pollInterval);
        this.pollInterval = null;

        // IMPORTANT: do NOT auto-start game here.
        this.updateConnectionStatus('Opponent connected. Waiting for PLAY...', 'connected');
        // When data channel opens, both sides will see PLAY popup.
      } catch (e) {
        console.error('pollForAnswer error:', e);
      }
    }, 900);
  }

  async joinRoom(code) {
    try {
      const roomCode = String(code || '').toUpperCase().trim();
      if (roomCode.length !== 6) {
        Popup.warning('Invalid Code', 'Please enter a 6-character room code.');
        return;
      }

      gameState.isHost = false;
      gameState.roomCode = roomCode;

      // reset match readiness
      gameState.mpConnected = false;
      gameState.mpLocalReady = false;
      gameState.mpRemoteReady = false;
      gameState.mpStarted = false;

      Popup.show({
        title: 'Connecting...',
        message: 'Joining room and establishing connection...',
        type: 'info',
        confirmText: 'WAITING',
        disableConfirm: true,
        showCancel: true,
        cancelText: 'CLOSE',
        onCancel: () => {
          this.cleanup();
          showScreen('multiplayer-lobby');
        }
      });

      const roomData = localStorage.getItem(`room_${roomCode}`);
      if (!roomData) {
        Popup.error('Room Not Found', 'That room code does not exist.');
        return;
      }

      const { offer, timestamp } = JSON.parse(roomData);
      if (Date.now() - timestamp > 300000) {
        Popup.error('Room Expired', 'That room is expired. Ask host to create a new one.');
        return;
      }

      gameState.peerConnection = new RTCPeerConnection(this.configuration);

      gameState.peerConnection.ondatachannel = (event) => {
        gameState.dataChannel = event.channel;
        this.setupDataChannel();
      };

      gameState.peerConnection.onicecandidate = (event) => {
        if (event.candidate === null) {
          localStorage.setItem(`room_${roomCode}_answer`, JSON.stringify({
            answer: gameState.peerConnection.localDescription,
            timestamp: Date.now()
          }));
        }
      };

      await gameState.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await gameState.peerConnection.createAnswer();
      await gameState.peerConnection.setLocalDescription(answer);

      // IMPORTANT: do NOT auto-start game here.
      this.updateConnectionStatus('Connected. Waiting for PLAY...', 'connected');
      // When data channel opens, both sides will see PLAY popup.
    } catch (e) {
      console.error(e);
      Popup.error('Connection Error', 'Failed to join room. Please try again.');
    }
  }

  setupDataChannel() {
    if (!gameState.dataChannel) return;

    gameState.dataChannel.onopen = () => {
      gameState.mpConnected = true;
      this.updateConnectionStatus('Connected. Waiting for both players...', 'connected');
      this.showPlayPopup();
      this.maybeStartMatch();
    };

    gameState.dataChannel.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      this.handleMessage(data);
    };

    gameState.dataChannel.onclose = () => {
      if (gameState.gameRunning) {
        Popup.warning('Disconnected', 'Opponent disconnected.');
        endGame('victory');
      } else {
        gameState.mpConnected = false;
        this.updateConnectionStatus('Disconnected', 'error');
      }
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'spawn': {
        if (!CARDS[data.cardId]) return;
        gameState.units.push(new Unit(data.cardId, true));
        break;
      }
      case 'ready': {
        gameState.mpRemoteReady = true;
        this.showPlayPopup();
        this.maybeStartMatch();
        break;
      }
      default:
        break;
    }
  }

  sendSpawn(cardId) {
    if (gameState.dataChannel?.readyState === 'open') {
      gameState.dataChannel.send(JSON.stringify({ type: 'spawn', cardId }));
    }
  }

  sendReady() {
    if (gameState.dataChannel?.readyState === 'open') {
      gameState.dataChannel.send(JSON.stringify({ type: 'ready' }));
    }
  }

  showPlayPopup() {
    if (!gameState.mpConnected) return;

    if (gameState.mpLocalReady) {
      Popup.show({
        title: 'Ready',
        message: gameState.mpRemoteReady
          ? 'Opponent is ready. Starting...'
          : 'Waiting for opponent to press PLAY...',
        type: 'info',
        confirmText: 'WAITING',
        disableConfirm: true,
        showCancel: true,
        cancelText: 'LEAVE',
        onCancel: () => {
          this.cleanup();
          showScreen('multiplayer-lobby');
        }
      });
      return;
    }

    Popup.show({
      title: 'Match Ready',
      message: gameState.mpRemoteReady
        ? 'Opponent is ready. Press PLAY to start!'
        : 'Connected. Press PLAY when ready.',
      type: 'success',
      confirmText: 'PLAY',
      disableConfirm: false,
      showCancel: true,
      cancelText: 'LEAVE',
      onConfirm: () => {
        gameState.mpLocalReady = true;
        this.sendReady();
        this.showPlayPopup();
        this.maybeStartMatch();
      },
      onCancel: () => {
        this.cleanup();
        showScreen('multiplayer-lobby');
      }
    });
  }

  maybeStartMatch() {
    if (gameState.mpStarted) return;
    if (gameState.mpConnected && gameState.mpLocalReady && gameState.mpRemoteReady) {
      gameState.mpStarted = true;
      Popup.hide();
      startMultiplayerGame(); // only now start
    }
  }

  cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    try { gameState.dataChannel?.close(); } catch {}
    try { gameState.peerConnection?.close(); } catch {}

    if (gameState.roomCode) {
      // Best-effort cleanup (same-browser tab signaling)
      localStorage.removeItem(`room_${gameState.roomCode}`);
      localStorage.removeItem(`room_${gameState.roomCode}_answer`);
    }

    gameState.peerConnection = null;
    gameState.dataChannel = null;

    gameState.roomCode = null;
    gameState.isHost = false;

    gameState.mpConnected = false;
    gameState.mpLocalReady = false;
    gameState.mpRemoteReady = false;
    gameState.mpStarted = false;

    this.updateConnectionStatus('Ready to connect', '');
  }
}

const multiplayerManager = new MultiplayerManager();

// ==================== UI / SCREENS ====================
function showScreen(screenId) {
  // If leaving arena, stop loops + clear svg
  if (gameState.screen === 'game-arena' && screenId !== 'game-arena') {
    clearArena(true);
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = $(screenId);
  if (el) el.classList.add('active');
  gameState.screen = screenId;
}

// ==================== DECK ====================
function loadDeck() {
  try {
    const saved = localStorage.getItem('playerDeck');
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length === 5 && parsed.every(id => CARDS[id])) {
      gameState.playerDeck = parsed;
    }
  } catch {}
}

function saveDeck() {
  if (gameState.playerDeck.length !== 5) {
    Popup.warning('Incomplete Deck', 'Your deck must contain exactly 5 cards.');
    return;
  }
  localStorage.setItem('playerDeck', JSON.stringify(gameState.playerDeck));
  Popup.success('Deck Saved!', 'Your deck has been saved successfully.');
}

function createCardElement(card, forHand = false) {
  const div = document.createElement('div');
  div.className = 'game-card' + (forHand ? ' hand-card' : '');
  div.dataset.cardId = card.id;
  div.innerHTML = `
    <div class="card-cost">${card.cost}</div>
    <div class="card-level">Lv.${card.level}</div>
    ${SVGGenerators.createCardSVG(card)}
    <div class="card-name">${card.name}</div>
    <div class="card-stats">HP:${card.health} ATK:${card.damage}</div>
  `;
  return div;
}

function renderAllCards(filter = 'all') {
  const container = $('all-cards');
  if (!container) return;
  container.innerHTML = '';

  Object.values(CARDS).forEach(card => {
    if (filter !== 'all' && card.type !== filter) return;

    const el = createCardElement(card);
    if (gameState.playerDeck.includes(card.id)) el.classList.add('in-deck');
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCardInDeck(card.id);
    });
    container.appendChild(el);
  });
}

function renderSelectedDeck() {
  const slots = document.querySelectorAll('#selected-cards .card-slot');
  if (!slots.length) return;

  slots.forEach((slot, idx) => {
    slot.innerHTML = '';
    slot.classList.remove('filled');
    slot.classList.add('empty');

    const cardId = gameState.playerDeck[idx];
    if (!cardId) return;

    const card = CARDS[cardId];
    const el = createCardElement(card);
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.margin = '0';

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCardInDeck(card.id);
    });

    slot.appendChild(el);
    slot.classList.remove('empty');
    slot.classList.add('filled');
  });

  if ($('deck-count')) $('deck-count').textContent = gameState.playerDeck.length;
  updateDeckStats();
}

function updateDeckStats() {
  const avg = $('avg-cost');
  const hp = $('total-hp');
  if (!avg || !hp) return;

  if (!gameState.playerDeck.length) {
    avg.textContent = '0';
    hp.textContent = '0';
    return;
  }

  let totalCost = 0;
  let totalHP = 0;
  gameState.playerDeck.forEach(id => {
    const c = CARDS[id];
    if (!c) return;
    totalCost += c.cost;
    totalHP += c.health;
  });

  avg.textContent = (totalCost / gameState.playerDeck.length).toFixed(1);
  hp.textContent = totalHP;
}

function toggleCardInDeck(cardId) {
  const idx = gameState.playerDeck.indexOf(cardId);

  if (idx > -1) {
    gameState.playerDeck.splice(idx, 1);
  } else {
    if (gameState.playerDeck.length >= 5) {
      Popup.warning('Deck Full', 'Remove a card first.');
      return;
    }
    gameState.playerDeck.push(cardId);
  }

  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  renderAllCards(activeFilter);
  renderSelectedDeck();
}

// ==================== HAND / DEPLOY ====================
function setupPlayerHand() {
  gameState.playerHand = [...gameState.playerDeck];
  renderPlayerHand();
}

function renderPlayerHand() {
  const container = $('cards-in-hand');
  if (!container) return;
  container.innerHTML = '';

  gameState.playerHand.forEach(cardId => {
    const card = CARDS[cardId];
    if (!card) return;

    const el = createCardElement(card, true);

    if (card.cost > gameState.playerElixir) el.classList.add('disabled');
    if (gameState.selectedCard === cardId) el.classList.add('selected');

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectCard(cardId);
    });

    // mobile
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      selectCard(cardId);
    }, { passive: false });

    container.appendChild(el);
  });
}

function selectCard(cardId) {
  const card = CARDS[cardId];
  if (!card) return;

  if (card.cost > gameState.playerElixir) {
    Popup.warning('Not Enough Elixir', `You need ${card.cost} elixir.`);
    return;
  }

  gameState.selectedCard = (gameState.selectedCard === cardId) ? null : cardId;
  renderPlayerHand();
}

function handleDeployClick(e) {
  if (!gameState.gameRunning || gameState.gamePaused || !gameState.selectedCard) return;

  const arena = $('arena-svg');
  if (!arena) return;
  const rect = arena.getBoundingClientRect();

  const clientX = (e?.clientX ?? e?.pageX);
  const x = clientX - rect.left;
  const scaleX = 1200 / rect.width;
  const gameX = x * scaleX;

  // Only left half
  if (gameX >= 600) {
    Popup.warning('Invalid Position', 'Deploy on your side (left half).');
    return;
  }

  deploySelectedCard();
}

function deploySelectedCard() {
  const cardId = gameState.selectedCard;
  if (!cardId) return;

  const card = CARDS[cardId];
  if (!card || card.cost > gameState.playerElixir) {
    gameState.selectedCard = null;
    renderPlayerHand();
    return;
  }

  gameState.units.push(new Unit(cardId, false));
  gameState.playerElixir -= card.cost;
  gameState.unitsDeployed++;

  updateElixirBar();
  renderPlayerHand();

  // Multiplayer: send spawn
  if (gameState.mode === 'multiplayer') {
    multiplayerManager.sendSpawn(cardId);
  }

  gameState.selectedCard = null;
  renderPlayerHand();
}

function handleKeyDown(e) {
  if (gameState.screen !== 'game-arena' || !gameState.gameRunning) return;

  if (e.key >= '1' && e.key <= '5') {
    const i = parseInt(e.key, 10) - 1;
    if (gameState.playerHand[i]) selectCard(gameState.playerHand[i]);
  }

  if (e.key === ' ' && gameState.selectedCard) {
    e.preventDefault();
    deploySelectedCard();
  }

  if (e.key === 'Escape') {
    gameState.selectedCard = null;
    renderPlayerHand();
  }

  if (e.key === 'p' || e.key === 'P') togglePause();
}

// ==================== GAME LOOP ====================
function clearArena(stopEverything = false) {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }

  if (stopEverything) {
    if (elixirInterval) clearInterval(elixirInterval);
    if (timerInterval) clearInterval(timerInterval);
    elixirInterval = null;
    timerInterval = null;
  }

  ['units-container', 'projectiles-container', 'effects-container'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = '';
  });

  gameState.units = [];
  gameState.projectiles = [];
}

function resetGameStateForMatch() {
  gameState.gameRunning = false;
  gameState.gamePaused = false;

  gameState.timeRemaining = CONFIG.GAME_DURATION;

  gameState.playerElixir = 5;
  gameState.enemyElixir = 5;

  gameState.playerTowerHealth = CONFIG.TOWER_HEALTH;
  gameState.enemyTowerHealth = CONFIG.TOWER_HEALTH;

  gameState.unitsDeployed = 0;
  gameState.damageDealt = 0;

  gameState.selectedCard = null;

  gameState.lastPlayerTowerAttack = 0;
  gameState.lastEnemyTowerAttack = 0;

  // clear svg containers
  clearArena(false);

  // reset UI
  updateElixirBar();
  updateTowerHealth();
  updateTimerDisplay();

  // hide pause overlay
  $('pause-overlay')?.classList.add('hidden');
}

function startGame() {
  clearArena(true);
  resetGameStateForMatch();

  showScreen('game-arena');
  gameState.mode = 'computer';
  gameState.gameRunning = true;

  aiOpponent = new AIOpponent('normal');

  setupPlayerHand();

  lastFrameTime = performance.now();
  gameLoopId = requestAnimationFrame(gameLoop);

  startElixirRegen();
  startTimer();
}

function startMultiplayerGame() {
  // Match is already connected & ready
  clearArena(true);
  resetGameStateForMatch();

  showScreen('game-arena');
  gameState.mode = 'multiplayer';
  gameState.gameRunning = true;

  setupPlayerHand();

  lastFrameTime = performance.now();
  gameLoopId = requestAnimationFrame(gameLoop);

  startElixirRegen();
  startTimer();
}

function gameLoop(now) {
  if (!gameState.gameRunning) return;

  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  if (!gameState.gamePaused) {
    if (gameState.mode === 'computer' && aiOpponent) aiOpponent.update();

    gameState.units = gameState.units.filter(u => u.currentHealth > 0 && u.update(deltaTime, gameState.units));
    gameState.projectiles = gameState.projectiles.filter(p => p.update(deltaTime));

    updateTowerAttacks();
    checkGameEnd();
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

function updateTowerAttacks() {
  const now = Date.now();

  // Player tower attacks enemies
  if (now - gameState.lastPlayerTowerAttack >= CONFIG.TOWER_ATTACK_SPEED * 1000) {
    const enemy = gameState.units.find(u =>
      u.isEnemy && u.currentHealth > 0 &&
      Math.abs(u.x - CONFIG.PLAYER_TOWER_X) <= CONFIG.TOWER_ATTACK_RANGE
    );
    if (enemy) {
      gameState.lastPlayerTowerAttack = now;
      gameState.projectiles.push(new TowerProjectile(CONFIG.PLAYER_TOWER_X + 35, 150, enemy, CONFIG.TOWER_DAMAGE, false));
    }
  }

  // Enemy tower attacks player units
  if (now - gameState.lastEnemyTowerAttack >= CONFIG.TOWER_ATTACK_SPEED * 1000) {
    const playerUnit = gameState.units.find(u =>
      !u.isEnemy && u.currentHealth > 0 &&
      Math.abs(u.x - CONFIG.ENEMY_TOWER_X) <= CONFIG.TOWER_ATTACK_RANGE
    );
    if (playerUnit) {
      gameState.lastEnemyTowerAttack = now;
      gameState.projectiles.push(new TowerProjectile(CONFIG.ENEMY_TOWER_X + 35, 150, playerUnit, CONFIG.TOWER_DAMAGE, true));
    }
  }
}

// ==================== REGEN / TIMER ====================
function startElixirRegen() {
  if (elixirInterval) clearInterval(elixirInterval);

  elixirInterval = setInterval(() => {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    if (gameState.playerElixir < CONFIG.MAX_ELIXIR) {
      gameState.playerElixir = Math.min(CONFIG.MAX_ELIXIR, gameState.playerElixir + CONFIG.ELIXIR_REGEN_RATE);
      updateElixirBar();
      renderPlayerHand();
    }

    if (gameState.mode === 'computer' && gameState.enemyElixir < CONFIG.MAX_ELIXIR) {
      gameState.enemyElixir = Math.min(CONFIG.MAX_ELIXIR, gameState.enemyElixir + CONFIG.ELIXIR_REGEN_RATE);
    }
  }, 1000);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    gameState.timeRemaining--;
    updateTimerDisplay();

    if (gameState.timeRemaining <= 0) endGame();
  }, 1000);
}

// ==================== UI UPDATES ====================
function updateTimerDisplay() {
  const t = $('timer-text');
  if (!t) return;
  const m = Math.floor(gameState.timeRemaining / 60);
  const s = gameState.timeRemaining % 60;
  t.textContent = `${m}:${String(s).padStart(2, '0')}`;

  if (gameState.timeRemaining <= 30) t.setAttribute('fill', '#ff5555');
  else if (gameState.timeRemaining <= 60) t.setAttribute('fill', '#ffaa00');
  else t.setAttribute('fill', '#00f0ff');
}

function updateElixirBar() {
  const fill = $('elixir-fill');
  const txt = $('elixir-text');

  if (fill) {
    const pct = (gameState.playerElixir / CONFIG.MAX_ELIXIR) * 100;
    fill.style.width = `${pct}%`;
  }
  if (txt) txt.textContent = `${Math.floor(gameState.playerElixir)}/${CONFIG.MAX_ELIXIR}`;
}

function updateTowerHealth() {
  const playerBar = $('player-tower-health');
  const enemyBar = $('enemy-tower-health');
  const playerText = $('player-health-text');
  const enemyText = $('enemy-health-text');

  const pPct = (gameState.playerTowerHealth / CONFIG.TOWER_HEALTH) * 100;
  const ePct = (gameState.enemyTowerHealth / CONFIG.TOWER_HEALTH) * 100;

  if (playerBar) playerBar.style.width = `${Math.max(0, pPct)}%`;
  if (enemyBar) enemyBar.style.width = `${Math.max(0, ePct)}%`;

  if (playerText) playerText.textContent = Math.max(0, Math.floor(gameState.playerTowerHealth));
  if (enemyText) enemyText.textContent = Math.max(0, Math.floor(gameState.enemyTowerHealth));

  const pt = $('player-tower');
  const et = $('enemy-tower');
  if (pt) pt.style.opacity = gameState.playerTowerHealth <= 0 ? '0.3' : (gameState.playerTowerHealth < CONFIG.TOWER_HEALTH * 0.3 ? '0.6' : '1');
  if (et) et.style.opacity = gameState.enemyTowerHealth <= 0 ? '0.3' : (gameState.enemyTowerHealth < CONFIG.TOWER_HEALTH * 0.3 ? '0.6' : '1');
}

// ==================== PAUSE / END GAME ====================
function togglePause() {
  if (!gameState.gameRunning) return;
  gameState.gamePaused = !gameState.gamePaused;
  const overlay = $('pause-overlay');
  if (!overlay) return;
  if (gameState.gamePaused) overlay.classList.remove('hidden');
  else overlay.classList.add('hidden');
}

function checkGameEnd() {
  if (gameState.playerTowerHealth <= 0) endGame('defeat');
  else if (gameState.enemyTowerHealth <= 0) endGame('victory');
}

function endGame(result = null) {
  gameState.gameRunning = false;

  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = null;

  if (elixirInterval) clearInterval(elixirInterval);
  if (timerInterval) clearInterval(timerInterval);
  elixirInterval = null;
  timerInterval = null;

  if (!result) {
    if (gameState.playerTowerHealth > gameState.enemyTowerHealth) result = 'victory';
    else if (gameState.enemyTowerHealth > gameState.playerTowerHealth) result = 'defeat';
    else result = 'draw';
  }

  saveGameStats(result === 'victory');

  const rt = $('result-text');
  if (rt) {
    rt.textContent = `${result.toUpperCase()}!`;
    rt.className = result;
  }

  if ($('stat-units')) $('stat-units').textContent = gameState.unitsDeployed;
  if ($('stat-damage')) $('stat-damage').textContent = gameState.damageDealt;
  if ($('stat-tower-hp')) $('stat-tower-hp').textContent = Math.max(0, Math.floor(gameState.playerTowerHealth));

  // clear arena so nothing "bleeds" behind screens
  setTimeout(() => {
    clearArena(true);
    showScreen('game-over');
  }, 800);
}

function saveGameStats(won) {
  try {
    const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    if (won) stats.wins = (stats.wins || 0) + 1;
    stats.totalDamage = (stats.totalDamage || 0) + gameState.damageDealt;
    stats.totalUnits = (stats.totalUnits || 0) + gameState.unitsDeployed;
    localStorage.setItem('gameStats', JSON.stringify(stats));
  } catch {}
}

function loadStatsToMenu() {
  try {
    const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
    if ($('menu-wins')) $('menu-wins').textContent = `${stats.wins || 0} Wins`;
    if ($('menu-games')) $('menu-games').textContent = `${stats.gamesPlayed || 0} Games`;
  } catch {}
}

// ==================== EVENT WIRING ====================
function setupEventListeners() {
  // Main menu
  safeOn('vs-computer-btn', 'click', (e) => { e.preventDefault(); startGame(); });
  safeOn('multiplayer-btn', 'click', (e) => { e.preventDefault(); showScreen('multiplayer-lobby'); });
  safeOn('deck-btn', 'click', (e) => {
    e.preventDefault();
    showScreen('deck-builder');
    renderAllCards('all');
    renderSelectedDeck();
  });

  // Lobby
  safeOn('create-room-btn', 'click', (e) => { e.preventDefault(); multiplayerManager.createRoom(); });
  safeOn('join-room-btn', 'click', (e) => {
    e.preventDefault();
    multiplayerManager.joinRoom($('join-code-input')?.value);
  });

  const joinInput = $('join-code-input');
  if (joinInput) {
    joinInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    });
  }

  safeOn('copy-code-btn', 'click', async (e) => {
    e.preventDefault();
    if (!gameState.roomCode) return;
    try {
      await navigator.clipboard.writeText(gameState.roomCode);
      Popup.success('Copied!', 'Room code copied to clipboard.');
    } catch {
      Popup.info('Room Code', `Code: ${gameState.roomCode}`);
    }
  });

  safeOn('lobby-back-btn', 'click', (e) => {
    e.preventDefault();
    multiplayerManager.cleanup();
    $('room-code-display')?.classList.add('hidden');
    showScreen('main-menu');
  });

  // Deck builder
  safeOn('save-deck-btn', 'click', (e) => { e.preventDefault(); saveDeck(); });
  safeOn('deck-back-btn', 'click', (e) => { e.preventDefault(); showScreen('main-menu'); });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAllCards(btn.dataset.filter || 'all');
    });
  });

  // Game controls
  safeOn('pause-btn', 'click', (e) => { e.preventDefault(); togglePause(); });
  safeOn('menu-btn', 'click', (e) => {
    e.preventDefault();
    if (!gameState.gameRunning) return;
    gameState.gamePaused = true;
    $('pause-overlay')?.classList.remove('hidden');
  });

  safeOn('resume-btn', 'click', (e) => {
    e.preventDefault();
    gameState.gamePaused = false;
    $('pause-overlay')?.classList.add('hidden');
  });

  safeOn('quit-btn', 'click', (e) => {
    e.preventDefault();
    Popup.show({
      title: 'Quit Game?',
      message: 'Are you sure you want to quit?',
      type: 'warning',
      showCancel: true,
      confirmText: 'QUIT',
      cancelText: 'CANCEL',
      onConfirm: () => endGame('defeat')
    });
  });

  // Deploy overlay (click & touch)
  safeOn('deploy-overlay', 'click', handleDeployClick);
  const deployOverlay = $('deploy-overlay');
  if (deployOverlay) {
    deployOverlay.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches?.[0];
      if (!touch) return;
      handleDeployClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
  }

  // Game over
  safeOn('play-again-btn', 'click', (e) => {
    e.preventDefault();
    if (gameState.mode === 'computer') startGame();
    else showScreen('multiplayer-lobby');
  });

  safeOn('main-menu-btn', 'click', (e) => {
    e.preventDefault();
    multiplayerManager.cleanup();
    clearArena(true);
    showScreen('main-menu');
    loadStatsToMenu();
  });

  // Keyboard
  document.addEventListener('keydown', handleKeyDown);
}

// ==================== INIT ====================
function initGame() {
  setupEventListeners();
  loadDeck();
  loadStatsToMenu();

  // initial render for deck builder if user goes there
  renderAllCards('all');
  renderSelectedDeck();
}

document.addEventListener('DOMContentLoaded', initGame);

window.addEventListener('beforeunload', () => {
  clearArena(true);
  multiplayerManager.cleanup();
});