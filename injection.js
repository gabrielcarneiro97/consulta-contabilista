import { login, senha, cpf } from './private'
const { ipcRenderer } = require('electron')

ipcRenderer.send('url', document.URL)

ipcRenderer.on('consulta', (e, m) => {
  let cnpj = m
  setTimeout(() => {
    switch (document.URL) {
      case 'https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/GERAL/INICIAL_INTERNET?ACAO=VISUALIZAR':
        document.getElementsByName('cmbDominio')[0].value = 'CNPJ'
        tratarDominio()
        document.getElementsByName('dominio')[0].value = login
        document.getElementsByName('login')[0].value = cpf
        document.getElementsByName('senhaAtual')[0].value = senha
        document.getElementsByName('Confirmar')[0].click()
        break
    
      default:
        break
    }
  }, 1000)
})
