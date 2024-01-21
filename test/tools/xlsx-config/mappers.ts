import { decodeHtmlField } from '../index.js'

export const mappersByCode = {
  DECODE_HTML: decodeHtmlField
} as const

export const mapperCodeByName = {
  'Декодировать HTML': 'DECODE_HTML'
} as const
