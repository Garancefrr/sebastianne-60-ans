// Script Google Apps Script pour le site des 60 ans de Sébastianne.
// - Enregistre les réponses RSVP dans l'onglet « RSVP »
// - Enregistre les mots et souvenirs dans l'onglet « Messages »
// - Renvoie les mots à afficher sur le site (colonne « Afficher sur le site » = Oui)
// Voir MISE-EN-LIGNE.md pour l'installation.

var ONGLET_RSVP = "RSVP";
var ONGLET_MESSAGES = "Messages";
var ENTETES_RSVP = ["Date de réponse", "Nom", "Contact", "Barbecue samedi midi", "Soirée cocktail",
                    "Brunch dimanche", "Absent", "Adultes", "Enfants", "Message"];
var ENTETES_MESSAGES = ["Date", "Type", "Prénom", "Message", "Signé", "Afficher sur le site"];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.type === "mot" || d.type === "souvenir") {
      var fm = onglet_(ONGLET_MESSAGES, ENTETES_MESSAGES);
      // Les mots sont affichés sur le site par défaut ; les souvenirs restent privés (pour le discours).
      fm.appendRow([new Date(), d.type === "mot" ? "Mot" : "Souvenir", d.prenom || "",
                    d.message || "", d.signe ? "Oui" : "Non", d.type === "mot" ? "Oui" : "Non"]);
      return reponse_({ ok: true });
    }
    var f = onglet_(ONGLET_RSVP, ENTETES_RSVP);
    f.appendRow([
      new Date(),
      d.nom || "", d.contact || "",
      d.barbecue || "", d.soiree || "", d.brunch || "", d.absent || "",
      Number(d.adultes) || 0, Number(d.enfants) || 0,
      d.message || ""
    ]);
    return reponse_({ ok: true });
  } catch (err) {
    return reponse_({ ok: false, erreur: String(err) });
  }
}

// GET ?type=mots : renvoie les mots à afficher sur le site.
// GET sans paramètre : simple test que le script fonctionne.
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.type === "mots") {
    var f = onglet_(ONGLET_MESSAGES, ENTETES_MESSAGES);
    var lignes = f.getDataRange().getValues();
    var mots = [];
    for (var i = 1; i < lignes.length; i++) {
      var l = lignes[i];
      if (String(l[1]) === "Mot" && String(l[5]).toLowerCase() === "oui" && String(l[3]).trim()) {
        mots.push({ prenom: String(l[4]) === "Oui" ? String(l[2]) : "", message: String(l[3]) });
      }
    }
    mots.reverse(); // les plus récents en premier
    return reponse_({ ok: true, mots: mots });
  }
  return reponse_({ ok: true, message: "Le script fonctionne." });
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
