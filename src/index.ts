import { isNil } from '@wmakeev/highland-tools'

import {
  CsvTransfromOptions,
  DataRow,
  HeaderInfo,
  RowsTransformer
} from './types.js'

export * from './types.js'
export * from './transform/index.js'

export function transformCsvStream(
  config: CsvTransfromOptions,
  rowsChunks$: Highland.Stream<DataRow[]>
) {
  const {
    headerRowTransforms: headerTransforms,
    dataRowTransforms: rowTransformsFactories
  } = config

  let headerInfo: HeaderInfo[]
  let isHeaderReordered = false

  let rowsTransformer: RowsTransformer
  let transformedHeaders: HeaderInfo[]

  let initialized = false

  /**
   * Initialize stream transform and return transformed header row
   *
   * @param headerRow Header row
   * @returns Transformed header
   */
  const initStreamTransform = (headerRow: DataRow) => {
    headerInfo = headerRow.flatMap((h, index) => {
      if (h === '' || h == null) return []

      return {
        srcIndex: index,
        name: String(h)
      }
    })

    for (const headerTransform of headerTransforms) {
      transformedHeaders = headerTransform(transformedHeaders ?? headerInfo)
    }

    if (transformedHeaders == null) transformedHeaders = headerInfo

    isHeaderReordered = transformedHeaders!.every(
      (h, index) => h.srcIndex !== index
    )

    for (const rowTransformFactory of rowTransformsFactories) {
      const prevRowsTransformer = rowsTransformer
      const curRowTransformer = rowTransformFactory(transformedHeaders)

      rowsTransformer =
        prevRowsTransformer == null
          ? curRowTransformer
          : (rowsChunk: DataRow[]) =>
              curRowTransformer(prevRowsTransformer(rowsChunk))
    }

    if (rowsTransformer == null) rowsTransformer = rows => rows

    initialized = true

    const result = [...transformedHeaders]
      .sort((a, b) => a.srcIndex - b.srcIndex)
      .map(it => it.name) as DataRow

    return result
  }

  return rowsChunks$
    .consume<DataRow[]>((err, it, push, next) => {
      // Error
      if (err != null) {
        // pass errors along the stream and consume next value
        push(err)
        next()
      }

      // End of stream
      else if (isNil(it) === true) {
        // pass nil (end event) along the stream
        push(null, it)
      }

      // data item
      else {
        // Not first rows chunk
        if (initialized) {
          const transformedRows = rowsTransformer(it)

          if (transformedRows.length === 0) {
            return next()
          } else {
            push(null, transformedRows)
            return next()
          }
        }

        // first rows chunk
        else {
          const headerRow = it[0]

          if (headerRow == null) {
            throw new Error('Header row expected is not null')
          }

          const transformedHeaderRow = initStreamTransform(headerRow)
          push(null, [transformedHeaderRow])

          const lastDataRows = it.slice(1)

          if (lastDataRows.length > 0) {
            const transformedRows = rowsTransformer(lastDataRows)
            push(null, transformedRows)
          }

          return next()
        }
      }
    })
    .map(rowsChunk => {
      if (isHeaderReordered === false) return rowsChunk

      const result = []

      for (const srcRow of rowsChunk) {
        const destRow = []

        for (const h of headerInfo) {
          destRow.push(srcRow[h.srcIndex])
        }

        result.push(destRow)
      }

      return result
    })
}
