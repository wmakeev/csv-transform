import {
  generateColumnNumHeader,
  generateExcelStyleHeader
} from './tools/headers.js'
import {
  ColumnHeaderMeta,
  CsvTransfromOptions,
  DataRow,
  IternalColumnHeaderMeta,
  RowsTransformer
} from './types.js'

export * from './mappers/index.js'
export * from './tools/index.js'
export * from './transform/index.js'
export * from './types.js'

export function createCsvTransformer(config: CsvTransfromOptions) {
  const {
    headerRowTransforms: headerTransforms,
    dataRowTransforms: rowTransformsFactories,
    prependHeaders
  } = config

  let columnHeadersMeta: ColumnHeaderMeta[]

  const isHeaderPrepended = prependHeaders != null

  /** Is source headers is reordered */
  let isHeaderReordered = false

  /** How many columns was added to row (negative value - columns was deleted) */
  let additionColumsAdded = 0

  /** Is new headers was added to header row */
  let isHeaderExtended = false

  /** Is some headers is deleted (should be removed in result output) */
  let hasDeletedColumns = false

  let rowsTransformer: RowsTransformer
  let transformedHeaders: IternalColumnHeaderMeta[]

  let initialized = false

  /**
   * Initialize stream transform and return transformed header row
   *
   * @param srcHeaderRow Header row
   * @returns Transformed header
   */
  const initStreamTransform = (srcHeaderRow: DataRow) => {
    let lastColIndex = srcHeaderRow.length - 1

    columnHeadersMeta = srcHeaderRow.flatMap((h, index) => {
      if (h === '' || h == null) return []

      const colMeta: ColumnHeaderMeta = {
        srcIndex: index,
        name: String(h),
        deleted: false
      }

      return colMeta
    })

    // Transform headers with headers transformers
    for (const headerTransform of headerTransforms) {
      transformedHeaders = headerTransform(
        transformedHeaders ?? (columnHeadersMeta as IternalColumnHeaderMeta[])
      ) as IternalColumnHeaderMeta[]
    }

    // Set default headerInfo if no transforms
    if (transformedHeaders == null) {
      transformedHeaders = columnHeadersMeta as IternalColumnHeaderMeta[]
    }

    // Fill indexes for new columns
    for (const h of transformedHeaders) {
      if (h.srcIndex == null) h.srcIndex = ++lastColIndex
      if (h.deleted) hasDeletedColumns = true
    }

    isHeaderReordered = transformedHeaders.some(
      (h, index) => h.srcIndex !== index
    )

    additionColumsAdded = transformedHeaders.length - srcHeaderRow.length

    isHeaderExtended = additionColumsAdded > 0

    const shouldRearrangeRow = isHeaderReordered || isHeaderExtended

    /** Initialized rows transforms */
    const rowTransforms = rowTransformsFactories.map(f => f(transformedHeaders))

    rowsTransformer = rowsChunks => {
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
      .filter(it => it.deleted === false)
      .map(it => it.name) as DataRow

    if (result.length === 0) {
      throw new Error('All headers is deleted - nothing to transform')
    }

    return result
  }

  return async function* (
    source: Iterable<DataRow[]> | AsyncIterable<DataRow[]>
  ) {
    for await (let rowsChunk of source) {
      // First rows chunk containing header row
      if (initialized === false) {
        if (rowsChunk[0] == null) {
          throw new Error('Empty or incorrect rows chunk')
        }

        const firstRow = rowsChunk[0]

        if (firstRow.length === 0) {
          throw new Error('No columns in row')
        }

        let srcHeaderRow: DataRow

        // No header. Header should be generated and prepended.
        if (isHeaderPrepended) {
          srcHeaderRow =
            prependHeaders === 'EXCEL_STYLE'
              ? generateExcelStyleHeader(firstRow.length)
              : generateColumnNumHeader(firstRow.length)
        }

        // Header should exist. Extract header from first row.
        else {
          srcHeaderRow = rowsChunk[0]
          rowsChunk = rowsChunk.slice(1)
        }

        const transformedHeaderRow = initStreamTransform(srcHeaderRow)

        yield [transformedHeaderRow]
      }

      // Row length is changed
      if (isHeaderExtended) {
        const emptyHeaders = Array(additionColumsAdded).fill('')

        for (const row of rowsChunk) {
          row.push(...emptyHeaders)
        }
      }

      rowsChunk = rowsTransformer(rowsChunk)

      // Transform may return an empty list
      if (rowsChunk.length === 0) continue

      // Remove deleted rows from result
      if (hasDeletedColumns) {
        const resultRows: DataRow[] = []

        for (const row of rowsChunk) {
          const resultRow: DataRow = []

          for (const [index, h] of transformedHeaders.entries()) {
            if (h.deleted === false) resultRow.push(row[index])
          }

          resultRows.push(resultRow)
        }

        rowsChunk = resultRows
      }

      yield rowsChunk
    }
  }
}
