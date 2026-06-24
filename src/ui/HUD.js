import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CHRISTELE } from '../config/constants.js'
import { state } from '../utils/stateManager.js'
import { sfx, isMuted, setMuted } from '../audio/sfx.js'

/**
 * HUD — heads-up display.
 * Top-left: lives (croissants) — bound to christele.hp.
 * Top-center: timer.
 * Top-right: SCORE + high score.
 * Bottom-center: dash cooldown bar.
 */
export class HUD extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0)
    this.scene = scene
    this.christele = null  // Will be set by PatientLevelScene after Christele is created
    this._build()
  }

  setChristele(christele) {
    this.christele = christele
  }

  _build() {
    // === Lives (top-left) ===
    this.livesContainer = this.scene.add.container(40, 12)
    this.add(this.livesContainer)
    this._refreshLives()

    // === Timer (top-center) ===
    this.timerText = this.scene.add.text(GAME_WIDTH / 2, 6, '0s', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: COLORS.WHITE,
    }).setOrigin(0.5, 0)
    this.add(this.timerText)

    // === SCORE (top-right) ===
    this.scoreText = this.scene.add.text(GAME_WIDTH - 8, 6, '0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: COLORS.YELLOW,
      align: 'right',
    }).setOrigin(1, 0)
    this.add(this.scoreText)

    this.highScoreText = this.scene.add.text(GAME_WIDTH - 8, 22, 'HI 0', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: COLORS.LIGHT_GRAY,
      align: 'right',
    }).setOrigin(1, 0)
    this.add(this.highScoreText)

    // === Mute button (top-right, just below HI score) ===
    this.muteBtn = this.scene.add.text(GAME_WIDTH - 8, 36, isMuted() ? '🔇' : '🔊', {
      fontFamily: 'monospace',
      fontSize: '12px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    this.muteBtn.on('pointerdown', (pointer, lx, ly, event) => {
      event && event.stopPropagation && event.stopPropagation()
      const next = !isMuted()
      setMuted(next)
      this.muteBtn.setText(next ? '🔇' : '🔊')
      // Play a tiny click feedback when un-muting
      if (!next) sfx.play('menuSelect')
    })
    this.add(this.muteBtn)

    // === Dash cooldown (bottom-center) ===
    this.dashBarBg = this.scene.add.graphics()
    this.dashBarBg.fillStyle(0x222222, 0.8)
    this.dashBarBg.fillRect(GAME_WIDTH / 2 - 30, GAME_HEIGHT - 14, 60, 6)
    this.add(this.dashBarBg)

    this.dashBarFg = this.scene.add.graphics()
    this.add(this.dashBarFg)

    this.dashLabel = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'DASH', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: COLORS.LIGHT_GRAY,
    }).setOrigin(0.5)
    this.add(this.dashLabel)

    // === Hint (bottom-left) ===
    this.hint = this.scene.add.text(8, GAME_HEIGHT - 22, 'ZQSD:move  F:fire  SPACE:dash', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: COLORS.GRAY,
    })
    this.add(this.hint)
  }

  _refreshLives() {
    this.livesContainer.removeAll(true)
    const currentHp = this.christele ? this.christele.hp : CHRISTELE.MAX_HP
    for (let i = 0; i < CHRISTELE.MAX_HP; i++) {
      const croissant = this.scene.add.graphics()
      const isActive = i < currentHp
      const color = isActive ? 0xf1c40f : 0x444444
      croissant.fillStyle(color, 1)
      croissant.fillRect(-5, -2, 10, 4)
      croissant.fillRect(-3, -3, 6, 1)
      croissant.fillRect(-3, 2, 6, 1)
      croissant.x = (i - 2) * 14
      croissant.y = 0
      this.livesContainer.add(croissant)
    }
  }

  update() {
    this.scoreText.setText(`${state.score}`)
    this.highScoreText.setText(`HI ${state.highScore}`)
    this._refreshLives()

    // Timer
    if (this.scene.time && this.scene.gameStartTime !== undefined) {
      const elapsed = Math.floor((this.scene.time.now - this.scene.gameStartTime) / 1000)
      this.timerText.setText(`${elapsed}s`)
    }

    // Dash cooldown
    this.dashBarFg.clear()
    const now = this.scene.time.now
    if (this.christele) {
      const elapsed = now - (this.christele.lastDashAt ?? -Infinity)
      if (elapsed >= CHRISTELE.DASH_COOLDOWN) {
        this.dashBarFg.fillStyle(0x2ecc71, 1)
        this.dashBarFg.fillRect(GAME_WIDTH / 2 - 29, GAME_HEIGHT - 13, 58, 4)
      } else {
        const ratio = elapsed / CHRISTELE.DASH_COOLDOWN
        this.dashBarFg.fillStyle(0xf1c40f, 1)
        this.dashBarFg.fillRect(GAME_WIDTH / 2 - 29, GAME_HEIGHT - 13, 58 * ratio, 4)
      }
    }
  }
}
