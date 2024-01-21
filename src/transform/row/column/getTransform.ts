import { compileExpression } from '@wmakeev/filtrex'

import { DataRow, RowsTransformerFactory } from '../../../index.js'
import { functions } from '../../../functions/index.js'

export interface ColumnTransformParams {
  /** Column name */
  columnName: string

  /** Filtrex expression */
  expression: string

  /** Filtrex constants */
  constants?: {
    [T: string]: any
  }
}

const defaultConstants = {
  TRUE: true,
  FALSE: false
}

export interface GlobalState {
  /** Cur row number (inside this transformation) */
  rowNum: number

  /** If column is array then it contains current processing array index */
  arrColIndex: number

  curRow: DataRow

  /** Column indexes by column name */
  fieldIndexesByName: Map<string, number[]>

  /** Column indexes with specified column name for this transform */
  fieldColsIndexes: number[]
}

/**
 * Преобразование значения в конкретной колонке
 */
export const getTransform =
  (
    getRowsTransform: (
      globalState: GlobalState,
      rowProxyHandler: ProxyHandler<{
        row: DataRow
      }>,
      transform: (obj: any) => any
    ) => (rows: DataRow[]) => DataRow[]
  ) =>
  (params: ColumnTransformParams): RowsTransformerFactory => {
    const globalState = {
      rowNum: 0,
      arrColIndex: 0
    } as GlobalState

    const transform = compileExpression(params.expression, {
      extraFunctions: {
        value: () => {
          const index = globalState.fieldIndexesByName.get(params.columnName)?.[
            globalState.arrColIndex
          ]
          return index === undefined ? '' : globalState.curRow[index] ?? ''
        },

        row: () => globalState.rowNum,

        // TODO Name is not obvious
        arrayIndex: () => globalState.arrColIndex,

        empty: (val: unknown) => {
          return val == null || val === ''
        },

        ...functions
      },

      constants: {
        ...defaultConstants,
        ...params.constants
      }
    })

    const factory: RowsTransformerFactory = headerInfos => {
      /** Headers list */
      const fields = headerInfos.map(h => h.name)

      /** Uniq columns names */
      const fieldsSet = new Set(fields)

      /** Uniq columns names */
      const uniqFields = [...fieldsSet.values()]

      /** Column indexes in source row by header name  */
      globalState.fieldIndexesByName = headerInfos.reduce((res, h) => {
        const indexes = res.get(h.name)

        if (indexes) {
          indexes.push(h.srcIndex)
        } else {
          res.set(h.name, [h.srcIndex])
        }

        return res
      }, new Map<string, number[]>())

      globalState.fieldColsIndexes = headerInfos.flatMap(h => {
        if (h.name === params.columnName) return h.srcIndex
        else return []
      })

      if (globalState.fieldColsIndexes.length === 0) {
        throw new Error(`Collumn "${params.columnName}" not found`)
      }

      const rowProxyHandler: ProxyHandler<{ row: DataRow }> = {
        has(_, key) {
          if (typeof key !== 'string') return false
          return fieldsSet.has(key)
        },

        ownKeys() {
          return uniqFields
        },

        get(target, prop) {
          const indexes = globalState.fieldIndexesByName.get(prop as string)

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
          if (fieldsSet.has(prop as string) == null) return undefined

          return {
            configurable: true,
            enumerable: true,
            value: rowProxyHandler.get!(target, prop, null)
          }
        }
      }

      return getRowsTransform(globalState, rowProxyHandler, transform)
    }

    return factory
  }
