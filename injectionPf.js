const { ipcRenderer } = require('electron')

ipcRenderer.send('url-pf', document.URL)

ipcRenderer.on('consulta', (e, m) => {
  let primeiro = m.primeiro
  let cpf = m.cpf
  let login = m.login
  let senha = m.senha

  switch (document.URL) {
    case 'https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/GERAL/INICIAL_INTERNET?ACAO=VISUALIZAR':
      if (m.naPj) {
        document.getElementsByName('cmbDominio')[0].value = 'CNPJ'
        tratarDominio()
        document.getElementsByName('dominio')[0].value = login
        document.getElementsByName('login')[0].value = cpf
        document.getElementsByName('senhaAtual')[0].value = senha
        document.getElementsByName('Confirmar')[0].click()
      } else {
        document.getElementsByName('cmbDominio')[0].value = 'CPF'
        document.formTela.cmbDominio.selectedIndex = 3
        tratarDominio()
        document.getElementsByName('login')[0].value = cpf
        document.formTela.dominio.value = cpf
        document.getElementsByName('senhaAtual')[0].value = senha
        document.getElementsByName('Confirmar')[0].click()
      }
      break
    case 'https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/GERAL/INICIAL_INTERNET':
      window.location = 'https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/IE/CONSULTA_686?ACAO=VISUALIZAR'
      break
    case 'https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/IE/CONSULTA_686?ACAO=VISUALIZAR':
      document.getElementsByName('lnkContribuintes')[0].click()
      break
    case 'https://www2.fazenda.mg.gov.br/sol/ctrl/SOL/IE/CONSULTA_691':
      let arr = []
      if ((document.formTela.ufw_posicao_grid.value === '1' && primeiro) || document.formTela.ufw_posicao_grid.value !== '1') {
        let tb = document.getElementsByTagName('table')[3]
        for (let i = 1; i < tb.rows.length - 1; i++) {
          let cnpj = tb.rows[i].cells[2].innerText
          let ie = tb.rows[i].cells[1].innerText
          let nome = tb.rows[i].cells[3].innerText
          arr.push({ cnpj, ie, nome })
        }
        console.log(arr)
        document.formTela.ufw_posicao_grid.value = (parseInt(document.formTela.ufw_posicao_grid.value) + 10).toString()
        ipcRenderer.send('primeiro-pf')
        ipcRenderer.send('data_array-pf', arr)
        document.formTela.submit()
      } else {
        ipcRenderer.send('end-pf')
        window.location = 'https://google.com'
      }
      break
    default:
      break
  }
})
