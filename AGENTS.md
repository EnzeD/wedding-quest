# Wedding Quest

Jeu mobile web 3D (Three.js + Vite) pour le mariage de Sarah et Nicolas. Envoye aux invites (~100) comme cadeau avant le mariage.

## Concept

Course contre la montre en vue 3eme personne. Le joueur incarne Sarah ou Nicolas, reveille en sous-vetements le matin du mariage, et doit retrouver ses affaires eparpillees sur la map (le lieu du mariage) en 10 minutes.

## Regles de dev

- Always read `architecture.md` at the start of each conversation.
- Keep `architecture.md` up to date when adding or removing files.
- Before committing, verify all new/removed files are reflected in `architecture.md`.
- Files must be < 300 lines — split into smaller modules if approaching this limit.
- Lire `game-design-document.md` avant tout travail sur le gameplay, le scoring, les objets, ou le flow du jeu.
- Mobile first : tout doit etre jouable au tactile, tester les joysticks et boutons sur mobile.
- Performance : budget strict, smartphones moyens. Limiter les draw calls, utiliser des assets low-poly.
- Assets 3D : style low-poly cartoon (Polygon/Synty). Modeles batiments fournis par Nicolas, objets et personnages generes via Tripo AI.
- Backend : Supabase pour le leaderboard uniquement. Ne pas pousser de config Supabase en local.
- Le jeu doit fonctionner offline sauf pour le leaderboard.
- Poids total des assets < 20 MB.

## Stack

- Three.js (vanilla, pas de framework par-dessus)
- Vite (dev + build)
- Supabase (leaderboard)
- Deploiement : a definir (Vercel/Netlify)

## Assets Kenney Fantasy Town Kit 2.0

- 167 modeles modulaires GLB dans `public/assets/kenney/`, licence CC0.
- Catalogue complet dans `public/kenney-catalog.json` : categories, dimensions, vertices, regles d'assemblage.
- Grille modulaire de 1.0 unite. Les murs font 1.0 de haut, places au bord +X de la cellule (x=0.4 a 0.5).
- Pour assembler un batiment : sol (planks) a Y=0, murs autour du perimetre, empiler (Y += 1.0 par etage), toit par-dessus, puis details (cheminee, bannieres, etc).
- Les murs se tournent par increments de 90 degres pour couvrir les 4 cotes.
- Toujours consulter `kenney-catalog.json` avant d'assembler des batiments pour verifier les dimensions et les regles de snap.

## Assets Kenney Mini Characters

- Modeles GLB dans `public/assets/kenney-mini-characters/`, texture partagee dans `public/assets/kenney-mini-characters/Textures/colormap.png`, licence CC0 (`License.txt` copie dans le meme dossier).
- Catalogue rapide dans `public/kenney-mini-characters.json` : defaults joueur, variantes male/female, accessoires et fauteuils.
- Les chemins runtime du joueur vivent dans `public/assets.json` sous `characters.nicolas` et `characters.sarah`. Garder `characters.player` comme fallback.
- Par defaut, Nicolas utilise `character-male-a.glb` et Sarah `character-female-a.glb`. Pour changer de variante, modifier d'abord `public/assets.json`, puis verifier le rendu in-game.
- Utiliser de preference les `.glb` de ce pack pour le joueur, les PNJ et les variantes low-poly humaines. Les accessoires (`aid-*`) et fauteuils (`wheelchair*`) peuvent servir d'objets decoratifs ou pickups.
- Si tu ajoutes de nouveaux usages de ce kit, mettre a jour `public/kenney-mini-characters.json` et `architecture.md`.

## Skills Three.js locaux

- Les skills Three.js vendorises pour ce projet vivent dans `.codex/skills/threejs-*/SKILL.md`.
- Pour le travail Three.js dans ce repo, preferer ces copies locales au lieu de dependre d'une installation globale.
- Si tu mets a jour ces skills depuis l'upstream `cloudai-x/threejs-skills`, committer aussi les copies locales du repo.

## Structure du projet

Voir `architecture.md` pour le detail fichier par fichier.
