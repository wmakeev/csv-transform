import { HeadersTransformer } from '../../index.js'

export interface RenameHeaderParams {
  oldColumnName: string
  newColumnName: string
}

/**
 * Rename header
 */
export const rename = (params: RenameHeaderParams): HeadersTransformer => {
  return headers => {
    const header = headers.find(h => h.name === params.oldColumnName)

    if (header === undefined) {
      throw new Error(`Header not found - ${params.oldColumnName}`)
    }

    // [mutation]
    header.name = params.newColumnName

    return headers
  }
}
