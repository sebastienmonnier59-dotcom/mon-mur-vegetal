/* VERDALYS — mon-mur-vegetal.fr */

var LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbxHv-y7WQSPsqpFnRtcS7OygjE1gRAjlRGKE3GqrXhI1pGzTaNVhtzXxZWq4y1cIlcH5Q/exec";
var SITE_ID = "mon-mur-vegetal.fr";

/* Google Ads — conversion "lead" a l'envoi du formulaire.
   Coller le libelle de l'action de conversion entre les guillemets
   (Google Ads > Objectifs > Conversions > l'action > "Etiquette de conversion").
   Tant qu'il est vide, seul l'evenement generate_lead (GA4) est envoye. */
var ADS_ID = "AW-18352922263";
var ADS_CONVERSION_LABEL = "mFpNCMLhiNccEJe9ra9E";

document.addEventListener("DOMContentLoaded", function () {
  memoriserProvenance();
  var burger = document.querySelector(".burger");
  var menu = document.querySelector("nav.menu");
  if (burger && menu) burger.addEventListener("click", function () { menu.classList.toggle("open"); });
  initSousMenus();
  injecterDevisEnPage();
  initDevis();
});

/* --- Formulaire integre en bas de page ----------------------------------
   Les pages de contenu qui recoivent le trafic publicitaire portent un
   <section id="devis-inline"> : on y injecte le meme simulateur que sur la
   page devis, plutot que de renvoyer le visiteur vers une autre page.
   Une seule source de verite (ci-dessous), pas de copie dans chaque page.

   Pre-remplissage : les attributs data-type-projet / data-contexte /
   data-implantation du <section> pre-selectionnent une reponse et
   SUPPRIMENT l'etape correspondante. Sur la page hotellerie-restauration,
   par exemple, le visiteur ne se voit plus demander son contexte. */
function injecterDevisEnPage() {
  var hote = document.getElementById("devis-inline");
  if (!hote || document.getElementById("devis")) return;

  var prefill = {};
  if (hote.dataset.typeProjet)  prefill.type_projet  = hote.dataset.typeProjet;
  if (hote.dataset.contexte)    prefill.contexte     = hote.dataset.contexte;
  if (hote.dataset.implantation) prefill.implantation = hote.dataset.implantation;

  hote.innerHTML =
    '<div class="container center">' +
      '<div class="kicker">Étude gratuite &amp; sans engagement</div>' +
      '<h2 class="title">' + (hote.dataset.titre || "Chiffrez votre projet en 2 minutes") + '</h2>' +
      '<p class="sub-title">Un service pour les professionnels : décrivez votre projet, un installateur partenaire vous recontacte sous 24 h ouvrées.</p>' +
    '</div>' +
    '<div class="container">' +
      '<div class="devis-box" id="devis" data-prefill=\'' + JSON.stringify(prefill) + '\'>' + DEVIS_MARKUP + '</div>' +
    '</div>';
}

var DEVIS_MARKUP =
'<div class="progress"><div></div></div>' +
'<div class="devis-inner">' +
  '<div class="f-step on">' +
    '<h2>Quel type de projet envisagez-vous ?</h2>' +
    '<p class="help">Sélectionnez ce qui s\'en rapproche le plus — rien n\'est figé à ce stade.</p>' +
    '<div class="choices">' +
      '<div class="choice" data-name="type_projet" data-value="Mur vegetal stabilise">Mur végétal stabilisé<small>sans arrosage ni entretien</small></div>' +
      '<div class="choice" data-name="type_projet" data-value="Plafond vegetal">Plafond végétal<small>plafond ou ciel végétalisé</small></div>' +
      '<div class="choice" data-name="type_projet" data-value="Arbre sur mesure">Arbre sur mesure<small>arbre ou sujet végétal</small></div>' +
      '<div class="choice" data-name="type_projet" data-value="Autre projet a definir">Autre / à définir<small>besoin d\'être conseillé</small></div>' +
    '</div>' +
  '</div>' +
  '<div class="f-step">' +
    '<h2>Plutôt intérieur ou extérieur ?</h2>' +
    '<p class="help">Cela conditionne le système végétal et les contraintes de pose.</p>' +
    '<div class="choices">' +
      '<div class="choice" data-name="implantation" data-value="Interieur">Intérieur<small>bureau, hall, commerce…</small></div>' +
      '<div class="choice" data-name="implantation" data-value="Exterieur">Extérieur<small>façade, terrasse, patio…</small></div>' +
      '<div class="choice" data-name="implantation" data-value="Les deux a definir">Les deux / à définir<small>je verrai avec l\'installateur</small></div>' +
    '</div>' +
    '<p style="margin-top:-8px"><button type="button" class="btn ghost prev" style="padding:8px 18px;font-size:14px">← Retour</button></p>' +
  '</div>' +
  '<div class="f-step">' +
    '<h2>Quelle surface à végétaliser ?</h2>' +
    '<p class="help">Une estimation suffit : hauteur × largeur de la zone concernée.</p>' +
    '<div class="choices">' +
      '<div class="choice" data-name="surface" data-value="Moins de 5 m2">Moins de 5 m²<small>petit pan de mur, vitrine</small></div>' +
      '<div class="choice" data-name="surface" data-value="5 a 15 m2">5 à 15 m²<small>accueil, salle, boutique</small></div>' +
      '<div class="choice" data-name="surface" data-value="Plus de 15 m2">Plus de 15 m²<small>grand volume, plusieurs murs</small></div>' +
      '<div class="choice" data-name="surface" data-value="A definir">À définir<small>je verrai avec l\'installateur</small></div>' +
    '</div>' +
    '<p style="margin-top:-8px"><button type="button" class="btn ghost prev" style="padding:8px 18px;font-size:14px">← Retour</button></p>' +
  '</div>' +
  '<div class="f-step">' +
    '<h2>Dans quel contexte ?</h2>' +
    '<p class="help">Le lieu détermine les contraintes techniques et le partenaire à solliciter.</p>' +
    '<div class="choices">' +
      '<div class="choice" data-name="contexte" data-value="Bureaux entreprise">Bureaux &amp; entreprise<small>hall, open space, réunion</small></div>' +
      '<div class="choice" data-name="contexte" data-value="Hotel restaurant bar">Hôtel, restaurant, bar<small>salle, accueil, terrasse</small></div>' +
      '<div class="choice" data-name="contexte" data-value="Commerce boutique">Commerce &amp; boutique<small>vitrine, magasin, showroom</small></div>' +
      '<div class="choice" data-name="contexte" data-value="Autre professionnel">Autre professionnel<small>collectivité, santé, promoteur…</small></div>' +
    '</div>' +
    '<p style="margin-top:-8px"><button type="button" class="btn ghost prev" style="padding:8px 18px;font-size:14px">← Retour</button></p>' +
  '</div>' +
  '<div class="f-step">' +
    '<h2>Pour quand est votre projet ?</h2>' +
    '<p class="help">Le délai nous aide à orienter la demande vers le bon installateur.</p>' +
    '<div class="choices">' +
      '<div class="choice" data-name="delai" data-value="Moins d un mois">Moins d\'un mois<small>c\'est urgent</small></div>' +
      '<div class="choice" data-name="delai" data-value="1 a 3 mois">Dans 1 à 3 mois<small>projet engagé</small></div>' +
      '<div class="choice" data-name="delai" data-value="3 a 6 mois">Dans 3 à 6 mois<small>chantier ou aménagement prévu</small></div>' +
      '<div class="choice" data-name="delai" data-value="Je me renseigne">Je me renseigne<small>simple estimation de budget</small></div>' +
    '</div>' +
    '<p style="margin-top:-8px"><button type="button" class="btn ghost prev" style="padding:8px 18px;font-size:14px">← Retour</button></p>' +
  '</div>' +
  '<div class="f-step">' +
    '<h2>Où recevoir votre devis ?</h2>' +
    '<p class="help">Vos coordonnées servent uniquement à traiter votre demande — jamais revendues à des tiers.</p>' +
    '<form>' +
      '<div class="fields">' +
        '<div><label>Nom / société *</label><input name="nom" required placeholder="Ex. : Camille Durand"></div>' +
        '<div><label>Téléphone *</label><input name="telephone" type="tel" required placeholder="06 12 34 56 78"></div>' +
        '<div><label>Email</label><input name="email" type="email" placeholder="vous@exemple.fr"></div>' +
        '<div><label>Code postal / ville *</label><input name="code_postal" required placeholder="59000 — ou ville si hors France"></div>' +
        '<div><label>Budget envisagé</label><input name="budget" placeholder="Ex. : 5 000 € (ou « à définir »)"></div>' +
        '<div><label>Précisions sur le projet</label><textarea name="details" rows="3" placeholder="Support existant, hauteur, accès, échéance…"></textarea></div>' +
      '</div>' +
      '<div class="f-nav">' +
        '<button type="button" class="btn ghost prev">← Retour</button>' +
        '<button type="submit" class="btn big">Recevoir mon devis gratuit</button>' +
      '</div>' +
      '<p class="rgpd">En envoyant ce formulaire, vous acceptez d\'être recontacté au sujet de votre projet par notre installateur partenaire. <a href="/politique-confidentialite.html">Politique de confidentialité</a>.</p>' +
    '</form>' +
  '</div>' +
'</div>' +
'<div class="merci" style="display:none">' +
  '<div class="pic">🌿</div>' +
  '<h2>Votre demande est partie</h2>' +
  '<p>Un installateur partenaire vous recontacte sous 24 h ouvrées.</p>' +
'</div>';

/* --- Provenance du visiteur ---------------------------------------------
   Enregistre, a la PREMIERE page vue de la session, la page d'arrivee, le
   referent et les parametres de campagne. Le visiteur navigue souvent avant
   d'arriver au formulaire : sans cette memorisation, on ne verrait que la
   page du devis. Stocke en sessionStorage (efface a la fermeture de l'onglet). */
function memoriserProvenance() {
  try {
    if (sessionStorage.getItem("vd_landing")) return;   /* deja enregistre */
    var p = new URLSearchParams(location.search);
    sessionStorage.setItem("vd_landing", location.origin + location.pathname + location.search);
    sessionStorage.setItem("vd_referrer", document.referrer || "");
    sessionStorage.setItem("vd_gclid", p.get("gclid") || "");
    sessionStorage.setItem("vd_utm_source", p.get("utm_source") || "");
    sessionStorage.setItem("vd_utm_medium", p.get("utm_medium") || "");
    sessionStorage.setItem("vd_utm_campaign", p.get("utm_campaign") || "");
    sessionStorage.setItem("vd_utm_term", p.get("utm_term") || "");
  } catch (e) { /* navigation privee : on continue sans provenance */ }
}

function lireProvenance() {
  var o = {};
  try {
    o.landing = sessionStorage.getItem("vd_landing") || (location.origin + location.pathname + location.search);
    o.referrer = sessionStorage.getItem("vd_referrer") || "";
    o.gclid = sessionStorage.getItem("vd_gclid") || "";
    o.utm_source = sessionStorage.getItem("vd_utm_source") || "";
    o.utm_medium = sessionStorage.getItem("vd_utm_medium") || "";
    o.utm_campaign = sessionStorage.getItem("vd_utm_campaign") || "";
    o.utm_term = sessionStorage.getItem("vd_utm_term") || "";
  } catch (e) {
    o.landing = location.origin + location.pathname + location.search;
    o.referrer = document.referrer || "";
  }
  return o;
}

/* Sous-menus repliables (mobile) : toute la ligne bascule le sous-menu.
   Sur desktop, le survol CSS gere l'ouverture et le lien navigue normalement. */
function initSousMenus() {
  var menu = document.querySelector("nav.menu");
  if (!menu) return;
  function estMobile() { return window.matchMedia("(max-width: 980px)").matches; }
  Array.prototype.forEach.call(menu.children, function (grp) {
    if (grp.tagName !== "DIV" || !grp.querySelector(".sub")) return;
    var lien = grp.querySelector("a.item");
    var t = document.createElement("button");
    t.type = "button";
    t.className = "sub-toggle";
    t.setAttribute("aria-label", "Afficher ou masquer le sous-menu");
    t.setAttribute("aria-expanded", "false");
    t.textContent = "▾";
    function bascule(e) {
      if (!estMobile()) return;          /* desktop : comportement normal */
      e.preventDefault();
      e.stopPropagation();
      var ouvert = grp.classList.toggle("open");
      t.setAttribute("aria-expanded", ouvert ? "true" : "false");
      t.blur();
    }
    t.addEventListener("click", bascule);
    if (lien) lien.addEventListener("click", bascule);
    grp.appendChild(t);
  });
}

/* Simulateur de devis multi-étapes */
function initDevis() {
  var box = document.getElementById("devis");
  if (!box) return;

  /* Pre-remplissage : on retient la reponse deduite de la page et on retire
     l'etape devenue inutile (moins d'etapes = plus de formulaires termines). */
  var prefill = {};
  try { prefill = JSON.parse(box.dataset.prefill || "{}"); } catch (e) {}
  Object.keys(prefill).forEach(function (champ) {
    var etape = box.querySelector('.f-step .choice[data-name="' + champ + '"]');
    if (etape) etape.closest(".f-step").remove();
  });
  var premiere = box.querySelector(".f-step");
  if (premiere) {
    box.querySelectorAll(".f-step").forEach(function (s) { s.classList.remove("on"); });
    premiere.classList.add("on");
    /* plus d'etape avant : on retire le bouton Retour, mais seulement quand il
       est seul dans son paragraphe (jamais celui de la barre d'envoi). */
    var retour = premiere.querySelector("p > .prev");
    if (retour) retour.parentNode.remove();
  }

  var steps = box.querySelectorAll(".f-step");
  var bar = box.querySelector(".progress > div");
  var prov = lireProvenance();
  var data = {
    site: SITE_ID,
    page: location.pathname,          /* page du formulaire */
    landing: prov.landing,            /* page d'arrivee sur le site */
    referrer: prov.referrer,          /* d'ou vient le visiteur */
    gclid: prov.gclid,                /* present => clic Google Ads */
    utm_source: prov.utm_source,
    utm_medium: prov.utm_medium,
    utm_campaign: prov.utm_campaign,
    utm_term: prov.utm_term
  };
  Object.keys(prefill).forEach(function (k) { data[k] = prefill[k]; });
  var idx = 0;

  /* scroll : jamais au chargement (sinon on saute le titre de la page),
     et décalé sous le header collant lors des changements d'étape */
  function show(i, avecScroll) {
    idx = i;
    steps.forEach(function (s, n) { s.classList.toggle("on", n === i); });
    if (bar) bar.style.width = ((i + 1) / steps.length) * 100 + "%";
    if (avecScroll === false) return;
    var header = document.querySelector("header.site");
    var marge = (header ? header.offsetHeight : 80) + 16;
    var y = box.getBoundingClientRect().top + window.pageYOffset - marge;
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: "smooth" });
  }

  /* Choix cliquables : enregistre la valeur et passe à l'étape suivante */
  box.querySelectorAll(".choice").forEach(function (c) {
    c.addEventListener("click", function () {
      var step = c.closest(".f-step");
      step.querySelectorAll(".choice").forEach(function (o) { o.classList.remove("sel"); });
      c.classList.add("sel");
      data[c.dataset.name] = c.dataset.value;
      setTimeout(function () { if (idx < steps.length - 1) show(idx + 1); }, 250);
    });
  });

  box.querySelectorAll(".next").forEach(function (b) {
    b.addEventListener("click", function () { if (idx < steps.length - 1) show(idx + 1); });
  });
  box.querySelectorAll(".prev").forEach(function (b) {
    b.addEventListener("click", function () { if (idx > 0) show(idx - 1); });
  });

  var form = box.querySelector("form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form);
    f.forEach(function (v, k) { data[k] = v; });
    if (!data.nom || !data.telephone) { alert("Merci d'indiquer au minimum votre nom et votre téléphone."); return; }
    var btn = form.querySelector("button[type=submit]");
    if (btn) { btn.disabled = true; btn.textContent = "Envoi en cours…"; }
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
    fetch(LEAD_ENDPOINT, { method: "POST", body: body, mode: "no-cors" })
      .catch(function () {})
      .finally(function () {
        box.querySelector(".devis-inner").style.display = "none";
        box.querySelector(".merci").style.display = "block";
        if (typeof gtag === "function") {
          gtag("event", "generate_lead", { site: SITE_ID });
          if (ADS_CONVERSION_LABEL) gtag("event", "conversion", { send_to: ADS_ID + "/" + ADS_CONVERSION_LABEL, value: 1.0, currency: "EUR" });
        }
      });
  });

  show(0, false);
}
