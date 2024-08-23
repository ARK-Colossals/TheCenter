import puppeteer from 'puppeteer';
import { File } from '@athenna/common'
import { Logger } from '@athenna/logger'

const logger = new Logger().vanilla('application')

// Inicia o chrome e abre uma nova tab
const browser = await puppeteer.launch();
const page = await browser.newPage();

logger.info('browser open')

// Navega para a página
await page.goto('https://ark.fandom.com/wiki/Item_IDs');

// Tamanho da tela
await page.setViewport({ width: 1080, height: 1024 });

logger.info('ark item wiki successfully open')

// Aceita os cookies da página.
await page.waitForSelector('.NN0_TB_DIsNmMHgJWgT7U', { visible: true });
await page.click('.NN0_TB_DIsNmMHgJWgT7U');

logger.info('cookies accepted')

// Localiza o elemento com o ID 'Tools'
const spanElement = await page.$('#Tools');

logger.info('found Tools element')

// Localiza o botão `show` para clicar
const showButton = await spanElement.evaluateHandle((span) => {
  return span.parentElement.querySelector('.jslink');
});

// Clica no botão show
await showButton.click();

logger.info('clicked on Tools element show button')

// Espera que os dados dos items estejam visíveis
await page.waitForSelector('.wikitable', { visible: true });

logger.info('table visible, retrieving data')

// Extrai os dados da tabela
const tableData = await page.evaluate(() => {
  // Seleciona todas as linhas da tabela
  const rows = Array.from(document.querySelectorAll('.wikitable, tr'));

  // Mapeia os dados para um array de objetos
  return rows.map(row => {
    const columns = row.querySelectorAll('td, th');
    return Array.from(columns).map(column => column.innerText);
  });
});

// Cria uma array para salvar os dados dentro.
const tools = []

// Le os dados da tabela iniciando do índice 2 para ignorar os títulos.
tableData.slice(2).forEach(row => {
  const [name, category, stack_size, item_id, class_name, blueprint_path] = row

  // Ignora dados que não existem ou que estão escondidos.
  if (!name || !category || !stack_size || name.includes('hide\n')) {
    return
  }

  // Salva os dados no nosso array de tools.
  tools.push({
    'name': name.trim(),
    'stack_size': stack_size,
    'item_id': item_id,
    'class_name': class_name,
    'blueprint_path': blueprint_path
  })
})

logger.info('data successfully retrieved, saving to items.json')

// Le o arquivo ou cria se não existir.
const file = new File('../../storage/items.json', '{}')

logger.info('loading items.json file')

// Pega o conteúdo do arquivo como json
const fileContentJson = await file.getContentAsJson() // {}

fileContentJson.tools = tools 

logger.info('defining new content of items.json')

// Salva o arquivo com o novo conteúdo.
await file.setContent(JSON.stringify(fileContentJson, null, 2))

logger.info('closing browser')

await browser.close();

console.log()
