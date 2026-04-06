# Wedding Quest - Game design document

## Pitch

"The Wedding is in 5 minutes! We need to hurry!"

La veille du mariage, Sarah et Nicolas ont un peu trop fait la fete. Le jour J, ils se reveillent en catastrophe, en sous-vetements, et leurs affaires sont eparpillees sur tout le lieu du mariage. Le joueur incarne Sarah ou Nicolas et doit retrouver tous les objets necessaires avant la ceremonie.

Jeu mobile web en 3D (Three.js), solo, envoye aux ~100 invites avant le mariage comme cadeau/animation. Ton humoristique, style low-poly cartoon.

---

## Specs techniques

| Element | Choix |
|---|---|
| Engine | Three.js (vanilla) |
| Bundler | Vite |
| Plateforme cible | Mobile web (responsive, jouable desktop aussi) |
| Backend | Supabase (leaderboard uniquement) |
| Hebergement | A definir (Vercel, Netlify, ou autre) |
| Acces | Lien direct + QR codes le jour J |
| Assets 3D | Low-poly cartoon, style Polygon / generes via Tripo AI |
| Modeles batiments | Fournis par Nicolas (lieu reel du mariage) |
| Musique/sons | A ajouter par Nicolas, ton comique |

---

## Flow du jeu

```
Ecran titre
  → Saisie du prenom
  → Choix du personnage (Sarah / Nicolas)
  → Intro cutscene (texte + mini cinematique)
  → Gameplay (timer 10 min)
  → Fondu au noir
  → Cinematique de fin (arrivee a la ceremonie)
  → Ecran de score
  → Leaderboard
  → Rejouer ?
```

---

## Ecran titre

- Logo "Wedding Quest"
- Fond : vue du lieu du mariage
- Bouton "Jouer"
- Champ de saisie : prenom du joueur (obligatoire, utilise pour le leaderboard)

---

## Choix du personnage

- Deux personnages cote a cote : Sarah et Nicolas
- Apercu 3D de chaque personnage (en sous-vetements, look comique)
- Tap pour selectionner, confirmation avant de lancer

---

## Intro cutscene

Sequence de texte avec les personnages a l'ecran (style bulles de dialogue / visual novel) :

1. Vue du lieu le matin, soleil qui tape
2. "Quelle soiree hier..."
3. Le personnage se reveille en sursaut, regarde l'heure
4. "LE MARIAGE EST DANS 10 MINUTES !"
5. Il/elle regarde autour : pas de vetements, rien
6. "Mes affaires... elles sont partout dehors !!"
7. Transition vers le gameplay

Le joueur avance le texte en tappant l'ecran.

---

## Gameplay

### Camera et controles

- Vue 3eme personne (camera derriere le personnage, legere plongee)
- Style Mario 3D / Zelda
- **Joystick gauche** : deplacement (virtuel, tactile)
- **Pas de joystick droit** : la camera suit le personnage automatiquement
- Bouton d'interaction (A) pour parler aux PNJ quand on est a proximite

### La map

- Reproduction stylisee du lieu du mariage en low-poly
- Une seule map ouverte, traversable en ~1 minute
- Terrain avec batiments, vegetation, chemins, points d'eau selon le lieu reel
- Les modeles 3D des batiments seront fournis et integres

### Les objets a collecter

Les objets flottent au-dessus du sol avec une legere rotation et un effet de brillance (glow/particules). On les ramasse en marchant dessus.

**Objets de Nicolas (10) - Total : 3 200 pts :**

| Objet | Points |
|---|---|
| Boutonniere | 50 |
| Boutons de manchettes | 50 |
| Cravate | 100 |
| Montre | 200 |
| Chaussures | 300 |
| Les voeux | 300 |
| Pantalon | 400 |
| Chemise | 400 |
| Veste | 400 |
| Les alliances | 1 000 |

**Objets de Sarah (10) - Total : 3 100 pts :**

| Objet | Points |
|---|---|
| Bracelet | 50 |
| Lentilles | 50 |
| Boucles d'oreilles | 100 |
| Trousse de maquillage | 100 |
| Voile | 200 |
| Les voeux | 300 |
| Chaussures | 400 |
| Bouquet | 400 |
| Robe | 500 |
| Les alliances | 1 000 |

Les objets simples (vetements de base) sont places dans des zones accessibles. Les objets rares (alliances, voeux) sont places dans des endroits moins evidents.

**Total objets : 3 200 points (Nicolas) / 3 100 points (Sarah)**

### Habillage progressif

Le personnage commence en sous-vetements. Chaque objet vestimentaire ramasse s'affiche sur le modele 3D du personnage en temps reel :
- Ramasser "Pantalon" → le personnage porte le pantalon
- Ramasser "Robe" → Sarah porte la robe
- etc.

Les petits objets (alliances, montre, boutons de manchettes) ne changent pas forcement le modele visible mais declenchent une animation/effet.

### Scoring

- **Points par objet** : selon le tableau ci-dessus (50-1 000)
- **Bonus temps** : temps restant (en secondes) x2 ajoute au score
- **Bonus completion** : tous les objets trouves = +500 points
- **Score max theorique** : ~4 900 points (tous objets 3 200 + bonus 500 + 600 secondes restantes x2)

### Timer

- 10 minutes, affiche en haut de l'ecran
- Les 60 dernieres secondes : le timer devient rouge et clignote
- Les 30 dernieres secondes : musique acceleree
- A zero : fin immediate, fondu au noir

### HUD

- Timer en haut au centre
- Compteur d'objets en haut a gauche (ex: "3/10")
- Joystick en bas a gauche
- Bouton interaction (A) en bas a droite (apparait a proximite d'un PNJ)
- Mini notification quand un objet est ramasse ("Pantalon recupere ! +100")

---

## PNJ (5-10 personnages)

### Fonctionnement

- Places a des endroits fixes sur la map
- Icone de dialogue visible au-dessus de leur tete (!)
- Quand le joueur s'approche, le bouton (A) apparait
- Interaction = mini cinematique style Zelda :
  - Camera recentree sur le PNJ
  - Bulle de dialogue
  - Le joueur tappe pour avancer le texte
  - Retour au gameplay

### Contenu des dialogues

Chaque PNJ a :
1. **Une vanne / reference** a l'histoire du couple ou aux invites
2. **Un indice** sur la localisation d'un objet ("J'ai vu tes chaussures trainer pres du lac, tu devais danser la-bas hier soir...")

Les dialogues sont differents selon le personnage choisi (Sarah ou Nicolas).

### Liste des PNJ (a personnaliser)

Les PNJ seront des amis/famille des maries. Nicolas fournira :
- Les prenoms
- Les vannes/references pour chacun
- Les indices associes

---

## Fin de partie

### Transition

- Fondu au noir
- Texte : "C'est l'heure de la ceremonie !"

### Cinematique de fin

- Le personnage arrive en courant a la ceremonie
- Si tous les objets : arrive parfaitement habille(e), fier(e)
- Si objets manquants : arrive avec les vetements manquants absents du modele (comique)
- Dans tous les cas : l'autre personnage (celui non joue) est deja la et attend

### Ecran de score

- Nom du joueur
- Personnage choisi
- Objets trouves (liste avec check/croix)
- Points par objet
- Bonus temps
- Bonus completion
- **Score total**
- Bouton "Voir le leaderboard"

---

## Leaderboard

- Heberge sur Supabase
- Mixte (Sarah et Nicolas ensemble)
- Colonnes : Rang, Prenom, Personnage (icone), Score, Objets trouves (X/10)
- Le joueur voit sa position surlignee
- Bouton "Rejouer" pour tenter un meilleur score
- Visible par tous les joueurs (aspect competitif entre invites)

### Donnees stockees par partie

```
{
  player_name: string,
  character: "sarah" | "nicolas",
  score: number,
  items_found: number,
  time_remaining: number,
  played_at: timestamp
}
```

---

## Style visuel

- **Low-poly cartoon** (style Polygon, Synty, ou assets generes via Tripo AI)
- Couleurs vives et chaleureuses
- Eclairage doux, ambiance matinale ensoleilllee
- Les objets a collecter brillent et flottent (particules dorees)
- Effets de feedback : flash de lumiere au ramassage, petite animation de celebration

---

## Scope et priorites

### MVP (semaines 1-2)

- [ ] Map basique avec terrain et placeholders pour les batiments
- [ ] Personnage jouable (un seul modele) avec deplacement 3eme personne
- [ ] Joystick tactile
- [ ] Objets collectables (cubes placeholder) avec ramassage au contact
- [ ] Timer + scoring basique
- [ ] HUD (timer, compteur, notifications)
- [ ] Ecran titre + saisie prenom
- [ ] Ecran de score fin de partie
- [ ] Leaderboard Supabase (lecture/ecriture)

### V1 (semaines 3-4)

- [ ] Choix du personnage Sarah/Nicolas
- [ ] Objets differents selon le personnage
- [ ] Modeles 3D des batiments (fournis par Nicolas)
- [ ] Assets low-poly pour les objets et personnages
- [ ] Habillage progressif du personnage
- [ ] PNJ avec dialogues et indices
- [ ] Intro cutscene (texte + transitions)
- [ ] Cinematique de fin
- [ ] Musique et effets sonores
- [ ] Polish visuel (particules, eclairage, animations)

### Nice to have (si le temps le permet)

- [ ] Animations de personnage (marche, course, idle, ramassage)
- [ ] Mini-map
- [ ] Personnalisation des PNJ (ressemblance avec les vrais invites)
- [ ] Effets meteo / cycle jour
- [ ] Easter eggs supplementaires

---

## Contraintes

- **Deadline** : ~30 jours (mariage debut mai 2026)
- **Performance** : doit tourner sur des smartphones moyens (budget draw calls et polygones)
- **Poids** : chargement rapide, assets optimises (< 20 MB ideal)
- **Pas de store** : jeu web, pas d'installation, acces par lien/QR
- **Offline** : le jeu doit fonctionner meme avec une connexion instable (leaderboard = seule feature online)
