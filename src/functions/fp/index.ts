import * as arr from '../arr/index.js'
import * as num from '../num/index.js'
import { neq } from '../neq.js'

export const filter = (b: unknown) => {
  return (a: unknown) => arr.filter(a, b)
}

export const fpFunctions = {
  'fp:arr:filter': (b: unknown) => {
    return (a: unknown) => arr.filter(a, b)
  },

  'fp:neq': (b: unknown) => {
    return (a: unknown) => neq(a, b)
  },

  'fp:num:toFixed':
    (fractionDigits: number, defaultValue?: unknown) => (num_: unknown) =>
      num.toFixed(num_, fractionDigits, defaultValue)
}
