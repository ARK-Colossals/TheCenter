import puppeteer from 'puppeteer';
import { File } from '@athenna/common'

// Inicia o chrome e abre uma nova tab
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Navega para a página
await page.goto('https://ark.fandom.com/wiki/Item_IDs');

// Tamanho da tela
await page.setViewport({ width: 1080, height: 1024 });

// Aceita os cookies da página.
await page.waitForSelector('.NN0_TB_DIsNmMHgJWgT7U', { visible: true });
await page.click('.NN0_TB_DIsNmMHgJWgT7U');

// Localiza o elemento com o ID 'Resources'
const spanElement = await page.$('#Resources');

// Localiza o botão `show` para clicar
const showButton = await spanElement.evaluateHandle((span) => {
  return span.parentElement.querySelector('.jslink');
});

// Clica no botão show
await showButton.click();

// Espera que os dados dos items estejam visíveis
await page.waitForSelector('.wikitable', { visible: true });

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
const resources = []

// Le os dados da tabela iniciando do índice 2 para ignorar os títulos.
tableData.slice(2).forEach(row => {
  const [name, category, stack_size, item_id, class_name, blueprint_path] = row

  // Ignora dados que não existem ou que estão escondidos.
  if (!name || !category || !stack_size || name.includes('hide\n')) {
    return
  }

  // Salva os dados no nosso array de resources.
  resources.push({
    'name': name.trim(),
    'stack_size': stack_size,
    'item_id': item_id,
    'class_name': class_name,
    'blueprint_path': blueprint_path
  })
})

// Le o arquivo ou cria se não existir.
const file = new File('../../storage/items.json', '{}')

// Pega o conteúdo do arquivo como json
const fileContentJson = await file.getContentAsJson() // {}

fileContentJson.resources = resources

// Salva o arquivo com o novo conteúdo.
await file.setContent(JSON.stringify(fileContentJson, null, 2))

await browser.close();
