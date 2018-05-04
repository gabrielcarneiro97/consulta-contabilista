const electron = require('electron')
const { ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const { login, cpf, senha } = require('./private')
const { getSheet, writeSheet } = require('./google-api')

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let pjWindow
let pfWindow

let __url

let primeiroPj = true
let primeiroPf = true

let cnpjsPj = []
let cnpjsPf = []

ipcMain.on('url-pj', (e, m) => {
  __url = m
  console.log('pj:', __url)
  e.sender.send('consulta', {primeiro: primeiroPj, naPj: true, login, senha, cpf})
})

ipcMain.on('url-pf', (e, m) => {
  __url = m
  console.log('pf:', __url)
  e.sender.send('consulta', {primeiro: primeiroPf, naPj: false, login, senha, cpf})
})

ipcMain.on('primeiro-pj', () => {
  primeiroPj = false
})

ipcMain.on('primeiro-pf', () => {
  primeiroPf = false
})

ipcMain.on('data_array-pj', (e, arr) => {
  cnpjsPj = cnpjsPj.concat(arr)
})

ipcMain.on('data_array-pf', (e, arr) => {
  cnpjsPf = cnpjsPf.concat(arr)
})

ipcMain.on('end-pj', () => {
  pfWindow = new BrowserWindow({ width: 800, height: 600 })
  pfWindow.loadURL('https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/GERAL/INICIAL_INTERNET?ACAO=VISUALIZAR')

  pfWindow.webContents.on('did-finish-load', () => {
    pfWindow.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname, 'injectionPf.js'), 'utf8'))
  })

  pjWindow.close()
})

ipcMain.on('end-pf', () => {
  getSheet('Consulta!A2:C', (err, response) => {
    if (err) {
      console.error(err)
      return
    }

    let rows = response.data.values
    let empresasPlanilha = []
    let empresasSiare = cnpjsPf.concat(cnpjsPj)

    let faltaPlanilha = []
    let faltaSiare = []

    faltaPlanilha.push(['Nome', 'CNPJ', 'Inscrição Estadual', new Date().toLocaleString()])
    faltaSiare.push(['Nome', 'CNPJ', 'Inscrição Estadual', new Date().toLocaleString()])

    rows.forEach(v => {
      let [nome, cnpj, ie] = v
      empresasPlanilha.push({
        nome,
        cnpj,
        ie
      })
    })

    empresasPlanilha.forEach(v => {
      if (empresasSiare.filter(v2 => v2.cnpj === v.cnpj) < 1) {
        faltaSiare.push([
          v.nome, v.cnpj, v.ie
        ])
      }
    })

    empresasSiare.forEach(v => {
      if (empresasPlanilha.filter(v2 => v2.cnpj === v.cnpj) < 1) {
        faltaPlanilha.push([
          v.nome, v.cnpj, v.ie
        ])
      }
    })

    writeSheet('Falta na Planilha', faltaPlanilha, (err) => {
      if (err) {
        console.error(err)
      }
      writeSheet('Falta no Siare', faltaSiare, (err) => {
        if (err) {
          console.error(err)
        }
        pfWindow.close()
      })
    })
  })
})

ipcMain.on('init', () => {
  // Create the browser window.
  pjWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  pjWindow.loadURL('https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/GERAL/INICIAL_INTERNET?ACAO=VISUALIZAR')

  pjWindow.webContents.on('did-finish-load', () => {
    pjWindow.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname, 'injectionPj.js'), 'utf8'))
  })

  mainWindow.close()
})

let createWindow = () => {
  // Emitted when the window is closed.
  mainWindow = new BrowserWindow({width: 300, height: 170, resizable: false, minimizable: false})
  mainWindow.setMenu(null)

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
  if (pjWindow === null && pfWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here;
