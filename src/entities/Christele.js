import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, CHRISTELE } from '../config/constants.js'
import { state } from '../utils/stateManager.js'
import { sfx } from '../audio/sfx.js'

/**
 * Christèle — the player character (extends Sprite for native Arcade Physics support).
 * Self-employed nurse defending her practice against falling INDUs.
 *
 * Input system uses event.code directly (not keyCodes) for max cross-platform
 * reliability. Supports both AZERTY (Z/Q/S/D) and QWERTY (W/A/S/D) layouts.
 */
export class Christele extends Phaser.GameObjects.Sprite {
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
    this.dashAfterglow = 0
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
    this.inputState = {
      up: false, down: false, left: false, right: false,
      fire: false, dash: false, heal: false,
      fireJustPressed: false, dashJustPressed: false, healJustPressed: false,
    }

    this._setupInputs()

    // Physics
    scene.physics.add.existing(this)
    // Christele sprite: 24x32 frame, origin (0.5, 0.5).
    // displayOriginX = 24*0.5 = 12, displayOriginY = 32*0.5 = 16.
    //
    // CRITICAL Phaser 3 formula (Body.updateFromGameObject):
    //   body.x = sprite.x + scaleX * (offset.x - displayOriginX)
    //   body.y = sprite.y + scaleY * (offset.y - displayOriginY)
    //
    // So offset is RELATIVE to the sprite's display origin, not the world!
    // The naive formula `offset = -bodyHalfSize` is WRONG — it makes the body
    // sit (displayOrigin) pixels off from the sprite.
    //
    // To center body on sprite: offset = displayOrigin - bodyHalfSize
    //   offset.x = 12 - 8 = 4
    //   offset.y = 16 - 14 = 2
    // To shift +1.5px right (so body covers visible content cols 6..21,
    // which is shifted 1.5px right of sprite center because of the chignon
    // and sacoche): offset.x = 4 + 2 = 6.
    this.body.setSize(CHRISTELE.SPRITE_W, CHRISTELE.SPRITE_H)
    // Body = sprite frame exactly (24x32). With offset (0, 0):
    //   body.x = sprite.x + 1*(0 - displayOriginX) = sprite.x - 12
    //   body.y = sprite.y + 1*(0 - displayOriginY) = sprite.y - 16
    // → Body covers the entire sprite frame, exactly aligned.
    this.body.setOffset(0, 0)
    this.body.setCollideWorldBounds(true)
    this.body.setDrag(800, 800)
  }

  _setupInputs() {
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this.scene.input.keyboard.on('keydown', this._onKeyDown)
    this.scene.input.keyboard.on('keyup', this._onKeyUp)
  }

  _onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'KeyZ':
      case 'ArrowUp':
        this.inputState.up = true
        break
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.down = true
        break
      case 'KeyA':
      case 'KeyQ':
      case 'ArrowLeft':
        this.inputState.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = true
        break
      case 'KeyF':
      case 'KeyJ':
        if (!this.inputState.fire) this.inputState.fireJustPressed = true
        this.inputState.fire = true
        break
      case 'Space':
        if (!this.inputState.dash) this.inputState.dashJustPressed = true
        this.inputState.dash = true
        break
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

  update(time, delta) {
    if (!this.alive) return

    this._readInputs()
    this._updateDash(time, delta)
    this._updateFiring(time, delta)
    this._updateMovement()
    this._updateAnimation(time, delta)
  }

  _readInputs() {
    const moveX = (this.inputState.left ? -1 : 0) + (this.inputState.right ? 1 : 0)
    const moveY = (this.inputState.up ? -1 : 0) + (this.inputState.down ? 1 : 0)
    this.moveVec = { x: moveX, y: moveY }
    this.isMoving = moveX !== 0 || moveY !== 0

    if (this.inputState.dashJustPressed) this._tryDash()
    if (this.inputState.healJustPressed) this._tryHeal()

    this.inputState.dashJustPressed = false
    this.inputState.healJustPressed = false
    this.inputState.fireJustPressed = false
  }

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

  _tryDash() {
    const now = this.scene.time.now
    if (now - this.lastDashAt < CHRISTELE.DASH_COOLDOWN) return
    if (this.isDashing) return

    this.lastDashAt = now
    this.isDashing = true
    this.dashTime = CHRISTELE.DASH_DURATION
    sfx.play('dash')

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
  }

  _updateDash(time, delta) {
    if (!this.isDashing) {
      if (this.dashAfterglow > 0) {
        this.dashAfterglow -= delta
        const t = Math.max(0, this.dashAfterglow / CHRISTELE.DASH_AFTERGLOW)
        this.setAlpha(0.5 + 0.5 * t)
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
    }
  }

  _updateFiring(time, delta) {
    if (!this.inputState.fire) return

    const now = this.scene.time.now
    const cooldownMs = 1000 / CHRISTELE.FIRE_RATE
    if (now - this.lastFireAt < cooldownMs) return

    this.lastFireAt = now
    this._fire()
  }

  _fire() {
    // Directional fire
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

  _tryHeal() {
    const now = this.scene.time.now
    if (now - this.lastHealAt < CHRISTELE.HEAL_COOLDOWN) return
    if (this.hp >= this.maxHp) return
    this.lastHealAt = now
    this.hp = Math.min(this.maxHp, this.hp + Math.ceil(this.maxHp * CHRISTELE.HEAL_AMOUNT))
    sfx.play('heal')
  }

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

  takeDamage(amount) {
    if (!this.alive) return
    if (state.isInvincible) return
    this.hp -= amount
    if (this.hp <= 0) {
      sfx.play('hit')
      this._die()
    } else {
      sfx.play('hit')
      this.scene.tweens.add({
        targets: this,
        alpha: 0.3,
        duration: 80,
        yoyo: true,
        repeat: 3,
      })
    }
  }

  /**
   * Returns the AABB hitbox used for entity-vs-entity collision.
   * Uses the sprite frame (24x32) — slightly larger than the visible
   * character (~16x28) to give a forgiving hitbox around the silhouette.
   * Computed from the entity's current position, so it's always at the
   * right place regardless of Phaser Arcade Physics quirks.
   */
  getHitbox() {
    return {
      x: this.x - 12,
      y: this.y - 16,
      width: 24,
      height: 32,
    }
  }

  _die() {
    this.alive = false
    this.body.setVelocity(0, 0)
    this.setFrame(0)
    this.setTint(0xff0000)
  }

  destroy(fromScene) {
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown', this._onKeyDown)
      this.scene.input.keyboard.off('keyup', this._onKeyUp)
    }
    super.destroy(fromScene)
  }
}
