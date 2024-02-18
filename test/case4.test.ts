import assert from 'node:assert'
import test from 'node:test'
import {
  ChunkTransform,
  FlattenTransform,
  createCsvTransformer
} from '../src/index.js'
import {
  Readable,
  // @ts-expect-error no typings for compose
  compose
} from 'node:stream'

test('Prepend Excel style header', async () => {
  const srcData = [
    ['a', '1', ''],
    ['c', '2', ''],
    ['d', '3', 'x'],
    ['e', '4', '']
  ]

  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [headerInfo => headerInfo],
    dataRowTransforms: [
      () => {
        return rows => rows
      }
    ],
    prependHeaders: 'EXCEL_STYLE'
  })

  const transformedRowsStream: Readable = compose(
    srcData.values(),

    new ChunkTransform({ batchSize: 10 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.toArray()

  assert.equal(transformedRows.length, 5)

  assert.deepEqual(
    transformedRows,
    [
      ['A', 'B', 'C'],
      ['a', '1', ''],
      ['c', '2', ''],
      ['d', '3', 'x'],
      ['e', '4', '']
    ],
    'should add genegated Excel style headers'
  )
})

test('Prepend column num header', async () => {
  const srcData = [
    ['a', '1', ''],
    ['c', '2', ''],
    ['d', '3', 'x'],
    ['e', '4', '']
  ]

  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [headerInfo => headerInfo],
    dataRowTransforms: [
      () => {
        return rows => rows
      }
    ],
    prependHeaders: 'COLUMN_NUM'
  })

  const transformedRowsStream: Readable = compose(
    srcData.values(),

    new ChunkTransform({ batchSize: 10 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.toArray()

  assert.equal(transformedRows.length, 5)

  assert.deepEqual(
    transformedRows,
    [
      ['Col1', 'Col2', 'Col3'],
      ['a', '1', ''],
      ['c', '2', ''],
      ['d', '3', 'x'],
      ['e', '4', '']
    ],
    'should add genegated Excel style headers'
  )
})
