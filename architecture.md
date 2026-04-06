# Architecture

| Fichier | Description |
|---|---|
| `index.html` | Page HTML avec canvas, HUD overlay, ecrans menu et score |
| `vite.config.ts` | Configuration Vite (host expose pour test mobile) |
| `tsconfig.json` | Configuration TypeScript (strict, ESNext modules) |
| `package.json` | Dependances (three, vite, typescript, @types/three) et scripts (dev, build, preview) |
| `public/assets.json` | Manifeste des assets GLTF (chemins vers modeles par categorie) |
| `public/assets/toonshooter/` | Assets GLTF placeholder (Quaternius low-poly) : Characters, Environment, Guns, Texture |
| `src/style.css` | Styles globaux : HUD, ecrans menu/score, joystick, notifications |
| `src/config.ts` | Constantes de jeu : camera, mouvement, map, timing, items, rendu |
| `src/types.ts` | Interfaces partagees : Collider, PondData, GameMode, ItemDef, AssetManifest |
| `src/state.ts` | Gestion de l'etat du jeu : creation, reset, score, items collectes |
| `src/assets.ts` | Chargement GLTF : manifeste, cache, clone, normalisation de taille |
| `src/main.ts` | Point d'entree : scene, renderer, lumieres, game loop, orchestration |
| `src/player.ts` | Classe Player : mesh placeholder ou GLTF, deplacement direct (top-down) |
| `src/camera.ts` | Classe TopDownCamera : vue du dessus qui suit le joueur avec look-ahead |
| `src/controls.ts` | Classe VirtualJoystick : joystick tactile + clavier WASD, input normalise |
| `src/map.ts` | Construction de la map : terrain, chemins, batiments GLTF, vegetation, decorations |
| `src/collision.ts` | Resolution des collisions : limites de map, AABB batiments, ellipse etang |
| `src/items.ts` | ItemManager : spawn des objets collectables, animation, detection de ramassage |
| `src/hud.ts` | HUD : timer, compteur d'objets, notifications, ecrans menu/score |
| `game-design-document.md` | Game design document complet (concept, objets, scoring, flow, PNJ, planning) |
| `implementation-plan.md` | Plan d'implementation en 10 etapes avec checklist |
| `CLAUDE.md` | Instructions projet pour Claude Code |
| `src/kenney-buildings.ts` | Assemblage de batiments modulaires Kenney (definitions de pieces, preloading, construction) |
| `public/kenney-catalog.json` | Catalogue des 167 pieces Kenney Fantasy Town Kit 2.0 (categories, dimensions, snap rules) |
| `public/assets/kenney/*.glb` | Modeles GLB modulaires Kenney (murs, toits, escaliers, routes, vegetation, decorations) |
| `public/assets/kenney/colormap.png` | Texture partagee par tous les modeles Kenney |
