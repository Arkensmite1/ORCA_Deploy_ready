/*!
 * ORCA · Ambient 3D ocean background
 * ---------------------------------------------------------------------------
 * A dependency-free WebGL2 scene that sits behind every page of the site:
 *
 *   • a bathymetric contour terrain that swells and ripples
 *   • a translucent glass orca that patrols the water column
 *   • a school of fish (boids) that flock, flee and scatter
 *   • drifting bioluminescent plankton
 *
 * Interaction
 *   – move the pointer  : the sea swells under it, plankton parts, fish flee,
 *                         the orca gets curious and circles the cursor
 *   – click / tap       : shock-wave ripple, plankton burst, fish scatter,
 *                         the orca surges forward
 *   – scroll            : the camera dives through the water column
 *
 * Good citizen: respects prefers-reduced-motion (draws one still frame),
 * pauses when the tab is hidden, adapts resolution if the GPU struggles,
 * and can be switched off with the round toggle button (remembered).
 *
 * Public API:  window.OrcaBG = { supported, enabled, enable(), disable(),
 *                                toggle(), pulse(clientX, clientY) }
 */
(function () {
  'use strict';
  if (window.OrcaBG) return;

  var win = window, doc = document;
  var LS_KEY = 'orca:ambient3d';

  var reduceMQ = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function prefersReduced() { return !!(reduceMQ && reduceMQ.matches); }

  function lsGet() { try { return win.localStorage.getItem(LS_KEY); } catch (e) { return null; } }
  function lsSet(v) { try { win.localStorage.setItem(LS_KEY, v); } catch (e) { /* private mode */ } }

  var api = {
    supported: false,
    enabled: lsGet() !== 'off',
    enable: function () { setEnabled(true); },
    disable: function () { setEnabled(false); },
    toggle: function () { setEnabled(!api.enabled); },
    pulse: function (x, y) { if (ready) shock(x == null ? win.innerWidth / 2 : x, y == null ? win.innerHeight / 2 : y, 1); }
  };
  win.OrcaBG = api;

  // ─────────────────────────────────────────────────────────────── math ──
  var PI = Math.PI, TAU = PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function angDiff(a, b) { var d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; }

  function perspective(o, fovy, aspect, n, f) {
    var t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
    o[0] = t / aspect; o[1] = 0; o[2] = 0; o[3] = 0;
    o[4] = 0; o[5] = t; o[6] = 0; o[7] = 0;
    o[8] = 0; o[9] = 0; o[10] = (f + n) * nf; o[11] = -1;
    o[12] = 0; o[13] = 0; o[14] = 2 * f * n * nf; o[15] = 0;
  }
  function norm3(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; v[0] /= l; v[1] /= l; v[2] /= l; return v; }
  function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function lookAt(o, eye, tgt) {
    var z = norm3([eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]]);
    var x = norm3(cross3([0, 1, 0], z));
    var y = cross3(z, x);
    o[0] = x[0]; o[1] = y[0]; o[2] = z[0]; o[3] = 0;
    o[4] = x[1]; o[5] = y[1]; o[6] = z[1]; o[7] = 0;
    o[8] = x[2]; o[9] = y[2]; o[10] = z[2]; o[11] = 0;
    o[12] = -dot3(x, eye); o[13] = -dot3(y, eye); o[14] = -dot3(z, eye); o[15] = 1;
    return { fwd: [-z[0], -z[1], -z[2]], right: x, up: y };
  }
  function mul(o, a, b) {
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      var s = 0;
      for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  }
  // 3x3 rotation helpers (column-major, length 9)
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; }
  function mul3(a, b) {
    var o = new Array(9);
    for (var c = 0; c < 3; c++) for (var r = 0; r < 3; r++) {
      var s = 0;
      for (var k = 0; k < 3; k++) s += a[k * 3 + r] * b[c * 3 + k];
      o[c * 3 + r] = s;
    }
    return o;
  }

  // ─────────────────────────────────────────────────────────── shaders ──
  var GLSL_HEAD = '#version 300 es\nprecision highp float;\n' +
    'float sstep(float a, float b, float x){ float t = clamp((x - a)/(b - a), 0.0, 1.0); return t*t*(3.0 - 2.0*t); }\n';

  // fullscreen sky / water-light pass ---------------------------------------
  var BG_VS = GLSL_HEAD + [
    'in vec2 aPos; out vec2 vUv;',
    'void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }'
  ].join('\n');
  var BG_FS = GLSL_HEAD + [
    'in vec2 vUv; out vec4 o;',
    'uniform float uTime; uniform vec2 uRes; uniform vec2 uPtr; uniform float uPtrPow; uniform float uScroll;',
    'void main(){',
    '  vec2 uv = vUv; float asp = uRes.x/uRes.y;',
    '  vec3 top = vec3(0.905,0.955,0.988);',
    '  vec3 bot = vec3(0.978,0.990,1.000);',
    '  vec3 c = mix(bot, top, sstep(0.05, 1.0, uv.y));',
    '  float pool = length((uv - vec2(0.82, 1.02)) * vec2(asp, 1.0));',
    '  c = mix(c, vec3(0.78,0.92,0.99), 0.42*sstep(1.05, 0.0, pool));',
    '  float pool2 = length((uv - vec2(0.05, 0.10)) * vec2(asp, 1.0));',
    '  c = mix(c, vec3(0.86,0.95,0.99), 0.30*sstep(0.85, 0.0, pool2));',
    // caustic veins
    '  vec2 p = vec2(uv.x*asp, uv.y - uScroll*0.00012) * 5.5; float t = uTime*0.22;',
    '  float w = sin(p.x*1.7 + sin(p.y*1.3 + t)*1.5 + t)',
    '          + sin(p.y*2.1 + sin(p.x*1.1 - t)*1.7 - t*1.2)',
    '          + sin((p.x+p.y)*1.2 + t*0.7);',
    '  float veins = pow(max(0.0, 1.0 - abs(w)*0.62), 7.0);',
    '  float near = 1.0 + 2.2*uPtrPow*sstep(0.30, 0.0, length((uv-uPtr)*vec2(asp,1.0)));',
    '  c = mix(c, vec3(0.55,0.83,0.96), clamp(veins*0.16*near, 0.0, 0.45));',
    '  o = vec4(c, 1.0);',
    '}'
  ].join('\n');

  // bathymetric terrain -----------------------------------------------------
  var TER_VS = GLSL_HEAD + [
    'in vec2 aGrid;',
    'uniform mat4 uVP; uniform float uTime; uniform float uFlow; uniform vec3 uPtr; uniform float uPtrPow;',
    'uniform vec4 uRip[10]; uniform vec3 uCam; uniform float uBaseY;',
    'out vec3 vW; out float vH; out float vDist;',
    'float baseH(vec2 p, float t){',
    '  float h = 0.0;',
    '  h += sin(p.x*0.085 + t*0.11) * cos(p.y*0.070 - t*0.09) * 3.4;',
    '  h += sin(p.x*0.190 - p.y*0.150 + t*0.21 + 1.3) * 1.55;',
    '  h += cos(p.x*0.310 + p.y*0.270 - t*0.33) * 0.75;',
    '  h += sin(p.y*0.410 + p.x*0.130 + t*0.42) * 0.38;',
    '  return h;',
    '}',
    'void main(){',
    '  vec2 xz = vec2(aGrid.x*100.0, aGrid.y*85.0 - 42.0);',
    '  float h = baseH(vec2(xz.x, xz.y + uFlow), uTime);',
    '  vec2 d = xz - uPtr.xz;',
    '  h += uPtrPow * 1.5 * exp(-dot(d,d)/34.0);',
    '  for (int i = 0; i < 10; i++) {',
    '    vec4 r = uRip[i];',
    '    float age = uTime - r.z;',
    '    if (r.w > 0.0 && age > 0.0 && age < 4.2) {',
    '      float dd = length(xz - r.xy);',
    '      float e = (dd - age*10.0)*0.26;',
    '      h += r.w * exp(-e*e) * cos((dd - age*10.0)*1.25) * (1.0 - age/4.2);',
    '    }',
    '  }',
    '  vec3 w = vec3(xz.x, uBaseY + h, xz.y);',
    '  vW = w; vH = h; vDist = distance(w, uCam);',
    '  gl_Position = uVP * vec4(w, 1.0);',
    '}'
  ].join('\n');
  var TER_FS = GLSL_HEAD + [
    'in vec3 vW; in float vH; in float vDist; out vec4 o;',
    'uniform float uContour; uniform float uAlpha;',
    'float lineAA(float v, float w){',
    '  float fw = max(fwidth(v), 1e-4);',
    '  float f = abs(fract(v - 0.5) - 0.5) / fw;',
    '  return (1.0 - sstep(0.0, w, f)) * (1.0 - sstep(0.55, 1.4, fw));',
    '}',
    'void main(){',
    '  float lv = vH * uContour;',
    '  float minor = lineAA(lv, 1.0);',
    '  float major = lineAA(lv*0.2, 1.5);',
    '  vec2 g = vW.xz / 10.0;',
    '  float grid = max(lineAA(g.x, 1.0), lineAA(g.y, 1.0));',
    '  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));',
    '  if (n.y < 0.0) n = -n;',
    '  float lit = clamp(dot(n, normalize(vec3(-0.5, 0.8, 0.35))), 0.0, 1.0);',
    '  float fade = 1.0 - sstep(46.0, 128.0, vDist);',
    '  float depthT = clamp(vH*0.11 + 0.5, 0.0, 1.0);',
    '  vec3 deep = vec3(0.01, 0.47, 0.76);',
    '  vec3 shal = vec3(0.02, 0.70, 0.84);',
    '  vec3 col = mix(deep, shal, depthT);',
    '  float relief = (1.0 - lit);',
    '  float a = minor*0.30 + major*0.52 + grid*0.12 + (0.045 + 0.20*relief*relief);',
    '  a *= fade * uAlpha;',
    '  o = vec4(col, a);',
    '}'
  ].join('\n');

  // plankton ----------------------------------------------------------------
  var PAR_VS = GLSL_HEAD + [
    'in vec4 aSeed;',
    'uniform mat4 uVP; uniform float uTime; uniform float uScroll; uniform vec3 uPtr; uniform float uPtrPow;',
    'uniform vec4 uBurst[4]; uniform float uPx;',
    'out float vA; out float vT;',
    'void main(){',
    '  float t = uTime*(0.5 + aSeed.w*0.8);',
    '  float y = mod(aSeed.y*32.0 + t*0.9 + uScroll*0.010*(0.4+aSeed.w), 32.0) - 15.0;',
    '  vec3 p = vec3((aSeed.x-0.5)*112.0 + sin(t*0.6 + aSeed.w*40.0)*1.7, y,',
    '                (aSeed.z-0.5)*92.0 - 14.0 + cos(t*0.5 + aSeed.x*40.0)*1.7);',
    '  vec3 d = p - uPtr; float dist = length(d);',
    '  p += (d/(dist+0.001)) * (uPtrPow * exp(-dist*dist/80.0) * 5.5);',
    '  for (int i = 0; i < 4; i++) {',
    '    vec4 b = uBurst[i]; float age = uTime - b.w;',
    '    if (b.w > 0.0 && age > 0.0 && age < 2.8) {',
    '      vec3 bd = p - b.xyz; float bl = length(bd);',
    '      float e = (bl - age*16.0)*0.12;',
    '      p += (bd/(bl+0.001)) * exp(-e*e) * (1.0 - age/2.8) * 7.0;',
    '    }',
    '  }',
    '  vec4 vp = uVP * vec4(p, 1.0);',
    '  gl_Position = vp;',
    '  float size = mix(0.14, 0.52, aSeed.w);',
    '  gl_PointSize = clamp(size * uPx / max(vp.w, 0.1), 1.6, 26.0);',
    '  float edge = sstep(-15.0, -11.0, y) * (1.0 - sstep(12.0, 16.0, y));',
    '  vA = edge * (0.35 + 0.65*aSeed.w) * (1.0 - sstep(70.0, 130.0, vp.w));',
    '  vT = aSeed.w*6.283 + uTime*(1.0 + aSeed.x);',
    '}'
  ].join('\n');
  var PAR_FS = GLSL_HEAD + [
    'in float vA; in float vT; out vec4 o;',
    'void main(){',
    '  vec2 c = gl_PointCoord*2.0 - 1.0; float d = dot(c,c);',
    '  if (d > 1.0) discard;',
    '  float core = exp(-d*4.5);',
    '  float tw = 0.78 + 0.22*sin(vT);',
    '  vec3 col = mix(vec3(0.16,0.70,0.92), vec3(0.00,0.52,0.74), core);',
    '  o = vec4(col, (core*0.80 + 0.14*(1.0-d)) * vA * tw);',
    '}'
  ].join('\n');

  // fish (instanced) ----------------------------------------------------------
  var FISH_VS = GLSL_HEAD + [
    'in vec3 aPos; in vec3 aNrm;',
    'in vec3 iPos; in vec3 iDir; in vec4 iMisc;',
    'uniform mat4 uVP; uniform float uTime;',
    'out vec3 vN; out vec3 vW; out float vHue; out float vY;',
    'void main(){',
    '  vec3 f = normalize(iDir);',
    '  vec3 r = normalize(cross(vec3(0.0,1.0,0.0), f));',
    '  vec3 u = cross(f, r);',
    '  vec3 l = aPos;',
    '  float tailK = sstep(0.05, -0.70, l.x);',
    '  l.z += sin(uTime*(6.5 + iMisc.w*2.0) + iMisc.x - l.x*7.0) * 0.11 * tailK;',
    '  vec3 w = iPos + (f*l.x + u*l.y + r*l.z) * iMisc.y;',
    '  vN = normalize(f*aNrm.x + u*aNrm.y + r*aNrm.z);',
    '  vW = w; vHue = iMisc.z; vY = aPos.y;',
    '  gl_Position = uVP * vec4(w, 1.0);',
    '}'
  ].join('\n');
  var FISH_FS = GLSL_HEAD + [
    'in vec3 vN; in vec3 vW; in float vHue; in float vY; out vec4 o;',
    'uniform vec3 uCam; uniform float uAlpha;',
    'void main(){',
    '  vec3 N = normalize(gl_FrontFacing ? vN : -vN);',
    '  vec3 V = normalize(uCam - vW);',
    '  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.0);',
    '  float lit = 0.58 + 0.42*dot(N, normalize(vec3(-0.4, 0.9, 0.3)));',
    '  vec3 a = vec3(0.01, 0.46, 0.74); vec3 b = vec3(0.02, 0.74, 0.84);',
    '  vec3 col = mix(a, b, vHue) * lit;',
    '  col = mix(col, vec3(0.78,0.94,1.0), sstep(0.0, -0.06, vY) * 0.55);',
    '  col += vec3(0.55, 0.88, 1.0) * fres * 0.55;',
    '  o = vec4(col, 0.66 * uAlpha);',
    '}'
  ].join('\n');

  // orca ----------------------------------------------------------------------
  var ORCA_VS = GLSL_HEAD + [
    'in vec3 aPos; in vec3 aNrm; in float aPart;',
    'uniform mat4 uVP; uniform mat4 uModel; uniform float uPhase; uniform float uAmp;',
    'out vec3 vL; out vec3 vLn; out vec3 vN; out vec3 vW; out float vPart;',
    'void main(){',
    '  vec3 p = aPos;',
    '  float tf = clamp((-p.x - 0.02)/0.62, 0.0, 1.0);',
    '  p.y += uAmp * tf*tf * sin(uPhase - p.x*4.5);',
    '  p.z += 0.12 * uAmp * tf * sin(uPhase*0.5 + 1.0);',
    '  vec4 wp = uModel * vec4(p, 1.0);',
    '  vW = wp.xyz; vL = aPos; vLn = aNrm; vPart = aPart;',
    '  vN = mat3(uModel) * aNrm;',
    '  gl_Position = uVP * wp;',
    '}'
  ].join('\n');
  var ORCA_FS = GLSL_HEAD + [
    'in vec3 vL; in vec3 vLn; in vec3 vN; in vec3 vW; in float vPart; out vec4 o;',
    'uniform vec3 uCam; uniform float uAlpha;',
    'void main(){',
    '  float fr = gl_FrontFacing ? 1.0 : -1.0;',
    '  vec3 N = normalize(vN) * fr;',
    '  vec3 ln = normalize(vLn) * fr;',
    '  vec3 V = normalize(uCam - vW);',
    '  vec3 L = normalize(vec3(-0.45, 0.85, 0.35));',
    // white patches
    '  float cut = -0.22 + 0.58*sstep(-0.05, -0.36, vL.x);',
    '  float belly = 1.0 - sstep(cut - 0.10, cut + 0.10, ln.y);',
    '  belly *= sstep(-0.47, -0.40, vL.x);',
    '  belly *= 1.0 - sstep(0.455, 0.49, vL.x) * (1.0 - sstep(-0.2, -0.5, ln.y));',
    '  vec2 e = vec2((vL.x - 0.335)/0.062, (vL.y - 0.040)/0.024);',
    '  float eye = (1.0 - sstep(0.55, 1.0, length(e))) * sstep(0.35, 0.75, abs(ln.z));',
    '  float saddle = (1.0 - sstep(0.0, 0.10, abs(vL.x + 0.035))) * sstep(0.05, 0.55, ln.y);',
    '  float white = clamp(belly + eye, 0.0, 1.0);',
    '  if (vPart > 1.5) white = sstep(-0.2, -0.75, ln.y);',   // pectoral / fluke undersides
    '  if (vPart > 0.5 && vPart < 1.5) white = 0.0;',              // dorsal fin
    '  vec3 blackC = vec3(0.015, 0.235, 0.470);',
    '  vec3 whiteC = vec3(0.960, 0.990, 1.000);',
    '  vec3 grayC  = vec3(0.300, 0.560, 0.760);',
    '  vec3 base = mix(blackC, grayC, saddle*0.85);',
    '  base = mix(base, whiteC, white);',
    '  float ndl = max(dot(N, L), 0.0);',
    '  float diff = mix(0.60 + 0.40*ndl, 0.86 + 0.14*ndl, white);',
    '  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);',
    '  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 36.0);',
    '  vec3 col = base * diff + vec3(0.28, 0.76, 1.0) * fres * 0.95 + vec3(1.0) * spec * 0.55;',
    '  float a = mix(0.60, 0.86, white) + fres * 0.20;',
    '  o = vec4(col, clamp(a, 0.0, 0.92) * uAlpha);',
    '}'
  ].join('\n');

  // ───────────────────────────────────────────────────────── GL helpers ──
  var gl = null, canvas = null, progs = {}, ready = false;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('ORCA-BG shader: ' + log);
    }
    return s;
  }
  function program(vs, fs, uniformNames, attribBindings) {
    var p = gl.createProgram();
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v); gl.attachShader(p, f);
    for (var name in attribBindings) gl.bindAttribLocation(p, attribBindings[name], name);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('ORCA-BG link: ' + gl.getProgramInfoLog(p));
    gl.deleteShader(v); gl.deleteShader(f);
    var u = {};
    uniformNames.forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });
    return { p: p, u: u };
  }
  function buffer(data, usage) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW);
    return b;
  }
  function attrib(loc, buf, size, stride, offset, divisor) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride || 0, offset || 0);
    if (divisor) gl.vertexAttribDivisor(loc, divisor);
  }

  // ─────────────────────────────────────────────────────── geometry ──
  function smoothNormals(pos, idx) {
    var n = new Float32Array(pos.length);
    for (var i = 0; i < idx.length; i += 3) {
      var a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      var ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      var vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      [a, b, c].forEach(function (k) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; });
    }
    for (var j = 0; j < n.length; j += 3) {
      var l = Math.sqrt(n[j] * n[j] + n[j + 1] * n[j + 1] + n[j + 2] * n[j + 2]) || 1;
      n[j] /= l; n[j + 1] /= l; n[j + 2] /= l;
    }
    return n;
  }

  // cubic Hermite through control points (finite-difference tangents)
  function makeProfile(xs, ys) {
    var n = xs.length, m = [];
    for (var i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      m[i] = (ys[i1] - ys[i0]) / (xs[i1] - xs[i0]);
    }
    return function (x) {
      var k = 0;
      while (k < n - 2 && x > xs[k + 1]) k++;
      var h = xs[k + 1] - xs[k], t = clamp((x - xs[k]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h * m[k] +
             (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h * m[k + 1];
    };
  }

  // Orca is modelled 1 unit long, nose at +x, back at +y.
  function buildOrca() {
    var R0 = 0.118;
    var prof = makeProfile(
      [0.00, 0.015, 0.04, 0.08, 0.14, 0.22, 0.30, 0.38, 0.46, 0.55, 0.64, 0.73, 0.82, 0.90, 0.96, 1.00],
      [0.00, 0.30, 0.50, 0.68, 0.85, 0.97, 1.00, 0.98, 0.92, 0.80, 0.64, 0.48, 0.34, 0.24, 0.19, 0.16]
    );
    function R(s) { return Math.max(0, prof(s)) * R0; }

    var pos = [], part = [], idx = [];
    var NS = 84, NV = 26;

    // body
    for (var i = 0; i <= NS; i++) {
      var s = i / NS, x = 0.5 - s, r = R(s);
      for (var j = 0; j < NV; j++) {
        var a = j / NV * TAU;
        var y = r * Math.sin(a) * (Math.sin(a) < 0 ? 0.90 : 1.0);
        var z = r * Math.cos(a) * 0.97;
        pos.push(x, y, z); part.push(0);
      }
    }
    for (var i2 = 0; i2 < NS; i2++) for (var j2 = 0; j2 < NV; j2++) {
      var a0 = i2 * NV + j2, a1 = i2 * NV + (j2 + 1) % NV, b0 = (i2 + 1) * NV + j2, b1 = (i2 + 1) * NV + (j2 + 1) % NV;
      idx.push(a0, a1, b0, a1, b1, b0);
    }
    var bodyIdxCount = idx.length;
    var bodyVertCount = pos.length / 3;
    var nrm = Array.prototype.slice.call(smoothNormals(pos, idx));   // body normals now, fins appended below

    // helper to add a fin surface as a (u × v) grid
    function addGrid(nu, nv, fn, partId, normalHint) {
      var base = pos.length / 3;
      for (var u = 0; u <= nu; u++) for (var v = 0; v <= nv; v++) {
        var p = fn(u / nu, v / nv);
        pos.push(p[0], p[1], p[2]); part.push(partId); nrm.push(normalHint[0], normalHint[1], normalHint[2]);
      }
      for (var u2 = 0; u2 < nu; u2++) for (var v2 = 0; v2 < nv; v2++) {
        var q00 = base + u2 * (nv + 1) + v2, q01 = q00 + 1, q10 = q00 + (nv + 1), q11 = q10 + 1;
        idx.push(q00, q10, q01, q01, q10, q11);
      }
    }
    function fixNormals(startVert) {
      // recompute smooth normals for the fin region only (indices from finStartIdx)
      var sub = [];
      for (var k = finStartIdx; k < idx.length; k++) sub.push(idx[k]);
      var arr = new Float32Array(pos);
      var tmp = smoothNormals(arr, sub);
      for (var v = startVert * 3; v < tmp.length; v++) nrm[v] = tmp[v];
    }
    var finStartIdx = idx.length;

    // dorsal fin: swept-back blade standing on the back around s = 0.33–0.47
    var yTop = R(0.40), H = 0.185;
    addGrid(8, 1, function (t, side) {
      var xl = 0.17 + (0.048 - 0.17) * Math.pow(t, 1.25);
      var xt = 0.030 + (0.048 - 0.030) * Math.pow(t, 0.80);
      return [lerp(xl, xt, side), yTop - 0.012 + (H + 0.012) * t, 0.0];
    }, 1, [0, 0, 1]);

    // pectoral fins (paddles), left and right
    [-1, 1].forEach(function (sd) {
      addGrid(7, 4, function (t, c) {
        var w = 0.05 * Math.pow(Math.sin(PI * (0.10 + t * 0.80)), 0.85);
        var cx = 0.225 - 0.13 * t + (c - 0.5) * 2.0 * w * 0.55;
        var cy = -0.050 - 0.085 * t - (c - 0.5) * 2.0 * w * 0.10;
        var cz = sd * (0.070 + 0.115 * t) + sd * (c - 0.5) * 0.0;
        return [cx, cy, cz];
      }, 2, [0, sd, 0]);
    });

    // tail flukes, left and right lobes
    [-1, 1].forEach(function (sd) {
      addGrid(9, 4, function (t, c) {
        var le = -0.462 - 0.140 * t;
        var w = 0.085 * Math.pow(1 - Math.pow(t, 1.6), 0.9) + 0.004;
        var x = lerp(le, le - w, c);
        var y = 0.010 * t;
        var z = sd * (0.012 + 0.148 * t);
        return [x, y, z];
      }, 3, [0, 1, 0]);
    });
    fixNormals(bodyVertCount);

    return {
      pos: new Float32Array(pos),
      nrm: new Float32Array(nrm),
      part: new Float32Array(part),
      idx: new Uint16Array(idx),
      bodyIdxCount: bodyIdxCount
    };
  }

  function buildFish() {
    var pos = [], nrm = [], idx = [];
    var prof = [[0.50, 0.000], [0.43, 0.052], [0.30, 0.094], [0.10, 0.108], [-0.10, 0.088], [-0.28, 0.052], [-0.42, 0.024]];
    var R = 6, i, j;
    for (i = 0; i < prof.length; i++) for (j = 0; j < R; j++) {
      var a = j / R * TAU, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(prof[i][0], prof[i][1] * ca * 0.74, prof[i][1] * sa * 0.88);
      var nl = Math.sqrt(ca * ca + sa * sa) || 1;
      nrm.push(0, ca / nl, sa / nl);
    }
    for (i = 0; i < prof.length - 1; i++) for (j = 0; j < R; j++) {
      var a0 = i * R + j, a1 = i * R + (j + 1) % R, b0 = (i + 1) * R + j, b1 = (i + 1) * R + (j + 1) % R;
      idx.push(a0, b0, a1, a1, b0, b1);
    }
    function tri(p0, p1, p2, n) {
      var b = pos.length / 3;
      [p0, p1, p2].forEach(function (p) { pos.push(p[0], p[1], p[2]); nrm.push(n[0], n[1], n[2]); });
      idx.push(b, b + 1, b + 2);
    }
    // forked tail fin, dorsal fin
    tri([-0.40, 0, 0], [-0.74, 0.19, 0], [-0.62, 0, 0], [0, 0, 1]);
    tri([-0.40, 0, 0], [-0.62, 0, 0], [-0.74, -0.19, 0], [0, 0, 1]);
    tri([0.10, 0.075, 0], [-0.12, 0.070, 0], [-0.03, 0.190, 0], [0, 0, 1]);
    // horizontal tail lobes + pectoral fins so the fish still read as fish from above
    tri([-0.40, 0, 0], [-0.74, 0, 0.17], [-0.62, 0, 0], [0, 1, 0]);
    tri([-0.40, 0, 0], [-0.62, 0, 0], [-0.74, 0, -0.17], [0, 1, 0]);
    tri([0.17, -0.03, 0.06], [0.02, -0.04, 0.24], [-0.01, -0.03, 0.07], [0, 1, 0]);
    tri([0.17, -0.03, -0.06], [-0.01, -0.03, -0.07], [0.02, -0.04, -0.24], [0, 1, 0]);
    return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), idx: new Uint16Array(idx) };
  }

  function buildGrid(nx, nz) {
    var g = new Float32Array((nx + 1) * (nz + 1) * 2), k = 0, i, j;
    for (j = 0; j <= nz; j++) for (i = 0; i <= nx; i++) { g[k++] = i / nx * 2 - 1; g[k++] = j / nz * 2 - 1; }
    var idx = new Uint32Array(nx * nz * 6), m = 0;
    for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
      var a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx[m++] = a; idx[m++] = c; idx[m++] = b; idx[m++] = b; idx[m++] = c; idx[m++] = d;
    }
    return { g: g, idx: idx };
  }

  // ──────────────────────────────────────────────────────── world state ──
  var PLANE_T = -9.5;   // terrain reference plane (pointer ripples)
  var PLANE_W = -3.0;   // swimming plane (orca / fish / plankton interaction)

  var st = {
    time: 0, last: 0, frame: 0, running: false, raf: 0, still: false,
    w: 1, h: 1, aspect: 1, dpr: 1, quality: 1, slow: 0, mobile: false,
    scroll: 0, scrollSmooth: 0
  };
  var ptr = { nx: 0, ny: 0, sx: 0, sy: 0, power: 0, lastMove: -10, inside: true, lastRipX: -999, lastRipY: -999, lastRipT: 0, has: false };
  var cam = { eye: [0, 21, 24], tgt: [0, -8, -16], fov: 0.8, aspect: 1, fwd: [0, 0, -1], right: [1, 0, 0], up: [0, 1, 0], px: 0, py: 0 };
  var mView = new Float32Array(16), mProj = new Float32Array(16), mVP = new Float32Array(16);
  var ptrT = [0, PLANE_T, -20], ptrW = [0, PLANE_W, -20];

  var ripples = new Float32Array(40), ripHead = 0;   // x, z, t0, amp
  var bursts = new Float32Array(16), burstHead = 0;  // x, y, z, t0

  var fish = { n: 0, p: null, v: null, inst: null, misc: null, buf: null, vao: null, count: 0 };
  var orca = { p: [-10, PLANE_W, -14], yaw: 0.2, speed: 3.0, pitch: 0, roll: 0, phase: 0, amp: 0.05, surge: 0, scale: 14, turn: 0 };
  var geo = {};

  function addRipple(x, z, amp) {
    var o = ripHead * 4;
    ripples[o] = x; ripples[o + 1] = z; ripples[o + 2] = st.time; ripples[o + 3] = amp;
    ripHead = (ripHead + 1) % 10;
  }
  function addBurst(x, y, z) {
    var o = burstHead * 4;
    bursts[o] = x; bursts[o + 1] = y; bursts[o + 2] = z; bursts[o + 3] = st.time;
    burstHead = (burstHead + 1) % 4;
  }

  function rayToPlane(nx, ny, planeY, out) {
    var th = Math.tan(cam.fov / 2);
    var dx = cam.fwd[0] + cam.right[0] * nx * th * cam.aspect + cam.up[0] * ny * th;
    var dy = cam.fwd[1] + cam.right[1] * nx * th * cam.aspect + cam.up[1] * ny * th;
    var dz = cam.fwd[2] + cam.right[2] * nx * th * cam.aspect + cam.up[2] * ny * th;
    var t = dy < -0.02 ? (planeY - cam.eye[1]) / dy : 160;
    t = Math.min(t, 160);
    out[0] = cam.eye[0] + dx * t; out[1] = planeY; out[2] = cam.eye[2] + dz * t;
  }

  // ─────────────────────────────────────────────────── initialisation ──
  function initFish() {
    var n = st.mobile ? 30 : 64;
    fish.n = n; fish.p = new Float32Array(n * 3); fish.v = new Float32Array(n * 3);
    fish.misc = new Float32Array(n * 4); fish.inst = new Float32Array(n * 10);
    for (var i = 0; i < n; i++) {
      fish.p[i * 3] = (Math.random() - 0.5) * 60;
      fish.p[i * 3 + 1] = -5 + Math.random() * 6;
      fish.p[i * 3 + 2] = -34 + Math.random() * 34;
      var a = Math.random() * TAU;
      fish.v[i * 3] = Math.cos(a) * 4.5; fish.v[i * 3 + 1] = 0; fish.v[i * 3 + 2] = Math.sin(a) * 4.5;
      fish.misc[i * 4] = Math.random() * TAU;                      // phase
      fish.misc[i * 4 + 1] = (st.mobile ? 1.9 : 2.3) + Math.random() * 1.1;   // scale
      fish.misc[i * 4 + 2] = Math.random();                        // hue
      fish.misc[i * 4 + 3] = Math.random();                        // speed feel
    }
  }

  function setup() {
    var quad = { aPos: 0 };

    progs.bg = program(BG_VS, BG_FS, ['uTime', 'uRes', 'uPtr', 'uPtrPow', 'uScroll'], quad);
    progs.ter = program(TER_VS, TER_FS, ['uVP', 'uTime', 'uFlow', 'uPtr', 'uPtrPow', 'uRip', 'uCam', 'uBaseY', 'uContour', 'uAlpha'], { aGrid: 0 });
    progs.par = program(PAR_VS, PAR_FS, ['uVP', 'uTime', 'uScroll', 'uPtr', 'uPtrPow', 'uBurst', 'uPx'], { aSeed: 0 });
    progs.fish = program(FISH_VS, FISH_FS, ['uVP', 'uTime', 'uCam', 'uAlpha'], { aPos: 0, aNrm: 1, iPos: 2, iDir: 3, iMisc: 4 });
    progs.orca = program(ORCA_VS, ORCA_FS, ['uVP', 'uModel', 'uPhase', 'uAmp', 'uCam', 'uAlpha'], { aPos: 0, aNrm: 1, aPart: 2 });

    // fullscreen triangle
    geo.bgVao = gl.createVertexArray(); gl.bindVertexArray(geo.bgVao);
    attrib(0, buffer(new Float32Array([-1, -1, 3, -1, -1, 3])), 2);

    // terrain
    var g = st.mobile ? buildGrid(150, 104) : buildGrid(230, 160);
    geo.terVao = gl.createVertexArray(); gl.bindVertexArray(geo.terVao);
    attrib(0, buffer(g.g), 2);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.idx, gl.STATIC_DRAW);
    geo.terCount = g.idx.length;

    // particles
    var pc = st.mobile ? 220 : 420, seeds = new Float32Array(pc * 4);
    for (var i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    geo.parVao = gl.createVertexArray(); gl.bindVertexArray(geo.parVao);
    attrib(0, buffer(seeds), 4);
    geo.parCount = pc;

    // fish
    var fg = buildFish();
    initFish();
    geo.fishVao = gl.createVertexArray(); gl.bindVertexArray(geo.fishVao);
    attrib(0, buffer(fg.pos), 3);
    attrib(1, buffer(fg.nrm), 3);
    fish.buf = buffer(fish.inst, gl.DYNAMIC_DRAW);
    attrib(2, fish.buf, 3, 40, 0, 1);
    attrib(3, fish.buf, 3, 40, 12, 1);
    attrib(4, fish.buf, 4, 40, 24, 1);
    var fib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, fg.idx, gl.STATIC_DRAW);
    geo.fishCount = fg.idx.length;

    // orca
    var og = buildOrca();
    geo.orcaVao = gl.createVertexArray(); gl.bindVertexArray(geo.orcaVao);
    attrib(0, buffer(og.pos), 3);
    attrib(1, buffer(og.nrm), 3);
    attrib(2, buffer(og.part), 1);
    var oib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, og.idx, gl.STATIC_DRAW);
    geo.orcaTotal = og.idx.length; geo.orcaBody = og.bodyIdxCount;

    gl.bindVertexArray(null);
  }

  // ─────────────────────────────────────────────────────── simulation ──
  function updateFish(dt) {
    var n = fish.n, p = fish.p, v = fish.v, t = st.time;
    var tx = 24 * Math.sin(t * 0.11), tz = -18 + 14 * Math.cos(t * 0.083), ty = -2 + 2 * Math.sin(t * 0.17);
    var ox = orca.p[0], oy = orca.p[1], oz = orca.p[2];
    var ofx = Math.cos(orca.yaw), ofz = -Math.sin(orca.yaw);
    var nx = ox + ofx * orca.scale * 0.4, nz = oz + ofz * orca.scale * 0.4;      // orca nose
    var pw = ptr.power;
    var R2 = 49, S2 = 2.6 * 2.6;

    for (var i = 0; i < n; i++) {
      var i3 = i * 3, px = p[i3], py = p[i3 + 1], pz = p[i3 + 2];
      var vx = v[i3], vy = v[i3 + 1], vz = v[i3 + 2];
      var sx = 0, sy = 0, sz = 0, ax = 0, ay = 0, az = 0, cx = 0, cy = 0, cz = 0, cnt = 0;
      for (var j = 0; j < n; j++) {
        if (j === i) continue;
        var j3 = j * 3, dx = p[j3] - px, dy = p[j3 + 1] - py, dz = p[j3 + 2] - pz;
        var d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < R2) {
          cnt++; cx += dx; cy += dy; cz += dz; ax += v[j3]; ay += v[j3 + 1]; az += v[j3 + 2];
          if (d2 < S2) { var inv = 1 / (d2 + 0.05); sx -= dx * inv; sy -= dy * inv; sz -= dz * inv; }
        }
      }
      var fx = sx * 5.0, fy = sy * 5.0, fz = sz * 5.0;
      if (cnt) {
        fx += (ax / cnt - vx) * 0.9 + cx / cnt * 0.55;
        fy += (ay / cnt - vy) * 0.9 + cy / cnt * 0.55;
        fz += (az / cnt - vz) * 0.9 + cz / cnt * 0.55;
      }
      // wander toward a slowly moving school target
      fx += (tx - px) * 0.05; fy += (ty - py) * 0.10; fz += (tz - pz) * 0.05;
      // flee the pointer
      if (pw > 0.02) {
        var qx = px - ptrW[0], qz = pz - ptrW[2], qd = Math.sqrt(qx * qx + qz * qz);
        if (qd < 13) { var qf = (1 - qd / 13); qf = qf * qf * 46 * pw / (qd + 0.3); fx += qx * qf; fz += qz * qf; fy += (py - PLANE_W) * 0.0 + qf * 0.4; }
      }
      // keep clear of the orca
      var rx = px - ox, rz = pz - oz, rd = Math.sqrt(rx * rx + rz * rz);
      if (rd < 11) { var rf = (1 - rd / 11); rf = rf * rf * 24 / (rd + 0.3); fx += rx * rf; fz += rz * rf; }
      var mx = px - nx, mz = pz - nz, md = Math.sqrt(mx * mx + mz * mz);
      if (md < 9) { var mf = (1 - md / 9); mf = mf * mf * 36 / (md + 0.3); fx += mx * mf; fz += mz * mf; }
      // soft bounds
      if (px > 42) fx -= (px - 42) * 1.2; else if (px < -42) fx -= (px + 42) * 1.2;
      if (pz > 3) fz -= (pz - 3) * 1.2; else if (pz < -44) fz -= (pz + 44) * 1.2;
      if (py > 3) fy -= (py - 3) * 1.5; else if (py < -7) fy -= (py + 7) * 1.5;

      vx += fx * dt; vy += fy * dt; vz += fz * dt;
      var sp = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      var target = clamp(sp, 3.2, 9.5);
      vx *= target / sp; vy *= target / sp; vz *= target / sp;
      vy *= 0.985;
      p[i3] = px + vx * dt; p[i3 + 1] = py + vy * dt; p[i3 + 2] = pz + vz * dt;
      v[i3] = vx; v[i3 + 1] = vy; v[i3 + 2] = vz;

      var o = i * 10, l = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      fish.inst[o] = p[i3]; fish.inst[o + 1] = p[i3 + 1]; fish.inst[o + 2] = p[i3 + 2];
      fish.inst[o + 3] = vx / l; fish.inst[o + 4] = vy / l * 0.6; fish.inst[o + 5] = vz / l;
      fish.inst[o + 6] = fish.misc[i * 4]; fish.inst[o + 7] = fish.misc[i * 4 + 1];
      fish.inst[o + 8] = fish.misc[i * 4 + 2]; fish.inst[o + 9] = fish.misc[i * 4 + 3];
    }
  }

  function scatterFish(x, z) {
    var p = fish.p, v = fish.v;
    for (var i = 0; i < fish.n; i++) {
      var dx = p[i * 3] - x, dz = p[i * 3 + 2] - z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < 26) {
        var k = (1 - d / 26) * 16 / (d + 0.5);
        v[i * 3] += dx * k; v[i * 3 + 2] += dz * k; v[i * 3 + 1] += (Math.random() - 0.3) * 3 * (1 - d / 26);
      }
    }
  }

  function updateOrca(dt) {
    var t = st.time, o = orca;
    var tx = 24 * Math.sin(t * 0.058), tz = -16 + 13 * Math.sin(t * 0.041 + 1.7);
    var curious = ptr.power * (ptr.has ? 1 : 0);
    if (curious > 0.05) {
      var cxp = clamp(ptrW[0], -38, 38), czp = clamp(ptrW[2], -38, 2);
      tx = lerp(tx, cxp, 0.85 * curious); tz = lerp(tz, czp, 0.85 * curious);
    }
    if (o.p[0] > 40 || o.p[0] < -40 || o.p[2] < -40 || o.p[2] > 3) { tx = 0; tz = -16; }
    var dx = tx - o.p[0], dz = tz - o.p[2], dist = Math.sqrt(dx * dx + dz * dz);
    var want = Math.atan2(-dz, dx);
    if (curious > 0.2 && dist < 11) want += 1.15 * (dist < 6 ? 1.3 : 1);   // circle the cursor
    var diff = angDiff(want, o.yaw);
    var maxTurn = (0.5 + o.surge * 0.5) * dt;
    var step = clamp(diff, -maxTurn, maxTurn);
    o.yaw += step;
    o.turn += ((step / Math.max(dt, 1e-4)) - o.turn) * Math.min(1, dt * 3);
    var speed = 3.0 + o.surge * 5.5 + curious * 0.8;
    o.speed += (speed - o.speed) * Math.min(1, dt * 1.5);
    o.p[0] += Math.cos(o.yaw) * o.speed * dt;
    o.p[2] += -Math.sin(o.yaw) * o.speed * dt;
    o.p[1] = PLANE_W + 0.9 * Math.sin(t * 0.33);
    o.pitch += (0.06 * Math.cos(t * 0.33) - o.pitch) * Math.min(1, dt * 2);
    o.roll += (clamp(-o.turn * 0.9, -0.55, 0.55) - o.roll) * Math.min(1, dt * 2.5);
    o.phase += dt * (4.2 + o.speed * 0.85);
    o.amp = 0.045 + 0.010 * o.speed;
    o.surge = Math.max(0, o.surge - dt * 0.55);
  }

  function shock(cx, cy, k) {
    var nx = cx / win.innerWidth * 2 - 1, ny = -(cy / win.innerHeight * 2 - 1);
    var a = [0, 0, 0], b = [0, 0, 0];
    rayToPlane(nx, ny, PLANE_T, a); rayToPlane(nx, ny, PLANE_W, b);
    addRipple(a[0], a[2], 1.9 * k);
    addBurst(b[0], b[1], b[2]);
    scatterFish(b[0], b[2]);
    orca.surge = 1;
  }

  function update(dt) {
    st.time += dt;
    var t = st.time;

    var idle = t - ptr.lastMove;
    var target = (ptr.has && idle < 2.6) ? 1 : 0;
    ptr.power += (target - ptr.power) * (1 - Math.exp(-dt * (target ? 8 : 1.6)));
    var k = 1 - Math.exp(-dt * 7);
    ptr.sx += (ptr.nx - ptr.sx) * k; ptr.sy += (ptr.ny - ptr.sy) * k;

    st.scrollSmooth += (st.scroll - st.scrollSmooth) * (1 - Math.exp(-dt * 4.5));
    var dive = clamp(st.scrollSmooth / 1600, 0, 1);

    var kk = 1 - Math.exp(-dt * 3);
    cam.px += (ptr.sx * 2.6 - cam.px) * kk; cam.py += (ptr.sy * 1.3 - cam.py) * kk;
    cam.eye[0] = cam.px; cam.eye[1] = 21 + cam.py - dive * 4.5; cam.eye[2] = 24 - dive * 8;
    cam.tgt[0] = cam.px * 0.35; cam.tgt[1] = -8 + cam.py * 0.2; cam.tgt[2] = -16;
    var axes = lookAt(mView, cam.eye, cam.tgt);
    cam.fwd = axes.fwd; cam.right = axes.right; cam.up = axes.up;
    mul(mVP, mProj, mView);

    rayToPlane(ptr.sx, ptr.sy, PLANE_T, ptrT);
    rayToPlane(ptr.sx, ptr.sy, PLANE_W, ptrW);

    updateOrca(dt);
    updateFish(dt);
  }

  // ─────────────────────────────────────────────────────────── render ──
  var modelM = new Float32Array(16);

  function render() {
    var w = canvas.width, h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.97, 0.99, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var pw = ptr.power * (st.still ? 0 : 1);

    // 1 · water light
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    var P = progs.bg; gl.useProgram(P.p);
    gl.uniform1f(P.u.uTime, st.time); gl.uniform2f(P.u.uRes, w, h);
    gl.uniform2f(P.u.uPtr, ptr.sx * 0.5 + 0.5, ptr.sy * 0.5 + 0.5); gl.uniform1f(P.u.uPtrPow, pw);
    gl.uniform1f(P.u.uScroll, st.scrollSmooth);
    gl.bindVertexArray(geo.bgVao); gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2 · bathymetric terrain
    P = progs.ter; gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uVP, false, mVP);
    gl.uniform1f(P.u.uTime, st.time); gl.uniform1f(P.u.uFlow, st.scrollSmooth * 0.03);
    gl.uniform3f(P.u.uPtr, ptrT[0], ptrT[1], ptrT[2]); gl.uniform1f(P.u.uPtrPow, pw);
    gl.uniform4fv(P.u.uRip, ripples);
    gl.uniform3f(P.u.uCam, cam.eye[0], cam.eye[1], cam.eye[2]);
    gl.uniform1f(P.u.uBaseY, PLANE_T); gl.uniform1f(P.u.uContour, 1.15); gl.uniform1f(P.u.uAlpha, 1.0);
    gl.bindVertexArray(geo.terVao); gl.drawElements(gl.TRIANGLES, geo.terCount, gl.UNSIGNED_INT, 0);

    // 3 · orca (writes depth so its own fins sort correctly)
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    P = progs.orca; gl.useProgram(P.p);
    var rot = mul3(mul3(rotY(orca.yaw), rotZ(orca.pitch)), rotX(orca.roll)), s = orca.scale;
    modelM[0] = rot[0] * s; modelM[1] = rot[1] * s; modelM[2] = rot[2] * s; modelM[3] = 0;
    modelM[4] = rot[3] * s; modelM[5] = rot[4] * s; modelM[6] = rot[5] * s; modelM[7] = 0;
    modelM[8] = rot[6] * s; modelM[9] = rot[7] * s; modelM[10] = rot[8] * s; modelM[11] = 0;
    modelM[12] = orca.p[0]; modelM[13] = orca.p[1]; modelM[14] = orca.p[2]; modelM[15] = 1;
    gl.uniformMatrix4fv(P.u.uVP, false, mVP); gl.uniformMatrix4fv(P.u.uModel, false, modelM);
    gl.uniform1f(P.u.uPhase, orca.phase); gl.uniform1f(P.u.uAmp, orca.amp);
    gl.uniform3f(P.u.uCam, cam.eye[0], cam.eye[1], cam.eye[2]); gl.uniform1f(P.u.uAlpha, 1.0);
    gl.bindVertexArray(geo.orcaVao);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.drawElements(gl.TRIANGLES, geo.orcaBody, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.CULL_FACE);
    gl.drawElements(gl.TRIANGLES, geo.orcaTotal - geo.orcaBody, gl.UNSIGNED_SHORT, geo.orcaBody * 2);

    // 4 · fish school
    gl.depthMask(false);
    P = progs.fish; gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uVP, false, mVP); gl.uniform1f(P.u.uTime, st.time);
    gl.uniform3f(P.u.uCam, cam.eye[0], cam.eye[1], cam.eye[2]); gl.uniform1f(P.u.uAlpha, 1.0);
    gl.bindVertexArray(geo.fishVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, fish.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, fish.inst);
    gl.drawElementsInstanced(gl.TRIANGLES, geo.fishCount, gl.UNSIGNED_SHORT, 0, fish.n);

    // 5 · plankton
    P = progs.par; gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uVP, false, mVP); gl.uniform1f(P.u.uTime, st.time);
    gl.uniform1f(P.u.uScroll, st.scrollSmooth);
    gl.uniform3f(P.u.uPtr, ptrW[0], ptrW[1], ptrW[2]); gl.uniform1f(P.u.uPtrPow, pw);
    gl.uniform4fv(P.u.uBurst, bursts);
    gl.uniform1f(P.u.uPx, h / (2 * Math.tan(cam.fov / 2)));
    gl.bindVertexArray(geo.parVao);
    gl.drawArrays(gl.POINTS, 0, st.slow > 1 ? (geo.parCount >> 1) : geo.parCount);
    gl.bindVertexArray(null);
    gl.depthMask(true);
  }

  // ──────────────────────────────────────────────────── sizing & loop ──
  function resize() {
    if (!canvas) return;
    st.mobile = win.innerWidth < 760;
    var dpr = Math.min(win.devicePixelRatio || 1, st.mobile ? 1.5 : 2) * st.quality;
    var w = Math.max(2, Math.round(win.innerWidth * dpr)), h = Math.max(2, Math.round(win.innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    st.w = w; st.h = h; st.aspect = w / h;
    cam.aspect = st.aspect;
    // keep the same horizontal coverage on tall / narrow screens
    var base = 0.80;
    cam.fov = st.aspect >= 1 ? base : 2 * Math.atan(Math.tan(base / 2) / Math.max(st.aspect, 0.45) * 0.78);
    orca.scale = st.aspect >= 1 ? 14 : 10;
    perspective(mProj, cam.fov, st.aspect, 0.5, 260);
    mul(mVP, mProj, mView);
    if (!st.running) drawStill();
  }

  function frame(now) {
    st.raf = win.requestAnimationFrame(frame);
    var dt = Math.min(0.05, Math.max(0.001, (now - st.last) / 1000));
    if (!st.last) dt = 0.016;
    st.last = now;
    update(dt);
    render();
    // adaptive resolution: if the GPU can't keep up, render fewer pixels (and fewer plankton)
    st.frame++;
    st.avg = (st.avg || 16) * 0.95 + (dt * 1000) * 0.05;
    if (st.frame > 90 && st.avg > 27 && st.slow < 3) {
      st.slow++; st.frame = 0; st.avg = 16;
      st.quality = st.slow === 1 ? 0.75 : st.slow === 2 ? 0.6 : 0.5;
      resize();
    }
  }

  function drawStill() {
    if (!ready || !api.enabled) return;
    update(0.016);
    render();
  }

  function start() {
    if (st.running || !ready || !api.enabled) return;
    if (st.still) { drawStill(); return; }
    st.running = true; st.last = 0;
    st.raf = win.requestAnimationFrame(frame);
  }
  function stop() {
    st.running = false;
    if (st.raf) win.cancelAnimationFrame(st.raf);
    st.raf = 0;
  }

  // ───────────────────────────────────────────────────────── controls ──
  var toggleBtn = null;
  var ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg>';

  function paintToggle() {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-pressed', api.enabled ? 'true' : 'false');
    toggleBtn.title = api.enabled ? 'Ambient 3D ocean: on (click to turn off)' : 'Ambient 3D ocean: off (click to turn on)';
    toggleBtn.classList.toggle('is-off', !api.enabled);
  }

  function setEnabled(on) {
    api.enabled = !!on;
    lsSet(on ? 'on' : 'off');
    if (canvas) canvas.style.display = on ? 'block' : 'none';
    if (on) { resize(); start(); } else stop();
    paintToggle();
    try { win.dispatchEvent(new CustomEvent('orca:ambient', { detail: { enabled: api.enabled } })); } catch (e) { /* old browsers */ }
  }

  function bindEvents() {
    win.addEventListener('resize', function () { resize(); }, { passive: true });
    win.addEventListener('scroll', function () { st.scroll = win.pageYOffset || doc.documentElement.scrollTop || 0; }, { passive: true });
    win.addEventListener('pointermove', function (e) {
      if (st.still) return;
      ptr.nx = e.clientX / win.innerWidth * 2 - 1; ptr.ny = -(e.clientY / win.innerHeight * 2 - 1);
      ptr.lastMove = st.time; ptr.has = true;
      var dx = e.clientX - ptr.lastRipX, dy = e.clientY - ptr.lastRipY;
      if (dx * dx + dy * dy > 3600 && st.time - ptr.lastRipT > 0.09) {
        addRipple(ptrT[0], ptrT[2], 0.55);
        ptr.lastRipX = e.clientX; ptr.lastRipY = e.clientY; ptr.lastRipT = st.time;
      }
    }, { passive: true });
    win.addEventListener('pointerdown', function (e) {
      if (st.still || !api.enabled) return;
      ptr.nx = e.clientX / win.innerWidth * 2 - 1; ptr.ny = -(e.clientY / win.innerHeight * 2 - 1);
      ptr.sx = ptr.nx; ptr.sy = ptr.ny; ptr.lastMove = st.time; ptr.has = true;
      shock(e.clientX, e.clientY, 1);
    }, { passive: true });
    doc.documentElement.addEventListener('mouseleave', function () { ptr.lastMove = -10; }, { passive: true });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) stop(); else start(); });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); ready = false; stop(); }, false);
    canvas.addEventListener('webglcontextrestored', function () { try { setup(); ready = true; resize(); start(); } catch (err) { /* give up quietly */ } }, false);
    if (reduceMQ && reduceMQ.addEventListener) reduceMQ.addEventListener('change', function () {
      st.still = prefersReduced(); stop(); start(); if (st.still) drawStill();
    });
  }

  function buildToggle() {
    toggleBtn = doc.createElement('button');
    toggleBtn.id = 'orca-bg-toggle'; toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Toggle ambient 3D ocean background');
    toggleBtn.innerHTML = ICON_ON;
    toggleBtn.addEventListener('click', function (e) { e.stopPropagation(); api.toggle(); });
    // the global pointerdown shock-wave shouldn't fire for the toggle itself
    toggleBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    doc.body.appendChild(toggleBtn);
    paintToggle();
  }

  function init() {
    canvas = doc.createElement('canvas');
    canvas.id = 'orca-bg'; canvas.setAttribute('aria-hidden', 'true');
    try {
      gl = canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
    } catch (e) { gl = null; }
    if (!gl) { canvas = null; return; }               // no WebGL2: the CSS gradient stays as the backdrop

    st.still = prefersReduced();
    doc.body.insertBefore(canvas, doc.body.firstChild);
    try { setup(); } catch (err) {
      if (win.console) console.warn(err);
      canvas.remove(); canvas = null; return;
    }
    ready = true; api.supported = true;
    buildToggle();
    bindEvents();
    st.scroll = win.pageYOffset || 0; st.scrollSmooth = st.scroll;
    // seed the sim so the first frame already looks alive
    for (var i = 0; i < 40; i++) { st.time += 0.05; updateOrca(0.05); updateFish(0.05); }
    resize();
    if (!api.enabled) { canvas.style.display = 'none'; paintToggle(); return; }
    start();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
