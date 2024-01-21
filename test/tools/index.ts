import { parse } from 'csv-parse/sync'
import _H from 'highland'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import decodeHtml from 'decode-html'
import iconv from 'iconv-lite'

import { DataRow } from '../../src/index.js'
import { functions } from '../../src/functions/index.js'

export const loadCsvTableFromFile = async (file: string, encoding = 'utf8') => {
  const CSV_FILE = path.join(process.cwd(), 'test/cases', file)

  const csvBuffer = await readFile(CSV_FILE)

  const csv =
    encoding === 'utf8'
      ? csvBuffer.toString('utf8')
      : iconv.decode(csvBuffer, encoding)

  const csvLines = parse(csv, { bom: true }) as DataRow[]

  return csvLines
}

export const getCaseChunksStream = async (
  caseName: string,
  chunkSize: number
) => {
  const csvLines = await loadCsvTableFromFile(caseName)

  const csvRowsChunks$ = _H(csvLines).batch(chunkSize)

  return csvRowsChunks$
}

export const decodeHtmlField = (val: unknown) => {
  if (typeof val === 'string') {
    return decodeHtml(val)
  }

  return val
}

export const strReplaceAll =
  (searchValue: unknown, replaceValue: unknown) => (val: unknown) => {
    if (typeof val === 'string' || typeof val === 'number') {
      return functions['str:replaceAll'](val, searchValue, replaceValue)
    }

    return val
  }
