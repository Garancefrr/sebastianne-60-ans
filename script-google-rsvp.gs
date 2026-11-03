// Script Google Apps Script pour le site des 60 ans de Sébastianne.
// - Enregistre les réponses RSVP dans l'onglet « RSVP »
// - Enregistre les mots et souvenirs dans l'onglet « Messages »
// - Enregistre les visites et clics dans l'onglet « Suivi »
// - Renvoie les mots à afficher sur le site, et les statistiques pour le tableau de bord
// Voir MISE-EN-LIGNE.md pour l'installation.

var CLE_TABLEAU = "omonville-2027";   // clé du tableau de bord : change-la si tu veux, et garde-la pour toi

var ONGLET_RSVP = "RSVP";
var ONGLET_MESSAGES = "Messages";
var ONGLET_SUIVI = "Suivi";
var ONGLET_CADEAU = "Cadeau";
var ENTETES_RSVP = ["Date de réponse", "Nom", "Contact", "Barbecue samedi midi", "Soirée cocktail",
                    "Brunch dimanche", "Absent", "Adultes", "Enfants", "Message"];
var ENTETES_MESSAGES = ["Date", "Type", "Prénom", "Message", "Signé", "Afficher sur le site"];
var ENTETES_SUIVI = ["Date", "Type", "Page", "Action", "Détail", "Visiteur", "Appareil", "Provenance"];
var ENTETES_CADEAU = ["Date", "Type", "Id", "Idée", "Description", "Proposé par", "Visiteur", "Afficher"];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.type === "visite" || d.type === "clic") {
      onglet_(ONGLET_SUIVI, ENTETES_SUIVI).appendRow([new Date(), d.type, d.page || "", d.action || "",
        String(d.detail || "").slice(0, 80), d.visiteur || "", d.appareil || "", String(d.provenance || "").slice(0, 120)]);
      return reponse_({ ok: true });
    }
    if (d.type === "idee") {
      var id = "i" + new Date().getTime().toString(36);
      onglet_(ONGLET_CADEAU, ENTETES_CADEAU).appendRow([new Date(), "idee", id, String(d.titre || "").slice(0, 120),
        String(d.description || "").slice(0, 600), String(d.prenom || "").slice(0, 60), d.visiteur || "", "Oui"]);
      return reponse_({ ok: true, id: id });
    }
    if (d.type === "vote") {
      onglet_(ONGLET_CADEAU, ENTETES_CADEAU).appendRow([new Date(), d.retrait ? "retrait" : "vote", String(d.id || ""), "", "", "", d.visiteur || "", ""]);
      return reponse_({ ok: true });
    }
    if (d.type === "mot" || d.type === "souvenir") {
      onglet_(ONGLET_MESSAGES, ENTETES_MESSAGES).appendRow([new Date(), d.type === "mot" ? "Mot" : "Souvenir",
        d.prenom || "", d.message || "", d.signe ? "Oui" : "Non", d.type === "mot" ? "Oui" : "Non"]);
      return reponse_({ ok: true });
    }
    onglet_(ONGLET_RSVP, ENTETES_RSVP).appendRow([new Date(), d.nom || "", d.contact || "",
      d.barbecue || "", d.soiree || "", d.brunch || "", d.absent || "",
      Number(d.adultes) || 0, Number(d.enfants) || 0, d.message || ""]);
    return reponse_({ ok: true });
  } catch (err) {
    return reponse_({ ok: false, erreur: String(err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.type === "mots") return reponse_({ ok: true, mots: motsAffiches_() });
  if (p.type === "cadeau") return reponse_({ ok: true, idees: idees_() });
  if (p.type === "stats") {
    if (p.cle !== CLE_TABLEAU) return reponse_({ ok: false, erreur: "mauvaise clé" });
    return reponse_(statistiques_());
  }
  return reponse_({ ok: true, message: "Le script fonctionne." });
}

function motsAffiches_() {
  var lignes = onglet_(ONGLET_MESSAGES, ENTETES_MESSAGES).getDataRange().getValues();
  var mots = [];
  for (var i = 1; i < lignes.length; i++) {
    var l = lignes[i];
    if (String(l[1]) === "Mot" && String(l[5]).toLowerCase() === "oui" && String(l[3]).trim()) {
      mots.push({ prenom: String(l[4]) === "Oui" ? String(l[2]) : "", message: String(l[3]) });
    }
  }
  mots.reverse();
  return mots;
}

// Idées de cadeau avec leur nombre de votes (un vote par visiteur et par idée ; un « retrait » annule le vote).
function idees_() {
  var lignes = onglet_(ONGLET_CADEAU, ENTETES_CADEAU).getDataRange().getValues();
  var idees = {}, ordre = [], votes = {};
  for (var i = 1; i < lignes.length; i++) {
    var l = lignes[i], type = String(l[1]), id = String(l[2]);
    if (type === "idee" && String(l[7]).toLowerCase() === "oui" && id) {
      idees[id] = { id: id, titre: String(l[3]), description: String(l[4]), par: String(l[5]), votes: 0 }; ordre.push(id);
    } else if (type === "vote" || type === "retrait") {
      votes[id] = votes[id] || {}; votes[id][String(l[6])] = (type === "vote");
    }
  }
  ordre.forEach(function (id) { var v = votes[id] || {}; idees[id].votes = Object.keys(v).filter(function (k) { return v[k]; }).length; });
  return ordre.map(function (id) { return idees[id]; });
}

function statistiques_() {
  var fuseau = Session.getScriptTimeZone();
  function jour(dt) { return Utilities.formatDate(new Date(dt), fuseau, "yyyy-MM-dd"); }

  // ---- Suivi
  var suivi = onglet_(ONGLET_SUIVI, ENTETES_SUIVI).getDataRange().getValues();
  var parJour = {}, visiteurs = {}, visiteursParJour = {}, pages = {}, actions = {}, appareils = {}, provenances = {}, quiz = [], secrets = {};
  var visites = 0, clics = 0;
  for (var i = 1; i < suivi.length; i++) {
    var l = suivi[i]; if (!l[0]) continue;
    var j = jour(l[0]), type = String(l[1]), page = String(l[2]), action = String(l[3]), detail = String(l[4]), vis = String(l[5]), app = String(l[6]), prov = String(l[7]);
    if (type === "visite") {
      visites++;
      parJour[j] = (parJour[j] || 0) + 1;
      visiteurs[vis] = true;
      visiteursParJour[j] = visiteursParJour[j] || {}; visiteursParJour[j][vis] = true;
      pages[page] = (pages[page] || 0) + 1;
      appareils[app] = (appareils[app] || 0) + 1;
      var pr = prov ? prov.replace(/^https?:\/\//, "").split("/")[0] : "Accès direct ou WhatsApp";
      provenances[pr] = (provenances[pr] || 0) + 1;
    } else {
      clics++;
      actions[action] = (actions[action] || 0) + 1;
      if (action === "quiz terminé") quiz.push(Number(detail) || 0);
      if (action === "secret trouvé") secrets[detail] = (secrets[detail] || 0) + 1;
    }
  }
  var jours = Object.keys(parJour).sort();
  var serieJours = jours.map(function (k) { return { jour: k, visites: parJour[k], visiteurs: Object.keys(visiteursParJour[k]).length }; });

  // ---- RSVP
  var rsvp = onglet_(ONGLET_RSVP, ENTETES_RSVP).getDataRange().getValues();
  var r = { reponses: 0, barbecue: 0, soiree: 0, brunch: 0, absents: 0, adultes: 0, enfants: 0, dernieres: [] };
  for (var k = 1; k < rsvp.length; k++) {
    var x = rsvp[k]; if (!x[1]) continue;
    r.reponses++;
    var abs = String(x[6]) === "Oui";
    if (abs) r.absents++;
    if (String(x[3]) === "Oui") r.barbecue += Number(x[7]) + Number(x[8]);
    if (String(x[4]) === "Oui") r.soiree += Number(x[7]) + Number(x[8]);
    if (String(x[5]) === "Oui") r.brunch += Number(x[7]) + Number(x[8]);
    if (!abs) { r.adultes += Number(x[7]) || 0; r.enfants += Number(x[8]) || 0; }
    r.dernieres.push({ date: jour(x[0]), nom: String(x[1]), barbecue: String(x[3]), soiree: String(x[4]), brunch: String(x[5]), absent: String(x[6]), adultes: Number(x[7]) || 0, enfants: Number(x[8]) || 0 });
  }
  r.dernieres = r.dernieres.slice(-10).reverse();

  // ---- Messages
  var msgs = onglet_(ONGLET_MESSAGES, ENTETES_MESSAGES).getDataRange().getValues();
  var mots = 0, souvenirs = 0;
  for (var m = 1; m < msgs.length; m++) { if (String(msgs[m][1]) === "Mot") mots++; else if (String(msgs[m][1]) === "Souvenir") souvenirs++; }

  return { ok: true, genere: new Date().toISOString(), visites: visites, visiteurs: Object.keys(visiteurs).length, clics: clics,
           parJour: serieJours, pages: pages, actions: actions, appareils: appareils, provenances: provenances, quiz: quiz, secrets: secrets,
           rsvp: r, mots: mots, souvenirs: souvenirs };
}

function onglet_(nom, entetes) {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var f = classeur.getSheetByName(nom);
  if (!f) {
    f = classeur.insertSheet(nom);
    f.appendRow(entetes);
    f.getRange(1, 1, 1, entetes.length).setFontWeight("bold");
    f.setFrozenRows(1);
  }
  return f;
}

function reponse_(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
