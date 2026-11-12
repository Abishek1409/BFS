// WebGL capability check for the List_View fallback (Req 16.1).

/** True when the browser can create a WebGL2 or WebGL1 context (no extension demands). */
export function hasWebGL(): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();   // free the probe context right away
    return true;
  } catch {
    return false;
  }
}
