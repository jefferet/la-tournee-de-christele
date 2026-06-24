import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js'
import { sfx, initAudioOnFirstGesture } from '../audio/sfx.js'

/**
 * Menu scene — title screen.
 * For Sprint 0: just a title + a "JOUER" button that does nothing yet
 * (no levels implemented). Real game flow starts in Sprint 2.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU)
  }

  create() {
    // eslint-disable-next-line no-console
    console.log('[MenuScene] Menu shown.')

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND)

    // Init audio on first user gesture (covers the JOUER button click)
    initAudioOnFirstGesture(this)

    // === Title ===
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'LA TOURNÉE DE CHRISTELE', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: COLORS.WHITE,
      align: 'center',
    })
    title.setOrigin(0.5)

    // === Subtitle ===
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, 'Shoot them up infirmier', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: COLORS.LIGHT_GRAY,
      align: 'center',
    })
    subtitle.setOrigin(0.5)

    // === Start button (placeholder) ===
    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, '▶ JOUER', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: COLORS.YELLOW,
      align: 'center',
    })
    startText.setOrigin(0.5)
    startText.setInteractive({ useHandCursor: true })

    startText.on('pointerover', () => startText.setColor(COLORS.WHITE))
    startText.on('pointerout', () => startText.setColor(COLORS.YELLOW))
    startText.on('pointerdown', () => {
      // eslint-disable-next-line no-console
      console.log('[MenuScene] JOUER clicked — launching PatientLevelScene.')
      sfx.play('menuSelect')
      this.scene.start(SCENES.PATIENT, { levelId: 'patient-1' })
    })

    // === Footer (version) ===
    const footer = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'v1.8 — 8-bit SFX', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: COLORS.GRAY,
      align: 'center',
    })
    footer.setOrigin(0.5)
  }
}
