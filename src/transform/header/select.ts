import { HeaderInfo, HeadersTransformer } from '../../types.js'

export interface SelectHeadersParams {
  /** Columns that should be selected */
  columns: string[]

  keepSrcColumnsOrder?: boolean
}

export const select = (params: SelectHeadersParams): HeadersTransformer => {
  const { columns, keepSrcColumnsOrder } = params

  const selectedColumnsSet = new Set(columns)

  const factory: HeadersTransformer = headerInfos => {
    // Keep original columns order
    if (keepSrcColumnsOrder === true) {
      const selected: HeaderInfo[] = []
      const other: HeaderInfo[] = []

      for (const info of headerInfos) {
        if (selectedColumnsSet.has(info.name)) {
          if (info.hidden) {
            throw new Error(
              `Column "${info.name}" is deleted and can't be selected`
            )
          }

          selected.push(info)
        } else {
          other.push({ ...info, hidden: true })
        }
      }

      return [...selected, ...other]
    }

    // Reorder columns
    else {
      const selected: HeaderInfo[] = []
      const other: HeaderInfo[] = []

      for (const info of headerInfos) {
        const selectedIndex = columns.indexOf(info.name)

        if (selectedIndex === -1) {
          other.push({ ...info, hidden: true })
        } else {
          if (info.hidden) {
            throw new Error(
              `Column "${info.name}" is deleted and can't be selected`
            )
          }

          selected[selectedIndex] = info
        }
      }

      const notFound = columns.flatMap((col, index) =>
        selected[index] === undefined ? col : []
      )

      if (notFound.length) {
        throw new Error(
          `Columns not found - ${notFound.map(c => `"${c}"`).join(', ')}`
        )
      }

      return [...selected, ...other]
    }
  }

  return factory
}
