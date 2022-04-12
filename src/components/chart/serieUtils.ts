/**
 * get 1 ohlc bar out of actives exchanges in bar
 * simple average
 * @param {Renderer} renderer
 */
export function avg_ohlc$(state, renderer) {
  let nbSources = 0
  let setOpen = false

  let open
  let high = 0
  let low = 0
  let close = 0

  if (typeof state.open === 'undefined') {
    setOpen = true
    open = 0
  }

  for (const identifier in renderer.sources) {
    if (!renderer.sources[identifier].active || renderer.sources[identifier].open === null) {
      continue
    }

    if (setOpen) {
      open += renderer.sources[identifier].open
    }

    high += renderer.sources[identifier].high
    low += renderer.sources[identifier].low
    close += renderer.sources[identifier].close

    nbSources++
  }

  if (!nbSources) {
    return { time: renderer.localTimestamp }
  }

  if (setOpen) {
    state.open = open / nbSources
  }

  state.high = Math.max(state.high, high / nbSources)
  state.low = Math.min(state.low, low / nbSources)
  state.close = close / nbSources

  return { time: renderer.localTimestamp, open: state.open, high: state.high, low: state.low, close: state.close }
}

export function avg_real_ohlc$(state, renderer) {
  let nbSources = 0

  let open = 0
  let high = 0
  let low = 0
  let close = 0

  for (const identifier in renderer.sources) {
    if (!renderer.sources[identifier].active || renderer.sources[identifier].open === null) {
      continue
    }

    open += renderer.sources[identifier].open
    high += renderer.sources[identifier].high
    low += renderer.sources[identifier].low
    close += renderer.sources[identifier].close

    nbSources++
  }

  if (!nbSources) {
    return { time: renderer.localTimestamp }
  }

  state.open = open / nbSources
  state.high = Math.max(state.high, high / nbSources)
  state.low = Math.min(state.low, low / nbSources)
  state.close = close / nbSources

  return { time: renderer.localTimestamp, open: state.open, high: state.high, low: state.low, close: state.close }
}

/**
 * get 1 ohlc bar out of actives exchanges in bar
 * simple average
 * @param {Renderer} renderer
 */
export function avg_close$(state, renderer) {
  let nbSources = 0

  state.close = 0

  for (const identifier in renderer.sources) {
    if (renderer.sources[identifier].open === null) {
      continue
    }

    state.close += renderer.sources[identifier].close

    nbSources++
  }

  if (!nbSources) {
    nbSources = 1
  }

  state.close /= nbSources

  return state.close
}

/**
 * get 1 ohlc bar out of actives exchanges in bar
 * simple average
 * @param {Renderer} renderer
 */
export function ohlc$(state, value, time) {
  if (typeof state.open === 'undefined') {
    state.open = value
    state.high = value
    state.low = value
  }

  state.high = Math.max(state.high, value)
  state.low = Math.min(state.low, value)
  state.close = value

  return { time: time, open: state.open, high: state.high, low: state.low, close: state.close }
}

/**
 * get 1 ohlc bar out of actives exchanges in bar
 * simple average
 * @param {Renderer} renderer
 */
export function cum_ohlc$(state, value, time) {
  if (typeof state.open === 'undefined') {
    state.open = value
    state.high = value
    state.low = value
  } else {
    value = state.open + value
  }

  state.high = Math.max(state.high, value)
  state.low = Math.min(state.low, value)
  state.close = value

  return { time: time, open: state.open, high: state.high, low: state.low, close: state.close }
}

/**
 * get 1 ohlc bar out of actives exchanges in bar
 * simple average
 * @param {Renderer} renderer
 */
export function cum$(state, value) {
  if (typeof state.open === 'undefined') {
    state.open = value
  }

  state.close = state.open + value

  return state.close
}

/**
 * pivot high
 * @param {Renderer} renderer
 */
export const pivot_high = {
  count: 0,
  points: [],
  baseLength: 1,
  lengthIndexes: [1, 2]
}
export function pivot_high$(state, value, lengthBefore, lengthAfter) {
  state.output = value

  const middle = state.points[lengthBefore]
  const length = lengthBefore + lengthAfter

  for (let i = 0; i <= length; i++) {
    const current = i < length - 1 ? state.points[i] : value

    if (current > middle) {
      return null
    }
  }

  return middle
}

/**
 * pivot low
 * @param {Renderer} renderer
 */
export const pivot_low = {
  count: 0,
  points: [],
  baseLength: 1,
  lengthIndexes: [1, 2]
}
export function pivot_low$(state, value, lengthBefore, lengthAfter) {
  state.output = value

  const middle = state.points[lengthBefore]
  const length = lengthBefore + lengthAfter

  for (let i = 0; i <= length; i++) {
    const current = i < length - 1 ? state.points[i] : value

    if (current < middle) {
      return null
    }
  }

  return middle
}

/**
 * Highest value state
 */
export const highest = {
  count: 0,
  points: []
}
/**
 * get highest value
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function highest$(state, value) {
  state.output = value

  if (state.count) {
    return Math.max.apply(null, state.points)
  } else {
    return value
  }
}

/**
 * Lowest value state
 */
export const lowest = {
  count: 0,
  points: []
}
/**
 * Lowest value
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function lowest$(state, value) {
  state.output = value

  if (state.count) {
    return Math.min.apply(null, state.points)
  } else {
    return value
  }
}

/**
 * Linear Regression state
 */
export const linreg = {
  count: 0,
  sum: 0,
  points: []
}

/**
 * Linear Regression
 * @param state
 * @param value
 * @param length
 * @returns
 */
export function linreg$(state, value, length) {
  state.output = value

  if (state.count < 1) {
    return null
  }

  let count = 0
  let per = 0
  let sumX = 0
  let sumY = 0
  let sumXSqr = 0
  let sumXY = 0

  for (let i = 0; i <= state.points.length; i++) {
    const val = i === state.points.length ? value : state.points[i]
    per = i + 1
    sumX += per
    sumY += val
    sumXSqr += per * per
    sumXY += val * per
    count++
  }

  const slope = (count * sumXY - sumX * sumY) / (count * sumXSqr - sumX * sumX)
  const average = sumY / count
  const intercept = average - (slope * sumX) / length + slope

  return intercept + slope * (count - 1)
}

/**
 * get avg
 * @param {SerieMemory} memory
 * @param {number[]} values
 */
export function avg$(state, values) {
  let count = 0
  let sum = 0

  for (let i = 0; i < values.length; i++) {
    if (values[i] === null) {
      continue
    }
    sum += values[i]
    count++
  }

  return sum / count
}

/**
 * sum state
 */
export const sum = {
  count: 0,
  sum: 0,
  points: []
}
/**
 * sum
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function sum$(state, value) {
  state.output = value
  return state.sum + value
}

/**
 * simple moving average (SMA) state
 */
export const sma = {
  count: 0,
  sum: 0,
  points: []
}
/**
 * simple moving average (SMA)
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function sma$(state, value) {
  const average = (state.sum + value) / (state.count + 1)
  state.output = value
  return average
}

/**
 * cumulative moving average (CMA) state
 */
export const cma = {
  count: 0,
  sum: 0,
  points: []
}
/**
 * cumulative moving average (CMA)
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function cma$(state, value) {
  state.output = (state.sum + value) / (state.count + 1)
  return state.output
}

/**
 * exponential moving average (EMA) state
 */
export const ema = {
  count: 0,
  sum: 0,
  points: []
}
/**
 * exponential moving average
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function ema$(state, value, length) {
  const k = 2 / (length + 1)

  if (state.count) {
    const last = state.points[state.points.length - 1]
    state.output = (value - last) * k + last
  } else {
    state.output = value
  }

  return state.output
}

/**
 * rolling moving average (EMA) state
 */
export const rma = {
  count: 0,
  sum: 0,
  points: []
}
/**
 * exponential moving average
 * @param {SerieMemory} memory
 * @param {number} value
 */
export function rma$(state, value, length) {
  const k = 1 / length

  if (state.count) {
    const last = state.points[state.points.length - 1]
    state.output = k * value + (1 - k) * last
  } else {
    state.output = 1
  }

  return state.output
}

export const avg_heikinashi = {
  point: {} // previous point
}

export function avg_heikinashi$(state, renderer) {
  let nbSources = 0

  state.open = 0
  state.high = 0
  state.low = 0
  state.close = 0

  for (const identifier in renderer.sources) {
    if (renderer.sources[identifier].open === null) {
      continue
    }

    state.open += renderer.sources[identifier].open
    state.high += renderer.sources[identifier].high
    state.low += renderer.sources[identifier].low
    state.close += renderer.sources[identifier].close

    nbSources++
  }

  if (!nbSources) {
    nbSources = 1
  }

  state.high /= nbSources
  state.low /= nbSources
  state.close /= nbSources

  if (typeof state.point.open !== 'undefined') {
    state.open = (state.point.open + state.point.close) / 2
    state.close = 0.25 * (state.open + state.high + state.low + state.close)

    state.low = Math.min(state.open, state.low, state.close)
    state.high = Math.max(state.open, state.high, state.close)
  } else {
    state.open /= nbSources
  }

  return { time: renderer.localTimestamp, open: state.open, high: state.high, low: state.low, close: state.close }
}

export function merge_overlapping_intervals$(state, intervals) {
  return intervals
    .sort((a, b) => a[0] - b[0])
    .reduce(
      (acc, range) => {
        const indexOfLast = acc.length - 1
        const prevRange = acc[indexOfLast]
        const end = prevRange[1]
        const start = range[0]

        if (end >= start) {
          acc[indexOfLast][1] = Math.max(end, range[1])
        } else {
          acc.push(range)
        }

        return acc
      },
      [intervals[0]]
    )
}

export function reverse_intervals$(state, intervals) {
  return intervals.reduce((acc, range, i, arr) => {
    if (i > 0) {
      acc[i - 1][1] = range[0]
    }

    if (i < arr.length - 1) {
      acc.push([range[1]])
    }

    return acc
  }, [])
}
