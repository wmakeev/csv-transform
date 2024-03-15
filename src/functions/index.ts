import { UNICODE_SPACES_REGEX } from '../index.js'
import * as arr from './arr/index.js'
import * as barcode from './barcode/index.js'
import { fpFunctions } from './fp/index.js'
import { neq } from './neq.js'
import * as num from './num/index.js'
import * as str from './str/index.js'
import { vlookup } from './vlookup.js'

export const functions = {
  ...fpFunctions,

  'typeof': (val: unknown) => {
    return Object.prototype.toString
      .call(val)
      .slice(1, -1)
      .split(' ')[1]
      ?.toLowerCase()
  },

  'table:vlookup': vlookup,

  'neq': neq,

  'arr:filter': arr.filter,

  'str:trim': (val: unknown) => {
    if (typeof val === 'string') return val.trim()
    else return val
  },

  'str:toLowerCase': (val: unknown) => {
    if (typeof val === 'string') return val.toLowerCase()
    else return val
  },

  'str:startsWith': (str: unknown, value: unknown) => {
    // TODO Подумать
    return String(str).startsWith(String(value))
  },

  'str:replaceAll': (
    str: unknown,
    searchValue: unknown,
    replaceValue: unknown
  ) => {
    return String(str).replaceAll(String(searchValue), String(replaceValue))
  },

  'str:split': (str: unknown, separator: unknown) => {
    return String(str).split(String(separator))
  },

  'str:extractNums': str.extractNums,

  'num:toFixed': num.toFixed,

  'num:tryParseFloat': (num: unknown, defaultValue = '') => {
    if (typeof num === 'number') {
      return num
    } else if (typeof num === 'string') {
      const parsed = Number.parseFloat(
        num.replaceAll(',', '.').replaceAll(UNICODE_SPACES_REGEX, '')
      )
      if (Number.isNaN(parsed)) return defaultValue
      return parsed
    } else {
      return defaultValue
    }
  },

  'num:tryParseInt': num.tryParseInt,
  'num:max': num.max,
  'num:min': num.min,

  'date:toJson': (date: unknown) => {
    if (date instanceof Date) {
      return date.toJSON()
    } else if (typeof date === 'string') {
      return new Date(date).toJSON()
    } else {
      return ''
    }
  },

  'array:at': (arr: unknown[], index: number) => {
    return arr.at(index)
  },

  // TODO Переименовать str:getLeftPad(...)
  'tools:getTabSize': (str: unknown, tab = ' ') => {
    if (typeof str !== 'string') return 0

    let spaces = 0

    let _str = str

    while (_str.startsWith(tab)) {
      spaces++
      _str = _str.slice(tab.length)
    }

    return spaces
  },

  // TODO Переименовать str:removeExtraSpaces(...)
  'tools:removeExtraSpaces': (str: unknown) => {
    if (typeof str !== 'string') return str
    return str.replaceAll(/\s{2,}/g, ' ')
  },

  'barcode:isGTIN': barcode.isGTIN
}
