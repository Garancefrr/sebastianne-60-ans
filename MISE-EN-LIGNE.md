# Mettre en ligne le site des 60 ans de Sébastianne

Deux étapes : relier le formulaire au tableau Google (5 min), puis héberger la page (5 min).

## 1. Relier le formulaire RSVP au tableau Google

1. Ouvre le tableau des hébergements (Google Sheets).
2. Menu **Extensions > Apps Script**. Un éditeur s'ouvre.
3. Efface le contenu du fichier `Code.gs` et colle à la place le contenu de `script-google-rsvp.gs`. Enregistre (icône disquette).
4. En haut à droite : **Déployer > Nouveau déploiement**.
   - Type : **Application Web** (clique sur la roue dentée pour le choisir).
   - Exécuter en tant que : **Moi**.
   - Qui a accès : **Tout le monde** (indispensable, sinon les invités ne pourront pas répondre).
   - Clique sur **Déployer**, puis autorise l'accès quand Google le demande (clique sur « Paramètres avancés » puis « Accéder au projet » si un avertissement s'affiche : c'est ton propre script).
5. Copie l'**URL de l'application Web** (elle se termine par `/exec`).
6. Ouvre `index.html` avec un éditeur de texte, cherche la ligne
   `var URL_RSVP = "COLLER_ICI_L_URL_DU_SCRIPT_GOOGLE";`
   et remplace le texte entre guillemets par l'URL copiée.
7. Test : ouvre `index.html` dans ton navigateur, remplis le formulaire, envoie. Un onglet **RSVP** apparaît dans le tableau avec ta réponse.

Si tu modifies le script plus tard : **Déployer > Gérer les déploiements > crayon > Nouvelle version > Déployer**. L'URL ne change pas.

## 2. Héberger la page (gratuit)

### Option A : Netlify Drop (le plus simple, sans compte technique)

1. Va sur https://app.netlify.com/drop
2. Glisse le dossier `site-60-ans` (ou juste `index.html`) dans la zone.
3. Netlify te donne une adresse du type `https://nom-aleatoire.netlify.app`. Tu peux la renommer dans **Site settings > Change site name**, par exemple `sebastianne-60-ans`.

### Option B : Vercel (tu connais déjà)

1. Crée un dépôt GitHub avec `index.html` à la racine.
2. Sur vercel.com : **Add New > Project**, importe le dépôt, déploie sans rien configurer.

## 3. Partager aux invités

Envoie l'adresse sur le groupe WhatsApp. La page comporte la mention « noindex » : elle n'apparaîtra pas dans Google, mais toute personne ayant le lien peut la voir. Garde le lien hors de portée de Sébastianne.

## Modifier le contenu plus tard

Tout est dans `index.html`, en clair :
- les horaires du programme : section `id="programme"` (retire les pastilles « à confirmer » quand c'est calé) ;
- les hébergements : section `id="dormir"` ;
- le texte d'accueil : section `class="hero"`.

Après modification, redépose le fichier sur Netlify (ou pousse sur GitHub pour Vercel).
