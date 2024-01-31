import { ColumnHeaderMeta, HeadersTransformer } from '../../types.js'

export interface SelectHeadersParams {
  /** Columns that should be selected */
  columns: string[]

  keepSrcColumnsOrder?: boolean
}

export const select = (params: SelectHeadersParams): HeadersTransformer => {
  const { columns: selectedColumns, keepSrcColumnsOrder } = params

  if (selectedColumns.length === 0) {
    throw new Error('Select columns not specified')
  }

  const selectedColumnsSet = new Set(selectedColumns)

  const factory: HeadersTransformer = headers => {
    // Keep original columns order
    if (keepSrcColumnsOrder === true) {
      const selected: ColumnHeaderMeta[] = []
      const other: ColumnHeaderMeta[] = []

      for (const header of headers) {
        if (selectedColumnsSet.has(header.name)) {
          if (header.hidden) {
            throw new Error(
              `Column "${header.name}" is deleted and can't be selected`
            )
          }

          selected.push(header)
        } else {
          other.push({ ...header, hidden: true })
        }
      }

      return [...selected, ...other]
    }

    // Reorder columns
    else {
      const selected: ColumnHeaderMeta[] = []
      const notFound: string[] = []

      // Get selected headers
      for (const colName of selectedColumns) {
        const selectedColHeaders = headers.filter(
          h => h.name === colName && !h.hidden
        )

        if (select.length) {
          selected.push(...selectedColHeaders)
        } else {
          notFound.push(colName)
        }
      }

      if (notFound.length) {
        throw new Error(
          `Columns not found - ${notFound.map(c => `"${c}"`).join(', ')}`
        )
      }

      const other: ColumnHeaderMeta[] = []

      // Get other headers
      for (const info of headers) {
        const selectedIndex = selectedColumns.indexOf(info.name)

        if (selectedIndex === -1) {
          other.push({ ...info, hidden: true })
        } else if (info.hidden) {
          throw new Error(
            `Column "${info.name}" is deleted and can't be selected`
          )
        }
      }

      return [...selected, ...other]
    }
  }

  return factory
}
