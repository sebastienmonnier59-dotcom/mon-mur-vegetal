# Réception des leads + notifications e-mail

Ce dossier contient le script Google Apps Script qui fait le lien entre le
formulaire du site (`assets/js/site.js`) et le Google Sheet des leads, et qui
envoie un e-mail à chaque nouvelle demande.

## Ce que fait le script

À chaque envoi du formulaire :

1. **Enregistre le lead** dans le Google Sheet avec ces colonnes :

   `Commentaire | Date | Nom | Email | Téléphone | Code postal | Type de projet | Intérieur / Extérieur | Surface | Contexte | Détails | Budget | Délai | Page source`

   - `Commentaire` (1re colonne) est laissée **vide** : c'est ta colonne de suivi
     (statut, relance, notes…).
   - `Date` est remplie automatiquement (horodatage du lead).
   - Les colonnes sont repérées **par leur nom d'en-tête** : l'ordre des colonnes
     dans la feuille n'a pas d'importance, et une colonne absente est créée
     automatiquement.

2. **Envoie deux e-mails** avec le détail du projet + le lien vers le Sheet :
   - à toi (`OWNER_EMAIL`) ;
   - à l'installateur partenaire (`PARTNER_EMAIL`).

## Installation (une seule fois)

1. Ouvre le Google Sheet des leads, puis **Extensions → Apps Script**.
2. Colle le contenu de `Code.gs` dans l'éditeur (remplace ce qu'il y a).
3. En haut du fichier, renseigne la configuration :
   - `PARTNER_EMAIL` = l'adresse que Thomas t'aura donnée (tant que c'est vide,
     seul ton e-mail interne part).
   - `SHEET_ID` et `OWNER_EMAIL` sont déjà pré-remplis, vérifie-les.
4. Lance une fois la fonction `testLead` (menu déroulant des fonctions →
   `testLead` → ▶). Autorise les accès demandés (Sheets + Gmail). Vérifie qu'une
   ligne de test apparaît dans la feuille et que les e-mails arrivent.
5. **Déployer → Nouveau déploiement → Application Web** :
   - *Exécuter en tant que* : **moi** ;
   - *Qui a accès* : **Tout le monde** ;
   - Déployer, puis copie l'**URL de l'application web** (`…/exec`).
6. Si cette URL est **différente** de celle déjà dans
   `assets/js/site.js` (`LEAD_ENDPOINT`), remplace-la par la nouvelle et
   redéploie le site.

## Mettre à jour le script plus tard

Après toute modif de `Code.gs`, refais **Déployer → Gérer les déploiements →
(crayon) → Nouvelle version → Déployer** pour que les changements soient pris en
compte. L'URL, elle, ne change pas.

## Remarque

Le champ `PARTNER_EMAIL` est volontairement laissé vide dans le code : renseigne-le
seulement quand l'accord avec l'installateur est calé (taux de commission validé,
adresse de réception confirmée).
