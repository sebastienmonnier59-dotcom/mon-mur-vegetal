/* Verdalys — script UNIQUE de reception des leads pour les 4 sites.
   A coller dans TON projet Google Apps Script existant (celui deja deploye),
   en remplacement de l'ancien contenu. Un seul deploiement, un seul endpoint.

   Le formulaire de chaque site poste ici avec un champ "site" ; le script
   route vers le bon Google Sheet, enregistre le lead PAR NOM DE COLONNE
   (l'ordre des colonnes n'a pas d'importance, une colonne manquante est creee)
   et envoie les notifications email.

   ⚠ Repo public : les ID des 3 AUTRES sites sont ici en placeholder.
   Mets les vrais ID uniquement dans l'editeur Apps Script (prive), pas ici. */

/* ============================ CONFIGURATION ============================ */

var SHEETS = {
  'mon-mur-vegetal.fr':        '1IYLAnZl5SJsdn3yX2U5U-Fd1kpqjm1fsZkAZ9AugwAQ',
  'chambre-froide-pro.fr':     'ID_CHAMBRE_FROIDE',      // <- vrai ID dans Apps Script
  'equipement-pizzeria.fr':    'ID_EQUIPEMENT_PIZZERIA', // <- vrai ID dans Apps Script
  'bassin-piscine-naturelle.fr':'ID_BASSIN_PISCINE'      // <- vrai ID dans Apps Script
};

// Notification interne : tu recois un mail a chaque lead, quel que soit le site.
var OWNER_EMAIL = 'sebastien.monnier59@gmail.com';

// Installateurs partenaires, par site. Laisser email vide = pas d'envoi partenaire.
var PARTNERS = {
  'mon-mur-vegetal.fr': { email: '', name: "L'ere Vegetale" }
  // ex. plus tard : 'bassin-piscine-naturelle.fr': { email: '...', name: '...' }
};

// Colonnes cibles, dans l'ordre souhaite. Utilise tel quel si la feuille est
// vide ; sur une feuille existante, seules les colonnes manquantes sont ajoutees
// (a la fin) — voir note "Commentaire" dans le README.
var HEADERS = [
  'Commentaire',            // laissee vide : ton suivi (statut, relance, notes)
  'Date',                   // horodatage automatique
  'Nom',
  'Email',
  'Telephone',
  'Code postal',
  'Type de projet',
  'Interieur / Exterieur',
  'Surface',
  'Contexte',
  'Details',
  'Budget',
  'Delai',
  'Page source'
];

// entete de colonne -> nom du champ envoye par le formulaire.
var FIELD_MAP = {
  'Nom': 'nom',
  'Email': 'email',
  'Telephone': 'telephone',
  'Code postal': 'code_postal',
  'Type de projet': 'type_projet',
  'Interieur / Exterieur': 'implantation',
  'Surface': 'surface',
  'Contexte': 'contexte',
  'Details': 'details',
  'Budget': 'budget',
  'Delai': 'delai',
  'Page source': 'page'
};

/* ============================ POINT D'ENTREE ============================ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (err) {}
  try {
    var d = (e && e.parameter) ? e.parameter : {};
    var id = SHEETS[d.site];
    if (!id || id.indexOf('ID_') === 0) return out('site inconnu');

    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    var cols = ensureHeaders_(sheet);

    var width = sheet.getLastColumn();
    var row = [];
    for (var i = 0; i < width; i++) row.push('');
    if (cols['Date']) row[cols['Date'] - 1] = new Date();
    for (var header in FIELD_MAP) {
      var idx = cols[header];
      if (idx) { var v = d[FIELD_MAP[header]]; row[idx - 1] = (v == null ? '' : v); }
    }
    sheet.appendRow(row);

    notify_(d);
    return out('ok');
  } catch (err) {
    return out('erreur : ' + err);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet() { return out('ok'); }

/* ============================ OUTILS ============================ */

// Cree les colonnes manquantes (par nom). Retourne { entete -> index 1-based }.
function ensureHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  var existing = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var map = {};
  for (var i = 0; i < existing.length; i++) {
    var h = existing[i];
    if (h !== '' && h != null) map[String(h).trim()] = i + 1;
  }
  for (var j = 0; j < HEADERS.length; j++) {
    var name = HEADERS[j];
    if (!map[name]) { lastCol += 1; sheet.getRange(1, lastCol).setValue(name); map[name] = lastCol; }
  }
  sheet.setFrozenRows(1);
  return map;
}

function notify_(d) {
  var link = 'https://docs.google.com/spreadsheets/d/' + (SHEETS[d.site] || '') + '/edit';
  var detail =
    'Nom       : ' + v_(d.nom) + '\n' +
    'Telephone : ' + v_(d.telephone) + '\n' +
    'Email     : ' + v_(d.email) + '\n' +
    'CP / ville : ' + v_(d.code_postal) + '\n' +
    'Projet    : ' + v_(d.type_projet) + '\n' +
    'Int./Ext. : ' + v_(d.implantation) + '\n' +
    'Surface   : ' + v_(d.surface) + '\n' +
    'Contexte  : ' + v_(d.contexte) + '\n' +
    'Budget    : ' + v_(d.budget) + '\n' +
    'Delai     : ' + v_(d.delai) + '\n' +
    'Details   : ' + v_(d.details) + '\n' +
    'Page      : ' + v_(d.page) + '\n' +
    'Suivi     : ' + link;

  // Notif interne (tous sites)
  if (OWNER_EMAIL) {
    MailApp.sendEmail(OWNER_EMAIL,
      '🔥 Nouveau lead ' + v_(d.site) + ' — ' + v_(d.type_projet),
      detail);
  }

  // Notif partenaire (si configure pour ce site)
  var partner = PARTNERS[d.site];
  if (partner && partner.email) {
    MailApp.sendEmail(partner.email,
      'Nouveau lead a traiter — ' + v_(d.site),
      'Bonjour,\n\nUn nouveau lead vient d\'arriver via ' + v_(d.site) + ' :\n\n' +
      detail + '\n\nBonne journee,\nSebastien');
  }
}

function v_(x) { return (x == null || x === '') ? '—' : String(x); }

function out(m) {
  return ContentService.createTextOutput(JSON.stringify({ status: m }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================ TEST ============================ */
function testLead() {
  doPost({ parameter: {
    site: 'mon-mur-vegetal.fr', nom: 'Test Durand', telephone: '06 12 34 56 78',
    email: 'test@exemple.fr', code_postal: '59000', type_projet: 'Mur vegetal stabilise',
    implantation: 'Interieur', surface: '5 a 15 m2', contexte: 'Bureaux entreprise',
    details: 'Test', budget: '2000 a 5000 EUR', delai: '1 a 3 mois',
    page: '/devis-mur-vegetal.html'
  }});
}
