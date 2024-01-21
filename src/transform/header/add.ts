import { HeadersTransformer } from '../../index.js'

export interface AddHeaderParams {
  columnName: string
  hidden?: boolean
}

/**
 * Add new header to result csv
 */
export const add = (params: AddHeaderParams): HeadersTransformer => {
  return headers => {
    return [
      ...headers,
      {
        srcIndex: null,
        name: params.columnName,
        hidden: params.hidden ?? false
      }
    ]
  }
}
