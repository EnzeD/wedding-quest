# Architecture

| Fichier | Description |
|---|---|
| `index.html` | Page HTML principale, meta viewport mobile, charge `src/main.ts` |
| `vite.config.ts` | Configuration Vite (host expose pour test mobile) |
| `tsconfig.json` | Configuration TypeScript (strict, ESNext modules) |
| `package.json` | Dependances (three, vite, typescript, @types/three) et scripts (dev, build, preview) |
| `src/types.ts` | Interfaces partagees : Collider (AABB batiments) et PondData (ellipse etang) |
| `src/main.ts` | Point d'entree : scene, renderer, lumieres, game loop, collisions |
| `src/player.ts` | Classe Player : mesh placeholder (corps + tete + calecon), deplacement tank controls |
| `src/camera.ts` | Classe ThirdPersonCamera : suit le joueur par derriere, freelook tactile avec retour automatique |
| `src/controls.ts` | Classe VirtualJoystick : joystick fixe tactile en bas a gauche, input normalise |
| `src/map.ts` | Orchestration de la map : terrain, chemins, gravier, collines, placement de tout |
| `src/buildings.ts` | Creation des batiments detailles : manoir (lucarnes, arches), grange (vitres), cottage, annexes |
| `src/vegetation.ts` | Types de vegetation : arbres (conifere, chene, peuplier, saule), buissons, parterres de fleurs, haies |
| `src/decorations.ts` | Elements de decor : bancs, tables, murets de pierre, lanternes, roseaux et nenufars de l'etang |
| `src/collision.ts` | Resolution des collisions : limites de map, AABB batiments, ellipse etang |
| `game-design-document.md` | Game design document complet (concept, objets, scoring, flow, PNJ, planning) |
| `implementation-plan.md` | Plan d'implementation en 10 etapes avec checklist |
| `CLAUDE.md` | Instructions projet pour Claude Code |
