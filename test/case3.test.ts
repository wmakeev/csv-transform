import assert from 'node:assert'
import test from 'node:test'
import { stringify } from 'csv-stringify/sync'

import {
  header as Header,
  row as Row,
  transformCsvStream
} from '../src/index.js'
import {
  decodeHtmlField,
  getCaseChunksStream,
  loadCsvTableFromFile
} from './tools/index.js'
import { createCsvTransformConfigFromXlsx } from './tools/xlsx-config/index.js'
import path from 'node:path'
import { writeFile } from 'node:fs/promises'

test.skip('columnTransform (array) #3', async () => {
  const csvRowsChunks$ = await getCaseChunksStream('case3.csv', 1000)

  const syncGroups = ['REHAU', 'STOUT', 'Ferroli', 'КЗТО']

  const priceFixBrands = ['STOUT', 'REHAU', 'КЗТО']

  const brandsMap = await loadCsvTableFromFile('case3-brands-map.csv')

  const globalEnv = {
    env: {
      TRANSFORM_START_DATE: new Date()
    }
  }

  const transformContextConstants = {
    ...globalEnv,
    syncGroups,
    priceFixBrands,
    brandsMap
  }

  const transformedRows$ = transformCsvStream(
    {
      headerRowTransforms: [
        Header.add({ columnName: 'Группа' }),

        Header.add({ columnName: 'Бренд' }),

        Header.add({ columnName: 'Цена продажи EUR' }),

        Header.add({ columnName: 'Цена продажи EUR (Валюта)' }),

        Header.add({ columnName: 'Цена продажи RUB' }),

        Header.add({ columnName: 'Цена продажи RUB (Валюта)' }),

        Header.add({ columnName: 'Цена продажи день' }),

        Header.add({ columnName: 'Цена продажи ночь' }),

        Header.add({ columnName: 'Остаток' }),

        Header.add({ columnName: 'Прайс-лист (источник)' }),

        Header.add({ columnName: 'Прайс-лист (актуальность)' }),

        Header.add({ columnName: '_stock', hidden: true }),

        Header.add({ columnName: '_retailPrice', hidden: true }),

        Header.add({ columnName: '_retailPriceFix', hidden: true }),

        Header.rename({
          oldColumnName: 'ARTICLE',
          newColumnName: 'Артикул'
        }),

        Header.rename({
          oldColumnName: 'NAME',
          newColumnName: 'Наименование'
        }),

        Header.rename({
          oldColumnName: 'DETAIL_PAGE_URL',
          newColumnName: 'Ссылка на терем'
        }),

        Header.select({
          columns: [
            'Группа',
            'Бренд',
            'Артикул',
            'Наименование',
            'Ссылка на терем',
            'Цена продажи EUR',
            'Цена продажи EUR (Валюта)',
            'Цена продажи RUB',
            'Цена продажи RUB (Валюта)',
            'Цена продажи день',
            'Цена продажи ночь',
            'Остаток',
            'Прайс-лист (источник)',
            'Прайс-лист (актуальность)'
          ]
        })
      ],

      dataRowTransforms: [
        Row.column.map({
          columnName: 'Наименование',
          mapper: decodeHtmlField
        }),

        // Заполнить значение по умолчанию
        Row.column.fill({
          columnName: 'Цена продажи EUR (Валюта)',
          value: 'евро'
        }),

        Row.column.fill({
          columnName: 'Цена продажи RUB (Валюта)',
          value: 'руб'
        }),

        Row.column.fill({
          columnName: 'Прайс-лист (источник)',
          value: 'Терем'
        }),

        Row.column.transform({
          columnName: 'Бренд',
          expression: `vlookup('BRAND', brandsMap, 2) ?? 'BRAND'`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Группа',
          expression: `if 'Бренд' in syncGroups then "Синхронизация/" & 'Бренд' else ""`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Цена продажи EUR',
          expression: `'PRICE_EURO' ?? "(пусто)"`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Цена продажи EUR (Валюта)',
          expression: `
            if strToLowerCase('Бренд') == "kalde"

            then
              if strStartsWith('Артикул', "R.")
              then "руб"
              else "доллар"

            else
              if 'PRICE_EURO' == 'RETAIL_PRICE'
              then "руб"
              else value()
          `,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: '_retailPrice',
          expression: `parseFloat(strReplaceAll('RETAIL_PRICE', ",", "."))`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Цена продажи RUB',
          expression: `numToFixed(_retailPrice, 2)`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: '_retailPriceFix',
          expression: `vlookup('Бренд', priceFixBrands, 2)`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Цена продажи день',
          expression: `
            if _retailPriceFix
            then numToFixed('_retailPrice' * '_retailPriceFix', 2)
            else "(пусто)"
          `,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: '_stock',
          expression: `parseInt('QUANTITY_CENTRAL_WAREHOUSE') ?? 0`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Остаток',
          expression: `if _stock < 0 then 0 else _stock`,
          constants: transformContextConstants
        }),

        Row.column.transform({
          columnName: 'Прайс-лист (актуальность)',
          expression: `dateToJson(TRANSFORM_START_DATE of env)`,
          constants: transformContextConstants
        })
      ]
    },

    csvRowsChunks$
  )

  const transformedRows = await transformedRows$
    .sequence()
    .take(2500)
    .collect()
    .toPromise(Promise)

  assert.ok(transformedRows)
})

test('transform from xlsx config #1', async () => {
  // [tochkatepla] price-converter-teremopt [tochkatepla] moysklad-import [tochkatepla] price-converter-mtk

  const FILE_NAME = 'case3.csv'
  // const FILE_NAME = 'case3-sample.csv'

  const csvRowsChunks$ = await getCaseChunksStream(FILE_NAME, 1000)

  const xlsxConfigFile = path.join(
    process.cwd(),
    'test/cases/case3-config.xlsx'
  )

  const globalEnv = {
    'env:TRANSFORM_START_DATE': new Date()
  }

  const transformContextConstants = {
    ...globalEnv
  }

  const config = await createCsvTransformConfigFromXlsx(
    xlsxConfigFile,
    transformContextConstants
  )

  const transformedRows$ = transformCsvStream(config, csvRowsChunks$)

  const transformedRows = await transformedRows$
    .sequence()
    // .take(2500)
    .collect()
    .toPromise(Promise)

  assert.ok(transformedRows)

  const csv = stringify(transformedRows, { bom: true })

  await writeFile(
    `/home/mvv/Documents/_Git/_freelance/@tochkatepla/price-converter-teremopt/__temp/output/teremopt_import.csv`,
    csv,
    'utf8'
  )
})

test('transform from xlsx config #2', async () => {
  // [tochkatepla] price-converter-teremopt [tochkatepla] moysklad-import [tochkatepla] price-converter-mtk

  const FILE_NAME = 'case4.csv'
  // const FILE_NAME = 'case3-sample.csv'

  const csvRowsChunks$ = await getCaseChunksStream(FILE_NAME, 1000)

  const xlsxConfigFile = path.join(
    process.cwd(),
    'test/cases/case4-config.xlsx'
  )

  const globalEnv = {
    'env:TRANSFORM_START_DATE': new Date()
  }

  const transformContextConstants = {
    ...globalEnv
  }

  const config = await createCsvTransformConfigFromXlsx(
    xlsxConfigFile,
    transformContextConstants
  )

  const transformedRows$ = transformCsvStream(config, csvRowsChunks$)

  const transformedRows = await transformedRows$
    .sequence()
    // .take(2500)
    .collect()
    .toPromise(Promise)

  assert.ok(transformedRows)

  const csv = stringify(transformedRows, { bom: true })

  await writeFile(
    `/home/mvv/Documents/_Git/_freelance/@tochkatepla/price-converter-mtk/__temp/output/mtk-import.csv`,
    csv,
    'utf8'
  )
})
