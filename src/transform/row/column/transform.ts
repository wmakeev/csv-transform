import { DataRow } from '../../../index.js'
import { GlobalState, getTransform } from './getTransform.js'

const getRowsTransform =
  (
    globalState: GlobalState,
    rowProxyHandler: ProxyHandler<{ row: DataRow }>,
    transform: (obj: any) => any
  ) =>
  (rows: DataRow[]) => {
    for (const row of rows) {
      globalState.curRow = row
      globalState.rowNum++

      const rowProxy = new Proxy({ row }, rowProxyHandler)

      for (const [
        arrIndex,
        colIndex
      ] of globalState.fieldColsIndexes.entries()) {
        globalState.arrColIndex = arrIndex

        const result = transform(rowProxy) ?? ''

        if (result instanceof Error) {
          const dump = [...globalState.fieldIndexesByName.entries()]
            .flatMap(([field, indexes]) => {
              return indexes.map(
                i =>
                  (i === colIndex ? '*' : ' ') +
                  `  [${i}] "${field}": ${JSON.stringify(row[i])}` +
                  (i === colIndex ? ` - ${result.message}` : '')
              )
            })
            .join('\n')

          console.log(
            `rowNum: ${globalState.rowNum}, colIndex: ${colIndex}\n\n${dump}`
          )

          throw result
        }

        row[colIndex] = result
      }
    }

    return rows
  }

export const transform = getTransform(getRowsTransform)
