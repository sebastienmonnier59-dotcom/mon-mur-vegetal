# Réception des leads + notifications e-mail (script partagé 4 sites)

`Code.gs` est le **script unique** qui reçoit les leads des 4 sites
(mon-mur-vegetal, chambre-froide-pro, equipement-pizzeria, bassin-piscine-naturelle),
les enregistre dans le bon Google Sheet et envoie les e-mails. Il remplace
l'ancien script — **on n'en ajoute pas un second** (un seul endpoint est branché
dans `assets/js/site.js`).

> ⚠️ Ce repo est public : les ID des 3 autres sites sont en **placeholder**
> (`ID_…`) dans `Code.gs`. Mets les vrais ID uniquement dans l'éditeur Apps
> Script (privé), jamais ici.

## Ce que fait le script

À chaque envoi de formulaire :

1. Route vers le bon Sheet via le champ `site`.
2. **Enregistre le lead par nom de colonne** (l'ordre des colonnes n'a pas
   d'importance ; une colonne absente est créée automatiquement). Colonnes cibles :

   `Commentaire | Date | Nom | Email | Téléphone | Code postal | Type de projet | Intérieur / Extérieur | Surface | Contexte | Détails | Budget | Délai | Page source`

   - `Commentaire` reste **vide** : c'est ta colonne de suivi (statut, relance…).
   - `Date` est automatique.
   - `Intérieur / Extérieur`, `Surface`, `Contexte` sont désormais capturés
     (l'ancien script les perdait).
3. Envoie un e-mail **interne** (toi) pour tous les sites, et un e-mail
   **au partenaire** si un partenaire est configuré pour ce site
   (`PARTNERS['mon-mur-vegetal.fr'].email`).

## Mise à jour (à faire une fois)

1. Ouvre ton projet Apps Script existant (celui déjà déployé pour les 4 sites).
2. Remplace tout le contenu par celui de `Code.gs`.
3. Renseigne, **dans l'éditeur uniquement** :
   - les vrais ID des 3 autres sites dans `SHEETS` (à la place des `ID_…`) ;
   - l'e-mail du partenaire dans `PARTNERS['mon-mur-vegetal.fr'].email` quand
     Thomas te l'aura donné (vide = seul ton mail interne part).
4. Lance `testLead` une fois (autorise Sheets + Gmail), vérifie la ligne de test
   et les e-mails.
5. **Déployer → Gérer les déploiements → (crayon) → Nouvelle version → Déployer.**
   L'URL ne change pas : rien à modifier dans le site.

## Colonne « Commentaire » en 1re position

Sur les feuilles **déjà remplies**, le script crée les colonnes manquantes à la
**fin** (il ne réordonne pas l'existant, pour ne pas casser tes données). Pour
avoir `Commentaire` tout devant, insère une fois manuellement une colonne en
tête de la feuille et nomme-la `Commentaire` : le script la reconnaîtra ensuite
par son nom. Sur une feuille vide, l'ordre ci-dessus est appliqué directement.
