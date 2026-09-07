const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

// Percorsi credenziali
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Lettura credenziali
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

const { client_secret, client_id, redirect_uris } = credentials.installed;

// OAuth2
const auth = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);
auth.setCredentials(token);

// API
const docs = google.docs({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

/**
 * Crea un documento di laurea partendo da un template
 * @param {Object} dati
 * @param {string} dati.nome
 * @param {string} dati.luogo_nascita
 * @param {string} dati.data_nascita
 * @param {string} dati.tipo_laurea
 * @param {string} dati.data_rilascio
 * @param {string} voto
 * @param {string} docente
 * @returns {string} URL documento
 */
async function creaDocumentoLaurea(dati, docente) {
  const TEMPLATE_ID = '1jyB4r8PNblC_Vlkxs9c25muOqJ85Z1XPvVeUlA2kN4w';

  // 1️⃣ Copia template
  const copy = await drive.files.copy({
    fileId: TEMPLATE_ID,
    requestBody: {
      name: `Attestato di Laurea - ${dati.nome}`
    }
  });

  const documentId = copy.data.id;

  // Permessi pubblici (sola lettura)
  await drive.permissions.create({
    fileId: documentId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // 2️⃣ Sostituzioni (COERENTI AL 100%)
  const requests = [
    {
      replaceAllText: {
        containsText: { text: '{{Nome_Cognome_Studente}}', matchCase: true },
        replaceText: dati.nome
      }
    },
    {
      replaceAllText: {
        containsText: { text: '{{Nascita}}', matchCase: true },
        replaceText: dati.luogo_nascita
      }
    },
    {
      replaceAllText: {
        containsText: { text: '{{Data_Nascita}}', matchCase: true },
        replaceText: dati.data_nascita
      }
    },
    {
      replaceAllText: {
        containsText: { text: '{{Tipo_Laurea}}', matchCase: true },
        replaceText: dati.tipo_laurea
      }
    },
    {
      replaceAllText: {
        containsText: { text: '{{Data_Conferimento}}', matchCase: true },
        replaceText: dati.data_rilascio
      }
    },
    {
      replaceAllText: {
        containsText: { text: '{{voto}}', matchCase: true },
        replaceText: dati.voto
      }
    }
  ];

  // 3️⃣ Applica modifiche
  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests }
  });

  // 4️⃣ Ritorna URL
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

module.exports = { creaDocumentoLaurea };
