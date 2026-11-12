// Prism background: vanilla-JS port of the React Bits <Prism /> component (same shader and behaviour).
// Mounts into #gradient-waves-root. Needs WebGL2; without it the plain dark ground stays.
// Speed: low render resolution (the glow is soft, so it upscales cleanly), frame-rate cap,
// starts after the page has loaded, pauses when the tab is hidden, still frame for reduced motion.
(function () {
  'use strict';

  // Settings for the billing page background (see the props table of the original component)
  var OPTIONS = {
    animationType: 'rotate',   // 'rotate' | '3drotate' | 'hover' | 'static'
    timeScale: 0.5,
    height: 3.5,
    baseWidth: 5.5,
    scale: 3.6,
    hueShift: 0,
    colorFrequency: 1,
    glow: 1,
    noise: 0,
    saturation: 1.5,
    // Burst amber, champagne, champagne gold, mocha
    colors: ['#ffb000', '#f7e7ce', '#e8d3a2', '#6f4e37'],
    offset: { x: 0, y: 0 },
    interactive: true,
    hoverStrength: 2,
    inertia: 0.05,
    intro: true,
    resolution: 0.4,           // 0.25-1. Full-screen background, so a little under the 0.5 default
    lightMode: false,
    dpr: 1,
    maxFps: 30                 // added for this page: caps GPU work on shop laptops
  };

  var INTRO_SECONDS = 1.4;
  var PALETTE_SIZE = 64;
  var HUE_W = [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114];
  var HUE_U = [0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.3, -0.588, 0.886];
  var HUE_V = [0.168, -0.331, 0.5, 0.328, 0.035, -0.5, -0.497, 0.296, 0.201];

  var VERTEX = [
    '#version 300 es',
    'void main() {',
    '  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));',
    '  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAGMENT = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 uResolution;',
    'uniform mat3 uRay;',
    'uniform float uGlow;',
    'uniform vec2 uOffset;',
    'uniform float uColorFreq;',
    'uniform float uCenterShift;',
    'uniform float uInvBaseHalf;',
    'uniform float uInvHeight;',
    'uniform float uMinAxis;',
    'uniform float uPxScale;',
    'uniform sampler2D uPalette;',
    'uniform int uUsePalette;',
    'uniform float uTime;',
    'uniform float uNoise;',
    'uniform float uSaturation;',
    'uniform mat3 uHue;',
    'uniform int uUseHue;',
    'uniform float uLight;',
    'uniform float uNeutral;',
    'out vec4 outColor;',
    'const vec4 PHASE_COS = vec4(1.0, 0.5403023058681398, -0.4161468365471424, -0.9899924966004454);',
    'const vec4 PHASE_SIN = vec4(0.0, 0.8414709848078965, 0.9092974268256817, 0.1411200080598672);',
    'float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123); }',
    'float pyramid(vec3 p) {',
    '  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);',
    '  return max((q.x + q.y + q.z - 1.0) * uMinAxis * 0.5773502691896258, -p.y);',
    '}',
    'vec3 grade(vec3 col, vec2 seed) {',
    '  col += (rand(seed) - 0.5) * uNoise;',
    '  col = clamp(col, 0.0, 1.0);',
    '  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));',
    '  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);',
    '  if (uUseHue == 1) col = clamp(uHue * col, 0.0, 1.0);',
    '  return col;',
    '}',
    'void main() {',
    '  vec2 f = (gl_FragCoord.xy - 0.5 * uResolution - uOffset) * uPxScale;',
    '  vec3 origin = uRay * vec3(f, 0.0);',
    '  vec3 axis = uRay[2];',
    '  float z = 5.0;',
    '  vec4 o = vec4(0.0);',
    '  for (int i = 0; i < 100; i++) {',
    '    vec3 p = origin + axis * z;',
    '    float d = 0.1 + 0.2 * abs(pyramid(p + vec3(0.0, uCenterShift, 0.0)));',
    '    z -= d;',
    '    float phase = (p.y + z) * uColorFreq;',
    '    vec4 band = sin(phase) * PHASE_COS + cos(phase) * PHASE_SIN + 1.0;',
    '    if (uUsePalette == 1) band.rgb = texture(uPalette, vec2(phase * 0.15915494309189535, 0.5)).rgb * 2.0;',
    '    o += band / d;',
    '  }',
    '  vec4 raw = o * o * uGlow / 1e5;',
    '  vec4 e = exp(2.0 * raw);',
    '  vec4 mapped = (e - 1.0) / (e + 1.0);',
    '  vec2 seed = gl_FragCoord.xy + vec2(uTime);',
    '  if (uLight > 0.5) {',
    '    float peak = max(raw.r, max(raw.g, raw.b));',
    '    vec3 hue = grade(raw.rgb / max(peak, 1e-6), seed);',
    '    vec3 ink = pow(hue, vec3(1.5)) * mix(0.86, 0.32, uNeutral);',
    '    float strength = max(mapped.r, max(mapped.g, mapped.b)) * mapped.a;',
    '    float cover = clamp(strength * 0.95 + (rand(seed.yx) - 0.5) * uNoise * 0.5, 0.0, 1.0);',
    '    outColor = vec4(ink * cover, cover);',
    '  } else {',
    '    outColor = vec4(grade(mapped.rgb, seed) * mapped.a, mapped.a);',
    '  }',
    '}'
  ].join('\n');

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.warn('Prism shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  function link(gl) {
    var vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    var fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    var program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
    var uniforms = {};
    var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program: program, uniforms: uniforms };
  }

  function rotation(yaw, pitch, roll) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var cx = Math.cos(pitch), sx = Math.sin(pitch);
    var cz = Math.cos(roll), sz = Math.sin(roll);
    return [
      cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz,
      -cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz,
      sy * cx, -sx, cy * cx
    ];
  }

  function multiply(a, b) {
    var out = new Array(9);
    for (var c = 0; c < 3; c++) {
      for (var r = 0; r < 3; r++) {
        out[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
      }
    }
    return out;
  }

  /** Normalises options the same way the React component does. */
  function toSettings(o) {
    return {
      height: Math.max(0.1, o.height),
      baseWidth: Math.max(0.1, o.baseWidth),
      animationType: o.animationType === 'rotate3d' ? '3drotate' : o.animationType,
      glow: Math.max(0, o.glow),
      offsetX: (o.offset && o.offset.x) || 0,
      offsetY: (o.offset && o.offset.y) || 0,
      noise: Math.max(0, o.noise),
      scale: Math.max(0.1, o.scale),
      hueShift: ((o.hueShift || 0) * Math.PI) / 180,
      colorFrequency: Math.max(0, o.colorFrequency),
      colors: Array.isArray(o.colors) ? o.colors.filter(Boolean).slice(0, 8) : [],
      saturation: Math.max(0, o.saturation),
      timeScale: Math.max(0, o.timeScale),
      interactive: o.interactive,
      hoverStrength: Math.max(0, o.hoverStrength),
      inertia: clamp(o.inertia, 0.001, 1),
      intro: o.intro,
      resolution: clamp(o.resolution, 0.25, 1),
      lightMode: o.lightMode,
      dpr: o.dpr,
      frameInterval: o.maxFps > 0 ? 1000 / o.maxFps : 0
    };
  }

  /**
   * Mounts the prism into `root`. Returns a cleanup function, or null when WebGL2 is unavailable.
   */
  function mountPrism(root, options) {
    var s = toSettings(options);

    var container = document.createElement('div');
    container.className = 'prism';
    var canvas = document.createElement('canvas');
    canvas.className = 'prism-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
      powerPreference: 'low-power'
    });
    if (!gl) return null;
    var shader = link(gl);
    if (!shader) return null;
    root.appendChild(container);

    var u = shader.uniforms;
    var vao = gl.createVertexArray();
    var paletteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PALETTE_SIZE, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Palette: CSS colours -> 64-px gradient texture (built once; colours don't change at runtime)
    var neutral = 0;
    (function buildPalette(list) {
      if (!list.length) return;
      var probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      var parse = function (value) {
        if (!probe) return [255, 255, 255];
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = String(value);
        probe.fillRect(0, 0, 1, 1);
        var d = probe.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      var stops = list.map(parse);
      neutral = 1 - stops.reduce(function (sum, rgb) {
        var top = Math.max(rgb[0], rgb[1], rgb[2]);
        return sum + (top > 0 ? (top - Math.min(rgb[0], rgb[1], rgb[2])) / top : 0);
      }, 0) / stops.length;
      var data = new Uint8Array(PALETTE_SIZE * 4);
      for (var i = 0; i < PALETTE_SIZE; i++) {
        var position = (i / PALETTE_SIZE) * stops.length;
        var index = Math.floor(position);
        var a = stops[index % stops.length];
        var b = stops[(index + 1) % stops.length];
        var t = position - index;
        var k = t * t * (3 - 2 * t);
        for (var c = 0; c < 3; c++) data[i * 4 + c] = Math.round(a[c] + (b[c] - a[c]) * k);
        data[i * 4 + 3] = 255;
      }
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PALETTE_SIZE, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    })(s.colors);

    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    var view = { width: 1, height: 1, scale: 1 };
    var pose = { yaw: 0, pitch: 0, roll: 0 };
    var pointer = { x: 0, y: 0, inside: false };
    var time = 0;
    var introClock = s.intro && !reduce ? 0 : 1;
    var raf = 0;
    var last = 0;
    var visible = true;

    // Uniforms that never change are set once instead of every frame
    var half = s.baseWidth * 0.5;
    var hc = Math.cos(s.hueShift), hs = Math.sin(s.hueShift);
    var hueMatrix = HUE_W.map(function (w, i) { return w + HUE_U[i] * hc + HUE_V[i] * hs; });
    gl.useProgram(shader.program);
    gl.bindVertexArray(vao);
    gl.uniform1f(u.uColorFreq, s.colorFrequency);
    gl.uniform1f(u.uCenterShift, s.height * 0.25);
    gl.uniform1f(u.uInvBaseHalf, 1 / half);
    gl.uniform1f(u.uInvHeight, 1 / s.height);
    gl.uniform1f(u.uMinAxis, Math.min(half, s.height));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.uniform1i(u.uPalette, 0);
    gl.uniform1i(u.uUsePalette, s.colors.length ? 1 : 0);
    gl.uniform1f(u.uNoise, s.noise);
    gl.uniform1f(u.uSaturation, s.saturation);
    gl.uniformMatrix3fv(u.uHue, false, hueMatrix);
    gl.uniform1i(u.uUseHue, Math.abs(s.hueShift) > 0.0001 ? 1 : 0);
    gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
    gl.uniform1f(u.uNeutral, neutral);

    function orientation() {
      var tilt = rotation(pose.yaw, pose.pitch, pose.roll);
      var t;
      if (s.animationType === 'rotate') {
        t = time * s.timeScale;
        var c0 = Math.cos(t), c1 = Math.cos(t + 33), c2 = Math.cos(t + 11);
        return multiply(tilt, [c0, 0, c2, 0, 1, 0, c1, 0, c0]);
      }
      if (s.animationType === '3drotate') {
        t = time * s.timeScale;
        return multiply(tilt, rotation(t * 0.55, Math.sin(t * 0.6 + 0.6) * 0.6, Math.sin(t * 0.35 + 1.9) * 0.5));
      }
      return tilt;
    }

    function draw() {
      var ignite = introClock * introClock * (3 - 2 * introClock);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniformMatrix3fv(u.uRay, false, orientation());
      gl.uniform1f(u.uGlow, s.glow * ignite * ignite);
      gl.uniform2f(u.uOffset, s.offsetX * view.scale, -s.offsetY * view.scale);
      gl.uniform1f(u.uPxScale, 1 / (canvas.height * 0.1 * s.scale));
      gl.uniform1f(u.uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function pixelScale() { return Math.min(s.dpr || window.devicePixelRatio || 1, 2) * s.resolution; }

    function resize() {
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      view.scale = pixelScale();
      canvas.width = Math.max(1, Math.round(view.width * view.scale));
      canvas.height = Math.max(1, Math.round(view.height * view.scale));
      draw();
      wake();
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (Math.round(view.width * pixelScale()) !== canvas.width) { resize(); return; }
      // Frame-rate cap: skip this vsync if the last drawn frame is too recent
      if (s.frameInterval && last && now - last < s.frameInterval) { raf = requestAnimationFrame(frame); return; }
      var dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
      last = now;
      if (!reduce) time += dt;
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);

      var hover = s.animationType === 'hover';
      var aim = pointer.inside && !reduce && (hover || s.interactive);
      var reach = (hover ? 0.6 : 0.09) * s.hoverStrength;
      var yaw = aim ? -pointer.x * reach : 0;
      var pitch = aim ? pointer.y * reach : 0;
      var follow = 1 - Math.pow(1 - s.inertia, dt * 60);
      pose.yaw += (yaw - pose.yaw) * follow;
      pose.pitch += (pitch - pose.pitch) * follow;
      pose.roll += (0 - pose.roll) * (1 - Math.pow(0.9, dt * 60));

      draw();

      var settling = Math.abs(yaw - pose.yaw) + Math.abs(pitch - pose.pitch) + Math.abs(pose.roll) > 1e-4;
      var spinning = !reduce && !hover && s.animationType !== 'static' && s.timeScale > 0;
      var busy = spinning || settling || introClock < 1 || (!reduce && s.noise > 0);
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    // The background sits behind the UI, so track the pointer on the window
    function onPointerMove(event) {
      var x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      var y = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      pointer.inside = Math.abs(x) <= 1 && Math.abs(y) <= 1;
      pointer.x = clamp(x, -1, 1);
      pointer.y = clamp(y, -1, 1);
      if (s.interactive || s.animationType === 'hover') wake();
    }
    function onPointerLeave() { pointer.inside = false; wake(); }
    function onVisibility() { last = 0; wake(); }

    var resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    var intersection = new IntersectionObserver(function (entries) {
      visible = entries.some(function (entry) { return entry.isIntersecting; });
      if (visible) { last = 0; wake(); }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onPointerLeave);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    return function destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onPointerLeave);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteTexture(paletteTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  }

  window.mountPrism = mountPrism;

  function boot() {
    var root = document.getElementById('gradient-waves-root');
    if (!root) return;
    // Start after the billing UI is ready so the background never delays it
    var go = function () { mountPrism(root, OPTIONS); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
    else setTimeout(go, 300);
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
