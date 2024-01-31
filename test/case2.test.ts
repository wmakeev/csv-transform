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
