// Animated floating-lines background. Same look as FloatingLines.js, without three.js (~1.2 MB -> ~5 KB).
// Speed: renders at a fraction of screen resolution (soft glow lines upscale cleanly), caps the frame
// rate, starts after the page has loaded, pauses when the tab is hidden, and draws one still frame
// for users who prefer reduced motion.
(function () {
  'use strict';

  var OPTIONS = {
    colors: ['#ffb000', '#6f4e37', '#3b2a20', '#e8d3a2', '#f7e7ce'], // amber, mocha, champagne
    lineCount: { top: 3, middle: 4, bottom: 5 },
    lineDistance: { top: 0.09, middle: 0.07, bottom: 0.05 },
    speed: 0.45,
    fps: 30,
    renderScale: 0.5 // fraction of CSS pixels actually shaded
  };

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  // GLSL ES 1.0: loops need constant bounds, so loop to MAX_LINES and break at the real count.
  var FRAG = [
    'precision mediump float;',
    'uniform float t; uniform vec2 res;',
    'uniform vec3 grad[5];',
    'uniform int nTop; uniform int nMid; uniform int nBot;',
    'uniform vec3 dist;', // top, middle, bottom
    'const int MAX_LINES = 8;',
    'mat2 rot(float r){ return mat2(cos(r), sin(r), -sin(r), cos(r)); }',
    'vec3 lineColor(float k){',
    '  float s = clamp(k, 0.0, 0.9999) * 4.0;',
    '  int i = int(floor(s)); float f = fract(s);',
    '  vec3 a = grad[0]; vec3 b = grad[1];',
    '  if (i == 1) { a = grad[1]; b = grad[2]; }',
    '  else if (i == 2) { a = grad[2]; b = grad[3]; }',
    '  else if (i >= 3) { a = grad[3]; b = grad[4]; }',
    '  return mix(a, b, f) * 0.5;',
    '}',
    'float wave(vec2 uv, float off){',
    '  float tm = t;',
    '  float amp = sin(off + tm * 0.2) * 0.3;',
    '  float y = sin(uv.x + off + tm * 0.1) * amp;',
    '  return 0.0175 / max(abs(uv.y - y) + 0.01, 1e-3) + 0.01;',
    '}',
    'void main(){',
    '  vec2 uv = (2.0 * gl_FragCoord.xy - res) / res.y; uv.y *= -1.0;',
    '  float lg = log(length(uv) + 1.0);',
    '  vec3 col = vec3(0.0);',
    // bottom group: rotation hoisted out of the loop (same for every line in the group)
    '  vec2 rb = uv * rot(-1.0 * lg);',
    '  for (int i = 0; i < MAX_LINES; ++i) { if (i >= nBot) break; float fi = float(i);',
    '    col += lineColor(fi / max(float(nBot - 1), 1.0)) * wave(rb + vec2(dist.z * fi + 2.0, -0.7), 1.5 + 0.2 * fi) * 0.2; }',
    '  vec2 rm = uv * rot(0.2 * lg);',
    '  for (int i = 0; i < MAX_LINES; ++i) { if (i >= nMid) break; float fi = float(i);',
    '    col += lineColor(fi / max(float(nMid - 1), 1.0)) * wave(rm + vec2(dist.y * fi + 5.0, 0.0), 2.0 + 0.15 * fi); }',
    '  vec2 rt = uv * rot(-0.4 * lg); rt.x *= -1.0;',
    '  for (int i = 0; i < MAX_LINES; ++i) { if (i >= nTop) break; float fi = float(i);',
    '    col += lineColor(fi / max(float(nTop - 1), 1.0)) * wave(rt + vec2(dist.x * fi + 10.0, 0.5), 1.0 + 0.2 * fi) * 0.1; }',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function hex(h) {
    var v = h.replace('#', '');
    return [parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255];
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('bg-lines shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  function mount(root) {
    var canvas = document.createElement('canvas');
    canvas.className = 'bg-lines-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return; // no WebGL: the plain dark ground stays

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // One triangle that covers the screen
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var small = window.matchMedia('(max-width: 900px)').matches;
    var q = function (n) { return small ? Math.max(2, Math.round(n * 0.7)) : n; };
    var uT = gl.getUniformLocation(prog, 't');
    var uRes = gl.getUniformLocation(prog, 'res');
    gl.uniform3fv(gl.getUniformLocation(prog, 'grad'), new Float32Array([].concat.apply([], OPTIONS.colors.map(hex))));
    gl.uniform1i(gl.getUniformLocation(prog, 'nTop'), q(OPTIONS.lineCount.top));
    gl.uniform1i(gl.getUniformLocation(prog, 'nMid'), q(OPTIONS.lineCount.middle));
    gl.uniform1i(gl.getUniformLocation(prog, 'nBot'), q(OPTIONS.lineCount.bottom));
    gl.uniform3f(gl.getUniformLocation(prog, 'dist'), OPTIONS.lineDistance.top, OPTIONS.lineDistance.middle, OPTIONS.lineDistance.bottom);

    function resize() {
      var w = Math.max(1, Math.round(root.clientWidth * OPTIONS.renderScale));
      var h = Math.max(1, Math.round(root.clientHeight * OPTIONS.renderScale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    }

    function draw(seconds) {
      gl.uniform1f(uT, seconds * OPTIONS.speed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    root.appendChild(canvas);
    resize();
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); if (still) draw(8); }, 150);
    });

    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) { draw(8); requestAnimationFrame(function () { canvas.classList.add('ready'); }); return; }

    var start = performance.now();
    var last = 0;
    var raf = 0;
    var interval = 1000 / OPTIONS.fps;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < interval) return;
      last = now;
      draw((now - start) / 1000);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(loop);
    });
    raf = requestAnimationFrame(loop);
    requestAnimationFrame(function () { canvas.classList.add('ready'); }); // fade in
  }

  function boot() {
    var root = document.getElementById('gradient-waves-root');
    if (!root) return;
    // Start after first paint so the billing UI is usable first
    var go = function () { mount(root); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
    else setTimeout(go, 300);
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
