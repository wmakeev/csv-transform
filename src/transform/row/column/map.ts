import { RowsTransformerFactory } from '../../../index.js'

interface ColumnMapParams {
  columnName: string
  mapper: (value: unknown) => unknown
  arrIndex?: number
}

/**
 * Преобразование значения в конкретной колонке
 */
export const map = (params: ColumnMapParams): RowsTransformerFactory => {
  const { columnName, mapper, arrIndex } = params

  const factory: RowsTransformerFactory = headerInfos => {
    const mappingHeadersInfos = headerInfos.filter(h => h.name === columnName)

    return rows => {
      rows.forEach(row => {
        mappingHeadersInfos.forEach((h, index) => {
          if (typeof arrIndex === 'number' && index !== arrIndex) return

          const value = row[h.srcIndex]

          row[h.srcIndex] = mapper(value)
        })
      })

      return rows
    }
  }

  return factory
}
