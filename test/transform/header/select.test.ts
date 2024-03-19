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
  header
} from '../../../src/index.js'

test('select header transform', async () => {
  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [
      header.select({
        columns: ['B']
      })
    ],
    dataRowTransforms: [],
    prependHeaders: 'EXCEL_STYLE'
  })

  const csv = [
    ['', '', ''],
    ['', '1', ''],
    ['', '', ''],
    ['', '2', '']
  ]

  const transformedRowsStream: Readable = compose(
    csv.values(),

    new ChunkTransform({ batchSize: 2 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.toArray()

  assert.deepEqual(transformedRows, [['B'], [''], ['1'], [''], ['2']])
})
