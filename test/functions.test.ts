import assert from 'node:assert'
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

test('fp functions', async () => {
  const srcData = [
    ['case', 'value'],
    ['1', '']
  ]

  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [headerInfo => headerInfo],
    dataRowTransforms: [
      row.column.transform({
        columnName: 'value',
        expression: `
          if ('case' == "1")
          then (3, 0, "1", 6, 0, "foo", 8, 2) | fp:arr:filter(fp:neq(0)) | num:min
          else value()
        `
      })
    ]
  })

  const transformedRowsStream: Readable = compose(
    srcData.values(),

    new ChunkTransform({ batchSize: 10 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.toArray()

  assert.deepEqual(transformedRows, [
    ['case', 'value'],
    ['1', 2]
  ])
})
