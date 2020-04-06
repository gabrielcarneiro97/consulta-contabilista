const { ipcRenderer } = require('electron');
const { start } = require('./puppeteer');
const { getSheet, writeSheet } = require('./google-api');
const { dataRange, faltaSiareSheet, faltaPlanilhaSheet } = require('./sheet.json');

const {
  credenciaisPf,
  credenciaisPj,
} = require('./private');

ipcRenderer.on('init', async () => {
  const dadosPj = await start(credenciaisPj);
  const dadosPf = await start(credenciaisPf);

  const empresasSiare = dadosPj.concat(dadosPf);

  const { data } = await getSheet(dataRange);
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

  const faltaPlanilha = empresasSiare.reduce((acc, crr) => {
    if (!empresasPlanilha.find((val) => val.cnpj === crr.cnpj)) {
      return [
        [crr.nome, crr.cnpj, crr.ie],
        ...acc,
      ];
    }

    return acc;
  }, [planilhaHeader]);

  const faltaSiare = empresasPlanilha.reduce((acc, crr) => {
    if (!empresasSiare.find((val) => val.cnpj === crr.cnpj)) {
      return [
        [crr.nome, crr.cnpj, crr.ie],
        ...acc,
      ];
    }

    return acc;
  }, [planilhaHeader]);

  const writeResp = await Promise.all([
    writeSheet(faltaPlanilhaSheet, faltaPlanilha),
    writeSheet(faltaSiareSheet, faltaSiare),
  ]);

  console.log(writeResp);

  ipcRenderer.send('end');
});
