// TVPaint Shape-Transform engine — Panning / Transform / Perspective / Warp.
// Behaviour contract taken from the shipped english.tvpaint.loc:
//   000029065 Panning      "used for scaling and panning a layer ... hit enter"
//   000029066 Transform    "used for moving a layer ... adjust scale and position and hit enter"
//   000029067 Perspective  "used to change a layer's perspective ... adjust warp and hit enter"
//   011081144 Warp Tool    "deform an image according to a given rigidity. Holding Shift while
//                           left-click allows to add a pin ... press Enter to validate"
//   011060013 Rigidity     "gives a value (between 1 and 100) to the image's elasticity"
//   011060020              Shift+click lock, Shift+drag select, Ctrl+drag move all,
//                           Ctrl+right-drag resize, Ctrl+Shift+drag rotate
// Image buffers are RGBA {w, h, data: Uint8ClampedArray}.
(function (root) {
  'use strict';

  function createImage(w, h) {
    return { w: w, h: h, data: new Uint8ClampedArray(w * h * 4) };
  }

  function cloneImage(img) {
    return { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) };
  }

  function clearImage(img) {
    img.data.fill(0);
    return img;
  }

  // Bilinear sample; out-of-range returns transparent. Writes into out[0..3].
  function sample(img, x, y, out) {
    const eps = 1e-6; // sub-pixel tolerance so a corner mapped onto the border still samples
    if (x < -eps || y < -eps || x > img.w - 1 + eps || y > img.h - 1 + eps) {
      out[0] = out[1] = out[2] = out[3] = 0;
      return out;
    }
    x = Math.min(Math.max(x, 0), img.w - 1);
    y = Math.min(Math.max(y, 0), img.h - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, img.w - 1), y1 = Math.min(y0 + 1, img.h - 1);
    const fx = x - x0, fy = y - y0;
    const d = img.data;
    const i00 = (y0 * img.w + x0) * 4, i10 = (y0 * img.w + x1) * 4;
    const i01 = (y1 * img.w + x0) * 4, i11 = (y1 * img.w + x1) * 4;
    for (let c = 0; c < 4; c++) {
      const a = d[i00 + c] * (1 - fx) + d[i10 + c] * fx;
      const b = d[i01 + c] * (1 - fx) + d[i11 + c] * fx;
      out[c] = a * (1 - fy) + b * fy;
    }
    return out;
  }

  // Resample `src` through a dest->source coordinate function.
  function resample(src, coordFn, outW, outH) {
    const dst = createImage(outW || src.w, outH || src.h);
    const px = [0, 0, 0, 0];
    for (let y = 0; y < dst.h; y++) {
      for (let x = 0; x < dst.w; x++) {
        coordFn(x, y, px);
        sample(src, px[0], px[1], px);
        const o = (y * dst.w + x) * 4;
        dst.data[o] = px[0]; dst.data[o + 1] = px[1];
        dst.data[o + 2] = px[2]; dst.data[o + 3] = px[3];
      }
    }
    return dst;
  }

  // ---------------------------------------------------------------- affine
  // Panning / Transform state: dest = (src - centre) * scale + centre + translate.
  function createAffine(opts) {
    const o = opts || {};
    return {
      mode: o.mode || 'transform',       // 'panning' | 'transform'
      w: o.w || 0, h: o.h || 0,          // image size, needed to scale about the centre
      sx: o.sx === undefined ? 1 : o.sx,
      sy: o.sy === undefined ? 1 : o.sy,
      tx: o.tx || 0,
      ty: o.ty || 0,
      dragging: false,
      _op: null, _drag: -1,
      // down/move/up are the pointer contract the UI drives (000029065/66):
      // drag the body to move, drag a corner handle to scale about the centre.
      down: function (x, y, op) {
        const o2 = op || {};
        this._px = x; this._py = y;
        this._tx0 = this.tx; this._ty0 = this.ty;
        this._sx0 = this.sx; this._sy0 = this.sy;
        this._op = 'move';
        if (o2.button !== 2 && this.w && this.h) {
          const cx = (this.w - 1) / 2, cy = (this.h - 1) / 2;
          const corners = [[0, 0], [this.w, 0], [this.w, this.h], [0, this.h]];
          for (let i = 0; i < 4; i++) {
            const gx = corners[i][0] * this.sx + cx * (1 - this.sx) + this.tx;
            const gy = corners[i][1] * this.sy + cy * (1 - this.sy) + this.ty;
            if (Math.hypot(gx - x, gy - y) < 12) { this._op = 'scale'; this._drag = i; break; }
          }
        }
        this.dragging = true;
        return this;
      },
      move: function (x, y) {
        if (!this.dragging) return this;
        const dx = x - this._px, dy = y - this._py;
        if (this._op === 'scale' && this.w && this.h) {
          const signX = (this._drag === 0 || this._drag === 3) ? -1 : 1;
          const signY = (this._drag === 0 || this._drag === 1) ? -1 : 1;
          const baseX = Math.max(1, this.w / 2), baseY = Math.max(1, this.h / 2);
          this.sx = Math.max(0.01, this._sx0 * (1 + signX * dx / baseX));
          this.sy = Math.max(0.01, this._sy0 * (1 + signY * dy / baseY));
          this.tx = this._tx0; this.ty = this._ty0;   // scale about the centre
        } else {
          this.tx = this._tx0 + dx; this.ty = this._ty0 + dy;
        }
        return this;
      },
      up: function () { this.dragging = false; this._op = null; this._drag = -1; return this; },
      // the apply entry point the UI calls: eng.render({w,h,data}) -> {w,h,data}
      render: function (img) { return applyAffine(img, this); }
    };
  }

  function affineIsDirty(s) {
    return s.sx !== 1 || s.sy !== 1 || s.tx !== 0 || s.ty !== 0;
  }

  function affineReset(s) {
    s.sx = 1; s.sy = 1; s.tx = 0; s.ty = 0;
    return s;
  }

  function applyAffine(src, s) {
    const cx = (src.w - 1) / 2, cy = (src.h - 1) / 2;
    const sx = Math.abs(s.sx) < 1e-4 ? 1e-4 : s.sx;
    const sy = Math.abs(s.sy) < 1e-4 ? 1e-4 : s.sy;
    return resample(src, function (x, y, out) {
      out[0] = ((x - s.tx - cx) / sx) + cx;
      out[1] = ((y - s.ty - cy) / sy) + cy;
    });
  }

  // ----------------------------------------------------------- perspective
  // 3x3 homography, row-major, mapping source -> dest.
  function solveLinear(A, b, n) {
    const m = A.map(function (row, i) { return row.concat([b[i]]); });
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[piv][col])) piv = r;
      if (Math.abs(m[piv][col]) < 1e-12) return null;
      const t = m[col]; m[col] = m[piv]; m[piv] = t;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = m[r][col] / m[col][col];
        if (!f) continue;
        for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
      }
    }
    return m.map(function (row, i) { return row[n] / row[i]; });
  }

  // quad = [[x,y] x4] in destinations for the source corners TL, TR, BR, BL.
  function homographyForQuad(w, h, quad) {
    const src = [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]];
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const X = src[i][0], Y = src[i][1], u = quad[i][0], v = quad[i][1];
      A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]); b.push(u);
      A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]); b.push(v);
    }
    const s = solveLinear(A, b, 8);
    if (!s) return null;
    return [s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], 1];
  }

  function invert3(H) {
    const a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7], i = H[8];
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * B + c * C;
    if (Math.abs(det) < 1e-12) return null;
    return [
      A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
      B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
      C / det, -(a * h - b * g) / det, (a * e - b * d) / det
    ];
  }

  function createPerspective(w, h) {
    return {
      mode: 'perspective',
      quad: [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]],
      base: [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]],
      dragging: -1,
      // 4-point warp: grab the nearest corner and drag it (000029067).
      down: function (x, y) {
        let best = 0, bd = Infinity;
        for (let i = 0; i < 4; i++) {
          const d = (this.quad[i][0] - x) * (this.quad[i][0] - x) +
                    (this.quad[i][1] - y) * (this.quad[i][1] - y);
          if (d < bd) { bd = d; best = i; }
        }
        this.dragging = best;
        return this;
      },
      move: function (x, y) {
        if (this.dragging < 0) return this;
        this.quad[this.dragging][0] = x;
        this.quad[this.dragging][1] = y;
        return this;
      },
      up: function () { this.dragging = -1; return this; },
      render: function (img) { return applyPerspective(img, this); }
    };
  }

  function perspectiveIsDirty(p) {
    for (let i = 0; i < 4; i++) {
      if (Math.abs(p.quad[i][0] - p.base[i][0]) > 1e-6) return true;
      if (Math.abs(p.quad[i][1] - p.base[i][1]) > 1e-6) return true;
    }
    return false;
  }

  function perspectiveReset(p) {
    for (let i = 0; i < 4; i++) { p.quad[i][0] = p.base[i][0]; p.quad[i][1] = p.base[i][1]; }
    return p;
  }

  function applyPerspective(src, p) {
    const H = homographyForQuad(src.w, src.h, p.quad);
    if (!H) return cloneImage(src);
    const inv = invert3(H);
    if (!inv) return cloneImage(src);
    return resample(src, function (x, y, out) {
      const wq = inv[6] * x + inv[7] * y + inv[8];
      out[0] = (inv[0] * x + inv[1] * y + inv[2]) / wq;
      out[1] = (inv[3] * x + inv[4] * y + inv[5]) / wq;
    }, src.w, src.h);
  }

  // ---------------------------------------------------------------- warp
  // A lattice of points: base(c,r) = origin + c*u + r*v, each carrying a
  // displacement (dx,dy). Locked points are pins and never move.
  function createWarp(w, h, squareSize, rigidity) {
    const size = Math.max(4, Math.min(100, squareSize || 24));
    const cols = Math.max(2, Math.round((w - 1) / size) + 1);
    const rows = Math.max(2, Math.round((h - 1) / size) + 1);
    const points = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) points.push({ dx: 0, dy: 0, locked: false });
    }
    return {
      mode: 'warp',
      w: w, h: h, size: size, cols: cols, rows: rows,
      origin: { x: 0, y: 0 },
      u: { x: (w - 1) / (cols - 1), y: 0 },
      v: { x: 0, y: (h - 1) / (rows - 1) },
      rigidity: rigidity === undefined ? 50 : rigidity,
      points: points,
      dragging: false, _op: null, _dragIndex: -1, _px: 0, _py: 0,
      // The modifier set of 011060020: Shift+click pins, left-drag moves a
      // point, Ctrl+drag moves the lattice, Ctrl+right-drag resizes,
      // Ctrl+Shift+drag rotates. These are the pointer methods the UI calls.
      down: function (x, y, op) {
        const o = op || {};
        this._px = x; this._py = y;
        const ctrl = !!o.ctrl, shift = !!o.shift;
        if (ctrl && shift) { this._op = 'rotate'; this.dragging = true; return this; }
        if (ctrl) { this._op = o.button === 2 ? 'resize' : 'moveall'; this.dragging = true; return this; }
        if (shift) {
          const i = warpPointAt(this, x, y, 14);
          if (i >= 0) warpToggleLock(this, i);
          this._op = null; this.dragging = false;
          return this;
        }
        this._op = 'point';
        this._dragIndex = warpPointAt(this, x, y, 24);
        this.dragging = true;
        return this;
      },
      move: function (x, y) {
        if (!this.dragging) return this;
        const dx = x - this._px, dy = y - this._py;
        if (this._op === 'point') {
          if (this._dragIndex >= 0) warpDrag(this, this._dragIndex, x, y);
        } else if (this._op === 'moveall') {
          warpMoveAll(this, dx, dy);
        } else if (this._op === 'resize') {
          const half = Math.max(1, (this.w - 1) / 2);
          const k = 1 + dx / half;
          if (k > 0.01) warpResize(this, k);
        } else if (this._op === 'rotate') {
          warpRotate(this, dx * 0.01);
        }
        this._px = x; this._py = y;
        return this;
      },
      up: function () { this.dragging = false; this._op = null; this._dragIndex = -1; return this; },
      render: function (img) { return applyWarp(img, this); }
    };
  }

  function warpBase(wp, c, r) {
    return {
      x: wp.origin.x + c * wp.u.x + r * wp.v.x,
      y: wp.origin.y + c * wp.u.y + r * wp.v.y
    };
  }

  function warpIsDirty(wp) {
    return wp.points.some(function (p) { return p.dx !== 0 || p.dy !== 0; });
  }

  function warpReset(wp) {
    wp.points.forEach(function (p) { p.dx = 0; p.dy = 0; p.locked = false; });
    return wp;
  }

  // Index of the closest grid point to a pointer position (after displacement).
  function warpPointAt(wp, x, y, radius) {
    let best = -1;
    let bd = (radius || 12) * (radius || 12);
    for (let r = 0; r < wp.rows; r++) {
      for (let c = 0; c < wp.cols; c++) {
        const i = r * wp.cols + c;
        const b = warpBase(wp, c, r);
        const p = wp.points[i];
        const d = (b.x + p.dx - x) * (b.x + p.dx - x) + (b.y + p.dy - y) * (b.y + p.dy - y);
        if (d < bd) { bd = d; best = i; }
      }
    }
    return best;
  }

  // Drag one point. Rigidity widens the falloff: 1 = very local, 100 = the
  // whole neighbourhood follows (011060013 "elasticity").
  function warpDrag(wp, index, x, y) {
    if (index < 0 || index >= wp.points.length) return wp;
    const p = wp.points[index];
    if (p.locked) return wp;
    const c0 = index % wp.cols, r0 = (index - c0) / wp.cols;
    const b0 = warpBase(wp, c0, r0);
    const ndx = x - b0.x, ndy = y - b0.y;
    const ddx = ndx - p.dx, ddy = ndy - p.dy;
    const rigidity = Math.max(1, Math.min(100, wp.rigidity));
    const reach = wp.size * (1 + rigidity / 25);
    for (let r = 0; r < wp.rows; r++) {
      for (let c = 0; c < wp.cols; c++) {
        const i = r * wp.cols + c;
        if (i === index) continue;
        const q = wp.points[i];
        if (q.locked) continue;
        const b = warpBase(wp, c, r);
        const d = Math.hypot(b.x - b0.x, b.y - b0.y);
        const wgt = Math.exp(-(d / reach) * (d / reach));
        if (wgt > 0.002) { q.dx += ddx * wgt; q.dy += ddy * wgt; }
      }
    }
    p.dx = ndx;
    p.dy = ndy;
    return wp;
  }

  // Shift+click: pin / unpin (a pin drops its displacement).
  function warpToggleLock(wp, index) {
    const p = wp.points[index];
    if (!p) return wp;
    p.locked = !p.locked;
    if (p.locked) { p.dx = 0; p.dy = 0; }
    return wp;
  }

  // Ctrl+drag: move the whole lattice (and with it the deformation).
  function warpMoveAll(wp, dx, dy) {
    wp.origin.x += dx; wp.origin.y += dy;
    return wp;
  }

  // Ctrl+right-drag: resize the lattice.
  function warpResize(wp, k) {
    if (!(k > 0)) return wp;
    const cx = (wp.w - 1) / 2, cy = (wp.h - 1) / 2;
    ['u', 'v'].forEach(function (axis) {
      wp[axis].x *= k; wp[axis].y *= k;
    });
    wp.origin.x = cx + (wp.origin.x - cx) * k;
    wp.origin.y = cy + (wp.origin.y - cy) * k;
    return wp;
  }

  // Ctrl+Shift+drag: rotate the lattice.
  function warpRotate(wp, angle) {
    const cx = (wp.w - 1) / 2, cy = (wp.h - 1) / 2;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const rot = function (x, y) { return { x: x * ca - y * sa, y: x * sa + y * ca }; };
    ['u', 'v'].forEach(function (axis) {
      const p = rot(wp[axis].x, wp[axis].y);
      wp[axis].x = p.x; wp[axis].y = p.y;
    });
    const o = rot(wp.origin.x - cx, wp.origin.y - cy);
    wp.origin.x = cx + o.x; wp.origin.y = cy + o.y;
    return wp;
  }

  // Lattice coordinates of a destination pixel (inverse of base()).
  function warpCoord(wp, x, y) {
    const det = wp.u.x * wp.v.y - wp.u.y * wp.v.x;
    if (Math.abs(det) < 1e-9) return { c: 0, r: 0, u: 0, v: 0 };
    const px = x - wp.origin.x, py = y - wp.origin.y;
    const c = (px * wp.v.y - py * wp.v.x) / det;
    const r = (wp.u.x * py - wp.u.y * px) / det;
    const cc = Math.max(0, Math.min(wp.cols - 1 - 1e-6, c));
    const rr = Math.max(0, Math.min(wp.rows - 1 - 1e-6, r));
    return { c: Math.floor(cc), r: Math.floor(rr), u: cc - Math.floor(cc), v: rr - Math.floor(rr) };
  }

  function applyWarp(src, wp) {
    return resample(src, function (x, y, out) {
      const q = warpCoord(wp, x, y);
      const i00 = q.r * wp.cols + q.c;
      const i10 = i00 + 1, i01 = i00 + wp.cols, i11 = i01 + 1;
      const p00 = wp.points[i00], p10 = wp.points[i10];
      const p01 = wp.points[i01], p11 = wp.points[i11];
      const dx = (p00.dx * (1 - q.u) + p10.dx * q.u) * (1 - q.v) + (p01.dx * (1 - q.u) + p11.dx * q.u) * q.v;
      const dy = (p00.dy * (1 - q.u) + p10.dy * q.u) * (1 - q.v) + (p01.dy * (1 - q.u) + p11.dy * q.u) * q.v;
      out[0] = x - dx;
      out[1] = y - dy;
    }, src.w, src.h);
  }

  // ------------------------------------------------------------- apply layer
  // Enter applies to the chosen target; animated layers get the same render on
  // every selected image ("undo, then select all images and hit enter").
  function applyToLayers(images, render) {
    return images.map(function (img) { return render(img); });
  }

  const api = {
    createImage: createImage,
    cloneImage: cloneImage,
    clearImage: clearImage,
    sample: sample,
    resample: resample,
    createAffine: createAffine,
    affineIsDirty: affineIsDirty,
    affineReset: affineReset,
    applyAffine: applyAffine,
    homographyForQuad: homographyForQuad,
    invert3: invert3,
    createPerspective: createPerspective,
    perspectiveIsDirty: perspectiveIsDirty,
    perspectiveReset: perspectiveReset,
    applyPerspective: applyPerspective,
    createWarp: createWarp,
    warpBase: warpBase,
    warpIsDirty: warpIsDirty,
    warpReset: warpReset,
    warpPointAt: warpPointAt,
    warpDrag: warpDrag,
    warpToggleLock: warpToggleLock,
    warpMoveAll: warpMoveAll,
    warpResize: warpResize,
    warpRotate: warpRotate,
    warpCoord: warpCoord,
    applyWarp: applyWarp,
    applyToLayers: applyToLayers
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TVPTransform = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
