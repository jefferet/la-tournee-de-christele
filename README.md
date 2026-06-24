# La Tournée de Christèle

> Shoot them up 2D pixel art 16-bit — Christèle, infirmière libérale, défend son cabinet contre les INDUs qui tombent du ciel.

Une **PWA (Progressive Web App)** installable sur Android, iOS et desktop. Joue au clavier ou au toucher.

---

## 🎮 Aperçu

Tu incarnes **Christèle**, infirmière libérale en tournée dans son cabinet. La CPAM te bombarde de documents administratifs (les **INDUs**) qui tombent du ciel. Esquive-les, tire à la seringue sur les **patients** qui traversent l'écran pour les soigner, et collecte les **cartes Vitale** qui passent.

Un mini-jeu d'arcade rétro, en pixel art 16-bit assumé, dans un navigateur.

---

## 🕹️ Comment jouer

### Contrôles clavier (desktop)

| Touche | Action |
|---|---|
| `Z` / `Q` / `S` / `D` ou `↑` `←` `↓` `→` | Déplacer Christèle |
| `F` ou `J` | Tirer une seringue |
| `Espace` | Dash (esquive rapide avec i-frames) |
| `Shift` | Soin (récupère 30% HP, cooldown 15s) |

### Contrôles tactiles (mobile/tablette)

Forcer en mode **paysage** (le jeu pivote automatiquement).

- **D-pad** (en bas à gauche) : 4 flèches directionnelles
- **Bouton 💉** (en bas à droite) : tirer une seringue

> Pas de bouton Dash/Heal sur mobile (volontairement minimal pour ne pas surcharger l'écran).

### Règles du jeu

- **5 vies** au départ
- Les **INDUs** (monstres de paperasse, 64×64 px) tombent depuis le haut de l'écran. Ils t'infligent **1 dégât** au contact.
- Les **Cartes Vitales** (18×14 px) tombent aussi. Les collecter = **+100 points**.
- Les **Patients** (16×24 px) marchent horizontalement. Les toucher avec une seringue = **+50 points**.
- Quand tu perds toutes tes vies : écran Game Over, option de rejouer (OUI) ou retour menu (NON).

### Système de points

| Action | Points |
|---|---|
| Carte Vitale collectée | +100 |
| Patient soigné | +50 |
| INDU touché | 0 (juste des dégâts) |

---

## 🚀 Démarrage rapide

### Pré-requis

- **Node.js 18+**
- npm

### Installation locale

```bash
git clone https://github.com/jefferet/la-tournee-de-christele.git
cd la-tournee-de-christele
npm install
npm run dev
```

Le jeu s'ouvre sur **http://localhost:5173**.

### Build de production

```bash
npm run build
```

Le bundle de prod est généré dans `dist/` (~1.2 MB JS non-gzippé, dominé par Phaser).

### Preview local de la build

```bash
npm run preview
```

→ http://localhost:4173

---

## 📱 Installer comme PWA sur Android

1. Ouvre l'URL (ex: `https://la-tournee-de-christele.vercel.app`) dans **Chrome Android**
2. Menu Chrome → **"Installer l'application"** (ou bannière auto "Ajouter à l'écran d'accueil")
3. L'icône **"Sophie"** apparaît sur l'écran d'accueil
4. Lance l'app depuis l'écran d'accueil :
   - ✅ **Plein écran** (pas de barre Chrome)
   - ✅ **Status bar transparente**
   - ✅ **Forcé en paysage** (via `manifest.webmanifest`)
   - ✅ **Marche offline** (Service Worker cache l'app shell)

> Fonctionne aussi sur iOS Safari (Ajouter à l'écran d'accueil), mais avec un mode PWA limité (pas de plein écran parfait).

---

## 🛠️ Stack technique

| Couche | Techno |
|---|---|
| **Rendu** | [Phaser 3.80.1](https://phaser.io/) (Canvas/WebGL) |
| **Build** | [Vite 5](https://vitejs.dev/) (ESM, HMR) |
| **PWA** | Service Worker custom + manifest webmanifest |
| **Icônes PWA** | PNG 192×192, 512×512, 512×512 maskable |
| **Langage** | JavaScript ES2020 (vanilla, pas de framework) |
| **Linter** | Aucun (projet léger) |

### Pourquoi ce choix ?

- **Phaser** : moteur 2D mature, gestion des scènes/sprites/physique/input intégrée. Pas besoin de tout réécrire.
- **Vite** : build ultra-rapide, dev server avec HMR, simple à déployer en static.
- **PWA** : pas besoin de passer par le Play Store (25$ + review) pour une première version. L'utilisateur "installe" depuis le navigateur.

---

## 📂 Structure du projet

```
la-tournee-de-christele/
├── index.html                  ← Shell HTML + meta PWA + register SW
├── public/
│   ├── manifest.webmanifest    ← Métadonnées PWA (name, icons, orientation=landscape)
│   ├── sw.js                    ← Service Worker (cache app shell pour offline)
│   ├── icons/
│   │   ├── icon-192.png         ← Icône PWA 192×192
│   │   ├── icon-512.png         ← Icône PWA 512×512
│   │   └── icon-maskable-512.png
│   └── assets/
│       └── sprites/             ← Sprites des INDUs (papermonster)
├── src/
│   ├── main.js                  ← Bootstrap Phaser game
│   ├── entities/
│   │   ├── Christele.js         ← Player class (Sprite 24×32, physics body)
│   │   ├── ChristeleLegacy.js    ← Ancienne classe Sophie (legacy, dead code)
│   │   ├── Indus.js              ← Ennemi (Container 64×64)
│   │   ├── Patient.js           ← Patient (Container 16×24)
│   │   ├── CarteVitale.js        ← Carte Vitale (Container 18×14)
│   │   └── projectiles/
│   │       └── Syringe.js        ← Projectile (Image 16×6 ou 6×16)
│   ├── scenes/
│   │   ├── BootScene.js         ← Init Phaser
│   │   ├── PreloadScene.js      ← Génération sprites procéduraux
│   │   ├── MenuScene.js         ← Menu principal
│   │   └── PatientLevelScene.js  ← Scène de jeu principale
│   ├── ui/
│   │   ├── HUD.js               ← Affichage vies + score + barre de dash
│   │   └── TouchControls.js     ← D-pad + bouton 💉 (PWA mobile)
│   ├── config/
│   │   ├── constants.js         ← SOPHIE/CHRISTELE, ENEMY_DEFAULTS, etc.
│   │   ├── gameConfig.js        ← Config Phaser (480×270, FIT mode)
│   │   └── levelsData.js         ← (legacy, pour boss futurs)
│   └── utils/
│       ├── spriteGenerator.js   ← Génère sprites Christele/INDU procéduraux
│       ├── stateManager.js      ← Score, high score
│       └── KeyOr.js              ← Helper clavier
├── vite.config.js               ← Config Vite (base: '/' pour GitHub Pages)
├── package.json
└── README.md
```

---

## 🎯 Système de collision (note technique)

**Problème rencontré** : Phaser Arcade Physics a des quirks de scale et d'offset qui rendent l'alignement des hitboxes imprévisible, surtout avec les `Container`. Les hitboxes étaient décalées par rapport aux sprites.

**Solution adoptée** : système de collision **AABB custom** :
- Chaque entité expose `getHitbox()` → `{x, y, width, height}` en **world coords**
- Calculé depuis `this.x, this.y` avec offset fixe de `-spriteSize/2`
- Test AABB dans `PatientLevelScene._checkCollisions()` via fonction `aabbOverlap()`
- Phaser Arcade body conservé uniquement pour le **mouvement** (Christèle, Seringue) et les **world bounds** (Christèle)

Formule Phaser critique (pour mémoire) :
```js
body.x = sprite.x + scaleX * (offset.x - displayOriginX)
```
- Pour **Sprite** : `displayOriginX = frame.width * originX`
- Pour **Container** : `displayOriginX = bounds.width * originX` (PAS `frame.width`)

---

## 🎮 Contrôles de debug

En jeu, appuie sur **`B`** pour afficher les hitboxes :
- 🟡 Jaune = Christèle
- 🔴 Rouge = INDU
- 🟢 Vert = Carte Vitale
- 🔵 Cyan = Patient
- 🟣 Magenta = Seringue

Pour retourner au menu : **`M`**.

---

## 📦 Versions locales (workspace)

Le projet a plusieurs versions de sauvegarde dans le workspace (avant déploiements, après rollbacks) :

| Version | Contenu | Usage |
|---|---|---|
| `la-tournee-de-christele/` | V1.7 active (PWA + touch paysage) | **Version courante** |
| `la-tournee-de-christele-V1.6/` | PWA + D-pad minimal paysage | Avant ajustements transparence/emoji |
| `la-tournee-de-christele-V1.2/` | Pré touch controls (desktop only) | Snapshot stable, versionnable en repo séparé |
| `la-tournee-de-christele-V1.1/` | Refactor hitbox AABB | Avant touch controls |
| `la-tournee-de-christele-V1/` | Avant refactor hitbox | Avec bugs d'alignement |
| `la-tournee-de-christele-V1.3/` | Avec touch controls joystick | Rollback fait, code mort préservé |

---

## 🚢 Déploiement

### Vercel (recommandé)

1. Push sur GitHub :
```bash
git add .
git commit -m "..."
git push origin main
```

2. Sur https://vercel.com :
- "Add New Project"
- Importer le repo `la-tournee-de-christele`
- Vercel auto-détecte Vite, build = `npm run build`, output = `dist/`
- Deploy

Le `manifest.webmanifest` et le `sw.js` sont à la racine du `dist/` après le build. Vercel les sert automatiquement.

### Autres hébergeurs statiques

Le projet est 100% statique après `npm run build`. Compatible avec :
- Netlify
- GitHub Pages (avec le `base: '/'` dans `vite.config.js`)
- Cloudflare Pages
- Tout serveur HTTP statique

---

## 📜 Licence

Code source : © Jef — à définir (MIT recommandé).
Sprites procéduraux : générés au runtime par `src/utils/spriteGenerator.js`.
INDU sprite : fourni par Jef (`public/assets/sprites/indu-detoured.png`).

---

## 🎯 Roadmap (idées futures)

- [ ] Bouton Dash/Heal en option sur mobile (toggle dans un menu settings)
- [ ] Son (8-bit style) pour le tir, les collisions, le Game Over
- [ ] High score persistant via `localStorage` (déjà géré par `stateManager.js`)
- [ ] Niveaux supplémentaires (les 6 patients + boss finaux du scénario original)
- [ ] Mode multi-joueur (peut-être trop ambitieux pour Phaser)
- [ ] Portage natif Android via Capacitor pour distribution Play Store

---

**Bon jeu !** 💉🎮
