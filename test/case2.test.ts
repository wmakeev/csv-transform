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

test('column transform (array) #2', async () => {
  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [headerInfo => headerInfo],
    dataRowTransforms: [
      row.column.transform({
        columnName: 'List',
        expression: `row() & ":" & arrayIndex() & if empty(value()) then "" else " - " & value()`
      })
    ]
  })

  const transformedRowsStream: Readable = compose(
    createReadStream(path.join(process.cwd(), 'test/cases/case2.csv'), {
      highWaterMark: 16 * 1024,
      encoding: 'utf8'
    }),

    parse({ bom: true }),

    new ChunkTransform({ batchSize: 100 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.take(5).toArray()

  assert.deepEqual(transformedRows, [
    ['№', 'Name', 'Value', 'List', 'List', 'Some', 'List', 'Num'],
    ['1', 'String', 'Some text', '1:0 - One', '1:1 - 2', '', '1:2 - 3️⃣', '10'],
    ['2', 'Строка', 'Просто текст', '2:0', '2:1', '', '2:2', '20'],
    ['3', 'Emoji', '😀 Text 💯 Текст', '3:0', '3:1', '', '3:2', '30'],
    ['4', 'Integer', '1000', '4:0', '4:1', '', '4:2', '15']
  ])
})

test('column transform (values)', async () => {
  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [
      header.add({
        columnName: 'Value1'
      }),

      header.add({
        columnName: 'Value2'
      }),

      header.add({
        columnName: 'Values1'
      }),

      header.add({
        columnName: 'Values2'
      }),

      header.select({
        columns: ['Value1', 'Value2', 'Values1', 'Values2']
      })
    ],
    dataRowTransforms: [
      row.column.transform({
        columnName: 'Value1',
        expression: `value("Num")`
      }),

      row.column.transform({
        columnName: 'Value2',
        expression: `value("List")`
      }),

      row.column.transform({
        columnName: 'Values1',
        expression: `values("Num")`
      }),

      row.column.transform({
        columnName: 'Values2',
        expression: `values("List")`
      })
    ]
  })

  const transformedRowsStream: Readable = compose(
    createReadStream(path.join(process.cwd(), 'test/cases/case2.csv'), {
      highWaterMark: 16 * 1024,
      encoding: 'utf8'
    }),

    parse({ bom: true }),

    new ChunkTransform({ batchSize: 100 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.take(5).toArray()

  assert.deepEqual(
    transformedRows,
    /* prettier-ignore */
    [
      ['Value1', 'Value2', 'Values1', 'Values2' ],
      ['10'    , 'One'   , '10'     , 'One,2,3️⃣'],
      ['20'    , ''      , '20'     , ',,'      ],
      ['30'    , ''      , '30'     , ',,'      ],
      ['15'    , ''      , '15'     , ',,'      ]
    ]
  )
})
