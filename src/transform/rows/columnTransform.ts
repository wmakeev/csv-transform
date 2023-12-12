import { compileExpression } from 'filtrex'

import { DataRow, RowsTransformerFactory } from '../../index.js'

export interface ColumnTransformParams {
  /** Column name */
  name: string

  /** Filtrex expression */
  expression: string
}

/**
 * Преобразование значения в конкретной колонке
 */
export const columnTransform = (params: ColumnTransformParams) => {
  /** Cur row number (inside this transformation) */
  let rowNum = 0

  /** If column is array then it contains current processing array index */
  let arrColIndex = 0

  let curRow: DataRow

  /** Column indexes by column name */
  let fieldIndexesByName: Map<string, number[]>

  const transform = compileExpression(params.expression, {
    extraFunctions: {
      value: () => {
        const index = fieldIndexesByName.get(params.name)?.[arrColIndex]
        return index === undefined ? '' : curRow[index]
      },

      row: () => rowNum,

      arrayIndex: () => arrColIndex,

      empty: (val: unknown) => {
        return val == null || val === ''
      },

      int: (val: unknown) => {
        if (val == null || val === '') return 0
        if (typeof val === 'number') return Math.floor(val)
        if (typeof val === 'string') {
          const num = Number.parseInt(val)
          if (Number.isNaN(num)) {
            throw new Error(`Wrong number - ${val}`)
          }
          return num
        }
        throw new Error(`Can't convert from ${typeof val} to number`)
      },

      float: (val: unknown) => {
        if (val == null || val === '') return 0
        if (typeof val === 'number') return val
        if (typeof val === 'string') {
          const num = Number.parseFloat(val)
          if (Number.isNaN(num)) {
            throw new Error(`Wrong number - ${val}`)
          }
          return num
        }
        throw new Error(`Can't convert from ${typeof val} to number`)
      }
    }
  })

  const factory: RowsTransformerFactory = headerInfos => {
    /** Headers list */
    const fields = headerInfos.map(h => h.name)

    /** Uniq columns names */
    const fieldsSet = new Set(fields)

    fieldIndexesByName = headerInfos.reduce((res, h) => {
      const indexes = res.get(h.name)

      if (indexes) {
        indexes.push(h.srcIndex)
      } else {
        res.set(h.name, [h.srcIndex])
      }

      return res
    }, new Map<string, number[]>())

    // new Map(headerInfos.map(h => [h.name, h.srcIndex]))

    const fieldIndexes = headerInfos
      .filter(h => h.name === params.name)
      .map(h => h.srcIndex)

    if (fieldIndexes == null || fieldIndexes.length === 0) {
      throw new Error(`Collumn "${params.name}" not found`)
    }

    const rowProxyHandler: ProxyHandler<{ row: DataRow }> = {
      has(_, key) {
        if (typeof key !== 'string') return false
        return fieldsSet.has(key)
      },

      ownKeys() {
        return fields
      },

      get(target, prop) {
        const indexes = fieldIndexesByName.get(prop as string)

        if (indexes == null) return undefined

        if (indexes.length === 1) {
          return target.row[indexes[0]!] ?? '' // undefined is empty string
        } else {
          const values = []

          for (const index of indexes) {
            values.push(target.row[index])
          }

          return values
        }
      },

      getOwnPropertyDescriptor(target, prop) {
        const index = fieldIndexesByName.get(prop as string)

        if (index == null) return undefined

        return {
          configurable: true,
          enumerable: true,
          value: rowProxyHandler.get!(target, prop, null)
        }
      }
    }

    return rows => {
      const transformedRows = []

      for (const row of rows) {
        curRow = row
        rowNum++

        const transformedRow: DataRow = Array.from(row)

        const rowProxy = new Proxy({ row }, rowProxyHandler)

        for (const [arrIndex, fieldIndex] of fieldIndexes.entries()) {
          arrColIndex = arrIndex
          transformedRow[fieldIndex] = transform(rowProxy)
        }

        transformedRows.push(transformedRow)
      }

      return transformedRows
    }
  }

  return factory
}
