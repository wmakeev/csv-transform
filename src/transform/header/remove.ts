import { HeadersTransformer } from '../../index.js'

export interface RemoveHeaderParams {
  columnName: string
  colIndex?: number
}

/**
 * Add new header to result csv
 */
export const remove = (params: RemoveHeaderParams): HeadersTransformer => {
  return headers => {
    let headerIndex = 0

    return headers.map(h => {
      if (h.name === params.columnName && !h.deleted) {
        if (params.colIndex != null ? params.colIndex === headerIndex : true) {
          return {
            ...h,
            deleted: true
          }
        }

        headerIndex++
      }

      return h
    })
  }
}
