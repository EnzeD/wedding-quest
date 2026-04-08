# Architecture

| Fichier | Description |
|---|---|
| `index.html` | Page HTML avec canvas, HUD overlay, menu cinematique multi-etapes et ecran de score |
| `vite.config.ts` | Configuration Vite (host expose pour test mobile) + route dev-only de sauvegarde du niveau |
| `tsconfig.json` | Configuration TypeScript (strict, ESNext modules) |
| `package.json` | Dependances (three, vite, typescript, @types/three) et scripts (dev, build, preview) |
| `public/assets.json` | Manifeste des assets GLTF (chemins vers modeles par categorie) |
| `public/levels/main.json` | Source de verite du niveau jouable et editable (entites, surfaces, reglages path/water dont relief d'eau et pente de berge, toggle post-process, couleur d'herbe, color grading, angle de depart du menu) |
| `public/assets/toonshooter/` | Assets GLTF placeholder (Quaternius low-poly) : Characters, Environment, Guns, Texture |
| `src/style.css` | Point d'entree CSS qui importe les feuilles base, HUD, controles mobiles et editeur |
| `src/styles/base.css` | Variables globales, fonts et styles de base du document |
| `src/styles/game-ui.css` | Styles du HUD, de l'overlay score et des panneaux UI communs |
| `src/styles/menu-ui.css` | Styles du menu cinematique mobile-first : hero title, selection Sarah/Nicolas, input et CTA |
| `src/styles/mobile-controls.css` | Styles des boutons d'action tactiles mobile et de leurs icones sprint/saut |
| `src/styles/editor.css` | Styles desktop-first de l'editeur de niveau integre |
| `src/config.ts` | Constantes de jeu : camera, mouvement, map, timing, items, rendu et palette du ciel |
| `src/types.ts` | Interfaces partagees : collisions, etat, assets et schema du niveau data-driven |
| `src/state.ts` | Gestion de l'etat du jeu : creation, reset, score, items collectes |
| `src/item-definitions.ts` | Catalogue des objets a trouver par personnage (ids, labels editeur, points) + generation/normalisation des pickups par defaut comme vraies entites du niveau |
| `src/assets.ts` | Chargement GLTF : manifeste, cache, clone, normalisation de taille |
| `src/level-data.ts` | Chargement et sauvegarde du niveau JSON principal |
| `src/color-grading.ts` | Reglages par defaut et normalisation du color grading et de la couleur d'herbe sauvegardes dans le niveau |
| `src/surface-settings.ts` | Reglages par defaut et normalisation des parametres de surfaces, dont le relief d'eau (profondeur, pente, irregularite des berges, variation du fond) |
| `src/level-grid.ts` | Utilitaires de grille pour surfaces path/water, conversion monde/cellule et normalisation du niveau (dont injection des pickups manquants) |
| `src/level-assets.ts` | Resolution et preload des assets utilises par les entites du niveau |
| `src/level-catalog.ts` | Construction du catalogue de palette de l'editeur depuis les catalogues Kenney |
| `src/terrain-ground.ts` | Sol de base deforme par le masque d'eau pour creuser les zones humides et lisser les berges |
| `src/editor-entity.ts` | Helpers d'entites pour l'editeur (creation depuis palette, update de proprietes, snap) |
| `src/editor-placement-preview.ts` | Ghost transparent de placement dans l'editeur pour visualiser l'objet avant pose |
| `src/editor-preview.ts` | Generation lazy de previews 3D pour chaque item de palette de l'editeur |
| `src/menu-anchor-helper.ts` | Helper 3D du `menu anchor` visible dans l'editeur pour positionner et orienter la mise en scene du menu |
| `src/editor-ui.ts` | Overlay DOM de l'editeur : palette, onglets, proprietes, toggle FX, couleur d'herbe, reglages path/water dont relief d'eau et pente de berge, color grading et status |
| `src/editor.ts` | Controleur de l'editeur : raycast, selection, drag, pinceau, toggle FX, couleur d'herbe, reglages de surfaces path/water, color grading, save/reload |
| `src/surface-layer-renderer.ts` | Rendu lisse des couches path/water a partir de la grille du niveau, sans tuiles carrees visibles |
| `src/main.ts` | Point d'entree : scene, renderer, lumieres, game loop, mode jeu et mode editeur |
| `src/player.ts` | Classe Player : mesh placeholder ou GLTF, deplacement direct (top-down), sprint explicite et saut avec clip `jump` |
| `src/player-dust.ts` | Particules legeres attachees au mouvement du joueur, plus denses en sprint pour ajouter du delight |
| `src/npc-animations.ts` | Controleur d'animations des PNJ : idle en boucle + emotes ponctuelles (`emote-yes` / `emote-no`) des personnages Kenney |
| `src/camera.ts` | Classe TopDownCamera : vue du dessus qui suit le joueur avec look-ahead |
| `src/editor-menu-angle.ts` | Ajoute dans l'editeur le bouton `Set start angle` qui capture la pose camera courante pour le menu |
| `src/menu-camera.ts` | Camera du menu : poses cine, drift doux et transitions scriptes entre titre, selection et lancement |
| `src/controls.ts` | Classe VirtualJoystick : joystick tactile + clavier WASD/Shift/Space, plus boutons mobile pour sprint et saut |
| `src/i18n.ts` | Localisation FR/EN : detection de `?english=1`, textes UI partages et application des traductions statiques du DOM |
| `src/menu-settings.ts` | Reglages du menu sauvegardes dans le niveau : normalisation, valeurs par defaut et capture de la camera de depart |
| `src/menu-scene.ts` | Mise en scene 3D du menu pres du moulin : podiums, personnages idle et accents de selection |
| `src/menu-ui.ts` | Overlay DOM du menu cinematique : titre hero, cartes Sarah/Nicolas, champ prenom et CTA |
| `src/menu.ts` | Orchestrateur du menu : machine d'etat titre/selection, camera, UI et transition vers le gameplay |
| `src/map.ts` | Scene de niveau data-driven : rendu du JSON, surfaces, entites et colliders |
| `src/ambient-effects.ts` | Effets ambiants attaches aux entites : roue du moulin animee et fumee procedurale sur les cheminees |
| `src/collision.ts` | Resolution des collisions : limites de map et AABB des entites/eau |
| `src/items.ts` | ItemManager : spawn des objets collectables, animation, detection de ramassage |
| `src/hud.ts` | HUD : timer, compteur d'objets, notifications et ecran de score |
| `src/grass.ts` | Systeme de grass instancie sur les cellules de pature : generation des brins, exclusions path/eau/colliders, rebuild et interaction avec le joueur |
| `game-design-document.md` | Game design document complet (concept, objets, scoring, flow, PNJ, planning) |
| `implementation-plan.md` | Plan d'implementation en 10 etapes avec checklist |
| `CLAUDE.md` | Fichier de compatibilite qui redirige vers `AGENTS.md` |
| `src/kenney-buildings.ts` | Assemblage de batiments modulaires Kenney (definitions de pieces, preloading, construction) |
| `src/prefab-roofs.ts` | Toits continus proceduraux des prefabs Kenney (gable et plat), pour eviter les assemblages de tuiles incoherents |
| `src/shaders/clock.ts` | Uniform `sharedTime` partage par tous les shaders animes, ticke une fois par frame depuis main |
| `src/shaders/toon.ts` | Conversion des materiaux GLTF en MeshToonMaterial avec gradient ramp 4 tons (look cartoon) |
| `src/shaders/outline.ts` | Outline cartoon par hull inverse (clone scale BackSide noir) sur les meshes non-skinned |
| `src/shaders/wind.ts` | Patch onBeforeCompile qui anime les vertices des arbres et bannieres avec sin(time) gate par Y |
| `src/shaders/sky.ts` | Ciel low-poly optimise : dome shader horizon-zenith avec halo de soleil + nuages low-poly instancies qui suivent la camera |
| `src/shaders/blob-shadow.ts` | Blob shadow circulaire (canvas radial) attache sous le joueur pour ancrer la silhouette |
| `src/shaders/water.ts` | ShaderMaterial pour la couche d'eau : vagues animees, ecume sur les bords, sparkles |
| `src/shaders/fresnel-pulse.ts` | Patch fresnel + sin pulse pour faire briller les pickups en silhouette |
| `src/shaders/dissolve.ts` | Patch dissolve par hash + step sur uniform progress, anime sur ramassage d'objet |
| `src/shaders/grass.ts` | ShaderMaterial du grass : vent GPU partage via `sharedTime`, eclairage simple, fog et courbure locale autour du joueur |
| `src/shaders/post.ts` | EffectComposer avec ShaderPass de color grading pilotable en live (contrast, saturation, warmth, vignette, lift) |
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
