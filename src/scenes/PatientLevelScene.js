import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, CHRISTELE, INITIAL_LIVES, MAX_LIVES } from '../config/constants.js'
import { state } from '../utils/stateManager.js'
import { Christele } from '../entities/Christele.js'
import { Syringe } from '../entities/projectiles/Syringe.js'
import { HUD } from '../ui/HUD.js'
import { Indus } from '../entities/enemies/Indus.js'
import { Patient } from '../entities/enemies/Patient.js'
import { CarteVitale } from '../entities/CarteVitale.js'

/**
 * Axis-Aligned Bounding Box overlap test.
 * Each box is {x, y, width, height} (top-left + size, in world coords).
 * Returns true iff the two boxes overlap (edges count as overlap).
 */
function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/**
 * PatientLevelScene — the mini-game.
 * Christèle is a self-employed nurse. The paperwork (INDUs) falls from the sky.
 * She must AVOID the indus (administrative documents, -1 HP each),
 * COLLECT the cartes vitales (health cards, +100 pts each),
 * and HEAL the patients (syringe on a horizontal walker, +50 pts each).
 */
export class PatientLevelScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PATIENT)
  }

  create() {
    console.log('[PatientLevelScene] Start mini-game')
    state.reset()
    state.lives = INITIAL_LIVES

    // Containers for the 3 entity types
    this.indus = []                // Falling indus (avoid)
    this.activeCarteVitales = []   // Falling cartes vitales (collect)
    this.patients = []             // Walking patients (shoot with syringe)
    this.projectiles = this.add.group()
    this.gameOver = false
    this.gameStartTime = this.time.now

    // Spawn timers
    this.lastIndusAt = 0
    this.lastCarteVitaleAt = 0
    this.lastPatientAt = 0
    this.indusInterval = 1800
    this.carteVitaleInterval = 4500
    this.patientInterval = 5500

    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'room_entrance')

    // Player
    this.christele = new Christele(this, GAME_WIDTH / 2, GAME_HEIGHT - 50)
    this.christele.hp = CHRISTELE.MAX_HP
    this.add.existing(this.christele)

    // HUD
    this.hud = new HUD(this)
    this.hud.setChristele(this.christele)
    this.add.existing(this.hud)

    // Title
    this.add.text(GAME_WIDTH / 2, 8, 'CHRISTÈLE CHASSE LES INDUS', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: COLORS.LIGHT_GRAY,
    }).setOrigin(0.5)

    // Floating score popups
    this.floatingTexts = []

    // === Collisions ===
    // NOTE: All entity-vs-entity collisions are now handled via custom AABB
    // checks in `_checkCollisions()` (called from update()). We no longer use
    // Phaser Arcade Physics overlap, which had scale/offset quirks that made
    // the hitboxes misaligned with the sprites. The Phaser body is kept on
    // Christèle (for movement + world bounds) and Syringe (for movement via
    // velocity) but is NOT used for collision detection.
    //
    // Each entity exposes a `getHitbox()` method returning {x, y, w, h} in
    // world coords, computed from the entity's current position so it's
    // always at the right place.

    // World bounds (Christèle only)
    this.christele.body.setCollideWorldBounds(true)

    // Menu key
    this.input.keyboard.on('keydown-M', () => {
      this.scene.start(SCENES.MENU)
    })

    // === DEBUG: toggle hitbox overlay (key B) ===
    this.debugHitboxes = false
    this.debugGraphics = this.add.graphics().setDepth(9999).setVisible(false)
    this.debugLegend = this.add.text(8, 28, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 4 },
    }).setDepth(9999).setVisible(false)
    this.input.keyboard.on('keydown-B', () => {
      this.debugHitboxes = !this.debugHitboxes
      this.debugGraphics.setVisible(this.debugHitboxes)
      this.debugLegend.setVisible(this.debugHitboxes)
      this.debugLegend.setText('B: hitboxes ON\nJaune=CHR\nRouge=INDU (trait fin = sprite)\nVert=CV\nCyan=PAT')
      console.log(`[DEBUG] Hitboxes ${this.debugHitboxes ? 'ON' : 'OFF'}`)
    })
  }

  fireSyringe(x, y, dirX, dirY) {
    const s = new Syringe(this, x, y, dirX, dirY)
    this.projectiles.add(s, true)
  }

  showFloatingText(x, y, text, color = '#ffffff') {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: color,
    }).setOrigin(0.5)
    this.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => t.destroy(),
    })
    this.floatingTexts.push(t)
  }

  update(time, delta) {
    if (this.gameOver) {
      // Wait for Yes/No choice via dialog buttons (no keyboard fallback here)
      return
    }

    // === Death check FIRST (before alive check, since _die() sets alive=false) ===
    if (this.christele && this.christele.hp <= 0) {
      this._onGameOver()
      return
    }

    // Skip update if Christele is gone or already dead
    if (!this.christele || !this.christele.alive) return

    this.christele.update(time, delta)
    this.hud.update()

    // === Spawn indus (60% of spawns, frequent) ===
    if (time - this.lastIndusAt > this.indusInterval) {
      this.lastIndusAt = time
      this._spawnIndus()
      this.indusInterval = Math.max(700, this.indusInterval * 0.97)
    }

    // === Spawn cartes vitales (less frequent) ===
    if (time - this.lastCarteVitaleAt > this.carteVitaleInterval) {
      this.lastCarteVitaleAt = time
      this._spawnCarteVitale()
    }

    // === Spawn patients (rare, horizontal) ===
    if (time - this.lastPatientAt > this.patientInterval) {
      this.lastPatientAt = time
      this._spawnPatient()
    }

    // === Update entities ===
    // Note: We DON'T filter() the arrays in-place (would break physics.overlap
    // which holds a reference to the array). We just skip dead entries.
    for (const e of this.indus) if (e && e.active && e.update) e.update(time, delta)
    for (const e of this.activeCarteVitales) if (e && e.active && e.update) e.update(time, delta)
    for (const e of this.patients) if (e && e.active && e.update) e.update(time, delta)

    // Update projectiles
    this.projectiles.children.iterate(p => {
      if (p && p.active) p.update(time, delta)
      return true
    })

    // === Custom AABB collisions (entity-vs-entity) ===
    this._checkCollisions()

    // === DEBUG: draw hitbox overlays ===
    if (this.debugHitboxes) {
      this._drawHitboxes()
    }
  }

  /**
   * Custom AABB collision checks between entities.
   * Each entity exposes getHitbox() → {x, y, width, height} in world coords.
   * We don't use Phaser Arcade Physics overlap because of scale/offset quirks
   * that misalign the hitboxes with the sprites.
   */
  _checkCollisions() {
    const ch = this.christele.getHitbox()

    // Christèle vs Indus
    for (const indus of this.indus) {
      if (!indus.alive) continue
      if (aabbOverlap(ch, indus.getHitbox())) {
        this._onChristeleHitIndus(this.christele, indus)
      }
    }

    // Christèle vs Cartes Vitales
    for (const cv of this.activeCarteVitales) {
      if (cv.collected) continue
      if (aabbOverlap(ch, cv.getHitbox())) {
        this._onCollectCarteVitale(this.christele, cv)
      }
    }

    // Syringes (projectiles) vs Patients
    for (const syringe of this.projectiles.children.entries) {
      if (!syringe.active) continue
      const sh = syringe.getHitbox()
      for (const patient of this.patients) {
        if (!patient.alive) continue
        if (aabbOverlap(sh, patient.getHitbox())) {
          this._onProjectileHealsPatient(syringe, patient)
          break  // syringe is destroyed, stop checking other patients
        }
      }
    }
  }

  _drawHitboxes() {
    const g = this.debugGraphics
    g.clear()

    // Christèle (yellow box) — uses Phaser body since Christèle has one
    if (this.christele && this.christele.body) {
      const b = this.christele.body
      g.lineStyle(2, 0xffff00, 1)
      g.strokeRect(b.x, b.y, b.width, b.height)
    }

    // All other entities use getHitbox() for the visual overlay
    // Indus (red box)
    for (const e of this.indus) {
      if (!e || !e.active || !e.alive) continue
      const h = e.getHitbox()
      g.lineStyle(2, 0xff0000, 1)
      g.strokeRect(h.x, h.y, h.width, h.height)
    }

    // Cartes vitales (green box)
    for (const e of this.activeCarteVitales) {
      if (!e || e.collected) continue
      const h = e.getHitbox()
      g.lineStyle(2, 0x00ff00, 1)
      g.strokeRect(h.x, h.y, h.width, h.height)
    }

    // Patients (cyan box)
    for (const e of this.patients) {
      if (!e || !e.alive) continue
      const h = e.getHitbox()
      g.lineStyle(2, 0x00ffff, 1)
      g.strokeRect(h.x, h.y, h.width, h.height)
    }

    // Projectiles / syringes (magenta box)
    for (const p of this.projectiles.children.entries) {
      if (!p || !p.active) continue
      const h = p.getHitbox()
      g.lineStyle(1, 0xff00ff, 1)
      g.strokeRect(h.x, h.y, h.width, h.height)
    }
  }

  // === SPAWN ===

  _spawnIndus() {
    // Spawn slightly off-screen so the 64x64 sprite doesn't pop in visibly
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40)
    const indus = new Indus(this, x, -48)
    this.add.existing(indus)
    this.indus.push(indus)
  }

  _spawnCarteVitale() {
    const x = Phaser.Math.Between(30, GAME_WIDTH - 30)
    const cv = new CarteVitale(this, x, -20)
    this.add.existing(cv)
    this.activeCarteVitales.push(cv)
  }

  _spawnPatient() {
    // Random direction: 1 (left to right) or -1 (right to left)
    const direction = Phaser.Math.Between(0, 1) === 0 ? 1 : -1
    const y = Phaser.Math.Between(GAME_HEIGHT - 130, GAME_HEIGHT - 50)
    const x = direction === 1 ? -20 : GAME_WIDTH + 20
    const patient = new Patient(this, x, y, direction)
    this.add.existing(patient)
    this.patients.push(patient)
  }

  // === COLLISIONS ===

  _onChristeleHitIndus(christele, indus) {
    if (!indus.alive) return
    if (this.christele.isDashing) return
    if (this.christele.alpha < 0.9) return
    this.christele.takeDamage(indus.damage)
    indus.die()
    // Remove from list
    const idx = this.indus.indexOf(indus)
    if (idx >= 0) this.indus.splice(idx, 1)
  }

  _onCollectCarteVitale(christele, cv) {
    if (cv.collected) return
    cv.collect()
    state.addScore(cv.scoreValue)
    this.showFloatingText(cv.x, cv.y, '+100', '#2ecc71')
  }

  _onProjectileHealsPatient(projectile, patient) {
    if (!patient.alive) return
    const killed = patient.takeDamage(projectile.damage)
    if (killed) {
      state.addScore(patient.scoreValue)
      this.showFloatingText(patient.x, patient.y, `+${patient.scoreValue}`, '#a0d8b3')
    }
    projectile.destroy()
  }

  // === GAME OVER ===

  _onGameOver() {
    this.gameOver = true
    this.physics.world.pause()

    const elapsed = Math.floor((this.time.now - this.gameStartTime) / 1000)
    const isHighScore = state.score > state.highScore
    if (isHighScore) state.highScore = state.score

    // === Dialog box UI (Container with all elements) ===
    const uiContainer = this.add.container(0, 0)

    // Dim overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65
    )
    overlay.setInteractive()  // Block clicks behind
    uiContainer.add(overlay)

    // Dialog box background
    const boxW = 280
    const boxH = 160
    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, boxW, boxH, 0x1a1a2e, 0.98)
    box.setStrokeStyle(2, 0xf1c40f)
    uiContainer.add(box)

    // Title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50,
      isHighScore ? '🏆 NOUVEAU HIGH SCORE !' : 'SUBMERSION ADMINISTRATIVE',
      {
        fontFamily: 'monospace', fontSize: '11px',
        color: isHighScore ? '#f1c40f' : '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5)
    uiContainer.add(title)

    // Score info
    const info = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22,
      `Score: ${state.score}   Temps: ${elapsed}s`,
      {
        fontFamily: 'monospace', fontSize: '10px',
        color: '#aaaaaa', align: 'center',
      }
    ).setOrigin(0.5)
    uiContainer.add(info)

    // Question
    const question = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5,
      'Une autre tournée ?',
      {
        fontFamily: 'monospace', fontSize: '11px',
        color: '#ffffff', align: 'center',
      }
    ).setOrigin(0.5)
    uiContainer.add(question)

    // === YES button ===
    const yesBtn = this.add.rectangle(GAME_WIDTH / 2 - 55, GAME_HEIGHT / 2 + 45, 80, 28, 0x27ae60)
    yesBtn.setStrokeStyle(2, 0xffffff)
    yesBtn.setInteractive({ useHandCursor: true })
    const yesText = this.add.text(GAME_WIDTH / 2 - 55, GAME_HEIGHT / 2 + 45, 'OUI', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5)
    uiContainer.add(yesBtn)
    uiContainer.add(yesText)

    yesBtn.on('pointerover', () => yesBtn.setFillStyle(0x2ecc71))
    yesBtn.on('pointerout', () => yesBtn.setFillStyle(0x27ae60))
    yesBtn.on('pointerdown', () => this._onYesNoChoice('yes'))

    // === NO button ===
    const noBtn = this.add.rectangle(GAME_WIDTH / 2 + 55, GAME_HEIGHT / 2 + 45, 80, 28, 0xc0392b)
    noBtn.setStrokeStyle(2, 0xffffff)
    noBtn.setInteractive({ useHandCursor: true })
    const noText = this.add.text(GAME_WIDTH / 2 + 55, GAME_HEIGHT / 2 + 45, 'NON', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', align: 'center',
    }).setOrigin(0.5)
    uiContainer.add(noBtn)
    uiContainer.add(noText)

    noBtn.on('pointerover', () => noBtn.setFillStyle(0xe74c3c))
    noBtn.on('pointerout', () => noBtn.setFillStyle(0xc0392b))
    noBtn.on('pointerdown', () => this._onYesNoChoice('no'))

    // === Keyboard shortcuts ===
    // Y or Space = Yes, N or Escape = No
    this.input.keyboard.once('keydown-Y', () => this._onYesNoChoice('yes'))
    this.input.keyboard.once('keydown-N', () => this._onYesNoChoice('no'))
    this.input.keyboard.once('keydown-SPACE', () => this._onYesNoChoice('yes'))
    this.input.keyboard.once('keydown-ESC', () => this._onYesNoChoice('no'))

    // Hint at bottom
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 85,
      'Y / ESPACE = OUI     N / ESC = NON',
      {
        fontFamily: 'monospace', fontSize: '7px', color: '#666666', align: 'center',
      }
    ).setOrigin(0.5)
    uiContainer.add(hint)

    this.gameOverUI = uiContainer
  }

  _onYesNoChoice(choice) {
    // Clean up UI
    if (this.gameOverUI) {
      this.gameOverUI.destroy(true)
      this.gameOverUI = null
    }
    // Remove any lingering keyboard listeners
    this.input.keyboard.removeAllListeners('keydown-Y')
    this.input.keyboard.removeAllListeners('keydown-N')
    this.input.keyboard.removeAllListeners('keydown-SPACE')
    this.input.keyboard.removeAllListeners('keydown-ESC')

    this.physics.world.resume()

    if (choice === 'yes') {
      // Restart with a fresh game
      this.scene.restart()
    } else {
      // Back to menu
      this.scene.start(SCENES.MENU)
    }
  }
}
