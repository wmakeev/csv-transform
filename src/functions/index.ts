import * as num from './num/tryParseInt.js'
import { vlookup } from './vlookup.js'

export const functions = {
  'typeof': (val: unknown) => {
    return Object.prototype.toString
      .call(val)
      .slice(1, -1)
      .split(' ')[1]
      ?.toLowerCase()
  },

  'table:vlookup': vlookup,

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

  'num:toFixed': (
    num: unknown,
    fractionDigits = 0,
    defaultValue: unknown = 0
  ) => {
    if (typeof num === 'number') {
      return num.toFixed(fractionDigits)
    } else if (typeof num === 'string') {
      const parsed = Number.parseFloat(num)
      if (Number.isNaN(parsed)) return defaultValue
      return parsed.toFixed(fractionDigits)
    } else {
      return defaultValue
    }
  },

  'num:tryParseFloat': (num: unknown, defaultValue = '') => {
    if (typeof num === 'number') {
      return num
    } else if (typeof num === 'string') {
      const parsed = Number.parseFloat(num)
      if (Number.isNaN(parsed)) return defaultValue
      return parsed
    } else {
      return defaultValue
    }
  },

  'num:tryParseInt': num.tryParseInt,

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

  'tools:removeExtraSpaces': (str: unknown) => {
    if (typeof str !== 'string') return str
    return str.replaceAll(/\s{2,}/g, ' ')
  }
}
