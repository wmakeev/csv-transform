/** Header related info */
export interface ColumnHeaderMeta {
  /**
   * Source row index or `null` if row not mapped to source
   */
  srcIndex: number | null
  name: string
  hidden: boolean
}

export interface IternalColumnHeaderMeta extends ColumnHeaderMeta {
  /**
   * Source row index
   */
  srcIndex: number
}

/** Headers transformer */
export type HeadersTransformer = (
  headers: ColumnHeaderMeta[]
) => ColumnHeaderMeta[]

/** CSV row */
export type DataRow = Array<unknown | undefined>

export type HeaderRow = Array<string | undefined>

/**
 * CSV row transformer. Gets batch of rows and returns transformed batch.
 */
export type RowsTransformer = (rowsChunk: DataRow[]) => DataRow[]

/** Create and returns rows transformer */
export type RowsTransformerFactory = (
  headers: IternalColumnHeaderMeta[]
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
