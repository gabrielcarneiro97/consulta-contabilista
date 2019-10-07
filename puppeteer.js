/* global $ */

const puppeteer = require('puppeteer-core');
const chromium = require('chromium');
// const isDev = require('electron-is-dev');

const { loginUrl } = require('./urls.json');
const { loginSelectors } = require('./selectors.json');

const {
  credenciaisPj,
  credenciaisPf,
} = require('./private');

async function setBrowser() {
  // const chromiumPath = isDev ? chromium.path : chromium.path.replace('app.asar', 'app.asar.unpacked');
  return puppeteer.launch({ headless: false, executablePath: chromium.path });
}

async function setPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  return page;
}

async function login(browser, creds) {

  const page = await browser.newPage();

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
    LoginBtn,
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

    $(LoginBtn).click();

  }, creds, loginSelectors);

}

async function main() {
  const browser = await setBrowser();

  await login(browser, credenciaisPj);

}

main();
