# La Tournée de Christele

> Shoot them up 2D pixel art 16-bit dans le navigateur. Christele, infirmière libérale, fait sa tournée.

## Statut

**Sprint 0 — Init projet.** Phaser + Vite configurés, scènes vides, menu fonctionnel. Aucun asset ni niveau implémenté pour l'instant.

## Stack

- **Phaser 3.80+** — moteur de jeu 2D
- **Vite 5+** — bundler + dev server
- **JavaScript ES2020** — pas de TypeScript pour ce périmètre

## Commandes

```bash
npm install      # installer les dépendances
npm run dev      # serveur de dev (http://localhost:3000)
npm run build    # build de production dans dist/
npm run preview  # tester le build localement
```

## Structure

```
la-tournee-de-christele/
├── index.html
├── package.json
├── vite.config.js
├── public/assets/          # sprites, tiles, audio, fonts (à remplir)
└── src/
    ├── main.js             # bootstrap Phaser
    ├── config/
    │   ├── constants.js    # dimensions, couleurs, gameplay constants
    │   └── gameConfig.js   # config Phaser.Game
    └── scenes/
        ├── BootScene.js
        ├── PreloadScene.js
        └── MenuScene.js
```

## Documentation

- `../PROMPT-SCENARIO-V1.md` — scénario du jeu (verrouillé)
- `../DOC-TECHNIQUE-V1.md` — spécification technique (verrouillée)

## Roadmap

Voir `../DOC-TECHNIQUE-V1.md` section 28 pour la roadmap technique complète.

| Sprint | Contenu | Statut |
|---|---|---|
| 0 | Setup Vite + Phaser, scènes vides | ✅ En cours |
| 1 | Christele + game feel (dash, tir) | ⏳ |
| 2 | Premier niveau patient (Beaumont) | ⏳ |
| 3 | 5 niveaux patients restants | ⏳ |
| 4 | Système de trajet (shmup auto) | ⏳ |
| 5 | Boss final + EndScene | ⏳ |
| 6 | Polish + QA + déploiement | ⏳ |
