/** Header related info */
export interface HeaderInfo {
  /**
   * Source row index or `null` if row not mapped to source
   */
  srcIndex: number | null
  name: string
  hidden: boolean
}

export interface IternalHeaderInfo extends HeaderInfo {
  /**
   * Source row index
   */
  srcIndex: number
}

/** Headers transformer */
export type HeadersTransformer = (headers: HeaderInfo[]) => HeaderInfo[]

/** CSV row */
export type DataRow = Array<unknown | undefined>

export type HeaderRow = Array<string | undefined>

/**
 * CSV row transformer. Gets batch of rows and returns transformed batch.
 */
export type RowsTransformer = (rowsChunk: DataRow[]) => DataRow[]

/** Create and returns rows transformer */
export type RowsTransformerFactory = (
  headers: IternalHeaderInfo[]
) => RowsTransformer

export interface CsvTransfromOptions {
  headerRowTransforms: HeadersTransformer[]
  dataRowTransforms: RowsTransformerFactory[]
}

export type HeadersTransformerCompose = (
  transformers: HeadersTransformer[]
) => HeadersTransformer

export type RowsTransformerCompose = (
  transformers: RowsTransformerFactory[]
) => RowsTransformerFactory
