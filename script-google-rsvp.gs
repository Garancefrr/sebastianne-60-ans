// Script Google Apps Script : enregistre chaque réponse RSVP dans l'onglet « RSVP »
// du tableau d'hébergements. Voir MISE-EN-LIGNE.md pour l'installation (5 minutes).

var NOM_ONGLET = "RSVP";
var ENTETES = ["Date de réponse", "Nom", "Contact", "Barbecue samedi midi", "Soirée cocktail",
               "Brunch dimanche", "Absent", "Adultes", "Enfants", "Message"];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var feuille = ongletRsvp_();
    feuille.appendRow([
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

// Permet de tester que le script est bien déployé en ouvrant son adresse dans un navigateur.
function doGet() {
  return reponse_({ ok: true, message: "Le script RSVP fonctionne." });
}

function ongletRsvp_() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var feuille = classeur.getSheetByName(NOM_ONGLET);
  if (!feuille) {
    feuille = classeur.insertSheet(NOM_ONGLET);
    feuille.appendRow(ENTETES);
    feuille.getRange(1, 1, 1, ENTETES.length).setFontWeight("bold");
    feuille.setFrozenRows(1);
  }
  return feuille;
}

function reponse_(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
