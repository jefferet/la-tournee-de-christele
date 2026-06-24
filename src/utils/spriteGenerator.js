/**
 * Procedural sprite generator for Sprint 1 placeholders.
 * Returns HTML canvas elements that Phaser can register as textures.
 * Real pixel art will replace these in later sprints.
 */

/**
 * Generates a Christele spritesheet.
 * Layout: 8 frames in a row, each 24x32.
 * Frames: [idle, walk_1, walk_2, walk_3, walk_4, walk_3_mirror, dash, shoot]
 */
export function generateChristeleSheet() {
  const FRAME_W = 24
  const FRAME_H = 32
  const FRAMES = 8
  const sheetW = FRAME_W * FRAMES
  const sheetH = FRAME_H

  const canvas = document.createElement('canvas')
  canvas.width = sheetW
  canvas.height = sheetH
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  for (let f = 0; f < FRAMES; f++) {
    drawChristeleFrame(ctx, f * FRAME_W, 0, f)
  }

  return { canvas, frameWidth: FRAME_W, frameHeight: FRAME_H, frames: FRAMES }
}

/**
 * Draws a single Christele frame.
 * Frames 1-4 are walk animation (legs swing).
 * Frame 0 = idle. Frame 5 = walk back. Frame 6 = dash (trail). Frame 7 = shoot.
 */
function drawChristeleFrame(ctx, ox, oy, frame) {
  // === Palette ===
  const SKIN = '#f4c2a1'        // peau
  const HAIR = '#3a2818'        // cheveux/chignon
  const COAT = '#ffffff'        // blouse blanche
  const COAT_SHADOW = '#cccccc' // ombre blouse
  const BAG = '#8b4513'         // sacoche cuir
  const BAG_DARK = '#5c2c0d'    // ombre sacoche
  const SHOE = '#1a1a1a'        // chaussures
  const STETHO = '#222222'      // stéthoscope (juste un trait)
  const DASH_TRAIL = 'rgba(255, 255, 255, 0.4)'

  // === Dash trail (frame 6 only) ===
  if (frame === 6) {
    ctx.fillStyle = DASH_TRAIL
    ctx.fillRect(ox + 0, oy + 14, 18, 10)
    ctx.fillRect(ox + 4, oy + 12, 16, 12)
  }

  // === Legs (vary by frame for walk cycle) ===
  ctx.fillStyle = SHOE
  if (frame === 0 || frame === 7) {
    // idle / shoot : jambes statiques
    ctx.fillRect(ox + 8, oy + 26, 3, 4)
    ctx.fillRect(ox + 13, oy + 26, 3, 4)
  } else if (frame === 1) {
    // walk 1 : jambe avant en avant
    ctx.fillRect(ox + 7, oy + 26, 3, 4)
    ctx.fillRect(ox + 14, oy + 26, 3, 4)
  } else if (frame === 2) {
    // walk 2 : jambes serrées
    ctx.fillRect(ox + 9, oy + 26, 3, 4)
    ctx.fillRect(ox + 12, oy + 26, 3, 4)
  } else if (frame === 3) {
    // walk 3 : opposé walk 1
    ctx.fillRect(ox + 14, oy + 26, 3, 4)
    ctx.fillRect(ox + 7, oy + 26, 3, 4)
  } else if (frame === 4) {
    // walk 4 : même que 2 mais décalé
    ctx.fillRect(ox + 10, oy + 26, 3, 4)
    ctx.fillRect(ox + 11, oy + 26, 3, 4)
  } else if (frame === 5) {
    // walk back : opposé de 1
    ctx.fillRect(ox + 14, oy + 26, 3, 4)
    ctx.fillRect(ox + 7, oy + 26, 3, 4)
  } else if (frame === 6) {
    // dash : jambes en arrière
    ctx.fillRect(ox + 6, oy + 26, 4, 3)
    ctx.fillRect(ox + 12, oy + 26, 4, 3)
  }

  // === Sacoche (bandoulière, à droite du corps) ===
  ctx.fillStyle = BAG
  const bagOffset = (frame === 1 || frame === 3) ? 0 : 0 // pourrait osciller
  ctx.fillRect(ox + 16, oy + 16 + bagOffset, 6, 8)
  ctx.fillStyle = BAG_DARK
  ctx.fillRect(ox + 16, oy + 22 + bagOffset, 6, 2)  // ombre bas

  // === Corps (blouse) ===
  ctx.fillStyle = COAT
  ctx.fillRect(ox + 6, oy + 12, 12, 14)
  // Ombre côté du corps
  ctx.fillStyle = COAT_SHADOW
  ctx.fillRect(ox + 6, oy + 12, 2, 14)
  // Col blouse (V)
  ctx.fillStyle = SKIN
  ctx.fillRect(ox + 10, oy + 12, 4, 2)

  // === Stéthoscope (trait diagonal) ===
  ctx.fillStyle = STETHO
  ctx.fillRect(ox + 9, oy + 14, 1, 6)
  ctx.fillRect(ox + 14, oy + 14, 1, 6)

  // === Tête ===
  ctx.fillStyle = SKIN
  ctx.fillRect(ox + 8, oy + 4, 8, 8)
  // Ombre menton
  ctx.fillStyle = '#d4a281'
  ctx.fillRect(ox + 8, oy + 10, 8, 2)

  // === Cheveux / chignon ===
  ctx.fillStyle = HAIR
  ctx.fillRect(ox + 7, oy + 2, 10, 3)   // haut du crâne
  ctx.fillRect(ox + 16, oy + 4, 3, 4)  // chignon à droite

  // === Yeux (2 pixels) ===
  ctx.fillStyle = '#000000'
  ctx.fillRect(ox + 10, oy + 7, 1, 1)
  ctx.fillRect(ox + 13, oy + 7, 1, 1)

  // === Bras avec seringue (frame 7 = shoot) ===
  if (frame === 7) {
    ctx.fillStyle = COAT
    ctx.fillRect(ox + 17, oy + 14, 4, 2)  // bras tendu
    // Seringue
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(ox + 21, oy + 14, 3, 2)  // corps seringue
    ctx.fillStyle = '#aaddff'
    ctx.fillRect(ox + 23, oy + 14, 1, 2)  // aiguille
  } else {
    // Bras normal
    ctx.fillStyle = COAT
    ctx.fillRect(ox + 5, oy + 14, 2, 6)
    ctx.fillRect(ox + 17, oy + 14, 2, 6)
  }
}

/**
 * Generates a syringe projectile sprite (16x6).
 * Detailed pixel art: blue cylinder + grey body + grey needle + black tip.
 */
export function generateSyringeSheet() {
  const FRAME_W = 16
  const FRAME_H = 6
  const sheetW = FRAME_W
  const sheetH = FRAME_H

  const canvas = document.createElement('canvas')
  canvas.width = sheetW
  canvas.height = sheetH
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // === Cylinder (left side, holds the liquid) ===
  ctx.fillStyle = '#aaddff'  // light blue
  ctx.fillRect(0, 1, 4, 4)   // 4x4 cylinder
  // Cylinder edges
  ctx.fillStyle = '#5588aa'  // darker blue
  ctx.fillRect(0, 1, 1, 4)   // left edge
  ctx.fillRect(3, 1, 1, 4)   // right edge
  ctx.fillStyle = '#cceeff'  // highlight
  ctx.fillRect(1, 1, 1, 1)   // top-left highlight

  // === Body (white plastic tube) ===
  ctx.fillStyle = '#eeeeee'  // near white
  ctx.fillRect(4, 2, 7, 2)   // 7x2 body, centered
  // Body edge
  ctx.fillStyle = '#999999'
  ctx.fillRect(4, 3, 7, 1)   // bottom shadow

  // === Needle (metallic) ===
  ctx.fillStyle = '#aaaaaa'  // mid grey
  ctx.fillRect(11, 2, 4, 2)  // 4x2 needle
  ctx.fillStyle = '#dddddd'  // highlight
  ctx.fillRect(11, 2, 4, 1)  // top highlight

  // === Tip (sharp point) ===
  ctx.fillStyle = '#222222'  // near black
  ctx.fillRect(15, 2, 1, 2)  // 1x2 tip

  // === Drop shadow under everything ===
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 5, 16, 1)

  return { canvas, frameWidth: FRAME_W, frameHeight: FRAME_H, frames: 1 }
}

/**
 * Generates a placeholder background for the play scene.
 * Just a simple gradient floor + ceiling.
 */
export function generateBackground() {
  const W = 480
  const H = 270
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Sky / ceiling
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, W, 30)

  // Wall (mid)
  ctx.fillStyle = '#3a3a5e'
  ctx.fillRect(0, 30, W, 200)

  // Floor
  ctx.fillStyle = '#5a3a2e'
  ctx.fillRect(0, 230, W, 40)

  // Decorative tiles (10 wide, 1 row on floor)
  ctx.fillStyle = '#7a4a3e'
  for (let x = 0; x < W; x += 32) {
    ctx.fillRect(x, 230, 30, 1)
    ctx.fillRect(x, 268, 30, 1)
  }
  // Wall deco
  ctx.fillStyle = '#4a4a6e'
  for (let x = 0; x < W; x += 48) {
    ctx.fillRect(x, 40, 1, 180)
  }

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

// === ENEMIES ===

export function generateSlipperyMat() {
  const W = 32, H = 16
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Welcome mat: red with yellow stripes
  ctx.fillStyle = '#cc3333'
  ctx.fillRect(0, 4, 32, 10)
  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(0, 6, 32, 1)
  ctx.fillRect(0, 11, 32, 1)
  // Border
  ctx.fillStyle = '#882222'
  ctx.fillRect(0, 4, 1, 10)
  ctx.fillRect(31, 4, 1, 10)
  // "WELCOME" text effect (3 dots)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(13, 8, 2, 2)
  ctx.fillRect(16, 8, 2, 2)
  ctx.fillRect(19, 8, 2, 2)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

export function generateNewspaperStack() {
  const W = 24, H = 32
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Stack of papers
  ctx.fillStyle = '#aaaaaa'
  ctx.fillRect(2, 4, 20, 24)
  ctx.fillStyle = '#888888'
  ctx.fillRect(2, 26, 20, 2)  // shadow
  // Paper layers
  ctx.fillStyle = '#cccccc'
  ctx.fillRect(0, 6, 24, 4)
  ctx.fillRect(0, 12, 24, 4)
  ctx.fillRect(0, 18, 24, 4)
  ctx.fillRect(0, 24, 24, 4)
  // Text effect (horizontal lines)
  ctx.fillStyle = '#444444'
  for (let y = 7; y < 28; y += 6) {
    ctx.fillRect(2, y, 16, 1)
  }
  // "L'ÉQUIPE" title
  ctx.fillStyle = '#cc0000'
  ctx.fillRect(4, 2, 16, 2)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

export function generateCatKikiMinion() {
  const W = 20, H = 20
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Body (orange)
  ctx.fillStyle = '#e67e22'
  ctx.fillRect(4, 8, 12, 8)
  // Head
  ctx.fillStyle = '#f39c12'
  ctx.fillRect(2, 4, 10, 8)
  // Ears
  ctx.fillStyle = '#d35400'
  ctx.fillRect(2, 2, 3, 3)
  ctx.fillRect(8, 2, 3, 3)
  // Tail
  ctx.fillStyle = '#e67e22'
  ctx.fillRect(14, 6, 5, 2)
  // Eyes
  ctx.fillStyle = '#000000'
  ctx.fillRect(4, 6, 1, 1)
  ctx.fillRect(8, 6, 1, 1)
  // Legs
  ctx.fillStyle = '#d35400'
  ctx.fillRect(5, 15, 2, 4)
  ctx.fillRect(12, 15, 2, 4)
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(4, 19, 12, 1)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

/**
 * Generates an "Indus" — an administrative document falling from the sky.
 * White paper with red CPAM stamp, signature lines, "INDU" header.
 */
export function generateIndus() {
  const W = 24, H = 28
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Paper (white, slightly off-white)
  ctx.fillStyle = '#f5f5dc'  // beige paper
  ctx.fillRect(0, 0, W, H)

  // Top red header bar
  ctx.fillStyle = '#c0392b'
  ctx.fillRect(0, 0, W, 5)

  // Title "INDU" in dark text
  ctx.fillStyle = '#000000'
  ctx.fillRect(2, 7, 4, 2)   // I
  ctx.fillRect(7, 7, 2, 2)   // N top
  ctx.fillRect(7, 9, 2, 1)   // N mid
  ctx.fillRect(7, 10, 2, 2)  // N bottom
  ctx.fillRect(10, 7, 2, 2)  // D top
  ctx.fillRect(10, 9, 1, 1)  // D mid
  ctx.fillRect(10, 10, 2, 2) // D bottom
  ctx.fillRect(13, 7, 2, 2)  // U
  ctx.fillRect(13, 9, 2, 1)
  ctx.fillRect(13, 10, 2, 2)

  // Underline
  ctx.fillStyle = '#000000'
  ctx.fillRect(2, 12, 18, 1)

  // Body text lines (simulated text)
  ctx.fillStyle = '#333333'
  for (let y = 14; y < 22; y += 2) {
    ctx.fillRect(2, y, 18, 1)
  }
  // Some lines shorter (paragraph)
  ctx.fillRect(2, 14, 14, 1)
  ctx.fillRect(2, 16, 18, 1)
  ctx.fillRect(2, 18, 16, 1)
  ctx.fillRect(2, 20, 10, 1)

  // Red CPAM stamp (round-ish, top-right)
  ctx.fillStyle = '#c0392b'
  ctx.fillRect(15, 0, 6, 1)  // top of stamp
  ctx.fillRect(15, 4, 6, 1)
  ctx.fillRect(14, 1, 1, 3)  // left
  ctx.fillRect(21, 1, 1, 3)  // right
  ctx.fillStyle = '#ecf0f1'
  ctx.fillRect(16, 2, 4, 2)  // stamp text placeholder

  // Signature line at bottom
  ctx.fillStyle = '#000000'
  ctx.fillRect(2, 24, 12, 1)
  // Signature scribble
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(14, 23, 8, 1)
  ctx.fillRect(15, 24, 6, 1)
  ctx.fillRect(14, 25, 8, 1)

  // Shadow under paper
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, H - 1, W, 1)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

/**
 * Generates a Carte Vitale — green health card.
 */
export function generateCarteVitale() {
  const W = 18, H = 14
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Green card body
  ctx.fillStyle = '#27ae60'
  ctx.fillRect(0, 0, W, H)
  // Border
  ctx.fillStyle = '#1e8449'
  ctx.fillRect(0, 0, W, 1)
  ctx.fillRect(0, H - 1, W, 1)
  ctx.fillRect(0, 0, 1, H)
  ctx.fillRect(W - 1, 0, 1, H)
  // Photo placeholder (top-left)
  ctx.fillStyle = '#85c1e9'
  ctx.fillRect(2, 2, 4, 6)
  // Face
  ctx.fillStyle = '#f4c2a1'
  ctx.fillRect(3, 3, 2, 3)
  // Text lines (right side)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(8, 3, 8, 1)
  ctx.fillRect(8, 5, 8, 1)
  ctx.fillRect(8, 7, 6, 1)
  ctx.fillRect(8, 9, 7, 1)
  // CV logo (bottom-right)
  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(13, 11, 3, 1)
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, H, W, 1)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

/**
 * Generates a Patient — a small human figure that walks across the screen.
 * Pixel art silhouette: head, body, arms, legs.
 */
export function generatePatient() {
  const W = 16, H = 24
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Tête
  ctx.fillStyle = '#f4c2a1'  // peau
  ctx.fillRect(5, 1, 6, 6)
  // Cheveux gris (patient âgé)
  ctx.fillStyle = '#aaaaaa'
  ctx.fillRect(5, 0, 6, 2)
  ctx.fillRect(4, 1, 2, 3)  // côté
  ctx.fillRect(10, 1, 2, 3)
  // Yeux fatigués (yeux fermés ou mi-clos)
  ctx.fillStyle = '#000000'
  ctx.fillRect(6, 4, 1, 1)
  ctx.fillRect(9, 4, 1, 1)
  // Bouche (petite, fatiguée)
  ctx.fillStyle = '#7a4a3e'
  ctx.fillRect(7, 6, 2, 1)

  // Corps (pyjama)
  ctx.fillStyle = '#d4a574'  // beige clair
  ctx.fillRect(3, 7, 10, 11)
  // Col roulé
  ctx.fillStyle = '#b89060'
  ctx.fillRect(6, 7, 4, 1)
  // Boutons
  ctx.fillStyle = '#8b4513'
  ctx.fillRect(7, 10, 1, 1)
  ctx.fillRect(7, 13, 1, 1)
  ctx.fillRect(7, 16, 1, 1)

  // Bras tendu vers l'avant (gauche, côté où il marche)
  ctx.fillStyle = '#f4c2a1'  // peau
  ctx.fillRect(1, 9, 2, 2)   // main
  ctx.fillRect(2, 8, 2, 6)   // avant-bras
  // Bras droit le long du corps
  ctx.fillRect(13, 9, 2, 6)

  // Pantalon
  ctx.fillStyle = '#3a3a5e'  // bleu marine
  ctx.fillRect(4, 18, 3, 5)
  ctx.fillRect(9, 18, 3, 5)

  // Chaussures
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(4, 22, 3, 2)
  ctx.fillRect(9, 22, 3, 2)

  // Ombre
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(2, 23, 12, 1)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

export function generateCatKiki() {
  const W = 48, H = 40
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Body (large orange cat)
  ctx.fillStyle = '#e67e22'
  ctx.fillRect(8, 18, 32, 18)
  // Head
  ctx.fillStyle = '#f39c12'
  ctx.fillRect(4, 8, 24, 16)
  // Ears
  ctx.fillStyle = '#d35400'
  ctx.fillRect(4, 4, 6, 6)
  ctx.fillRect(20, 4, 6, 6)
  // Tail (curled)
  ctx.fillStyle = '#e67e22'
  ctx.fillRect(38, 16, 8, 4)
  ctx.fillRect(40, 12, 4, 4)
  // Eyes (yellow with black slits)
  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(8, 12, 4, 4)
  ctx.fillRect(18, 12, 4, 4)
  ctx.fillStyle = '#000000'
  ctx.fillRect(9, 13, 1, 2)
  ctx.fillRect(19, 13, 1, 2)
  // Nose
  ctx.fillStyle = '#ff69b4'
  ctx.fillRect(14, 18, 4, 2)
  // Mouth
  ctx.fillStyle = '#000000'
  ctx.fillRect(13, 21, 2, 1)
  ctx.fillRect(17, 21, 2, 1)
  // Whiskers
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(8, 20, 4, 1)
  ctx.fillRect(20, 20, 4, 1)
  ctx.fillRect(8, 22, 4, 1)
  ctx.fillRect(20, 22, 4, 1)
  // Legs
  ctx.fillStyle = '#d35400'
  ctx.fillRect(10, 35, 6, 4)
  ctx.fillRect(30, 35, 6, 4)
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(8, 38, 32, 2)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

// === POWER-UPS ===

// (generateCarteVitale is now defined above with the new sprite)

export function generateCafe() {
  const W = 12, H = 14
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Cup body
  ctx.fillStyle = '#ecf0f1'
  ctx.fillRect(1, 4, 10, 8)
  // Handle
  ctx.fillStyle = '#ecf0f1'
  ctx.fillRect(10, 6, 2, 4)
  // Coffee inside (top)
  ctx.fillStyle = '#6e2c00'
  ctx.fillRect(2, 4, 8, 2)
  // Steam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillRect(3, 0, 1, 3)
  ctx.fillRect(6, 1, 1, 2)
  ctx.fillRect(8, 0, 1, 3)
  // Saucer
  ctx.fillStyle = '#bdc3c7'
  ctx.fillRect(0, 12, 12, 2)
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(1, 13, 10, 1)

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

// === ROOM BACKGROUNDS ===

/**
 * Generate a room background with given palette and theme.
 * Generic: top wall + bottom floor + wall pattern + optional furniture hint.
 */
function _makeRoomBg(palette, theme = 'default', furniture = []) {
  const W = 480, H = 270
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // Top wall (skirting + main wall)
  ctx.fillStyle = palette.wall
  ctx.fillRect(0, 0, W, 30)
  ctx.fillStyle = palette.accent
  ctx.fillRect(0, 28, W, 2)
  // Main wall
  ctx.fillStyle = palette.wallMid || palette.wall
  ctx.fillRect(0, 30, W, 200)
  // Wall pattern
  ctx.fillStyle = palette.wallDark || '#00000033'
  for (let x = 0; x < W; x += 32) {
    ctx.fillRect(x, 30, 1, 200)
  }

  // Floor
  ctx.fillStyle = palette.floor
  ctx.fillRect(0, 230, W, 40)
  // Floor tiles
  ctx.fillStyle = palette.floorDark
  for (let x = 0; x < W; x += 24) {
    ctx.fillRect(x, 230, 22, 1)
    ctx.fillRect(x, 268, 22, 1)
  }
  // Floor midline
  ctx.fillStyle = palette.floorLight
  ctx.fillRect(0, 248, W, 1)

  // Furniture (just visual hints, not collidable)
  for (const f of furniture) {
    ctx.fillStyle = f.color
    ctx.fillRect(f.x, f.y, f.w, f.h)
    if (f.detail) {
      ctx.fillStyle = f.detailColor || '#00000033'
      ctx.fillRect(f.x + 1, f.y + 1, f.w - 2, 1)
    }
  }

  return { canvas, frameWidth: W, frameHeight: H, frames: 1 }
}

export function generateRoomEntrance() {
  return _makeRoomBg({
    floor: '#5a3a2e',
    floorDark: '#3a2818',
    floorLight: '#7a4a3e',
    wall: '#3a3a5e',
    wallMid: '#4a4a6e',
    wallDark: '#2a2a4e',
    accent: '#a0d8b3',
  }, 'entrance', [
    // Welcome mat hint
    { x: 50, y: 240, w: 60, h: 8, color: '#cc3333' },
    // Coat rack hint
    { x: 380, y: 50, w: 8, h: 80, color: '#8b4513' },
  ])
}

export function generateRoomCouloir() {
  return _makeRoomBg({
    floor: '#5a3a2e',
    floorDark: '#3a2818',
    floorLight: '#7a4a3e',
    wall: '#2a2a4e',
    wallMid: '#3a3a5e',
    wallDark: '#1a1a2e',
    accent: '#7a8a9a',
  }, 'couloir', [
    // Frames on the wall
    { x: 60, y: 50, w: 24, h: 18, color: '#8b4513' },
    { x: 120, y: 50, w: 24, h: 18, color: '#8b4513' },
    { x: 280, y: 60, w: 24, h: 18, color: '#8b4513' },
    { x: 400, y: 50, w: 24, h: 18, color: '#8b4513' },
  ])
}

export function generateRoomSalon() {
  return _makeRoomBg({
    floor: '#5a3a2e',
    floorDark: '#3a2818',
    floorLight: '#7a4a3e',
    wall: '#4a3a2e',
    wallMid: '#5a4a3e',
    wallDark: '#3a2a1e',
    accent: '#d4a574',
  }, 'salon', [
    // TV hint
    { x: 200, y: 50, w: 80, h: 50, color: '#1a1a1a' },
    // Sofa hint
    { x: 60, y: 150, w: 100, h: 50, color: '#7a4a3e' },
    // Table hint
    { x: 280, y: 180, w: 60, h: 30, color: '#5a3a2e' },
  ])
}

export function generateRoomChambre() {
  return _makeRoomBg({
    floor: '#3a3a2e',
    floorDark: '#2a2a1e',
    floorLight: '#4a4a3e',
    wall: '#3a2a3e',
    wallMid: '#4a3a4e',
    wallDark: '#2a1a2e',
    accent: '#8a6a8a',
  }, 'chambre', [
    // Bed hint
    { x: 40, y: 100, w: 140, h: 100, color: '#7a4a6a' },
    // Pillow
    { x: 50, y: 105, w: 30, h: 20, color: '#ecf0f1' },
    // Nightstand
    { x: 200, y: 150, w: 30, h: 50, color: '#5a3a2e' },
    // Lamp
    { x: 210, y: 130, w: 10, h: 15, color: '#f1c40f' },
  ])
}
