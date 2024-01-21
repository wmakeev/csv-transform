import { DataRow } from '../../../index.js'
import { GlobalState, getTransform } from './getTransform.js'

const getFilterRowsTransform =
  (
    globalState: GlobalState,
    rowProxyHandler: ProxyHandler<{ row: DataRow }>,
    transform: (obj: any) => any
  ) =>
  (rows: DataRow[]) => {
    const filteredRows: DataRow[] = []

    for (const row of rows) {
      globalState.curRow = row
      globalState.rowNum++

      const rowProxy = new Proxy({ row }, rowProxyHandler)

      let isPass = true

      for (const arrIndex of globalState.fieldColsIndexes.keys()) {
        globalState.arrColIndex = arrIndex

        const result = transform(rowProxy)

        if (result instanceof Error) {
          throw isPass
        }

        if (typeof result !== 'boolean') {
          throw new Error('Filter should return boolean result')
        }

        isPass = result

        if (isPass === false) break
      }

      if (isPass) filteredRows.push(row)
    }

    return filteredRows
  }

export const filter = getTransform(getFilterRowsTransform)
