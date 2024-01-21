import { RowsTransformerFactory } from '../../../index.js'

interface ColumnFillParams {
  columnName: string
  value: unknown
  arrIndex?: number
}

/**
 * Fill column with value
 */
export const fill = (params: ColumnFillParams): RowsTransformerFactory => {
  const { columnName, value, arrIndex } = params

  const factory: RowsTransformerFactory = headerInfos => {
    const mappingHeadersInfos = headerInfos.filter(h => h.name === columnName)

    return rows => {
      rows.forEach(row => {
        mappingHeadersInfos.forEach((h, index) => {
          if (typeof arrIndex === 'number' && index !== arrIndex) return

          row[h.srcIndex] = value
        })
      })

      return rows
    }
  }

  return factory
}
