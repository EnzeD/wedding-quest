// Shared time uniform consumed by every shader patch in src/shaders/*.
// Single source of truth so a single tick per frame keeps everything in sync.
export const sharedTime: { value: number } = { value: 0 };

export function tickShaders(dt: number): void {
  sharedTime.value += dt;
}
