/**
 * Night mode calculation
 * Handles score-based night mode triggering and transitions
 */

import { float, floor, Fn, mod, select, smoothstep, vec2 } from 'three/tsl';
import type { FnArguments } from './types.ts';

const INVERT_DISTANCE = float(700) // Score interval for toggling night mode
const NIGHT_WINDOW = float(300) // Duration of night mode within each interval
const TRANSITION_DURATION = float(10) // Duration of fade in/out transitions

export const calculateNightMode = Fn(([score]: FnArguments) => {

  // Only start night mode after first trigger distance
  const isAfterFirstTrigger = score.greaterThanEqual(INVERT_DISTANCE)

  // Calculate cycle position within each interval (after first trigger)
  const cyclePosition = mod(score.sub(INVERT_DISTANCE), INVERT_DISTANCE)

  const fadeInEnd = TRANSITION_DURATION
  const fadeOutStart = NIGHT_WINDOW.sub(TRANSITION_DURATION)

  const nightProgress = select(
    isAfterFirstTrigger,
    smoothstep(0, fadeInEnd, cyclePosition).mul(smoothstep(NIGHT_WINDOW, fadeOutStart, cyclePosition)),
    0
  )
  const nightCount = floor(score.div(INVERT_DISTANCE))

  return vec2(nightProgress, nightCount)
})
