# Architecture

| Fichier | Description |
|---|---|
| `index.html` | Page HTML principale, meta viewport mobile, charge `src/main.js` |
| `vite.config.js` | Configuration Vite (host expose pour test mobile) |
| `package.json` | Dependances (three, vite) et scripts (dev, build, preview) |
| `src/main.js` | Point d'entree : scene, renderer, lumieres, sol, arbres placeholder, game loop |
| `src/player.js` | Classe Player : mesh placeholder (corps + tete + calecon), deplacement tank controls |
| `src/camera.js` | Classe ThirdPersonCamera : suit le joueur par derriere, freelook tactile avec retour automatique |
| `src/controls.js` | Classe VirtualJoystick : joystick fixe tactile en bas a gauche, input normalise |
| `game-design-document.md` | Game design document complet (concept, objets, scoring, flow, PNJ, planning) |
| `implementation-plan.md` | Plan d'implementation en 10 etapes avec checklist |
| `CLAUDE.md` | Instructions projet pour Claude Code |
