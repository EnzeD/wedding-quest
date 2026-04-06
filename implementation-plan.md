# Implementation plan

Chaque etape produit un resultat jouable/testable sur mobile. Tester et valider avant de passer a la suivante.

---

## Etape 1 - Personnage et controles

**Objectif** : un personnage (cube) qui se deplace sur un sol plat avec un joystick tactile, camera 3eme personne.

- [ ] Creer un personnage placeholder (cube ou capsule)
- [ ] Joystick virtuel tactile (zone bas-gauche de l'ecran)
- [ ] Deplacement du personnage selon l'input du joystick
- [ ] Camera 3eme personne qui suit le personnage (derriere, legere plongee)
- [ ] Rotation du personnage dans la direction du mouvement
- [ ] Limiter le framerate / deltaTime pour un mouvement constant

**Test** : ouvrir sur mobile, deplacer le cube dans toutes les directions, verifier que la camera suit bien.

---

## Etape 2 - La map

**Objectif** : un terrain avec des zones distinctes, des batiments placeholder, et des limites.

- [ ] Terrain plus grand (dimensions a definir selon le lieu reel)
- [ ] Sol avec texture ou couleur par zone (herbe, chemin, eau)
- [ ] Batiments placeholder (boites avec couleurs differentes)
- [ ] Collisions : le personnage ne traverse pas les batiments
- [ ] Limites de la map (murs invisibles ou bord naturel)
- [ ] Arbres/vegetation placeholder pour meubler

**Test** : parcourir toute la map sur mobile, verifier que ca prend ~1 minute, que les collisions marchent.

---

## Etape 3 - Les objets collectables

**Objectif** : des objets apparaissent sur la map, flottent, brillent, et sont ramasses au contact.

- [ ] Systeme de spawn d'objets a des positions fixes
- [ ] Objets flottants avec rotation lente + effet glow/particules
- [ ] Detection de collision joueur/objet (ramassage au contact)
- [ ] Suppression de l'objet au ramassage + feedback visuel (flash, texte)
- [ ] HUD : compteur d'objets (X/10) en haut a gauche
- [ ] Notification temporaire au ramassage ("Pantalon recupere ! +400")
- [ ] Charger la bonne liste d'objets selon le personnage choisi (placeholder pour l'instant)

**Test** : se balader et ramasser des objets, verifier le compteur et les notifications.

---

## Etape 4 - Timer et scoring

**Objectif** : la boucle de jeu complete fonctionne du debut a la fin.

- [ ] Timer de 10 minutes affiche en haut au centre
- [ ] Timer rouge clignotant sous 60 secondes
- [ ] Fin de partie quand timer = 0 OU tous les objets ramasses
- [ ] Calcul du score : points objets + bonus temps (secondes x2) + bonus completion (+500)
- [ ] Fondu au noir a la fin
- [ ] Ecran de score : liste des objets (check/croix), detail des points, score total

**Test** : jouer une partie complete, verifier que le score est correct, tester le cas "temps ecoule" et "tous les objets trouves".

---

## Etape 5 - Les ecrans (flow complet)

**Objectif** : le joueur peut enchainer tout le flow sans interruption.

- [ ] Ecran titre (logo, bouton Jouer)
- [ ] Ecran saisie du prenom
- [ ] Ecran choix du personnage (Sarah / Nicolas) avec apercu
- [ ] Transitions entre les ecrans (fondu ou slide)
- [ ] Ecran de score avec bouton "Voir le leaderboard" et "Rejouer"
- [ ] Gestion des etats du jeu (menu, playing, score, leaderboard)

**Test** : parcourir tout le flow sur mobile, du titre jusqu'au score, puis rejouer.

---

## Etape 6 - Leaderboard

**Objectif** : les scores sont enregistres et visibles par tous les joueurs.

- [ ] Setup Supabase : table scores (player_name, character, score, items_found, time_remaining, played_at)
- [ ] Envoi du score a Supabase en fin de partie
- [ ] Ecran leaderboard : classement de tous les joueurs
- [ ] Colonnes : rang, prenom, personnage (icone), score, objets (X/10)
- [ ] Position du joueur surlignee
- [ ] Gestion offline : stocker le score localement si pas de connexion, envoyer plus tard

**Test** : jouer deux parties avec des prenoms differents, verifier que les deux scores apparaissent dans le leaderboard.

---

## Etape 7 - PNJ et dialogues

**Objectif** : des personnages fixes sur la map avec qui on peut interagir pour avoir des indices.

- [ ] PNJ placeholder (cylindres ou capsules avec un "!" au-dessus)
- [ ] Detection de proximite : bouton (A) apparait en bas a droite quand le joueur est proche
- [ ] Systeme de dialogue : camera se recentre, bulle de texte, tap pour avancer
- [ ] Dialogues differents selon le personnage choisi (Sarah / Nicolas)
- [ ] Contenu placeholder (a remplacer par les vraies vannes de Nicolas)
- [ ] Retour au gameplay apres le dialogue

**Test** : approcher un PNJ, lire le dialogue, verifier que le gameplay reprend normalement.

---

## Etape 8 - Intro et fin

**Objectif** : les cutscenes encadrent la partie et racontent l'histoire.

- [ ] Intro : sequence de texte/dialogue (style visual novel), tap pour avancer
  - Reveil en catastrophe
  - "LE MARIAGE EST DANS 10 MINUTES !"
  - Transition vers le gameplay
- [ ] Fin : fondu au noir, texte "C'est l'heure de la ceremonie !"
  - Le personnage arrive a la ceremonie (habille ou non selon les objets)
  - Transition vers l'ecran de score
- [ ] Skip possible pour les joueurs qui rejouent

**Test** : jouer le flow complet avec intro et fin, verifier le skip au replay.

---

## Etape 9 - Assets definitifs

**Objectif** : remplacer tous les placeholders par les vrais modeles 3D.

- [ ] Modeles des batiments (fournis par Nicolas)
- [ ] Modeles des personnages Sarah et Nicolas (low-poly)
- [ ] Habillage progressif : chaque vetement ramasse s'affiche sur le personnage
- [ ] Modeles 3D des objets collectables
- [ ] Modeles des PNJ
- [ ] Textures du terrain
- [ ] Optimisation : LOD, compression textures, budget polygones

**Test** : jouer une partie complete avec les vrais assets, verifier les performances sur mobile.

---

## Etape 10 - Polish

**Objectif** : le jeu est agreable, fluide, et pret a etre envoye aux invites.

- [ ] Particules au ramassage d'objets
- [ ] Animations du personnage (idle, marche, ramassage) si le modele le permet
- [ ] Musique et effets sonores (fournis par Nicolas)
- [ ] Vibration au ramassage (API Vibration mobile)
- [ ] Ecran de chargement
- [ ] Vrais dialogues des PNJ (textes fournis par Nicolas)
- [ ] Test de performance sur differents telephones
- [ ] Deploiement final (Vercel/Netlify)
- [ ] QR code genere pour le jour J

**Test** : faire tester par 2-3 proches, corriger les bugs et ajuster l'equilibrage.
