import { ViewImpl } from "@athenna/view";
import { Path, File } from "@athenna/common";
import { Env, EnvHelper } from "@athenna/config";

EnvHelper.resolveFilePath(Path.pwd('.env'))
const view = new ViewImpl()

const compiledGameUserSettings = await view.renderRawByPath(Path.pwd('src/templates/GameUserSettings.ini.edge'), {
  SERVER_ADMIN_PASSWORD: Env('SERVER_ADMIN_PASSWORD')
})

await new File(Path.pwd('build/settings/GameUserSettings.ini'), '').setContent(compiledGameUserSettings)

let items = []
const keys = ['resources', 'ammunition', 'tools']
const itemsRaw = await new File(Path.src('storage/items_db.json'), '').getContentAsJson()

Object.keys(itemsRaw).forEach(key => {
  if (!keys.includes(key)) {
    return
  }

  items.push(...itemsRaw[key].filter(item => item.custom_stack_size))
})

const compiledGame = await view.renderRawByPath(Path.pwd('src/templates/Game.ini.edge'), {
  ITEMS_MAX_QUANTITY_OVERRIDE: items.map(item => {
    return `ConfigOverrideItemMaxQuantity=(ItemClassString="${item.class_name}",Quantity=(MaxItemQuantity=${item.custom_stack_size}, bIgnoreMultiplier=true))`
  }).join('\n')
})

await new File(Path.pwd('build/settings/Game.ini'), '').setContent(compiledGame)
