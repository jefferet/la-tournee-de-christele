import Phaser from 'phaser'
import { gameConfig } from './config/gameConfig.js'

/**
 * Bootstrap the Phaser game once the window has loaded.
 * Exposes `window.__game` for debugging in the browser console.
 */
window.addEventListener('load', () => {
  // eslint-disable-next-line no-console
  console.log('[main] La Tournée de Christele — booting...')
  const game = new Phaser.Game(gameConfig)
  window.__game = game
})
