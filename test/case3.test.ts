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
  mappers,
  row
} from '../src/index.js'

test('complex transform #3', async () => {
  const csvTransformer = createCsvTransformer({
    headerRowTransforms: [
      header.add({
        columnName: 'RowIndex'
      }),
      header.add({
        columnName: 'NewCol 1'
      }),
      header.add({
        columnName: '_new_col 2',
        hidden: true
      }),
      header.rename({
        oldColumnName: 'Some',
        newColumnName: 'Some renamed'
      }),
      header.rename({
        oldColumnName: 'List',
        newColumnName: 'list_arr'
      }),
      header.select({
        columns: [
          '№',
          'RowIndex',
          'Name',
          'Value',
          'Some renamed',
          'NewCol 1',
          'list_arr',
          'Num',
          'Foo'
        ]
      }),
      header.select({
        columns: [
          'list_arr',
          'Name',
          'NewCol 1',
          '№',
          'Num',
          'RowNum',
          'Some renamed',
          'Value',
          'RowIndex'
        ],
        keepSrcColumnsOrder: true
      })
    ],
    dataRowTransforms: [
      row.column.fill({
        columnName: 'Some renamed',
        value: 'filled'
      }),
      row.column.fill({
        columnName: 'list_arr',
        value: 42,
        arrIndex: 2
      }),
      row.column.filter({
        columnName: 'Num',
        expression: 'value() != "20"'
      }),
      row.column.map({
        columnName: 'Value',
        mapper: mappers.DECODE_HTML.mapper
      }),
      row.column.transform({
        columnName: 'RowIndex',
        expression: 'row()'
      })
    ]
  })

  const transformedRowsStream: Readable = compose(
    createReadStream(path.join(process.cwd(), 'test/cases/case3.csv'), {
      highWaterMark: 16 * 1024,
      encoding: 'utf8'
    }),

    parse({ bom: true }),

    new ChunkTransform({ batchSize: 2 }),

    csvTransformer,

    new FlattenTransform()
  )

  const transformedRows = await transformedRowsStream.toArray()

  assert.deepEqual(transformedRows, [
    [
      '№',
      'RowIndex',
      'Name',
      'Value',
      'Some renamed',
      'NewCol 1',
      'list_arr',
      'list_arr',
      'list_arr',
      'Num'
    ],
    ['1', '1', 'String', 'Some text', 'filled', '', 'One', '2', '42', '10'],
    [
      '3',
      '2',
      'Emoji',
      '😀 Text 💯 "Текст&quot,',
      'filled',
      '',
      '',
      '',
      '42',
      '30'
    ],
    ['4', '3', 'Integer', '1000', 'filled', '', '', '', '42', '15'],
    ['5', '4', 'Float', '1225,55', 'filled', '', '', '', '42', '25'],
    ['6', '5', 'Date', '2023/12/12 14:23', 'filled', '', '', '', '42', '35']
  ])
})
