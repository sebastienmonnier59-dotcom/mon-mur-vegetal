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

// Theme email propre a chaque site (couleurs reprises de chaque site).
// header = fond du bandeau, headText = texte clair sur le bandeau,
// accent = liens, panel = fond clair, line/line2 = filets.
var THEMES = {
  'mon-mur-vegetal.fr':          { brand: 'Verdalys',     emoji: '🌿', header: '#1d3a2b', headText: '#9db89f', accent: '#2f5c44', panel: '#f7f6f1', line: '#dfe2da', line2: '#eeeee6' },
  'chambre-froide-pro.fr':       { brand: 'Frigalis',     emoji: '❄️', header: '#0b2e4a', headText: '#8fc0e6', accent: '#14507e', panel: '#eef5fb', line: '#d3dfe9', line2: '#dcebf7' },
  'equipement-pizzeria.fr':      { brand: 'Fornetto Pro', emoji: '🍕', header: '#241a16', headText: '#e8a05a', accent: '#a8321f', panel: '#faf4ea', line: '#e2d4c0', line2: '#f2e6d5' },
  'bassin-piscine-naturelle.fr': { brand: 'AquaJardin',   emoji: '💧', header: '#0f3f46', headText: '#7fc9cf', accent: '#176b76', panel: '#e6f4f4', line: '#d9e6e6', line2: '#d9e6e6' }
};
var THEME_DEFAULT = { brand: 'Lead', emoji: '📩', header: '#1d3a2b', headText: '#9db89f', accent: '#2f5c44', panel: '#f7f6f1', line: '#dfe2da', line2: '#eeeee6' };
function theme_(site) { return THEMES[site] || THEME_DEFAULT; }

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
  'Page source'             // URL d'ARRIVEE sur le site (page + parametres :
                            // gclid => Google Ads, page => sujet et ville)
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
  'Page source': 'landing'   // URL d'arrivee (et non la page du formulaire)
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
    'Arrivee   : ' + v_(d.landing) + '\n' +
    'Suivi     : ' + link;

  var t = theme_(d.site);
  var partner = PARTNERS[d.site];
  var subject = t.emoji + ' Nouveau lead ' + v_(d.site) + ' — ' + v_(d.type_projet);

  if (partner && partner.email) {
    // Un seul mail : au partenaire, avec le proprietaire (OWNER_EMAIL) en copie.
    MailApp.sendEmail(partner.email, subject, text,
      { name: t.brand, cc: OWNER_EMAIL,
        htmlBody: emailHtml_(d, link, 'Un nouveau lead vient d\'arriver via ' + v_(d.site) + '.') });
  } else if (OWNER_EMAIL) {
    // Aucun partenaire configure : mail au proprietaire seul.
    MailApp.sendEmail(OWNER_EMAIL, subject, text,
      { name: t.brand + ' · Leads', htmlBody: emailHtml_(d, link, '') });
  }
}

/* Email HTML aux couleurs du site (theme_(d.site)). intro = accroche partenaire ou ''. */
function emailHtml_(d, link, intro) {
  var t = theme_(d.site);

  var projet = [
    row_('Type de projet', v_(d.type_projet), t),
    row_('Interieur / Ext.', v_(d.implantation), t),
    row_('Surface', v_(d.surface), t),
    row_('Contexte', v_(d.contexte), t),
    row_('Budget', v_(d.budget), t),
    row_('Delai', v_(d.delai), t)
  ].join('');

  var tel = (d.telephone ? '<a href="tel:' + esc_(String(d.telephone).replace(/[^0-9+]/g, '')) +
    '" style="color:' + t.accent + ';text-decoration:none;">' + esc_(d.telephone) + '</a>' : '—');
  var mail = (d.email ? '<a href="mailto:' + esc_(d.email) +
    '" style="color:' + t.accent + ';text-decoration:none;">' + esc_(d.email) + '</a>' : '—');
  var contact = [
    row_('Nom', v_(d.nom), t),
    row_('Telephone', tel, t),
    row_('Email', mail, t),
    row_('CP / ville', v_(d.code_postal), t)
  ].join('');

  var lab = 'font:600 11px/1 Helvetica,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#6f7873;';

  var details = '';
  if (d.details) {
    details =
      '<tr><td style="padding:6px 30px 4px;' + lab + '">Precisions</td></tr>' +
      '<tr><td style="padding:0 30px 18px;"><div style="background:' + t.panel + ';border:1px solid ' + t.line2 + ';padding:14px 16px;color:#222824;font:400 15px/1.6 Helvetica,Arial,sans-serif;">' +
      esc_(d.details) + '</div></td></tr>';
  }

  var introBlock = intro
    ? '<tr><td style="padding:20px 30px 0;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:#222824;">' + esc_(intro) + '</td></tr>'
    : '';

  return '' +
  '<div style="background:' + t.panel + ';padding:26px 12px;font-family:Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ' + t.line + ';">' +
      '<tr><td style="background:' + t.header + ';padding:24px 30px;">' +
        '<div style="color:' + t.headText + ';font-size:11px;letter-spacing:3px;text-transform:uppercase;">' + esc_(t.brand) + ' &middot; nouveau lead</div>' +
        '<div style="color:#ffffff;font:400 23px/1.3 Georgia,\'Times New Roman\',serif;margin-top:8px;">' + esc_(v_(d.type_projet)) + '</div>' +
      '</td></tr>' +
      introBlock +
      '<tr><td style="padding:22px 30px 2px;' + lab + '">Le projet</td></tr>' +
      '<tr><td style="padding:0 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + projet + '</table></td></tr>' +
      '<tr><td style="padding:20px 30px 2px;' + lab + '">Contact client</td></tr>' +
      '<tr><td style="padding:0 30px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + contact + '</table></td></tr>' +
      details +
      '<tr><td style="padding:10px 30px 26px;">' +
        '<a href="' + link + '" style="display:inline-block;background:' + t.header + ';color:#ffffff;text-decoration:none;padding:13px 24px;font:600 13px/1 Helvetica,Arial,sans-serif;letter-spacing:1px;">Ouvrir la feuille de suivi &rarr;</a>' +
      '</td></tr>' +
      '<tr><td style="background:' + t.panel + ';border-top:1px solid ' + t.line + ';padding:15px 30px;color:#6f7873;font:400 12px/1.5 Helvetica,Arial,sans-serif;">' +
        esc_(t.brand) + ' &middot; ' + esc_(v_(d.site)) + '<br>Arrivee : ' + esc_(v_(d.landing)) +
      '</td></tr>' +
    '</table>' +
  '</div>';
}

function row_(label, value, t) {
  var line = (t && t.line2) ? t.line2 : '#eeeee6';
  return '<tr>' +
    '<td style="padding:9px 0;border-bottom:1px solid ' + line + ';color:#6f7873;font:400 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;width:140px;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:9px 0;border-bottom:1px solid ' + line + ';color:#222824;font:400 15px/1.5 Helvetica,Arial,sans-serif;">' + value + '</td>' +
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

/* ============================ TESTS PAR SITE ============================ */
// Lance la fonction du site voulu depuis l'editeur Apps Script (menu ▶).
// Chaque test ecrit une ligne dans LE sheet du site + envoie l'email theme.

function testLeadMurVegetal() {
  doPost({ parameter: {
    site: 'mon-mur-vegetal.fr', nom: 'TEST Verdalys (a supprimer)', telephone: '0612345678',
    email: 'sebastien.monnier59@gmail.com', code_postal: '59000', type_projet: 'Mur vegetal stabilise',
    implantation: 'Interieur', surface: '5 a 15 m2', contexte: 'Bureaux entreprise',
    details: 'Test complet du formulaire mur vegetal', budget: '2000 a 5000 EUR',
    delai: '1 a 3 mois', page: '/devis-mur-vegetal.html',
    landing: 'https://www.mon-mur-vegetal.fr/mur-vegetal-marseille.html?gclid=TEST123', gclid: 'TEST123',
    referrer: 'https://www.google.com/'
  }});
}

function testLeadChambreFroide() {
  doPost({ parameter: {
    site: 'chambre-froide-pro.fr', nom: 'TEST Frigalis (a supprimer)', telephone: '0612345678',
    email: 'sebastien.monnier59@gmail.com', code_postal: '59000', type_projet: 'Chambre froide positive',
    contexte: 'Restaurant', details: 'Test complet chambre froide', budget: '5000 a 10000 EUR',
    delai: '1 a 3 mois', page: '/devis.html'
  }});
}

function testLeadPizzeria() {
  doPost({ parameter: {
    site: 'equipement-pizzeria.fr', nom: 'TEST Fornetto (a supprimer)', telephone: '0612345678',
    email: 'sebastien.monnier59@gmail.com', code_postal: '59000', type_projet: 'Four a pizza professionnel',
    contexte: 'Pizzeria', details: 'Test complet equipement pizzeria', budget: 'Plus de 10000 EUR',
    delai: 'Moins d un mois', page: '/devis.html'
  }});
}

function testLeadBassin() {
  doPost({ parameter: {
    site: 'bassin-piscine-naturelle.fr', nom: 'TEST AquaJardin (a supprimer)', telephone: '0612345678',
    email: 'sebastien.monnier59@gmail.com', code_postal: '59000', type_projet: 'Bassin de baignade naturelle',
    contexte: 'Particulier', details: 'Test complet bassin naturel', budget: 'Plus de 10000 EUR',
    delai: '3 a 6 mois', page: '/devis.html'
  }});
}
