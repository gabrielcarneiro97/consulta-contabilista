const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const { spreadsheetId } = require('./sheet.json');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = path.resolve(__dirname, '.credentials/');
const TOKEN_PATH = path.resolve(TOKEN_DIR, 'sheets.googleapis.com-nodejs.json');

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to', TOKEN_PATH);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token; // eslint-disable-line
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  // Load client secrets from a local file.
  fs.readFile(path.resolve(__dirname, 'client_secret.json'), (err, content) => {
    if (err) {
      console.log('Error loading client secret file:', err);
      return;
    }
    const credentials = JSON.parse(content);
    const clientSecret = credentials.web.client_secret;
    const clientId = credentials.web.client_id;
    const redirectUrl = credentials.web.redirect_uris[0];
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (errFile, token) => {
      if (errFile) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
      }
    });
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
  });
}

exports.getSheet = (range) => new Promise((resolve, reject) => {
  authorize((auth) => {
    const sheets = new google.GoogleApis().sheets('v4');
    sheets.spreadsheets.values.get({
      auth,
      range,
      spreadsheetId,
    }).then(resolve).catch(reject);
  });
});

exports.writeSheet = (range, values) => new Promise((resolve, reject) => {
  authorize((auth) => {
    const sheets = new google.GoogleApis().sheets('v4');
    sheets.spreadsheets.values.update({
      auth,
      range,
      valueInputOption: 'RAW',
      resource: {
        values,
      },
      spreadsheetId,
    }).then(resolve).catch(reject);
  });
});
