(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/ogl/src/math/functions/Vec3Func.js
  function length(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function set(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function multiply(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }
  function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }
  function distance(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function squaredDistance(a, b) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return x * x + y * y + z * z;
  }
  function squaredLength(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return x * x + y * y + z * z;
  }
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  function inverse(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    return out;
  }
  function normalize(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(out, a, b) {
    let ax = a[0], ay = a[1], az = a[2];
    let bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function lerp(out, a, b, t) {
    let ax = a[0];
    let ay = a[1];
    let az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }
  function smoothLerp(out, a, b, decay, dt) {
    const exp = Math.exp(-decay * dt);
    let ax = a[0];
    let ay = a[1];
    let az = a[2];
    out[0] = b[0] + (ax - b[0]) * exp;
    out[1] = b[1] + (ay - b[1]) * exp;
    out[2] = b[2] + (az - b[2]) * exp;
    return out;
  }
  function transformMat4(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  function scaleRotateMat4(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z) / w;
    return out;
  }
  function transformMat3(out, a, m) {
    let x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }
  function transformQuat(out, a, q) {
    let x = a[0], y = a[1], z = a[2];
    let qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    let uvx = qy * z - qz * y;
    let uvy = qz * x - qx * z;
    let uvz = qx * y - qy * x;
    let uuvx = qy * uvz - qz * uvy;
    let uuvy = qz * uvx - qx * uvz;
    let uuvz = qx * uvy - qy * uvx;
    let w2 = qw * 2;
    uvx *= w2;
    uvy *= w2;
    uvz *= w2;
    uuvx *= 2;
    uuvy *= 2;
    uuvz *= 2;
    out[0] = x + uvx + uuvx;
    out[1] = y + uvy + uuvy;
    out[2] = z + uvz + uuvz;
    return out;
  }
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  var angle;
  var init_Vec3Func = __esm({
    "node_modules/ogl/src/math/functions/Vec3Func.js"() {
      angle = /* @__PURE__ */ (function() {
        const tempA = [0, 0, 0];
        const tempB = [0, 0, 0];
        return function(a, b) {
          copy(tempA, a);
          copy(tempB, b);
          normalize(tempA, tempA);
          normalize(tempB, tempB);
          let cosine = dot(tempA, tempB);
          if (cosine > 1) {
            return 0;
          } else if (cosine < -1) {
            return Math.PI;
          } else {
            return Math.acos(cosine);
          }
        };
      })();
    }
  });

  // node_modules/ogl/src/math/Vec3.js
  var Vec3;
  var init_Vec3 = __esm({
    "node_modules/ogl/src/math/Vec3.js"() {
      init_Vec3Func();
      Vec3 = class _Vec3 extends Array {
        constructor(x = 0, y = x, z = x) {
          super(x, y, z);
          return this;
        }
        get x() {
          return this[0];
        }
        get y() {
          return this[1];
        }
        get z() {
          return this[2];
        }
        set x(v) {
          this[0] = v;
        }
        set y(v) {
          this[1] = v;
        }
        set z(v) {
          this[2] = v;
        }
        set(x, y = x, z = x) {
          if (x.length) return this.copy(x);
          set(this, x, y, z);
          return this;
        }
        copy(v) {
          copy(this, v);
          return this;
        }
        add(va, vb) {
          if (vb) add(this, va, vb);
          else add(this, this, va);
          return this;
        }
        sub(va, vb) {
          if (vb) subtract(this, va, vb);
          else subtract(this, this, va);
          return this;
        }
        multiply(v) {
          if (v.length) multiply(this, this, v);
          else scale(this, this, v);
          return this;
        }
        divide(v) {
          if (v.length) divide(this, this, v);
          else scale(this, this, 1 / v);
          return this;
        }
        inverse(v = this) {
          inverse(this, v);
          return this;
        }
        // Can't use 'length' as Array.prototype uses it
        len() {
          return length(this);
        }
        distance(v) {
          if (v) return distance(this, v);
          else return length(this);
        }
        squaredLen() {
          return squaredLength(this);
        }
        squaredDistance(v) {
          if (v) return squaredDistance(this, v);
          else return squaredLength(this);
        }
        negate(v = this) {
          negate(this, v);
          return this;
        }
        cross(va, vb) {
          if (vb) cross(this, va, vb);
          else cross(this, this, va);
          return this;
        }
        scale(v) {
          scale(this, this, v);
          return this;
        }
        normalize() {
          normalize(this, this);
          return this;
        }
        dot(v) {
          return dot(this, v);
        }
        equals(v) {
          return exactEquals(this, v);
        }
        applyMatrix3(mat3) {
          transformMat3(this, this, mat3);
          return this;
        }
        applyMatrix4(mat4) {
          transformMat4(this, this, mat4);
          return this;
        }
        scaleRotateMatrix4(mat4) {
          scaleRotateMat4(this, this, mat4);
          return this;
        }
        applyQuaternion(q) {
          transformQuat(this, this, q);
          return this;
        }
        angle(v) {
          return angle(this, v);
        }
        lerp(v, t) {
          lerp(this, this, v, t);
          return this;
        }
        smoothLerp(v, decay, dt) {
          smoothLerp(this, this, v, decay, dt);
          return this;
        }
        clone() {
          return new _Vec3(this[0], this[1], this[2]);
        }
        fromArray(a, o = 0) {
          this[0] = a[o];
          this[1] = a[o + 1];
          this[2] = a[o + 2];
          return this;
        }
        toArray(a = [], o = 0) {
          a[o] = this[0];
          a[o + 1] = this[1];
          a[o + 2] = this[2];
          return a;
        }
        transformDirection(mat4) {
          const x = this[0];
          const y = this[1];
          const z = this[2];
          this[0] = mat4[0] * x + mat4[4] * y + mat4[8] * z;
          this[1] = mat4[1] * x + mat4[5] * y + mat4[9] * z;
          this[2] = mat4[2] * x + mat4[6] * y + mat4[10] * z;
          return this.normalize();
        }
      };
    }
  });

  // node_modules/ogl/src/core/Geometry.js
  var tempVec3, ID, ATTR_ID, isBoundsWarned, Geometry;
  var init_Geometry = __esm({
    "node_modules/ogl/src/core/Geometry.js"() {
      init_Vec3();
      tempVec3 = /* @__PURE__ */ new Vec3();
      ID = 1;
      ATTR_ID = 1;
      isBoundsWarned = false;
      Geometry = class {
        constructor(gl, attributes = {}) {
          if (!gl.canvas) console.error("gl not passed as first argument to Geometry");
          this.gl = gl;
          this.attributes = attributes;
          this.id = ID++;
          this.VAOs = {};
          this.drawRange = { start: 0, count: 0 };
          this.instancedCount = 0;
          this.gl.renderer.bindVertexArray(null);
          this.gl.renderer.currentGeometry = null;
          this.glState = this.gl.renderer.state;
          for (let key in attributes) {
            this.addAttribute(key, attributes[key]);
          }
        }
        addAttribute(key, attr) {
          this.attributes[key] = attr;
          attr.id = ATTR_ID++;
          attr.size = attr.size || 1;
          attr.type = attr.type || (attr.data.constructor === Float32Array ? this.gl.FLOAT : attr.data.constructor === Uint16Array ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_INT);
          attr.target = key === "index" ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
          attr.normalized = attr.normalized || false;
          attr.stride = attr.stride || 0;
          attr.offset = attr.offset || 0;
          attr.count = attr.count || (attr.stride ? attr.data.byteLength / attr.stride : attr.data.length / attr.size);
          attr.divisor = attr.instanced || 0;
          attr.needsUpdate = false;
          attr.usage = attr.usage || this.gl.STATIC_DRAW;
          if (!attr.buffer) {
            this.updateAttribute(attr);
          }
          if (attr.divisor) {
            this.isInstanced = true;
            if (this.instancedCount && this.instancedCount !== attr.count * attr.divisor) {
              console.warn("geometry has multiple instanced buffers of different length");
              return this.instancedCount = Math.min(this.instancedCount, attr.count * attr.divisor);
            }
            this.instancedCount = attr.count * attr.divisor;
          } else if (key === "index") {
            this.drawRange.count = attr.count;
          } else if (!this.attributes.index) {
            this.drawRange.count = Math.max(this.drawRange.count, attr.count);
          }
        }
        updateAttribute(attr) {
          const isNewBuffer = !attr.buffer;
          if (isNewBuffer) attr.buffer = this.gl.createBuffer();
          if (this.glState.boundBuffer !== attr.buffer) {
            this.gl.bindBuffer(attr.target, attr.buffer);
            this.glState.boundBuffer = attr.buffer;
          }
          if (isNewBuffer) {
            this.gl.bufferData(attr.target, attr.data, attr.usage);
          } else {
            this.gl.bufferSubData(attr.target, 0, attr.data);
          }
          attr.needsUpdate = false;
        }
        setIndex(value) {
          this.addAttribute("index", value);
        }
        setDrawRange(start, count) {
          this.drawRange.start = start;
          this.drawRange.count = count;
        }
        setInstancedCount(value) {
          this.instancedCount = value;
        }
        createVAO(program) {
          this.VAOs[program.attributeOrder] = this.gl.renderer.createVertexArray();
          this.gl.renderer.bindVertexArray(this.VAOs[program.attributeOrder]);
          this.bindAttributes(program);
        }
        bindAttributes(program) {
          program.attributeLocations.forEach((location, { name, type }) => {
            if (!this.attributes[name]) {
              console.warn(`active attribute ${name} not being supplied`);
              return;
            }
            const attr = this.attributes[name];
            this.gl.bindBuffer(attr.target, attr.buffer);
            this.glState.boundBuffer = attr.buffer;
            let numLoc = 1;
            if (type === 35674) numLoc = 2;
            if (type === 35675) numLoc = 3;
            if (type === 35676) numLoc = 4;
            const size = attr.size / numLoc;
            const stride = numLoc === 1 ? 0 : numLoc * numLoc * 4;
            const offset = numLoc === 1 ? 0 : numLoc * 4;
            for (let i = 0; i < numLoc; i++) {
              this.gl.vertexAttribPointer(location + i, size, attr.type, attr.normalized, attr.stride + stride, attr.offset + i * offset);
              this.gl.enableVertexAttribArray(location + i);
              this.gl.renderer.vertexAttribDivisor(location + i, attr.divisor);
            }
          });
          if (this.attributes.index) this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.attributes.index.buffer);
        }
        draw({ program, mode = this.gl.TRIANGLES }) {
          if (this.gl.renderer.currentGeometry !== `${this.id}_${program.attributeOrder}`) {
            if (!this.VAOs[program.attributeOrder]) this.createVAO(program);
            this.gl.renderer.bindVertexArray(this.VAOs[program.attributeOrder]);
            this.gl.renderer.currentGeometry = `${this.id}_${program.attributeOrder}`;
          }
          program.attributeLocations.forEach((location, { name }) => {
            const attr = this.attributes[name];
            if (attr.needsUpdate) this.updateAttribute(attr);
          });
          let indexBytesPerElement = 2;
          if (this.attributes.index?.type === this.gl.UNSIGNED_INT) indexBytesPerElement = 4;
          if (this.isInstanced) {
            if (this.attributes.index) {
              this.gl.renderer.drawElementsInstanced(
                mode,
                this.drawRange.count,
                this.attributes.index.type,
                this.attributes.index.offset + this.drawRange.start * indexBytesPerElement,
                this.instancedCount
              );
            } else {
              this.gl.renderer.drawArraysInstanced(mode, this.drawRange.start, this.drawRange.count, this.instancedCount);
            }
          } else {
            if (this.attributes.index) {
              this.gl.drawElements(
                mode,
                this.drawRange.count,
                this.attributes.index.type,
                this.attributes.index.offset + this.drawRange.start * indexBytesPerElement
              );
            } else {
              this.gl.drawArrays(mode, this.drawRange.start, this.drawRange.count);
            }
          }
        }
        getPosition() {
          const attr = this.attributes.position;
          if (attr.data) return attr;
          if (isBoundsWarned) return;
          console.warn("No position buffer data found to compute bounds");
          return isBoundsWarned = true;
        }
        computeBoundingBox(attr) {
          if (!attr) attr = this.getPosition();
          const array = attr.data;
          const stride = attr.size;
          if (!this.bounds) {
            this.bounds = {
              min: new Vec3(),
              max: new Vec3(),
              center: new Vec3(),
              scale: new Vec3(),
              radius: Infinity
            };
          }
          const min = this.bounds.min;
          const max = this.bounds.max;
          const center = this.bounds.center;
          const scale6 = this.bounds.scale;
          min.set(Infinity);
          max.set(-Infinity);
          for (let i = 0, l = array.length; i < l; i += stride) {
            const x = array[i];
            const y = array[i + 1];
            const z = array[i + 2];
            min.x = Math.min(x, min.x);
            min.y = Math.min(y, min.y);
            min.z = Math.min(z, min.z);
            max.x = Math.max(x, max.x);
            max.y = Math.max(y, max.y);
            max.z = Math.max(z, max.z);
          }
          scale6.sub(max, min);
          center.add(min, max).divide(2);
        }
        computeBoundingSphere(attr) {
          if (!attr) attr = this.getPosition();
          const array = attr.data;
          const stride = attr.size;
          if (!this.bounds) this.computeBoundingBox(attr);
          let maxRadiusSq = 0;
          for (let i = 0, l = array.length; i < l; i += stride) {
            tempVec3.fromArray(array, i);
            maxRadiusSq = Math.max(maxRadiusSq, this.bounds.center.squaredDistance(tempVec3));
          }
          this.bounds.radius = Math.sqrt(maxRadiusSq);
        }
        remove() {
          for (let key in this.VAOs) {
            this.gl.renderer.deleteVertexArray(this.VAOs[key]);
            delete this.VAOs[key];
          }
          for (let key in this.attributes) {
            this.gl.deleteBuffer(this.attributes[key].buffer);
            delete this.attributes[key];
          }
        }
      };
    }
  });

  // node_modules/ogl/src/core/Program.js
  function setUniform(gl, type, location, value) {
    value = value.length ? flatten(value) : value;
    const setValue = gl.renderer.state.uniformLocations.get(location);
    if (value.length) {
      if (setValue === void 0 || setValue.length !== value.length) {
        gl.renderer.state.uniformLocations.set(location, value.slice(0));
      } else {
        if (arraysEqual(setValue, value)) return;
        setValue.set ? setValue.set(value) : setArray(setValue, value);
        gl.renderer.state.uniformLocations.set(location, setValue);
      }
    } else {
      if (setValue === value) return;
      gl.renderer.state.uniformLocations.set(location, value);
    }
    switch (type) {
      case 5126:
        return value.length ? gl.uniform1fv(location, value) : gl.uniform1f(location, value);
      // FLOAT
      case 35664:
        return gl.uniform2fv(location, value);
      // FLOAT_VEC2
      case 35665:
        return gl.uniform3fv(location, value);
      // FLOAT_VEC3
      case 35666:
        return gl.uniform4fv(location, value);
      // FLOAT_VEC4
      case 35670:
      // BOOL
      case 5124:
      // INT
      case 35678:
      // SAMPLER_2D
      case 36306:
      // U_SAMPLER_2D
      case 35680:
      // SAMPLER_CUBE
      case 36289:
        return value.length ? gl.uniform1iv(location, value) : gl.uniform1i(location, value);
      // SAMPLER_CUBE
      case 35671:
      // BOOL_VEC2
      case 35667:
        return gl.uniform2iv(location, value);
      // INT_VEC2
      case 35672:
      // BOOL_VEC3
      case 35668:
        return gl.uniform3iv(location, value);
      // INT_VEC3
      case 35673:
      // BOOL_VEC4
      case 35669:
        return gl.uniform4iv(location, value);
      // INT_VEC4
      case 35674:
        return gl.uniformMatrix2fv(location, false, value);
      // FLOAT_MAT2
      case 35675:
        return gl.uniformMatrix3fv(location, false, value);
      // FLOAT_MAT3
      case 35676:
        return gl.uniformMatrix4fv(location, false, value);
    }
  }
  function addLineNumbers(string) {
    let lines = string.split("\n");
    for (let i = 0; i < lines.length; i++) {
      lines[i] = i + 1 + ": " + lines[i];
    }
    return lines.join("\n");
  }
  function flatten(a) {
    const arrayLen = a.length;
    const valueLen = a[0].length;
    if (valueLen === void 0) return a;
    const length4 = arrayLen * valueLen;
    let value = arrayCacheF32[length4];
    if (!value) arrayCacheF32[length4] = value = new Float32Array(length4);
    for (let i = 0; i < arrayLen; i++) value.set(a[i], i * valueLen);
    return value;
  }
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0, l = a.length; i < l; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  function setArray(a, b) {
    for (let i = 0, l = a.length; i < l; i++) {
      a[i] = b[i];
    }
  }
  function warn(message) {
    if (warnCount > 100) return;
    console.warn(message);
    warnCount++;
    if (warnCount > 100) console.warn("More than 100 program warnings - stopping logs.");
  }
  var ID2, arrayCacheF32, Program, warnCount;
  var init_Program = __esm({
    "node_modules/ogl/src/core/Program.js"() {
      ID2 = 1;
      arrayCacheF32 = {};
      Program = class {
        constructor(gl, {
          vertex: vertex2,
          fragment: fragment2,
          uniforms = {},
          transparent = false,
          cullFace = gl.BACK,
          frontFace = gl.CCW,
          depthTest = true,
          depthWrite = true,
          depthFunc = gl.LEQUAL
        } = {}) {
          if (!gl.canvas) console.error("gl not passed as first argument to Program");
          this.gl = gl;
          this.uniforms = uniforms;
          this.id = ID2++;
          if (!vertex2) console.warn("vertex shader not supplied");
          if (!fragment2) console.warn("fragment shader not supplied");
          this.transparent = transparent;
          this.cullFace = cullFace;
          this.frontFace = frontFace;
          this.depthTest = depthTest;
          this.depthWrite = depthWrite;
          this.depthFunc = depthFunc;
          this.blendFunc = {};
          this.blendEquation = {};
          this.stencilFunc = {};
          this.stencilOp = {};
          if (this.transparent && !this.blendFunc.src) {
            if (this.gl.renderer.premultipliedAlpha) this.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            else this.setBlendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
          }
          this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
          this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          this.program = gl.createProgram();
          gl.attachShader(this.program, this.vertexShader);
          gl.attachShader(this.program, this.fragmentShader);
          this.setShaders({ vertex: vertex2, fragment: fragment2 });
        }
        setShaders({ vertex: vertex2, fragment: fragment2 }) {
          if (vertex2) {
            this.gl.shaderSource(this.vertexShader, vertex2);
            this.gl.compileShader(this.vertexShader);
            if (this.gl.getShaderInfoLog(this.vertexShader) !== "") {
              console.warn(`${this.gl.getShaderInfoLog(this.vertexShader)}
Vertex Shader
${addLineNumbers(vertex2)}`);
            }
          }
          if (fragment2) {
            this.gl.shaderSource(this.fragmentShader, fragment2);
            this.gl.compileShader(this.fragmentShader);
            if (this.gl.getShaderInfoLog(this.fragmentShader) !== "") {
              console.warn(`${this.gl.getShaderInfoLog(this.fragmentShader)}
Fragment Shader
${addLineNumbers(fragment2)}`);
            }
          }
          this.gl.linkProgram(this.program);
          if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            return console.warn(this.gl.getProgramInfoLog(this.program));
          }
          this.uniformLocations = /* @__PURE__ */ new Map();
          let numUniforms = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
          for (let uIndex = 0; uIndex < numUniforms; uIndex++) {
            let uniform = this.gl.getActiveUniform(this.program, uIndex);
            this.uniformLocations.set(uniform, this.gl.getUniformLocation(this.program, uniform.name));
            const split = uniform.name.match(/(\w+)/g);
            uniform.uniformName = split[0];
            uniform.nameComponents = split.slice(1);
          }
          this.attributeLocations = /* @__PURE__ */ new Map();
          const locations = [];
          const numAttribs = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
          for (let aIndex = 0; aIndex < numAttribs; aIndex++) {
            const attribute = this.gl.getActiveAttrib(this.program, aIndex);
            const location = this.gl.getAttribLocation(this.program, attribute.name);
            if (location === -1) continue;
            locations[location] = attribute.name;
            this.attributeLocations.set(attribute, location);
          }
          this.attributeOrder = locations.join("");
        }
        setBlendFunc(src, dst, srcAlpha, dstAlpha) {
          this.blendFunc.src = src;
          this.blendFunc.dst = dst;
          this.blendFunc.srcAlpha = srcAlpha;
          this.blendFunc.dstAlpha = dstAlpha;
          if (src) this.transparent = true;
        }
        setBlendEquation(modeRGB, modeAlpha) {
          this.blendEquation.modeRGB = modeRGB;
          this.blendEquation.modeAlpha = modeAlpha;
        }
        setStencilFunc(func, ref, mask) {
          this.stencilRef = ref;
          this.stencilFunc.func = func;
          this.stencilFunc.ref = ref;
          this.stencilFunc.mask = mask;
        }
        setStencilOp(stencilFail, depthFail, depthPass) {
          this.stencilOp.stencilFail = stencilFail;
          this.stencilOp.depthFail = depthFail;
          this.stencilOp.depthPass = depthPass;
        }
        applyState() {
          if (this.depthTest) this.gl.renderer.enable(this.gl.DEPTH_TEST);
          else this.gl.renderer.disable(this.gl.DEPTH_TEST);
          if (this.cullFace) this.gl.renderer.enable(this.gl.CULL_FACE);
          else this.gl.renderer.disable(this.gl.CULL_FACE);
          if (this.blendFunc.src) this.gl.renderer.enable(this.gl.BLEND);
          else this.gl.renderer.disable(this.gl.BLEND);
          if (this.cullFace) this.gl.renderer.setCullFace(this.cullFace);
          this.gl.renderer.setFrontFace(this.frontFace);
          this.gl.renderer.setDepthMask(this.depthWrite);
          this.gl.renderer.setDepthFunc(this.depthFunc);
          if (this.blendFunc.src) this.gl.renderer.setBlendFunc(this.blendFunc.src, this.blendFunc.dst, this.blendFunc.srcAlpha, this.blendFunc.dstAlpha);
          this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB, this.blendEquation.modeAlpha);
          if (this.stencilFunc.func || this.stencilOp.stencilFail) this.gl.renderer.enable(this.gl.STENCIL_TEST);
          else this.gl.renderer.disable(this.gl.STENCIL_TEST);
          this.gl.renderer.setStencilFunc(this.stencilFunc.func, this.stencilFunc.ref, this.stencilFunc.mask);
          this.gl.renderer.setStencilOp(this.stencilOp.stencilFail, this.stencilOp.depthFail, this.stencilOp.depthPass);
        }
        use({ flipFaces = false } = {}) {
          let textureUnit = -1;
          const programActive = this.gl.renderer.state.currentProgram === this.id;
          if (!programActive) {
            this.gl.useProgram(this.program);
            this.gl.renderer.state.currentProgram = this.id;
          }
          this.uniformLocations.forEach((location, activeUniform) => {
            let uniform = this.uniforms[activeUniform.uniformName];
            for (const component of activeUniform.nameComponents) {
              if (!uniform) break;
              if (component in uniform) {
                uniform = uniform[component];
              } else if (Array.isArray(uniform.value)) {
                break;
              } else {
                uniform = void 0;
                break;
              }
            }
            if (!uniform) {
              return warn(`Active uniform ${activeUniform.name} has not been supplied`);
            }
            if (uniform && uniform.value === void 0) {
              return warn(`${activeUniform.name} uniform is missing a value parameter`);
            }
            if (uniform.value.texture) {
              textureUnit = textureUnit + 1;
              uniform.value.update(textureUnit);
              return setUniform(this.gl, activeUniform.type, location, textureUnit);
            }
            if (uniform.value.length && uniform.value[0].texture) {
              const textureUnits = [];
              uniform.value.forEach((value) => {
                textureUnit = textureUnit + 1;
                value.update(textureUnit);
                textureUnits.push(textureUnit);
              });
              return setUniform(this.gl, activeUniform.type, location, textureUnits);
            }
            setUniform(this.gl, activeUniform.type, location, uniform.value);
          });
          this.applyState();
          if (flipFaces) this.gl.renderer.setFrontFace(this.frontFace === this.gl.CCW ? this.gl.CW : this.gl.CCW);
        }
        remove() {
          this.gl.deleteProgram(this.program);
        }
      };
      warnCount = 0;
    }
  });

  // node_modules/ogl/src/core/Renderer.js
  var tempVec32, ID3, Renderer;
  var init_Renderer = __esm({
    "node_modules/ogl/src/core/Renderer.js"() {
      init_Vec3();
      tempVec32 = /* @__PURE__ */ new Vec3();
      ID3 = 1;
      Renderer = class {
        constructor({
          canvas = document.createElement("canvas"),
          width = 300,
          height = 150,
          dpr = 1,
          alpha = false,
          depth = true,
          stencil = false,
          antialias = false,
          premultipliedAlpha = false,
          preserveDrawingBuffer = false,
          powerPreference = "default",
          autoClear = true,
          webgl = 2
        } = {}) {
          const attributes = { alpha, depth, stencil, antialias, premultipliedAlpha, preserveDrawingBuffer, powerPreference };
          this.dpr = dpr;
          this.alpha = alpha;
          this.color = true;
          this.depth = depth;
          this.stencil = stencil;
          this.premultipliedAlpha = premultipliedAlpha;
          this.autoClear = autoClear;
          this.id = ID3++;
          if (webgl === 2) this.gl = canvas.getContext("webgl2", attributes);
          this.isWebgl2 = !!this.gl;
          if (!this.gl) this.gl = canvas.getContext("webgl", attributes);
          if (!this.gl) console.error("unable to create webgl context");
          this.gl.renderer = this;
          this.setSize(width, height);
          this.state = {};
          this.state.blendFunc = { src: this.gl.ONE, dst: this.gl.ZERO };
          this.state.blendEquation = { modeRGB: this.gl.FUNC_ADD };
          this.state.cullFace = false;
          this.state.frontFace = this.gl.CCW;
          this.state.depthMask = true;
          this.state.depthFunc = this.gl.LEQUAL;
          this.state.premultiplyAlpha = false;
          this.state.flipY = false;
          this.state.unpackAlignment = 4;
          this.state.framebuffer = null;
          this.state.viewport = { x: 0, y: 0, width: null, height: null };
          this.state.textureUnits = [];
          this.state.activeTextureUnit = 0;
          this.state.boundBuffer = null;
          this.state.uniformLocations = /* @__PURE__ */ new Map();
          this.state.currentProgram = null;
          this.extensions = {};
          if (this.isWebgl2) {
            this.getExtension("EXT_color_buffer_float");
            this.getExtension("OES_texture_float_linear");
          } else {
            this.getExtension("OES_texture_float");
            this.getExtension("OES_texture_float_linear");
            this.getExtension("OES_texture_half_float");
            this.getExtension("OES_texture_half_float_linear");
            this.getExtension("OES_element_index_uint");
            this.getExtension("OES_standard_derivatives");
            this.getExtension("EXT_sRGB");
            this.getExtension("WEBGL_depth_texture");
            this.getExtension("WEBGL_draw_buffers");
          }
          this.getExtension("WEBGL_compressed_texture_astc");
          this.getExtension("EXT_texture_compression_bptc");
          this.getExtension("WEBGL_compressed_texture_s3tc");
          this.getExtension("WEBGL_compressed_texture_etc1");
          this.getExtension("WEBGL_compressed_texture_pvrtc");
          this.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
          this.vertexAttribDivisor = this.getExtension("ANGLE_instanced_arrays", "vertexAttribDivisor", "vertexAttribDivisorANGLE");
          this.drawArraysInstanced = this.getExtension("ANGLE_instanced_arrays", "drawArraysInstanced", "drawArraysInstancedANGLE");
          this.drawElementsInstanced = this.getExtension("ANGLE_instanced_arrays", "drawElementsInstanced", "drawElementsInstancedANGLE");
          this.createVertexArray = this.getExtension("OES_vertex_array_object", "createVertexArray", "createVertexArrayOES");
          this.bindVertexArray = this.getExtension("OES_vertex_array_object", "bindVertexArray", "bindVertexArrayOES");
          this.deleteVertexArray = this.getExtension("OES_vertex_array_object", "deleteVertexArray", "deleteVertexArrayOES");
          this.drawBuffers = this.getExtension("WEBGL_draw_buffers", "drawBuffers", "drawBuffersWEBGL");
          this.parameters = {};
          this.parameters.maxTextureUnits = this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
          this.parameters.maxAnisotropy = this.getExtension("EXT_texture_filter_anisotropic") ? this.gl.getParameter(this.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
        }
        setSize(width, height) {
          this.width = width;
          this.height = height;
          this.gl.canvas.width = width * this.dpr;
          this.gl.canvas.height = height * this.dpr;
          if (!this.gl.canvas.style) return;
          Object.assign(this.gl.canvas.style, {
            width: width + "px",
            height: height + "px"
          });
        }
        setViewport(width, height, x = 0, y = 0) {
          if (this.state.viewport.width === width && this.state.viewport.height === height) return;
          this.state.viewport.width = width;
          this.state.viewport.height = height;
          this.state.viewport.x = x;
          this.state.viewport.y = y;
          this.gl.viewport(x, y, width, height);
        }
        setScissor(width, height, x = 0, y = 0) {
          this.gl.scissor(x, y, width, height);
        }
        enable(id) {
          if (this.state[id] === true) return;
          this.gl.enable(id);
          this.state[id] = true;
        }
        disable(id) {
          if (this.state[id] === false) return;
          this.gl.disable(id);
          this.state[id] = false;
        }
        setBlendFunc(src, dst, srcAlpha, dstAlpha) {
          if (this.state.blendFunc.src === src && this.state.blendFunc.dst === dst && this.state.blendFunc.srcAlpha === srcAlpha && this.state.blendFunc.dstAlpha === dstAlpha)
            return;
          this.state.blendFunc.src = src;
          this.state.blendFunc.dst = dst;
          this.state.blendFunc.srcAlpha = srcAlpha;
          this.state.blendFunc.dstAlpha = dstAlpha;
          if (srcAlpha !== void 0) this.gl.blendFuncSeparate(src, dst, srcAlpha, dstAlpha);
          else this.gl.blendFunc(src, dst);
        }
        setBlendEquation(modeRGB, modeAlpha) {
          modeRGB = modeRGB || this.gl.FUNC_ADD;
          if (this.state.blendEquation.modeRGB === modeRGB && this.state.blendEquation.modeAlpha === modeAlpha) return;
          this.state.blendEquation.modeRGB = modeRGB;
          this.state.blendEquation.modeAlpha = modeAlpha;
          if (modeAlpha !== void 0) this.gl.blendEquationSeparate(modeRGB, modeAlpha);
          else this.gl.blendEquation(modeRGB);
        }
        setCullFace(value) {
          if (this.state.cullFace === value) return;
          this.state.cullFace = value;
          this.gl.cullFace(value);
        }
        setFrontFace(value) {
          if (this.state.frontFace === value) return;
          this.state.frontFace = value;
          this.gl.frontFace(value);
        }
        setDepthMask(value) {
          if (this.state.depthMask === value) return;
          this.state.depthMask = value;
          this.gl.depthMask(value);
        }
        setDepthFunc(value) {
          if (this.state.depthFunc === value) return;
          this.state.depthFunc = value;
          this.gl.depthFunc(value);
        }
        setStencilMask(value) {
          if (this.state.stencilMask === value) return;
          this.state.stencilMask = value;
          this.gl.stencilMask(value);
        }
        setStencilFunc(func, ref, mask) {
          if (this.state.stencilFunc === func && this.state.stencilRef === ref && this.state.stencilFuncMask === mask) return;
          this.state.stencilFunc = func || this.gl.ALWAYS;
          this.state.stencilRef = ref || 0;
          this.state.stencilFuncMask = mask || 0;
          this.gl.stencilFunc(func || this.gl.ALWAYS, ref || 0, mask || 0);
        }
        setStencilOp(stencilFail, depthFail, depthPass) {
          if (this.state.stencilFail === stencilFail && this.state.stencilDepthFail === depthFail && this.state.stencilDepthPass === depthPass) return;
          this.state.stencilFail = stencilFail;
          this.state.stencilDepthFail = depthFail;
          this.state.stencilDepthPass = depthPass;
          this.gl.stencilOp(stencilFail, depthFail, depthPass);
        }
        activeTexture(value) {
          if (this.state.activeTextureUnit === value) return;
          this.state.activeTextureUnit = value;
          this.gl.activeTexture(this.gl.TEXTURE0 + value);
        }
        bindFramebuffer({ target = this.gl.FRAMEBUFFER, buffer = null } = {}) {
          if (this.state.framebuffer === buffer) return;
          this.state.framebuffer = buffer;
          this.gl.bindFramebuffer(target, buffer);
        }
        getExtension(extension, webgl2Func, extFunc) {
          if (webgl2Func && this.gl[webgl2Func]) return this.gl[webgl2Func].bind(this.gl);
          if (!this.extensions[extension]) {
            this.extensions[extension] = this.gl.getExtension(extension);
          }
          if (!webgl2Func) return this.extensions[extension];
          if (!this.extensions[extension]) return null;
          return this.extensions[extension][extFunc].bind(this.extensions[extension]);
        }
        sortOpaque(a, b) {
          if (a.renderOrder !== b.renderOrder) {
            return a.renderOrder - b.renderOrder;
          } else if (a.program.id !== b.program.id) {
            return a.program.id - b.program.id;
          } else if (a.zDepth !== b.zDepth) {
            return a.zDepth - b.zDepth;
          } else {
            return b.id - a.id;
          }
        }
        sortTransparent(a, b) {
          if (a.renderOrder !== b.renderOrder) {
            return a.renderOrder - b.renderOrder;
          }
          if (a.zDepth !== b.zDepth) {
            return b.zDepth - a.zDepth;
          } else {
            return b.id - a.id;
          }
        }
        sortUI(a, b) {
          if (a.renderOrder !== b.renderOrder) {
            return a.renderOrder - b.renderOrder;
          } else if (a.program.id !== b.program.id) {
            return a.program.id - b.program.id;
          } else {
            return b.id - a.id;
          }
        }
        getRenderList({ scene, camera, frustumCull, sort }) {
          let renderList = [];
          if (camera && frustumCull) camera.updateFrustum();
          scene.traverse((node) => {
            if (!node.visible) return true;
            if (!node.draw) return;
            if (frustumCull && node.frustumCulled && camera) {
              if (!camera.frustumIntersectsMesh(node)) return;
            }
            renderList.push(node);
          });
          if (sort) {
            const opaque = [];
            const transparent = [];
            const ui = [];
            renderList.forEach((node) => {
              if (!node.program.transparent) {
                opaque.push(node);
              } else if (node.program.depthTest) {
                transparent.push(node);
              } else {
                ui.push(node);
              }
              node.zDepth = 0;
              if (node.renderOrder !== 0 || !node.program.depthTest || !camera) return;
              node.worldMatrix.getTranslation(tempVec32);
              tempVec32.applyMatrix4(camera.projectionViewMatrix);
              node.zDepth = tempVec32.z;
            });
            opaque.sort(this.sortOpaque);
            transparent.sort(this.sortTransparent);
            ui.sort(this.sortUI);
            renderList = opaque.concat(transparent, ui);
          }
          return renderList;
        }
        render({ scene, camera, target = null, update = true, sort = true, frustumCull = true, clear }) {
          if (target === null) {
            this.bindFramebuffer();
            this.setViewport(this.width * this.dpr, this.height * this.dpr);
          } else {
            this.bindFramebuffer(target);
            this.setViewport(target.width, target.height);
          }
          if (clear || this.autoClear && clear !== false) {
            if (this.depth && (!target || target.depth)) {
              this.enable(this.gl.DEPTH_TEST);
              this.setDepthMask(true);
            }
            if (this.stencil || (!target || target.stencil)) {
              this.enable(this.gl.STENCIL_TEST);
              this.setStencilMask(255);
            }
            this.gl.clear(
              (this.color ? this.gl.COLOR_BUFFER_BIT : 0) | (this.depth ? this.gl.DEPTH_BUFFER_BIT : 0) | (this.stencil ? this.gl.STENCIL_BUFFER_BIT : 0)
            );
          }
          if (update) scene.updateMatrixWorld();
          if (camera) camera.updateMatrixWorld();
          const renderList = this.getRenderList({ scene, camera, frustumCull, sort });
          renderList.forEach((node) => {
            node.draw({ camera });
          });
        }
      };
    }
  });

  // node_modules/ogl/src/math/functions/Vec4Func.js
  function copy2(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function set2(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function normalize2(out, a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let w = a[3];
    let len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
  }
  function dot2(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var init_Vec4Func = __esm({
    "node_modules/ogl/src/math/functions/Vec4Func.js"() {
    }
  });

  // node_modules/ogl/src/math/functions/QuatFunc.js
  function identity(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  }
  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    let s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  function multiply2(out, a, b) {
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  }
  function rotateX(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
  }
  function rotateY(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let by = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
  }
  function rotateZ(out, a, rad) {
    rad *= 0.5;
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bz = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
  }
  function slerp(out, a, b, t) {
    let ax = a[0], ay = a[1], az = a[2], aw = a[3];
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];
    let omega, cosom, sinom, scale0, scale1;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (1 - cosom > 1e-6) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  function invert(out, a) {
    let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    let dot5 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    let invDot = dot5 ? 1 / dot5 : 0;
    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
  }
  function conjugate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
  }
  function fromMat3(out, m) {
    let fTrace = m[0] + m[4] + m[8];
    let fRoot;
    if (fTrace > 0) {
      fRoot = Math.sqrt(fTrace + 1);
      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      let i = 0;
      if (m[4] > m[0]) i = 1;
      if (m[8] > m[i * 3 + i]) i = 2;
      let j = (i + 1) % 3;
      let k = (i + 2) % 3;
      fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1);
      out[i] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }
    return out;
  }
  function fromEuler(out, euler, order = "YXZ") {
    let sx = Math.sin(euler[0] * 0.5);
    let cx = Math.cos(euler[0] * 0.5);
    let sy = Math.sin(euler[1] * 0.5);
    let cy = Math.cos(euler[1] * 0.5);
    let sz = Math.sin(euler[2] * 0.5);
    let cz = Math.cos(euler[2] * 0.5);
    if (order === "XYZ") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "YXZ") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === "ZXY") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "ZYX") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === "YZX") {
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === "XZY") {
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
    }
    return out;
  }
  var copy3, set3, dot3, normalize3;
  var init_QuatFunc = __esm({
    "node_modules/ogl/src/math/functions/QuatFunc.js"() {
      init_Vec4Func();
      copy3 = copy2;
      set3 = set2;
      dot3 = dot2;
      normalize3 = normalize2;
    }
  });

  // node_modules/ogl/src/math/Quat.js
  var Quat;
  var init_Quat = __esm({
    "node_modules/ogl/src/math/Quat.js"() {
      init_QuatFunc();
      Quat = class extends Array {
        constructor(x = 0, y = 0, z = 0, w = 1) {
          super(x, y, z, w);
          this.onChange = () => {
          };
          this._target = this;
          const triggerProps = ["0", "1", "2", "3"];
          return new Proxy(this, {
            set(target, property) {
              const success = Reflect.set(...arguments);
              if (success && triggerProps.includes(property)) target.onChange();
              return success;
            }
          });
        }
        get x() {
          return this[0];
        }
        get y() {
          return this[1];
        }
        get z() {
          return this[2];
        }
        get w() {
          return this[3];
        }
        set x(v) {
          this._target[0] = v;
          this.onChange();
        }
        set y(v) {
          this._target[1] = v;
          this.onChange();
        }
        set z(v) {
          this._target[2] = v;
          this.onChange();
        }
        set w(v) {
          this._target[3] = v;
          this.onChange();
        }
        identity() {
          identity(this._target);
          this.onChange();
          return this;
        }
        set(x, y, z, w) {
          if (x.length) return this.copy(x);
          set3(this._target, x, y, z, w);
          this.onChange();
          return this;
        }
        rotateX(a) {
          rotateX(this._target, this._target, a);
          this.onChange();
          return this;
        }
        rotateY(a) {
          rotateY(this._target, this._target, a);
          this.onChange();
          return this;
        }
        rotateZ(a) {
          rotateZ(this._target, this._target, a);
          this.onChange();
          return this;
        }
        inverse(q = this._target) {
          invert(this._target, q);
          this.onChange();
          return this;
        }
        conjugate(q = this._target) {
          conjugate(this._target, q);
          this.onChange();
          return this;
        }
        copy(q) {
          copy3(this._target, q);
          this.onChange();
          return this;
        }
        normalize(q = this._target) {
          normalize3(this._target, q);
          this.onChange();
          return this;
        }
        multiply(qA, qB) {
          if (qB) {
            multiply2(this._target, qA, qB);
          } else {
            multiply2(this._target, this._target, qA);
          }
          this.onChange();
          return this;
        }
        dot(v) {
          return dot3(this._target, v);
        }
        fromMatrix3(matrix3) {
          fromMat3(this._target, matrix3);
          this.onChange();
          return this;
        }
        fromEuler(euler, isInternal) {
          fromEuler(this._target, euler, euler.order);
          if (!isInternal) this.onChange();
          return this;
        }
        fromAxisAngle(axis, a) {
          setAxisAngle(this._target, axis, a);
          this.onChange();
          return this;
        }
        slerp(q, t) {
          slerp(this._target, this._target, q, t);
          this.onChange();
          return this;
        }
        fromArray(a, o = 0) {
          this._target[0] = a[o];
          this._target[1] = a[o + 1];
          this._target[2] = a[o + 2];
          this._target[3] = a[o + 3];
          this.onChange();
          return this;
        }
        toArray(a = [], o = 0) {
          a[o] = this[0];
          a[o + 1] = this[1];
          a[o + 2] = this[2];
          a[o + 3] = this[3];
          return a;
        }
      };
    }
  });

  // node_modules/ogl/src/math/functions/Mat4Func.js
  function copy4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function set4(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity2(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function invert2(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function determinant(a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  }
  function multiply3(out, a, b) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate(out, a, v) {
    let x = v[0], y = v[1], z = v[2];
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale3(out, a, v) {
    let x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate(out, a, rad, axis) {
    let x = axis[0], y = axis[1], z = axis[2];
    let len = Math.hypot(x, y, z);
    let s, c, t;
    let a00, a01, a02, a03;
    let a10, a11, a12, a13;
    let a20, a21, a22, a23;
    let b00, b01, b02;
    let b10, b11, b12;
    let b20, b21, b22;
    if (Math.abs(len) < EPSILON) {
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function getTranslation(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    let m11 = mat[0];
    let m12 = mat[1];
    let m13 = mat[2];
    let m21 = mat[4];
    let m22 = mat[5];
    let m23 = mat[6];
    let m31 = mat[8];
    let m32 = mat[9];
    let m33 = mat[10];
    out[0] = Math.hypot(m11, m12, m13);
    out[1] = Math.hypot(m21, m22, m23);
    out[2] = Math.hypot(m31, m32, m33);
    return out;
  }
  function getMaxScaleOnAxis(mat) {
    let m11 = mat[0];
    let m12 = mat[1];
    let m13 = mat[2];
    let m21 = mat[4];
    let m22 = mat[5];
    let m23 = mat[6];
    let m31 = mat[8];
    let m32 = mat[9];
    let m33 = mat[10];
    const x = m11 * m11 + m12 * m12 + m13 * m13;
    const y = m21 * m21 + m22 * m22 + m23 * m23;
    const z = m31 * m31 + m32 * m32 + m33 * m33;
    return Math.sqrt(Math.max(x, y, z));
  }
  function decompose(srcMat, dstRotation, dstTranslation, dstScale) {
    let sx = length([srcMat[0], srcMat[1], srcMat[2]]);
    const sy = length([srcMat[4], srcMat[5], srcMat[6]]);
    const sz = length([srcMat[8], srcMat[9], srcMat[10]]);
    const det = determinant(srcMat);
    if (det < 0) sx = -sx;
    dstTranslation[0] = srcMat[12];
    dstTranslation[1] = srcMat[13];
    dstTranslation[2] = srcMat[14];
    const _m1 = srcMat.slice();
    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;
    _m1[0] *= invSX;
    _m1[1] *= invSX;
    _m1[2] *= invSX;
    _m1[4] *= invSY;
    _m1[5] *= invSY;
    _m1[6] *= invSY;
    _m1[8] *= invSZ;
    _m1[9] *= invSZ;
    _m1[10] *= invSZ;
    getRotation(dstRotation, _m1);
    dstScale[0] = sx;
    dstScale[1] = sy;
    dstScale[2] = sz;
  }
  function compose(dstMat, srcRotation, srcTranslation, srcScale) {
    const te = dstMat;
    const x = srcRotation[0], y = srcRotation[1], z = srcRotation[2], w = srcRotation[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    const sx = srcScale[0], sy = srcScale[1], sz = srcScale[2];
    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = srcTranslation[0];
    te[13] = srcTranslation[1];
    te[14] = srcTranslation[2];
    te[15] = 1;
    return te;
  }
  function fromQuat(out, q) {
    let x = q[0], y = q[1], z = q[2], w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let yx = y * x2;
    let yy = y * y2;
    let zx = z * x2;
    let zy = z * y2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function perspective(out, fovy, aspect, near, far) {
    let f = 1 / Math.tan(fovy / 2);
    let nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  }
  function ortho(out, left, right, bottom, top, near, far) {
    let lr = 1 / (left - right);
    let bt = 1 / (bottom - top);
    let nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    let eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    let z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    let len = z0 * z0 + z1 * z1 + z2 * z2;
    if (len === 0) {
      z2 = 1;
    } else {
      len = 1 / Math.sqrt(len);
      z0 *= len;
      z1 *= len;
      z2 *= len;
    }
    let x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len = x0 * x0 + x1 * x1 + x2 * x2;
    if (len === 0) {
      if (upz) {
        upx += 1e-6;
      } else if (upy) {
        upz += 1e-6;
      } else {
        upy += 1e-6;
      }
      x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
      len = x0 * x0 + x1 * x1 + x2 * x2;
    }
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function add3(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract2(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }
  var EPSILON, getRotation;
  var init_Mat4Func = __esm({
    "node_modules/ogl/src/math/functions/Mat4Func.js"() {
      init_Vec3Func();
      EPSILON = 1e-6;
      getRotation = /* @__PURE__ */ (function() {
        const temp = [1, 1, 1];
        return function(out, mat) {
          let scaling = temp;
          getScaling(scaling, mat);
          let is1 = 1 / scaling[0];
          let is2 = 1 / scaling[1];
          let is3 = 1 / scaling[2];
          let sm11 = mat[0] * is1;
          let sm12 = mat[1] * is2;
          let sm13 = mat[2] * is3;
          let sm21 = mat[4] * is1;
          let sm22 = mat[5] * is2;
          let sm23 = mat[6] * is3;
          let sm31 = mat[8] * is1;
          let sm32 = mat[9] * is2;
          let sm33 = mat[10] * is3;
          let trace = sm11 + sm22 + sm33;
          let S = 0;
          if (trace > 0) {
            S = Math.sqrt(trace + 1) * 2;
            out[3] = 0.25 * S;
            out[0] = (sm23 - sm32) / S;
            out[1] = (sm31 - sm13) / S;
            out[2] = (sm12 - sm21) / S;
          } else if (sm11 > sm22 && sm11 > sm33) {
            S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
            out[3] = (sm23 - sm32) / S;
            out[0] = 0.25 * S;
            out[1] = (sm12 + sm21) / S;
            out[2] = (sm31 + sm13) / S;
          } else if (sm22 > sm33) {
            S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
            out[3] = (sm31 - sm13) / S;
            out[0] = (sm12 + sm21) / S;
            out[1] = 0.25 * S;
            out[2] = (sm23 + sm32) / S;
          } else {
            S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
            out[3] = (sm12 - sm21) / S;
            out[0] = (sm31 + sm13) / S;
            out[1] = (sm23 + sm32) / S;
            out[2] = 0.25 * S;
          }
          return out;
        };
      })();
    }
  });

  // node_modules/ogl/src/math/Mat4.js
  var Mat4;
  var init_Mat4 = __esm({
    "node_modules/ogl/src/math/Mat4.js"() {
      init_Mat4Func();
      Mat4 = class extends Array {
        constructor(m00 = 1, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 1, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 1, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 1) {
          super(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
          return this;
        }
        get x() {
          return this[12];
        }
        get y() {
          return this[13];
        }
        get z() {
          return this[14];
        }
        get w() {
          return this[15];
        }
        set x(v) {
          this[12] = v;
        }
        set y(v) {
          this[13] = v;
        }
        set z(v) {
          this[14] = v;
        }
        set w(v) {
          this[15] = v;
        }
        set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
          if (m00.length) return this.copy(m00);
          set4(this, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
          return this;
        }
        translate(v, m = this) {
          translate(this, m, v);
          return this;
        }
        rotate(v, axis, m = this) {
          rotate(this, m, v, axis);
          return this;
        }
        scale(v, m = this) {
          scale3(this, m, typeof v === "number" ? [v, v, v] : v);
          return this;
        }
        add(ma, mb) {
          if (mb) add3(this, ma, mb);
          else add3(this, this, ma);
          return this;
        }
        sub(ma, mb) {
          if (mb) subtract2(this, ma, mb);
          else subtract2(this, this, ma);
          return this;
        }
        multiply(ma, mb) {
          if (!ma.length) {
            multiplyScalar(this, this, ma);
          } else if (mb) {
            multiply3(this, ma, mb);
          } else {
            multiply3(this, this, ma);
          }
          return this;
        }
        identity() {
          identity2(this);
          return this;
        }
        copy(m) {
          copy4(this, m);
          return this;
        }
        fromPerspective({ fov, aspect, near, far } = {}) {
          perspective(this, fov, aspect, near, far);
          return this;
        }
        fromOrthogonal({ left, right, bottom, top, near, far }) {
          ortho(this, left, right, bottom, top, near, far);
          return this;
        }
        fromQuaternion(q) {
          fromQuat(this, q);
          return this;
        }
        setPosition(v) {
          this.x = v[0];
          this.y = v[1];
          this.z = v[2];
          return this;
        }
        inverse(m = this) {
          invert2(this, m);
          return this;
        }
        compose(q, pos, scale6) {
          compose(this, q, pos, scale6);
          return this;
        }
        decompose(q, pos, scale6) {
          decompose(this, q, pos, scale6);
          return this;
        }
        getRotation(q) {
          getRotation(q, this);
          return this;
        }
        getTranslation(pos) {
          getTranslation(pos, this);
          return this;
        }
        getScaling(scale6) {
          getScaling(scale6, this);
          return this;
        }
        getMaxScaleOnAxis() {
          return getMaxScaleOnAxis(this);
        }
        lookAt(eye, target, up) {
          targetTo(this, eye, target, up);
          return this;
        }
        determinant() {
          return determinant(this);
        }
        fromArray(a, o = 0) {
          this[0] = a[o];
          this[1] = a[o + 1];
          this[2] = a[o + 2];
          this[3] = a[o + 3];
          this[4] = a[o + 4];
          this[5] = a[o + 5];
          this[6] = a[o + 6];
          this[7] = a[o + 7];
          this[8] = a[o + 8];
          this[9] = a[o + 9];
          this[10] = a[o + 10];
          this[11] = a[o + 11];
          this[12] = a[o + 12];
          this[13] = a[o + 13];
          this[14] = a[o + 14];
          this[15] = a[o + 15];
          return this;
        }
        toArray(a = [], o = 0) {
          a[o] = this[0];
          a[o + 1] = this[1];
          a[o + 2] = this[2];
          a[o + 3] = this[3];
          a[o + 4] = this[4];
          a[o + 5] = this[5];
          a[o + 6] = this[6];
          a[o + 7] = this[7];
          a[o + 8] = this[8];
          a[o + 9] = this[9];
          a[o + 10] = this[10];
          a[o + 11] = this[11];
          a[o + 12] = this[12];
          a[o + 13] = this[13];
          a[o + 14] = this[14];
          a[o + 15] = this[15];
          return a;
        }
      };
    }
  });

  // node_modules/ogl/src/math/functions/EulerFunc.js
  function fromRotationMatrix(out, m, order = "YXZ") {
    if (order === "XYZ") {
      out[1] = Math.asin(Math.min(Math.max(m[8], -1), 1));
      if (Math.abs(m[8]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[10]);
        out[2] = Math.atan2(-m[4], m[0]);
      } else {
        out[0] = Math.atan2(m[6], m[5]);
        out[2] = 0;
      }
    } else if (order === "YXZ") {
      out[0] = Math.asin(-Math.min(Math.max(m[9], -1), 1));
      if (Math.abs(m[9]) < 0.99999) {
        out[1] = Math.atan2(m[8], m[10]);
        out[2] = Math.atan2(m[1], m[5]);
      } else {
        out[1] = Math.atan2(-m[2], m[0]);
        out[2] = 0;
      }
    } else if (order === "ZXY") {
      out[0] = Math.asin(Math.min(Math.max(m[6], -1), 1));
      if (Math.abs(m[6]) < 0.99999) {
        out[1] = Math.atan2(-m[2], m[10]);
        out[2] = Math.atan2(-m[4], m[5]);
      } else {
        out[1] = 0;
        out[2] = Math.atan2(m[1], m[0]);
      }
    } else if (order === "ZYX") {
      out[1] = Math.asin(-Math.min(Math.max(m[2], -1), 1));
      if (Math.abs(m[2]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[10]);
        out[2] = Math.atan2(m[1], m[0]);
      } else {
        out[0] = 0;
        out[2] = Math.atan2(-m[4], m[5]);
      }
    } else if (order === "YZX") {
      out[2] = Math.asin(Math.min(Math.max(m[1], -1), 1));
      if (Math.abs(m[1]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[5]);
        out[1] = Math.atan2(-m[2], m[0]);
      } else {
        out[0] = 0;
        out[1] = Math.atan2(m[8], m[10]);
      }
    } else if (order === "XZY") {
      out[2] = Math.asin(-Math.min(Math.max(m[4], -1), 1));
      if (Math.abs(m[4]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[5]);
        out[1] = Math.atan2(m[8], m[0]);
      } else {
        out[0] = Math.atan2(-m[9], m[10]);
        out[1] = 0;
      }
    }
    return out;
  }
  var init_EulerFunc = __esm({
    "node_modules/ogl/src/math/functions/EulerFunc.js"() {
    }
  });

  // node_modules/ogl/src/math/Euler.js
  var tmpMat4, Euler;
  var init_Euler = __esm({
    "node_modules/ogl/src/math/Euler.js"() {
      init_EulerFunc();
      init_Mat4();
      tmpMat4 = /* @__PURE__ */ new Mat4();
      Euler = class extends Array {
        constructor(x = 0, y = x, z = x, order = "YXZ") {
          super(x, y, z);
          this.order = order;
          this.onChange = () => {
          };
          this._target = this;
          const triggerProps = ["0", "1", "2"];
          return new Proxy(this, {
            set(target, property) {
              const success = Reflect.set(...arguments);
              if (success && triggerProps.includes(property)) target.onChange();
              return success;
            }
          });
        }
        get x() {
          return this[0];
        }
        get y() {
          return this[1];
        }
        get z() {
          return this[2];
        }
        set x(v) {
          this._target[0] = v;
          this.onChange();
        }
        set y(v) {
          this._target[1] = v;
          this.onChange();
        }
        set z(v) {
          this._target[2] = v;
          this.onChange();
        }
        set(x, y = x, z = x) {
          if (x.length) return this.copy(x);
          this._target[0] = x;
          this._target[1] = y;
          this._target[2] = z;
          this.onChange();
          return this;
        }
        copy(v) {
          this._target[0] = v[0];
          this._target[1] = v[1];
          this._target[2] = v[2];
          this.onChange();
          return this;
        }
        reorder(order) {
          this._target.order = order;
          this.onChange();
          return this;
        }
        fromRotationMatrix(m, order = this.order) {
          fromRotationMatrix(this._target, m, order);
          this.onChange();
          return this;
        }
        fromQuaternion(q, order = this.order, isInternal) {
          tmpMat4.fromQuaternion(q);
          this._target.fromRotationMatrix(tmpMat4, order);
          if (!isInternal) this.onChange();
          return this;
        }
        fromArray(a, o = 0) {
          this._target[0] = a[o];
          this._target[1] = a[o + 1];
          this._target[2] = a[o + 2];
          return this;
        }
        toArray(a = [], o = 0) {
          a[o] = this[0];
          a[o + 1] = this[1];
          a[o + 2] = this[2];
          return a;
        }
      };
    }
  });

  // node_modules/ogl/src/core/Transform.js
  var Transform;
  var init_Transform = __esm({
    "node_modules/ogl/src/core/Transform.js"() {
      init_Vec3();
      init_Quat();
      init_Mat4();
      init_Euler();
      Transform = class {
        constructor() {
          this.parent = null;
          this.children = [];
          this.visible = true;
          this.matrix = new Mat4();
          this.worldMatrix = new Mat4();
          this.matrixAutoUpdate = true;
          this.worldMatrixNeedsUpdate = false;
          this.position = new Vec3();
          this.quaternion = new Quat();
          this.scale = new Vec3(1);
          this.rotation = new Euler();
          this.up = new Vec3(0, 1, 0);
          this.rotation._target.onChange = () => this.quaternion.fromEuler(this.rotation, true);
          this.quaternion._target.onChange = () => this.rotation.fromQuaternion(this.quaternion, void 0, true);
        }
        setParent(parent, notifyParent = true) {
          if (this.parent && parent !== this.parent) this.parent.removeChild(this, false);
          this.parent = parent;
          if (notifyParent && parent) parent.addChild(this, false);
        }
        addChild(child, notifyChild = true) {
          if (!~this.children.indexOf(child)) this.children.push(child);
          if (notifyChild) child.setParent(this, false);
        }
        removeChild(child, notifyChild = true) {
          if (!!~this.children.indexOf(child)) this.children.splice(this.children.indexOf(child), 1);
          if (notifyChild) child.setParent(null, false);
        }
        updateMatrixWorld(force) {
          if (this.matrixAutoUpdate) this.updateMatrix();
          if (this.worldMatrixNeedsUpdate || force) {
            if (this.parent === null) this.worldMatrix.copy(this.matrix);
            else this.worldMatrix.multiply(this.parent.worldMatrix, this.matrix);
            this.worldMatrixNeedsUpdate = false;
            force = true;
          }
          for (let i = 0, l = this.children.length; i < l; i++) {
            this.children[i].updateMatrixWorld(force);
          }
        }
        updateMatrix() {
          this.matrix.compose(this.quaternion, this.position, this.scale);
          this.worldMatrixNeedsUpdate = true;
        }
        traverse(callback) {
          if (callback(this)) return;
          for (let i = 0, l = this.children.length; i < l; i++) {
            this.children[i].traverse(callback);
          }
        }
        decompose() {
          this.matrix.decompose(this.quaternion._target, this.position, this.scale);
          this.rotation.fromQuaternion(this.quaternion);
        }
        lookAt(target, invert4 = false) {
          if (invert4) this.matrix.lookAt(this.position, target, this.up);
          else this.matrix.lookAt(target, this.position, this.up);
          this.matrix.getRotation(this.quaternion._target);
          this.rotation.fromQuaternion(this.quaternion);
        }
      };
    }
  });

  // node_modules/ogl/src/math/functions/Mat3Func.js
  function fromMat4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  }
  function fromQuat2(out, q) {
    let x = q[0], y = q[1], z = q[2], w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let yx = y * x2;
    let yy = y * y2;
    let zx = z * x2;
    let zy = z * y2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;
    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;
    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;
    return out;
  }
  function copy5(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function set5(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function identity3(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function invert3(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2];
    let a10 = a[3], a11 = a[4], a12 = a[5];
    let a20 = a[6], a21 = a[7], a22 = a[8];
    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  }
  function multiply4(out, a, b) {
    let a00 = a[0], a01 = a[1], a02 = a[2];
    let a10 = a[3], a11 = a[4], a12 = a[5];
    let a20 = a[6], a21 = a[7], a22 = a[8];
    let b00 = b[0], b01 = b[1], b02 = b[2];
    let b10 = b[3], b11 = b[4], b12 = b[5];
    let b20 = b[6], b21 = b[7], b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  }
  function translate2(out, a, v) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  }
  function rotate2(out, a, rad) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;
    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
  }
  function scale4(out, a, v) {
    let x = v[0], y = v[1];
    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];
    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function normalFromMat4(out, a) {
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return out;
  }
  var init_Mat3Func = __esm({
    "node_modules/ogl/src/math/functions/Mat3Func.js"() {
    }
  });

  // node_modules/ogl/src/math/Mat3.js
  var Mat3;
  var init_Mat3 = __esm({
    "node_modules/ogl/src/math/Mat3.js"() {
      init_Mat3Func();
      Mat3 = class extends Array {
        constructor(m00 = 1, m01 = 0, m02 = 0, m10 = 0, m11 = 1, m12 = 0, m20 = 0, m21 = 0, m22 = 1) {
          super(m00, m01, m02, m10, m11, m12, m20, m21, m22);
          return this;
        }
        set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
          if (m00.length) return this.copy(m00);
          set5(this, m00, m01, m02, m10, m11, m12, m20, m21, m22);
          return this;
        }
        translate(v, m = this) {
          translate2(this, m, v);
          return this;
        }
        rotate(v, m = this) {
          rotate2(this, m, v);
          return this;
        }
        scale(v, m = this) {
          scale4(this, m, v);
          return this;
        }
        multiply(ma, mb) {
          if (mb) {
            multiply4(this, ma, mb);
          } else {
            multiply4(this, this, ma);
          }
          return this;
        }
        identity() {
          identity3(this);
          return this;
        }
        copy(m) {
          copy5(this, m);
          return this;
        }
        fromMatrix4(m) {
          fromMat4(this, m);
          return this;
        }
        fromQuaternion(q) {
          fromQuat2(this, q);
          return this;
        }
        fromBasis(vec3a, vec3b, vec3c) {
          this.set(vec3a[0], vec3a[1], vec3a[2], vec3b[0], vec3b[1], vec3b[2], vec3c[0], vec3c[1], vec3c[2]);
          return this;
        }
        inverse(m = this) {
          invert3(this, m);
          return this;
        }
        getNormalMatrix(m) {
          normalFromMat4(this, m);
          return this;
        }
      };
    }
  });

  // node_modules/ogl/src/core/Mesh.js
  var ID4, Mesh;
  var init_Mesh = __esm({
    "node_modules/ogl/src/core/Mesh.js"() {
      init_Transform();
      init_Mat3();
      init_Mat4();
      ID4 = 0;
      Mesh = class extends Transform {
        constructor(gl, { geometry, program, mode = gl.TRIANGLES, frustumCulled = true, renderOrder = 0 } = {}) {
          super();
          if (!gl.canvas) console.error("gl not passed as first argument to Mesh");
          this.gl = gl;
          this.id = ID4++;
          this.geometry = geometry;
          this.program = program;
          this.mode = mode;
          this.frustumCulled = frustumCulled;
          this.renderOrder = renderOrder;
          this.modelViewMatrix = new Mat4();
          this.normalMatrix = new Mat3();
          this.beforeRenderCallbacks = [];
          this.afterRenderCallbacks = [];
        }
        onBeforeRender(f) {
          this.beforeRenderCallbacks.push(f);
          return this;
        }
        onAfterRender(f) {
          this.afterRenderCallbacks.push(f);
          return this;
        }
        draw({ camera } = {}) {
          if (camera) {
            if (!this.program.uniforms.modelMatrix) {
              Object.assign(this.program.uniforms, {
                modelMatrix: { value: null },
                viewMatrix: { value: null },
                modelViewMatrix: { value: null },
                normalMatrix: { value: null },
                projectionMatrix: { value: null },
                cameraPosition: { value: null }
              });
            }
            this.program.uniforms.projectionMatrix.value = camera.projectionMatrix;
            this.program.uniforms.cameraPosition.value = camera.worldPosition;
            this.program.uniforms.viewMatrix.value = camera.viewMatrix;
            this.modelViewMatrix.multiply(camera.viewMatrix, this.worldMatrix);
            this.normalMatrix.getNormalMatrix(this.modelViewMatrix);
            this.program.uniforms.modelMatrix.value = this.worldMatrix;
            this.program.uniforms.modelViewMatrix.value = this.modelViewMatrix;
            this.program.uniforms.normalMatrix.value = this.normalMatrix;
          }
          this.beforeRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
          let flipFaces = this.program.cullFace && this.worldMatrix.determinant() < 0;
          this.program.use({ flipFaces });
          this.geometry.draw({ mode: this.mode, program: this.program });
          this.afterRenderCallbacks.forEach((f) => f && f({ mesh: this, camera }));
        }
      };
    }
  });

  // node_modules/ogl/src/math/functions/Vec2Func.js
  function copy6(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
  }
  function set6(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
  }
  function add4(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
  }
  function subtract3(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
  }
  function multiply5(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
  }
  function divide2(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
  }
  function scale5(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
  }
  function distance2(a, b) {
    var x = b[0] - a[0], y = b[1] - a[1];
    return Math.sqrt(x * x + y * y);
  }
  function squaredDistance2(a, b) {
    var x = b[0] - a[0], y = b[1] - a[1];
    return x * x + y * y;
  }
  function length3(a) {
    var x = a[0], y = a[1];
    return Math.sqrt(x * x + y * y);
  }
  function squaredLength2(a) {
    var x = a[0], y = a[1];
    return x * x + y * y;
  }
  function negate2(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
  }
  function inverse2(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    return out;
  }
  function normalize4(out, a) {
    var x = a[0], y = a[1];
    var len = x * x + y * y;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    return out;
  }
  function dot4(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function cross2(a, b) {
    return a[0] * b[1] - a[1] * b[0];
  }
  function lerp3(out, a, b, t) {
    var ax = a[0], ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
  }
  function smoothLerp2(out, a, b, decay, dt) {
    const exp = Math.exp(-decay * dt);
    let ax = a[0];
    let ay = a[1];
    out[0] = b[0] + (ax - b[0]) * exp;
    out[1] = b[1] + (ay - b[1]) * exp;
    return out;
  }
  function transformMat32(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
  }
  function transformMat42(out, a, m) {
    let x = a[0];
    let y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
  }
  function exactEquals2(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }
  var init_Vec2Func = __esm({
    "node_modules/ogl/src/math/functions/Vec2Func.js"() {
    }
  });

  // node_modules/ogl/src/math/Vec2.js
  var Vec2;
  var init_Vec2 = __esm({
    "node_modules/ogl/src/math/Vec2.js"() {
      init_Vec2Func();
      Vec2 = class _Vec2 extends Array {
        constructor(x = 0, y = x) {
          super(x, y);
          return this;
        }
        get x() {
          return this[0];
        }
        get y() {
          return this[1];
        }
        set x(v) {
          this[0] = v;
        }
        set y(v) {
          this[1] = v;
        }
        set(x, y = x) {
          if (x.length) return this.copy(x);
          set6(this, x, y);
          return this;
        }
        copy(v) {
          copy6(this, v);
          return this;
        }
        add(va, vb) {
          if (vb) add4(this, va, vb);
          else add4(this, this, va);
          return this;
        }
        sub(va, vb) {
          if (vb) subtract3(this, va, vb);
          else subtract3(this, this, va);
          return this;
        }
        multiply(v) {
          if (v.length) multiply5(this, this, v);
          else scale5(this, this, v);
          return this;
        }
        divide(v) {
          if (v.length) divide2(this, this, v);
          else scale5(this, this, 1 / v);
          return this;
        }
        inverse(v = this) {
          inverse2(this, v);
          return this;
        }
        // Can't use 'length' as Array.prototype uses it
        len() {
          return length3(this);
        }
        distance(v) {
          if (v) return distance2(this, v);
          else return length3(this);
        }
        squaredLen() {
          return this.squaredDistance();
        }
        squaredDistance(v) {
          if (v) return squaredDistance2(this, v);
          else return squaredLength2(this);
        }
        negate(v = this) {
          negate2(this, v);
          return this;
        }
        cross(va, vb) {
          if (vb) return cross2(va, vb);
          return cross2(this, va);
        }
        scale(v) {
          scale5(this, this, v);
          return this;
        }
        normalize() {
          normalize4(this, this);
          return this;
        }
        dot(v) {
          return dot4(this, v);
        }
        equals(v) {
          return exactEquals2(this, v);
        }
        applyMatrix3(mat3) {
          transformMat32(this, this, mat3);
          return this;
        }
        applyMatrix4(mat4) {
          transformMat42(this, this, mat4);
          return this;
        }
        lerp(v, a) {
          lerp3(this, this, v, a);
          return this;
        }
        smoothLerp(v, decay, dt) {
          smoothLerp2(this, this, v, decay, dt);
          return this;
        }
        clone() {
          return new _Vec2(this[0], this[1]);
        }
        fromArray(a, o = 0) {
          this[0] = a[o];
          this[1] = a[o + 1];
          return this;
        }
        toArray(a = [], o = 0) {
          a[o] = this[0];
          a[o + 1] = this[1];
          return a;
        }
      };
    }
  });

  // node_modules/ogl/src/extras/Triangle.js
  var Triangle;
  var init_Triangle = __esm({
    "node_modules/ogl/src/extras/Triangle.js"() {
      init_Geometry();
      Triangle = class extends Geometry {
        constructor(gl, { attributes = {} } = {}) {
          Object.assign(attributes, {
            position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
            uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
          });
          super(gl, attributes);
        }
      };
    }
  });

  // node_modules/ogl/src/index.js
  var init_src = __esm({
    "node_modules/ogl/src/index.js"() {
      init_Program();
      init_Renderer();
      init_Mesh();
      init_Vec2();
      init_Triangle();
    }
  });

  // DarkVeil.js
  function mountDarkVeil(container, options = {}) {
    const {
      hueShift = 135,
      // default to match our fresh green/mint branding
      noiseIntensity = 0.04,
      scanlineIntensity = 0.08,
      speed = 0.12,
      // subtle, non-distracting pace
      scanlineFrequency = 800,
      warpAmount = 0.05,
      resolutionScale = 0.75
    } = options;
    const canvas = document.createElement("canvas");
    canvas.className = "darkveil-canvas";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      canvas
    });
    const gl = renderer.gl;
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2() },
        uHueShift: { value: hueShift },
        uNoise: { value: noiseIntensity },
        uScan: { value: scanlineIntensity },
        uScanFreq: { value: scanlineFrequency },
        uWarp: { value: warpAmount }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w * resolutionScale, h * resolutionScale);
      program.uniforms.uResolution.value.set(w, h);
      renderer.render({ scene: mesh });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    const start = performance.now();
    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const loop = (t) => {
      program.uniforms.uTime.value = (t - start) / 1e3 * speed;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop);
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) tryStart();
        else tryStop();
      },
      { threshold: 0 }
    );
    io.observe(container);
    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    tryStart();
    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        container.removeChild(canvas);
      } catch {
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }
  var vertex, fragment;
  var init_DarkVeil = __esm({
    "DarkVeil.js"() {
      init_src();
      vertex = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;
      fragment = `
#ifdef GL_ES
precision lowp float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uHueShift;
uniform float uNoise;
uniform float uScan;
uniform float uScanFreq;
uniform float uWarp;
#define iTime uTime
#define iResolution uResolution

vec4 buf[8];
float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}

mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);

vec3 hueShiftRGB(vec3 col,float deg){
    vec3 yiq=rgb2yiq*col;
    float rad=radians(deg);
    float cosh=cos(rad),sinh=sin(rad);
    vec3 yiqShift=vec3(yiq.x,yiq.y*cosh-yiq.z*sinh,yiq.y*sinh+yiq.z*cosh);
    return clamp(yiq2rgb*yiqShift,0.0,1.0);
}

vec4 sigmoid(vec4 x){return 1./(1.+exp(-x));}

vec4 cppn_fn(vec2 coordinate,float in0,float in1,float in2){
    buf[6]=vec4(coordinate.x,coordinate.y,0.3948333106474662+in0,0.36+in1);
    buf[7]=vec4(0.14+in2,sqrt(coordinate.x*coordinate.x+coordinate.y*coordinate.y),0.,0.);
    buf[0]=mat4(vec4(6.5404263,-3.6126034,0.7590882,-1.13613),vec4(2.4582713,3.1660357,1.2219609,0.06276096),vec4(-5.478085,-6.159632,1.8701609,-4.7742867),vec4(6.039214,-5.542865,-0.90925294,3.251348))*buf[6]+mat4(vec4(0.8473259,-5.722911,3.975766,1.6522468),vec4(-0.24321538,0.5839259,-1.7661959,-5.350116),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(0.21808943,1.1243913,-1.7969975,5.0294676);
    buf[1]=mat4(vec4(-3.3522482,-6.0612736,0.55641043,-4.4719114),vec4(0.8631464,1.7432913,5.643898,1.6106541),vec4(2.4941394,-3.5012043,1.7184316,6.357333),vec4(3.310376,8.209261,1.1355612,-1.165539))*buf[6]+mat4(vec4(5.24046,-13.034365,0.009859298,15.870829),vec4(2.987511,3.129433,-0.89023495,-1.6822904),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-5.9457836,-6.573602,-0.8812491,1.5436668);
    buf[0]=sigmoid(buf[0]);buf[1]=sigmoid(buf[1]);
    buf[2]=mat4(vec4(-15.219568,8.095543,-2.429353,-1.9381982),vec4(-5.951362,4.3115187,2.6393783,1.274315),vec4(-7.3145227,6.7297835,5.2473326,5.9411426),vec4(5.0796127,8.979051,-1.7278991,-1.158976))*buf[6]+mat4(vec4(-11.967154,-11.608155,6.1486754,11.237008),vec4(2.124141,-6.263192,-1.7050359,-0.7021966),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-4.17164,-3.2281182,-4.576417,-3.6401186);
    buf[3]=mat4(vec4(3.1832156,-13.738922,1.879223,3.233465),vec4(0.64300746,12.768129,1.9141049,0.50990224),vec4(-0.049295485,4.4807224,1.4733979,1.801449),vec4(5.0039253,13.000481,3.3991797,-4.5561905))*buf[6]+mat4(vec4(-0.1285731,7.720628,-3.1425676,4.742367),vec4(0.6393625,3.714393,-0.8108378,-0.39174938),vec4(0.,0.,0.,0.),vec4(0.,0.,0.,0.))*buf[7]+vec4(-1.1811101,-21.621881,0.7851888,1.2329718);
    buf[2]=sigmoid(buf[2]);buf[3]=sigmoid(buf[3]);
    buf[4]=mat4(vec4(5.214916,-7.183024,2.7228765,2.6592617),vec4(-5.601878,-25.3591,4.067988,0.4602802),vec4(-10.57759,24.286327,21.102104,37.546658),vec4(4.3024497,-1.9625226,2.3458803,-1.372816))*buf[0]+mat4(vec4(-17.6526,-10.507558,2.2587414,12.462782),vec4(6.265566,-502.75443,-12.642513,0.9112289),vec4(-10.983244,20.741234,-9.701768,-0.7635988),vec4(5.383626,1.4819539,-4.1911616,-4.8444734))*buf[1]+mat4(vec4(12.785233,-16.345072,-0.39901125,1.7955981),vec4(-30.48365,-1.8345358,1.4542528,-1.1118771),vec4(19.872723,-7.337935,-42.941723,-98.52709),vec4(8.337645,-2.7312303,-2.2927687,-36.142323))*buf[2]+mat4(vec4(-16.298317,3.5471997,-0.44300047,-9.444417),vec4(57.5077,-35.609753,16.163465,-4.1534753),vec4(-0.07470326,-3.8656476,-7.0901804,3.1523974),vec4(-12.559385,-7.077619,1.490437,-0.8211543))*buf[3]+vec4(-7.67914,15.927437,1.3207729,-1.6686112);
    buf[5]=mat4(vec4(-1.4109162,-0.372762,-3.770383,-21.367174),vec4(-6.2103205,-9.35908,0.92529047,8.82561),vec4(11.460242,-22.348068,13.625772,-18.693201),vec4(-0.3429052,-3.9905605,-2.4626114,-0.45033523))*buf[0]+mat4(vec4(7.3481627,-4.3661838,-6.3037653,-3.868115),vec4(1.5462853,6.5488915,1.9701879,-0.58291394),vec4(6.5858274,-2.2180402,3.7127688,-1.3730392),vec4(-5.7973905,10.134961,-2.3395722,-5.965605))*buf[1]+mat4(vec4(-2.5132585,-6.6685553,-1.4029363,-0.16285264),vec4(-0.37908727,0.53738135,4.389061,-1.3024765),vec4(-0.70647055,2.0111287,-5.1659346,-3.728635),vec4(-13.562562,10.487719,-0.9173751,-2.6487076))*buf[2]+mat4(vec4(-8.645013,6.5546675,-6.3944063,-5.5933375),vec4(-0.57783127,-1.077275,36.91025,5.736769),vec4(14.283112,3.7146652,7.1452246,-4.5958776),vec4(2.7192075,3.6021907,-4.366337,-2.3653464))*buf[3]+vec4(-5.9000807,-4.329569,1.2427121,8.59503);
    buf[4]=sigmoid(buf[4]);buf[5]=sigmoid(buf[5]);
    buf[6]=mat4(vec4(-1.61102,0.7970257,1.4675229,0.20917463),vec4(-28.793737,-7.1390953,1.5025433,4.656581),vec4(-10.94861,39.66238,0.74318546,-10.095605),vec4(-0.7229728,-1.5483948,0.7301322,2.1687684))*buf[0]+mat4(vec4(3.2547753,21.489103,-1.0194173,-3.3100595),vec4(-3.7316632,-3.3792162,-7.223193,-0.23685838),vec4(13.1804495,0.7916005,5.338587,5.687114),vec4(-4.167605,-17.798311,-6.815736,-1.6451967))*buf[1]+mat4(vec4(0.604885,-7.800309,-7.213122,-2.741014),vec4(-3.522382,-0.12359311,-0.5258442,0.43852118),vec4(9.6752825,-22.853785,2.062431,0.099892326),vec4(-4.3196306,-17.730087,2.5184598,5.30267))*buf[2]+mat4(vec4(-6.545563,-15.790176,-6.0438633,-5.415399),vec4(-43.591583,28.551912,-16.00161,18.84728),vec4(4.212382,8.394307,3.0958717,8.657522),vec4(-5.0237565,-4.450633,-4.4768,-5.5010443))*buf[3]+mat4(vec4(1.6985557,-67.05806,6.897715,1.9004834),vec4(1.8680354,2.3915145,2.5231109,4.081538),vec4(11.158006,1.7294737,2.0738268,7.386411),vec4(-4.256034,-306.24686,8.258898,-17.132736))*buf[4]+mat4(vec4(1.6889864,-4.5852966,3.8534803,-6.3482175),vec4(1.3543309,-1.2640043,9.932754,2.9079645),vec4(-5.2770967,0.07150358,-0.13962056,3.3269649),vec4(28.34703,-4.918278,6.1044083,4.085355))*buf[5]+vec4(6.6818056,12.522166,-3.7075126,-4.104386);
    buf[7]=mat4(vec4(-8.265602,-4.7027016,5.098234,0.7509808),vec4(8.6507845,-17.15949,16.51939,-8.884479),vec4(-4.036479,-2.3946867,-2.6055532,-1.9866527),vec4(-2.2167742,-1.8135649,-5.9759874,4.8846445))*buf[0]+mat4(vec4(6.7790847,3.5076547,-2.8191125,-2.7028968),vec4(-5.743024,-0.27844876,1.4958696,-5.0517144),vec4(13.122226,15.735168,-2.9397483,-4.101023),vec4(-14.375265,-5.030483,-6.2599335,2.9848232))*buf[1]+mat4(vec4(4.0950394,-0.94011575,-5.674733,4.755022),vec4(4.3809423,4.8310084,1.7425908,-3.437416),vec4(2.117492,0.16342592,-104.56341,16.949184),vec4(-5.22543,-2.994248,3.8350096,-1.9364246))*buf[2]+mat4(vec4(-5.900337,1.7946124,-13.604192,-3.8060522),vec4(6.6583457,31.911177,25.164474,91.81147),vec4(11.840538,4.1503043,-0.7314397,6.768467),vec4(-6.3967767,4.034772,6.1714606,-0.32874924))*buf[3]+mat4(vec4(3.4992442,-196.91893,-8.923708,2.8142626),vec4(3.4806502,-3.1846354,5.1725626,5.1804223),vec4(-2.4009497,15.585794,1.2863957,2.0252278),vec4(-71.25271,-62.441242,-8.138444,0.50670296))*buf[4]+mat4(vec4(-12.291733,-11.176166,-7.3474145,4.390294),vec4(10.805477,5.6337385,-0.9385842,-4.7348723),vec4(-12.869276,-7.039391,5.3029537,7.5436664),vec4(1.4593618,8.91898,3.5101583,5.840625))*buf[5]+vec4(2.2415268,-6.705987,-0.98861027,-2.117676);
    buf[6]=sigmoid(buf[6]);buf[7]=sigmoid(buf[7]);
    buf[0]=mat4(vec4(1.6794263,1.3817469,2.9625452,0.),vec4(-1.8834411,-1.4806935,-3.5924516,0.),vec4(-1.3279216,-1.0918057,-2.3124623,0.),vec4(0.2662234,0.23235129,0.44178495,0.))*buf[0]+mat4(vec4(-0.6299101,-0.5945583,-0.9125601,0.),vec4(0.17828953,0.18300213,0.18182953,0.),vec4(-2.96544,-2.5819945,-4.9001055,0.),vec4(1.4195864,1.1868085,2.5176322,0.))*buf[1]+mat4(vec4(-1.2584374,-1.0552157,-2.1688404,0.),vec4(-0.7200217,-0.52666044,-1.438251,0.),vec4(0.15345335,0.15196142,0.272854,0.),vec4(0.945728,0.8861938,1.2766753,0.))*buf[2]+mat4(vec4(-2.4218085,-1.968602,-4.35166,0.),vec4(-22.683098,-18.0544,-41.954372,0.),vec4(0.63792,0.5470648,1.1078634,0.),vec4(-1.5489894,-1.3075932,-2.6444845,0.))*buf[3]+mat4(vec4(-0.49252132,-0.39877754,-0.91366625,0.),vec4(0.95609266,0.7923952,1.640221,0.),vec4(0.30616966,0.15693925,0.8639857,0.),vec4(1.1825981,0.94504964,2.176963,0.))*buf[4]+mat4(vec4(0.35446745,0.3293795,0.59547555,0.),vec4(-0.58784515,-0.48177817,-1.0614829,0.),vec4(2.5271258,1.9991658,4.6846647,0.),vec4(0.13042648,0.08864098,0.30187556,0.))*buf[5]+mat4(vec4(-1.7718065,-1.4033192,-3.3355875,0.),vec4(3.1664357,2.638297,5.378702,0.),vec4(-3.1724713,-2.6107926,-5.549295,0.),vec4(-2.851368,-2.249092,-5.3013067,0.))*buf[6]+mat4(vec4(1.5203838,1.2212278,2.8404984,0.),vec4(1.5210563,1.2651345,2.683903,0.),vec4(2.9789467,2.4364579,5.2347264,0.),vec4(2.2270417,1.8825914,3.8028636,0.))*buf[7]+vec4(-1.5468478,-3.6171484,0.24762098,0.);
    buf[0]=sigmoid(buf[0]);
    return vec4(buf[0].x,buf[0].y,buf[0].z,1.);
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 uv=fragCoord/uResolution.xy*2.-1.;
    uv.x *= uResolution.x / uResolution.y;
    uv.y*=-1.;
    uv+=uWarp*vec2(sin(uv.y*6.283+uTime*0.5),cos(uv.x*6.283+uTime*0.5))*0.05;
    fragColor=cppn_fn(uv,0.1*sin(0.3*uTime),0.1*sin(0.69*uTime),0.1*sin(0.44*uTime));
}

void main(){
    vec4 col;mainImage(col,gl_FragCoord.xy);
    col.rgb=hueShiftRGB(col.rgb,uHueShift);
    float scanline_val=sin(gl_FragCoord.y*uScanFreq)*0.5+0.5;
    col.rgb*=1.-(scanline_val*scanline_val)*uScan;
    col.rgb+=(rand(gl_FragCoord.xy+uTime)-0.5)*uNoise;
    gl_FragColor=vec4(clamp(col.rgb,0.0,1.0),1.0);
}
`;
    }
  });

  // dark-veil-init.js
  var require_dark_veil_init = __commonJS({
    "dark-veil-init.js"() {
      init_DarkVeil();
      var root = document.getElementById("gradient-waves-root");
      if (root) {
        mountDarkVeil(root, {
          hueShift: 140,
          // Shifts the color profile to a dark neon green/emerald gradient
          noiseIntensity: 0.03,
          // Delicate grain/noise texture
          scanlineIntensity: 0.06,
          // High-end subtle scanline texture
          speed: 0.15,
          // Smooth, slow, fluid animation pace
          scanlineFrequency: 900,
          // Frequency of the CRT lines
          warpAmount: 0.05,
          // Slight ripple distortion
          resolutionScale: 0.75
          // Optimized scaling for crispness and performance
        });
      }
    }
  });
  require_dark_veil_init();
})();
