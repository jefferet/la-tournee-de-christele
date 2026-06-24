import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, CHRISTELE } from '../config/constants.js'
import { state } from '../utils/stateManager.js'

/**
 * ChristeleLegacy — LEGACY / DEAD CODE.
 *
 * This is the old player class kept for historical reference after the
 * rename Sophie → Christele. It is NOT imported anywhere in the project
 * (the active class is `Christele` in `./Christele.js`).
 *
 * DO NOT import or use. Safe to delete manually if you want.
 */
export class ChristeleLegacy extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'christele', 0)
    this.scene = scene
    this.setOrigin(0.5, 0.5)

    this.hp = CHRISTELE.MAX_HP
    this.maxHp = CHRISTELE.MAX_HP
    this.speed = CHRISTELE.SPEED
    this.alive = true
    this.facing = 'right'
    this.lastMoveDir = { x: 1, y: 0 }

    // Dash state
    this.isDashing = false
    this.dashTime = 0
    this.dashAfterglow = 0  // residual transparency after dash ends
    this.dashDir = { x: 0, y: 0 }

    // Walk animation
    this.walkTime = 0
    this.walkFrame = 0
    this.isMoving = false

    // Input vec
    this.moveVec = { x: 0, y: 0 }

    // Cooldowns (timestamps in ms)
    this.lastDashAt = -Infinity
    this.lastFireAt = -Infinity
    this.lastHealAt = -Infinity

    // === Input state (event.code based) ===
    // Continuous: true while key is held
    // JustPressed: true for one frame when key is first pressed
    this.inputState = {
      up: false, down: false, left: false, right: false,
      fire: false, dash: false, heal: false,
      fireJustPressed: false, dashJustPressed: false, healJustPressed: false,
    }

    this._setupInputs()

    // Physics
    scene.physics.add.existing(this)
    this.body.setSize(CHRISTELE.HITBOX_W, CHRISTELE.HITBOX_H)
    this.body.setCollideWorldBounds(true)
    this.body.setDrag(800, 800)
  }

  // === Input setup ===

  _setupInputs() {
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this.scene.input.keyboard.on('keydown', this._onKeyDown)
    this.scene.input.keyboard.on('keyup', this._onKeyUp)
  }

  _onKeyDown(event) {
    // Debug log for development
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log('[Christele] keydown:', event.code)
    }

    switch (event.code) {
      // === Movement (continuous) ===
      case 'KeyW': // QWERTY up
      case 'KeyZ': // AZERTY up
      case 'ArrowUp':
        this.inputState.up = true
        break
      case 'KeyS': // down (both layouts)
      case 'ArrowDown':
        this.inputState.down = true
        break
      case 'KeyA': // QWERTY left
      case 'KeyQ': // AZERTY left
      case 'ArrowLeft':
        this.inputState.left = true
        break
      case 'KeyD': // right (both layouts)
      case 'ArrowRight':
        this.inputState.right = true
        break

      // === Fire (continuous, auto-fire with cadence) ===
      case 'KeyF': // F = primary fire
      case 'KeyJ': // J = alt fire
        if (!this.inputState.fire) this.inputState.fireJustPressed = true
        this.inputState.fire = true
        break

      // === Dash (single press) ===
      case 'Space':
        if (!this.inputState.dash) this.inputState.dashJustPressed = true
        this.inputState.dash = true
        break

      // === Heal (single press) ===
      case 'ShiftLeft':
      case 'ShiftRight':
        if (!this.inputState.heal) this.inputState.healJustPressed = true
        this.inputState.heal = true
        break
    }
  }

  _onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'KeyZ':
      case 'ArrowUp':
        this.inputState.up = false
        break
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.down = false
        break
      case 'KeyA':
      case 'KeyQ':
      case 'ArrowLeft':
        this.inputState.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = false
        break
      case 'KeyF':
      case 'KeyJ':
        this.inputState.fire = false
        break
      case 'Space':
        this.inputState.dash = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.heal = false
        break
    }
  }

  // === Update ===

  update(time, delta) {
    if (!this.alive) return

    this._readInputs()
    this._updateDash(time, delta)
    this._updateFiring(time, delta)
    this._updateMovement()
    this._updateAnimation(time, delta)
  }

  // === Input reading ===

  _readInputs() {
    const moveX = (this.inputState.left ? -1 : 0) + (this.inputState.right ? 1 : 0)
    const moveY = (this.inputState.up ? -1 : 0) + (this.inputState.down ? 1 : 0)
    this.moveVec = { x: moveX, y: moveY }
    this.isMoving = moveX !== 0 || moveY !== 0

    // Edge-triggered actions
    if (this.inputState.dashJustPressed) this._tryDash()
    if (this.inputState.healJustPressed) this._tryHeal()

    // Reset just-pressed flags
    this.inputState.dashJustPressed = false
    this.inputState.healJustPressed = false
    this.inputState.fireJustPressed = false
  }

  // === Movement ===

  _updateMovement() {
    if (this.isDashing) return

    const { x, y } = this.moveVec
    if (x === 0 && y === 0) {
      this.body.setVelocity(0, 0)
      return
    }

    const len = Math.hypot(x, y)
    const nx = x / len
    const ny = y / len

    this.body.setVelocity(nx * this.speed, ny * this.speed)
    this.lastMoveDir = { x: nx, y: ny }
    this._updateFacing(nx, ny)
  }

  _updateFacing(nx, ny) {
    if (Math.abs(nx) > Math.abs(ny)) {
      this.facing = nx > 0 ? 'right' : 'left'
      this.setFlipX(nx < 0)
    } else {
      this.facing = ny > 0 ? 'down' : 'up'
    }
  }

  // === Dash ===

  _tryDash() {
    // eslint-disable-next-line no-console
    console.log('[Christele] _tryDash called. lastDashAt:', this.lastDashAt, 'now:', this.scene.time.now)
    const now = this.scene.time.now
    if (now - this.lastDashAt < CHRISTELE.DASH_COOLDOWN) {
      // eslint-disable-next-line no-console
      console.log('[Christele] Dash on cooldown, ignoring.')
      return
    }
    if (this.isDashing) {
      // eslint-disable-next-line no-console
      console.log('[Christele] Already dashing, ignoring.')
      return
    }

    this.lastDashAt = now
    this.isDashing = true
    this.dashTime = CHRISTELE.DASH_DURATION

    let dx = this.moveVec.x
    let dy = this.moveVec.y
    if (dx === 0 && dy === 0) {
      if (this.facing === 'right') { dx = 1; dy = 0 }
      else if (this.facing === 'left') { dx = -1; dy = 0 }
      else if (this.facing === 'up') { dx = 0; dy = -1 }
      else { dx = 0; dy = 1 }
    } else {
      const len = Math.hypot(dx, dy)
      dx /= len
      dy /= len
    }

    this.dashDir = { x: dx, y: dy }
    this.body.setVelocity(dx * CHRISTELE.DASH_SPEED, dy * CHRISTELE.DASH_SPEED)
    state.isInvincible = true

    this.setFrame(6)
    this.setAlpha(0.5)
    this.dashAfterglow = CHRISTELE.DASH_AFTERGLOW
    // eslint-disable-next-line no-console
    console.log('[Christele] DASH! dir:', dx, dy)
  }

  _updateDash(time, delta) {
    if (!this.isDashing) {
      // Handle afterglow (residual transparency after dash ends)
      if (this.dashAfterglow > 0) {
        this.dashAfterglow -= delta
        const t = Math.max(0, this.dashAfterglow / CHRISTELE.DASH_AFTERGLOW)
        this.setAlpha(0.5 + 0.5 * t)  // fade from 0.5 to 1.0
        if (this.dashAfterglow <= 0) {
          this.setAlpha(1)
        }
      }
      const now = this.scene.time.now
      state.dashOnCooldown = (now - this.lastDashAt) < CHRISTELE.DASH_COOLDOWN
      return
    }

    this.dashTime -= delta
    if (this.dashTime <= 0) {
      this.isDashing = false
      state.isInvincible = false
      // Don't reset alpha here — let _updateDash afterglow handle the fade
    }
  }

  // === Fire ===

  _updateFiring(time, delta) {
    if (!this.inputState.fire) return

    const now = this.scene.time.now
    const cooldownMs = 1000 / CHRISTELE.FIRE_RATE
    if (now - this.lastFireAt < cooldownMs) return

    this.lastFireAt = now
    this._fire()
  }

  _fire() {
    // Directional fire: in the direction Christele last moved (8 directions).
    // If not moving, fire in the direction she's facing.
    let dx = this.lastMoveDir.x
    let dy = this.lastMoveDir.y
    if (dx === 0 && dy === 0) {
      if (this.facing === 'right') { dx = 1; dy = 0 }
      else if (this.facing === 'left') { dx = -1; dy = 0 }
      else if (this.facing === 'up') { dx = 0; dy = -1 }
      else { dx = 0; dy = 1 }
    } else {
      const len = Math.hypot(dx, dy)
      dx /= len
      dy /= len
    }

    const offset = 16
    this.scene.fireSyringe(this.x + dx * offset, this.y + dy * offset, dx, dy)
  }

  // === Heal ===

  _tryHeal() {
    // eslint-disable-next-line no-console
    console.log('[Christele] _tryHeal called. hp:', this.hp, 'maxHp:', this.maxHp, 'cooldown left:', this.scene.time.now - this.lastHealAt, '/', CHRISTELE.HEAL_COOLDOWN)
    const now = this.scene.time.now
    if (now - this.lastHealAt < CHRISTELE.HEAL_COOLDOWN) {
      // eslint-disable-next-line no-console
      console.log('[Christele] Heal on cooldown, ignoring.')
      return
    }
    if (this.hp >= this.maxHp) {
      // eslint-disable-next-line no-console
      console.log('[Christele] HP already at max, heal has no effect.')
      return
    }
    this.lastHealAt = now
    this.hp = Math.min(this.maxHp, this.hp + Math.ceil(this.maxHp * CHRISTELE.HEAL_AMOUNT))
    // eslint-disable-next-line no-console
    console.log('[Christele] HEAL! new hp:', this.hp)
  }

  // === Animation ===

  _updateAnimation(time, delta) {
    if (this.isDashing) {
      this.setFrame(6)
      return
    }

    if (!this.isMoving) {
      this.setFrame(0)
      return
    }

    this.walkTime += delta
    const cycleSpeed = 180
    if (this.walkTime > cycleSpeed) {
      this.walkTime = 0
      this.walkFrame = (this.walkFrame + 1) % 4
    }
    this.setFrame(1 + this.walkFrame)
  }

  // === Damage ===

  takeDamage(amount) {
    if (!this.alive) return
    if (state.isInvincible) return
    this.hp -= amount
    if (this.hp <= 0) {
      this._die()
    } else {
      this.scene.tweens.add({
        targets: this,
        alpha: 0.3,
        duration: 80,
        yoyo: true,
        repeat: 3,
      })
    }
  }

  _die() {
    this.alive = false
    this.body.setVelocity(0, 0)
    this.setFrame(0)
    this.setTint(0xff0000)
    // eslint-disable-next-line no-console
    console.log('[Christele] Dead. HP:', this.hp)
  }

  // === Cleanup ===

  destroy(fromScene) {
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown', this._onKeyDown)
      this.scene.input.keyboard.off('keyup', this._onKeyUp)
    }
    super.destroy(fromScene)
  }
}
