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

## Structure du projet

Voir `architecture.md` pour le detail fichier par fichier.
