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
  initDevis();
});

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
