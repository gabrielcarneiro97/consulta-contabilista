const fs = require('fs')
const readline = require('readline')
const google = require('googleapis')
let { OAuth2Client } = require('google-auth-library')

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/'
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs.json'

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize (callback) {
  // Load client secrets from a local file.
  fs.readFile('client_secret.json', function processClientSecrets (err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err)
      return
    }
    let credentials = JSON.parse(content)
    let clientSecret = credentials.installed.client_secret
    let clientId = credentials.installed.client_id
    let redirectUrl = credentials.installed.redirect_uris[0]
    let oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl)

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
      if (err) {
        getNewToken(oauth2Client, callback)
      } else {
        oauth2Client.credentials = JSON.parse(token)
        callback(oauth2Client)
      }
    })
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken (oauth2Client, callback) {
  let authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
  console.log('Authorize this app by visiting this url: ', authUrl)
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close()
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err)
        return
      }
      oauth2Client.credentials = token
      storeToken(token)
      callback(oauth2Client)
    })
  })
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken (token) {
  try {
    fs.mkdirSync(TOKEN_DIR)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
  console.log('Token stored to ' + TOKEN_PATH)
}

exports.getSheet = (range, callback) => {
  authorize(auth => {
    let sheets = new google.GoogleApis().sheets('v4')
    sheets.spreadsheets.values.get({
      auth,
      range,
      spreadsheetId: '1lGeXmRvSwXnZJGLYJWrCSfh0IYBbiR3ib_rYKY8HIbY'
    }, callback)
  })
}

exports.writeSheet = (range, values, callback) => {
  authorize(auth => {
    let sheets = new google.GoogleApis().sheets('v4')
    sheets.spreadsheets.values.update({
      auth,
      range,
      valueInputOption: 'RAW',
      resource: {
        values
      },
      spreadsheetId: '1lGeXmRvSwXnZJGLYJWrCSfh0IYBbiR3ib_rYKY8HIbY'
    }).then(val => callback(null, val)).catch(err => callback(err))
  })
}
