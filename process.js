const { ipcRenderer } = require('electron');
const { start } = require('./puppeteer');
const { getSheet, writeSheet } = require('./google-api');


const {
  credenciaisPf,
  credenciaisPj,
} = require('./private');

ipcRenderer.on('init', async () => {
  const dadosPj = await start(credenciaisPj);
  const dadosPf = await start(credenciaisPf);

  const empresasSiare = dadosPj.concat(dadosPf);

  const { data } = await getSheet('Consulta!A2:C');
  const rows = data.values;

  const empresasPlanilha = rows.map((row) => {
    const [nome, cnpj, ie] = row;
    return {
      nome,
      cnpj,
      ie,
    };
  });

  const planilhaHeader = ['Nome', 'CNPJ', 'Inscrição Estadual', new Date().toLocaleString()];

  const faltaPlanilha = [
    planilhaHeader,
  ];
  const faltaSiare = [
    planilhaHeader,
  ];

  empresasPlanilha.forEach((v) => {
    if (!empresasSiare.find((v2) => v2.cnpj === v.cnpj)) {
      faltaSiare.push([
        v.nome, v.cnpj, v.ie,
      ]);
    }
  });

  empresasSiare.forEach((v) => {
    if (!empresasPlanilha.find((v2) => v2.cnpj === v.cnpj)) {
      faltaPlanilha.push([
        v.nome, v.cnpj, v.ie, v.from,
      ]);
    }
  });

  console.log(dadosPj, dadosPf);

  const writeResp = await Promise.all([
    writeSheet('Falta na Planilha', faltaPlanilha),
    writeSheet('Falta no Siare', faltaSiare),
  ]);

  console.log(writeResp);

  ipcRenderer.send('end');
});
