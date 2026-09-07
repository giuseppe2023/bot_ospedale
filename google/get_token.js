const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// dynamic import per open
const open = (...args) => import('open').then(module => module.default(...args));

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents'
];

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Carica le credenziali
const content = fs.readFileSync(CREDENTIALS_PATH);
const credentials = JSON.parse(content);
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Genera URL per autorizzazione
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

(async () => {
    console.log('Apri questo link nel browser e autorizza l’app:');
    console.log(authUrl);

    await open(authUrl);

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Inserisci il codice qui: ', async (code) => {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log('Token salvato in token.json');
      readline.close();
    });
})();
