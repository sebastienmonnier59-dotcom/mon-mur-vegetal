/* Verdalys — mon-mur-vegetal.fr
   Reception des leads du formulaire + enregistrement dans le Google Sheet
   + notification par email (proprietaire du site ET installateur partenaire).

   A coller dans Google Apps Script (script lie a la feuille, ou script autonome),
   puis a deployer en "Application Web" (voir README.md).

   Le formulaire du site poste vers ce script (assets/js/site.js -> LEAD_ENDPOINT).
   Le script ecrit chaque lead dans la feuille et envoie les emails.
   Les colonnes sont reperees PAR LEUR NOM d'entete : l'ordre des colonnes dans
   la feuille n'a donc pas d'importance, et une colonne manquante est creee
   automatiquement. La colonne "Commentaire" est laissee vide (usage interne). */

/* ============================ CONFIGURATION ============================ */

// ID du Google Sheet (dans l'URL : /spreadsheets/d/<ID>/edit).
var SHEET_ID = "1IYLAnZl5SJsdn3yX2U5U-Fd1kpqjm1fsZkAZ9AugwAQ";

// Nom de l'onglet a utiliser. Laisser "" pour la premiere feuille.
var SHEET_NAME = "";

// Email interne : tu recois une notif a chaque lead.
var OWNER_EMAIL = "sebastien.monnier59@gmail.com";

// Email de l'installateur partenaire (L'ere Vegetale).
// >>> A COMPLETER une fois que Thomas t'a donne son adresse. <<<
// Tant que c'est vide, seul le mail interne part.
var PARTNER_EMAIL = "";
var PARTNER_NAME = "L'ere Vegetale";

// Colonnes de la feuille, dans l'ordre souhaite (utilise seulement si des
// colonnes manquent : elles sont alors creees dans cet ordre).
var HEADERS = [
  "Commentaire",            // laissee vide, pour ton suivi (statut, notes...)
  "Date",                   // horodatage automatique du lead
  "Nom",
  "Email",
  "Telephone",
  "Code postal",
  "Type de projet",
  "Interieur / Exterieur",
  "Surface",
  "Contexte",
  "Details",
  "Budget",
  "Delai",
  "Page source"
];

// Correspondance : entete de colonne  ->  nom du champ envoye par le formulaire.
// "Commentaire" et "Date" ne sont pas ici (gerees a part).
var FIELD_MAP = {
  "Nom": "nom",
  "Email": "email",
  "Telephone": "telephone",
  "Code postal": "code_postal",
  "Type de projet": "type_projet",
  "Interieur / Exterieur": "implantation",
  "Surface": "surface",
  "Contexte": "contexte",
  "Details": "details",
  "Budget": "budget",
  "Delai": "delai",
  "Page source": "page"
};

/* ============================ POINT D'ENTREE ============================ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (err) { /* on continue quand meme */ }
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var sheet = getSheet_();
    var cols = ensureHeaders_(sheet);           // { "Nom": 3, "Date": 2, ... }

    var width = sheet.getLastColumn();
    var row = [];
    for (var i = 0; i < width; i++) row.push("");

    // Date automatique
    if (cols["Date"]) row[cols["Date"] - 1] = new Date();

    // Champs du formulaire
    for (var header in FIELD_MAP) {
      var idx = cols[header];
      if (idx) {
        var v = params[FIELD_MAP[header]];
        row[idx - 1] = (v == null ? "" : v);
      }
    }

    sheet.appendRow(row);
    sendNotifications_(params);

    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// Permet de verifier que le script est en ligne (ouvrir l'URL dans le navigateur).
function doGet() {
  return jsonOut_({ ok: true, service: "mon-mur-vegetal lead endpoint" });
}

/* ============================ OUTILS ============================ */

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME || "Leads");
  return sheet;
}

// S'assure que toutes les colonnes attendues existent (par nom d'entete).
// Retourne une map { entete -> index de colonne (1-based) }.
function ensureHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  var existing = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    : [];

  var map = {};
  for (var i = 0; i < existing.length; i++) {
    var h = existing[i];
    if (h !== "" && h != null) map[String(h).trim()] = i + 1;
  }

  // Cree les colonnes manquantes a la suite.
  for (var j = 0; j < HEADERS.length; j++) {
    var name = HEADERS[j];
    if (!map[name]) {
      lastCol += 1;
      sheet.getRange(1, lastCol).setValue(name);
      map[name] = lastCol;
    }
  }

  sheet.setFrozenRows(1);
  return map;
}

function sendNotifications_(p) {
  var link = "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit";
  var detail = [
    "Type de projet   : " + val_(p.type_projet),
    "Interieur/Ext.   : " + val_(p.implantation),
    "Surface          : " + val_(p.surface),
    "Contexte         : " + val_(p.contexte),
    "Delai            : " + val_(p.delai),
    "Budget           : " + val_(p.budget),
    "Code postal/ville: " + val_(p.code_postal),
    "Precisions       : " + val_(p.details),
    "",
    "Contact client :",
    "  Nom       : " + val_(p.nom),
    "  Telephone : " + val_(p.telephone),
    "  Email     : " + val_(p.email),
    "",
    "Page d'origine : " + val_(p.page),
    "Feuille de suivi : " + link
  ].join("\n");

  // 1) Notification interne (proprietaire du site)
  if (OWNER_EMAIL) {
    MailApp.sendEmail(
      OWNER_EMAIL,
      "Nouveau lead mur vegetal — " + val_(p.nom),
      detail
    );
  }

  // 2) Notification a l'installateur partenaire
  if (PARTNER_EMAIL) {
    var body = "Bonjour,\n\n"
      + "Un nouveau lead vient d'arriver via mon-mur-vegetal.fr.\n\n"
      + detail + "\n\n"
      + "Vous retrouvez l'ensemble des demandes ici :\n" + link + "\n\n"
      + "Bonne journee,\nSebastien";
    MailApp.sendEmail(
      PARTNER_EMAIL,
      "Nouveau lead mur vegetal a traiter",
      body
    );
  }
}

function val_(v) {
  return (v == null || v === "") ? "—" : String(v);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================ TEST ============================ */
// A lancer manuellement depuis l'editeur Apps Script pour tester
// (ecrit une ligne de test et envoie les emails).
function testLead() {
  doPost({ parameter: {
    nom: "Test Durand",
    telephone: "06 12 34 56 78",
    email: "test@exemple.fr",
    code_postal: "59000",
    type_projet: "Mur vegetal stabilise",
    implantation: "Interieur",
    surface: "5 a 15 m2",
    contexte: "Bureaux entreprise",
    details: "Test d'envoi depuis Apps Script",
    budget: "2000 a 5000 EUR",
    delai: "1 a 3 mois",
    page: "/devis-mur-vegetal.html"
  }});
}
