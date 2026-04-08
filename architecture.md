# Architecture

| Fichier | Description |
|---|---|
| `index.html` | Page HTML avec canvas, HUD overlay, ecrans menu et score |
| `vite.config.ts` | Configuration Vite (host expose pour test mobile) + route dev-only de sauvegarde du niveau |
| `tsconfig.json` | Configuration TypeScript (strict, ESNext modules) |
| `package.json` | Dependances (three, vite, typescript, @types/three) et scripts (dev, build, preview) |
| `public/assets.json` | Manifeste des assets GLTF (chemins vers modeles par categorie) |
| `public/levels/main.json` | Source de verite du niveau jouable et editable (entites, surfaces, color grading) |
| `public/assets/toonshooter/` | Assets GLTF placeholder (Quaternius low-poly) : Characters, Environment, Guns, Texture |
| `src/style.css` | Point d'entree CSS qui importe les feuilles base, jeu et editeur |
| `src/styles/base.css` | Variables globales, fonts et styles de base du document |
| `src/styles/game-ui.css` | Styles du HUD, des overlays menu/score et des boutons de jeu |
| `src/styles/editor.css` | Styles desktop-first de l'editeur de niveau integre |
| `src/config.ts` | Constantes de jeu : camera, mouvement, map, timing, items, rendu |
| `src/types.ts` | Interfaces partagees : collisions, etat, assets et schema du niveau data-driven |
| `src/state.ts` | Gestion de l'etat du jeu : creation, reset, score, items collectes |
| `src/assets.ts` | Chargement GLTF : manifeste, cache, clone, normalisation de taille |
| `src/level-data.ts` | Chargement et sauvegarde du niveau JSON principal |
| `src/color-grading.ts` | Reglages par defaut et normalisation du color grading sauvegarde dans le niveau |
| `src/level-grid.ts` | Utilitaires de grille pour surfaces path/water et conversion monde/cellule |
| `src/level-assets.ts` | Resolution et preload des assets utilises par les entites du niveau |
| `src/level-catalog.ts` | Construction du catalogue de palette de l'editeur depuis les catalogues Kenney |
| `src/editor-entity.ts` | Helpers d'entites pour l'editeur (creation depuis palette, update de proprietes, snap) |
| `src/editor-placement-preview.ts` | Ghost transparent de placement dans l'editeur pour visualiser l'objet avant pose |
| `src/editor-preview.ts` | Generation lazy de previews 3D pour chaque item de palette de l'editeur |
| `src/editor-ui.ts` | Overlay DOM de l.editeur : palette, onglets, proprietes, color grading et status |
| `src/editor.ts` | Controleur de l.editeur : raycast, selection, drag, pinceau, color grading, save/reload |
| `src/surface-layer-renderer.ts` | Rendu lisse des couches path/water a partir de la grille du niveau, sans tuiles carrees visibles |
| `src/main.ts` | Point d'entree : scene, renderer, lumieres, game loop, mode jeu et mode editeur |
| `src/player.ts` | Classe Player : mesh placeholder ou GLTF, deplacement direct (top-down) |
| `src/camera.ts` | Classe TopDownCamera : vue du dessus qui suit le joueur avec look-ahead |
| `src/controls.ts` | Classe VirtualJoystick : joystick tactile + clavier WASD, input normalise |
| `src/map.ts` | Scene de niveau data-driven : rendu du JSON, surfaces, entites et colliders |
| `src/collision.ts` | Resolution des collisions : limites de map et AABB des entites/eau |
| `src/items.ts` | ItemManager : spawn des objets collectables, animation, detection de ramassage |
| `src/hud.ts` | HUD : timer, compteur d'objets, notifications, ecrans menu/score |
| `game-design-document.md` | Game design document complet (concept, objets, scoring, flow, PNJ, planning) |
| `implementation-plan.md` | Plan d'implementation en 10 etapes avec checklist |
| `CLAUDE.md` | Fichier de compatibilite qui redirige vers `AGENTS.md` |
| `src/shaders/post.ts` | EffectComposer avec ShaderPass de color grading pilotable en live (contrast, saturation, warmth, vignette, lift) |
| `src/kenney-buildings.ts` | Assemblage de batiments modulaires Kenney (definitions de pieces, preloading, construction) |
| `public/kenney-catalog.json` | Catalogue des 167 pieces Kenney Fantasy Town Kit 2.0 (categories, dimensions, snap rules) |
| `public/assets/kenney/*.glb` | Modeles GLB modulaires Kenney (murs, toits, escaliers, routes, vegetation, decorations) |
| `public/assets/kenney/colormap.png` | Texture partagee par tous les modeles Kenney |
| `public/kenney-mini-characters.json` | Catalogue rapide du kit Kenney Mini Characters (variantes, defaults joueur, accessoires) |
| `public/assets/kenney-mini-characters/*.glb` | Modeles GLB Kenney Mini Characters pour joueurs, PNJ, accessoires et fauteuils |
| `public/assets/kenney-mini-characters/Textures/colormap.png` | Texture partagee du kit Kenney Mini Characters |
| `public/assets/kenney-mini-characters/License.txt` | Licence CC0 du kit Kenney Mini Characters copiee dans le projet |
| `public/kenney-ui-catalog.json` | Catalogue du Kenney UI Pack (composants, patterns, valeurs border-image) |
| `public/assets/kenney-ui/{blue,green,grey,red,yellow}/*.png` | PNGs 2x Kenney UI Pack par couleur (boutons, etoiles, icones, checkboxes) |
| `public/assets/kenney-ui/extra/*.png` | PNGs 2x Kenney UI Pack neutres (inputs, dividers, icones fleches/play/repeat) |
| `public/assets/kenney-ui/fonts/*.ttf` | Polices Kenney Future et Kenney Future Narrow |
| `public/assets/kenney-ui/sounds/*.ogg` | Sons UI Kenney (click, switch, tap) |
| `public/assets/kenney-ui/License.txt` | Licence CC0 du Kenney UI Pack |
| `.codex/skills/threejs-*/SKILL.md` | Copies locales des skills Three.js vendorises pour ce projet |
| `AGENTS.md` | Instructions projet canoniques et source unique pour les agents/outils |
| `src/prefab-roofs.ts` | Toits continus proceduraux des prefabs Kenney (gable et plat), pour eviter les assemblages de tuiles incoherents |
