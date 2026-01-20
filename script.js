// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    GAME_DURATION: 180,
    MAX_ELIXIR: 10,
    ELIXIR_REGEN_RATE: 0.5,
    TOWER_HEALTH: 1000,
    LANE_Y: 150,
    PLAYER_SPAWN_X: 150,
    ENEMY_SPAWN_X: 1050,
    PLAYER_TOWER_X: 90,
    ENEMY_TOWER_X: 1145,
    TOWER_ATTACK_RANGE: 120,
    TOWER_DAMAGE: 25,
    TOWER_ATTACK_SPEED: 1.5
};

// ==================== CARD DEFINITIONS ====================
const CARDS = {
    scout: {
        id: 'scout',
        name: 'Scout Drone',
        level: 2,
        cost: 2,
        health: 80,
        damage: 15,
        attackSpeed: 0.8,
        moveSpeed: 2.5,
        range: 150,
        type: 'ranged',
        color: '#00f0ff',
        size: 18
    },
    archer: {
        id: 'archer',
        name: 'Plasma Archer',
        level: 2,
        cost: 2,
        health: 60,
        damage: 20,
        attackSpeed: 1,
        moveSpeed: 2.2,
        range: 180,
        type: 'ranged',
        color: '#ffff00',
        size: 17
    },
    warrior: {
        id: 'warrior',
        name: 'Cyber Knight',
        level: 4,
        cost: 4,
        health: 220,
        damage: 40,
        attackSpeed: 1.2,
        moveSpeed: 1.8,
        range: 35,
        type: 'melee',
        color: '#4488ff',
        size: 26
    },
    sniper: {
        id: 'sniper',
        name: 'Laser Sniper',
        level: 4,
        cost: 4,
        health: 90,
        damage: 65,
        attackSpeed: 2.2,
        moveSpeed: 1.4,
        range: 280,
        type: 'ranged',
        color: '#ff00ff',
        size: 20
    },
    guardian: {
        id: 'guardian',
        name: 'Shield Core',
        level: 4,
        cost: 4,
        health: 380,
        damage: 25,
        attackSpeed: 1.5,
        moveSpeed: 1.2,
        range: 40,
        type: 'melee',
        color: '#0088ff',
        size: 30
    },
    tank: {
        id: 'tank',
        name: 'Mech Tank',
        level: 5,
        cost: 5,
        health: 450,
        damage: 55,
        attackSpeed: 2,
        moveSpeed: 1,
        range: 40,
        type: 'melee',
        color: '#00aa44',
        size: 34
    },
    assassin: {
        id: 'assassin',
        name: 'Shadow Blade',
        level: 5,
        cost: 5,
        health: 160,
        damage: 90,
        attackSpeed: 0.7,
        moveSpeed: 3.5,
        range: 30,
        type: 'melee',
        color: '#aa00ff',
        size: 22
    },
    berserker: {
        id: 'berserker',
        name: 'Rage Bot',
        level: 5,
        cost: 5,
        health: 280,
        damage: 75,
        attackSpeed: 0.9,
        moveSpeed: 2.2,
        range: 35,
        type: 'melee',
        color: '#ff3300',
        size: 28
    },
    golem: {
        id: 'golem',
        name: 'Titan Golem',
        level: 7,
        cost: 7,
        health: 900,
        damage: 120,
        attackSpeed: 2.5,
        moveSpeed: 0.7,
        range: 45,
        type: 'melee',
        color: '#ff8800',
        size: 42
    },
    destroyer: {
        id: 'destroyer',
        name: 'Omega Unit',
        level: 9,
        cost: 9,
        health: 1400,
        damage: 180,
        attackSpeed: 3,
        moveSpeed: 0.5,
        range: 50,
        type: 'melee',
        color: '#ff0044',
        size: 50
    }
};

// ==================== GAME STATE ====================
let gameState = {
    screen: 'menu',
    mode: null,
    isHost: false,
    roomCode: null,
    
    gameRunning: false,
    gamePaused: false,
    timeRemaining: CONFIG.GAME_DURATION,
    
    playerElixir: 5,
    playerTowerHealth: CONFIG.TOWER_HEALTH,
    playerDeck: ['scout', 'warrior', 'tank', 'sniper', 'assassin'],
    playerHand: [],
    
    enemyElixir: 5,
    enemyTowerHealth: CONFIG.TOWER_HEALTH,
    enemyDeck: ['scout', 'warrior', 'tank', 'archer', 'guardian'],
    
    units: [],
    projectiles: [],
    
    unitsDeployed: 0,
    damageDealt: 0,
    
    selectedCard: null,
    lastPlayerTowerAttack: 0,
    lastEnemyTowerAttack: 0,
    
    peerConnection: null,
    dataChannel: null
};

let elixirInterval = null;
let timerInterval = null;
let lastFrameTime = 0;
let aiOpponent = null;
let gameLoopId = null;

// ==================== CUSTOM POPUP SYSTEM ====================
const Popup = {
    show(options) {
        const { title, message, type = 'info', showCancel = false, onConfirm, onCancel } = options;
        
        const overlay = document.getElementById('custom-popup');
        const iconEl = document.getElementById('popup-icon');
        const titleEl = document.getElementById('popup-title');
        const messageEl = document.getElementById('popup-message');
        const confirmBtn = document.getElementById('popup-confirm-btn');
        const cancelBtn = document.getElementById('popup-cancel-btn');
        
        if (!overlay || !iconEl || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
            console.error('Popup elements not found');
            alert(message);
            return;
        }
        
        iconEl.className = `popup-icon ${type}`;
        iconEl.innerHTML = this.getIcon(type);
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        if (showCancel) {
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
        
        // Clone and replace to remove old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newConfirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
            if (onConfirm) onConfirm();
        });
        
        if (showCancel) {
            newCancelBtn.classList.remove('hidden');
            newCancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hide();
                if (onCancel) onCancel();
            });
        }
        
        overlay.classList.remove('hidden');
    },
    
    hide() {
        const overlay = document.getElementById('custom-popup');
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
    
    success(title, message, onConfirm) {
        this.show({ title, message, type: 'success', onConfirm });
    },
    
    error(title, message, onConfirm) {
        this.show({ title, message, type: 'error', onConfirm });
    },
    
    warning(title, message, onConfirm) {
        this.show({ title, message, type: 'warning', onConfirm });
    },
    
    info(title, message, onConfirm) {
        this.show({ title, message, type: 'info', onConfirm });
    },
    
    confirm(title, message, onConfirm, onCancel) {
        this.show({ title, message, type: 'warning', showCancel: true, onConfirm, onCancel });
    }
};

// ==================== SVG GENERATORS ====================
const SVGGenerators = {
    createUnitSVG(card, isEnemy = false) {
        const baseColor = isEnemy ? '#ff0055' : card.color;
        const secondaryColor = isEnemy ? '#cc0044' : this.darkenColor(card.color, 30);
        const size = card.size;
        
        if (card.type === 'ranged') {
            return `
                <g class="unit ${isEnemy ? 'enemy' : 'player'}">
                    <ellipse cx="0" cy="${size * 0.5}" rx="${size * 0.4}" ry="${size * 0.15}" fill="rgba(0,0,0,0.3)"/>
                    <circle cx="0" cy="0" r="${size * 0.45}" fill="${secondaryColor}"/>
                    <circle cx="0" cy="0" r="${size * 0.35}" fill="${baseColor}"/>
                    <circle cx="0" cy="-${size * 0.1}" r="${size * 0.2}" fill="rgba(255,255,255,0.3)"/>
                    <circle cx="0" cy="0" r="${size * 0.15}" fill="white" opacity="0.9"/>
                    <rect x="${isEnemy ? -size * 0.7 : size * 0.2}" y="-4" width="${size * 0.5}" height="8" fill="${secondaryColor}" rx="2"/>
                    <rect x="${isEnemy ? -size * 0.65 : size * 0.25}" y="-2" width="${size * 0.4}" height="4" fill="${baseColor}" rx="1"/>
                    <circle cx="0" cy="${-size * 0.55}" r="9" fill="#1a1a3e" stroke="${baseColor}" stroke-width="2"/>
                    <text x="0" y="${-size * 0.55 + 4}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${card.level}</text>
                    <rect x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="6" fill="#333" rx="3"/>
                    <rect class="unit-health-bar" x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="6" fill="${isEnemy ? '#ff0055' : '#00ff88'}" rx="3"/>
                </g>
            `;
        } else {
            const armorColor = this.darkenColor(baseColor, 20);
            return `
                <g class="unit ${isEnemy ? 'enemy' : 'player'}">
                    <ellipse cx="0" cy="${size * 0.5}" rx="${size * 0.45}" ry="${size * 0.15}" fill="rgba(0,0,0,0.3)"/>
                    <rect x="${-size * 0.4}" y="${-size * 0.45}" width="${size * 0.8}" height="${size * 0.9}" fill="${secondaryColor}" rx="8"/>
                    <rect x="${-size * 0.35}" y="${-size * 0.4}" width="${size * 0.7}" height="${size * 0.8}" fill="${baseColor}" rx="6"/>
                    <rect x="${-size * 0.3}" y="${-size * 0.35}" width="${size * 0.6}" height="${size * 0.15}" fill="${armorColor}" rx="3"/>
                    <rect x="${-size * 0.3}" y="${size * 0.05}" width="${size * 0.6}" height="${size * 0.15}" fill="${armorColor}" rx="3"/>
                    <rect x="${-size * 0.25}" y="${-size * 0.15}" width="${size * 0.5}" height="${size * 0.12}" fill="#001122" rx="2"/>
                    <rect x="${-size * 0.2}" y="${-size * 0.13}" width="${size * 0.4}" height="${size * 0.08}" fill="${isEnemy ? '#ff0055' : '#00f0ff'}" rx="1" opacity="0.8"/>
                    <rect x="${isEnemy ? -size * 0.75 : size * 0.3}" y="${-size * 0.1}" width="${size * 0.45}" height="${size * 0.2}" fill="${armorColor}" rx="4"/>
                    <circle cx="0" cy="${-size * 0.6}" r="10" fill="#1a1a3e" stroke="${baseColor}" stroke-width="2"/>
                    <text x="0" y="${-size * 0.6 + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${card.level}</text>
                    <rect x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="7" fill="#333" rx="3"/>
                    <rect class="unit-health-bar" x="${-size * 0.5}" y="${size * 0.6}" width="${size}" height="7" fill="${isEnemy ? '#ff0055' : '#00ff88'}" rx="3"/>
                </g>
            `;
        }
    },
    
    darkenColor(hex, percent) {
        try {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
        } catch (e) {
            return hex;
        }
    },
    
    createProjectileSVG(isEnemy = false) {
        const color = isEnemy ? '#ff0055' : '#00f0ff';
        return `
            <g class="projectile">
                <ellipse cx="0" cy="0" rx="8" ry="4" fill="${color}" opacity="0.8"/>
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
        } else {
            return `
                <svg viewBox="0 0 60 60" class="card-image">
                    <rect x="20" y="10" width="20" height="36" fill="${card.color}50" stroke="${card.color}" stroke-width="2" rx="4"/>
                    <rect x="23" y="14" width="14" height="28" fill="${card.color}" rx="3"/>
                    <rect x="26" y="18" width="8" height="5" fill="${card.color}90" rx="2"/>
                    <rect x="26" y="33" width="8" height="5" fill="${card.color}90" rx="2"/>
                    <rect x="27" y="25" width="6" height="4" fill="white" rx="1"/>
                    <rect x="38" y="27" width="12" height="6" fill="${card.color}" rx="2"/>
                </svg>
            `;
        }
    }
};

// ==================== UNIT CLASS ====================
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
        this.state = 'moving';
        
        this.createSVGElement();
    }
    
    createSVGElement() {
        const container = document.getElementById('units-container');
        if (!container) return;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${this.x}, ${this.y})`);
        group.innerHTML = SVGGenerators.createUnitSVG(this.card, this.isEnemy);
        group.dataset.unitId = this.id;
        container.appendChild(group);
        this.element = group;
        
        this.createSpawnEffect();
    }
    
    createSpawnEffect() {
        const effectsContainer = document.getElementById('effects-container');
        if (!effectsContainer) return;
        
        const color = this.isEnemy ? '#ff0055' : '#00f0ff';
        
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        effect.innerHTML = `
            <circle cx="${this.x}" cy="${this.y}" r="5" fill="none" stroke="${color}" stroke-width="3" opacity="0.8">
                <animate attributeName="r" from="5" to="40" dur="0.4s" fill="freeze"/>
                <animate attributeName="opacity" from="0.8" to="0" dur="0.4s" fill="freeze"/>
            </circle>
        `;
        effectsContainer.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) effect.remove();
        }, 400);
    }
    
    update(deltaTime, allUnits) {
        if (this.currentHealth <= 0) return false;
        
        this.target = this.findTarget(allUnits);
        
        if (this.target) {
            const distance = Math.abs(this.target.x - this.x);
            
            if (distance <= this.card.range) {
                this.state = 'fighting';
                this.attack();
            } else {
                this.state = 'moving';
                this.moveTowards(this.target.x, deltaTime);
            }
        } else {
            const towerX = this.isEnemy ? CONFIG.PLAYER_TOWER_X : CONFIG.ENEMY_TOWER_X;
            const distanceToTower = Math.abs(towerX - this.x);
            
            if (distanceToTower <= this.card.range) {
                this.state = 'attacking_tower';
                this.attackTower();
            } else {
                this.state = 'moving';
                this.moveTowards(towerX, deltaTime);
            }
        }
        
        this.updatePosition();
        return true;
    }
    
    findTarget(allUnits) {
        let closestTarget = null;
        let closestDistance = Infinity;
        
        for (const unit of allUnits) {
            if (unit.isEnemy !== this.isEnemy && unit.currentHealth > 0) {
                const distance = Math.abs(unit.x - this.x);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = unit;
                }
            }
        }
        
        return closestTarget;
    }
    
    moveTowards(targetX, deltaTime) {
        const direction = targetX > this.x ? 1 : -1;
        const movement = this.card.moveSpeed * direction * deltaTime * 60;
        
        if (Math.abs(targetX - this.x) < Math.abs(movement)) {
            this.x = targetX;
        } else {
            this.x += movement;
        }
        
        this.x = Math.max(CONFIG.PLAYER_TOWER_X + 30, Math.min(CONFIG.ENEMY_TOWER_X - 30, this.x));
    }
    
    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime >= this.card.attackSpeed * 1000) {
            this.lastAttackTime = now;
            
            if (this.card.type === 'ranged') {
                this.fireProjectile();
            } else {
                this.meleeAttack();
            }
        }
    }
    
    fireProjectile() {
        if (this.target && this.target.currentHealth > 0) {
            const projectile = new Projectile(this.x, this.y, this.target, this.card.damage, this.isEnemy);
            gameState.projectiles.push(projectile);
        }
    }
    
    meleeAttack() {
        if (this.target && this.target.currentHealth > 0) {
            this.target.takeDamage(this.card.damage);
            this.showDamageNumber(this.target.x, this.target.y - 20, this.card.damage);
            
            if (!this.isEnemy) {
                gameState.damageDealt += this.card.damage;
            }
        }
    }
    
    attackTower() {
        const now = Date.now();
        if (now - this.lastAttackTime >= this.card.attackSpeed * 1000) {
            this.lastAttackTime = now;
            
            if (this.isEnemy) {
                gameState.playerTowerHealth = Math.max(0, gameState.playerTowerHealth - this.card.damage);
                this.showDamageNumber(CONFIG.PLAYER_TOWER_X + 35, 120, this.card.damage);
            } else {
                gameState.enemyTowerHealth = Math.max(0, gameState.enemyTowerHealth - this.card.damage);
                this.showDamageNumber(CONFIG.ENEMY_TOWER_X + 35, 120, this.card.damage);
                gameState.damageDealt += this.card.damage;
            }
            
            updateTowerHealth();
        }
    }
    
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthBar();
        
        if (this.currentHealth <= 0) {
            this.destroy();
        }
    }
    
    updateHealthBar() {
        if (!this.element) return;
        const healthBar = this.element.querySelector('.unit-health-bar');
        if (healthBar) {
            const healthPercent = (this.currentHealth / this.maxHealth) * this.card.size;
            healthBar.setAttribute('width', Math.max(0, healthPercent));
        }
    }
    
    updatePosition() {
        if (this.element) {
            this.element.setAttribute('transform', `translate(${this.x}, ${this.y})`);
        }
    }
    
    showDamageNumber(x, y, damage) {
        const effectsContainer = document.getElementById('effects-container');
        if (!effectsContainer) return;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ff4444');
        text.setAttribute('font-size', '16');
        text.setAttribute('font-weight', 'bold');
        text.classList.add('damage-number');
        text.textContent = `-${damage}`;
        effectsContainer.appendChild(text);
        
        setTimeout(() => {
            if (text.parentNode) text.remove();
        }, 800);
    }
    
    destroy() {
        const effectsContainer = document.getElementById('effects-container');
        if (effectsContainer) {
            const color = this.isEnemy ? '#ff0055' : '#00f0ff';
            const effect = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            effect.innerHTML = `
                <circle cx="${this.x}" cy="${this.y}" r="10" fill="${color}" opacity="0.8">
                    <animate attributeName="r" from="10" to="35" dur="0.3s" fill="freeze"/>
                    <animate attributeName="opacity" from="0.8" to="0" dur="0.3s" fill="freeze"/>
                </circle>
            `;
            effectsContainer.appendChild(effect);
            setTimeout(() => {
                if (effect.parentNode) effect.remove();
            }, 300);
        }
        
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
    }
}

// ==================== PROJECTILE CLASS ====================
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
        const container = document.getElementById('projectiles-container');
        if (!container) return;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${this.x}, ${this.y})`);
        group.innerHTML = SVGGenerators.createProjectileSVG(this.isEnemy);
        container.appendChild(group);
        this.element = group;
    }
    
    update(deltaTime) {
        if (!this.target || this.target.currentHealth <= 0) {
            this.destroy();
            return false;
        }
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
            this.target.takeDamage(this.damage);
            this.showHitEffect();
            
            if (!this.isEnemy) {
                gameState.damageDealt += this.damage;
            }
            
            this.destroy();
            return false;
        }
        
        const speed = this.speed * deltaTime * 60;
        this.x += (dx / distance) * speed;
        this.y += (dy / distance) * speed;
        
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        if (this.element) {
            this.element.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${angle})`);
        }
        
        return true;
    }
    
    showHitEffect() {
        const effectsContainer = document.getElementById('effects-container');
        if (!effectsContainer || !this.target) return;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.target.x);
        text.setAttribute('y', this.target.y - 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ff4444');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.classList.add('damage-number');
        text.textContent = `-${this.damage}`;
        effectsContainer.appendChild(text);
        
        setTimeout(() => {
            if (text.parentNode) text.remove();
        }, 800);
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
    }
}

// ==================== AI OPPONENT ====================
class AIOpponent {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
        this.lastPlayTime = 0;
        this.playDelay = this.getBaseDelay();
        this.isThinking = false;
    }
    
    getBaseDelay() {
        switch (this.difficulty) {
            case 'easy': return 4000;
            case 'normal': return 2500;
            case 'hard': return 1500;
            default: return 2500;
        }
    }
    
    update() {
        if (this.isThinking || !gameState.gameRunning) return;
        
        const now = Date.now();
        
        if (now - this.lastPlayTime >= this.playDelay && gameState.enemyElixir >= 2) {
            this.isThinking = true;
            
            setTimeout(() => {
                if (gameState.gameRunning) {
                    this.makePlay();
                }
                this.lastPlayTime = Date.now();
                this.playDelay = this.getBaseDelay() + (Math.random() * 2000 - 1000);
                this.isThinking = false;
            }, 300 + Math.random() * 400);
        }
    }
    
    makePlay() {
        const affordableCards = gameState.enemyDeck.filter(cardId => {
            return CARDS[cardId] && CARDS[cardId].cost <= gameState.enemyElixir;
        });
        
        if (affordableCards.length === 0) return;
        
        const playerUnits = gameState.units.filter(u => !u.isEnemy && u.currentHealth > 0);
        const enemyUnits = gameState.units.filter(u => u.isEnemy && u.currentHealth > 0);
        
        let cardToPlay = null;
        
        if (playerUnits.length > enemyUnits.length + 1) {
            cardToPlay = this.selectDefensiveCard(affordableCards);
        } else if (gameState.enemyTowerHealth > gameState.playerTowerHealth * 1.3) {
            cardToPlay = this.selectOffensiveCard(affordableCards);
        } else {
            cardToPlay = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        }
        
        if (cardToPlay && CARDS[cardToPlay]) {
            const card = CARDS[cardToPlay];
            const unit = new Unit(cardToPlay, true);
            gameState.units.push(unit);
            gameState.enemyElixir -= card.cost;
        }
    }
    
    selectDefensiveCard(affordableCards) {
        const defensiveCards = affordableCards.filter(id => {
            const card = CARDS[id];
            return card && card.health >= 200;
        });
        
        if (defensiveCards.length > 0) {
            return defensiveCards[Math.floor(Math.random() * defensiveCards.length)];
        }
        return affordableCards[Math.floor(Math.random() * affordableCards.length)];
    }
    
    selectOffensiveCard(affordableCards) {
        const offensiveCards = affordableCards.filter(id => {
            const card = CARDS[id];
            return card && (card.damage >= 40 || card.moveSpeed >= 2.5);
        });
        
        if (offensiveCards.length > 0) {
            return offensiveCards[Math.floor(Math.random() * offensiveCards.length)];
        }
        return affordableCards[Math.floor(Math.random() * affordableCards.length)];
    }
}

// ==================== MULTIPLAYER MANAGER ====================
class MultiplayerManager {
    constructor() {
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        this.pollInterval = null;
    }
    
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    async createRoom() {
        try {
            gameState.isHost = true;
            gameState.roomCode = this.generateRoomCode();
            
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
            
            const roomCodeEl = document.getElementById('room-code');
            const roomDisplayEl = document.getElementById('room-code-display');
            if (roomCodeEl) roomCodeEl.textContent = gameState.roomCode;
            if (roomDisplayEl) roomDisplayEl.classList.remove('hidden');
            
            this.updateConnectionStatus('Waiting for opponent...', 'waiting');
            this.pollForAnswer();
        } catch (error) {
            console.error('Create room error:', error);
            Popup.error('Connection Error', 'Failed to create room. Please try again.');
        }
    }
    
    pollForAnswer() {
        this.pollInterval = setInterval(async () => {
            const roomData = localStorage.getItem(`room_${gameState.roomCode}_answer`);
            if (roomData) {
                try {
                    const { answer } = JSON.parse(roomData);
                    await gameState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    clearInterval(this.pollInterval);
                    this.updateConnectionStatus('Connected!', 'connected');
                    setTimeout(() => startMultiplayerGame(), 1500);
                } catch (error) {
                    console.error('Error setting remote description:', error);
                }
            }
        }, 1000);
    }
    
    async joinRoom(roomCode) {
        try {
            gameState.isHost = false;
            gameState.roomCode = roomCode;
            
            const roomData = localStorage.getItem(`room_${roomCode}`);
            if (!roomData) {
                Popup.error('Room Not Found', 'The room code you entered does not exist.');
                return;
            }
            
            const { offer, timestamp } = JSON.parse(roomData);
            
            if (Date.now() - timestamp > 300000) {
                Popup.error('Room Expired', 'This room has expired.');
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
            
            this.updateConnectionStatus('Connected!', 'connected');
            setTimeout(() => startMultiplayerGame(), 1500);
        } catch (error) {
            console.error('Join room error:', error);
            Popup.error('Connection Error', 'Failed to join room.');
        }
    }
    
    setupDataChannel() {
        if (!gameState.dataChannel) return;
        
        gameState.dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                console.error('Message parse error:', e);
            }
        };
        
        gameState.dataChannel.onclose = () => {
            if (gameState.gameRunning) {
                Popup.warning('Disconnected', 'Your opponent has disconnected.');
                endGame('victory');
            }
        };
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'spawn':
                if (CARDS[data.cardId]) {
                    const unit = new Unit(data.cardId, true);
                    gameState.units.push(unit);
                }
                break;
            case 'towerDamage':
                gameState.playerTowerHealth = data.health;
                updateTowerHealth();
                break;
        }
    }
    
    sendSpawn(cardId) {
        if (gameState.dataChannel?.readyState === 'open') {
            gameState.dataChannel.send(JSON.stringify({ type: 'spawn', cardId }));
        }
    }
    
    updateConnectionStatus(message, state) {
        const statusContainer = document.getElementById('connection-status');
        if (!statusContainer) return;
        
        const statusText = statusContainer.querySelector('.status-text');
        if (statusText) statusText.textContent = message;
        statusContainer.className = `status-container ${state}`;
    }
    
    cleanup() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        
        if (gameState.dataChannel) {
            try { gameState.dataChannel.close(); } catch (e) {}
        }
        
        if (gameState.peerConnection) {
            try { gameState.peerConnection.close(); } catch (e) {}
        }
        
        if (gameState.roomCode) {
            localStorage.removeItem(`room_${gameState.roomCode}`);
            localStorage.removeItem(`room_${gameState.roomCode}_answer`);
        }
        
        gameState.peerConnection = null;
        gameState.dataChannel = null;
        gameState.roomCode = null;
    }
}

const multiplayerManager = new MultiplayerManager();

// ==================== HELPER FUNCTION FOR SAFE EVENT BINDING ====================
function safeAddEventListener(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(event, handler);
        return true;
    } else {
        console.warn(`Element not found: ${id}`);
        return false;
    }
}

// ==================== GAME FUNCTIONS ====================
function initGame() {
    console.log('Initializing game...');
    
    // Clear any existing game state artifacts
    clearArena();
    
    setupEventListeners();
    loadDeck();
    loadStats();
    
    // Only render cards if we're on deck builder
    if (document.getElementById('all-cards')) {
        renderAllCards();
        renderSelectedDeck();
    }
    
    console.log('Game initialized successfully!');
}

function setupEventListeners() {
    // Main menu buttons
    safeAddEventListener('vs-computer-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('VS Computer clicked');
        gameState.mode = 'computer';
        startGame();
    });
    
    safeAddEventListener('multiplayer-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Multiplayer clicked');
        showScreen('multiplayer-lobby');
    });
    
    safeAddEventListener('deck-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Deck clicked');
        showScreen('deck-builder');
        renderAllCards();
        renderSelectedDeck();
    });
    
    // Multiplayer lobby
    safeAddEventListener('create-room-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        multiplayerManager.createRoom();
    });
    
    safeAddEventListener('join-room-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('join-code-input');
        if (input) {
            const code = input.value.toUpperCase().trim();
            if (code.length === 6) {
                multiplayerManager.joinRoom(code);
            } else {
                Popup.warning('Invalid Code', 'Please enter a valid 6-character room code.');
            }
        }
    });
    
    const joinInput = document.getElementById('join-code-input');
    if (joinInput) {
        joinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }
    
    safeAddEventListener('copy-code-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gameState.roomCode) {
            navigator.clipboard.writeText(gameState.roomCode).then(() => {
                Popup.success('Copied!', 'Room code copied to clipboard.');
            }).catch(() => {
                Popup.info('Room Code', `Your room code is: ${gameState.roomCode}`);
            });
        }
    });
    
    safeAddEventListener('lobby-back-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        multiplayerManager.cleanup();
        const roomDisplay = document.getElementById('room-code-display');
        if (roomDisplay) roomDisplay.classList.add('hidden');
        showScreen('main-menu');
    });
    
    // Deck builder
    safeAddEventListener('save-deck-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveDeck();
    });
    
    safeAddEventListener('deck-back-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreen('main-menu');
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderAllCards(e.target.dataset.filter);
        });
    });
    
    // Game controls
    safeAddEventListener('pause-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePause();
    });
    
    safeAddEventListener('menu-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gameState.gameRunning) {
            gameState.gamePaused = true;
            const pauseOverlay = document.getElementById('pause-overlay');
            if (pauseOverlay) pauseOverlay.classList.remove('hidden');
        }
    });
    
    safeAddEventListener('resume-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        gameState.gamePaused = false;
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
    });
    
    safeAddEventListener('quit-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Popup.confirm('Quit Game?', 'Are you sure you want to quit?', () => {
            endGame('defeat');
        });
    });
    
    // Deploy overlay
    safeAddEventListener('deploy-overlay', 'click', handleDeployClick);
    
    // Touch support for deploy
    const deployOverlay = document.getElementById('deploy-overlay');
    if (deployOverlay) {
        deployOverlay.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            handleDeployClick({ clientX: touch.clientX, clientY: touch.clientY });
        });
    }
    
    // Game over buttons
    safeAddEventListener('play-again-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gameState.mode === 'computer') {
            startGame();
        } else {
            showScreen('multiplayer-lobby');
        }
    });
    
    safeAddEventListener('main-menu-btn', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        multiplayerManager.cleanup();
        clearArena();
        showScreen('main-menu');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
}

function handleDeployClick(e) {
    if (!gameState.gameRunning || gameState.gamePaused || !gameState.selectedCard) return;
    
    const arena = document.getElementById('arena-svg');
    if (!arena) return;
    
    const rect = arena.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const scaleX = 1200 / rect.width;
    const gameX = x * scaleX;
    
    if (gameX < 600) {
        deploySelectedCard();
    } else {
        Popup.warning('Invalid Position', 'Deploy units on your side!');
    }
}

function handleKeyDown(e) {
    if (gameState.screen !== 'game-arena' || !gameState.gameRunning) return;
    
    if (e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (gameState.playerHand[index]) {
            selectCard(gameState.playerHand[index]);
        }
    }
    
    if (e.key === ' ' && gameState.selectedCard) {
        e.preventDefault();
        deploySelectedCard();
    }
    
    if (e.key === 'Escape') {
        gameState.selectedCard = null;
        renderPlayerHand();
    }
    
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
}

function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    
    // If leaving game arena, clear it
    if (gameState.screen === 'game-arena' && screenId !== 'game-arena') {
        clearArena();
    }
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    gameState.screen = screenId;
}

function clearArena() {
    // Stop game loop
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Clear intervals
    if (elixirInterval) {
        clearInterval(elixirInterval);
        elixirInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Clear SVG containers
    const containers = ['units-container', 'projectiles-container', 'effects-container'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // Clear game state arrays
    gameState.units = [];
    gameState.projectiles = [];
}

function loadDeck() {
    try {
        const savedDeck = localStorage.getItem('playerDeck');
        if (savedDeck) {
            const parsed = JSON.parse(savedDeck);
            if (Array.isArray(parsed) && parsed.length === 5 && parsed.every(id => CARDS[id])) {
                gameState.playerDeck = parsed;
            }
        }
    } catch (e) {
        console.error('Error loading deck:', e);
    }
}

function loadStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
        const winsEl = document.getElementById('menu-wins');
        const gamesEl = document.getElementById('menu-games');
        if (winsEl) winsEl.textContent = `${stats.wins || 0} Wins`;
        if (gamesEl) gamesEl.textContent = `${stats.gamesPlayed || 0} Games`;
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

function saveDeck() {
    if (gameState.playerDeck.length !== 5) {
        Popup.warning('Incomplete Deck', 'Your deck must contain exactly 5 cards.');
        return;
    }
    
    localStorage.setItem('playerDeck', JSON.stringify(gameState.playerDeck));
    Popup.success('Deck Saved!', 'Your deck has been saved successfully.');
}

function renderAllCards(filter = 'all') {
    const container = document.getElementById('all-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(CARDS).forEach(card => {
        if (filter !== 'all' && card.type !== filter) return;
        
        const cardElement = createCardElement(card);
        cardElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCardInDeck(card.id);
        });
        
        if (gameState.playerDeck.includes(card.id)) {
            cardElement.classList.add('in-deck');
        }
        
        container.appendChild(cardElement);
    });
}

function renderSelectedDeck() {
    const slots = document.querySelectorAll('#selected-cards .card-slot');
    if (!slots.length) return;
    
    slots.forEach((slot, index) => {
        slot.innerHTML = '';
        slot.classList.remove('filled');
        slot.classList.add('empty');
        
        if (gameState.playerDeck[index]) {
            const card = CARDS[gameState.playerDeck[index]];
            if (card) {
                const cardElement = createCardElement(card);
                cardElement.style.width = '100%';
                cardElement.style.height = '100%';
                cardElement.style.margin = '0';
                cardElement.style.borderRadius = '8px';
                cardElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCardInDeck(card.id);
                });
                
                slot.appendChild(cardElement);
                slot.classList.remove('empty');
                slot.classList.add('filled');
            }
        } else {
            slot.innerHTML = `
                <svg viewBox="0 0 24 24" class="slot-icon" style="width: 24px; height: 24px; opacity: 0.3; stroke: #00d4ff;">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
        }
    });
    
    const deckCount = document.getElementById('deck-count');
    if (deckCount) deckCount.textContent = gameState.playerDeck.length;
    
    updateDeckStats();
}

function updateDeckStats() {
    const avgCostEl = document.getElementById('avg-cost');
    const totalHpEl = document.getElementById('total-hp');
    
    if (gameState.playerDeck.length === 0) {
        if (avgCostEl) avgCostEl.textContent = '0';
        if (totalHpEl) totalHpEl.textContent = '0';
        return;
    }
    
    let totalCost = 0;
    let totalHP = 0;
    
    gameState.playerDeck.forEach(cardId => {
        const card = CARDS[cardId];
        if (card) {
            totalCost += card.cost;
            totalHP += card.health;
        }
    });
    
    if (avgCostEl) avgCostEl.textContent = (totalCost / gameState.playerDeck.length).toFixed(1);
    if (totalHpEl) totalHpEl.textContent = totalHP;
}

function toggleCardInDeck(cardId) {
    const index = gameState.playerDeck.indexOf(cardId);
    
    if (index > -1) {
        gameState.playerDeck.splice(index, 1);
    } else if (gameState.playerDeck.length < 5) {
        gameState.playerDeck.push(cardId);
    } else {
        Popup.warning('Deck Full', 'Remove a card first.');
        return;
    }
    
    const activeFilter = document.querySelector('.filter-btn.active');
    renderAllCards(activeFilter?.dataset.filter || 'all');
    renderSelectedDeck();
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

function startGame() {
    console.log('Starting game...');
    
    clearArena();
    resetGameState();
    showScreen('game-arena');
    
    gameState.mode = 'computer';
    gameState.gameRunning = true;
    
    aiOpponent = new AIOpponent('normal');
    
    setupPlayerHand();
    updateElixirBar();
    updateTowerHealth();
    updateTimerDisplay();
    
    lastFrameTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
    
    startElixirRegen();
    startTimer();
    
    console.log('Game started!');
}

function startMultiplayerGame() {
    clearArena();
    resetGameState();
    showScreen('game-arena');
    
    gameState.mode = 'multiplayer';
    gameState.gameRunning = true;
    
    setupPlayerHand();
    updateElixirBar();
    updateTowerHealth();
    updateTimerDisplay();
    
    lastFrameTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
    
    startElixirRegen();
    startTimer();
}

function resetGameState() {
    gameState.gameRunning = false;
    gameState.gamePaused = false;
    gameState.timeRemaining = CONFIG.GAME_DURATION;
    gameState.playerElixir = 5;
    gameState.playerTowerHealth = CONFIG.TOWER_HEALTH;
    gameState.enemyElixir = 5;
    gameState.enemyTowerHealth = CONFIG.TOWER_HEALTH;
    gameState.units = [];
    gameState.projectiles = [];
    gameState.unitsDeployed = 0;
    gameState.damageDealt = 0;
    gameState.selectedCard = null;
    gameState.playerHand = [];
    gameState.lastPlayerTowerAttack = 0;
    gameState.lastEnemyTowerAttack = 0;
    
    // Reset tower visuals
    const playerTower = document.getElementById('player-tower');
    const enemyTower = document.getElementById('enemy-tower');
    if (playerTower) playerTower.style.opacity = '1';
    if (enemyTower) enemyTower.style.opacity = '1';
    
    // Hide pause overlay
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');
}

function setupPlayerHand() {
    gameState.playerHand = [...gameState.playerDeck];
    renderPlayerHand();
}

function renderPlayerHand() {
    const container = document.getElementById('cards-in-hand');
    if (!container) return;
    
    container.innerHTML = '';
    
    gameState.playerHand.forEach(cardId => {
        const card = CARDS[cardId];
        if (!card) return;
        
        const cardElement = createCardElement(card, true);
        
        if (card.cost > gameState.playerElixir) {
            cardElement.classList.add('disabled');
        }
        
        if (gameState.selectedCard === cardId) {
            cardElement.classList.add('selected');
        }
        
        cardElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectCard(cardId);
        });
        
        cardElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            selectCard(cardId);
        });
        
        container.appendChild(cardElement);
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

function deploySelectedCard() {
    if (!gameState.selectedCard) return;
    
    const card = CARDS[gameState.selectedCard];
    if (!card || card.cost > gameState.playerElixir) {
        gameState.selectedCard = null;
        renderPlayerHand();
        return;
    }
    
    const unit = new Unit(gameState.selectedCard, false);
    gameState.units.push(unit);
    
    gameState.playerElixir -= card.cost;
    updateElixirBar();
    
    gameState.unitsDeployed++;
    
    if (gameState.mode === 'multiplayer') {
        multiplayerManager.sendSpawn(gameState.selectedCard);
    }
    
    gameState.selectedCard = null;
    renderPlayerHand();
}

function gameLoop(currentTime) {
    if (!gameState.gameRunning) return;
    
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTime;
    
    if (!gameState.gamePaused) {
        if (gameState.mode === 'computer' && aiOpponent) {
            aiOpponent.update();
        }
        
        gameState.units = gameState.units.filter(unit => {
            if (unit.currentHealth <= 0) return false;
            return unit.update(deltaTime, gameState.units);
        });
        
        gameState.projectiles = gameState.projectiles.filter(projectile => {
            return projectile.update(deltaTime);
        });
        
        updateTowerAttacks();
        checkGameEnd();
    }
    
    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateTowerAttacks() {
    const now = Date.now();
    
    if (now - gameState.lastPlayerTowerAttack >= CONFIG.TOWER_ATTACK_SPEED * 1000) {
        const enemyInRange = gameState.units.find(u => 
            u.isEnemy && 
            u.currentHealth > 0 && 
            Math.abs(u.x - CONFIG.PLAYER_TOWER_X) <= CONFIG.TOWER_ATTACK_RANGE
        );
        
        if (enemyInRange) {
            gameState.lastPlayerTowerAttack = now;
            const projectile = new TowerProjectile(CONFIG.PLAYER_TOWER_X + 35, 150, enemyInRange, CONFIG.TOWER_DAMAGE, false);
            gameState.projectiles.push(projectile);
        }
    }
    
    if (now - gameState.lastEnemyTowerAttack >= CONFIG.TOWER_ATTACK_SPEED * 1000) {
        const playerInRange = gameState.units.find(u => 
            !u.isEnemy && 
            u.currentHealth > 0 && 
            Math.abs(u.x - CONFIG.ENEMY_TOWER_X) <= CONFIG.TOWER_ATTACK_RANGE
        );
        
        if (playerInRange) {
            gameState.lastEnemyTowerAttack = now;
            const projectile = new TowerProjectile(CONFIG.ENEMY_TOWER_X + 35, 150, playerInRange, CONFIG.TOWER_DAMAGE, true);
            gameState.projectiles.push(projectile);
        }
    }
}

class TowerProjectile extends Projectile {
    constructor(x, y, target, damage, isEnemyTower) {
        super(x, y, target, damage, isEnemyTower);
        this.speed = 12;
    }
    
    createSVGElement() {
        const container = document.getElementById('projectiles-container');
        if (!container) return;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${this.x}, ${this.y})`);
        
        const color = this.isEnemy ? '#ff0055' : '#00f0ff';
        group.innerHTML = `
            <g class="projectile">
                <circle cx="0" cy="0" r="6" fill="${color}" opacity="0.9"/>
                <circle cx="0" cy="0" r="3" fill="white"/>
            </g>
        `;
        container.appendChild(group);
        this.element = group;
    }
}

function startElixirRegen() {
    if (elixirInterval) clearInterval(elixirInterval);
    
    elixirInterval = setInterval(() => {
        if (gameState.gameRunning && !gameState.gamePaused) {
            if (gameState.playerElixir < CONFIG.MAX_ELIXIR) {
                gameState.playerElixir = Math.min(CONFIG.MAX_ELIXIR, gameState.playerElixir + CONFIG.ELIXIR_REGEN_RATE);
                updateElixirBar();
                renderPlayerHand();
            }
            
            if (gameState.mode === 'computer' && gameState.enemyElixir < CONFIG.MAX_ELIXIR) {
                gameState.enemyElixir = Math.min(CONFIG.MAX_ELIXIR, gameState.enemyElixir + CONFIG.ELIXIR_REGEN_RATE);
            }
        }
    }, 1000);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (gameState.gameRunning && !gameState.gamePaused) {
            gameState.timeRemaining--;
            updateTimerDisplay();
            
            if (gameState.timeRemaining <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerText = document.getElementById('timer-text');
    if (!timerText) return;
    
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (gameState.timeRemaining <= 30) {
        timerText.setAttribute('fill', '#ff5555');
    } else if (gameState.timeRemaining <= 60) {
        timerText.setAttribute('fill', '#ffaa00');
    } else {
        timerText.setAttribute('fill', '#00d4ff');
    }
}

function updateElixirBar() {
    const fill = document.getElementById('elixir-fill');
    const text = document.getElementById('elixir-text');
    
    if (fill) {
        const percentage = (gameState.playerElixir / CONFIG.MAX_ELIXIR) * 100;
        fill.style.width = `${percentage}%`;
    }
    
    if (text) {
        text.textContent = `${Math.floor(gameState.playerElixir)}/${CONFIG.MAX_ELIXIR}`;
    }
}

function updateTowerHealth() {
    const playerBar = document.getElementById('player-tower-health');
    const enemyBar = document.getElementById('enemy-tower-health');
    const playerText = document.getElementById('player-health-text');
    const enemyText = document.getElementById('enemy-health-text');
    
    const playerPercent = (gameState.playerTowerHealth / CONFIG.TOWER_HEALTH) * 100;
    const enemyPercent = (gameState.enemyTowerHealth / CONFIG.TOWER_HEALTH) * 100;
    
    if (playerBar) playerBar.style.width = `${Math.max(0, playerPercent)}%`;
    if (enemyBar) enemyBar.style.width = `${Math.max(0, enemyPercent)}%`;
    if (playerText) playerText.textContent = Math.max(0, Math.floor(gameState.playerTowerHealth));
    if (enemyText) enemyText.textContent = Math.max(0, Math.floor(gameState.enemyTowerHealth));
    
    // Visual feedback on towers
    const playerTower = document.getElementById('player-tower');
    const enemyTower = document.getElementById('enemy-tower');
    
    if (playerTower) {
        if (gameState.playerTowerHealth <= 0) {
            playerTower.style.opacity = '0.3';
        } else if (gameState.playerTowerHealth < CONFIG.TOWER_HEALTH * 0.3) {
            playerTower.style.opacity = '0.6';
        }
    }
    
    if (enemyTower) {
        if (gameState.enemyTowerHealth <= 0) {
            enemyTower.style.opacity = '0.3';
        } else if (gameState.enemyTowerHealth < CONFIG.TOWER_HEALTH * 0.3) {
            enemyTower.style.opacity = '0.6';
        }
    }
}

function togglePause() {
    if (!gameState.gameRunning) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
        if (gameState.gamePaused) {
            pauseOverlay.classList.remove('hidden');
        } else {
            pauseOverlay.classList.add('hidden');
        }
    }
}

function checkGameEnd() {
    if (gameState.playerTowerHealth <= 0) {
        endGame('defeat');
    } else if (gameState.enemyTowerHealth <= 0) {
        endGame('victory');
    }
}

function endGame(result = null) {
    gameState.gameRunning = false;
    
    // Stop loops
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    if (elixirInterval) {
        clearInterval(elixirInterval);
        elixirInterval = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Determine result
    if (!result) {
        if (gameState.playerTowerHealth > gameState.enemyTowerHealth) {
            result = 'victory';
        } else if (gameState.enemyTowerHealth > gameState.playerTowerHealth) {
            result = 'defeat';
        } else {
            result = 'draw';
        }
    }
    
    saveGameStats(result === 'victory');
    
    // Update game over screen
    const resultText = document.getElementById('result-text');
    if (resultText) {
        resultText.textContent = result.toUpperCase() + '!';
        resultText.className = result;
    }
    
    const statUnits = document.getElementById('stat-units');
    const statDamage = document.getElementById('stat-damage');
    const statTowerHp = document.getElementById('stat-tower-hp');
    
    if (statUnits) statUnits.textContent = gameState.unitsDeployed;
    if (statDamage) statDamage.textContent = gameState.damageDealt;
    if (statTowerHp) statTowerHp.textContent = Math.max(0, Math.floor(gameState.playerTowerHealth));
    
    setTimeout(() => {
        clearArena();
        showScreen('game-over');
    }, 1500);
}

function saveGameStats(won) {
    try {
        const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
        stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
        if (won) {
            stats.wins = (stats.wins || 0) + 1;
        }
        stats.totalDamage = (stats.totalDamage || 0) + gameState.damageDealt;
        stats.totalUnits = (stats.totalUnits || 0) + gameState.unitsDeployed;
        
        localStorage.setItem('gameStats', JSON.stringify(stats));
    } catch (e) {
        console.error('Error saving stats:', e);
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearArena();
    multiplayerManager.cleanup();
});