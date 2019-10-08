/* global $ */

const puppeteer = require('puppeteer-core');
const chromium = require('chromium');
const isDev = require('electron-is-dev');

const {
  loginUrl,
  paginaConsulta1,
  paginaConsulta2,
} = require('./urls.json');
const { loginSelectors, consultaSelectors } = require('./selectors.json');

async function setBrowser() {
  const chromiumPath = isDev ? chromium.path : chromium.path.replace('app.asar', 'app.asar.unpacked');
  return puppeteer.launch({ headless: false, executablePath: chromiumPath });
}

async function setPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  return page;
}

async function login(page, creds) {
  await page.goto(loginUrl, { waitUntil: 'networkidle0' });

  await page.evaluate(({
    cpf,
    cnpj,
    senha,
    tipo,
  }, {
    tipoSelect,
    cpfInput,
    cnpjInput,
    senhaInput,
    loginBtn,
  }) => {
    $(tipoSelect).val(tipo);
    $(tipoSelect).change();

    $(cpfInput).val(cpf);
    $(cpfInput).change();

    $(senhaInput).val(senha);
    $(senhaInput).change();

    if (tipo === 'CNPJ') {
      $(cnpjInput).val(cnpj);
      $(cnpjInput).change();
    }
    $(loginBtn).click();
  }, creds, loginSelectors);
}

async function extrairNumPaginas(page) {
  if (!page.url().startsWith(paginaConsulta2)) {
    throw new Error('Pagina incorreta!');
  }

  const num = await page.evaluate(({ proximoBtn }) => {
    const string = document.querySelector(proximoBtn).previousSibling.nodeValue;

    return parseInt(string.split('de')[1], 10);
  }, consultaSelectors);

  return num;
}

async function proximaPagina(page, ultima) {
  if (!page.url().startsWith(paginaConsulta2)) {
    throw new Error('Pagina incorreta!');
  }

  const paginaNum = await page.evaluate(({ proximoBtn, pgInput }, ultimaPg) => {
    const input = document.querySelector(pgInput);
    const atual = parseInt(input.value, 10);
    if (atual === ultimaPg) return 0;
    const next = atual + 1;
    document.querySelector(proximoBtn).click();
    return next;
  }, consultaSelectors, ultima);

  if (paginaNum !== 0) await page.waitForNavigation({ waitUntil: 'networkidle0' });
  return paginaNum;
}

async function acessaConsulta(page) {
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.goto(paginaConsulta1, { waitUntil: 'networkidle0' });

  await page.evaluate(({ consultaLink }) => {
    document.querySelector(consultaLink).click();
  }, consultaSelectors);

  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

async function executaConsulta(page) {
  const ultimaPagina = await extrairNumPaginas(page);
  let pageNum = 1;
  const dataArr = [];
  do {
    const pageData = await page.evaluate(({ tabela }) => { // eslint-disable-line
      const tbEl = document.getElementsByTagName(tabela)[3];
      const data = [];
      for (let i = 1; i < tbEl.rows.length - 1; i += 1) {
        const cnpj = tbEl.rows[i].cells[2].innerText;
        const ie = tbEl.rows[i].cells[1].innerText;
        const nome = tbEl.rows[i].cells[3].innerText;
        data.push({ cnpj, ie, nome });
      }
      return data;
    }, consultaSelectors);
    dataArr.push(pageData);
    pageNum = await proximaPagina(page, ultimaPagina); // eslint-disable-line
  } while (pageNum !== 0);

  return dataArr.flat();
}

async function start(credenciais) {
  const browser = await setBrowser();
  const page = setPage(browser);

  await login(page, credenciais);

  await acessaConsulta(page);

  const dados = await executaConsulta(page);

  await browser.close();

  return dados;
}

module.exports = {
  start,
};
