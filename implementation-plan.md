# Implementation plan

Chaque etape produit un resultat jouable/testable sur mobile. Tester et valider avant de passer a la suivante.

---

## Etape 1 - Personnage et controles ✅

**Objectif** : un personnage qui se deplace avec un joystick tactile, camera top-down.

- [x] Creer un personnage placeholder (capsule corps + tete + calecon) + chargement GLTF
- [x] Joystick virtuel tactile fixe (zone bas-gauche de l'ecran)
- [x] Deplacement direct (joystick = direction monde, pas tank controls)
- [x] Clavier WASD/fleches pour desktop
- [x] Camera top-down qui suit le joueur avec look-ahead
- [x] DeltaTime pour un mouvement constant

---

## Etape 2 - La map ✅

**Objectif** : un terrain avec des zones distinctes, des batiments GLTF placeholder, et des limites.

- [x] Terrain 90x90 base sur le lieu reel
- [x] Chemins de pierre entre les batiments
- [x] Systeme de chargement GLTF (manifeste assets.json, cache, normalisation)
- [x] Batiments GLTF placeholder (Structure_1-4 de Quaternius) avec collisions AABB
- [x] Vegetation GLTF placeholder (Tree_1-4) aux positions du lieu reel
- [x] Decorations GLTF placeholder (Barrier, Crate, StreetLight, Sign, etc.)
- [x] Etang avec collision ellipse
- [x] Limites de la map (haies de bordure)

**Test** : parcourir toute la map sur mobile, verifier que ca prend ~1 minute, que les collisions marchent.

---

## Etape 3 - Les objets collectables ✅

**Objectif** : des objets apparaissent sur la map, flottent, brillent, et sont ramasses au contact.

- [x] Systeme de spawn d'objets a des positions fixes (ItemManager)
- [x] Objets flottants avec rotation lente + anneau glow dore
- [x] Detection de collision joueur/objet (ramassage au contact)
- [x] Suppression de l'objet au ramassage + notification texte
- [x] HUD : compteur d'objets (X/10) en haut a gauche
- [x] Notification temporaire au ramassage ("Pantalon +400")
- [x] Liste d'objets differente selon le personnage (Sarah / Nicolas)
- [x] Asset GLTF placeholder (Key) pour les objets

**Test** : se balader et ramasser des objets, verifier le compteur et les notifications.

---

## Etape 4 - Timer et scoring ✅

**Objectif** : la boucle de jeu complete fonctionne du debut a la fin.

- [x] Timer de 10 minutes affiche en haut au centre
- [x] Timer orange sous 60s, rouge clignotant sous 30s
- [x] Fin de partie quand timer = 0 OU tous les objets ramasses
- [x] Calcul du score : points objets + bonus temps (secondes x2) + bonus completion (+500)
- [x] Ecran de score : liste des objets, detail des points, score total
- [ ] Fondu au noir a la fin (a ajouter)

**Test** : jouer une partie complete, verifier que le score est correct, tester le cas "temps ecoule" et "tous les objets trouves".

---

## Etape 5 - Les ecrans (flow complet) ✅ (partiel)

**Objectif** : le joueur peut enchainer tout le flow sans interruption.

- [x] Ecran titre (logo "Wedding Quest", bouton Jouer)
- [x] Saisie du prenom sur l'ecran titre
- [x] Choix du personnage (Sarah / Nicolas) avec boutons
- [x] Ecran de score avec bouton "Rejouer"
- [x] Gestion des etats du jeu (menu, playing, score)
- [ ] Transitions entre les ecrans (fondu ou slide)
- [ ] Bouton "Voir le leaderboard"
- [ ] Apercu 3D du personnage sur l'ecran de selection

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
