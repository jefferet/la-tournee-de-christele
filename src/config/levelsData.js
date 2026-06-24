// === Patient 1: Monsieur Beaumont ===
// 4 rooms + 1 boss. Procedurally generated for Sprint 2.

export const LEVEL_BEAUMONT = {
  id: 'patient-1',
  name: 'Monsieur Beaumont',
  age: 78,
  pathology: 'Diabète',
  palette: {
    floor: '#5a3a2e',
    wall: '#3a3a5e',
    accent: '#a0d8b3',
    door: '#f1c40f',
  },
  width: 480,
  height: 270,
  rooms: [
    {
      id: 'entrance',
      label: 'Entrée',
      spawnX: 60,
      spawnY: 220,
      checkpoint: { x: 60, y: 220 },
      background: 'room_entrance',
      walls: [
        // Outer walls (left, right, top, bottom)
        { x: 0, y: 0, w: 480, h: 30 },       // top
        { x: 0, y: 240, w: 480, h: 30 },     // bottom
        { x: 0, y: 30, w: 8, h: 210 },       // left
        // right: open (exit)
        { x: 472, y: 110, w: 8, h: 130 },    // right top half
        { x: 472, y: 0, w: 8, h: 60 },       // right top corner
      ],
      enemies: [
        { type: 'slipperyMat', x: 150, y: 220 },
        { type: 'newspaperStack', x: 280, y: 200 },
        { type: 'catKikiMinion', x: 380, y: 180 },
      ],
      powerUps: [
        { type: 'carteVitale', x: 200, y: 100 },
      ],
      exit: { x: 460, y: 180, w: 20, h: 40, to: 'couloir', spawnX: 60, spawnY: 220 },
    },
    {
      id: 'couloir',
      label: 'Couloir',
      spawnX: 60,
      spawnY: 220,
      checkpoint: { x: 60, y: 220 },
      background: 'room_couloir',
      walls: [
        { x: 0, y: 0, w: 480, h: 30 },
        { x: 0, y: 240, w: 480, h: 30 },
        { x: 0, y: 30, w: 8, h: 210 },
        { x: 472, y: 30, w: 8, h: 210 },
        // Door at bottom-right (entrance from entrance room)
        // Door at top-left (exit to salon)
        // For Sprint 2, we keep walls simple - no internal doors
      ],
      enemies: [
        { type: 'slipperyMat', x: 100, y: 180 },
        { type: 'newspaperStack', x: 240, y: 160 },
        { type: 'catKikiMinion', x: 350, y: 200 },
        { type: 'catKikiMinion', x: 200, y: 220 },
      ],
      powerUps: [
        { type: 'cafe', x: 380, y: 100 },
      ],
      exit: { x: 460, y: 180, w: 20, h: 40, to: 'salon', spawnX: 60, spawnY: 220 },
    },
    {
      id: 'salon',
      label: 'Salon',
      spawnX: 60,
      spawnY: 220,
      checkpoint: { x: 60, y: 220 },
      background: 'room_salon',
      walls: [
        { x: 0, y: 0, w: 480, h: 30 },
        { x: 0, y: 240, w: 480, h: 30 },
        { x: 0, y: 30, w: 8, h: 210 },
        { x: 472, y: 30, w: 8, h: 210 },
        // Internal obstacles (furniture)
        { x: 100, y: 100, w: 40, h: 40 },  // table
        { x: 280, y: 130, w: 60, h: 30 },  // canapé
      ],
      enemies: [
        { type: 'catKikiMinion', x: 200, y: 180 },
        { type: 'catKikiMinion', x: 380, y: 200 },
        { type: 'slipperyMat', x: 320, y: 220 },
        { type: 'newspaperStack', x: 150, y: 200 },
      ],
      powerUps: [
        { type: 'carteVitale', x: 60, y: 80 },
      ],
      exit: { x: 460, y: 180, w: 20, h: 40, to: 'chambre', spawnX: 60, spawnY: 220 },
    },
    {
      id: 'chambre',
      label: 'Chambre',
      spawnX: 60,
      spawnY: 220,
      checkpoint: { x: 60, y: 220 },
      background: 'room_chambre',
      walls: [
        { x: 0, y: 0, w: 480, h: 30 },
        { x: 0, y: 240, w: 480, h: 30 },
        { x: 0, y: 30, w: 8, h: 210 },
        { x: 472, y: 30, w: 8, h: 210 },
        { x: 60, y: 80, w: 120, h: 40 },  // lit
      ],
      enemies: [],
      powerUps: [
        { type: 'cafe', x: 400, y: 100 },
      ],
      boss: { type: 'catKiki', x: 240, y: 130, hp: 30 },
    },
  ],
  sequence: ['entrance', 'couloir', 'salon', 'chambre'],
}

// === Map of all levels ===
export const LEVELS = {
  'patient-1': LEVEL_BEAUMONT,
}

export function getLevel(id) {
  return LEVELS[id] || null
}
