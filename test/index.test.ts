import assert from 'node:assert'
import test from 'node:test'

import {
  transformCsvStream,
  RowsTransformerFactory,
  row
} from '../src/index.js'
import { getCaseChunksStream } from './tools/index.js'

test('No-opt transform', async () => {
  const csvRowsChunks$ = await getCaseChunksStream('case1.csv', 100)

  const rowsTransformerFactory: RowsTransformerFactory = headerInfos => {
    headerInfos
    return rows => rows
  }

  const transformedRows$ = transformCsvStream(
    {
      headerRowTransforms: [headerInfo => headerInfo],
      dataRowTransforms: [rowsTransformerFactory]
    },
    csvRowsChunks$
  )

  const transformedRows = await transformedRows$
    .sequence()
    .collect()
    .toPromise(Promise)

  assert.equal(transformedRows.length, 25747)

  const pick = transformedRows.slice(0, 3)

  assert.deepEqual(pick, [
    ['Код', 'Бренд', 'Наименование', 'Закупочная цена', 'Остаток'],
    ['2122FOCIII', 'Febest', 'Тяга рулевая', '986.00', '1'],
    ['1782A3RA43', 'Febest', 'Ступица задняя', '2836.00', '1']
  ])
})

test('columnTransform (basic) #1', async () => {
  const csvRowsChunks$ = await getCaseChunksStream('case1.csv', 100)

  const transformedRows$ = transformCsvStream(
    {
      headerRowTransforms: [headerInfo => headerInfo],
      dataRowTransforms: [
        row.column.transform({
          columnName: 'Наименование',
          expression: `'Бренд' & " " & 'Наименование'`
        })
      ]
    },
    csvRowsChunks$
  )

  const transformedRows = await transformedRows$
    .sequence()
    .take(5)
    .collect()
    .toPromise(Promise)

  assert.deepEqual(transformedRows, [
    ['Код', 'Бренд', 'Наименование', 'Закупочная цена', 'Остаток'],
    ['2122FOCIII', 'Febest', 'Febest Тяга рулевая', '986.00', '1'],
    ['1782A3RA43', 'Febest', 'Febest Ступица задняя', '2836.00', '1'],
    ['052382', 'Gates', 'Gates Шланг системы охлаждения', '1852.01', '10'],
    ['0523TRBF', 'Febest', 'Febest Тяга стабилизатора передняя', '624.00', '1']
  ])
})

test('columnTransform (array) #2', async () => {
  const csvRowsChunks$ = await getCaseChunksStream('case2.csv', 2)

  const transformedRows$ = transformCsvStream(
    {
      headerRowTransforms: [headerInfo => headerInfo],
      dataRowTransforms: [
        row.column.transform({
          columnName: 'List',
          expression: `row() & ":" & arrayIndex() & if empty(value()) then "" else " - " & value()`
        })
      ]
    },
    csvRowsChunks$
  )

  const transformedRows = await transformedRows$
    .sequence()
    .take(5)
    .collect()
    .toPromise(Promise)

  assert.deepEqual(transformedRows, [
    ['№', 'Name', 'Value', 'List', 'List', 'Some', 'List', 'Num'],
    ['1', 'String', 'Some text', '1:0 - One', '1:1 - 2', '', '1:2 - 3️⃣', '10'],
    ['2', 'Строка', 'Просто текст', '2:0', '2:1', '', '2:2', '20'],
    ['3', 'Emoji', '😀 Text 💯 Текст', '3:0', '3:1', '', '3:2', '30'],
    ['4', 'Integer', '1000', '4:0', '4:1', '', '4:2', '15']
  ])
})
