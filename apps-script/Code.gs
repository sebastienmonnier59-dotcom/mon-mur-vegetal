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

  // Version texte (repli pour les clients sans HTML)
  var text =
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
      '🌿 Nouveau lead ' + v_(d.site) + ' — ' + v_(d.type_projet),
      text,
      { name: 'Leads · mon-mur-vegetal', htmlBody: emailHtml_(d, link, '') });
  }

  // Notif partenaire (si configure pour ce site)
  var partner = PARTNERS[d.site];
  if (partner && partner.email) {
    var intro = 'Un nouveau lead vient d\'arriver via ' + v_(d.site) + '.';
    MailApp.sendEmail(partner.email,
      'Nouveau lead a traiter — ' + v_(d.site),
      text,
      { name: 'Verdalys', htmlBody: emailHtml_(d, link, intro) });
  }
}

/* Email HTML aux couleurs du site. intro = phrase d'accroche (partenaire) ou ''. */
function emailHtml_(d, link, intro) {
  var projet = [
    row_('Type de projet', v_(d.type_projet)),
    row_('Interieur / Ext.', v_(d.implantation)),
    row_('Surface', v_(d.surface)),
    row_('Contexte', v_(d.contexte)),
    row_('Budget', v_(d.budget)),
    row_('Delai', v_(d.delai))
  ].join('');

  var tel = (d.telephone ? '<a href="tel:' + esc_(String(d.telephone).replace(/[^0-9+]/g, '')) +
    '" style="color:#2f5c44;text-decoration:none;">' + esc_(d.telephone) + '</a>' : '—');
  var mail = (d.email ? '<a href="mailto:' + esc_(d.email) +
    '" style="color:#2f5c44;text-decoration:none;">' + esc_(d.email) + '</a>' : '—');
  var contact = [
    row_('Nom', v_(d.nom)),
    row_('Telephone', tel),
    row_('Email', mail),
    row_('CP / ville', v_(d.code_postal))
  ].join('');

  var details = '';
  if (d.details) {
    details =
      '<tr><td style="padding:6px 30px 4px;font:600 11px/1 Helvetica,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#6f7873;">Precisions</td></tr>' +
      '<tr><td style="padding:0 30px 18px;"><div style="background:#f7f6f1;border:1px solid #eeeee6;padding:14px 16px;color:#222824;font:400 15px/1.6 Helvetica,Arial,sans-serif;">' +
      esc_(d.details) + '</div></td></tr>';
  }

  var introBlock = intro
    ? '<tr><td style="padding:20px 30px 0;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:#222824;">' + esc_(intro) + '</td></tr>'
    : '';

  return '' +
  '<div style="background:#f7f6f1;padding:26px 12px;font-family:Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dfe2da;">' +
      '<tr><td style="background:#1d3a2b;padding:24px 30px;">' +
        '<div style="color:#9db89f;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nouveau lead &middot; ' + esc_(v_(d.site)) + '</div>' +
        '<div style="color:#ffffff;font:400 23px/1.3 Georgia,\'Times New Roman\',serif;margin-top:8px;">' + esc_(v_(d.type_projet)) + '</div>' +
      '</td></tr>' +
      introBlock +
      '<tr><td style="padding:22px 30px 2px;font:600 11px/1 Helvetica,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#6f7873;">Le projet</td></tr>' +
      '<tr><td style="padding:0 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + projet + '</table></td></tr>' +
      '<tr><td style="padding:20px 30px 2px;font:600 11px/1 Helvetica,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#6f7873;">Contact client</td></tr>' +
      '<tr><td style="padding:0 30px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + contact + '</table></td></tr>' +
      details +
      '<tr><td style="padding:10px 30px 26px;">' +
        '<a href="' + link + '" style="display:inline-block;background:#1d3a2b;color:#ffffff;text-decoration:none;padding:13px 24px;font:600 13px/1 Helvetica,Arial,sans-serif;letter-spacing:1px;">Ouvrir la feuille de suivi &rarr;</a>' +
      '</td></tr>' +
      '<tr><td style="background:#f7f6f1;border-top:1px solid #dfe2da;padding:15px 30px;color:#6f7873;font:400 12px/1.5 Helvetica,Arial,sans-serif;">' +
        'Verdalys &middot; ' + esc_(v_(d.site)) + '&nbsp;&middot;&nbsp; Page : ' + esc_(v_(d.page)) +
      '</td></tr>' +
    '</table>' +
  '</div>';
}

function row_(label, value) {
  return '<tr>' +
    '<td style="padding:9px 0;border-bottom:1px solid #eeeee6;color:#6f7873;font:400 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;width:140px;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:9px 0;border-bottom:1px solid #eeeee6;color:#222824;font:400 15px/1.5 Helvetica,Arial,sans-serif;">' + value + '</td>' +
    '</tr>';
}

function esc_(s) {
  s = (s == null ? '' : String(s));
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
