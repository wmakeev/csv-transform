export * from './tryParseInt.js'

export const min = (vals: unknown[]) => {
  if (!Array.isArray(vals)) {
    throw new Error('num:min function expected array argument')
  }
  const nums = vals.filter(n => Number.isFinite(n)) as number[]
  return Math.min(...nums)
}

export const max = (vals: unknown[]) => {
  if (!Array.isArray(vals)) {
    throw new Error('num:max function expected array argument')
  }
  const nums = vals.filter(n => Number.isFinite(n)) as number[]
  return Math.max(...nums)
}
