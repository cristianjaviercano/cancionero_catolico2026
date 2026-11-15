declare module 'pitchfinder' {
  export function YIN(config?: Record<string, unknown>): (float32Array: Float32Array) => number | null;
  export function AMDF(config?: Record<string, unknown>): (float32Array: Float32Array) => number | null;
}
