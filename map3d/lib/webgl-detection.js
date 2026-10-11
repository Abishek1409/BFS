/**
 * WebGL Detection and Fallback System
 * Provides capability detection and graceful degradation for unsupported browsers
 */

export class WebGLDetection {
  static isSupported() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return false;
      }
      
      // Check for required extensions
      const requiredExtensions = [
        'OES_standard_derivatives',
        'EXT_shader_texture_lod'
      ];
      
      const available = requiredExtensions.every(ext => {
        try {
          return gl.getExtension(ext) !== null;
        } catch (e) {
          return false;
        }
      });
      
      // Clean up
      canvas.width = 1;
      canvas.height = 1;
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
      
      return available;
    } catch (e) {
      console.warn('WebGL detection failed:', e);
      return false;
    }
  }
  
  static getCapabilities() {
    if (!this.isSupported()) {
      return null;
    }
    
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      const capabilities = {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        maxVertexTextures: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxFragmentTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
        aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
      };
      
      // Clean up
      canvas.width = 1;
      canvas.height = 1;
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
      
      return capabilities;
    } catch (e) {
      console.warn('WebGL capabilities detection failed:', e);
      return null;
    }
  }
  
  static getFallbackMessage() {
    return {
      title: '3D Map Unavailable',
      message: 'Your browser doesn\'t support WebGL. Showing enhanced table list instead.',
      suggestion: 'For the full 3D experience, try using Chrome, Firefox, or Safari.'
    };
  }
}

export const checkWebGLSupport = () => WebGLDetection.isSupported();
export const getWebGLCapabilities = () => WebGLDetection.getCapabilities();
export const getWebGLFallbackMessage = () => WebGLDetection.getFallbackMessage();