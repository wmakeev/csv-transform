import { parse } from 'csv-parse'
import assert from 'node:assert'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import {
  Readable,
  // @ts-expect-error no typings for compose
  compose
} from 'node:stream'
import test from 'node:test'
import {
  ChunkTransform,
  FlattenTransform,
  createCsvTransformer,
  header,
  row
} from '../src/index.js'

test('Price-list transform', async () => {
  //#region Контекст для трансформации
  const globalEnv = {
    'env:TRANSFORM_START_DATE': new Date()
  }

  const constants = {
    ...globalEnv
  }
  //#endregion

  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [
      header.add({
        columnName: '_level'
      }),
      header.add({
        columnName: 'Наименование'
      }),
      header.rename({
        oldColumnName: 'C',
        newColumnName: 'Срок до'
      }),
      header.rename({
        oldColumnName: 'D',
        newColumnName: 'Остаток срока %'
      }),
      header.rename({
        oldColumnName: 'E',
        newColumnName: 'Единиц на поддоне'
      }),
      header.rename({
        oldColumnName: 'F',
        newColumnName: 'Штрихкод'
      }),
      header.rename({
        oldColumnName: 'G',
        newColumnName: 'Цена (руб)'
      }),
      header.rename({
        oldColumnName: 'H',
        newColumnName: 'Ед. изм.'
      }),
      header.select({
        columns: [
          // '_level',
          'Штрихкод',
          'Наименование',
          'Срок до',
          'Остаток срока %',
          'Единиц на поддоне',
          'Цена (руб)',
          'Ед. изм.'
        ]
      })
    ],

    dataRowTransforms: [
      row.column.transform({
        columnName: '_level',
        expression: `
          tools:getTabSize('B', "    ")
        `,
        constants
      }),

      row.column.transform({
        columnName: 'Наименование',
        expression: `
          str:trim('B') | tools:removeExtraSpaces
        `,
        constants
      }),

      row.column.filter({
        columnName: 'Штрихкод',
        expression: `
          not empty(value()) and value() != "Штрихкод"
        `
      })
    ],

    prependHeaders: 'EXCEL_STYLE'
  })

  const transformedRowsStream: Readable = compose(
    createReadStream(path.join(process.cwd(), 'test/cases/pricelist1.csv'), {
      highWaterMark: 16 * 1024,
      encoding: 'utf8'
    }),

    parse({ bom: true }),

    new ChunkTransform({ batchSize: 10 }),

    csvTransformer,

    new FlattenTransform()

    // stringify(),

    // createWriteStream(
    //   path.join(process.cwd(), '__temp/test-out/pricelist/pricelist1.csv'),
    //   'utf8'
    // )
  )

  const transformedRows = await transformedRowsStream.take(10).toArray()

  assert.deepEqual(transformedRows, [
    [
      'Штрихкод',
      'Наименование',
      'Срок до',
      'Остаток срока %',
      'Единиц на поддоне',
      'Цена (руб)',
      'Ед. изм.'
    ],
    [
      '8003012010687',
      'Кофе Boggi Dolce 250гр*20шт вак.уп. молот. (П-121,Р-)',
      '24.09.2024',
      '31',
      '121',
      '271,7',
      'шт'
    ],
    [
      '8003012010670',
      'Кофе Boggi Espresso 250гр*20шт вак.уп.молот. (П-121,Р-)',
      '02.10.2024',
      '32',
      '121',
      '222,75',
      'шт'
    ],
    [
      '4008167152729',
      "ДАЛМАЕР 1000гр/8шт зерно Crema d'Oro (П-24,Р-8)",
      '29.12.2024',
      '59',
      '24',
      '1425',
      'шт'
    ],
    [
      '4008167035503',
      "ДАЛМАЕР 1000гр/8шт зерно Crema d'Oro Selektion (П-24,Р-8)",
      '26.04.2025',
      '80',
      '24',
      '1425',
      'шт'
    ],
    [
      '4008167055105',
      'ДАЛМАЕР 1000гр/8шт зерно Crema Prodomo (П-24,Р-8)',
      '29.11.2024',
      '53',
      '24',
      '1425',
      'шт'
    ],
    [
      '4008167154679',
      "ДАЛМАЕР 1000гр/8шт зерно Espresso d'Oro (П-24,Р-8)",
      '29.11.2024',
      '53',
      '24',
      '1425',
      'шт'
    ],
    [
      '4008167103219',
      'ДАЛМАЕР 500гр/12шт зерно Prodomo (П-49,Р-7)',
      '29.11.2024',
      '53',
      '49',
      '715',
      'шт'
    ],
    [
      '4008167103714',
      'ДАЛМАЕР 500гр/12шт молотый Prodomo (П-60,Р-12)',
      '11.12.2025',
      '92',
      '60',
      '715',
      'шт'
    ],
    [
      '8003753970042',
      'ИЛЛИ ARABICA SELECTION BRAZIL 250гр/6шт зерно (П-156, Р-12)',
      '21.08.2025',
      '76',
      '156',
      '740',
      'шт'
    ]
  ])
})
