import { isNil } from '@wmakeev/highland-tools'

import {
  CsvTransfromOptions,
  DataRow,
  HeaderInfo,
  IternalHeaderInfo,
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

  let headersInfo: HeaderInfo[]

  /** Is source headers is reordered */
  let isHeadersReordered = false

  /** How many headers was added to row (negative value - headers was deleted) */
  let additionHeadersAdded = 0

  /** Is new headers was added to header row */
  let isHeaderExtended = false

  /** Is some headers is hidden (deleted in result output) */
  let hasHiddenHeaders = false

  let rowsTransformer: RowsTransformer
  let transformedHeaders: IternalHeaderInfo[]

  let initialized = false

  /**
   * Initialize stream transform and return transformed header row
   *
   * @param srcHeaderRow Header row
   * @returns Transformed header
   */
  const initStreamTransform = (srcHeaderRow: DataRow) => {
    let lastColIndex = srcHeaderRow.length - 1

    headersInfo = srcHeaderRow.flatMap((h, index) => {
      if (h === '' || h == null) return []

      return {
        srcIndex: index,
        name: String(h),
        hidden: false
      }
    })

    // Transform headers with headers transformers
    for (const headerTransform of headerTransforms) {
      transformedHeaders = headerTransform(
        transformedHeaders ?? (headersInfo as IternalHeaderInfo[])
      ) as IternalHeaderInfo[]
    }

    // Set default headerInfo if no transforms
    if (transformedHeaders == null) {
      transformedHeaders = headersInfo as IternalHeaderInfo[]
    }

    // Fill indexes for new columns
    for (const h of transformedHeaders) {
      if (h.srcIndex == null) h.srcIndex = ++lastColIndex
      if (h.hidden) hasHiddenHeaders = true
    }

    isHeadersReordered = transformedHeaders.every(
      (h, index) => h.srcIndex !== index
    )

    additionHeadersAdded = transformedHeaders.length - srcHeaderRow.length

    isHeaderExtended = additionHeadersAdded > 0

    const shouldRearrangeRow = isHeadersReordered || isHeaderExtended

    /** Initialized rows transforms */
    const rowTransforms = rowTransformsFactories.map(f => f(transformedHeaders))

    rowsTransformer = rowsChunks => {
      if (rowTransforms.length === 0) return rowsChunks

      let transformedChunk: DataRow[] = rowsChunks

      for (const rowTransform of rowTransforms) {
        transformedChunk = rowTransform(transformedChunk)
      }

      if (shouldRearrangeRow === false) {
        return transformedChunk
      }

      const rearrangedRowsChunk: DataRow[] = []

      for (const row of transformedChunk) {
        const rearrangedRow = []

        for (const h of transformedHeaders) {
          const val = row[h.srcIndex]

          rearrangedRow.push(
            typeof val === 'string' ? val : val == null ? '' : String(val)
          )
        }

        rearrangedRowsChunk.push(rearrangedRow)
      }

      return rearrangedRowsChunk
    }

    if (rowsTransformer == null) rowsTransformer = rows => rows

    initialized = true

    const result = [...transformedHeaders]
      .filter(it => it.hidden === false)
      .map(it => it.name) as DataRow

    if (result.length === 0) {
      throw new Error('All headers is deleted - nothing to transform')
    }

    return result
  }

  return rowsChunks$.consume<DataRow[]>((err, it, push, next) => {
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

    // Data item
    else {
      let rowsChunk = it

      // First rows chunk containing header row
      if (initialized === false) {
        const srcHeaderRow = rowsChunk[0]

        if (srcHeaderRow == null) {
          throw new Error('Header row expected is not null')
        }

        const transformedHeaderRow = initStreamTransform(srcHeaderRow)

        push(null, [transformedHeaderRow])

        // No rows, only header exist
        if (rowsChunk.length === 1) {
          next()
          return
        }

        rowsChunk = rowsChunk.slice(1)
      }

      // Row length is changed
      if (isHeaderExtended) {
        rowsChunk = rowsChunk.map(row =>
          row.concat(Array(additionHeadersAdded).fill(''))
        )
      }

      rowsChunk = rowsTransformer(rowsChunk)

      // Transform may return an empty list
      if (rowsChunk.length === 0) {
        next()
        return
      }

      // Remove hidden (deleted) rows from result
      if (hasHiddenHeaders) {
        const resultRows: DataRow[] = []

        for (const row of rowsChunk) {
          const resultRow: DataRow = []

          for (const [index, h] of transformedHeaders.entries()) {
            if (h.hidden === false) resultRow.push(row[index])
          }

          resultRows.push(resultRow)
        }

        rowsChunk = resultRows
      }

      push(null, rowsChunk)

      next()
    }
  })
}
