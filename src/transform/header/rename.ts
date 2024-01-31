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
    const headersToRename = headers.filter(h => h.name === params.oldColumnName)

    if (headersToRename.length === 0) {
      throw new Error(`Header not found - ${params.oldColumnName}`)
    }

    // [mutation]
    headersToRename.forEach(h => {
      h.name = params.newColumnName
    })

    return headers
  }
}
