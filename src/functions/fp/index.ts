import * as arr from '../arr/index.js'
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
  }
}
