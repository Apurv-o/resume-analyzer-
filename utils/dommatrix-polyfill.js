// Server-side DOMMatrix/DOMMatrixReadOnly polyfill for Node.js serverless runtimes
// (Netlify Functions / OpenNext, AWS Lambda, etc.).
//
// WHY: pdfjs-dist (bundled inside `pdf-parse`) declares browser-only globals at
// module scope and at runtime — e.g. `const SCALE_MATRIX = new DOMMatrix()` in
// its `display/canvas.js` chunk. Node.js has no `DOMMatrix` global (verified:
// `typeof DOMMatrix === 'undefined'`), so whenever that code is evaluated in a
// serverless bundle Netlify raises `ReferenceError: DOMMatrix is not defined`.
//
// This module installs a small, dependency-free, spec-faithful 2D affine
// `DOMMatrix` (and `DOMMatrixReadOnly`) onto `globalThis` BEFORE `pdf-parse`
// is imported, so pdf.js resolves the bare `DOMMatrix` identifier successfully.
// Only the 2D subset pdf.js actually uses is implemented. It is inert in
// browsers and on the DOCX (`mammoth`) path.

function installDOMMatrixPolyfill() {
  if (typeof globalThis.DOMMatrix !== 'undefined') {
    return; // real/browser implementation already present
  }

  const EPSILON = 1e-10;

  class DOMMatrix {
    // 2D affine components: a b c d e f (column-vector convention:
    // x' = a*x + c*y + e; y' = b*x + d*y + f)
    constructor(init) {
      this.is2D = true;
      this._m = [1, 0, 0, 1, 0, 0];
      if (init == null) return;

      if (typeof init === 'string') {
        const m = /matrix\(\s*(.*?)\s*\)/.exec(init.trim());
        if (m) this.set(this._parseList(m[1]));
        return;
      }
      if (Array.isArray(init) || ArrayBuffer.isView(init)) {
        const arr = Array.from(init).map(Number);
        if (arr.length === 6) this.set(arr);
        if (arr.length === 16) this.set([arr[0], arr[1], arr[4], arr[5], arr[12], arr[13]]);
        return;
      }
      if (typeof init === 'object') {
        const o = init;
        if (typeof o.a === 'number' && typeof o.b === 'number' && typeof o.c === 'number' && typeof o.d === 'number' && typeof o.e === 'number' && typeof o.f === 'number') {
          this.set([o.a, o.b, o.c, o.d, o.e, o.f]);
        } else if (typeof o.m11 === 'number') {
          this.set([o.m11, o.m12, o.m21, o.m22, o.m41, o.m42]);
        }
      }
    }

    get a() { return this._m[0]; } set a(v) { this._m[0] = v; }
    get b() { return this._m[1]; } set b(v) { this._m[1] = v; }
    get c() { return this._m[2]; } set c(v) { this._m[2] = v; }
    get d() { return this._m[3]; } set d(v) { this._m[3] = v; }
    get e() { return this._m[4]; } set e(v) { this._m[4] = v; }
    get f() { return this._m[5]; } set f(v) { this._m[5] = v; }

    get m11() { return this._m[0]; } set m11(v) { this._m[0] = v; }
    get m12() { return this._m[1]; } set m12(v) { this._m[1] = v; }
    get m13() { return 0; }
    get m14() { return 0; }
    get m21() { return this._m[2]; } set m21(v) { this._m[2] = v; }
    get m22() { return this._m[3]; } set m22(v) { this._m[3] = v; }
    get m23() { return 0; }
    get m24() { return 0; }
    get m31() { return 0; }
    get m32() { return 0; }
    get m33() { return 1; }
    get m34() { return 0; }
    get m41() { return this._m[4]; } set m41(v) { this._m[4] = v; }
    get m42() { return this._m[5]; } set m42(v) { this._m[5] = v; }
    get m43() { return 0; }
    get m44() { return 1; }

    set(arr) {
      const n = arr.map(Number);
      if (n.length === 6) this._m = n;
      return this;
    }

    static fromMatrix(other) {
      const m = new DOMMatrix();
      m.set([other.a, other.b, other.c, other.d, other.e, other.f]);
      return m;
    }
    static fromFloat32Array(arr) { return new DOMMatrix(arr); }
    static fromFloat64Array(arr) { return new DOMMatrix(arr); }

    // this * other  (column-vector convention: other applied first)
    multiply(other) {
      const A = this._m, B = [other.a, other.b, other.c, other.d, other.e, other.f];
      return new DOMMatrix([
        A[0] * B[0] + A[2] * B[1],
        A[1] * B[0] + A[3] * B[1],
        A[0] * B[2] + A[2] * B[3],
        A[1] * B[2] + A[3] * B[3],
        A[0] * B[4] + A[2] * B[5] + A[4],
        A[1] * B[4] + A[3] * B[5] + A[5],
      ]);
    }
    multiplySelf(other) { return this.set(this.multiply(other)._m); }
    preMultiplySelf(other) { return this.set(other.multiply(this)._m); }
    translateSelf(tx, ty) { return this.multiplySelf(new DOMMatrix([1, 0, 0, 1, tx, ty ?? 0])); }
    translate(tx, ty) { return this.multiply(new DOMMatrix([1, 0, 0, 1, tx, ty ?? 0])); }
    scaleSelf(sx, sy) {
      if (sy === undefined) sy = sx;
      return this.multiplySelf(new DOMMatrix([sx, 0, 0, sy, 0, 0]));
    }
    scale(sx, sy) {
      if (sy === undefined) sy = sx;
      return this.multiply(new DOMMatrix([sx, 0, 0, sy, 0, 0]));
    }
    invert() {
      const [a, b, c, d, e, f] = this._m;
      const det = a * d - b * c;
      if (Math.abs(det) < EPSILON) return DOMMatrix.fromMatrix(this); // not invertible: return copy
      return new DOMMatrix([d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]);
    }
    invertSelf() { return this.set(this.invert()._m); }
    transformPoint(point) {
      const [a, b, c, d, e, f] = this._m;
      return {
        x: a * point.x + c * point.y + e,
        y: b * point.x + d * point.y + f,
      };
    }
    get isIdentity() {
      const [a, b, c, d, e, f] = this._m;
      return Math.abs(a - 1) < EPSILON && Math.abs(b) < EPSILON && Math.abs(c) < EPSILON && Math.abs(d - 1) < EPSILON && Math.abs(e) < EPSILON && Math.abs(f) < EPSILON;
    }
    toString() {
      const fmt = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(4)));
      return `matrix(${fmt(this.a)},${fmt(this.b)},${fmt(this.c)},${fmt(this.d)},${fmt(this.e)},${fmt(this.f)})`;
    }
    _parseList(s) {
      return s.split(/[\s,]+/).filter((x) => x !== '').map(Number);
    }
  }

  class DOMMatrixReadOnly extends DOMMatrix {}

  globalThis.DOMMatrix = DOMMatrix;
  globalThis.DOMMatrixReadOnly = DOMMatrixReadOnly;
}

installDOMMatrixPolyfill();

export { installDOMMatrixPolyfill };