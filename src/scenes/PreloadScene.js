import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js'
import {
  generateChristeleSheet,
  generateSyringeSheet,
  generateBackground,
  generateSlipperyMat,
  generateNewspaperStack,
  generateCatKikiMinion,
  generateCatKiki,
  generateIndus,
  generateCarteVitale,
  generateCafe,
  generatePatient,
  generateRoomEntrance,
  generateRoomCouloir,
  generateRoomSalon,
  generateRoomChambre,
} from '../utils/spriteGenerator.js'

/**
 * Preload scene — generates procedural textures and shows a progress bar.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD)
  }

  preload() {
    const { width, height } = this.cameras.main
    const cx = width / 2
    const cy = height / 2

    // === Progress bar background ===
    const barW = 200
    const barH = 20
    const barBg = this.add.graphics()
    barBg.fillStyle(0x222222, 0.8)
    barBg.fillRect(cx - barW / 2, cy - barH / 2, barW, barH)

    // === Progress bar fill ===
    const barFg = this.add.graphics()
    this.load.on('progress', (value) => {
      barFg.clear()
      barFg.fillStyle(0xffffff, 1)
      barFg.fillRect(cx - barW / 2 + 2, cy - barH / 2 + 2, (barW - 4) * value, barH - 4)
    })

    // === Loading label ===
    this.add.text(cx, cy - 30, 'CHARGEMENT...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: COLORS.WHITE,
    }).setOrigin(0.5)

    // === Load real INDU sprite (detoured, transparent bg) ===
    this.load.image('indus', 'assets/sprites/indu-detoured.png')

    // Fake load (progress bar)
    const fakePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    for (let i = 0; i < 10; i++) {
      this.load.image(`__fake_${i}`, fakePng)
    }

    this.load.on('progress', (value) => {
      barFg.clear()
      barFg.fillStyle(0xffffff, 1)
      barFg.fillRect(cx - barW / 2 + 2, cy - barH / 2 + 2, (barW - 4) * value, barH - 4)
    })

    // Override the second progress listener (we had two)
    this.load.on('complete', () => {
      barBg.destroy()
      barFg.destroy()
    })
  }

  create() {
    // === Player + projectile ===
    const christeleData = generateChristeleSheet()
    const syringeData = generateSyringeSheet()
    this.textures.addSpriteSheet('christele', christeleData.canvas, {
      frameWidth: christeleData.frameWidth,
      frameHeight: christeleData.frameHeight,
    })
    this.textures.addCanvas('syringe', syringeData.canvas)

    // === Enemies ===
    // Note: 'indus' is loaded via this.load.image in preload (real sprite)
    // Other enemies kept procedural for now
    this.textures.addCanvas('slipperyMat', generateSlipperyMat().canvas)
    this.textures.addCanvas('newspaperStack', generateNewspaperStack().canvas)
    this.textures.addCanvas('catKikiMinion', generateCatKikiMinion().canvas)
    this.textures.addCanvas('catKiki', generateCatKiki().canvas)
    this.textures.addCanvas('patient', generatePatient().canvas)

    // === Power-ups ===
    this.textures.addCanvas('powerup_carteVitale', generateCarteVitale().canvas)
    this.textures.addCanvas('carteVitale', generateCarteVitale().canvas)
    this.textures.addCanvas('powerup_cafe', generateCafe().canvas)

    // === Room backgrounds ===
    this.textures.addImage('room_entrance', generateRoomEntrance().canvas)
    this.textures.addImage('room_couloir', generateRoomCouloir().canvas)
    this.textures.addImage('room_salon', generateRoomSalon().canvas)
    this.textures.addImage('room_chambre', generateRoomChambre().canvas)

    console.log('[PreloadScene] All textures generated.')
    this.scene.start(SCENES.MENU)
  }
}
