"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/konva/lib/Global.js
  var PI_OVER_180 = Math.PI / 180;
  function detectBrowser() {
    return typeof window !== "undefined" && ({}.toString.call(window) === "[object Window]" || {}.toString.call(window) === "[object global]");
  }
  var glob = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof WorkerGlobalScope !== "undefined" ? self : {};
  var Konva = {
    _global: glob,
    version: "10.3.3",
    isBrowser: detectBrowser(),
    isUnminified: /param/.test(function(param) {
    }.toString()),
    dblClickWindow: 400,
    getAngle(angle) {
      return Konva.angleDeg ? angle * PI_OVER_180 : angle;
    },
    enableTrace: false,
    pointerEventsEnabled: true,
    autoDrawEnabled: true,
    hitOnDragEnabled: false,
    capturePointerEventsEnabled: false,
    _mouseListenClick: false,
    _touchListenClick: false,
    _pointerListenClick: false,
    _mouseInDblClickWindow: false,
    _touchInDblClickWindow: false,
    _pointerInDblClickWindow: false,
    _mouseDblClickPointerId: null,
    _touchDblClickPointerId: null,
    _pointerDblClickPointerId: null,
    _renderBackend: "web",
    legacyTextRendering: false,
    pixelRatio: typeof window !== "undefined" && window.devicePixelRatio || 1,
    dragDistance: 3,
    angleDeg: true,
    showWarnings: true,
    dragButtons: [0, 1],
    isDragging() {
      return Konva["DD"].isDragging;
    },
    isTransforming() {
      var _a, _b;
      return (_b = (_a = Konva["Transformer"]) === null || _a === void 0 ? void 0 : _a.isTransforming()) !== null && _b !== void 0 ? _b : false;
    },
    isDragReady() {
      return !!Konva["DD"].node;
    },
    releaseCanvasOnDestroy: true,
    document: glob.document,
    _injectGlobal(Konva4) {
      if (typeof glob.Konva !== "undefined") {
        console.error("Several Konva instances detected. It is not recommended to use multiple Konva instances in the same environment.");
      }
      glob.Konva = Konva4;
    }
  };
  var _registerNode = (NodeClass) => {
    Konva[NodeClass.prototype.getClassName()] = NodeClass;
  };
  Konva._injectGlobal(Konva);

  // node_modules/konva/lib/Util.js
  var NODE_ERROR = `Konva.js unsupported environment.

Looks like you are trying to use Konva.js in Node.js environment. because "document" object is undefined.

To use Konva.js in Node.js environment, you need to use the "canvas-backend" or "skia-backend" module.

bash: npm install canvas
js: import "konva/canvas-backend";

or

bash: npm install skia-canvas
js: import "konva/skia-backend";
`;
  var ensureBrowser = () => {
    if (typeof document === "undefined") {
      throw new Error(NODE_ERROR);
    }
  };
  var Transform = class _Transform {
    constructor(m3 = [1, 0, 0, 1, 0, 0]) {
      this.dirty = false;
      this.m = m3 && m3.slice() || [1, 0, 0, 1, 0, 0];
    }
    reset() {
      this.m[0] = 1;
      this.m[1] = 0;
      this.m[2] = 0;
      this.m[3] = 1;
      this.m[4] = 0;
      this.m[5] = 0;
    }
    copy() {
      return new _Transform(this.m);
    }
    copyInto(tr) {
      tr.m[0] = this.m[0];
      tr.m[1] = this.m[1];
      tr.m[2] = this.m[2];
      tr.m[3] = this.m[3];
      tr.m[4] = this.m[4];
      tr.m[5] = this.m[5];
    }
    point(point) {
      const m3 = this.m;
      return {
        x: m3[0] * point.x + m3[2] * point.y + m3[4],
        y: m3[1] * point.x + m3[3] * point.y + m3[5]
      };
    }
    translate(x2, y3) {
      this.m[4] += this.m[0] * x2 + this.m[2] * y3;
      this.m[5] += this.m[1] * x2 + this.m[3] * y3;
      return this;
    }
    scale(sx, sy) {
      this.m[0] *= sx;
      this.m[1] *= sx;
      this.m[2] *= sy;
      this.m[3] *= sy;
      return this;
    }
    rotate(rad) {
      const c4 = Math.cos(rad);
      const s4 = Math.sin(rad);
      const m11 = this.m[0] * c4 + this.m[2] * s4;
      const m12 = this.m[1] * c4 + this.m[3] * s4;
      const m21 = this.m[0] * -s4 + this.m[2] * c4;
      const m22 = this.m[1] * -s4 + this.m[3] * c4;
      this.m[0] = m11;
      this.m[1] = m12;
      this.m[2] = m21;
      this.m[3] = m22;
      return this;
    }
    getTranslation() {
      return {
        x: this.m[4],
        y: this.m[5]
      };
    }
    skew(sx, sy) {
      const m11 = this.m[0] + this.m[2] * sy;
      const m12 = this.m[1] + this.m[3] * sy;
      const m21 = this.m[2] + this.m[0] * sx;
      const m22 = this.m[3] + this.m[1] * sx;
      this.m[0] = m11;
      this.m[1] = m12;
      this.m[2] = m21;
      this.m[3] = m22;
      return this;
    }
    multiply(matrix) {
      const m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
      const m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];
      const m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
      const m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];
      const dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
      const dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];
      this.m[0] = m11;
      this.m[1] = m12;
      this.m[2] = m21;
      this.m[3] = m22;
      this.m[4] = dx;
      this.m[5] = dy;
      return this;
    }
    invert() {
      const d2 = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
      const m0 = this.m[3] * d2;
      const m1 = -this.m[1] * d2;
      const m22 = -this.m[2] * d2;
      const m3 = this.m[0] * d2;
      const m4 = d2 * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
      const m5 = d2 * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
      this.m[0] = m0;
      this.m[1] = m1;
      this.m[2] = m22;
      this.m[3] = m3;
      this.m[4] = m4;
      this.m[5] = m5;
      return this;
    }
    getMatrix() {
      return this.m;
    }
    decompose() {
      const a3 = this.m[0];
      const b3 = this.m[1];
      const c4 = this.m[2];
      const d2 = this.m[3];
      const e3 = this.m[4];
      const f3 = this.m[5];
      const delta = a3 * d2 - b3 * c4;
      const result = {
        x: e3,
        y: f3,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
        skewX: 0,
        skewY: 0
      };
      if (a3 != 0 || b3 != 0) {
        const r5 = Math.sqrt(a3 * a3 + b3 * b3);
        result.rotation = b3 > 0 ? Math.acos(a3 / r5) : -Math.acos(a3 / r5);
        result.scaleX = r5;
        result.scaleY = delta / r5;
        result.skewX = (a3 * c4 + b3 * d2) / delta;
        result.skewY = 0;
      } else if (c4 != 0 || d2 != 0) {
        const s4 = Math.sqrt(c4 * c4 + d2 * d2);
        result.rotation = Math.PI / 2 - (d2 > 0 ? Math.acos(-c4 / s4) : -Math.acos(c4 / s4));
        result.scaleX = delta / s4;
        result.scaleY = s4;
        result.skewX = 0;
        result.skewY = (a3 * c4 + b3 * d2) / delta;
      } else {
      }
      result.rotation = Util._getRotation(result.rotation);
      return result;
    }
  };
  var OBJECT_ARRAY = "[object Array]";
  var OBJECT_NUMBER = "[object Number]";
  var OBJECT_STRING = "[object String]";
  var OBJECT_BOOLEAN = "[object Boolean]";
  var PI_OVER_DEG180 = Math.PI / 180;
  var DEG180_OVER_PI = 180 / Math.PI;
  var HASH = "#";
  var EMPTY_STRING = "";
  var ZERO = "0";
  var KONVA_WARNING = "Konva warning: ";
  var KONVA_ERROR = "Konva error: ";
  var COLORS = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    transparent: [255, 255, 255, 0],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
  };
  var _isCanvasFarblingActive = null;
  var defaultWindow = typeof window !== "undefined" ? window : {};
  var animQueues = /* @__PURE__ */ new WeakMap();
  var requestFrame = (win, f3) => {
    if (typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(f3);
    } else if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(f3);
    } else {
      setTimeout(f3, 16);
    }
  };
  var capitalizeCache = /* @__PURE__ */ new Map();
  var splitColorComponents = (str2) => {
    const components = str2.trim();
    return components.indexOf(",") === -1 ? components.split(/\s*\/\s*|\s+/) : components.split(/\s*,\s*/);
  };
  var NUMBER_SOURCE = "[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?";
  var COLOR_COMPONENT_REGEX = new RegExp(`^(${NUMBER_SOURCE})(%?)$`, "i");
  var parseColorComponent = (value, max) => {
    const match = COLOR_COMPONENT_REGEX.exec(value);
    if (!match) {
      return NaN;
    }
    return match[2] ? Number(match[1]) / 100 * max : Number(match[1]);
  };
  var HEX_COLOR_REGEX = /^#[0-9a-f]+$/i;
  var clamp01 = (value) => Math.min(Math.max(value, 0), 1);
  var HUE_REGEX = new RegExp(`^(${NUMBER_SOURCE})(deg|grad|rad|turn)?$`, "i");
  var HUE_UNITS = {
    deg: 1,
    grad: 0.9,
    rad: DEG180_OVER_PI,
    turn: 360
  };
  var Util = {
    _isElement(obj) {
      return !!(obj && obj.nodeType == 1);
    },
    _isFunction(obj) {
      return !!(obj && obj.constructor && obj.call && obj.apply);
    },
    _isPlainObject(obj) {
      return !!obj && obj.constructor === Object;
    },
    _isArray(obj) {
      return Object.prototype.toString.call(obj) === OBJECT_ARRAY;
    },
    _isNumber(obj) {
      return Object.prototype.toString.call(obj) === OBJECT_NUMBER && !isNaN(obj) && isFinite(obj);
    },
    _isString(obj) {
      return Object.prototype.toString.call(obj) === OBJECT_STRING;
    },
    _isBoolean(obj) {
      return Object.prototype.toString.call(obj) === OBJECT_BOOLEAN;
    },
    isObject(val) {
      return val instanceof Object;
    },
    isValidSelector(selector) {
      if (typeof selector !== "string") {
        return false;
      }
      const firstChar = selector[0];
      return firstChar === "#" || firstChar === "." || firstChar === firstChar.toUpperCase();
    },
    _sign(number) {
      if (number === 0) {
        return 1;
      }
      if (number > 0) {
        return 1;
      } else {
        return -1;
      }
    },
    requestAnimFrame(callback, win) {
      const target = win && !win.closed && win || defaultWindow;
      let queue = animQueues.get(target);
      if (!queue) {
        queue = [];
        animQueues.set(target, queue);
        requestFrame(target, function() {
          animQueues.delete(target);
          queue.forEach(function(cb) {
            cb();
          });
        });
      }
      queue.push(callback);
    },
    createCanvasElement() {
      ensureBrowser();
      const canvas = document.createElement("canvas");
      try {
        canvas.style = canvas.style || {};
      } catch (e3) {
      }
      return canvas;
    },
    createImageElement() {
      ensureBrowser();
      return document.createElement("img");
    },
    _isInDocument(el) {
      return !!el.isConnected;
    },
    _urlToImage(url, callback) {
      const imageObj = Util.createImageElement();
      imageObj.onload = function() {
        callback(imageObj);
      };
      imageObj.src = url;
    },
    _rgbToHex(r5, g3, b3) {
      return ((1 << 24) + (r5 << 16) + (g3 << 8) + b3).toString(16).slice(1);
    },
    _hexToRgb(hex) {
      hex = hex.replace(HASH, EMPTY_STRING);
      const bigint = parseInt(hex, 16);
      return {
        r: bigint >> 16 & 255,
        g: bigint >> 8 & 255,
        b: bigint & 255
      };
    },
    getRandomColor() {
      let randColor = (Math.random() * 16777215 << 0).toString(16);
      while (randColor.length < 6) {
        randColor = ZERO + randColor;
      }
      return HASH + randColor;
    },
    isCanvasFarblingActive() {
      if (_isCanvasFarblingActive !== null) {
        return _isCanvasFarblingActive;
      }
      if (typeof document === "undefined") {
        _isCanvasFarblingActive = false;
        return false;
      }
      const c4 = this.createCanvasElement();
      c4.width = 10;
      c4.height = 10;
      const ctx = c4.getContext("2d", {
        willReadFrequently: true
      });
      ctx.clearRect(0, 0, 10, 10);
      ctx.fillStyle = "#282828";
      ctx.fillRect(0, 0, 10, 10);
      const d2 = ctx.getImageData(0, 0, 10, 10).data;
      let isFarbling = false;
      for (let i3 = 0; i3 < 100; i3++) {
        if (d2[i3 * 4] !== 40 || d2[i3 * 4 + 1] !== 40 || d2[i3 * 4 + 2] !== 40 || d2[i3 * 4 + 3] !== 255) {
          isFarbling = true;
          break;
        }
      }
      _isCanvasFarblingActive = isFarbling;
      this.releaseCanvas(c4);
      return _isCanvasFarblingActive;
    },
    getHitColor() {
      const color = this.getRandomColor();
      return this.isCanvasFarblingActive() ? this.getSnappedHexColor(color) : color;
    },
    getHitColorKey(r5, g3, b3) {
      if (this.isCanvasFarblingActive()) {
        r5 = Math.round(r5 / 5) * 5;
        g3 = Math.round(g3 / 5) * 5;
        b3 = Math.round(b3 / 5) * 5;
      }
      return HASH + this._rgbToHex(r5, g3, b3);
    },
    getSnappedHexColor(hex) {
      const rgb = this._hexToRgb(hex);
      return HASH + this._rgbToHex(Math.round(rgb.r / 5) * 5, Math.round(rgb.g / 5) * 5, Math.round(rgb.b / 5) * 5);
    },
    getRGB(color) {
      var _a;
      const { r: r5 = 0, g: g3 = 0, b: b3 = 0 } = (_a = Util.colorToRGBA(color)) !== null && _a !== void 0 ? _a : {};
      return { r: r5, g: g3, b: b3 };
    },
    colorToRGBA(str2) {
      str2 = (str2 || "").trim() || "black";
      const color = Util._namedColorToRBA(str2) || Util._hex3ColorToRGBA(str2) || Util._hex4ColorToRGBA(str2) || Util._hex6ColorToRGBA(str2) || Util._hex8ColorToRGBA(str2) || Util._rgbColorToRGBA(str2) || Util._hslColorToRGBA(str2);
      if (color && [color.r, color.g, color.b, color.a].every(Util._isNumber)) {
        return color;
      }
    },
    _namedColorToRBA(str2) {
      const c4 = COLORS[str2.toLowerCase()];
      if (!c4) {
        return null;
      }
      return {
        r: c4[0],
        g: c4[1],
        b: c4[2],
        a: c4.length > 3 ? c4[3] : 1
      };
    },
    _rgbColorToRGBA(str2) {
      const match = /^rgba?\(([^)]*)\)$/i.exec(str2);
      if (!match) {
        return;
      }
      const parts = splitColorComponents(match[1]);
      if (parts.length < 3 || parts.length > 4) {
        return;
      }
      return {
        r: parseColorComponent(parts[0], 255),
        g: parseColorComponent(parts[1], 255),
        b: parseColorComponent(parts[2], 255),
        a: parts.length > 3 ? parseColorComponent(parts[3], 1) : 1
      };
    },
    _hex8ColorToRGBA(str2) {
      if (str2.length === 9 && HEX_COLOR_REGEX.test(str2)) {
        return {
          r: parseInt(str2.slice(1, 3), 16),
          g: parseInt(str2.slice(3, 5), 16),
          b: parseInt(str2.slice(5, 7), 16),
          a: parseInt(str2.slice(7, 9), 16) / 255
        };
      }
    },
    _hex6ColorToRGBA(str2) {
      if (str2.length === 7 && HEX_COLOR_REGEX.test(str2)) {
        return {
          r: parseInt(str2.slice(1, 3), 16),
          g: parseInt(str2.slice(3, 5), 16),
          b: parseInt(str2.slice(5, 7), 16),
          a: 1
        };
      }
    },
    _hex4ColorToRGBA(str2) {
      if (str2.length === 5 && HEX_COLOR_REGEX.test(str2)) {
        return {
          r: parseInt(str2[1] + str2[1], 16),
          g: parseInt(str2[2] + str2[2], 16),
          b: parseInt(str2[3] + str2[3], 16),
          a: parseInt(str2[4] + str2[4], 16) / 255
        };
      }
    },
    _hex3ColorToRGBA(str2) {
      if (str2.length === 4 && HEX_COLOR_REGEX.test(str2)) {
        return {
          r: parseInt(str2[1] + str2[1], 16),
          g: parseInt(str2[2] + str2[2], 16),
          b: parseInt(str2[3] + str2[3], 16),
          a: 1
        };
      }
    },
    _hslColorToRGBA(str2) {
      const match = /^hsla?\(([^)]*)\)$/i.exec(str2);
      if (!match) {
        return;
      }
      const parts = splitColorComponents(match[1]);
      if (parts.length < 3 || parts.length > 4) {
        return;
      }
      const hue = HUE_REGEX.exec(parts[0]);
      if (!hue) {
        return;
      }
      const unit = hue[2];
      const degrees = Number(hue[1]) * (unit ? HUE_UNITS[unit.toLowerCase()] : 1);
      if (!isFinite(degrees)) {
        return;
      }
      const h3 = (degrees % 360 + 360) % 360 / 360;
      const s4 = clamp01(parseColorComponent(parts[1], 100) / 100);
      const l4 = clamp01(parseColorComponent(parts[2], 100) / 100);
      const a3 = parts.length > 3 ? parseColorComponent(parts[3], 1) : 1;
      const t22 = l4 < 0.5 ? l4 * (1 + s4) : l4 + s4 - l4 * s4;
      const t1 = 2 * l4 - t22;
      const rgb = [0, 0, 0];
      for (let i3 = 0; i3 < 3; i3++) {
        let t32 = h3 + 1 / 3 * -(i3 - 1);
        if (t32 < 0) {
          t32++;
        }
        if (t32 > 1) {
          t32--;
        }
        let val;
        if (6 * t32 < 1) {
          val = t1 + (t22 - t1) * 6 * t32;
        } else if (2 * t32 < 1) {
          val = t22;
        } else if (3 * t32 < 2) {
          val = t1 + (t22 - t1) * (2 / 3 - t32) * 6;
        } else {
          val = t1;
        }
        rgb[i3] = val * 255;
      }
      return {
        r: Math.round(rgb[0]),
        g: Math.round(rgb[1]),
        b: Math.round(rgb[2]),
        a: a3
      };
    },
    haveIntersection(r1, r22) {
      return !(r22.x > r1.x + r1.width || r22.x + r22.width < r1.x || r22.y > r1.y + r1.height || r22.y + r22.height < r1.y);
    },
    cloneObject(obj) {
      const retObj = {};
      for (const key in obj) {
        if (this._isPlainObject(obj[key])) {
          retObj[key] = this.cloneObject(obj[key]);
        } else if (this._isArray(obj[key])) {
          retObj[key] = this.cloneArray(obj[key]);
        } else {
          retObj[key] = obj[key];
        }
      }
      return retObj;
    },
    cloneArray(arr) {
      return arr.slice(0);
    },
    degToRad(deg) {
      return deg * PI_OVER_DEG180;
    },
    radToDeg(rad) {
      return rad * DEG180_OVER_PI;
    },
    _degToRad(deg) {
      Util.warn("Util._degToRad is removed. Please use public Util.degToRad instead.");
      return Util.degToRad(deg);
    },
    _radToDeg(rad) {
      Util.warn("Util._radToDeg is removed. Please use public Util.radToDeg instead.");
      return Util.radToDeg(rad);
    },
    _getRotation(radians) {
      return Konva.angleDeg ? Util.radToDeg(radians) : radians;
    },
    _capitalize(str2) {
      const cached = capitalizeCache.get(str2);
      if (cached !== void 0)
        return cached;
      const out = str2.charAt(0).toUpperCase() + str2.slice(1);
      capitalizeCache.set(str2, out);
      return out;
    },
    throw(str2) {
      throw new Error(KONVA_ERROR + str2);
    },
    error(str2) {
      console.error(KONVA_ERROR + str2);
    },
    warn(str2) {
      if (!Konva.showWarnings) {
        return;
      }
      console.warn(KONVA_WARNING + str2);
    },
    each(obj, func) {
      for (const key in obj) {
        func(key, obj[key]);
      }
    },
    _inRange(val, left, right) {
      return left <= val && val < right;
    },
    _getProjectionToSegment(x1, y1, x2, y22, x3, y3) {
      let x4, y4, dist;
      const pd2 = (x1 - x2) * (x1 - x2) + (y1 - y22) * (y1 - y22);
      if (pd2 == 0) {
        x4 = x1;
        y4 = y1;
        dist = (x3 - x2) * (x3 - x2) + (y3 - y22) * (y3 - y22);
      } else {
        const u4 = ((x3 - x1) * (x2 - x1) + (y3 - y1) * (y22 - y1)) / pd2;
        if (u4 < 0) {
          x4 = x1;
          y4 = y1;
          dist = (x1 - x3) * (x1 - x3) + (y1 - y3) * (y1 - y3);
        } else if (u4 > 1) {
          x4 = x2;
          y4 = y22;
          dist = (x2 - x3) * (x2 - x3) + (y22 - y3) * (y22 - y3);
        } else {
          x4 = x1 + u4 * (x2 - x1);
          y4 = y1 + u4 * (y22 - y1);
          dist = (x4 - x3) * (x4 - x3) + (y4 - y3) * (y4 - y3);
        }
      }
      return [x4, y4, dist];
    },
    _getProjectionToLine(pt2, line, isClosed) {
      const pc = Util.cloneObject(pt2);
      let dist = Number.MAX_VALUE;
      line.forEach(function(p1, i3) {
        if (!isClosed && i3 === line.length - 1) {
          return;
        }
        const p22 = line[(i3 + 1) % line.length];
        const proj = Util._getProjectionToSegment(p1.x, p1.y, p22.x, p22.y, pt2.x, pt2.y);
        const px = proj[0], py = proj[1], pdist = proj[2];
        if (pdist < dist) {
          pc.x = px;
          pc.y = py;
          dist = pdist;
        }
      });
      return pc;
    },
    _prepareArrayForTween(startArray, endArray, isClosed) {
      const start = [], end = [];
      if (startArray.length > endArray.length) {
        const temp = endArray;
        endArray = startArray;
        startArray = temp;
      }
      for (let n5 = 0; n5 < startArray.length; n5 += 2) {
        start.push({
          x: startArray[n5],
          y: startArray[n5 + 1]
        });
      }
      for (let n5 = 0; n5 < endArray.length; n5 += 2) {
        end.push({
          x: endArray[n5],
          y: endArray[n5 + 1]
        });
      }
      const newStart = [];
      end.forEach(function(point) {
        const pr = Util._getProjectionToLine(point, start, isClosed);
        newStart.push(pr.x);
        newStart.push(pr.y);
      });
      return newStart;
    },
    _prepareToStringify(obj) {
      let desc;
      obj.visitedByCircularReferenceRemoval = true;
      for (const key in obj) {
        if (!(obj.hasOwnProperty(key) && obj[key] && typeof obj[key] == "object")) {
          continue;
        }
        desc = Object.getOwnPropertyDescriptor(obj, key);
        if (obj[key].visitedByCircularReferenceRemoval || Util._isElement(obj[key])) {
          if (desc.configurable) {
            delete obj[key];
          } else {
            return null;
          }
        } else if (Util._prepareToStringify(obj[key]) === null) {
          if (desc.configurable) {
            delete obj[key];
          } else {
            return null;
          }
        }
      }
      delete obj.visitedByCircularReferenceRemoval;
      return obj;
    },
    _assign(target, source) {
      for (const key in source) {
        target[key] = source[key];
      }
      return target;
    },
    _getFirstPointerId(evt) {
      if (!evt.touches) {
        return evt.pointerId || 999;
      } else {
        return evt.changedTouches[0].identifier;
      }
    },
    releaseCanvas(...canvases) {
      if (!Konva.releaseCanvasOnDestroy)
        return;
      canvases.forEach((c4) => {
        c4.width = 0;
        c4.height = 0;
      });
    },
    drawRoundedRectPath(context, width, height, cornerRadius) {
      let xOrigin = width < 0 ? width : 0;
      let yOrigin = height < 0 ? height : 0;
      width = Math.abs(width);
      height = Math.abs(height);
      let topLeft = 0;
      let topRight = 0;
      let bottomLeft = 0;
      let bottomRight = 0;
      if (typeof cornerRadius === "number") {
        topLeft = topRight = bottomLeft = bottomRight = Math.min(cornerRadius, width / 2, height / 2);
      } else {
        topLeft = Math.min(cornerRadius[0] || 0, width / 2, height / 2);
        topRight = Math.min(cornerRadius[1] || 0, width / 2, height / 2);
        bottomRight = Math.min(cornerRadius[2] || 0, width / 2, height / 2);
        bottomLeft = Math.min(cornerRadius[3] || 0, width / 2, height / 2);
      }
      context.moveTo(xOrigin + topLeft, yOrigin);
      context.lineTo(xOrigin + width - topRight, yOrigin);
      context.arc(xOrigin + width - topRight, yOrigin + topRight, topRight, Math.PI * 3 / 2, 0, false);
      context.lineTo(xOrigin + width, yOrigin + height - bottomRight);
      context.arc(xOrigin + width - bottomRight, yOrigin + height - bottomRight, bottomRight, 0, Math.PI / 2, false);
      context.lineTo(xOrigin + bottomLeft, yOrigin + height);
      context.arc(xOrigin + bottomLeft, yOrigin + height - bottomLeft, bottomLeft, Math.PI / 2, Math.PI, false);
      context.lineTo(xOrigin, yOrigin + topLeft);
      context.arc(xOrigin + topLeft, yOrigin + topLeft, topLeft, Math.PI, Math.PI * 3 / 2, false);
    },
    drawRoundedPolygonPath(context, points, sides, radius, cornerRadius) {
      radius = Math.abs(radius);
      for (let i3 = 0; i3 < sides; i3++) {
        const prev = points[(i3 - 1 + sides) % sides];
        const curr = points[i3];
        const next = points[(i3 + 1) % sides];
        const vec1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const vec2 = { x: next.x - curr.x, y: next.y - curr.y };
        const len1 = Math.hypot(vec1.x, vec1.y);
        const len2 = Math.hypot(vec2.x, vec2.y);
        let currCornerRadius;
        if (typeof cornerRadius === "number") {
          currCornerRadius = cornerRadius;
        } else {
          currCornerRadius = i3 < cornerRadius.length ? cornerRadius[i3] : 0;
        }
        const maxCornerRadius = radius * Math.cos(Math.PI / sides);
        currCornerRadius = maxCornerRadius * Math.min(1, currCornerRadius / radius * 2);
        const normalVec1 = { x: vec1.x / len1, y: vec1.y / len1 };
        const normalVec2 = { x: vec2.x / len2, y: vec2.y / len2 };
        const p1 = {
          x: curr.x - normalVec1.x * currCornerRadius,
          y: curr.y - normalVec1.y * currCornerRadius
        };
        const p22 = {
          x: curr.x + normalVec2.x * currCornerRadius,
          y: curr.y + normalVec2.y * currCornerRadius
        };
        if (i3 === 0) {
          context.moveTo(p1.x, p1.y);
        } else {
          context.lineTo(p1.x, p1.y);
        }
        context.arcTo(curr.x, curr.y, p22.x, p22.y, currCornerRadius);
      }
    }
  };

  // node_modules/konva/lib/Context.js
  function simplifyArray(arr) {
    const retArr = [], len = arr.length, util = Util;
    for (let n5 = 0; n5 < len; n5++) {
      let val = arr[n5];
      if (util._isNumber(val)) {
        val = Math.round(val * 1e3) / 1e3;
      } else if (!util._isString(val)) {
        val = val + "";
      }
      retArr.push(val);
    }
    return retArr;
  }
  var COMMA = ",";
  var OPEN_PAREN = "(";
  var CLOSE_PAREN = ")";
  var OPEN_PAREN_BRACKET = "([";
  var CLOSE_BRACKET_PAREN = "])";
  var SEMICOLON = ";";
  var DOUBLE_PAREN = "()";
  var EQUALS = "=";
  var CONTEXT_METHODS = [
    "arc",
    "arcTo",
    "beginPath",
    "bezierCurveTo",
    "clearRect",
    "clip",
    "closePath",
    "createLinearGradient",
    "createPattern",
    "createRadialGradient",
    "drawImage",
    "ellipse",
    "fill",
    "fillText",
    "getImageData",
    "createImageData",
    "lineTo",
    "moveTo",
    "putImageData",
    "quadraticCurveTo",
    "rect",
    "roundRect",
    "restore",
    "rotate",
    "save",
    "scale",
    "setLineDash",
    "setTransform",
    "stroke",
    "strokeText",
    "transform",
    "translate"
  ];
  var CONTEXT_PROPERTIES = [
    "fillStyle",
    "strokeStyle",
    "shadowColor",
    "shadowBlur",
    "shadowOffsetX",
    "shadowOffsetY",
    "letterSpacing",
    "lineCap",
    "lineDashOffset",
    "lineJoin",
    "lineWidth",
    "miterLimit",
    "direction",
    "font",
    "textAlign",
    "textBaseline",
    "globalAlpha",
    "globalCompositeOperation",
    "imageSmoothingEnabled",
    "filter"
  ];
  var traceArrMax = 100;
  var _cssFiltersSupported = null;
  function isCSSFiltersSupported() {
    if (_cssFiltersSupported !== null) {
      return _cssFiltersSupported;
    }
    try {
      const canvas = Util.createCanvasElement();
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        _cssFiltersSupported = false;
        return false;
      }
      return !!ctx && "filter" in ctx;
    } catch (e3) {
      _cssFiltersSupported = false;
      return false;
    }
  }
  var Context = class {
    constructor(canvas) {
      this.canvas = canvas;
      if (Konva.enableTrace) {
        this.traceArr = [];
        this._enableTrace();
      }
    }
    fillShape(shape) {
      if (shape.fillEnabled()) {
        this._fill(shape);
      }
    }
    _fill(shape) {
    }
    strokeShape(shape) {
      if (shape.hasStroke()) {
        this._stroke(shape);
      }
    }
    _stroke(shape) {
    }
    fillStrokeShape(shape) {
      if (shape.attrs.fillAfterStrokeEnabled) {
        this.strokeShape(shape);
        this.fillShape(shape);
      } else {
        this.fillShape(shape);
        this.strokeShape(shape);
      }
    }
    getTrace(relaxed, rounded) {
      let traceArr = this.traceArr, len = traceArr.length, str2 = "", n5, trace, method, args;
      for (n5 = 0; n5 < len; n5++) {
        trace = traceArr[n5];
        method = trace.method;
        if (method) {
          args = trace.args;
          str2 += method;
          if (relaxed) {
            str2 += DOUBLE_PAREN;
          } else {
            if (Util._isArray(args[0])) {
              str2 += OPEN_PAREN_BRACKET + args.join(COMMA) + CLOSE_BRACKET_PAREN;
            } else {
              if (rounded) {
                args = args.map((a3) => typeof a3 === "number" ? Math.floor(a3) : a3);
              }
              str2 += OPEN_PAREN + args.join(COMMA) + CLOSE_PAREN;
            }
          }
        } else {
          str2 += trace.property;
          if (!relaxed) {
            str2 += EQUALS + trace.val;
          }
        }
        str2 += SEMICOLON;
      }
      return str2;
    }
    clearTrace() {
      this.traceArr = [];
    }
    _trace(str2) {
      let traceArr = this.traceArr, len;
      traceArr.push(str2);
      len = traceArr.length;
      if (len >= traceArrMax) {
        traceArr.shift();
      }
    }
    reset() {
      const pixelRatio = this.getCanvas().getPixelRatio();
      this.setTransform(1 * pixelRatio, 0, 0, 1 * pixelRatio, 0, 0);
    }
    getCanvas() {
      return this.canvas;
    }
    clear(bounds) {
      const canvas = this.getCanvas();
      if (bounds) {
        this.clearRect(bounds.x || 0, bounds.y || 0, bounds.width || 0, bounds.height || 0);
      } else {
        this.clearRect(0, 0, canvas.getWidth() / canvas.pixelRatio, canvas.getHeight() / canvas.pixelRatio);
      }
    }
    _applyLineCap(shape) {
      const lineCap = shape.attrs.lineCap;
      if (lineCap) {
        this.setAttr("lineCap", lineCap);
      }
    }
    _applyOpacity(shape) {
      const absOpacity = shape.getAbsoluteOpacity();
      if (absOpacity !== 1) {
        this.setAttr("globalAlpha", absOpacity);
      }
    }
    _applyLineJoin(shape) {
      const lineJoin = shape.attrs.lineJoin;
      if (lineJoin) {
        this.setAttr("lineJoin", lineJoin);
      }
    }
    _applyMiterLimit(shape) {
      const miterLimit = shape.attrs.miterLimit;
      if (miterLimit != null) {
        this.setAttr("miterLimit", miterLimit);
      }
    }
    setAttr(attr, val) {
      this._context[attr] = val;
    }
    arc(x2, y3, radius, startAngle, endAngle, counterClockwise) {
      this._context.arc(x2, y3, radius, startAngle, endAngle, counterClockwise);
    }
    arcTo(x1, y1, x2, y22, radius) {
      this._context.arcTo(x1, y1, x2, y22, radius);
    }
    beginPath() {
      this._context.beginPath();
    }
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y3) {
      this._context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y3);
    }
    clearRect(x2, y3, width, height) {
      this._context.clearRect(x2, y3, width, height);
    }
    clip(...args) {
      this._context.clip.apply(this._context, args);
    }
    closePath() {
      this._context.closePath();
    }
    createImageData(width, height) {
      const a3 = arguments;
      if (a3.length === 2) {
        return this._context.createImageData(width, height);
      } else if (a3.length === 1) {
        return this._context.createImageData(width);
      }
    }
    createLinearGradient(x0, y0, x1, y1) {
      return this._context.createLinearGradient(x0, y0, x1, y1);
    }
    createPattern(image, repetition) {
      return this._context.createPattern(image, repetition);
    }
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      return this._context.createRadialGradient(x0, y0, r0, x1, y1, r1);
    }
    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
      const a3 = arguments, _context = this._context;
      if (a3.length === 3) {
        _context.drawImage(image, sx, sy);
      } else if (a3.length === 5) {
        _context.drawImage(image, sx, sy, sWidth, sHeight);
      } else if (a3.length === 9) {
        _context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      }
    }
    ellipse(x2, y3, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
      this._context.ellipse(x2, y3, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }
    isPointInPath(x2, y3, path, fillRule) {
      if (path) {
        return this._context.isPointInPath(path, x2, y3, fillRule);
      }
      return this._context.isPointInPath(x2, y3, fillRule);
    }
    fill(...args) {
      this._context.fill.apply(this._context, args);
    }
    fillRect(x2, y3, width, height) {
      this._context.fillRect(x2, y3, width, height);
    }
    strokeRect(x2, y3, width, height) {
      this._context.strokeRect(x2, y3, width, height);
    }
    fillText(text, x2, y3, maxWidth) {
      if (maxWidth) {
        this._context.fillText(text, x2, y3, maxWidth);
      } else {
        this._context.fillText(text, x2, y3);
      }
    }
    measureText(text) {
      return this._context.measureText(text);
    }
    getImageData(sx, sy, sw, sh) {
      return this._context.getImageData(sx, sy, sw, sh);
    }
    lineTo(x2, y3) {
      this._context.lineTo(x2, y3);
    }
    moveTo(x2, y3) {
      this._context.moveTo(x2, y3);
    }
    rect(x2, y3, width, height) {
      this._context.rect(x2, y3, width, height);
    }
    roundRect(x2, y3, width, height, radii) {
      this._context.roundRect(x2, y3, width, height, radii);
    }
    putImageData(imageData, dx, dy) {
      this._context.putImageData(imageData, dx, dy);
    }
    quadraticCurveTo(cpx, cpy, x2, y3) {
      this._context.quadraticCurveTo(cpx, cpy, x2, y3);
    }
    restore() {
      this._context.restore();
    }
    rotate(angle) {
      this._context.rotate(angle);
    }
    save() {
      this._context.save();
    }
    scale(x2, y3) {
      this._context.scale(x2, y3);
    }
    setLineDash(segments) {
      if (this._context.setLineDash) {
        this._context.setLineDash(segments);
      } else if ("mozDash" in this._context) {
        this._context["mozDash"] = segments;
      } else if ("webkitLineDash" in this._context) {
        this._context["webkitLineDash"] = segments;
      }
    }
    getLineDash() {
      return this._context.getLineDash();
    }
    setTransform(a3, b3, c4, d2, e3, f3) {
      this._context.setTransform(a3, b3, c4, d2, e3, f3);
    }
    stroke(path2d) {
      if (path2d) {
        this._context.stroke(path2d);
      } else {
        this._context.stroke();
      }
    }
    strokeText(text, x2, y3, maxWidth) {
      this._context.strokeText(text, x2, y3, maxWidth);
    }
    transform(a3, b3, c4, d2, e3, f3) {
      this._context.transform(a3, b3, c4, d2, e3, f3);
    }
    translate(x2, y3) {
      this._context.translate(x2, y3);
    }
    _enableTrace() {
      let that = this, len = CONTEXT_METHODS.length, origSetter = this.setAttr, n5, args;
      const func = function(methodName) {
        let origMethod = that[methodName], ret;
        that[methodName] = function() {
          args = simplifyArray(Array.prototype.slice.call(arguments, 0));
          ret = origMethod.apply(that, arguments);
          that._trace({
            method: methodName,
            args
          });
          return ret;
        };
      };
      for (n5 = 0; n5 < len; n5++) {
        func(CONTEXT_METHODS[n5]);
      }
      that.setAttr = function() {
        origSetter.apply(that, arguments);
        const prop = arguments[0];
        let val = arguments[1];
        if (prop === "shadowOffsetX" || prop === "shadowOffsetY" || prop === "shadowBlur") {
          val = val / this.canvas.getPixelRatio();
        }
        that._trace({
          property: prop,
          val
        });
      };
    }
    _applyGlobalCompositeOperation(node) {
      const op = node.attrs.globalCompositeOperation;
      const def = !op || op === "source-over";
      if (!def) {
        this.setAttr("globalCompositeOperation", op);
      }
    }
  };
  CONTEXT_PROPERTIES.forEach(function(prop) {
    Object.defineProperty(Context.prototype, prop, {
      get() {
        return this._context[prop];
      },
      set(val) {
        this._context[prop] = val;
      }
    });
  });
  var SceneContext = class extends Context {
    constructor(canvas, { willReadFrequently = false } = {}) {
      super(canvas);
      this._context = canvas._canvas.getContext("2d", {
        willReadFrequently
      });
    }
    _fillColor(shape) {
      const fill = shape.fill();
      this.setAttr("fillStyle", fill);
      shape._fillFunc(this);
    }
    _fillPattern(shape) {
      const context = this._context;
      if ("patternQuality" in context) {
        context.patternQuality = context.imageSmoothingEnabled ? "good" : "nearest";
      }
      this.setAttr("fillStyle", shape._getFillPattern());
      shape._fillFunc(this);
    }
    _fillLinearGradient(shape) {
      const grd = shape._getLinearGradient();
      if (grd) {
        this.setAttr("fillStyle", grd);
        shape._fillFunc(this);
      }
    }
    _fillRadialGradient(shape) {
      const grd = shape._getRadialGradient();
      if (grd) {
        this.setAttr("fillStyle", grd);
        shape._fillFunc(this);
      }
    }
    _fill(shape) {
      const hasColor = shape.fill(), fillPriority = shape.getFillPriority();
      if (hasColor && fillPriority === "color") {
        this._fillColor(shape);
        return;
      }
      const hasPattern = shape.getFillPatternImage();
      if (hasPattern && fillPriority === "pattern") {
        this._fillPattern(shape);
        return;
      }
      const hasLinearGradient = shape.getFillLinearGradientColorStops();
      if (hasLinearGradient && fillPriority === "linear-gradient") {
        this._fillLinearGradient(shape);
        return;
      }
      const hasRadialGradient = shape.getFillRadialGradientColorStops();
      if (hasRadialGradient && fillPriority === "radial-gradient") {
        this._fillRadialGradient(shape);
        return;
      }
      if (hasColor) {
        this._fillColor(shape);
      } else if (hasPattern) {
        this._fillPattern(shape);
      } else if (hasLinearGradient) {
        this._fillLinearGradient(shape);
      } else if (hasRadialGradient) {
        this._fillRadialGradient(shape);
      }
    }
    _strokeLinearGradient(shape) {
      const start = shape.getStrokeLinearGradientStartPoint(), end = shape.getStrokeLinearGradientEndPoint(), colorStops = shape.getStrokeLinearGradientColorStops(), grd = this.createLinearGradient(start.x, start.y, end.x, end.y);
      if (colorStops) {
        for (let n5 = 0; n5 < colorStops.length; n5 += 2) {
          grd.addColorStop(colorStops[n5], colorStops[n5 + 1]);
        }
        this.setAttr("strokeStyle", grd);
      }
    }
    _stroke(shape) {
      const dash = shape.dash(), strokeScaleEnabled = shape.getStrokeScaleEnabled();
      if (shape.hasStroke()) {
        if (!strokeScaleEnabled) {
          this.save();
          const pixelRatio = this.getCanvas().getPixelRatio();
          this.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }
        this._applyLineCap(shape);
        if (dash && shape.dashEnabled()) {
          this.setLineDash(dash);
          this.setAttr("lineDashOffset", shape.dashOffset());
        }
        this.setAttr("lineWidth", shape.strokeWidth());
        if (!shape.getShadowForStrokeEnabled()) {
          this.setAttr("shadowColor", "rgba(0,0,0,0)");
        }
        const hasLinearGradient = shape.getStrokeLinearGradientColorStops();
        if (hasLinearGradient) {
          this._strokeLinearGradient(shape);
        } else {
          this.setAttr("strokeStyle", shape.stroke());
        }
        shape._strokeFunc(this);
        if (!strokeScaleEnabled) {
          this.restore();
        }
      }
    }
    _applyShadow(shape) {
      var _a, _b, _c;
      const color = (_a = shape.getShadowRGBA()) !== null && _a !== void 0 ? _a : "black", blur = (_b = shape.getShadowBlur()) !== null && _b !== void 0 ? _b : 5, offset = (_c = shape.getShadowOffset()) !== null && _c !== void 0 ? _c : {
        x: 0,
        y: 0
      }, scale = shape.getAbsoluteScale(), ratio = this.canvas.getPixelRatio(), scaleX = scale.x * ratio, scaleY = scale.y * ratio;
      this.setAttr("shadowColor", color);
      this.setAttr("shadowBlur", blur * Math.min(Math.abs(scaleX), Math.abs(scaleY)));
      this.setAttr("shadowOffsetX", offset.x * scaleX);
      this.setAttr("shadowOffsetY", offset.y * scaleY);
    }
  };
  var HitContext = class extends Context {
    constructor(canvas) {
      super(canvas);
      this._context = canvas._canvas.getContext("2d", {
        willReadFrequently: true
      });
    }
    _fill(shape) {
      this.save();
      this.setAttr("fillStyle", shape.colorKey);
      shape._fillFuncHit(this);
      this.restore();
    }
    strokeShape(shape) {
      if (shape.hasHitStroke()) {
        this._stroke(shape);
      }
    }
    _stroke(shape) {
      if (shape.hasHitStroke()) {
        const strokeScaleEnabled = shape.getStrokeScaleEnabled();
        if (!strokeScaleEnabled) {
          this.save();
          const pixelRatio = this.getCanvas().getPixelRatio();
          this.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }
        this._applyLineCap(shape);
        const hitStrokeWidth = shape.hitStrokeWidth();
        const strokeWidth = hitStrokeWidth === "auto" ? shape.strokeWidth() : hitStrokeWidth;
        this.setAttr("lineWidth", strokeWidth);
        this.setAttr("strokeStyle", shape.colorKey);
        shape._strokeFuncHit(this);
        if (!strokeScaleEnabled) {
          this.restore();
        }
      }
    }
  };

  // node_modules/konva/lib/Canvas.js
  var _pixelRatio;
  function getDevicePixelRatio() {
    if (_pixelRatio) {
      return _pixelRatio;
    }
    const canvas = Util.createCanvasElement();
    const context = canvas.getContext("2d");
    _pixelRatio = (function() {
      const devicePixelRatio = Konva._global.devicePixelRatio || 1, backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
      return devicePixelRatio / backingStoreRatio;
    })();
    Util.releaseCanvas(canvas);
    return _pixelRatio;
  }
  var Canvas = class {
    constructor(config) {
      this.pixelRatio = 1;
      this.width = 0;
      this.height = 0;
      this.isCache = false;
      const conf = config || {};
      const pixelRatio = conf.pixelRatio || Konva.pixelRatio || getDevicePixelRatio();
      this.pixelRatio = pixelRatio;
      this._canvas = Util.createCanvasElement();
      this._canvas.style.padding = "0";
      this._canvas.style.margin = "0";
      this._canvas.style.border = "0";
      this._canvas.style.background = "transparent";
      this._canvas.style.position = "absolute";
      this._canvas.style.top = "0";
      this._canvas.style.left = "0";
    }
    getContext() {
      return this.context;
    }
    getPixelRatio() {
      return this.pixelRatio;
    }
    setPixelRatio(pixelRatio) {
      const previousRatio = this.pixelRatio;
      this.pixelRatio = pixelRatio;
      this.setSize(this.getWidth() / previousRatio, this.getHeight() / previousRatio);
    }
    setWidth(width) {
      this.width = this._canvas.width = width * this.pixelRatio;
      this._canvas.style.width = width + "px";
      const pixelRatio = this.pixelRatio, _context = this.getContext()._context;
      _context.scale(pixelRatio, pixelRatio);
    }
    setHeight(height) {
      this.height = this._canvas.height = height * this.pixelRatio;
      this._canvas.style.height = height + "px";
      const pixelRatio = this.pixelRatio, _context = this.getContext()._context;
      _context.scale(pixelRatio, pixelRatio);
    }
    getWidth() {
      return this.width;
    }
    getHeight() {
      return this.height;
    }
    setSize(width, height) {
      this.setWidth(width || 0);
      this.setHeight(height || 0);
    }
    setSizeIfChanged(width, height) {
      if (this.width !== width * this.pixelRatio || this.height !== height * this.pixelRatio) {
        this.setSize(width, height);
      }
    }
    toDataURL(mimeType, quality) {
      try {
        return this._canvas.toDataURL(mimeType, quality);
      } catch (e3) {
        try {
          return this._canvas.toDataURL();
        } catch (err) {
          Util.error("Unable to get data URL. " + err.message + " For more info read https://konvajs.org/docs/posts/Tainted_Canvas.html.");
          return "";
        }
      }
    }
  };
  var SceneCanvas = class extends Canvas {
    constructor(config = { width: 0, height: 0, willReadFrequently: false }) {
      super(config);
      this.context = new SceneContext(this, {
        willReadFrequently: config.willReadFrequently
      });
      this.setSize(config.width, config.height);
    }
  };
  var HitCanvas = class extends Canvas {
    constructor(config = { width: 0, height: 0 }) {
      super(config);
      this.hitCanvas = true;
      this.context = new HitContext(this);
      this.setSize(config.width, config.height);
    }
  };

  // node_modules/konva/lib/DragAndDrop.js
  var DD = {
    get isDragging() {
      let flag = false;
      DD._dragElements.forEach((elem) => {
        if (elem.dragStatus === "dragging") {
          flag = true;
        }
      });
      return flag;
    },
    justDragged: false,
    get node() {
      let node;
      DD._dragElements.forEach((elem) => {
        node = elem.node;
      });
      return node;
    },
    _dragElements: /* @__PURE__ */ new Map(),
    _listenToWindow(win) {
      const endDragBefore = (evt) => DD._endDragBefore(evt, win);
      const drag = (evt) => DD._drag(evt, win);
      win.addEventListener("mouseup", endDragBefore, true);
      win.addEventListener("touchend", endDragBefore, true);
      win.addEventListener("touchcancel", endDragBefore, true);
      win.addEventListener("mousemove", drag);
      win.addEventListener("touchmove", drag);
      win.addEventListener("mouseup", DD._endDragAfter, false);
      win.addEventListener("touchend", DD._endDragAfter, false);
      win.addEventListener("touchcancel", DD._endDragAfter, false);
    },
    _drag(evt, win) {
      const nodesToFireEvents = [];
      DD._dragElements.forEach((elem, key) => {
        const { node } = elem;
        const stage = node.getStage();
        if (win && stage._getOwnerWindow() !== win) {
          return;
        }
        stage.setPointersPositions(evt);
        if (elem.pointerId === void 0) {
          elem.pointerId = Util._getFirstPointerId(evt);
        }
        const pos = stage._changedPointerPositions.find((pos2) => pos2.id === elem.pointerId);
        if (!pos) {
          return;
        }
        if (elem.dragStatus !== "dragging") {
          const dragDistance = node.dragDistance();
          const distance = Math.max(Math.abs(pos.x - elem.startPointerPos.x), Math.abs(pos.y - elem.startPointerPos.y));
          if (distance < dragDistance) {
            return;
          }
          node.startDrag({ evt });
          if (!node.isDragging()) {
            return;
          }
        }
        node._setDragPosition(evt, elem);
        nodesToFireEvents.push(node);
      });
      nodesToFireEvents.forEach((node) => {
        if (!node.getStage()) {
          return;
        }
        node.fire("dragmove", {
          type: "dragmove",
          target: node,
          evt
        }, true);
      });
    },
    _endDragBefore(evt, win) {
      const drawNodes = [];
      DD._dragElements.forEach((elem) => {
        const { node } = elem;
        const stage = node.getStage();
        if (evt && (!win || stage._getOwnerWindow() === win)) {
          stage.setPointersPositions(evt);
        }
        const pos = stage._changedPointerPositions.find((pos2) => pos2.id === elem.pointerId);
        if (!pos) {
          return;
        }
        if (elem.dragStatus === "dragging" || elem.dragStatus === "stopped") {
          DD.justDragged = true;
          Konva._mouseListenClick = false;
          Konva._touchListenClick = false;
          Konva._pointerListenClick = false;
          elem.dragStatus = "stopped";
        }
        const drawNode = elem.node.getLayer() || elem.node instanceof Konva["Stage"] && elem.node;
        if (drawNode && drawNodes.indexOf(drawNode) === -1) {
          drawNodes.push(drawNode);
        }
      });
      drawNodes.forEach((drawNode) => {
        drawNode.draw();
      });
    },
    _endDragAfter(evt) {
      DD._dragElements.forEach((elem, key) => {
        if (elem.dragStatus === "stopped") {
          elem.node.fire("dragend", {
            type: "dragend",
            target: elem.node,
            evt
          }, true);
        }
        if (elem.dragStatus !== "dragging") {
          DD._dragElements.delete(key);
        }
      });
    }
  };

  // node_modules/konva/lib/Validators.js
  function _formatValue(val) {
    if (Util._isString(val)) {
      return '"' + val + '"';
    }
    if (Object.prototype.toString.call(val) === "[object Number]") {
      return val;
    }
    if (Util._isBoolean(val)) {
      return val;
    }
    return Object.prototype.toString.call(val);
  }
  function RGBComponent(val) {
    if (val > 255) {
      return 255;
    } else if (val < 0) {
      return 0;
    }
    return Math.round(val);
  }
  function getNumberValidator() {
    if (Konva.isUnminified) {
      return function(val, attr) {
        if (!Util._isNumber(val)) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a number.');
        }
        return val;
      };
    }
  }
  function getNumberOrArrayOfNumbersValidator(noOfElements) {
    if (Konva.isUnminified) {
      return function(val, attr) {
        let isNumber = Util._isNumber(val);
        let isValidArray = Util._isArray(val) && val.length == noOfElements;
        if (!isNumber && !isValidArray) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a number or Array<number>(' + noOfElements + ")");
        }
        return val;
      };
    }
  }
  function getNumberOrAutoValidator() {
    if (Konva.isUnminified) {
      return function(val, attr) {
        const isNumber = Util._isNumber(val);
        const isAuto = val === "auto";
        if (!(isNumber || isAuto)) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a number or "auto".');
        }
        return val;
      };
    }
  }
  function getStringValidator() {
    if (Konva.isUnminified) {
      return function(val, attr) {
        if (!Util._isString(val)) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a string.');
        }
        return val;
      };
    }
  }
  function getStringOrGradientValidator() {
    if (Konva.isUnminified) {
      return function(val, attr) {
        const isString = Util._isString(val);
        const isGradient = Object.prototype.toString.call(val) === "[object CanvasGradient]" || val && val["addColorStop"];
        if (!(isString || isGradient)) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a string or a native gradient.');
        }
        return val;
      };
    }
  }
  function getNumberArrayValidator() {
    if (Konva.isUnminified) {
      return function(val, attr) {
        const TypedArray = Int8Array ? Object.getPrototypeOf(Int8Array) : null;
        if (TypedArray && val instanceof TypedArray) {
          return val;
        }
        if (!Util._isArray(val)) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a array of numbers.');
        } else {
          val.forEach(function(item) {
            if (!Util._isNumber(item)) {
              Util.warn('"' + attr + '" attribute has non numeric element ' + item + ". Make sure that all elements are numbers.");
            }
          });
        }
        return val;
      };
    }
  }
  function getBooleanValidator() {
    if (Konva.isUnminified) {
      return function(val, attr) {
        const isBool = val === true || val === false;
        if (!isBool) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be a boolean.');
        }
        return val;
      };
    }
  }
  function getComponentValidator(components) {
    if (Konva.isUnminified) {
      return function(val, attr) {
        if (val === void 0 || val === null) {
          return val;
        }
        if (!Util.isObject(val)) {
          Util.warn(_formatValue(val) + ' is a not valid value for "' + attr + '" attribute. The value should be an object with properties ' + components);
        }
        return val;
      };
    }
  }

  // node_modules/konva/lib/Factory.js
  var GET = "get";
  var SET = "set";
  var Factory = {
    addGetterSetter(constructor, attr, def, validator, after) {
      Factory.addGetter(constructor, attr, def);
      Factory.addSetter(constructor, attr, validator, after);
      Factory.addOverloadedGetterSetter(constructor, attr);
    },
    addGetter(constructor, attr, def) {
      const method = GET + Util._capitalize(attr);
      constructor.prototype[method] = constructor.prototype[method] || function() {
        const val = this.attrs[attr];
        return val === void 0 ? def : val;
      };
    },
    addSetter(constructor, attr, validator, after) {
      const method = SET + Util._capitalize(attr);
      if (!constructor.prototype[method]) {
        Factory.overWriteSetter(constructor, attr, validator, after);
      }
    },
    overWriteSetter(constructor, attr, validator, after) {
      const method = SET + Util._capitalize(attr);
      constructor.prototype[method] = function(val) {
        if (validator && val !== void 0 && val !== null) {
          val = validator.call(this, val, attr);
        }
        this._setAttr(attr, val);
        if (after) {
          after.call(this);
        }
        return this;
      };
    },
    addComponentsGetterSetter(constructor, attr, components, validator, after) {
      const len = components.length, capitalize = Util._capitalize, getter = GET + capitalize(attr), setter = SET + capitalize(attr);
      constructor.prototype[getter] = function() {
        const ret = {};
        for (let n5 = 0; n5 < len; n5++) {
          const component = components[n5];
          ret[component] = this.getAttr(attr + capitalize(component));
        }
        return ret;
      };
      const basicValidator = getComponentValidator(components);
      constructor.prototype[setter] = function(val) {
        const oldVal = this.attrs[attr];
        if (validator) {
          val = validator.call(this, val, attr);
        }
        if (basicValidator) {
          basicValidator.call(this, val, attr);
        }
        for (const key in val) {
          if (!val.hasOwnProperty(key)) {
            continue;
          }
          this._setAttr(attr + capitalize(key), val[key]);
        }
        if (!val) {
          components.forEach((component) => {
            this._setAttr(attr + capitalize(component), void 0);
          });
        }
        this._fireChangeEvent(attr, oldVal, val);
        if (after) {
          after.call(this);
        }
        return this;
      };
      Factory.addOverloadedGetterSetter(constructor, attr);
    },
    addOverloadedGetterSetter(constructor, attr) {
      const capitalizedAttr = Util._capitalize(attr), setter = SET + capitalizedAttr, getter = GET + capitalizedAttr;
      constructor.prototype[attr] = function() {
        if (arguments.length) {
          this[setter](arguments[0]);
          return this;
        }
        return this[getter]();
      };
    },
    addDeprecatedGetterSetter(constructor, attr, def, validator) {
      Util.error("Adding deprecated " + attr);
      const method = GET + Util._capitalize(attr);
      const message = attr + " property is deprecated and will be removed soon. Look at Konva change log for more information.";
      constructor.prototype[method] = function() {
        Util.error(message);
        const val = this.attrs[attr];
        return val === void 0 ? def : val;
      };
      Factory.addSetter(constructor, attr, validator, function() {
        Util.error(message);
      });
      Factory.addOverloadedGetterSetter(constructor, attr);
    },
    backCompat(constructor, methods) {
      Util.each(methods, function(oldMethodName, newMethodName) {
        const method = constructor.prototype[newMethodName];
        const oldGetter = GET + Util._capitalize(oldMethodName);
        const oldSetter = SET + Util._capitalize(oldMethodName);
        function deprecated() {
          method.apply(this, arguments);
          Util.error('"' + oldMethodName + '" method is deprecated and will be removed soon. Use ""' + newMethodName + '" instead.');
        }
        constructor.prototype[oldMethodName] = deprecated;
        constructor.prototype[oldGetter] = deprecated;
        constructor.prototype[oldSetter] = deprecated;
      });
    },
    afterSetFilter() {
      this._filterUpToDate = false;
    }
  };

  // node_modules/konva/lib/Node.js
  function parseCSSFilters(cssFilter) {
    const filterRegex = /(\w+)\(([^)]+)\)/g;
    let match;
    while ((match = filterRegex.exec(cssFilter)) !== null) {
      const [, filterName, filterValue] = match;
      switch (filterName) {
        case "blur": {
          const blurRadius = parseFloat(filterValue.replace("px", ""));
          return function(imageData) {
            this.blurRadius(blurRadius * 0.5);
            const KonvaFilters = Konva.Filters;
            if (KonvaFilters && KonvaFilters.Blur) {
              KonvaFilters.Blur.call(this, imageData);
            }
          };
        }
        case "brightness": {
          const brightness = filterValue.includes("%") ? parseFloat(filterValue) / 100 : parseFloat(filterValue);
          return function(imageData) {
            this.brightness(brightness);
            const KonvaFilters = Konva.Filters;
            if (KonvaFilters && KonvaFilters.Brightness) {
              KonvaFilters.Brightness.call(this, imageData);
            }
          };
        }
        case "contrast": {
          const contrast = parseFloat(filterValue);
          return function(imageData) {
            const konvaContrast = 100 * (Math.sqrt(contrast) - 1);
            this.contrast(konvaContrast);
            const KonvaFilters = Konva.Filters;
            if (KonvaFilters && KonvaFilters.Contrast) {
              KonvaFilters.Contrast.call(this, imageData);
            }
          };
        }
        case "grayscale": {
          return function(imageData) {
            const KonvaFilters = Konva.Filters;
            if (KonvaFilters && KonvaFilters.Grayscale) {
              KonvaFilters.Grayscale.call(this, imageData);
            }
          };
        }
        case "sepia": {
          return function(imageData) {
            const KonvaFilters = Konva.Filters;
            if (KonvaFilters && KonvaFilters.Sepia) {
              KonvaFilters.Sepia.call(this, imageData);
            }
          };
        }
        case "invert": {
          return function(imageData) {
            const KonvaFilters = Konva.Filters;
            if (KonvaFilters && KonvaFilters.Invert) {
              KonvaFilters.Invert.call(this, imageData);
            }
          };
        }
        default:
          Util.warn(`CSS filter "${filterName}" is not supported in fallback mode. Consider using function filters for better compatibility.`);
          break;
      }
    }
    return () => {
    };
  }
  var ABSOLUTE_OPACITY = "absoluteOpacity";
  var ALL_LISTENERS = "allEventListeners";
  var ABSOLUTE_TRANSFORM = "absoluteTransform";
  var ABSOLUTE_SCALE = "absoluteScale";
  var CANVAS = "canvas";
  var CHANGE = "Change";
  var CHILDREN = "children";
  var KONVA = "konva";
  var LISTENING = "listening";
  var MOUSEENTER = "mouseenter";
  var MOUSELEAVE = "mouseleave";
  var POINTERENTER = "pointerenter";
  var POINTERLEAVE = "pointerleave";
  var TOUCHENTER = "touchenter";
  var TOUCHLEAVE = "touchleave";
  var SET2 = "set";
  var SHAPE = "Shape";
  var SPACE = " ";
  var STAGE = "stage";
  var TRANSFORM = "transform";
  var UPPER_STAGE = "Stage";
  var VISIBLE = "visible";
  var TRANSFORM_CHANGE_STR = [
    "xChange.konva",
    "yChange.konva",
    "scaleXChange.konva",
    "scaleYChange.konva",
    "skewXChange.konva",
    "skewYChange.konva",
    "rotationChange.konva",
    "offsetXChange.konva",
    "offsetYChange.konva",
    "transformsEnabledChange.konva"
  ].join(SPACE);
  var idCounter = 1;
  var Node = class _Node {
    constructor(config) {
      this._id = idCounter++;
      this.eventListeners = {};
      this.attrs = {};
      this.index = 0;
      this._allEventListeners = null;
      this.parent = null;
      this._cache = /* @__PURE__ */ new Map();
      this._attachedDepsListeners = /* @__PURE__ */ new Map();
      this._lastPos = null;
      this._batchingTransformChange = false;
      this._needClearTransformCache = false;
      this._filterUpToDate = false;
      this._isUnderCache = false;
      this._dragEventId = null;
      this._shouldFireChangeEvents = false;
      this.setAttrs(config);
      this._shouldFireChangeEvents = true;
    }
    hasChildren() {
      return false;
    }
    _clearCache(attr) {
      if ((attr === TRANSFORM || attr === ABSOLUTE_TRANSFORM) && this._cache.get(attr)) {
        this._cache.get(attr).dirty = true;
      } else if (attr) {
        this._cache.delete(attr);
      } else {
        this._cache.clear();
      }
    }
    _getCache(attr, privateGetter) {
      let cache = this._cache.get(attr);
      const isTransform = attr === TRANSFORM || attr === ABSOLUTE_TRANSFORM;
      const invalid = cache === void 0 || isTransform && cache.dirty === true;
      if (invalid) {
        cache = privateGetter.call(this);
        this._cache.set(attr, cache);
      }
      return cache;
    }
    _calculate(name, deps, getter) {
      if (!this._attachedDepsListeners.get(name)) {
        const depsString = deps.map((dep) => dep + "Change.konva").join(SPACE);
        this.on(depsString, () => {
          this._clearCache(name);
        });
        this._attachedDepsListeners.set(name, true);
      }
      return this._getCache(name, getter);
    }
    _getCanvasCache() {
      return this._cache.get(CANVAS);
    }
    _clearSelfAndDescendantCache(attr) {
      this._clearCache(attr);
      if (attr === ABSOLUTE_TRANSFORM) {
        this.fire("absoluteTransformChange");
      }
    }
    static _runAfterAbsTransformCascade(cb) {
      if (_Node._absTransformCascadeDepth > 0) {
        _Node._pendingAfterCascade.push(cb);
      } else {
        cb();
      }
    }
    clearCache() {
      if (this._cache.has(CANVAS)) {
        const { scene, filter, hit } = this._cache.get(CANVAS);
        Util.releaseCanvas(scene._canvas, filter._canvas, ...hit ? [hit._canvas] : []);
        this._cache.delete(CANVAS);
      }
      this._clearSelfAndDescendantCache();
      this._requestDraw();
      return this;
    }
    cache(config) {
      const conf = config || {};
      let rect = {};
      if (conf.x === void 0 || conf.y === void 0 || conf.width === void 0 || conf.height === void 0) {
        rect = this.getClientRect({
          skipTransform: true,
          relativeTo: this.getParent() || void 0
        });
      }
      let width = Math.ceil(conf.width || rect.width), height = Math.ceil(conf.height || rect.height), pixelRatio = conf.pixelRatio, x2 = conf.x === void 0 ? Math.floor(rect.x) : conf.x, y3 = conf.y === void 0 ? Math.floor(rect.y) : conf.y, offset = conf.offset || 0, drawBorder = conf.drawBorder || false, hitCanvasPixelRatio = conf.hitCanvasPixelRatio || 1;
      if (!width || !height) {
        Util.error("Can not cache the node. Width or height of the node equals 0. Caching is skipped.");
        return;
      }
      const extraPaddingX = Math.abs(Math.round(rect.x) - x2) > 0.5 ? 1 : 0;
      const extraPaddingY = Math.abs(Math.round(rect.y) - y3) > 0.5 ? 1 : 0;
      width += offset * 2 + extraPaddingX;
      height += offset * 2 + extraPaddingY;
      x2 -= offset;
      y3 -= offset;
      const cachedSceneCanvas = new SceneCanvas({
        pixelRatio,
        width,
        height
      }), cachedFilterCanvas = new SceneCanvas({
        pixelRatio,
        width: 0,
        height: 0,
        willReadFrequently: true
      }), sceneContext = cachedSceneCanvas.getContext();
      const bufferCanvas = new SceneCanvas({
        width: cachedSceneCanvas.width / cachedSceneCanvas.pixelRatio + Math.abs(x2),
        height: cachedSceneCanvas.height / cachedSceneCanvas.pixelRatio + Math.abs(y3),
        pixelRatio: cachedSceneCanvas.pixelRatio
      }), bufferContext = bufferCanvas.getContext();
      cachedSceneCanvas.isCache = true;
      this._cache.delete(CANVAS);
      this._filterUpToDate = false;
      if (conf.imageSmoothingEnabled === false) {
        cachedSceneCanvas.getContext()._context.imageSmoothingEnabled = false;
        cachedFilterCanvas.getContext()._context.imageSmoothingEnabled = false;
      }
      sceneContext.save();
      bufferContext.save();
      sceneContext.translate(-x2, -y3);
      bufferContext.translate(-x2, -y3);
      bufferCanvas.x = x2;
      bufferCanvas.y = y3;
      this._isUnderCache = true;
      this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
      this._clearSelfAndDescendantCache(ABSOLUTE_SCALE);
      this.drawScene(cachedSceneCanvas, this, bufferCanvas);
      this._isUnderCache = false;
      sceneContext.restore();
      if (drawBorder) {
        sceneContext.save();
        sceneContext.beginPath();
        sceneContext.rect(0, 0, width, height);
        sceneContext.closePath();
        sceneContext.setAttr("strokeStyle", "red");
        sceneContext.setAttr("lineWidth", 5);
        sceneContext.stroke();
        sceneContext.restore();
      }
      Util.releaseCanvas(bufferCanvas._canvas);
      this._cache.set(CANVAS, {
        scene: cachedSceneCanvas,
        filter: cachedFilterCanvas,
        hit: null,
        hitConfig: {
          pixelRatio: hitCanvasPixelRatio,
          width,
          height
        },
        x: x2,
        y: y3
      });
      this._requestDraw();
      return this;
    }
    _getCachedHitCanvas(top) {
      if (top === this) {
        return null;
      }
      const cache = this._getCanvasCache();
      if (!cache) {
        return null;
      }
      if (cache.hit) {
        return cache.hit;
      }
      const hitCanvas = new HitCanvas(cache.hitConfig);
      hitCanvas.isCache = true;
      const hitContext = hitCanvas.getContext();
      hitContext.save();
      hitContext.translate(-cache.x, -cache.y);
      this.drawHit(hitCanvas, this);
      hitContext.restore();
      cache.hit = hitCanvas;
      return hitCanvas;
    }
    isCached() {
      return this._cache.has(CANVAS);
    }
    getClientRect(config) {
      throw new Error('abstract "getClientRect" method call');
    }
    _transformedRect(rect, top) {
      const points = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height },
        { x: rect.x, y: rect.y + rect.height }
      ];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const trans = this.getAbsoluteTransform(top);
      points.forEach(function(point) {
        const transformed = trans.point(point);
        if (minX === void 0) {
          minX = maxX = transformed.x;
          minY = maxY = transformed.y;
        }
        minX = Math.min(minX, transformed.x);
        minY = Math.min(minY, transformed.y);
        maxX = Math.max(maxX, transformed.x);
        maxY = Math.max(maxY, transformed.y);
      });
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    _drawCachedSceneCanvas(context) {
      context.save();
      context._applyOpacity(this);
      context._applyGlobalCompositeOperation(this);
      const canvasCache = this._getCanvasCache();
      context.translate(canvasCache.x, canvasCache.y);
      const cacheCanvas = this._getCachedSceneCanvas();
      const ratio = cacheCanvas.pixelRatio;
      context.drawImage(cacheCanvas._canvas, 0, 0, cacheCanvas.width / ratio, cacheCanvas.height / ratio);
      context.restore();
    }
    _drawCachedHitCanvas(context, hitCanvas) {
      const canvasCache = this._getCanvasCache();
      context.save();
      context.translate(canvasCache.x, canvasCache.y);
      context.drawImage(hitCanvas._canvas, 0, 0, hitCanvas.width / hitCanvas.pixelRatio, hitCanvas.height / hitCanvas.pixelRatio);
      context.restore();
    }
    _getCachedSceneCanvas() {
      let filters = this.filters(), cachedCanvas = this._getCanvasCache(), sceneCanvas = cachedCanvas.scene, filterCanvas = cachedCanvas.filter, filterContext = filterCanvas.getContext(), len, imageData, n5, filter;
      if (!filters || filters.length === 0) {
        return sceneCanvas;
      }
      if (this._filterUpToDate) {
        return filterCanvas;
      }
      let useNativeOnly = true;
      for (let i3 = 0; i3 < filters.length; i3++) {
        const fallbackRequired = typeof filters[i3] === "string" && !isCSSFiltersSupported();
        if (fallbackRequired) {
        }
        if (typeof filters[i3] !== "string" || !isCSSFiltersSupported()) {
          useNativeOnly = false;
          break;
        }
      }
      const ratio = sceneCanvas.pixelRatio;
      filterCanvas.setSize(sceneCanvas.width / sceneCanvas.pixelRatio, sceneCanvas.height / sceneCanvas.pixelRatio);
      if (useNativeOnly) {
        const finalFilter = filters.join(" ");
        filterContext.save();
        filterContext.setAttr("filter", finalFilter);
        filterContext.drawImage(sceneCanvas._canvas, 0, 0, sceneCanvas.getWidth() / ratio, sceneCanvas.getHeight() / ratio);
        filterContext.restore();
        this._filterUpToDate = true;
        return filterCanvas;
      }
      try {
        len = filters.length;
        filterContext.clear();
        filterContext.drawImage(sceneCanvas._canvas, 0, 0, sceneCanvas.getWidth() / ratio, sceneCanvas.getHeight() / ratio);
        imageData = filterContext.getImageData(0, 0, filterCanvas.getWidth(), filterCanvas.getHeight());
        for (n5 = 0; n5 < len; n5++) {
          filter = filters[n5];
          if (typeof filter === "string") {
            filter = parseCSSFilters(filter);
          }
          filter.call(this, imageData);
          filterContext.putImageData(imageData, 0, 0);
        }
      } catch (e3) {
        Util.error("Unable to apply filter. " + e3.message + " This post my help you https://konvajs.org/docs/posts/Tainted_Canvas.html.");
      }
      this._filterUpToDate = true;
      return filterCanvas;
    }
    on(...args) {
      const evtStr = args[0];
      const selectorOrHandler = args[1];
      const handler = args[2];
      if (this._cache) {
        this._cache.delete(ALL_LISTENERS);
      }
      if (args.length === 3) {
        return this._delegate.apply(this, args);
      }
      const events = evtStr.split(SPACE);
      for (let n5 = 0; n5 < events.length; n5++) {
        const event = events[n5];
        const parts = event.split(".");
        const baseEvent = parts[0];
        const name = parts[1] || "";
        if (!this.eventListeners[baseEvent]) {
          this.eventListeners[baseEvent] = [];
        }
        this.eventListeners[baseEvent].push({ name, handler: selectorOrHandler });
      }
      return this;
    }
    off(evtStr, callback) {
      let events = (evtStr || "").split(SPACE), len = events.length, n5, t5, event, parts, baseEvent, name;
      this._cache && this._cache.delete(ALL_LISTENERS);
      if (!evtStr) {
        for (t5 in this.eventListeners) {
          this._off(t5);
        }
      }
      for (n5 = 0; n5 < len; n5++) {
        event = events[n5];
        parts = event.split(".");
        baseEvent = parts[0];
        name = parts[1];
        if (baseEvent) {
          if (this.eventListeners[baseEvent]) {
            this._off(baseEvent, name, callback);
          }
        } else {
          for (t5 in this.eventListeners) {
            this._off(t5, name, callback);
          }
        }
      }
      return this;
    }
    dispatchEvent(evt) {
      const e3 = {
        target: this,
        type: evt.type,
        evt
      };
      this.fire(evt.type, e3);
      return this;
    }
    addEventListener(type, handler) {
      this.on(type, function(evt) {
        handler.call(this, evt.evt);
      });
      return this;
    }
    removeEventListener(type) {
      this.off(type);
      return this;
    }
    _delegate(event, selector, handler) {
      const stopNode = this;
      this.on(event, function(evt) {
        const targets = evt.target.findAncestors(selector, true, stopNode);
        for (let i3 = 0; i3 < targets.length; i3++) {
          evt = Util.cloneObject(evt);
          evt.currentTarget = targets[i3];
          handler.call(targets[i3], evt);
        }
      });
      return this;
    }
    remove() {
      if (this.isDragging()) {
        this.stopDrag();
      }
      DD._dragElements.delete(this._id);
      DD._dragElements.forEach((elem, key) => {
        if (this.isAncestorOf(elem.node)) {
          DD._dragElements.delete(key);
        }
      });
      this._remove();
      return this;
    }
    _clearCaches() {
      this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
      this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
      this._clearSelfAndDescendantCache(ABSOLUTE_SCALE);
      this._clearSelfAndDescendantCache(STAGE);
      this._clearSelfAndDescendantCache(VISIBLE);
      this._clearSelfAndDescendantCache(LISTENING);
    }
    _remove() {
      this._clearCaches();
      const parent = this.getParent();
      if (parent && parent.children) {
        parent.children.splice(this.index, 1);
        parent._setChildrenIndices();
        this.parent = null;
      }
    }
    destroy() {
      this.remove();
      this.clearCache();
      return this;
    }
    getAttr(attr) {
      const method = "get" + Util._capitalize(attr);
      if (Util._isFunction(this[method])) {
        return this[method]();
      }
      return this.attrs[attr];
    }
    getAncestors() {
      let parent = this.getParent(), ancestors = [];
      while (parent) {
        ancestors.push(parent);
        parent = parent.getParent();
      }
      return ancestors;
    }
    getAttrs() {
      return this.attrs || {};
    }
    setAttrs(config) {
      this._batchTransformChanges(() => {
        let key, method;
        if (!config) {
          return this;
        }
        for (key in config) {
          if (key === CHILDREN) {
            continue;
          }
          method = SET2 + Util._capitalize(key);
          if (Util._isFunction(this[method])) {
            this[method](config[key]);
          } else {
            this._setAttr(key, config[key]);
          }
        }
      });
      return this;
    }
    isListening() {
      return this._getCache(LISTENING, this._isListening);
    }
    _isListening(relativeTo) {
      const listening = this.listening();
      if (!listening) {
        return false;
      }
      const parent = this.getParent();
      if (parent && parent !== relativeTo && this !== relativeTo) {
        return parent._isListening(relativeTo);
      } else {
        return true;
      }
    }
    isVisible() {
      return this._getCache(VISIBLE, this._isVisible);
    }
    _isVisible(relativeTo) {
      const visible = this.visible();
      if (!visible) {
        return false;
      }
      const parent = this.getParent();
      if (parent && parent !== relativeTo && this !== relativeTo) {
        return parent._isVisible(relativeTo);
      } else {
        return true;
      }
    }
    shouldDrawHit(top, skipDragCheck = false) {
      if (top) {
        return this._isVisible(top) && this._isListening(top);
      }
      const layer = this.getLayer();
      let layerUnderDrag = false;
      DD._dragElements.forEach((elem) => {
        if (elem.dragStatus !== "dragging") {
          return;
        } else if (elem.node.nodeType === "Stage") {
          layerUnderDrag = true;
        } else if (elem.node.getLayer() === layer) {
          layerUnderDrag = true;
        }
      });
      const dragSkip = !skipDragCheck && !Konva.hitOnDragEnabled && (layerUnderDrag || Konva.isTransforming());
      return this.isListening() && this.isVisible() && !dragSkip;
    }
    show() {
      this.visible(true);
      return this;
    }
    hide() {
      this.visible(false);
      return this;
    }
    getZIndex() {
      return this.index || 0;
    }
    getAbsoluteZIndex() {
      let depth = this.getDepth(), that = this, index = 0, nodes, len, n5, child;
      function addChildren(children) {
        nodes = [];
        len = children.length;
        for (n5 = 0; n5 < len; n5++) {
          child = children[n5];
          index++;
          if (child.nodeType !== SHAPE) {
            nodes = nodes.concat(child.getChildren().slice());
          }
          if (child._id === that._id) {
            n5 = len;
          }
        }
        if (nodes.length > 0 && nodes[0].getDepth() <= depth) {
          addChildren(nodes);
        }
      }
      const stage = this.getStage();
      if (that.nodeType !== UPPER_STAGE && stage) {
        addChildren(stage.getChildren());
      }
      return index;
    }
    getDepth() {
      let depth = 0, parent = this.parent;
      while (parent) {
        depth++;
        parent = parent.parent;
      }
      return depth;
    }
    _batchTransformChanges(func) {
      this._batchingTransformChange = true;
      func();
      this._batchingTransformChange = false;
      if (this._needClearTransformCache) {
        this._clearCache(TRANSFORM);
        this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
      }
      this._needClearTransformCache = false;
    }
    setPosition(pos) {
      this._batchTransformChanges(() => {
        this.x(pos.x);
        this.y(pos.y);
      });
      return this;
    }
    getPosition() {
      return {
        x: this.x(),
        y: this.y()
      };
    }
    getRelativePointerPosition() {
      const stage = this.getStage();
      if (!stage) {
        return null;
      }
      const pos = stage.getPointerPosition();
      if (!pos) {
        return null;
      }
      const transform = this.getAbsoluteTransform().copy();
      transform.invert();
      return transform.point(pos);
    }
    getAbsolutePosition(top) {
      let haveCachedParent = false;
      let parent = this.parent;
      while (parent) {
        if (parent.isCached()) {
          haveCachedParent = true;
          break;
        }
        parent = parent.parent;
      }
      if (haveCachedParent && !top) {
        top = true;
      }
      const absoluteMatrix = this.getAbsoluteTransform(top).getMatrix(), absoluteTransform = new Transform(), offset = this.offset();
      absoluteTransform.m = absoluteMatrix.slice();
      absoluteTransform.translate(offset.x, offset.y);
      return absoluteTransform.getTranslation();
    }
    setAbsolutePosition(pos) {
      const { x: x2, y: y3, ...origTrans } = this._clearTransform();
      this.attrs.x = x2;
      this.attrs.y = y3;
      this._clearCache(TRANSFORM);
      const it3 = this._getAbsoluteTransform().copy();
      it3.invert();
      it3.translate(pos.x, pos.y);
      pos = {
        x: this.attrs.x + it3.getTranslation().x,
        y: this.attrs.y + it3.getTranslation().y
      };
      this._setTransform(origTrans);
      this.setPosition({ x: pos.x, y: pos.y });
      this._clearCache(TRANSFORM);
      this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
      return this;
    }
    _setTransform(trans) {
      let key;
      for (key in trans) {
        this.attrs[key] = trans[key];
      }
    }
    _clearTransform() {
      const trans = {
        x: this.x(),
        y: this.y(),
        rotation: this.rotation(),
        scaleX: this.scaleX(),
        scaleY: this.scaleY(),
        offsetX: this.offsetX(),
        offsetY: this.offsetY(),
        skewX: this.skewX(),
        skewY: this.skewY()
      };
      this.attrs.x = 0;
      this.attrs.y = 0;
      this.attrs.rotation = 0;
      this.attrs.scaleX = 1;
      this.attrs.scaleY = 1;
      this.attrs.offsetX = 0;
      this.attrs.offsetY = 0;
      this.attrs.skewX = 0;
      this.attrs.skewY = 0;
      return trans;
    }
    move(change) {
      let changeX = change.x, changeY = change.y, x2 = this.x(), y3 = this.y();
      if (changeX !== void 0) {
        x2 += changeX;
      }
      if (changeY !== void 0) {
        y3 += changeY;
      }
      this.setPosition({ x: x2, y: y3 });
      return this;
    }
    _eachAncestorReverse(func, top) {
      let family = [], parent = this.getParent(), len, n5;
      if (top && top._id === this._id) {
        return;
      }
      family.unshift(this);
      while (parent && (!top || parent._id !== top._id)) {
        family.unshift(parent);
        parent = parent.parent;
      }
      len = family.length;
      for (n5 = 0; n5 < len; n5++) {
        func(family[n5]);
      }
    }
    rotate(theta) {
      this.rotation(this.rotation() + theta);
      return this;
    }
    moveToTop() {
      if (!this.parent) {
        Util.warn("Node has no parent. moveToTop function is ignored.");
        return false;
      }
      const index = this.index, len = this.parent.getChildren().length;
      if (index < len - 1) {
        this.parent.children.splice(index, 1);
        this.parent.children.push(this);
        this.parent._setChildrenIndices();
        return true;
      }
      return false;
    }
    moveUp() {
      if (!this.parent) {
        Util.warn("Node has no parent. moveUp function is ignored.");
        return false;
      }
      const index = this.index, len = this.parent.getChildren().length;
      if (index < len - 1) {
        this.parent.children.splice(index, 1);
        this.parent.children.splice(index + 1, 0, this);
        this.parent._setChildrenIndices();
        return true;
      }
      return false;
    }
    moveDown() {
      if (!this.parent) {
        Util.warn("Node has no parent. moveDown function is ignored.");
        return false;
      }
      const index = this.index;
      if (index > 0) {
        this.parent.children.splice(index, 1);
        this.parent.children.splice(index - 1, 0, this);
        this.parent._setChildrenIndices();
        return true;
      }
      return false;
    }
    moveToBottom() {
      if (!this.parent) {
        Util.warn("Node has no parent. moveToBottom function is ignored.");
        return false;
      }
      const index = this.index;
      if (index > 0) {
        this.parent.children.splice(index, 1);
        this.parent.children.unshift(this);
        this.parent._setChildrenIndices();
        return true;
      }
      return false;
    }
    setZIndex(zIndex) {
      if (!this.parent) {
        Util.warn("Node has no parent. zIndex parameter is ignored.");
        return this;
      }
      if (zIndex < 0 || zIndex >= this.parent.children.length) {
        Util.warn("Unexpected value " + zIndex + " for zIndex property. zIndex is just index of a node in children of its parent. Expected value is from 0 to " + (this.parent.children.length - 1) + ".");
      }
      const index = this.index;
      this.parent.children.splice(index, 1);
      this.parent.children.splice(zIndex, 0, this);
      this.parent._setChildrenIndices();
      return this;
    }
    getAbsoluteOpacity() {
      return this._getCache(ABSOLUTE_OPACITY, this._getAbsoluteOpacity);
    }
    _getAbsoluteOpacity() {
      let absOpacity = this.opacity();
      const parent = this.getParent();
      if (parent && !parent._isUnderCache) {
        absOpacity *= parent.getAbsoluteOpacity();
      }
      return absOpacity;
    }
    moveTo(newContainer) {
      if (this.getParent() !== newContainer) {
        this._remove();
        newContainer.add(this);
      }
      return this;
    }
    toObject() {
      let attrs = this.getAttrs(), key, val, getter, defaultValue, nonPlainObject;
      const obj = {
        attrs: {},
        className: this.getClassName()
      };
      for (key in attrs) {
        val = attrs[key];
        nonPlainObject = Util.isObject(val) && !Util._isPlainObject(val) && !Util._isArray(val);
        if (nonPlainObject) {
          continue;
        }
        getter = typeof this[key] === "function" && this[key];
        delete attrs[key];
        defaultValue = getter ? getter.call(this) : null;
        attrs[key] = val;
        if (defaultValue !== val) {
          obj.attrs[key] = val;
        }
      }
      return Util._prepareToStringify(obj);
    }
    toJSON() {
      return JSON.stringify(this.toObject());
    }
    getParent() {
      return this.parent;
    }
    findAncestors(selector, includeSelf, stopNode) {
      const res = [];
      if (includeSelf && this._isMatch(selector)) {
        res.push(this);
      }
      let ancestor = this.parent;
      while (ancestor) {
        if (ancestor === stopNode) {
          return res;
        }
        if (ancestor._isMatch(selector)) {
          res.push(ancestor);
        }
        ancestor = ancestor.parent;
      }
      return res;
    }
    isAncestorOf(node) {
      return false;
    }
    findAncestor(selector, includeSelf, stopNode) {
      return this.findAncestors(selector, includeSelf, stopNode)[0];
    }
    _isMatch(selector) {
      if (!selector) {
        return false;
      }
      if (typeof selector === "function") {
        return selector(this);
      }
      let selectorArr = selector.replace(/ /g, "").split(","), len = selectorArr.length, n5, sel;
      for (n5 = 0; n5 < len; n5++) {
        sel = selectorArr[n5];
        if (!Util.isValidSelector(sel)) {
          Util.warn('Selector "' + sel + '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".');
          Util.warn('If you have a custom shape with such className, please change it to start with upper letter like "Triangle".');
          Util.warn("Konva is awesome, right?");
        }
        if (sel.charAt(0) === "#") {
          if (this.id() === sel.slice(1)) {
            return true;
          }
        } else if (sel.charAt(0) === ".") {
          if (this.hasName(sel.slice(1))) {
            return true;
          }
        } else if (this.className === sel || this.nodeType === sel) {
          return true;
        }
      }
      return false;
    }
    getLayer() {
      const parent = this.getParent();
      return parent ? parent.getLayer() : null;
    }
    getStage() {
      return this._getCache(STAGE, this._getStage);
    }
    _getStage() {
      const parent = this.getParent();
      if (parent) {
        return parent.getStage();
      } else {
        return null;
      }
    }
    fire(eventType, evt = {}, bubble) {
      evt.target = evt.target || this;
      if (bubble) {
        this._fireAndBubble(eventType, evt);
      } else {
        this._fire(eventType, evt);
      }
      return this;
    }
    getAbsoluteTransform(top) {
      if (top) {
        return this._getAbsoluteTransform(top);
      } else {
        return this._getCache(ABSOLUTE_TRANSFORM, this._getAbsoluteTransform);
      }
    }
    _getAbsoluteTransform(top) {
      let at3;
      if (top) {
        at3 = new Transform();
        this._eachAncestorReverse(function(node) {
          const transformsEnabled = node.transformsEnabled();
          if (transformsEnabled === "all") {
            at3.multiply(node.getTransform());
          } else if (transformsEnabled === "position") {
            at3.translate(node.x() - node.offsetX(), node.y() - node.offsetY());
          }
        }, top);
        return at3;
      } else {
        at3 = this._cache.get(ABSOLUTE_TRANSFORM) || new Transform();
        if (this.parent) {
          this.parent.getAbsoluteTransform().copyInto(at3);
        } else {
          at3.reset();
        }
        const transformsEnabled = this.transformsEnabled();
        if (transformsEnabled === "all") {
          at3.multiply(this.getTransform());
        } else if (transformsEnabled === "position") {
          const x2 = this.attrs.x || 0;
          const y3 = this.attrs.y || 0;
          const offsetX = this.attrs.offsetX || 0;
          const offsetY = this.attrs.offsetY || 0;
          at3.translate(x2 - offsetX, y3 - offsetY);
        }
        at3.dirty = false;
        return at3;
      }
    }
    getAbsoluteScale(top) {
      let parent = this;
      while (parent) {
        if (parent._isUnderCache) {
          top = parent;
        }
        parent = parent.getParent();
      }
      const transform = this.getAbsoluteTransform(top);
      const attrs = transform.decompose();
      return {
        x: attrs.scaleX,
        y: attrs.scaleY
      };
    }
    getAbsoluteRotation() {
      return this.getAbsoluteTransform().decompose().rotation;
    }
    getTransform() {
      return this._getCache(TRANSFORM, this._getTransform);
    }
    _getTransform() {
      var _a, _b;
      const m3 = this._cache.get(TRANSFORM) || new Transform();
      m3.reset();
      const x2 = this.x(), y3 = this.y(), rotation = Konva.getAngle(this.rotation()), scaleX = (_a = this.attrs.scaleX) !== null && _a !== void 0 ? _a : 1, scaleY = (_b = this.attrs.scaleY) !== null && _b !== void 0 ? _b : 1, skewX = this.attrs.skewX || 0, skewY = this.attrs.skewY || 0, offsetX = this.attrs.offsetX || 0, offsetY = this.attrs.offsetY || 0;
      if (x2 !== 0 || y3 !== 0) {
        m3.translate(x2, y3);
      }
      if (rotation !== 0) {
        m3.rotate(rotation);
      }
      if (skewX !== 0 || skewY !== 0) {
        m3.skew(skewX, skewY);
      }
      if (scaleX !== 1 || scaleY !== 1) {
        m3.scale(scaleX, scaleY);
      }
      if (offsetX !== 0 || offsetY !== 0) {
        m3.translate(-1 * offsetX, -1 * offsetY);
      }
      m3.dirty = false;
      return m3;
    }
    clone(obj) {
      let attrs = Util.cloneObject(this.attrs), key, allListeners, len, n5, listener;
      for (key in obj) {
        attrs[key] = obj[key];
      }
      const node = new this.constructor(attrs);
      for (key in this.eventListeners) {
        allListeners = this.eventListeners[key];
        len = allListeners.length;
        for (n5 = 0; n5 < len; n5++) {
          listener = allListeners[n5];
          if (listener.name.indexOf(KONVA) < 0) {
            if (!node.eventListeners[key]) {
              node.eventListeners[key] = [];
            }
            node.eventListeners[key].push(listener);
          }
        }
      }
      return node;
    }
    _toKonvaCanvas(config) {
      config = config || {};
      const box = this.getClientRect();
      const stage = this.getStage(), x2 = config.x !== void 0 ? config.x : Math.floor(box.x), y3 = config.y !== void 0 ? config.y : Math.floor(box.y), pixelRatio = config.pixelRatio || 1, canvas = new SceneCanvas({
        width: config.width || Math.ceil(box.width) || (stage ? stage.width() : 0),
        height: config.height || Math.ceil(box.height) || (stage ? stage.height() : 0),
        pixelRatio
      }), context = canvas.getContext();
      const bufferCanvas = new SceneCanvas({
        width: canvas.width / canvas.pixelRatio + Math.abs(x2),
        height: canvas.height / canvas.pixelRatio + Math.abs(y3),
        pixelRatio: canvas.pixelRatio
      });
      if (config.imageSmoothingEnabled === false) {
        context._context.imageSmoothingEnabled = false;
      }
      context.save();
      if (x2 || y3) {
        context.translate(-1 * x2, -1 * y3);
      }
      this.drawScene(canvas, void 0, bufferCanvas);
      context.restore();
      return canvas;
    }
    toCanvas(config) {
      return this._toKonvaCanvas(config)._canvas;
    }
    toDataURL(config) {
      config = config || {};
      const mimeType = config.mimeType || null, quality = config.quality || null;
      const url = this._toKonvaCanvas(config).toDataURL(mimeType, quality);
      if (config.callback) {
        config.callback(url);
      }
      return url;
    }
    toImage(config) {
      return new Promise((resolve, reject) => {
        try {
          const callback = config === null || config === void 0 ? void 0 : config.callback;
          if (callback)
            delete config.callback;
          Util._urlToImage(this.toDataURL(config), function(img) {
            resolve(img);
            callback === null || callback === void 0 ? void 0 : callback(img);
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    toBlob(config) {
      return new Promise((resolve, reject) => {
        try {
          const callback = config === null || config === void 0 ? void 0 : config.callback;
          if (callback)
            delete config.callback;
          this.toCanvas(config).toBlob((blob) => {
            resolve(blob);
            callback === null || callback === void 0 ? void 0 : callback(blob);
          }, config === null || config === void 0 ? void 0 : config.mimeType, config === null || config === void 0 ? void 0 : config.quality);
        } catch (err) {
          reject(err);
        }
      });
    }
    setSize(size) {
      this.width(size.width);
      this.height(size.height);
      return this;
    }
    getSize() {
      return {
        width: this.width(),
        height: this.height()
      };
    }
    getClassName() {
      return this.className || this.nodeType;
    }
    getType() {
      return this.nodeType;
    }
    getDragDistance() {
      if (this.attrs.dragDistance !== void 0) {
        return this.attrs.dragDistance;
      } else if (this.parent) {
        return this.parent.getDragDistance();
      } else {
        return Konva.dragDistance;
      }
    }
    _off(type, name, callback) {
      let evtListeners = this.eventListeners[type], i3, evtName, handler;
      for (i3 = 0; i3 < evtListeners.length; i3++) {
        evtName = evtListeners[i3].name;
        handler = evtListeners[i3].handler;
        if ((evtName !== "konva" || name === "konva") && (!name || evtName === name) && (!callback || callback === handler)) {
          evtListeners.splice(i3, 1);
          if (evtListeners.length === 0) {
            delete this.eventListeners[type];
            break;
          }
          i3--;
        }
      }
    }
    _fireChangeEvent(attr, oldVal, newVal) {
      this._fire(attr + CHANGE, {
        oldVal,
        newVal
      });
    }
    addName(name) {
      if (!this.hasName(name)) {
        const oldName = this.name();
        const newName = oldName ? oldName + " " + name : name;
        this.name(newName);
      }
      return this;
    }
    hasName(name) {
      if (!name) {
        return false;
      }
      const fullName = this.name();
      if (!fullName) {
        return false;
      }
      const names = (fullName || "").split(/\s/g);
      return names.indexOf(name) !== -1;
    }
    removeName(name) {
      const names = (this.name() || "").split(/\s/g);
      const index = names.indexOf(name);
      if (index !== -1) {
        names.splice(index, 1);
        this.name(names.join(" "));
      }
      return this;
    }
    setAttr(attr, val) {
      const func = this[SET2 + Util._capitalize(attr)];
      if (Util._isFunction(func)) {
        func.call(this, val);
      } else {
        this._setAttr(attr, val);
      }
      return this;
    }
    _requestDraw() {
      if (Konva.autoDrawEnabled) {
        const drawNode = this.getLayer() || this.getStage();
        drawNode === null || drawNode === void 0 ? void 0 : drawNode.batchDraw();
      }
    }
    _setAttr(key, val) {
      const oldVal = this.attrs[key];
      if (oldVal === val && !Util.isObject(val)) {
        return;
      }
      if (val === void 0 || val === null) {
        delete this.attrs[key];
      } else {
        this.attrs[key] = val;
      }
      if (this._shouldFireChangeEvents) {
        this._fireChangeEvent(key, oldVal, val);
      }
      this._requestDraw();
    }
    _setComponentAttr(key, component, val) {
      let oldVal;
      if (val !== void 0) {
        oldVal = this.attrs[key];
        if (!oldVal) {
          this.attrs[key] = this.getAttr(key);
        }
        this.attrs[key][component] = val;
        this._fireChangeEvent(key, oldVal, val);
      }
    }
    _fireAndBubble(eventType, evt, compareShape) {
      if (evt && this.nodeType === SHAPE) {
        evt.target = this;
      }
      const nonBubbling = [
        MOUSEENTER,
        MOUSELEAVE,
        POINTERENTER,
        POINTERLEAVE,
        TOUCHENTER,
        TOUCHLEAVE
      ];
      const shouldStop = nonBubbling.indexOf(eventType) !== -1 && (compareShape && (this === compareShape || this.isAncestorOf && this.isAncestorOf(compareShape)) || this.nodeType === "Stage" && !compareShape);
      if (!shouldStop) {
        this._fire(eventType, evt);
        const stopBubble = nonBubbling.indexOf(eventType) !== -1 && compareShape && compareShape.isAncestorOf && compareShape.isAncestorOf(this) && !compareShape.isAncestorOf(this.parent);
        if ((evt && !evt.cancelBubble || !evt) && this.parent && this.parent.isListening() && !stopBubble) {
          if (compareShape && compareShape.parent) {
            this._fireAndBubble.call(this.parent, eventType, evt, compareShape);
          } else {
            this._fireAndBubble.call(this.parent, eventType, evt);
          }
        }
      }
    }
    _getProtoListeners(eventType) {
      var _a, _b;
      const { nodeType } = this;
      const allListeners = _Node.protoListenerMap.get(nodeType) || {};
      let events = allListeners === null || allListeners === void 0 ? void 0 : allListeners[eventType];
      if (events === void 0) {
        events = [];
        const seen = /* @__PURE__ */ new Set();
        let obj = Object.getPrototypeOf(this);
        while (obj) {
          const hierarchyEvents = (_b = (_a = obj.eventListeners) === null || _a === void 0 ? void 0 : _a[eventType]) !== null && _b !== void 0 ? _b : [];
          for (let i3 = 0; i3 < hierarchyEvents.length; i3++) {
            const entry = hierarchyEvents[i3];
            if (!seen.has(entry)) {
              seen.add(entry);
              events.push(entry);
            }
          }
          obj = Object.getPrototypeOf(obj);
        }
        allListeners[eventType] = events;
        _Node.protoListenerMap.set(nodeType, allListeners);
      }
      return events;
    }
    _fire(eventType, evt) {
      evt = evt || {};
      evt.currentTarget = this;
      evt.type = eventType;
      const topListeners = this._getProtoListeners(eventType);
      if (topListeners) {
        for (let i3 = 0; i3 < topListeners.length; i3++) {
          topListeners[i3].handler.call(this, evt);
        }
      }
      const selfListeners = this.eventListeners[eventType];
      if (selfListeners) {
        const list = selfListeners.slice();
        const origLen = list.length;
        for (let i3 = 0; i3 < list.length; i3++) {
          list[i3].handler.call(this, evt);
        }
        const liveListeners = this.eventListeners[eventType];
        if (liveListeners) {
          for (let i3 = origLen; i3 < liveListeners.length; i3++) {
            liveListeners[i3].handler.call(this, evt);
          }
        }
      }
    }
    draw() {
      this.drawScene();
      this.drawHit();
      return this;
    }
    _createDragElement(evt) {
      const pointerId = evt ? evt.pointerId : void 0;
      const stage = this.getStage();
      const ap = this.getAbsolutePosition();
      if (!stage) {
        return;
      }
      const pos = stage._getPointerById(pointerId) || stage._changedPointerPositions[0] || ap;
      DD._dragElements.set(this._id, {
        node: this,
        startPointerPos: pos,
        offset: {
          x: pos.x - ap.x,
          y: pos.y - ap.y
        },
        dragStatus: "ready",
        pointerId,
        startEvent: evt
      });
    }
    startDrag(evt, bubbleEvent = true) {
      if (!DD._dragElements.has(this._id)) {
        this._createDragElement(evt);
      }
      const elem = DD._dragElements.get(this._id);
      elem.dragStatus = "dragging";
      this.fire("dragstart", {
        type: "dragstart",
        target: this,
        evt: elem.startEvent && elem.startEvent.evt || evt && evt.evt
      }, bubbleEvent);
    }
    _setDragPosition(evt, elem) {
      const pos = this.getStage()._getPointerById(elem.pointerId);
      if (!pos) {
        return;
      }
      let newNodePos = {
        x: pos.x - elem.offset.x,
        y: pos.y - elem.offset.y
      };
      const dbf = this.dragBoundFunc();
      if (dbf !== void 0) {
        const bounded = dbf.call(this, newNodePos, evt);
        if (!bounded) {
          Util.warn("dragBoundFunc did not return any value. That is unexpected behavior. You must return new absolute position from dragBoundFunc.");
        } else {
          newNodePos = bounded;
        }
      }
      if (!this._lastPos || this._lastPos.x !== newNodePos.x || this._lastPos.y !== newNodePos.y) {
        this.setAbsolutePosition(newNodePos);
        this._requestDraw();
      }
      this._lastPos = newNodePos;
    }
    stopDrag(evt) {
      const elem = DD._dragElements.get(this._id);
      if (elem) {
        elem.dragStatus = "stopped";
      }
      DD._endDragBefore(evt);
      DD._endDragAfter(evt);
    }
    setDraggable(draggable) {
      this._setAttr("draggable", draggable);
      this._dragChange();
    }
    isDragging() {
      const elem = DD._dragElements.get(this._id);
      return elem ? elem.dragStatus === "dragging" : false;
    }
    _listenDrag() {
      this._dragCleanup();
      this.on("mousedown.konva touchstart.konva", function(evt) {
        const shouldCheckButton = evt.evt["button"] !== void 0;
        const canDrag = !shouldCheckButton || Konva.dragButtons.indexOf(evt.evt["button"]) >= 0;
        if (!canDrag) {
          return;
        }
        if (this.isDragging()) {
          return;
        }
        let hasDraggingChild = false;
        DD._dragElements.forEach((elem) => {
          if (this.isAncestorOf(elem.node)) {
            hasDraggingChild = true;
          }
        });
        if (!hasDraggingChild) {
          this._createDragElement(evt);
        }
      });
    }
    _dragChange() {
      if (this.attrs.draggable) {
        this._listenDrag();
      } else {
        this._dragCleanup();
        const stage = this.getStage();
        if (!stage) {
          return;
        }
        const dragElement = DD._dragElements.get(this._id);
        const isDragging = dragElement && dragElement.dragStatus === "dragging";
        const isReady = dragElement && dragElement.dragStatus === "ready";
        if (isDragging) {
          this.stopDrag();
        } else if (isReady) {
          DD._dragElements.delete(this._id);
        }
      }
    }
    _dragCleanup() {
      this.off("mousedown.konva");
      this.off("touchstart.konva");
    }
    isClientRectOnScreen(margin = { x: 0, y: 0 }) {
      const stage = this.getStage();
      if (!stage) {
        return false;
      }
      const screenRect = {
        x: -margin.x,
        y: -margin.y,
        width: stage.width() + 2 * margin.x,
        height: stage.height() + 2 * margin.y
      };
      return Util.haveIntersection(screenRect, this.getClientRect());
    }
    static create(data, container) {
      if (Util._isString(data)) {
        data = JSON.parse(data);
      }
      return this._createNode(data, container);
    }
    static _createNode(obj, container) {
      let className = _Node.prototype.getClassName.call(obj), children = obj.children, no, len, n5;
      if (container) {
        obj.attrs.container = container;
      }
      if (!Konva[className]) {
        Util.warn('Can not find a node with class name "' + className + '". Fallback to "Shape".');
        className = "Shape";
      }
      const Class = Konva[className];
      no = new Class(obj.attrs);
      if (children) {
        len = children.length;
        for (n5 = 0; n5 < len; n5++) {
          no.add(_Node._createNode(children[n5]));
        }
      }
      return no;
    }
  };
  Node._absTransformCascadeDepth = 0;
  Node._pendingAfterCascade = [];
  Node.protoListenerMap = /* @__PURE__ */ new Map();
  Node.prototype.nodeType = "Node";
  Node.prototype._attrsAffectingSize = [];
  Node.prototype.eventListeners = {};
  Node.prototype.on(TRANSFORM_CHANGE_STR, function() {
    if (this._batchingTransformChange) {
      this._needClearTransformCache = true;
      return;
    }
    this._clearCache(TRANSFORM);
    this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
  });
  Node.prototype.on("visibleChange.konva", function() {
    this._clearSelfAndDescendantCache(VISIBLE);
  });
  Node.prototype.on("listeningChange.konva", function() {
    this._clearSelfAndDescendantCache(LISTENING);
  });
  Node.prototype.on("opacityChange.konva", function() {
    this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
  });
  var addGetterSetter = Factory.addGetterSetter;
  addGetterSetter(Node, "zIndex");
  addGetterSetter(Node, "absolutePosition");
  addGetterSetter(Node, "position");
  addGetterSetter(Node, "x", 0, getNumberValidator());
  addGetterSetter(Node, "y", 0, getNumberValidator());
  addGetterSetter(Node, "globalCompositeOperation", "source-over", getStringValidator());
  addGetterSetter(Node, "opacity", 1, getNumberValidator());
  addGetterSetter(Node, "name", "", getStringValidator());
  addGetterSetter(Node, "id", "", getStringValidator());
  addGetterSetter(Node, "rotation", 0, getNumberValidator());
  Factory.addComponentsGetterSetter(Node, "scale", ["x", "y"]);
  addGetterSetter(Node, "scaleX", 1, getNumberValidator());
  addGetterSetter(Node, "scaleY", 1, getNumberValidator());
  Factory.addComponentsGetterSetter(Node, "skew", ["x", "y"]);
  addGetterSetter(Node, "skewX", 0, getNumberValidator());
  addGetterSetter(Node, "skewY", 0, getNumberValidator());
  Factory.addComponentsGetterSetter(Node, "offset", ["x", "y"]);
  addGetterSetter(Node, "offsetX", 0, getNumberValidator());
  addGetterSetter(Node, "offsetY", 0, getNumberValidator());
  addGetterSetter(Node, "dragDistance", void 0, getNumberValidator());
  addGetterSetter(Node, "width", 0, getNumberValidator());
  addGetterSetter(Node, "height", 0, getNumberValidator());
  addGetterSetter(Node, "listening", true, getBooleanValidator());
  addGetterSetter(Node, "preventDefault", true, getBooleanValidator());
  addGetterSetter(Node, "filters", void 0, function(val) {
    this._filterUpToDate = false;
    return val;
  });
  addGetterSetter(Node, "visible", true, getBooleanValidator());
  addGetterSetter(Node, "transformsEnabled", "all", getStringValidator());
  addGetterSetter(Node, "size");
  addGetterSetter(Node, "dragBoundFunc");
  addGetterSetter(Node, "draggable", false, getBooleanValidator());
  Factory.backCompat(Node, {
    rotateDeg: "rotate",
    setRotationDeg: "setRotation",
    getRotationDeg: "getRotation"
  });

  // node_modules/konva/lib/Container.js
  var Container = class extends Node {
    constructor() {
      super(...arguments);
      this.children = [];
    }
    getChildren(filterFunc) {
      const children = this.children || [];
      if (filterFunc) {
        return children.filter(filterFunc);
      }
      return children;
    }
    hasChildren() {
      return this.getChildren().length > 0;
    }
    removeChildren() {
      this.getChildren().forEach((child) => {
        child.parent = null;
        child.index = 0;
        child.remove();
      });
      this.children = [];
      this._requestDraw();
      return this;
    }
    destroyChildren() {
      this.getChildren().forEach((child) => {
        child.parent = null;
        child.index = 0;
        child.destroy();
      });
      this.children = [];
      this._requestDraw();
      return this;
    }
    add(...children) {
      if (children.length === 0) {
        return this;
      }
      if (children.length > 1) {
        for (let i3 = 0; i3 < children.length; i3++) {
          this.add(children[i3]);
        }
        return this;
      }
      const child = children[0];
      if (child.getParent()) {
        child.moveTo(this);
        return this;
      }
      this._validateAdd(child);
      child.index = this.getChildren().length;
      child.parent = this;
      child._clearCaches();
      this.getChildren().push(child);
      this._fire("add", {
        child
      });
      this._requestDraw();
      return this;
    }
    destroy() {
      if (this.hasChildren()) {
        this.destroyChildren();
      }
      super.destroy();
      return this;
    }
    find(selector) {
      return this._generalFind(selector, false);
    }
    findOne(selector) {
      const result = this._generalFind(selector, true);
      return result.length > 0 ? result[0] : void 0;
    }
    _generalFind(selector, findOne) {
      const retArr = [];
      this._descendants((node) => {
        const valid = node._isMatch(selector);
        if (valid) {
          retArr.push(node);
        }
        if (valid && findOne) {
          return true;
        }
        return false;
      });
      return retArr;
    }
    _descendants(fn) {
      let shouldStop = false;
      const children = this.getChildren();
      for (const child of children) {
        shouldStop = fn(child);
        if (shouldStop) {
          return true;
        }
        if (!child.hasChildren()) {
          continue;
        }
        shouldStop = child._descendants(fn);
        if (shouldStop) {
          return true;
        }
      }
      return false;
    }
    toObject() {
      const obj = Node.prototype.toObject.call(this);
      obj.children = [];
      this.getChildren().forEach((child) => {
        obj.children.push(child.toObject());
      });
      return obj;
    }
    isAncestorOf(node) {
      let parent = node.getParent();
      while (parent) {
        if (parent._id === this._id) {
          return true;
        }
        parent = parent.getParent();
      }
      return false;
    }
    clone(obj) {
      const node = Node.prototype.clone.call(this, obj);
      this.getChildren().forEach(function(no) {
        node.add(no.clone());
      });
      return node;
    }
    getAllIntersections(pos) {
      const arr = [];
      this.find("Shape").forEach((shape) => {
        if (shape.isVisible() && shape.intersects(pos)) {
          arr.push(shape);
        }
      });
      return arr;
    }
    _clearSelfAndDescendantCache(attr) {
      var _a;
      const isAbsTransform = attr === "absoluteTransform";
      if (isAbsTransform)
        Node._absTransformCascadeDepth++;
      try {
        super._clearSelfAndDescendantCache(attr);
        if (this.isCached())
          return;
        (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function(node) {
          node._clearSelfAndDescendantCache(attr);
        });
      } finally {
        if (isAbsTransform && --Node._absTransformCascadeDepth === 0) {
          const callbacks = Node._pendingAfterCascade;
          if (callbacks.length) {
            Node._pendingAfterCascade = [];
            for (let i3 = 0; i3 < callbacks.length; i3++)
              callbacks[i3]();
          }
        }
      }
    }
    _setChildrenIndices() {
      var _a;
      (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function(child, n5) {
        child.index = n5;
      });
      this._requestDraw();
    }
    drawScene(can, top, bufferCanvas) {
      const layer = this.getLayer(), canvas = can || layer && layer.getCanvas(), context = canvas && canvas.getContext(), cachedCanvas = this._getCanvasCache(), cachedSceneCanvas = cachedCanvas && cachedCanvas.scene;
      const caching = canvas && canvas.isCache;
      if (!this.isVisible() && !caching) {
        return this;
      }
      if (cachedSceneCanvas) {
        context.save();
        const m3 = this.getAbsoluteTransform(top).getMatrix();
        context.transform(m3[0], m3[1], m3[2], m3[3], m3[4], m3[5]);
        this._drawCachedSceneCanvas(context);
        context.restore();
      } else {
        this._drawChildren("drawScene", canvas, top, bufferCanvas);
      }
      return this;
    }
    drawHit(can, top) {
      if (!this.shouldDrawHit(top)) {
        return this;
      }
      const layer = this.getLayer(), canvas = can || layer && layer.hitCanvas, context = canvas && canvas.getContext(), cachedHitCanvas = this._getCachedHitCanvas(top);
      if (cachedHitCanvas) {
        context.save();
        const m3 = this.getAbsoluteTransform(top).getMatrix();
        context.transform(m3[0], m3[1], m3[2], m3[3], m3[4], m3[5]);
        this._drawCachedHitCanvas(context, cachedHitCanvas);
        context.restore();
      } else {
        this._drawChildren("drawHit", canvas, top);
      }
      return this;
    }
    _drawChildren(drawMethod, canvas, top, bufferCanvas) {
      var _a;
      const context = canvas && canvas.getContext(), clipWidth = this.clipWidth(), clipHeight = this.clipHeight(), clipFunc = this.clipFunc(), hasClip = typeof clipWidth === "number" && typeof clipHeight === "number" || clipFunc;
      const selfCache = top === this;
      if (hasClip) {
        context.save();
        const transform = this.getAbsoluteTransform(top);
        let m3 = transform.getMatrix();
        context.transform(m3[0], m3[1], m3[2], m3[3], m3[4], m3[5]);
        context.beginPath();
        let clipArgs;
        if (clipFunc) {
          clipArgs = clipFunc.call(this, context, this);
        } else {
          const clipX = this.clipX();
          const clipY = this.clipY();
          context.rect(clipX || 0, clipY || 0, clipWidth, clipHeight);
        }
        context.clip.apply(context, clipArgs);
        m3 = transform.copy().invert().getMatrix();
        context.transform(m3[0], m3[1], m3[2], m3[3], m3[4], m3[5]);
      }
      const hasComposition = !selfCache && this.globalCompositeOperation() !== "source-over" && drawMethod === "drawScene";
      if (hasComposition) {
        context.save();
        context._applyGlobalCompositeOperation(this);
      }
      (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function(child) {
        child[drawMethod](canvas, top, bufferCanvas);
      });
      if (hasComposition) {
        context.restore();
      }
      if (hasClip) {
        context.restore();
      }
    }
    getClientRect(config = {}) {
      var _a;
      const skipTransform = config.skipTransform;
      const relativeTo = config.relativeTo;
      let minX, minY, maxX, maxY;
      let selfRect = {
        x: Infinity,
        y: Infinity,
        width: 0,
        height: 0
      };
      const that = this;
      (_a = this.children) === null || _a === void 0 ? void 0 : _a.forEach(function(child) {
        if (!child.visible()) {
          return;
        }
        const rect = child.getClientRect({
          relativeTo: that,
          skipShadow: config.skipShadow,
          skipStroke: config.skipStroke
        });
        if (rect.width === 0 && rect.height === 0) {
          return;
        }
        if (minX === void 0) {
          minX = rect.x;
          minY = rect.y;
          maxX = rect.x + rect.width;
          maxY = rect.y + rect.height;
        } else {
          minX = Math.min(minX, rect.x);
          minY = Math.min(minY, rect.y);
          maxX = Math.max(maxX, rect.x + rect.width);
          maxY = Math.max(maxY, rect.y + rect.height);
        }
      });
      const shapes2 = this.find("Shape");
      let hasVisible = false;
      for (let i3 = 0; i3 < shapes2.length; i3++) {
        const shape = shapes2[i3];
        if (shape._isVisible(this)) {
          hasVisible = true;
          break;
        }
      }
      if (hasVisible && minX !== void 0) {
        selfRect = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      } else {
        selfRect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      }
      if (!skipTransform) {
        return this._transformedRect(selfRect, relativeTo);
      }
      return selfRect;
    }
  };
  Factory.addComponentsGetterSetter(Container, "clip", [
    "x",
    "y",
    "width",
    "height"
  ]);
  Factory.addGetterSetter(Container, "clipX", void 0, getNumberValidator());
  Factory.addGetterSetter(Container, "clipY", void 0, getNumberValidator());
  Factory.addGetterSetter(Container, "clipWidth", void 0, getNumberValidator());
  Factory.addGetterSetter(Container, "clipHeight", void 0, getNumberValidator());
  Factory.addGetterSetter(Container, "clipFunc");

  // node_modules/konva/lib/PointerEvents.js
  var Captures = /* @__PURE__ */ new Map();
  var SUPPORT_POINTER_EVENTS = Konva._global["PointerEvent"] !== void 0;
  function getCapturedShape(pointerId) {
    return Captures.get(pointerId);
  }
  function createEvent(evt) {
    return {
      evt,
      pointerId: evt.pointerId
    };
  }
  function hasPointerCapture(pointerId, shape) {
    return Captures.get(pointerId) === shape;
  }
  function setPointerCapture(pointerId, shape) {
    var _a;
    releaseCapture(pointerId);
    const stage = shape.getStage();
    if (!stage)
      return;
    Captures.set(pointerId, shape);
    if (SUPPORT_POINTER_EVENTS) {
      try {
        (_a = stage.content) === null || _a === void 0 ? void 0 : _a.setPointerCapture(pointerId);
      } catch (e3) {
      }
      shape._fire("gotpointercapture", createEvent(new PointerEvent("gotpointercapture")));
    }
  }
  function releaseCapture(pointerId, target) {
    var _a;
    const shape = Captures.get(pointerId);
    if (!shape)
      return;
    const stage = shape.getStage();
    Captures.delete(pointerId);
    if (SUPPORT_POINTER_EVENTS) {
      try {
        (_a = stage === null || stage === void 0 ? void 0 : stage.content) === null || _a === void 0 ? void 0 : _a.releasePointerCapture(pointerId);
      } catch (e3) {
      }
      shape._fire("lostpointercapture", createEvent(new PointerEvent("lostpointercapture")));
    }
  }

  // node_modules/konva/lib/Stage.js
  var STAGE2 = "Stage";
  var STRING = "string";
  var PX = "px";
  var MOUSEOUT = "mouseout";
  var MOUSELEAVE2 = "mouseleave";
  var MOUSEOVER = "mouseover";
  var MOUSEENTER2 = "mouseenter";
  var MOUSEMOVE = "mousemove";
  var MOUSEDOWN = "mousedown";
  var MOUSEUP = "mouseup";
  var POINTERMOVE = "pointermove";
  var POINTERDOWN = "pointerdown";
  var POINTERUP = "pointerup";
  var POINTERCANCEL = "pointercancel";
  var LOSTPOINTERCAPTURE = "lostpointercapture";
  var POINTEROUT = "pointerout";
  var POINTERLEAVE2 = "pointerleave";
  var POINTEROVER = "pointerover";
  var POINTERENTER2 = "pointerenter";
  var CONTEXTMENU = "contextmenu";
  var TOUCHSTART = "touchstart";
  var TOUCHEND = "touchend";
  var TOUCHMOVE = "touchmove";
  var TOUCHCANCEL = "touchcancel";
  var WHEEL = "wheel";
  var MAX_LAYERS_NUMBER = 5;
  var EVENTS = [
    [MOUSEENTER2, "_pointerenter"],
    [MOUSEDOWN, "_pointerdown"],
    [MOUSEMOVE, "_pointermove"],
    [MOUSEUP, "_pointerup"],
    [MOUSELEAVE2, "_pointerleave"],
    [TOUCHSTART, "_pointerdown"],
    [TOUCHMOVE, "_pointermove"],
    [TOUCHEND, "_pointerup"],
    [TOUCHCANCEL, "_pointercancel"],
    [MOUSEOVER, "_pointerover"],
    [WHEEL, "_wheel"],
    [CONTEXTMENU, "_contextmenu"],
    [POINTERDOWN, "_pointerdown"],
    [POINTERMOVE, "_pointermove"],
    [POINTERUP, "_pointerup"],
    [POINTERCANCEL, "_pointercancel"],
    [POINTERLEAVE2, "_pointerleave"],
    [LOSTPOINTERCAPTURE, "_lostpointercapture"]
  ];
  var EVENTS_MAP = {
    mouse: {
      [POINTEROUT]: MOUSEOUT,
      [POINTERLEAVE2]: MOUSELEAVE2,
      [POINTEROVER]: MOUSEOVER,
      [POINTERENTER2]: MOUSEENTER2,
      [POINTERMOVE]: MOUSEMOVE,
      [POINTERDOWN]: MOUSEDOWN,
      [POINTERUP]: MOUSEUP,
      [POINTERCANCEL]: "mousecancel",
      pointerclick: "click",
      pointerdblclick: "dblclick"
    },
    touch: {
      [POINTEROUT]: "touchout",
      [POINTERLEAVE2]: "touchleave",
      [POINTEROVER]: "touchover",
      [POINTERENTER2]: "touchenter",
      [POINTERMOVE]: TOUCHMOVE,
      [POINTERDOWN]: TOUCHSTART,
      [POINTERUP]: TOUCHEND,
      [POINTERCANCEL]: TOUCHCANCEL,
      pointerclick: "tap",
      pointerdblclick: "dbltap"
    },
    pointer: {
      [POINTEROUT]: POINTEROUT,
      [POINTERLEAVE2]: POINTERLEAVE2,
      [POINTEROVER]: POINTEROVER,
      [POINTERENTER2]: POINTERENTER2,
      [POINTERMOVE]: POINTERMOVE,
      [POINTERDOWN]: POINTERDOWN,
      [POINTERUP]: POINTERUP,
      [POINTERCANCEL]: POINTERCANCEL,
      pointerclick: "pointerclick",
      pointerdblclick: "pointerdblclick"
    }
  };
  var getEventType = (type) => {
    if (type.indexOf("pointer") >= 0) {
      return "pointer";
    }
    if (type.indexOf("touch") >= 0) {
      return "touch";
    }
    return "mouse";
  };
  var getEventsMap = (eventType) => {
    const type = getEventType(eventType);
    if (type === "pointer") {
      return Konva.pointerEventsEnabled && EVENTS_MAP.pointer;
    }
    if (type === "touch") {
      return EVENTS_MAP.touch;
    }
    if (type === "mouse") {
      return EVENTS_MAP.mouse;
    }
  };
  function checkNoClip(attrs = {}) {
    if (attrs.clipFunc || attrs.clipWidth || attrs.clipHeight) {
      Util.warn("Stage does not support clipping. Please use clip for Layers or Groups.");
    }
    return attrs;
  }
  var NO_POINTERS_MESSAGE = `Pointer position is missing and not registered by the stage. Looks like it is outside of the stage container. You can set it manually from event: stage.setPointersPositions(event);`;
  var stages = [];
  var listeningWindows = /* @__PURE__ */ new WeakSet();
  var listenToWindow = (win) => {
    if (!win || listeningWindows.has(win)) {
      return;
    }
    listeningWindows.add(win);
    DD._listenToWindow(win);
    win.document.addEventListener("visibilitychange", () => {
      stages.forEach((stage) => {
        stage.batchDraw();
      });
    });
  };
  var Stage = class extends Container {
    constructor(config) {
      super(checkNoClip(config));
      this._pointerPositions = [];
      this._changedPointerPositions = [];
      this._buildDOM();
      this._bindContentEvents();
      stages.push(this);
      this.on("widthChange.konva heightChange.konva", this._resizeDOM);
      this.on("visibleChange.konva", this._checkVisibility);
      this.on("clipWidthChange.konva clipHeightChange.konva clipFuncChange.konva", () => {
        checkNoClip(this.attrs);
      });
      this._checkVisibility();
    }
    _validateAdd(child) {
      const isLayer = child.getType() === "Layer";
      const isFastLayer = child.getType() === "FastLayer";
      const valid = isLayer || isFastLayer;
      if (!valid) {
        Util.throw("You may only add layers to the stage.");
      }
    }
    _checkVisibility() {
      if (!this.content) {
        return;
      }
      const style = this.visible() ? "" : "none";
      this.content.style.display = style;
    }
    _getOwnerWindow() {
      var _a;
      const element = this.content || this.container();
      return ((_a = element === null || element === void 0 ? void 0 : element.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) || (Konva.isBrowser ? window : null);
    }
    setContainer(container) {
      if (typeof container === STRING) {
        let id;
        if (container.charAt(0) === ".") {
          const className = container.slice(1);
          container = document.getElementsByClassName(className)[0];
        } else {
          if (container.charAt(0) !== "#") {
            id = container;
          } else {
            id = container.slice(1);
          }
          container = document.getElementById(id);
        }
        if (!container) {
          throw "Can not find container in document with id " + id;
        }
      }
      this._setAttr("container", container);
      if (this.content) {
        if (this.content.parentElement) {
          this.content.parentElement.removeChild(this.content);
        }
        container.appendChild(this.content);
        listenToWindow(this._getOwnerWindow());
      }
      return this;
    }
    shouldDrawHit() {
      return true;
    }
    clear() {
      const layers = this.children, len = layers.length;
      for (let n5 = 0; n5 < len; n5++) {
        layers[n5].clear();
      }
      return this;
    }
    clone(obj) {
      if (!obj) {
        obj = {};
      }
      obj.container = typeof document !== "undefined" && document.createElement("div");
      return Container.prototype.clone.call(this, obj);
    }
    destroy() {
      super.destroy();
      const content = this.content;
      if (content && Util._isInDocument(content)) {
        this.container().removeChild(content);
      }
      const index = stages.indexOf(this);
      if (index > -1) {
        stages.splice(index, 1);
      }
      Util.releaseCanvas(this.bufferCanvas._canvas, this.bufferHitCanvas._canvas);
      return this;
    }
    getPointerPosition() {
      const pos = this._pointerPositions[0] || this._changedPointerPositions[0];
      if (!pos) {
        Util.warn(NO_POINTERS_MESSAGE);
        return null;
      }
      return {
        x: pos.x,
        y: pos.y
      };
    }
    _getPointerById(id) {
      return this._pointerPositions.find((p3) => p3.id === id);
    }
    getPointersPositions() {
      return this._pointerPositions;
    }
    getStage() {
      return this;
    }
    getContent() {
      return this.content;
    }
    _toKonvaCanvas(config) {
      config = { ...config };
      config.x = config.x || 0;
      config.y = config.y || 0;
      config.width = config.width || this.width();
      config.height = config.height || this.height();
      const canvas = new SceneCanvas({
        width: config.width,
        height: config.height,
        pixelRatio: config.pixelRatio || 1
      });
      const _context = canvas.getContext()._context;
      const layers = this.children;
      if (config.x || config.y) {
        _context.translate(-1 * config.x, -1 * config.y);
      }
      layers.forEach(function(layer) {
        if (!layer.isVisible()) {
          return;
        }
        const layerCanvas = layer._toKonvaCanvas(config);
        _context.drawImage(layerCanvas._canvas, config.x, config.y, layerCanvas.getWidth() / layerCanvas.getPixelRatio(), layerCanvas.getHeight() / layerCanvas.getPixelRatio());
      });
      return canvas;
    }
    getIntersection(pos) {
      if (!pos) {
        return null;
      }
      const layers = this.children, len = layers.length, end = len - 1;
      for (let n5 = end; n5 >= 0; n5--) {
        const shape = layers[n5].getIntersection(pos);
        if (shape) {
          return shape;
        }
      }
      return null;
    }
    _resizeDOM() {
      const width = this.width();
      const height = this.height();
      if (this.content) {
        this.content.style.width = width + PX;
        this.content.style.height = height + PX;
      }
      this.children.forEach((layer) => {
        layer.setSize({ width, height });
        layer.draw();
      });
    }
    _syncBufferSize(canvas) {
      canvas.setSizeIfChanged(this.width(), this.height());
      return canvas;
    }
    add(layer, ...rest) {
      if (arguments.length > 1) {
        for (let i3 = 0; i3 < arguments.length; i3++) {
          this.add(arguments[i3]);
        }
        return this;
      }
      super.add(layer);
      const length = this.children.length;
      if (length > MAX_LAYERS_NUMBER) {
        Util.warn("The stage has " + length + " layers. Recommended maximum number of layers is 3-5. Adding more layers into the stage may drop the performance. Rethink your tree structure, you can use Konva.Group.");
      }
      layer.setSize({ width: this.width(), height: this.height() });
      layer.draw();
      if (Konva.isBrowser) {
        this.content.appendChild(layer.canvas._canvas);
      }
      return this;
    }
    getParent() {
      return null;
    }
    getLayer() {
      return null;
    }
    hasPointerCapture(pointerId) {
      return hasPointerCapture(pointerId, this);
    }
    setPointerCapture(pointerId) {
      setPointerCapture(pointerId, this);
    }
    releaseCapture(pointerId) {
      releaseCapture(pointerId, this);
    }
    getLayers() {
      return this.children;
    }
    _bindContentEvents() {
      if (!Konva.isBrowser) {
        return;
      }
      EVENTS.forEach(([event, methodName]) => {
        this.content.addEventListener(event, (evt) => {
          this[methodName](evt);
        }, { passive: false });
      });
    }
    _pointerenter(evt) {
      this.setPointersPositions(evt);
      const events = getEventsMap(evt.type);
      if (events) {
        this._fire(events.pointerenter, {
          evt,
          target: this,
          currentTarget: this
        });
      }
    }
    _pointerover(evt) {
      this.setPointersPositions(evt);
      const events = getEventsMap(evt.type);
      if (events) {
        this._fire(events.pointerover, {
          evt,
          target: this,
          currentTarget: this
        });
      }
    }
    _getTargetShape(evenType) {
      let shape = this[evenType + "targetShape"];
      if (shape && !shape.getStage()) {
        shape = null;
      }
      return shape;
    }
    _pointerleave(evt) {
      const events = getEventsMap(evt.type);
      const eventType = getEventType(evt.type);
      if (!events) {
        return;
      }
      this.setPointersPositions(evt);
      const targetShape = this._getTargetShape(eventType);
      const eventsEnabled = !(Konva.isDragging() || Konva.isTransforming()) || Konva.hitOnDragEnabled;
      if (targetShape && eventsEnabled) {
        targetShape._fireAndBubble(events.pointerout, { evt });
        targetShape._fireAndBubble(events.pointerleave, { evt });
        this._fire(events.pointerleave, {
          evt,
          target: this,
          currentTarget: this
        });
        this[eventType + "targetShape"] = null;
      } else if (eventsEnabled) {
        this._fire(events.pointerleave, {
          evt,
          target: this,
          currentTarget: this
        });
        this._fire(events.pointerout, {
          evt,
          target: this,
          currentTarget: this
        });
      }
      this.pointerPos = null;
      this._pointerPositions = [];
    }
    _pointerdown(evt) {
      const events = getEventsMap(evt.type);
      const eventType = getEventType(evt.type);
      if (!events) {
        return;
      }
      this.setPointersPositions(evt);
      let triggeredOnShape = false;
      this._changedPointerPositions.forEach((pos) => {
        const shape = this.getIntersection(pos);
        DD.justDragged = false;
        Konva["_" + eventType + "ListenClick"] = true;
        if (!shape || !shape.isListening()) {
          this[eventType + "ClickStartShape"] = void 0;
          return;
        }
        if (Konva.capturePointerEventsEnabled) {
          shape.setPointerCapture(pos.id);
        }
        this[eventType + "ClickStartShape"] = shape;
        shape._fireAndBubble(events.pointerdown, {
          evt,
          pointerId: pos.id
        });
        triggeredOnShape = true;
        const isTouch = evt.type.indexOf("touch") >= 0;
        if (shape.preventDefault() && evt.cancelable && isTouch) {
          evt.preventDefault();
        }
      });
      if (!triggeredOnShape) {
        this._fire(events.pointerdown, {
          evt,
          target: this,
          currentTarget: this,
          pointerId: this._pointerPositions[0].id
        });
      }
    }
    _pointermove(evt) {
      const events = getEventsMap(evt.type);
      const eventType = getEventType(evt.type);
      if (!events) {
        return;
      }
      const isTouchPointer = evt.type.indexOf("touch") >= 0 || evt.pointerType === "touch";
      if (Konva.isDragging() && DD.node.preventDefault() && evt.cancelable && isTouchPointer) {
        evt.preventDefault();
      }
      this.setPointersPositions(evt);
      const eventsEnabled = !(Konva.isDragging() || Konva.isTransforming()) || Konva.hitOnDragEnabled;
      if (!eventsEnabled) {
        return;
      }
      const processedShapesIds = {};
      let triggeredOnShape = false;
      const targetShape = this._getTargetShape(eventType);
      this._changedPointerPositions.forEach((pos) => {
        const shape = getCapturedShape(pos.id) || this.getIntersection(pos);
        const pointerId = pos.id;
        const event = { evt, pointerId };
        const differentTarget = targetShape !== shape;
        if (differentTarget && targetShape) {
          targetShape._fireAndBubble(events.pointerout, { ...event }, shape);
          targetShape._fireAndBubble(events.pointerleave, { ...event }, shape);
        }
        if (shape) {
          if (processedShapesIds[shape._id]) {
            return;
          }
          processedShapesIds[shape._id] = true;
        }
        if (shape && shape.isListening()) {
          triggeredOnShape = true;
          if (differentTarget) {
            shape._fireAndBubble(events.pointerover, { ...event }, targetShape);
            shape._fireAndBubble(events.pointerenter, { ...event }, targetShape);
            this[eventType + "targetShape"] = shape;
          }
          shape._fireAndBubble(events.pointermove, { ...event });
        } else {
          if (targetShape) {
            this._fire(events.pointerover, {
              evt,
              target: this,
              currentTarget: this,
              pointerId
            });
            this[eventType + "targetShape"] = null;
          }
        }
      });
      if (!triggeredOnShape) {
        this._fire(events.pointermove, {
          evt,
          target: this,
          currentTarget: this,
          pointerId: this._changedPointerPositions[0].id
        });
      }
    }
    _pointerup(evt) {
      const events = getEventsMap(evt.type);
      const eventType = getEventType(evt.type);
      if (!events) {
        return;
      }
      this.setPointersPositions(evt);
      const wasDragged = DD.justDragged || eventType === "pointer" && Konva.isDragging();
      const listenClick = Konva["_" + eventType + "ListenClick"] && !wasDragged;
      const clickStartShape = this[eventType + "ClickStartShape"];
      const clickEndShape = this[eventType + "ClickEndShape"];
      const processedShapesIds = {};
      let skipPointerUpTrigger = false;
      this._changedPointerPositions.forEach((pos) => {
        const shape = getCapturedShape(pos.id) || this.getIntersection(pos);
        if (shape) {
          shape.releaseCapture(pos.id);
          if (processedShapesIds[shape._id]) {
            return;
          }
          processedShapesIds[shape._id] = true;
        }
        const pointerId = pos.id;
        const event = { evt, pointerId };
        let fireDblClick = false;
        if (Konva["_" + eventType + "InDblClickWindow"]) {
          fireDblClick = true;
          clearTimeout(this[eventType + "DblTimeout"]);
        } else if (!wasDragged) {
          Konva["_" + eventType + "InDblClickWindow"] = true;
          clearTimeout(this[eventType + "DblTimeout"]);
        }
        this[eventType + "DblTimeout"] = setTimeout(function() {
          Konva["_" + eventType + "InDblClickWindow"] = false;
        }, Konva.dblClickWindow);
        if (shape && shape.isListening()) {
          skipPointerUpTrigger = true;
          this[eventType + "ClickEndShape"] = shape;
          shape._fireAndBubble(events.pointerup, { ...event });
          if (listenClick && clickStartShape === shape) {
            shape._fireAndBubble(events.pointerclick, { ...event });
            if (fireDblClick && clickEndShape && clickEndShape === shape) {
              shape._fireAndBubble(events.pointerdblclick, { ...event });
            }
          }
        } else {
          this[eventType + "ClickEndShape"] = null;
          if (!skipPointerUpTrigger) {
            this._fire(events.pointerup, {
              evt,
              target: this,
              currentTarget: this,
              pointerId: this._changedPointerPositions[0].id
            });
            skipPointerUpTrigger = true;
          }
          if (listenClick) {
            this._fire(events.pointerclick, {
              evt,
              target: this,
              currentTarget: this,
              pointerId
            });
          }
          if (fireDblClick) {
            this._fire(events.pointerdblclick, {
              evt,
              target: this,
              currentTarget: this,
              pointerId
            });
          }
        }
      });
      if (!skipPointerUpTrigger) {
        this._fire(events.pointerup, {
          evt,
          target: this,
          currentTarget: this,
          pointerId: this._changedPointerPositions[0].id
        });
      }
      Konva["_" + eventType + "ListenClick"] = false;
      if (evt.cancelable && eventType !== "touch" && eventType !== "pointer") {
        evt.preventDefault();
      }
    }
    _contextmenu(evt) {
      this.setPointersPositions(evt);
      const shape = this.getIntersection(this.getPointerPosition());
      if (shape && shape.isListening()) {
        shape._fireAndBubble(CONTEXTMENU, { evt });
      } else {
        this._fire(CONTEXTMENU, {
          evt,
          target: this,
          currentTarget: this
        });
      }
    }
    _wheel(evt) {
      this.setPointersPositions(evt);
      const shape = this.getIntersection(this.getPointerPosition());
      if (shape && shape.isListening()) {
        shape._fireAndBubble(WHEEL, { evt });
      } else {
        this._fire(WHEEL, {
          evt,
          target: this,
          currentTarget: this
        });
      }
    }
    _pointercancel(evt) {
      this.setPointersPositions(evt);
      const shape = getCapturedShape(evt.pointerId) || this.getIntersection(this.getPointerPosition());
      if (shape) {
        shape._fireAndBubble(POINTERUP, createEvent(evt));
      }
      releaseCapture(evt.pointerId);
    }
    _lostpointercapture(evt) {
      releaseCapture(evt.pointerId);
    }
    setPointersPositions(evt) {
      const contentPosition = this._getContentPosition();
      let x2 = null, y3 = null;
      evt = evt ? evt : window.event;
      if (evt.touches !== void 0) {
        this._pointerPositions = [];
        this._changedPointerPositions = [];
        Array.prototype.forEach.call(evt.touches, (touch) => {
          this._pointerPositions.push({
            id: touch.identifier,
            x: (touch.clientX - contentPosition.left) / contentPosition.scaleX,
            y: (touch.clientY - contentPosition.top) / contentPosition.scaleY
          });
        });
        Array.prototype.forEach.call(evt.changedTouches || evt.touches, (touch) => {
          this._changedPointerPositions.push({
            id: touch.identifier,
            x: (touch.clientX - contentPosition.left) / contentPosition.scaleX,
            y: (touch.clientY - contentPosition.top) / contentPosition.scaleY
          });
        });
      } else {
        x2 = (evt.clientX - contentPosition.left) / contentPosition.scaleX;
        y3 = (evt.clientY - contentPosition.top) / contentPosition.scaleY;
        this.pointerPos = {
          x: x2,
          y: y3
        };
        this._pointerPositions = [{ x: x2, y: y3, id: Util._getFirstPointerId(evt) }];
        this._changedPointerPositions = [
          { x: x2, y: y3, id: Util._getFirstPointerId(evt) }
        ];
      }
    }
    _setPointerPosition(evt) {
      Util.warn('Method _setPointerPosition is deprecated. Use "stage.setPointersPositions(event)" instead.');
      this.setPointersPositions(evt);
    }
    _getContentPosition() {
      if (!this.content || !this.content.getBoundingClientRect) {
        return {
          top: 0,
          left: 0,
          scaleX: 1,
          scaleY: 1
        };
      }
      const rect = this.content.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        scaleX: rect.width / this.content.clientWidth || 1,
        scaleY: rect.height / this.content.clientHeight || 1
      };
    }
    _buildDOM() {
      this.bufferCanvas = new SceneCanvas({
        width: 0,
        height: 0
      });
      this.bufferHitCanvas = new HitCanvas({
        pixelRatio: 1,
        width: 0,
        height: 0
      });
      if (!Konva.isBrowser) {
        return;
      }
      const container = this.container();
      if (!container) {
        throw "Stage has no container. A container is required.";
      }
      container.innerHTML = "";
      this.content = container.ownerDocument.createElement("div");
      this.content.style.position = "relative";
      this.content.style.userSelect = "none";
      this.content.className = "konvajs-content";
      this.content.setAttribute("role", "presentation");
      container.appendChild(this.content);
      listenToWindow(this._getOwnerWindow());
      this._resizeDOM();
    }
    cache() {
      Util.warn("Cache function is not allowed for stage. You may use cache only for layers, groups and shapes.");
      return this;
    }
    clearCache() {
      return this;
    }
    batchDraw() {
      this.getChildren().forEach(function(layer) {
        layer.batchDraw();
      });
      return this;
    }
  };
  Stage.prototype.nodeType = STAGE2;
  _registerNode(Stage);
  Factory.addGetterSetter(Stage, "container");

  // node_modules/konva/lib/Shape.js
  var HAS_SHADOW = "hasShadow";
  var SHADOW_RGBA = "shadowRGBA";
  var patternImage = "patternImage";
  var linearGradient = "linearGradient";
  var radialGradient = "radialGradient";
  var dummyContext;
  function getDummyContext() {
    if (dummyContext) {
      return dummyContext;
    }
    dummyContext = Util.createCanvasElement().getContext("2d");
    return dummyContext;
  }
  var shapes = {};
  function _fillFunc(context) {
    const fillRule = this.attrs.fillRule;
    if (fillRule) {
      context.fill(fillRule);
    } else {
      context.fill();
    }
  }
  function _strokeFunc(context) {
    context.stroke();
  }
  function _fillFuncHit(context) {
    const fillRule = this.attrs.fillRule;
    if (fillRule) {
      context.fill(fillRule);
    } else {
      context.fill();
    }
  }
  function _strokeFuncHit(context) {
    context.stroke();
  }
  function _clearHasShadowCache() {
    this._clearCache(HAS_SHADOW);
  }
  function _clearGetShadowRGBACache() {
    this._clearCache(SHADOW_RGBA);
  }
  function _clearFillPatternCache() {
    this._clearCache(patternImage);
  }
  function _clearLinearGradientCache() {
    this._clearCache(linearGradient);
  }
  function _clearRadialGradientCache() {
    this._clearCache(radialGradient);
  }
  var Shape = class extends Node {
    constructor(config) {
      super(config);
      let key;
      let attempts = 0;
      while (true) {
        key = Util.getHitColor();
        if (key && !(key in shapes)) {
          break;
        }
        attempts++;
        if (attempts >= 1e4) {
          Util.warn("Failed to find a unique color key for a shape. Konva may work incorrectly. Most likely your browser is using canvas farbling. Consider disabling it.");
          key = Util.getRandomColor();
          break;
        }
      }
      this.colorKey = key;
      shapes[key] = this;
    }
    getContext() {
      Util.warn("shape.getContext() method is deprecated. Please do not use it.");
      return this.getLayer().getContext();
    }
    getCanvas() {
      Util.warn("shape.getCanvas() method is deprecated. Please do not use it.");
      return this.getLayer().getCanvas();
    }
    getSceneFunc() {
      return this.attrs.sceneFunc || this["_sceneFunc"];
    }
    getHitFunc() {
      return this.attrs.hitFunc || this["_hitFunc"];
    }
    hasShadow() {
      return this._getCache(HAS_SHADOW, this._hasShadow);
    }
    _hasShadow() {
      return this.shadowEnabled() && this.shadowOpacity() !== 0 && !!(this.shadowColor() || this.shadowBlur() || this.shadowOffsetX() || this.shadowOffsetY());
    }
    _getFillPattern() {
      return this._getCache(patternImage, this.__getFillPattern);
    }
    __getFillPattern() {
      if (this.fillPatternImage()) {
        const ctx = getDummyContext();
        const pattern = ctx.createPattern(this.fillPatternImage(), this.fillPatternRepeat() || "repeat");
        if (pattern && pattern.setTransform) {
          const tr = new Transform();
          tr.translate(this.fillPatternX(), this.fillPatternY());
          tr.rotate(Konva.getAngle(this.fillPatternRotation()));
          tr.scale(this.fillPatternScaleX(), this.fillPatternScaleY());
          tr.translate(-1 * this.fillPatternOffsetX(), -1 * this.fillPatternOffsetY());
          const m3 = tr.getMatrix();
          const matrix = typeof DOMMatrix === "undefined" ? {
            a: m3[0],
            b: m3[1],
            c: m3[2],
            d: m3[3],
            e: m3[4],
            f: m3[5]
          } : new DOMMatrix(m3);
          pattern.setTransform(matrix);
        }
        return pattern;
      }
    }
    _getLinearGradient() {
      return this._getCache(linearGradient, this.__getLinearGradient);
    }
    __getLinearGradient() {
      const colorStops = this.fillLinearGradientColorStops();
      if (colorStops) {
        const ctx = getDummyContext();
        const start = this.fillLinearGradientStartPoint();
        const end = this.fillLinearGradientEndPoint();
        const grd = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        for (let n5 = 0; n5 < colorStops.length; n5 += 2) {
          grd.addColorStop(colorStops[n5], colorStops[n5 + 1]);
        }
        return grd;
      }
    }
    _getRadialGradient() {
      return this._getCache(radialGradient, this.__getRadialGradient);
    }
    __getRadialGradient() {
      const colorStops = this.fillRadialGradientColorStops();
      if (colorStops) {
        const ctx = getDummyContext();
        const start = this.fillRadialGradientStartPoint();
        const end = this.fillRadialGradientEndPoint();
        const grd = ctx.createRadialGradient(start.x, start.y, this.fillRadialGradientStartRadius(), end.x, end.y, this.fillRadialGradientEndRadius());
        for (let n5 = 0; n5 < colorStops.length; n5 += 2) {
          grd.addColorStop(colorStops[n5], colorStops[n5 + 1]);
        }
        return grd;
      }
    }
    getShadowRGBA() {
      return this._getCache(SHADOW_RGBA, this._getShadowRGBA);
    }
    _getShadowRGBA() {
      if (!this.hasShadow()) {
        return;
      }
      const rgba = Util.colorToRGBA(this.shadowColor());
      if (rgba) {
        return "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a * (this.shadowOpacity() || 1) + ")";
      }
    }
    hasFill() {
      return this._calculate("hasFill", [
        "fillEnabled",
        "fill",
        "fillPatternImage",
        "fillLinearGradientColorStops",
        "fillRadialGradientColorStops"
      ], () => {
        return this.fillEnabled() && !!(this.fill() || this.fillPatternImage() || this.fillLinearGradientColorStops() || this.fillRadialGradientColorStops());
      });
    }
    hasStroke() {
      return this._calculate("hasStroke", [
        "strokeEnabled",
        "strokeWidth",
        "stroke",
        "strokeLinearGradientColorStops"
      ], () => {
        return this.strokeEnabled() && this.strokeWidth() && !!(this.stroke() || this.strokeLinearGradientColorStops());
      });
    }
    hasHitStroke() {
      const width = this.hitStrokeWidth();
      if (width === "auto") {
        return this.hasStroke();
      }
      return this.strokeEnabled() && !!width;
    }
    intersects(point) {
      const stage = this.getStage();
      if (!stage) {
        return false;
      }
      const bufferHitCanvas = stage._syncBufferSize(stage.bufferHitCanvas);
      bufferHitCanvas.getContext().clear();
      this.drawHit(bufferHitCanvas, void 0, true);
      const p3 = bufferHitCanvas.context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
      return p3[3] > 0;
    }
    destroy() {
      Node.prototype.destroy.call(this);
      delete shapes[this.colorKey];
      delete this.colorKey;
      return this;
    }
    _useBufferCanvas(forceFill) {
      var _a;
      const perfectDrawEnabled = (_a = this.attrs.perfectDrawEnabled) !== null && _a !== void 0 ? _a : true;
      if (!perfectDrawEnabled) {
        return false;
      }
      const hasFill = forceFill || this.hasFill();
      const hasStroke = this.hasStroke();
      const isTransparent = this.getAbsoluteOpacity() !== 1;
      if (hasFill && hasStroke && isTransparent) {
        return true;
      }
      const hasShadow = this.hasShadow();
      const strokeForShadow = this.shadowForStrokeEnabled();
      if (hasFill && hasStroke && hasShadow && strokeForShadow) {
        return true;
      }
      return false;
    }
    setStrokeHitEnabled(val) {
      Util.warn("strokeHitEnabled property is deprecated. Please use hitStrokeWidth instead.");
      if (val) {
        this.hitStrokeWidth("auto");
      } else {
        this.hitStrokeWidth(0);
      }
    }
    getStrokeHitEnabled() {
      if (this.hitStrokeWidth() === 0) {
        return false;
      } else {
        return true;
      }
    }
    getSelfRect() {
      const size = this.size();
      return {
        x: this._centroid ? -size.width / 2 : 0,
        y: this._centroid ? -size.height / 2 : 0,
        width: size.width,
        height: size.height
      };
    }
    getClientRect(config = {}) {
      let hasCachedParent = false;
      let parent = this.getParent();
      while (parent) {
        if (parent.isCached()) {
          hasCachedParent = true;
          break;
        }
        parent = parent.getParent();
      }
      const skipTransform = config.skipTransform;
      const relativeTo = config.relativeTo || hasCachedParent && this.getStage() || void 0;
      const fillRect = this.getSelfRect();
      const applyStroke = !config.skipStroke && this.hasStroke();
      const strokeWidth = applyStroke && this.strokeWidth() || 0;
      const fillAndStrokeWidth = fillRect.width + strokeWidth;
      const fillAndStrokeHeight = fillRect.height + strokeWidth;
      const applyShadow = !config.skipShadow && this.hasShadow();
      const shadowOffsetX = applyShadow ? this.shadowOffsetX() : 0;
      const shadowOffsetY = applyShadow ? this.shadowOffsetY() : 0;
      const preWidth = fillAndStrokeWidth + Math.abs(shadowOffsetX);
      const preHeight = fillAndStrokeHeight + Math.abs(shadowOffsetY);
      const blurRadius = applyShadow && this.shadowBlur() || 0;
      const width = preWidth + blurRadius * 2;
      const height = preHeight + blurRadius * 2;
      const rect = {
        width,
        height,
        x: -(strokeWidth / 2 + blurRadius) + Math.min(shadowOffsetX, 0) + fillRect.x,
        y: -(strokeWidth / 2 + blurRadius) + Math.min(shadowOffsetY, 0) + fillRect.y
      };
      if (!skipTransform) {
        return this._transformedRect(rect, relativeTo);
      }
      return rect;
    }
    drawScene(can, top, bufferCanvas) {
      const layer = this.getLayer();
      const canvas = can || layer.getCanvas(), context = canvas.getContext(), cachedCanvas = this._getCanvasCache(), drawFunc = this.getSceneFunc(), hasShadow = this.hasShadow();
      let stage;
      const skipBuffer = false;
      const cachingSelf = top === this;
      if (!this.isVisible() && !cachingSelf) {
        return this;
      }
      if (cachedCanvas) {
        context.save();
        const m3 = this.getAbsoluteTransform(top).getMatrix();
        context.transform(m3[0], m3[1], m3[2], m3[3], m3[4], m3[5]);
        this._drawCachedSceneCanvas(context);
        context.restore();
        return this;
      }
      if (!drawFunc) {
        return this;
      }
      context.save();
      if (this._useBufferCanvas() && !skipBuffer) {
        stage = this.getStage();
        const bc = bufferCanvas || stage._syncBufferSize(stage.bufferCanvas);
        const bufferContext = bc.getContext();
        if (bufferCanvas) {
          bufferContext.save();
          bufferContext.setTransform(1, 0, 0, 1, 0, 0);
          bufferContext.clearRect(0, 0, bc.width, bc.height);
          bufferContext.restore();
        } else {
          bufferContext.clear();
        }
        bufferContext.save();
        bufferContext.imageSmoothingEnabled = context.imageSmoothingEnabled;
        bufferContext._applyLineJoin(this);
        bufferContext._applyMiterLimit(this);
        const o3 = this.getAbsoluteTransform(top).getMatrix();
        bufferContext.transform(o3[0], o3[1], o3[2], o3[3], o3[4], o3[5]);
        drawFunc.call(this, bufferContext, this);
        bufferContext.restore();
        const ratio = bc.pixelRatio;
        if (hasShadow) {
          context._applyShadow(this);
        }
        if (!cachingSelf) {
          context._applyOpacity(this);
          context._applyGlobalCompositeOperation(this);
        }
        context.drawImage(bc._canvas, bc.x || 0, bc.y || 0, bc.width / ratio, bc.height / ratio);
      } else {
        context._applyLineJoin(this);
        context._applyMiterLimit(this);
        if (!cachingSelf) {
          const o3 = this.getAbsoluteTransform(top).getMatrix();
          context.transform(o3[0], o3[1], o3[2], o3[3], o3[4], o3[5]);
          context._applyOpacity(this);
          context._applyGlobalCompositeOperation(this);
        }
        if (hasShadow) {
          context._applyShadow(this);
        }
        drawFunc.call(this, context, this);
      }
      context.restore();
      return this;
    }
    drawHit(can, top, skipDragCheck = false) {
      if (!this.shouldDrawHit(top, skipDragCheck)) {
        return this;
      }
      const layer = this.getLayer(), canvas = can || layer.hitCanvas, context = canvas && canvas.getContext(), drawFunc = this.hitFunc() || this.sceneFunc(), cachedHitCanvas = this._getCachedHitCanvas(top);
      if (!this.colorKey) {
        Util.warn("Looks like your canvas has a destroyed shape in it. Do not reuse shape after you destroyed it. If you want to reuse shape you should call remove() instead of destroy()");
      }
      if (cachedHitCanvas) {
        context.save();
        const m3 = this.getAbsoluteTransform(top).getMatrix();
        context.transform(m3[0], m3[1], m3[2], m3[3], m3[4], m3[5]);
        this._drawCachedHitCanvas(context, cachedHitCanvas);
        context.restore();
        return this;
      }
      if (!drawFunc) {
        return this;
      }
      context.save();
      context._applyLineJoin(this);
      context._applyMiterLimit(this);
      const selfCache = this === top;
      if (!selfCache) {
        const o3 = this.getAbsoluteTransform(top).getMatrix();
        context.transform(o3[0], o3[1], o3[2], o3[3], o3[4], o3[5]);
      }
      drawFunc.call(this, context, this);
      context.restore();
      return this;
    }
    drawHitFromCache(alphaThreshold = 0) {
      const sceneCanvas = this._getCachedSceneCanvas(), hitCanvas = this._getCachedHitCanvas(), hitContext = hitCanvas.getContext(), hitWidth = hitCanvas.getWidth(), hitHeight = hitCanvas.getHeight();
      hitContext.clear();
      hitContext.drawImage(sceneCanvas._canvas, 0, 0, hitWidth, hitHeight);
      try {
        const hitImageData = hitContext.getImageData(0, 0, hitWidth, hitHeight);
        const hitData = hitImageData.data;
        const len = hitData.length;
        const rgbColorKey = Util._hexToRgb(this.colorKey);
        for (let i3 = 0; i3 < len; i3 += 4) {
          const alpha = hitData[i3 + 3];
          if (alpha > alphaThreshold) {
            hitData[i3] = rgbColorKey.r;
            hitData[i3 + 1] = rgbColorKey.g;
            hitData[i3 + 2] = rgbColorKey.b;
            hitData[i3 + 3] = 255;
          } else {
            hitData[i3 + 3] = 0;
          }
        }
        hitContext.putImageData(hitImageData, 0, 0);
      } catch (e3) {
        Util.error("Unable to draw hit graph from cached scene canvas. " + e3.message);
      }
      return this;
    }
    hasPointerCapture(pointerId) {
      return hasPointerCapture(pointerId, this);
    }
    setPointerCapture(pointerId) {
      setPointerCapture(pointerId, this);
    }
    releaseCapture(pointerId) {
      releaseCapture(pointerId, this);
    }
  };
  Shape.prototype._fillFunc = _fillFunc;
  Shape.prototype._strokeFunc = _strokeFunc;
  Shape.prototype._fillFuncHit = _fillFuncHit;
  Shape.prototype._strokeFuncHit = _strokeFuncHit;
  Shape.prototype._centroid = false;
  Shape.prototype.nodeType = "Shape";
  _registerNode(Shape);
  Shape.prototype.eventListeners = {};
  Shape.prototype.on("shadowColorChange.konva shadowBlurChange.konva shadowOffsetChange.konva shadowOpacityChange.konva shadowEnabledChange.konva", _clearHasShadowCache);
  Shape.prototype.on("shadowColorChange.konva shadowOpacityChange.konva shadowEnabledChange.konva", _clearGetShadowRGBACache);
  Shape.prototype.on("fillPriorityChange.konva fillPatternImageChange.konva fillPatternRepeatChange.konva fillPatternScaleXChange.konva fillPatternScaleYChange.konva fillPatternOffsetXChange.konva fillPatternOffsetYChange.konva fillPatternXChange.konva fillPatternYChange.konva fillPatternRotationChange.konva", _clearFillPatternCache);
  Shape.prototype.on("fillPriorityChange.konva fillLinearGradientColorStopsChange.konva fillLinearGradientStartPointXChange.konva fillLinearGradientStartPointYChange.konva fillLinearGradientEndPointXChange.konva fillLinearGradientEndPointYChange.konva", _clearLinearGradientCache);
  Shape.prototype.on("fillPriorityChange.konva fillRadialGradientColorStopsChange.konva fillRadialGradientStartPointXChange.konva fillRadialGradientStartPointYChange.konva fillRadialGradientEndPointXChange.konva fillRadialGradientEndPointYChange.konva fillRadialGradientStartRadiusChange.konva fillRadialGradientEndRadiusChange.konva", _clearRadialGradientCache);
  Factory.addGetterSetter(Shape, "stroke", void 0, getStringOrGradientValidator());
  Factory.addGetterSetter(Shape, "strokeWidth", 2, getNumberValidator());
  Factory.addGetterSetter(Shape, "fillAfterStrokeEnabled", false);
  Factory.addGetterSetter(Shape, "hitStrokeWidth", "auto", getNumberOrAutoValidator());
  Factory.addGetterSetter(Shape, "strokeHitEnabled", true, getBooleanValidator());
  Factory.addGetterSetter(Shape, "perfectDrawEnabled", true, getBooleanValidator());
  Factory.addGetterSetter(Shape, "shadowForStrokeEnabled", true, getBooleanValidator());
  Factory.addGetterSetter(Shape, "lineJoin");
  Factory.addGetterSetter(Shape, "lineCap");
  Factory.addGetterSetter(Shape, "miterLimit");
  Factory.addGetterSetter(Shape, "sceneFunc");
  Factory.addGetterSetter(Shape, "hitFunc");
  Factory.addGetterSetter(Shape, "dash");
  Factory.addGetterSetter(Shape, "dashOffset", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "shadowColor", void 0, getStringValidator());
  Factory.addGetterSetter(Shape, "shadowBlur", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "shadowOpacity", 1, getNumberValidator());
  Factory.addComponentsGetterSetter(Shape, "shadowOffset", ["x", "y"]);
  Factory.addGetterSetter(Shape, "shadowOffsetX", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "shadowOffsetY", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "fillPatternImage");
  Factory.addGetterSetter(Shape, "fill", void 0, getStringOrGradientValidator());
  Factory.addGetterSetter(Shape, "fillPatternX", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "fillPatternY", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "fillLinearGradientColorStops");
  Factory.addGetterSetter(Shape, "strokeLinearGradientColorStops");
  Factory.addGetterSetter(Shape, "fillRadialGradientStartRadius", 0);
  Factory.addGetterSetter(Shape, "fillRadialGradientEndRadius", 0);
  Factory.addGetterSetter(Shape, "fillRadialGradientColorStops");
  Factory.addGetterSetter(Shape, "fillPatternRepeat", "repeat");
  Factory.addGetterSetter(Shape, "fillEnabled", true);
  Factory.addGetterSetter(Shape, "strokeEnabled", true);
  Factory.addGetterSetter(Shape, "shadowEnabled", true);
  Factory.addGetterSetter(Shape, "dashEnabled", true);
  Factory.addGetterSetter(Shape, "strokeScaleEnabled", true);
  Factory.addGetterSetter(Shape, "fillPriority", "color");
  Factory.addComponentsGetterSetter(Shape, "fillPatternOffset", ["x", "y"]);
  Factory.addGetterSetter(Shape, "fillPatternOffsetX", 0, getNumberValidator());
  Factory.addGetterSetter(Shape, "fillPatternOffsetY", 0, getNumberValidator());
  Factory.addComponentsGetterSetter(Shape, "fillPatternScale", ["x", "y"]);
  Factory.addGetterSetter(Shape, "fillPatternScaleX", 1, getNumberValidator());
  Factory.addGetterSetter(Shape, "fillPatternScaleY", 1, getNumberValidator());
  Factory.addComponentsGetterSetter(Shape, "fillLinearGradientStartPoint", [
    "x",
    "y"
  ]);
  Factory.addComponentsGetterSetter(Shape, "strokeLinearGradientStartPoint", [
    "x",
    "y"
  ]);
  Factory.addGetterSetter(Shape, "fillLinearGradientStartPointX", 0);
  Factory.addGetterSetter(Shape, "strokeLinearGradientStartPointX", 0);
  Factory.addGetterSetter(Shape, "fillLinearGradientStartPointY", 0);
  Factory.addGetterSetter(Shape, "strokeLinearGradientStartPointY", 0);
  Factory.addComponentsGetterSetter(Shape, "fillLinearGradientEndPoint", [
    "x",
    "y"
  ]);
  Factory.addComponentsGetterSetter(Shape, "strokeLinearGradientEndPoint", [
    "x",
    "y"
  ]);
  Factory.addGetterSetter(Shape, "fillLinearGradientEndPointX", 0);
  Factory.addGetterSetter(Shape, "strokeLinearGradientEndPointX", 0);
  Factory.addGetterSetter(Shape, "fillLinearGradientEndPointY", 0);
  Factory.addGetterSetter(Shape, "strokeLinearGradientEndPointY", 0);
  Factory.addComponentsGetterSetter(Shape, "fillRadialGradientStartPoint", [
    "x",
    "y"
  ]);
  Factory.addGetterSetter(Shape, "fillRadialGradientStartPointX", 0);
  Factory.addGetterSetter(Shape, "fillRadialGradientStartPointY", 0);
  Factory.addComponentsGetterSetter(Shape, "fillRadialGradientEndPoint", [
    "x",
    "y"
  ]);
  Factory.addGetterSetter(Shape, "fillRadialGradientEndPointX", 0);
  Factory.addGetterSetter(Shape, "fillRadialGradientEndPointY", 0);
  Factory.addGetterSetter(Shape, "fillPatternRotation", 0);
  Factory.addGetterSetter(Shape, "fillRule", void 0, getStringValidator());
  Factory.backCompat(Shape, {
    dashArray: "dash",
    getDashArray: "getDash",
    setDashArray: "getDash",
    drawFunc: "sceneFunc",
    getDrawFunc: "getSceneFunc",
    setDrawFunc: "setSceneFunc",
    drawHitFunc: "hitFunc",
    getDrawHitFunc: "getHitFunc",
    setDrawHitFunc: "setHitFunc"
  });

  // node_modules/konva/lib/Layer.js
  var BEFORE_DRAW = "beforeDraw";
  var DRAW = "draw";
  var INTERSECTION_OFFSETS = [
    { x: 0, y: 0 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 }
  ];
  var INTERSECTION_OFFSETS_LEN = INTERSECTION_OFFSETS.length;
  var Layer = class extends Container {
    constructor(config) {
      super(config);
      this.canvas = new SceneCanvas();
      this.hitCanvas = new HitCanvas({
        pixelRatio: 1
      });
      this._waitingForDraw = false;
      this.on("visibleChange.konva", this._checkVisibility);
      this._checkVisibility();
      this.on("imageSmoothingEnabledChange.konva", this._setSmoothEnabled);
      this._setSmoothEnabled();
    }
    createPNGStream() {
      const c4 = this.canvas._canvas;
      return c4.createPNGStream();
    }
    getCanvas() {
      return this.canvas;
    }
    getNativeCanvasElement() {
      return this.canvas._canvas;
    }
    getHitCanvas() {
      return this.hitCanvas;
    }
    getContext() {
      return this.getCanvas().getContext();
    }
    clear(bounds) {
      this.getContext().clear(bounds);
      this.getHitCanvas().getContext().clear(bounds);
      return this;
    }
    setZIndex(index) {
      super.setZIndex(index);
      const stage = this.getStage();
      if (stage && stage.content) {
        stage.content.removeChild(this.getNativeCanvasElement());
        if (index < stage.children.length - 1) {
          stage.content.insertBefore(this.getNativeCanvasElement(), stage.children[index + 1].getCanvas()._canvas);
        } else {
          stage.content.appendChild(this.getNativeCanvasElement());
        }
      }
      return this;
    }
    moveToTop() {
      Node.prototype.moveToTop.call(this);
      const stage = this.getStage();
      if (stage && stage.content) {
        stage.content.removeChild(this.getNativeCanvasElement());
        stage.content.appendChild(this.getNativeCanvasElement());
      }
      return true;
    }
    moveUp() {
      const moved = Node.prototype.moveUp.call(this);
      if (!moved) {
        return false;
      }
      const stage = this.getStage();
      if (!stage || !stage.content) {
        return false;
      }
      stage.content.removeChild(this.getNativeCanvasElement());
      if (this.index < stage.children.length - 1) {
        stage.content.insertBefore(this.getNativeCanvasElement(), stage.children[this.index + 1].getCanvas()._canvas);
      } else {
        stage.content.appendChild(this.getNativeCanvasElement());
      }
      return true;
    }
    moveDown() {
      if (Node.prototype.moveDown.call(this)) {
        const stage = this.getStage();
        if (stage) {
          const children = stage.children;
          if (stage.content) {
            stage.content.removeChild(this.getNativeCanvasElement());
            stage.content.insertBefore(this.getNativeCanvasElement(), children[this.index + 1].getCanvas()._canvas);
          }
        }
        return true;
      }
      return false;
    }
    moveToBottom() {
      if (Node.prototype.moveToBottom.call(this)) {
        const stage = this.getStage();
        if (stage) {
          const children = stage.children;
          if (stage.content) {
            stage.content.removeChild(this.getNativeCanvasElement());
            stage.content.insertBefore(this.getNativeCanvasElement(), children[1].getCanvas()._canvas);
          }
        }
        return true;
      }
      return false;
    }
    getLayer() {
      return this;
    }
    remove() {
      const _canvas = this.getNativeCanvasElement();
      Node.prototype.remove.call(this);
      if (_canvas && _canvas.parentNode && Util._isInDocument(_canvas)) {
        _canvas.parentNode.removeChild(_canvas);
      }
      return this;
    }
    getStage() {
      return this.parent;
    }
    setSize({ width, height }) {
      this.canvas.setSize(width, height);
      this._syncHitCanvasSize();
      this._setSmoothEnabled();
      return this;
    }
    _syncHitCanvasSize() {
      const listening = this.isListening();
      this.hitCanvas.setSizeIfChanged((listening ? this.getWidth() : 0) || 0, (listening ? this.getHeight() : 0) || 0);
    }
    _validateAdd(child) {
      const type = child.getType();
      if (type !== "Group" && type !== "Shape") {
        Util.throw("You may only add groups and shapes to a layer.");
      }
    }
    _toKonvaCanvas(config) {
      config = { ...config };
      config.width = config.width || this.getWidth();
      config.height = config.height || this.getHeight();
      config.x = config.x !== void 0 ? config.x : this.x();
      config.y = config.y !== void 0 ? config.y : this.y();
      return Node.prototype._toKonvaCanvas.call(this, config);
    }
    _checkVisibility() {
      const visible = this.visible();
      if (visible) {
        this.canvas._canvas.style.display = "block";
      } else {
        this.canvas._canvas.style.display = "none";
      }
    }
    _setSmoothEnabled() {
      this.getContext()._context.imageSmoothingEnabled = this.imageSmoothingEnabled();
    }
    getWidth() {
      if (this.parent) {
        return this.parent.width();
      }
    }
    setWidth() {
      Util.warn('Can not change width of layer. Use "stage.width(value)" function instead.');
    }
    getHeight() {
      if (this.parent) {
        return this.parent.height();
      }
    }
    setHeight() {
      Util.warn('Can not change height of layer. Use "stage.height(value)" function instead.');
    }
    batchDraw() {
      var _a;
      if (!this._waitingForDraw) {
        this._waitingForDraw = true;
        Util.requestAnimFrame(() => {
          this.draw();
          this._waitingForDraw = false;
        }, (_a = this.getStage()) === null || _a === void 0 ? void 0 : _a._getOwnerWindow());
      }
      return this;
    }
    getIntersection(pos) {
      if (!this.isListening() || !this.isVisible()) {
        return null;
      }
      let spiralSearchDistance = 1;
      let continueSearch = false;
      while (true) {
        for (let i3 = 0; i3 < INTERSECTION_OFFSETS_LEN; i3++) {
          const intersectionOffset = INTERSECTION_OFFSETS[i3];
          const obj = this._getIntersection({
            x: pos.x + intersectionOffset.x * spiralSearchDistance,
            y: pos.y + intersectionOffset.y * spiralSearchDistance
          });
          const shape = obj.shape;
          if (shape) {
            return shape;
          }
          continueSearch = !!obj.antialiased;
          if (!obj.antialiased) {
            break;
          }
        }
        if (continueSearch) {
          spiralSearchDistance += 1;
        } else {
          return null;
        }
      }
    }
    _getIntersection(pos) {
      if (!this.hitCanvas.width || !this.hitCanvas.height) {
        return {};
      }
      const ratio = this.hitCanvas.pixelRatio;
      const p3 = this.hitCanvas.context.getImageData(Math.round(pos.x * ratio), Math.round(pos.y * ratio), 1, 1).data;
      const p32 = p3[3];
      if (p32 === 255) {
        const colorKey = Util.getHitColorKey(p3[0], p3[1], p3[2]);
        const shape = shapes[colorKey];
        if (shape) {
          return {
            shape
          };
        }
        return {
          antialiased: true
        };
      } else if (p32 > 0) {
        return {
          antialiased: true
        };
      }
      return {};
    }
    drawScene(can, top, bufferCanvas) {
      const layer = this.getLayer(), canvas = can || layer && layer.getCanvas();
      this._fire(BEFORE_DRAW, {
        node: this
      });
      if (this.clearBeforeDraw()) {
        canvas.getContext().clear();
      }
      Container.prototype.drawScene.call(this, canvas, top, bufferCanvas);
      this._fire(DRAW, {
        node: this
      });
      return this;
    }
    drawHit(can, top) {
      const layer = this.getLayer(), canvas = can || layer && layer.hitCanvas;
      if (!can && layer) {
        layer._syncHitCanvasSize();
        if (layer.clearBeforeDraw()) {
          layer.getHitCanvas().getContext().clear();
        }
      }
      Container.prototype.drawHit.call(this, canvas, top);
      return this;
    }
    enableHitGraph() {
      this.hitGraphEnabled(true);
      return this;
    }
    disableHitGraph() {
      this.hitGraphEnabled(false);
      return this;
    }
    setHitGraphEnabled(val) {
      Util.warn("hitGraphEnabled method is deprecated. Please use layer.listening() instead.");
      this.listening(val);
    }
    getHitGraphEnabled(val) {
      Util.warn("hitGraphEnabled method is deprecated. Please use layer.listening() instead.");
      return this.listening();
    }
    toggleHitCanvas() {
      if (!this.parent || !this.parent["content"]) {
        return;
      }
      const parent = this.parent;
      const added = !!this.hitCanvas._canvas.parentNode;
      if (added) {
        parent.content.removeChild(this.hitCanvas._canvas);
      } else {
        parent.content.appendChild(this.hitCanvas._canvas);
      }
    }
    destroy() {
      Util.releaseCanvas(this.getNativeCanvasElement(), this.getHitCanvas()._canvas);
      return super.destroy();
    }
  };
  Layer.prototype.nodeType = "Layer";
  _registerNode(Layer);
  Factory.addGetterSetter(Layer, "imageSmoothingEnabled", true);
  Factory.addGetterSetter(Layer, "clearBeforeDraw", true);
  Factory.addGetterSetter(Layer, "hitGraphEnabled", true, getBooleanValidator());

  // node_modules/konva/lib/FastLayer.js
  var FastLayer = class extends Layer {
    constructor(attrs) {
      super(attrs);
      this.listening(false);
      Util.warn('Konva.Fast layer is deprecated. Please use "new Konva.Layer({ listening: false })" instead.');
    }
  };
  FastLayer.prototype.nodeType = "FastLayer";
  _registerNode(FastLayer);

  // node_modules/konva/lib/Group.js
  var Group = class extends Container {
    _validateAdd(child) {
      const type = child.getType();
      if (type !== "Group" && type !== "Shape") {
        Util.throw("You may only add groups and shapes to groups.");
      }
    }
  };
  Group.prototype.nodeType = "Group";
  _registerNode(Group);

  // node_modules/konva/lib/Animation.js
  var now = (function() {
    if (glob.performance && glob.performance.now) {
      return function() {
        return glob.performance.now();
      };
    }
    return function() {
      return (/* @__PURE__ */ new Date()).getTime();
    };
  })();
  var Animation = class _Animation {
    constructor(func, layers) {
      this.id = _Animation.animIdCounter++;
      this.frame = {
        time: 0,
        timeDiff: 0,
        lastTime: now(),
        frameRate: 0
      };
      this.func = func;
      this.setLayers(layers);
    }
    setLayers(layers) {
      let lays = [];
      if (layers) {
        lays = Array.isArray(layers) ? layers : [layers];
      }
      this.layers = lays;
      return this;
    }
    getLayers() {
      return this.layers;
    }
    addLayer(layer) {
      const layers = this.layers;
      const len = layers.length;
      for (let n5 = 0; n5 < len; n5++) {
        if (layers[n5]._id === layer._id) {
          return false;
        }
      }
      this.layers.push(layer);
      return true;
    }
    isRunning() {
      const a3 = _Animation;
      const animations = a3.animations;
      const len = animations.length;
      for (let n5 = 0; n5 < len; n5++) {
        if (animations[n5].id === this.id) {
          return true;
        }
      }
      return false;
    }
    start() {
      this.stop();
      this.frame.timeDiff = 0;
      this.frame.lastTime = now();
      _Animation._addAnimation(this);
      return this;
    }
    stop() {
      _Animation._removeAnimation(this);
      return this;
    }
    _updateFrameObject(time) {
      this.frame.timeDiff = time - this.frame.lastTime;
      this.frame.lastTime = time;
      this.frame.time += this.frame.timeDiff;
      this.frame.frameRate = 1e3 / this.frame.timeDiff;
    }
    static _addAnimation(anim) {
      this.animations.push(anim);
      this._handleAnimation();
    }
    static _removeAnimation(anim) {
      const id = anim.id;
      const animations = this.animations;
      const len = animations.length;
      for (let n5 = 0; n5 < len; n5++) {
        if (animations[n5].id === id) {
          this.animations.splice(n5, 1);
          break;
        }
      }
    }
    static _runFrames() {
      const layerHash = {};
      const animations = this.animations;
      for (let n5 = 0; n5 < animations.length; n5++) {
        const anim = animations[n5];
        const layers = anim.layers;
        const func = anim.func;
        anim._updateFrameObject(now());
        const layersLen = layers.length;
        let needRedraw;
        if (func) {
          needRedraw = func.call(anim, anim.frame) !== false;
        } else {
          needRedraw = true;
        }
        if (!needRedraw) {
          continue;
        }
        for (let i3 = 0; i3 < layersLen; i3++) {
          const layer = layers[i3];
          if (layer._id !== void 0) {
            layerHash[layer._id] = layer;
          }
        }
      }
      for (const key in layerHash) {
        if (!layerHash.hasOwnProperty(key)) {
          continue;
        }
        layerHash[key].batchDraw();
      }
    }
    static _animationLoop() {
      const Anim = _Animation;
      if (Anim.animations.length) {
        Anim._runFrames();
        Util.requestAnimFrame(Anim._animationLoop);
      } else {
        Anim.animRunning = false;
      }
    }
    static _handleAnimation() {
      if (!this.animRunning) {
        this.animRunning = true;
        Util.requestAnimFrame(this._animationLoop);
      }
    }
  };
  Animation.animations = [];
  Animation.animIdCounter = 0;
  Animation.animRunning = false;

  // node_modules/konva/lib/Tween.js
  var blacklist = {
    node: 1,
    duration: 1,
    easing: 1,
    onFinish: 1,
    yoyo: 1
  };
  var PAUSED = 1;
  var PLAYING = 2;
  var REVERSING = 3;
  var colorAttrs = ["fill", "stroke", "shadowColor"];
  var idCounter2 = 0;
  function colorToRGBA(color) {
    return Util.colorToRGBA(color) || Util.throw('can not tween the color "' + color + '", because it is not a valid color.');
  }
  var TweenEngine = class {
    constructor(prop, propFunc, func, begin, finish, duration, yoyo) {
      this.prop = prop;
      this.propFunc = propFunc;
      this.begin = begin;
      this._pos = begin;
      this.duration = duration;
      this._change = 0;
      this.prevPos = 0;
      this.yoyo = yoyo;
      this._time = 0;
      this._position = 0;
      this._startTime = 0;
      this._finish = 0;
      this.func = func;
      this._change = finish - this.begin;
      this.pause();
    }
    fire(str2) {
      const handler = this[str2];
      if (handler) {
        handler();
      }
    }
    setTime(t5) {
      if (t5 > this.duration) {
        if (this.yoyo) {
          this._time = this.duration;
          this.reverse();
        } else {
          this.finish();
        }
      } else if (t5 < 0) {
        if (this.yoyo) {
          this._time = 0;
          this.play();
        } else {
          this.reset();
        }
      } else {
        this._time = t5;
        this.update();
      }
    }
    getTime() {
      return this._time;
    }
    setPosition(p3) {
      this.prevPos = this._pos;
      this.propFunc(p3);
      this._pos = p3;
    }
    getPosition(t5) {
      if (t5 === void 0) {
        t5 = this._time;
      }
      return this.func(t5, this.begin, this._change, this.duration);
    }
    play() {
      this.state = PLAYING;
      this._startTime = this.getTimer() - this._time;
      this.onEnterFrame();
      this.fire("onPlay");
    }
    reverse() {
      this.state = REVERSING;
      this._time = this.duration - this._time;
      this._startTime = this.getTimer() - this._time;
      this.onEnterFrame();
      this.fire("onReverse");
    }
    seek(t5) {
      this.pause();
      this._time = t5;
      this.update();
      this.fire("onSeek");
    }
    reset() {
      this.pause();
      this._time = 0;
      this.update();
      this.fire("onReset");
    }
    finish() {
      this.pause();
      this._time = this.duration;
      this.update();
      this.fire("onFinish");
    }
    update() {
      this.setPosition(this.getPosition(this._time));
      this.fire("onUpdate");
    }
    onEnterFrame() {
      const t5 = this.getTimer() - this._startTime;
      if (this.state === PLAYING) {
        this.setTime(t5);
      } else if (this.state === REVERSING) {
        this.setTime(this.duration - t5);
      }
    }
    pause() {
      this.state = PAUSED;
      this.fire("onPause");
    }
    getTimer() {
      return (/* @__PURE__ */ new Date()).getTime();
    }
  };
  var Tween = class _Tween {
    constructor(config) {
      const that = this, node = config.node, nodeId = node._id, easing = config.easing || Easings.Linear, yoyo = !!config.yoyo;
      let duration, key;
      if (typeof config.duration === "undefined") {
        duration = 0.3;
      } else if (config.duration === 0) {
        duration = 1e-3;
      } else {
        duration = config.duration;
      }
      this.node = node;
      this._id = idCounter2++;
      const layers = node.getLayer() || (node instanceof Konva["Stage"] ? node.getLayers() : null);
      if (!layers) {
        Util.error("Tween constructor have `node` that is not in a layer. Please add node into layer first.");
      }
      this.anim = new Animation(function() {
        that.tween.onEnterFrame();
      }, layers);
      this.tween = new TweenEngine(key, function(i3) {
        that._tweenFunc(i3);
      }, easing, 0, 1, duration * 1e3, yoyo);
      this._addListeners();
      if (!_Tween.attrs[nodeId]) {
        _Tween.attrs[nodeId] = {};
      }
      if (!_Tween.attrs[nodeId][this._id]) {
        _Tween.attrs[nodeId][this._id] = {};
      }
      if (!_Tween.tweens[nodeId]) {
        _Tween.tweens[nodeId] = {};
      }
      for (key in config) {
        if (blacklist[key] === void 0) {
          this._addAttr(key, config[key]);
        }
      }
      this.reset();
      this.onFinish = config.onFinish;
      this.onReset = config.onReset;
      this.onUpdate = config.onUpdate;
    }
    _addAttr(key, end) {
      const node = this.node, nodeId = node._id;
      let diff, len, trueEnd, trueStart, endRGBA;
      const tweenId = _Tween.tweens[nodeId][key];
      if (tweenId) {
        delete _Tween.attrs[nodeId][tweenId][key];
      }
      let start = node.getAttr(key);
      if (Util._isArray(end)) {
        diff = [];
        len = Math.max(end.length, start.length);
        if (key === "points" && end.length !== start.length) {
          if (end.length > start.length) {
            trueStart = start;
            start = Util._prepareArrayForTween(start, end, node.closed());
          } else {
            trueEnd = end;
            end = Util._prepareArrayForTween(end, start, node.closed());
          }
        }
        if (key.indexOf("fill") === 0) {
          for (let n5 = 0; n5 < len; n5++) {
            if (n5 % 2 === 0) {
              diff.push(end[n5] - start[n5]);
            } else {
              const startRGBA = colorToRGBA(start[n5]);
              endRGBA = colorToRGBA(end[n5]);
              start[n5] = startRGBA;
              diff.push({
                r: endRGBA.r - startRGBA.r,
                g: endRGBA.g - startRGBA.g,
                b: endRGBA.b - startRGBA.b,
                a: endRGBA.a - startRGBA.a
              });
            }
          }
        } else {
          for (let n5 = 0; n5 < len; n5++) {
            diff.push(end[n5] - start[n5]);
          }
        }
      } else if (colorAttrs.indexOf(key) !== -1) {
        start = colorToRGBA(start);
        endRGBA = colorToRGBA(end);
        diff = {
          r: endRGBA.r - start.r,
          g: endRGBA.g - start.g,
          b: endRGBA.b - start.b,
          a: endRGBA.a - start.a
        };
      } else {
        diff = end - start;
      }
      _Tween.attrs[nodeId][this._id][key] = {
        start,
        diff,
        end,
        trueEnd,
        trueStart
      };
      _Tween.tweens[nodeId][key] = this._id;
    }
    _tweenFunc(i3) {
      const node = this.node, attrs = _Tween.attrs[node._id][this._id];
      let key, attr, start, diff, newVal, n5, len, end;
      for (key in attrs) {
        attr = attrs[key];
        start = attr.start;
        diff = attr.diff;
        end = attr.end;
        if (Util._isArray(start)) {
          newVal = [];
          len = Math.max(start.length, end.length);
          if (key.indexOf("fill") === 0) {
            for (n5 = 0; n5 < len; n5++) {
              if (n5 % 2 === 0) {
                newVal.push((start[n5] || 0) + diff[n5] * i3);
              } else {
                newVal.push("rgba(" + Math.round(start[n5].r + diff[n5].r * i3) + "," + Math.round(start[n5].g + diff[n5].g * i3) + "," + Math.round(start[n5].b + diff[n5].b * i3) + "," + (start[n5].a + diff[n5].a * i3) + ")");
              }
            }
          } else {
            for (n5 = 0; n5 < len; n5++) {
              newVal.push((start[n5] || 0) + diff[n5] * i3);
            }
          }
        } else if (colorAttrs.indexOf(key) !== -1) {
          newVal = "rgba(" + Math.round(start.r + diff.r * i3) + "," + Math.round(start.g + diff.g * i3) + "," + Math.round(start.b + diff.b * i3) + "," + (start.a + diff.a * i3) + ")";
        } else {
          newVal = start + diff * i3;
        }
        node.setAttr(key, newVal);
      }
    }
    _addListeners() {
      this.tween.onPlay = () => {
        this.anim.start();
      };
      this.tween.onReverse = () => {
        this.anim.start();
      };
      this.tween.onPause = () => {
        this.anim.stop();
      };
      this.tween.onFinish = () => {
        const node = this.node;
        const attrs = _Tween.attrs[node._id][this._id];
        if (attrs.points && attrs.points.trueEnd) {
          node.setAttr("points", attrs.points.trueEnd);
        }
        if (this.onFinish) {
          this.onFinish.call(this);
        }
      };
      this.tween.onReset = () => {
        const node = this.node;
        const attrs = _Tween.attrs[node._id][this._id];
        if (attrs.points && attrs.points.trueStart) {
          node.points(attrs.points.trueStart);
        }
        if (this.onReset) {
          this.onReset();
        }
      };
      this.tween.onUpdate = () => {
        if (this.onUpdate) {
          this.onUpdate.call(this);
        }
      };
    }
    play() {
      this.tween.play();
      return this;
    }
    reverse() {
      this.tween.reverse();
      return this;
    }
    reset() {
      this.tween.reset();
      return this;
    }
    seek(t5) {
      this.tween.seek(t5 * 1e3);
      return this;
    }
    pause() {
      this.tween.pause();
      return this;
    }
    finish() {
      this.tween.finish();
      return this;
    }
    destroy() {
      const nodeId = this.node._id, thisId = this._id, attrs = _Tween.tweens[nodeId];
      this.pause();
      if (this.anim) {
        this.anim.stop();
      }
      for (const key in attrs) {
        delete _Tween.tweens[nodeId][key];
      }
      delete _Tween.attrs[nodeId][thisId];
      if (_Tween.tweens[nodeId]) {
        if (Object.keys(_Tween.tweens[nodeId]).length === 0) {
          delete _Tween.tweens[nodeId];
        }
        if (Object.keys(_Tween.attrs[nodeId]).length === 0) {
          delete _Tween.attrs[nodeId];
        }
      }
    }
  };
  Tween.attrs = {};
  Tween.tweens = {};
  Node.prototype.to = function(params) {
    const onFinish = params.onFinish;
    params.node = this;
    params.onFinish = function() {
      this.destroy();
      if (onFinish) {
        onFinish();
      }
    };
    const tween = new Tween(params);
    tween.play();
  };
  var Easings = {
    BackEaseIn(t5, b3, c4, d2) {
      const s4 = 1.70158;
      return c4 * (t5 /= d2) * t5 * ((s4 + 1) * t5 - s4) + b3;
    },
    BackEaseOut(t5, b3, c4, d2) {
      const s4 = 1.70158;
      return c4 * ((t5 = t5 / d2 - 1) * t5 * ((s4 + 1) * t5 + s4) + 1) + b3;
    },
    BackEaseInOut(t5, b3, c4, d2) {
      let s4 = 1.70158;
      if ((t5 /= d2 / 2) < 1) {
        return c4 / 2 * (t5 * t5 * (((s4 *= 1.525) + 1) * t5 - s4)) + b3;
      }
      return c4 / 2 * ((t5 -= 2) * t5 * (((s4 *= 1.525) + 1) * t5 + s4) + 2) + b3;
    },
    ElasticEaseIn(t5, b3, c4, d2, a3, p3) {
      let s4 = 0;
      if (t5 === 0) {
        return b3;
      }
      if ((t5 /= d2) === 1) {
        return b3 + c4;
      }
      if (!p3) {
        p3 = d2 * 0.3;
      }
      if (!a3 || a3 < Math.abs(c4)) {
        a3 = c4;
        s4 = p3 / 4;
      } else {
        s4 = p3 / (2 * Math.PI) * Math.asin(c4 / a3);
      }
      return -(a3 * Math.pow(2, 10 * (t5 -= 1)) * Math.sin((t5 * d2 - s4) * (2 * Math.PI) / p3)) + b3;
    },
    ElasticEaseOut(t5, b3, c4, d2, a3, p3) {
      let s4 = 0;
      if (t5 === 0) {
        return b3;
      }
      if ((t5 /= d2) === 1) {
        return b3 + c4;
      }
      if (!p3) {
        p3 = d2 * 0.3;
      }
      if (!a3 || a3 < Math.abs(c4)) {
        a3 = c4;
        s4 = p3 / 4;
      } else {
        s4 = p3 / (2 * Math.PI) * Math.asin(c4 / a3);
      }
      return a3 * Math.pow(2, -10 * t5) * Math.sin((t5 * d2 - s4) * (2 * Math.PI) / p3) + c4 + b3;
    },
    ElasticEaseInOut(t5, b3, c4, d2, a3, p3) {
      let s4 = 0;
      if (t5 === 0) {
        return b3;
      }
      if ((t5 /= d2 / 2) === 2) {
        return b3 + c4;
      }
      if (!p3) {
        p3 = d2 * (0.3 * 1.5);
      }
      if (!a3 || a3 < Math.abs(c4)) {
        a3 = c4;
        s4 = p3 / 4;
      } else {
        s4 = p3 / (2 * Math.PI) * Math.asin(c4 / a3);
      }
      if (t5 < 1) {
        return -0.5 * (a3 * Math.pow(2, 10 * (t5 -= 1)) * Math.sin((t5 * d2 - s4) * (2 * Math.PI) / p3)) + b3;
      }
      return a3 * Math.pow(2, -10 * (t5 -= 1)) * Math.sin((t5 * d2 - s4) * (2 * Math.PI) / p3) * 0.5 + c4 + b3;
    },
    BounceEaseOut(t5, b3, c4, d2) {
      if ((t5 /= d2) < 1 / 2.75) {
        return c4 * (7.5625 * t5 * t5) + b3;
      } else if (t5 < 2 / 2.75) {
        return c4 * (7.5625 * (t5 -= 1.5 / 2.75) * t5 + 0.75) + b3;
      } else if (t5 < 2.5 / 2.75) {
        return c4 * (7.5625 * (t5 -= 2.25 / 2.75) * t5 + 0.9375) + b3;
      } else {
        return c4 * (7.5625 * (t5 -= 2.625 / 2.75) * t5 + 0.984375) + b3;
      }
    },
    BounceEaseIn(t5, b3, c4, d2) {
      return c4 - Easings.BounceEaseOut(d2 - t5, 0, c4, d2) + b3;
    },
    BounceEaseInOut(t5, b3, c4, d2) {
      if (t5 < d2 / 2) {
        return Easings.BounceEaseIn(t5 * 2, 0, c4, d2) * 0.5 + b3;
      } else {
        return Easings.BounceEaseOut(t5 * 2 - d2, 0, c4, d2) * 0.5 + c4 * 0.5 + b3;
      }
    },
    EaseIn(t5, b3, c4, d2) {
      return c4 * (t5 /= d2) * t5 + b3;
    },
    EaseOut(t5, b3, c4, d2) {
      return -c4 * (t5 /= d2) * (t5 - 2) + b3;
    },
    EaseInOut(t5, b3, c4, d2) {
      if ((t5 /= d2 / 2) < 1) {
        return c4 / 2 * t5 * t5 + b3;
      }
      return -c4 / 2 * (--t5 * (t5 - 2) - 1) + b3;
    },
    StrongEaseIn(t5, b3, c4, d2) {
      return c4 * (t5 /= d2) * t5 * t5 * t5 * t5 + b3;
    },
    StrongEaseOut(t5, b3, c4, d2) {
      return c4 * ((t5 = t5 / d2 - 1) * t5 * t5 * t5 * t5 + 1) + b3;
    },
    StrongEaseInOut(t5, b3, c4, d2) {
      if ((t5 /= d2 / 2) < 1) {
        return c4 / 2 * t5 * t5 * t5 * t5 * t5 + b3;
      }
      return c4 / 2 * ((t5 -= 2) * t5 * t5 * t5 * t5 + 2) + b3;
    },
    Linear(t5, b3, c4, d2) {
      return c4 * t5 / d2 + b3;
    }
  };

  // node_modules/konva/lib/_CoreInternals.js
  var Konva2 = Util._assign(Konva, {
    Util,
    Transform,
    Node,
    Container,
    Stage,
    stages,
    Layer,
    FastLayer,
    Group,
    DD,
    Shape,
    shapes,
    Animation,
    Tween,
    Easings,
    Context,
    Canvas
  });

  // node_modules/konva/lib/shapes/Arc.js
  var Arc = class extends Shape {
    _sceneFunc(context) {
      const angle = Konva.getAngle(this.angle()), clockwise = this.clockwise();
      context.beginPath();
      context.arc(0, 0, this.outerRadius(), 0, angle, clockwise);
      context.arc(0, 0, this.innerRadius(), angle, 0, !clockwise);
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      return this.outerRadius() * 2;
    }
    getHeight() {
      return this.outerRadius() * 2;
    }
    setWidth(width) {
      this.outerRadius(width / 2);
    }
    setHeight(height) {
      this.outerRadius(height / 2);
    }
    getSelfRect() {
      const innerRadius = this.innerRadius();
      const outerRadius = this.outerRadius();
      const clockwise = this.clockwise();
      const rawAngle = Konva.getAngle(this.angle());
      if (rawAngle % (Math.PI * 2) === 0) {
        return rawAngle !== 0 ? {
          x: -outerRadius,
          y: -outerRadius,
          width: outerRadius * 2,
          height: outerRadius * 2
        } : { x: innerRadius, y: 0, width: outerRadius - innerRadius, height: 0 };
      }
      const angle = Konva.getAngle(clockwise ? 360 - this.angle() : this.angle());
      const boundLeftRatio = Math.cos(Math.min(angle, Math.PI));
      const boundRightRatio = 1;
      const boundTopRatio = Math.sin(Math.min(Math.max(Math.PI, angle), 3 * Math.PI / 2));
      const boundBottomRatio = Math.sin(Math.min(angle, Math.PI / 2));
      const boundLeft = boundLeftRatio * (boundLeftRatio > 0 ? innerRadius : outerRadius);
      const boundRight = boundRightRatio * (boundRightRatio > 0 ? outerRadius : innerRadius);
      const boundTop = boundTopRatio * (boundTopRatio > 0 ? innerRadius : outerRadius);
      const boundBottom = boundBottomRatio * (boundBottomRatio > 0 ? outerRadius : innerRadius);
      return {
        x: boundLeft,
        y: clockwise ? -1 * boundBottom : boundTop,
        width: boundRight - boundLeft,
        height: boundBottom - boundTop
      };
    }
  };
  Arc.prototype._centroid = true;
  Arc.prototype.className = "Arc";
  Arc.prototype._attrsAffectingSize = [
    "innerRadius",
    "outerRadius",
    "angle",
    "clockwise"
  ];
  _registerNode(Arc);
  Factory.addGetterSetter(Arc, "innerRadius", 0, getNumberValidator());
  Factory.addGetterSetter(Arc, "outerRadius", 0, getNumberValidator());
  Factory.addGetterSetter(Arc, "angle", 0, getNumberValidator());
  Factory.addGetterSetter(Arc, "clockwise", false, getBooleanValidator());

  // node_modules/konva/lib/BezierFunctions.js
  var tValues = [
    [],
    [],
    [
      -0.5773502691896257,
      0.5773502691896257
    ],
    [
      0,
      -0.7745966692414834,
      0.7745966692414834
    ],
    [
      -0.33998104358485626,
      0.33998104358485626,
      -0.8611363115940526,
      0.8611363115940526
    ],
    [
      0,
      -0.5384693101056831,
      0.5384693101056831,
      -0.906179845938664,
      0.906179845938664
    ],
    [
      0.6612093864662645,
      -0.6612093864662645,
      -0.2386191860831969,
      0.2386191860831969,
      -0.932469514203152,
      0.932469514203152
    ],
    [
      0,
      0.4058451513773972,
      -0.4058451513773972,
      -0.7415311855993945,
      0.7415311855993945,
      -0.9491079123427585,
      0.9491079123427585
    ],
    [
      -0.1834346424956498,
      0.1834346424956498,
      -0.525532409916329,
      0.525532409916329,
      -0.7966664774136267,
      0.7966664774136267,
      -0.9602898564975363,
      0.9602898564975363
    ],
    [
      0,
      -0.8360311073266358,
      0.8360311073266358,
      -0.9681602395076261,
      0.9681602395076261,
      -0.3242534234038089,
      0.3242534234038089,
      -0.6133714327005904,
      0.6133714327005904
    ],
    [
      -0.14887433898163122,
      0.14887433898163122,
      -0.4333953941292472,
      0.4333953941292472,
      -0.6794095682990244,
      0.6794095682990244,
      -0.8650633666889845,
      0.8650633666889845,
      -0.9739065285171717,
      0.9739065285171717
    ],
    [
      0,
      -0.26954315595234496,
      0.26954315595234496,
      -0.5190961292068118,
      0.5190961292068118,
      -0.7301520055740494,
      0.7301520055740494,
      -0.8870625997680953,
      0.8870625997680953,
      -0.978228658146057,
      0.978228658146057
    ],
    [
      -0.1252334085114689,
      0.1252334085114689,
      -0.3678314989981802,
      0.3678314989981802,
      -0.5873179542866175,
      0.5873179542866175,
      -0.7699026741943047,
      0.7699026741943047,
      -0.9041172563704749,
      0.9041172563704749,
      -0.9815606342467192,
      0.9815606342467192
    ],
    [
      0,
      -0.2304583159551348,
      0.2304583159551348,
      -0.44849275103644687,
      0.44849275103644687,
      -0.6423493394403402,
      0.6423493394403402,
      -0.8015780907333099,
      0.8015780907333099,
      -0.9175983992229779,
      0.9175983992229779,
      -0.9841830547185881,
      0.9841830547185881
    ],
    [
      -0.10805494870734367,
      0.10805494870734367,
      -0.31911236892788974,
      0.31911236892788974,
      -0.5152486363581541,
      0.5152486363581541,
      -0.6872929048116855,
      0.6872929048116855,
      -0.827201315069765,
      0.827201315069765,
      -0.9284348836635735,
      0.9284348836635735,
      -0.9862838086968123,
      0.9862838086968123
    ],
    [
      0,
      -0.20119409399743451,
      0.20119409399743451,
      -0.3941513470775634,
      0.3941513470775634,
      -0.5709721726085388,
      0.5709721726085388,
      -0.7244177313601701,
      0.7244177313601701,
      -0.8482065834104272,
      0.8482065834104272,
      -0.937273392400706,
      0.937273392400706,
      -0.9879925180204854,
      0.9879925180204854
    ],
    [
      -0.09501250983763744,
      0.09501250983763744,
      -0.2816035507792589,
      0.2816035507792589,
      -0.45801677765722737,
      0.45801677765722737,
      -0.6178762444026438,
      0.6178762444026438,
      -0.755404408355003,
      0.755404408355003,
      -0.8656312023878318,
      0.8656312023878318,
      -0.9445750230732326,
      0.9445750230732326,
      -0.9894009349916499,
      0.9894009349916499
    ],
    [
      0,
      -0.17848418149584785,
      0.17848418149584785,
      -0.3512317634538763,
      0.3512317634538763,
      -0.5126905370864769,
      0.5126905370864769,
      -0.6576711592166907,
      0.6576711592166907,
      -0.7815140038968014,
      0.7815140038968014,
      -0.8802391537269859,
      0.8802391537269859,
      -0.9506755217687678,
      0.9506755217687678,
      -0.9905754753144174,
      0.9905754753144174
    ],
    [
      -0.0847750130417353,
      0.0847750130417353,
      -0.2518862256915055,
      0.2518862256915055,
      -0.41175116146284263,
      0.41175116146284263,
      -0.5597708310739475,
      0.5597708310739475,
      -0.6916870430603532,
      0.6916870430603532,
      -0.8037049589725231,
      0.8037049589725231,
      -0.8926024664975557,
      0.8926024664975557,
      -0.9558239495713977,
      0.9558239495713977,
      -0.9915651684209309,
      0.9915651684209309
    ],
    [
      0,
      -0.16035864564022537,
      0.16035864564022537,
      -0.31656409996362983,
      0.31656409996362983,
      -0.46457074137596094,
      0.46457074137596094,
      -0.600545304661681,
      0.600545304661681,
      -0.7209661773352294,
      0.7209661773352294,
      -0.8227146565371428,
      0.8227146565371428,
      -0.9031559036148179,
      0.9031559036148179,
      -0.96020815213483,
      0.96020815213483,
      -0.9924068438435844,
      0.9924068438435844
    ],
    [
      -0.07652652113349734,
      0.07652652113349734,
      -0.22778585114164507,
      0.22778585114164507,
      -0.37370608871541955,
      0.37370608871541955,
      -0.5108670019508271,
      0.5108670019508271,
      -0.636053680726515,
      0.636053680726515,
      -0.7463319064601508,
      0.7463319064601508,
      -0.8391169718222188,
      0.8391169718222188,
      -0.912234428251326,
      0.912234428251326,
      -0.9639719272779138,
      0.9639719272779138,
      -0.9931285991850949,
      0.9931285991850949
    ],
    [
      0,
      -0.1455618541608951,
      0.1455618541608951,
      -0.2880213168024011,
      0.2880213168024011,
      -0.4243421202074388,
      0.4243421202074388,
      -0.5516188358872198,
      0.5516188358872198,
      -0.6671388041974123,
      0.6671388041974123,
      -0.7684399634756779,
      0.7684399634756779,
      -0.8533633645833173,
      0.8533633645833173,
      -0.9200993341504008,
      0.9200993341504008,
      -0.9672268385663063,
      0.9672268385663063,
      -0.9937521706203895,
      0.9937521706203895
    ],
    [
      -0.06973927331972223,
      0.06973927331972223,
      -0.20786042668822127,
      0.20786042668822127,
      -0.34193582089208424,
      0.34193582089208424,
      -0.469355837986757,
      0.469355837986757,
      -0.5876404035069116,
      0.5876404035069116,
      -0.6944872631866827,
      0.6944872631866827,
      -0.7878168059792081,
      0.7878168059792081,
      -0.8658125777203002,
      0.8658125777203002,
      -0.926956772187174,
      0.926956772187174,
      -0.9700604978354287,
      0.9700604978354287,
      -0.9942945854823992,
      0.9942945854823992
    ],
    [
      0,
      -0.1332568242984661,
      0.1332568242984661,
      -0.26413568097034495,
      0.26413568097034495,
      -0.3903010380302908,
      0.3903010380302908,
      -0.5095014778460075,
      0.5095014778460075,
      -0.6196098757636461,
      0.6196098757636461,
      -0.7186613631319502,
      0.7186613631319502,
      -0.8048884016188399,
      0.8048884016188399,
      -0.8767523582704416,
      0.8767523582704416,
      -0.9329710868260161,
      0.9329710868260161,
      -0.9725424712181152,
      0.9725424712181152,
      -0.9947693349975522,
      0.9947693349975522
    ],
    [
      -0.06405689286260563,
      0.06405689286260563,
      -0.1911188674736163,
      0.1911188674736163,
      -0.3150426796961634,
      0.3150426796961634,
      -0.4337935076260451,
      0.4337935076260451,
      -0.5454214713888396,
      0.5454214713888396,
      -0.6480936519369755,
      0.6480936519369755,
      -0.7401241915785544,
      0.7401241915785544,
      -0.820001985973903,
      0.820001985973903,
      -0.8864155270044011,
      0.8864155270044011,
      -0.9382745520027328,
      0.9382745520027328,
      -0.9747285559713095,
      0.9747285559713095,
      -0.9951872199970213,
      0.9951872199970213
    ]
  ];
  var cValues = [
    [],
    [],
    [1, 1],
    [
      0.8888888888888888,
      0.5555555555555556,
      0.5555555555555556
    ],
    [
      0.6521451548625461,
      0.6521451548625461,
      0.34785484513745385,
      0.34785484513745385
    ],
    [
      0.5688888888888889,
      0.47862867049936647,
      0.47862867049936647,
      0.23692688505618908,
      0.23692688505618908
    ],
    [
      0.3607615730481386,
      0.3607615730481386,
      0.46791393457269104,
      0.46791393457269104,
      0.17132449237917036,
      0.17132449237917036
    ],
    [
      0.4179591836734694,
      0.3818300505051189,
      0.3818300505051189,
      0.27970539148927664,
      0.27970539148927664,
      0.1294849661688697,
      0.1294849661688697
    ],
    [
      0.362683783378362,
      0.362683783378362,
      0.31370664587788727,
      0.31370664587788727,
      0.22238103445337448,
      0.22238103445337448,
      0.10122853629037626,
      0.10122853629037626
    ],
    [
      0.3302393550012598,
      0.1806481606948574,
      0.1806481606948574,
      0.08127438836157441,
      0.08127438836157441,
      0.31234707704000286,
      0.31234707704000286,
      0.26061069640293544,
      0.26061069640293544
    ],
    [
      0.29552422471475287,
      0.29552422471475287,
      0.26926671930999635,
      0.26926671930999635,
      0.21908636251598204,
      0.21908636251598204,
      0.1494513491505806,
      0.1494513491505806,
      0.06667134430868814,
      0.06667134430868814
    ],
    [
      0.2729250867779006,
      0.26280454451024665,
      0.26280454451024665,
      0.23319376459199048,
      0.23319376459199048,
      0.18629021092773426,
      0.18629021092773426,
      0.1255803694649046,
      0.1255803694649046,
      0.05566856711617366,
      0.05566856711617366
    ],
    [
      0.24914704581340277,
      0.24914704581340277,
      0.2334925365383548,
      0.2334925365383548,
      0.20316742672306592,
      0.20316742672306592,
      0.16007832854334622,
      0.16007832854334622,
      0.10693932599531843,
      0.10693932599531843,
      0.04717533638651183,
      0.04717533638651183
    ],
    [
      0.2325515532308739,
      0.22628318026289723,
      0.22628318026289723,
      0.2078160475368885,
      0.2078160475368885,
      0.17814598076194574,
      0.17814598076194574,
      0.13887351021978725,
      0.13887351021978725,
      0.09212149983772845,
      0.09212149983772845,
      0.04048400476531588,
      0.04048400476531588
    ],
    [
      0.2152638534631578,
      0.2152638534631578,
      0.2051984637212956,
      0.2051984637212956,
      0.18553839747793782,
      0.18553839747793782,
      0.15720316715819355,
      0.15720316715819355,
      0.12151857068790319,
      0.12151857068790319,
      0.08015808715976021,
      0.08015808715976021,
      0.03511946033175186,
      0.03511946033175186
    ],
    [
      0.2025782419255613,
      0.19843148532711158,
      0.19843148532711158,
      0.1861610000155622,
      0.1861610000155622,
      0.16626920581699392,
      0.16626920581699392,
      0.13957067792615432,
      0.13957067792615432,
      0.10715922046717194,
      0.10715922046717194,
      0.07036604748810812,
      0.07036604748810812,
      0.03075324199611727,
      0.03075324199611727
    ],
    [
      0.1894506104550685,
      0.1894506104550685,
      0.18260341504492358,
      0.18260341504492358,
      0.16915651939500254,
      0.16915651939500254,
      0.14959598881657674,
      0.14959598881657674,
      0.12462897125553388,
      0.12462897125553388,
      0.09515851168249279,
      0.09515851168249279,
      0.062253523938647894,
      0.062253523938647894,
      0.027152459411754096,
      0.027152459411754096
    ],
    [
      0.17944647035620653,
      0.17656270536699264,
      0.17656270536699264,
      0.16800410215645004,
      0.16800410215645004,
      0.15404576107681028,
      0.15404576107681028,
      0.13513636846852548,
      0.13513636846852548,
      0.11188384719340397,
      0.11188384719340397,
      0.08503614831717918,
      0.08503614831717918,
      0.0554595293739872,
      0.0554595293739872,
      0.02414830286854793,
      0.02414830286854793
    ],
    [
      0.1691423829631436,
      0.1691423829631436,
      0.16427648374583273,
      0.16427648374583273,
      0.15468467512626524,
      0.15468467512626524,
      0.14064291467065065,
      0.14064291467065065,
      0.12255520671147846,
      0.12255520671147846,
      0.10094204410628717,
      0.10094204410628717,
      0.07642573025488905,
      0.07642573025488905,
      0.0497145488949698,
      0.0497145488949698,
      0.02161601352648331,
      0.02161601352648331
    ],
    [
      0.1610544498487837,
      0.15896884339395434,
      0.15896884339395434,
      0.15276604206585967,
      0.15276604206585967,
      0.1426067021736066,
      0.1426067021736066,
      0.12875396253933621,
      0.12875396253933621,
      0.11156664554733399,
      0.11156664554733399,
      0.09149002162245,
      0.09149002162245,
      0.06904454273764123,
      0.06904454273764123,
      0.0448142267656996,
      0.0448142267656996,
      0.019461788229726478,
      0.019461788229726478
    ],
    [
      0.15275338713072584,
      0.15275338713072584,
      0.14917298647260374,
      0.14917298647260374,
      0.14209610931838204,
      0.14209610931838204,
      0.13168863844917664,
      0.13168863844917664,
      0.11819453196151841,
      0.11819453196151841,
      0.10193011981724044,
      0.10193011981724044,
      0.08327674157670475,
      0.08327674157670475,
      0.06267204833410907,
      0.06267204833410907,
      0.04060142980038694,
      0.04060142980038694,
      0.017614007139152118,
      0.017614007139152118
    ],
    [
      0.14608113364969041,
      0.14452440398997005,
      0.14452440398997005,
      0.13988739479107315,
      0.13988739479107315,
      0.13226893863333747,
      0.13226893863333747,
      0.12183141605372853,
      0.12183141605372853,
      0.10879729916714838,
      0.10879729916714838,
      0.09344442345603386,
      0.09344442345603386,
      0.0761001136283793,
      0.0761001136283793,
      0.057134425426857205,
      0.057134425426857205,
      0.036953789770852494,
      0.036953789770852494,
      0.016017228257774335,
      0.016017228257774335
    ],
    [
      0.13925187285563198,
      0.13925187285563198,
      0.13654149834601517,
      0.13654149834601517,
      0.13117350478706238,
      0.13117350478706238,
      0.12325237681051242,
      0.12325237681051242,
      0.11293229608053922,
      0.11293229608053922,
      0.10041414444288096,
      0.10041414444288096,
      0.08594160621706773,
      0.08594160621706773,
      0.06979646842452049,
      0.06979646842452049,
      0.052293335152683286,
      0.052293335152683286,
      0.03377490158481415,
      0.03377490158481415,
      0.0146279952982722,
      0.0146279952982722
    ],
    [
      0.13365457218610619,
      0.1324620394046966,
      0.1324620394046966,
      0.12890572218808216,
      0.12890572218808216,
      0.12304908430672953,
      0.12304908430672953,
      0.11499664022241136,
      0.11499664022241136,
      0.10489209146454141,
      0.10489209146454141,
      0.09291576606003515,
      0.09291576606003515,
      0.07928141177671895,
      0.07928141177671895,
      0.06423242140852585,
      0.06423242140852585,
      0.04803767173108467,
      0.04803767173108467,
      0.030988005856979445,
      0.030988005856979445,
      0.013411859487141771,
      0.013411859487141771
    ],
    [
      0.12793819534675216,
      0.12793819534675216,
      0.1258374563468283,
      0.1258374563468283,
      0.12167047292780339,
      0.12167047292780339,
      0.1155056680537256,
      0.1155056680537256,
      0.10744427011596563,
      0.10744427011596563,
      0.09761865210411388,
      0.09761865210411388,
      0.08619016153195327,
      0.08619016153195327,
      0.0733464814110803,
      0.0733464814110803,
      0.05929858491543678,
      0.05929858491543678,
      0.04427743881741981,
      0.04427743881741981,
      0.028531388628933663,
      0.028531388628933663,
      0.0123412297999872,
      0.0123412297999872
    ]
  ];
  var binomialCoefficients = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]];
  var getCubicArcLength = (xs, ys, t5) => {
    let sum;
    let correctedT;
    const n5 = 20;
    const z2 = t5 / 2;
    sum = 0;
    for (let i3 = 0; i3 < n5; i3++) {
      correctedT = z2 * tValues[n5][i3] + z2;
      sum += cValues[n5][i3] * BFunc(xs, ys, correctedT);
    }
    return z2 * sum;
  };
  var getQuadraticArcLength = (xs, ys, t5) => {
    if (t5 === void 0) {
      t5 = 1;
    }
    const ax = xs[0] - 2 * xs[1] + xs[2];
    const ay = ys[0] - 2 * ys[1] + ys[2];
    const bx = 2 * xs[1] - 2 * xs[0];
    const by = 2 * ys[1] - 2 * ys[0];
    const A3 = 4 * (ax * ax + ay * ay);
    const B2 = 4 * (ax * bx + ay * by);
    const C2 = bx * bx + by * by;
    if (A3 === 0) {
      return t5 * Math.sqrt(Math.pow(xs[2] - xs[0], 2) + Math.pow(ys[2] - ys[0], 2));
    }
    const b3 = B2 / (2 * A3);
    const c4 = C2 / A3;
    const u4 = t5 + b3;
    const k3 = c4 - b3 * b3;
    const uuk = u4 * u4 + k3 > 0 ? Math.sqrt(u4 * u4 + k3) : 0;
    const bbk = b3 * b3 + k3 > 0 ? Math.sqrt(b3 * b3 + k3) : 0;
    const term = b3 + Math.sqrt(b3 * b3 + k3) !== 0 ? k3 * Math.log(Math.abs((u4 + uuk) / (b3 + bbk))) : 0;
    return Math.sqrt(A3) / 2 * (u4 * uuk - b3 * bbk + term);
  };
  function BFunc(xs, ys, t5) {
    const xbase = getDerivative(1, t5, xs);
    const ybase = getDerivative(1, t5, ys);
    const combined = xbase * xbase + ybase * ybase;
    return Math.sqrt(combined);
  }
  var getDerivative = (derivative, t5, vs) => {
    const n5 = vs.length - 1;
    let _vs;
    let value;
    if (n5 === 0) {
      return 0;
    }
    if (derivative === 0) {
      value = 0;
      for (let k3 = 0; k3 <= n5; k3++) {
        value += binomialCoefficients[n5][k3] * Math.pow(1 - t5, n5 - k3) * Math.pow(t5, k3) * vs[k3];
      }
      return value;
    } else {
      _vs = new Array(n5);
      for (let k3 = 0; k3 < n5; k3++) {
        _vs[k3] = n5 * (vs[k3 + 1] - vs[k3]);
      }
      return getDerivative(derivative - 1, t5, _vs);
    }
  };
  var t2length = (length, totalLength, func) => {
    let error = 1;
    let t5 = length / totalLength;
    let step = (length - func(t5)) / totalLength;
    let numIterations = 0;
    while (error > 1e-3) {
      const increasedTLength = func(t5 + step);
      const increasedTError = Math.abs(length - increasedTLength) / totalLength;
      if (increasedTError < error) {
        error = increasedTError;
        t5 += step;
      } else {
        const decreasedTLength = func(t5 - step);
        const decreasedTError = Math.abs(length - decreasedTLength) / totalLength;
        if (decreasedTError < error) {
          error = decreasedTError;
          t5 -= step;
        } else {
          step /= 2;
        }
      }
      numIterations++;
      if (numIterations > 500) {
        break;
      }
    }
    return t5;
  };
  var quadraticAt = (p0, p1, p22, t5) => {
    const mt = 1 - t5;
    return mt * mt * p0 + 2 * mt * t5 * p1 + t5 * t5 * p22;
  };
  var getQuadraticExtremaPoints = (x0, y0, x1, y1, x2, y22) => {
    const extrema = [];
    for (const axis of [
      [x0, x1, x2],
      [y0, y1, y22]
    ]) {
      const t5 = (axis[0] - axis[1]) / (axis[0] - 2 * axis[1] + axis[2]);
      if (t5 > 0 && t5 < 1) {
        extrema.push(quadraticAt(x0, x1, x2, t5), quadraticAt(y0, y1, y22, t5));
      }
    }
    return extrema;
  };
  var cubicAt = (p0, p1, p22, p3, t5) => {
    const mt = 1 - t5;
    return mt * mt * mt * p0 + 3 * mt * mt * t5 * p1 + 3 * mt * t5 * t5 * p22 + t5 * t5 * t5 * p3;
  };
  var getCubicExtremaPoints = (x0, y0, x1, y1, x2, y22, x3, y3) => {
    const extrema = [];
    for (const axis of [
      [x0, x1, x2, x3],
      [y0, y1, y22, y3]
    ]) {
      const a3 = -3 * axis[0] + 9 * axis[1] - 9 * axis[2] + 3 * axis[3];
      const b3 = 6 * axis[0] - 12 * axis[1] + 6 * axis[2];
      const c4 = -3 * axis[0] + 3 * axis[1];
      const discriminant = b3 * b3 - 4 * a3 * c4;
      if (discriminant < 0) {
        continue;
      }
      const q2 = -(b3 + (b3 < 0 ? -1 : 1) * Math.sqrt(discriminant)) / 2;
      for (const t5 of [q2 / a3, c4 / q2]) {
        if (t5 > 0 && t5 < 1) {
          extrema.push(cubicAt(x0, x1, x2, x3, t5), cubicAt(y0, y1, y22, y3, t5));
        }
      }
    }
    return extrema;
  };

  // node_modules/konva/lib/shapes/Line.js
  function getControlPoints(x0, y0, x1, y1, x2, y22, t5) {
    const d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)), d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y22 - y1, 2)), dSum = d01 + d12;
    if (dSum === 0) {
      return [x1, y1, x1, y1];
    }
    const fa = t5 * d01 / dSum, fb = t5 * d12 / dSum, p1x = x1 - fa * (x2 - x0), p1y = y1 - fa * (y22 - y0), p2x = x1 + fb * (x2 - x0), p2y = y1 + fb * (y22 - y0);
    return [p1x, p1y, p2x, p2y];
  }
  function expandPoints(p3, tension) {
    const len = p3.length, allPoints = [];
    for (let n5 = 2; n5 < len - 2; n5 += 2) {
      const cp = getControlPoints(p3[n5 - 2], p3[n5 - 1], p3[n5], p3[n5 + 1], p3[n5 + 2], p3[n5 + 3], tension);
      if (isNaN(cp[0])) {
        continue;
      }
      allPoints.push(cp[0]);
      allPoints.push(cp[1]);
      allPoints.push(p3[n5]);
      allPoints.push(p3[n5 + 1]);
      allPoints.push(cp[2]);
      allPoints.push(cp[3]);
    }
    return allPoints;
  }
  function getBezierExtremaPoints(points) {
    const extrema = [];
    for (let n5 = 0; n5 + 7 < points.length; n5 += 6) {
      extrema.push(points[n5 + 6], points[n5 + 7], ...getCubicExtremaPoints(points[n5], points[n5 + 1], points[n5 + 2], points[n5 + 3], points[n5 + 4], points[n5 + 5], points[n5 + 6], points[n5 + 7]));
    }
    return extrema;
  }
  var Line = class extends Shape {
    constructor(config) {
      super(config);
      this.on("pointsChange.konva tensionChange.konva closedChange.konva bezierChange.konva", function() {
        this._clearCache("tensionPoints");
      });
    }
    _hasTension() {
      return this.tension() !== 0 && this.points().length > 4;
    }
    _eachTensionSegment(onQuadratic, onCubic) {
      const points = this.points(), length = points.length, closed = this.closed(), tp = this.getTensionPoints(), len = tp.length;
      let x0 = points[0], y0 = points[1], n5 = closed ? 0 : 4;
      if (!closed) {
        onQuadratic(x0, y0, tp[0], tp[1], tp[2], tp[3]);
        x0 = tp[2];
        y0 = tp[3];
      }
      while (n5 < len - 2) {
        const cp1x = tp[n5++], cp1y = tp[n5++], cp2x = tp[n5++], cp2y = tp[n5++], x2 = tp[n5++], y3 = tp[n5++];
        onCubic(x0, y0, cp1x, cp1y, cp2x, cp2y, x2, y3);
        x0 = x2;
        y0 = y3;
      }
      if (!closed) {
        onQuadratic(x0, y0, tp[len - 2], tp[len - 1], points[length - 2], points[length - 1]);
      }
    }
    _sceneFunc(context) {
      const points = this.points(), length = points.length, closed = this.closed(), bezier = this.bezier();
      if (!length) {
        return;
      }
      let n5 = 0;
      context.beginPath();
      context.moveTo(points[0], points[1]);
      if (this._hasTension()) {
        this._eachTensionSegment((_x0, _y0, cpx, cpy, x2, y3) => context.quadraticCurveTo(cpx, cpy, x2, y3), (_x0, _y0, cp1x, cp1y, cp2x, cp2y, x2, y3) => context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y3));
      } else if (bezier) {
        n5 = 2;
        while (n5 < length) {
          context.bezierCurveTo(points[n5++], points[n5++], points[n5++], points[n5++], points[n5++], points[n5++]);
        }
      } else {
        for (n5 = 2; n5 < length; n5 += 2) {
          context.lineTo(points[n5], points[n5 + 1]);
        }
      }
      if (closed) {
        context.closePath();
        context.fillStrokeShape(this);
      } else {
        context.strokeShape(this);
      }
    }
    getTensionPoints() {
      return this._getCache("tensionPoints", this._getTensionPoints);
    }
    _getTensionPoints() {
      if (this.closed()) {
        return this._getTensionPointsClosed();
      } else {
        return expandPoints(this.points(), this.tension());
      }
    }
    _getTensionPointsClosed() {
      const p3 = this.points(), len = p3.length, tension = this.tension(), firstControlPoints = getControlPoints(p3[len - 2], p3[len - 1], p3[0], p3[1], p3[2], p3[3], tension), lastControlPoints = getControlPoints(p3[len - 4], p3[len - 3], p3[len - 2], p3[len - 1], p3[0], p3[1], tension), middle = expandPoints(p3, tension), tp = [firstControlPoints[2], firstControlPoints[3]].concat(middle).concat([
        lastControlPoints[0],
        lastControlPoints[1],
        p3[len - 2],
        p3[len - 1],
        lastControlPoints[2],
        lastControlPoints[3],
        firstControlPoints[0],
        firstControlPoints[1],
        p3[0],
        p3[1]
      ]);
      return tp;
    }
    getWidth() {
      return this.getSelfRect().width;
    }
    getHeight() {
      return this.getSelfRect().height;
    }
    getSelfRect() {
      let points = this.points();
      if (points.length < 4) {
        return {
          x: points[0] || 0,
          y: points[1] || 0,
          width: 0,
          height: 0
        };
      }
      if (this._hasTension()) {
        const bounds = [points[0], points[1]];
        this._eachTensionSegment((x0, y0, cpx, cpy, x3, y4) => bounds.push(x3, y4, ...getQuadraticExtremaPoints(x0, y0, cpx, cpy, x3, y4)), (x0, y0, cp1x, cp1y, cp2x, cp2y, x3, y4) => bounds.push(x3, y4, ...getCubicExtremaPoints(x0, y0, cp1x, cp1y, cp2x, cp2y, x3, y4)));
        points = bounds;
      } else if (this.bezier()) {
        points = [points[0], points[1], ...getBezierExtremaPoints(points)];
      }
      let minX = points[0];
      let maxX = points[0];
      let minY = points[1];
      let maxY = points[1];
      let x2, y3;
      for (let i3 = 0; i3 < points.length / 2; i3++) {
        x2 = points[i3 * 2];
        y3 = points[i3 * 2 + 1];
        minX = Math.min(minX, x2);
        maxX = Math.max(maxX, x2);
        minY = Math.min(minY, y3);
        maxY = Math.max(maxY, y3);
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  };
  Line.prototype.className = "Line";
  Line.prototype._attrsAffectingSize = ["points", "bezier", "tension"];
  _registerNode(Line);
  Factory.addGetterSetter(Line, "closed", false);
  Factory.addGetterSetter(Line, "bezier", false);
  Factory.addGetterSetter(Line, "tension", 0, getNumberValidator());
  Factory.addGetterSetter(Line, "points", [], getNumberArrayValidator());

  // node_modules/konva/lib/shapes/Path.js
  var Path = class _Path extends Shape {
    constructor(config) {
      super(config);
      this.dataArray = [];
      this.pathLength = 0;
      this._readDataAttribute();
      this.on("dataChange.konva", function() {
        this._readDataAttribute();
      });
    }
    _readDataAttribute() {
      this.dataArray = _Path.parsePathData(this.data());
      this.pathLength = _Path.getPathLength(this.dataArray);
    }
    _sceneFunc(context) {
      const ca2 = this.dataArray;
      context.beginPath();
      let isClosed = false;
      for (let n5 = 0; n5 < ca2.length; n5++) {
        const c4 = ca2[n5].command;
        const p3 = ca2[n5].points;
        switch (c4) {
          case "L":
            context.lineTo(p3[0], p3[1]);
            break;
          case "M":
            context.moveTo(p3[0], p3[1]);
            break;
          case "C":
            context.bezierCurveTo(p3[0], p3[1], p3[2], p3[3], p3[4], p3[5]);
            break;
          case "Q":
            context.quadraticCurveTo(p3[0], p3[1], p3[2], p3[3]);
            break;
          case "A":
            const cx = p3[0], cy = p3[1], rx = p3[2], ry = p3[3], theta = p3[4], dTheta = p3[5], psi = p3[6], fs = p3[7];
            const r5 = rx > ry ? rx : ry;
            const scaleX = rx > ry ? 1 : rx / ry;
            const scaleY = rx > ry ? ry / rx : 1;
            context.translate(cx, cy);
            context.rotate(psi);
            context.scale(scaleX, scaleY);
            context.arc(0, 0, r5, theta, theta + dTheta, 1 - fs);
            context.scale(1 / scaleX, 1 / scaleY);
            context.rotate(-psi);
            context.translate(-cx, -cy);
            break;
          case "z":
            isClosed = true;
            context.closePath();
            break;
        }
      }
      if (!isClosed && !this.hasFill()) {
        context.strokeShape(this);
      } else {
        context.fillStrokeShape(this);
      }
    }
    getSelfRect() {
      let points = [];
      this.dataArray.forEach(function(data) {
        if (data.command === "A") {
          const start = data.points[4];
          const dTheta = data.points[5];
          const end = data.points[4] + dTheta;
          let inc = Math.PI / 180;
          if (Math.abs(start - end) < inc) {
            inc = Math.abs(start - end);
          }
          if (dTheta < 0) {
            for (let t5 = start - inc; t5 > end; t5 -= inc) {
              const point = _Path.getPointOnEllipticalArc(data.points[0], data.points[1], data.points[2], data.points[3], t5, 0);
              points.push(point.x, point.y);
            }
          } else {
            for (let t5 = start + inc; t5 < end; t5 += inc) {
              const point = _Path.getPointOnEllipticalArc(data.points[0], data.points[1], data.points[2], data.points[3], t5, 0);
              points.push(point.x, point.y);
            }
          }
        } else if (data.command === "C") {
          points.push(data.start.x, data.start.y, data.points[4], data.points[5], ...getCubicExtremaPoints(data.start.x, data.start.y, data.points[0], data.points[1], data.points[2], data.points[3], data.points[4], data.points[5]));
        } else if (data.command === "Q") {
          points.push(data.start.x, data.start.y, data.points[2], data.points[3], ...getQuadraticExtremaPoints(data.start.x, data.start.y, data.points[0], data.points[1], data.points[2], data.points[3]));
        } else {
          points = points.concat(data.points);
        }
      });
      let minX = points[0];
      let maxX = points[0];
      let minY = points[1];
      let maxY = points[1];
      let x2, y3;
      for (let i3 = 0; i3 < points.length / 2; i3++) {
        x2 = points[i3 * 2];
        y3 = points[i3 * 2 + 1];
        if (!isNaN(x2)) {
          minX = Math.min(minX, x2);
          maxX = Math.max(maxX, x2);
        }
        if (!isNaN(y3)) {
          minY = Math.min(minY, y3);
          maxY = Math.max(maxY, y3);
        }
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    getLength() {
      return this.pathLength;
    }
    getPointAtLength(length) {
      return _Path.getPointAtLengthOfDataArray(length, this.dataArray);
    }
    static getLineLength(x1, y1, x2, y22) {
      return Math.sqrt((x2 - x1) * (x2 - x1) + (y22 - y1) * (y22 - y1));
    }
    static getPathLength(dataArray) {
      let pathLength = 0;
      for (let i3 = 0; i3 < dataArray.length; ++i3) {
        pathLength += dataArray[i3].pathLength;
      }
      return pathLength;
    }
    static getPointAtLengthOfDataArray(length, dataArray) {
      let points, i3 = 0, ii = dataArray.length;
      if (!ii) {
        return null;
      }
      while (i3 < ii && length > dataArray[i3].pathLength) {
        length -= dataArray[i3].pathLength;
        ++i3;
      }
      if (i3 === ii) {
        let j3 = i3 - 1;
        while (j3 > 0 && dataArray[j3].points.length < 2) {
          j3--;
        }
        points = dataArray[j3].points.slice(-2);
        return {
          x: points[0],
          y: points[1]
        };
      }
      if (length < 0.01) {
        const cmd = dataArray[i3].command;
        if (cmd === "M") {
          points = dataArray[i3].points.slice(0, 2);
          return {
            x: points[0],
            y: points[1]
          };
        } else {
          return {
            x: dataArray[i3].start.x,
            y: dataArray[i3].start.y
          };
        }
      }
      const cp = dataArray[i3];
      const p3 = cp.points;
      switch (cp.command) {
        case "L":
          return _Path.getPointOnLine(length, cp.start.x, cp.start.y, p3[0], p3[1]);
        case "C":
          return _Path.getPointOnCubicBezier(t2length(length, _Path.getPathLength(dataArray), (i4) => {
            return getCubicArcLength([cp.start.x, p3[0], p3[2], p3[4]], [cp.start.y, p3[1], p3[3], p3[5]], i4);
          }), cp.start.x, cp.start.y, p3[0], p3[1], p3[2], p3[3], p3[4], p3[5]);
        case "Q":
          return _Path.getPointOnQuadraticBezier(t2length(length, _Path.getPathLength(dataArray), (i4) => {
            return getQuadraticArcLength([cp.start.x, p3[0], p3[2]], [cp.start.y, p3[1], p3[3]], i4);
          }), cp.start.x, cp.start.y, p3[0], p3[1], p3[2], p3[3]);
        case "A":
          const cx = p3[0], cy = p3[1], rx = p3[2], ry = p3[3], dTheta = p3[5], psi = p3[6];
          let theta = p3[4];
          theta += dTheta * length / cp.pathLength;
          return _Path.getPointOnEllipticalArc(cx, cy, rx, ry, theta, psi);
      }
      return null;
    }
    static getPointOnLine(dist, P1x, P1y, P2x, P2y, fromX, fromY) {
      fromX = fromX !== null && fromX !== void 0 ? fromX : P1x;
      fromY = fromY !== null && fromY !== void 0 ? fromY : P1y;
      const len = this.getLineLength(P1x, P1y, P2x, P2y);
      if (len < 1e-10) {
        return { x: P1x, y: P1y };
      }
      if (P2x === P1x) {
        return { x: fromX, y: fromY + (P2y > P1y ? dist : -dist) };
      }
      const m3 = (P2y - P1y) / (P2x - P1x);
      const run = Math.sqrt(dist * dist / (1 + m3 * m3)) * (P2x < P1x ? -1 : 1);
      const rise = m3 * run;
      if (Math.abs(fromY - P1y - m3 * (fromX - P1x)) < 1e-10) {
        return { x: fromX + run, y: fromY + rise };
      }
      const u4 = ((fromX - P1x) * (P2x - P1x) + (fromY - P1y) * (P2y - P1y)) / (len * len);
      const ix = P1x + u4 * (P2x - P1x);
      const iy = P1y + u4 * (P2y - P1y);
      const pRise = this.getLineLength(fromX, fromY, ix, iy);
      const pRun = Math.sqrt(dist * dist - pRise * pRise);
      const adjustedRun = Math.sqrt(pRun * pRun / (1 + m3 * m3)) * (P2x < P1x ? -1 : 1);
      const adjustedRise = m3 * adjustedRun;
      return { x: ix + adjustedRun, y: iy + adjustedRise };
    }
    static getPointOnCubicBezier(pct, P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y) {
      function CB1(t5) {
        return t5 * t5 * t5;
      }
      function CB2(t5) {
        return 3 * t5 * t5 * (1 - t5);
      }
      function CB3(t5) {
        return 3 * t5 * (1 - t5) * (1 - t5);
      }
      function CB4(t5) {
        return (1 - t5) * (1 - t5) * (1 - t5);
      }
      const x2 = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
      const y3 = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);
      return { x: x2, y: y3 };
    }
    static getPointOnQuadraticBezier(pct, P1x, P1y, P2x, P2y, P3x, P3y) {
      function QB1(t5) {
        return t5 * t5;
      }
      function QB2(t5) {
        return 2 * t5 * (1 - t5);
      }
      function QB3(t5) {
        return (1 - t5) * (1 - t5);
      }
      const x2 = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
      const y3 = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);
      return { x: x2, y: y3 };
    }
    static getPointOnEllipticalArc(cx, cy, rx, ry, theta, psi) {
      const cosPsi = Math.cos(psi), sinPsi = Math.sin(psi);
      const pt2 = {
        x: rx * Math.cos(theta),
        y: ry * Math.sin(theta)
      };
      return {
        x: cx + (pt2.x * cosPsi - pt2.y * sinPsi),
        y: cy + (pt2.x * sinPsi + pt2.y * cosPsi)
      };
    }
    static parsePathData(data) {
      if (!data) {
        return [];
      }
      let cs = data;
      const cc = [
        "m",
        "M",
        "l",
        "L",
        "v",
        "V",
        "h",
        "H",
        "z",
        "Z",
        "c",
        "C",
        "q",
        "Q",
        "t",
        "T",
        "s",
        "S",
        "a",
        "A"
      ];
      cs = cs.replace(new RegExp(" ", "g"), ",");
      for (let n5 = 0; n5 < cc.length; n5++) {
        cs = cs.replace(new RegExp(cc[n5], "g"), "|" + cc[n5]);
      }
      const arr = cs.split("|");
      const ca2 = [];
      const coords = [];
      let cpx = 0;
      let cpy = 0;
      const re2 = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:e[-+]?\d+)?)/gi;
      let match;
      for (let n5 = 1; n5 < arr.length; n5++) {
        let str2 = arr[n5];
        let c4 = str2.charAt(0);
        str2 = str2.slice(1);
        coords.length = 0;
        while (match = re2.exec(str2)) {
          coords.push(match[0]);
        }
        let p3 = [];
        let arcParamIndex = c4 === "A" || c4 === "a" ? 0 : -1;
        for (let j3 = 0, jlen = coords.length; j3 < jlen; j3++) {
          const token = coords[j3];
          if (token === "00") {
            p3.push(0, 0);
            if (arcParamIndex >= 0) {
              arcParamIndex += 2;
              if (arcParamIndex >= 7)
                arcParamIndex -= 7;
            }
            continue;
          }
          if (arcParamIndex >= 0) {
            if (arcParamIndex === 3) {
              if (/^[01]{2}\d+(?:\.\d+)?$/.test(token)) {
                p3.push(parseInt(token[0], 10));
                p3.push(parseInt(token[1], 10));
                p3.push(parseFloat(token.slice(2)));
                arcParamIndex += 3;
                if (arcParamIndex >= 7)
                  arcParamIndex -= 7;
                continue;
              }
              if (token === "11" || token === "10" || token === "01") {
                p3.push(parseInt(token[0], 10));
                p3.push(parseInt(token[1], 10));
                arcParamIndex += 2;
                if (arcParamIndex >= 7)
                  arcParamIndex -= 7;
                continue;
              }
              if (token === "0" || token === "1") {
                p3.push(parseInt(token, 10));
                arcParamIndex += 1;
                if (arcParamIndex >= 7)
                  arcParamIndex -= 7;
                continue;
              }
            } else if (arcParamIndex === 4) {
              if (/^[01]\d+(?:\.\d+)?$/.test(token)) {
                p3.push(parseInt(token[0], 10));
                p3.push(parseFloat(token.slice(1)));
                arcParamIndex += 2;
                if (arcParamIndex >= 7)
                  arcParamIndex -= 7;
                continue;
              }
              if (token === "0" || token === "1") {
                p3.push(parseInt(token, 10));
                arcParamIndex += 1;
                if (arcParamIndex >= 7)
                  arcParamIndex -= 7;
                continue;
              }
            }
            const parsedArc = parseFloat(token);
            if (!isNaN(parsedArc)) {
              p3.push(parsedArc);
            } else {
              p3.push(0);
            }
            arcParamIndex += 1;
            if (arcParamIndex >= 7)
              arcParamIndex -= 7;
          } else {
            const parsed = parseFloat(token);
            if (!isNaN(parsed)) {
              p3.push(parsed);
            } else {
              p3.push(0);
            }
          }
        }
        while (p3.length > 0) {
          if (isNaN(p3[0])) {
            break;
          }
          let cmd = "";
          let points = [];
          const startX = cpx, startY = cpy;
          let prevCmd, ctlPtx, ctlPty;
          let rx, ry, psi, fa, fs, x1, y1;
          switch (c4) {
            case "l":
              cpx += p3.shift();
              cpy += p3.shift();
              cmd = "L";
              points.push(cpx, cpy);
              break;
            case "L":
              cpx = p3.shift();
              cpy = p3.shift();
              points.push(cpx, cpy);
              break;
            case "m":
              const dx = p3.shift();
              const dy = p3.shift();
              cpx += dx;
              cpy += dy;
              cmd = "M";
              if (ca2.length > 2 && ca2[ca2.length - 1].command === "z") {
                for (let idx = ca2.length - 2; idx >= 0; idx--) {
                  if (ca2[idx].command === "M") {
                    cpx = ca2[idx].points[0] + dx;
                    cpy = ca2[idx].points[1] + dy;
                    break;
                  }
                }
              }
              points.push(cpx, cpy);
              c4 = "l";
              break;
            case "M":
              cpx = p3.shift();
              cpy = p3.shift();
              cmd = "M";
              points.push(cpx, cpy);
              c4 = "L";
              break;
            case "h":
              cpx += p3.shift();
              cmd = "L";
              points.push(cpx, cpy);
              break;
            case "H":
              cpx = p3.shift();
              cmd = "L";
              points.push(cpx, cpy);
              break;
            case "v":
              cpy += p3.shift();
              cmd = "L";
              points.push(cpx, cpy);
              break;
            case "V":
              cpy = p3.shift();
              cmd = "L";
              points.push(cpx, cpy);
              break;
            case "C":
              points.push(p3.shift(), p3.shift(), p3.shift(), p3.shift());
              cpx = p3.shift();
              cpy = p3.shift();
              points.push(cpx, cpy);
              break;
            case "c":
              points.push(cpx + p3.shift(), cpy + p3.shift(), cpx + p3.shift(), cpy + p3.shift());
              cpx += p3.shift();
              cpy += p3.shift();
              cmd = "C";
              points.push(cpx, cpy);
              break;
            case "S":
              ctlPtx = cpx;
              ctlPty = cpy;
              prevCmd = ca2[ca2.length - 1];
              if (prevCmd.command === "C") {
                ctlPtx = cpx + (cpx - prevCmd.points[2]);
                ctlPty = cpy + (cpy - prevCmd.points[3]);
              }
              points.push(ctlPtx, ctlPty, p3.shift(), p3.shift());
              cpx = p3.shift();
              cpy = p3.shift();
              cmd = "C";
              points.push(cpx, cpy);
              break;
            case "s":
              ctlPtx = cpx;
              ctlPty = cpy;
              prevCmd = ca2[ca2.length - 1];
              if (prevCmd.command === "C") {
                ctlPtx = cpx + (cpx - prevCmd.points[2]);
                ctlPty = cpy + (cpy - prevCmd.points[3]);
              }
              points.push(ctlPtx, ctlPty, cpx + p3.shift(), cpy + p3.shift());
              cpx += p3.shift();
              cpy += p3.shift();
              cmd = "C";
              points.push(cpx, cpy);
              break;
            case "Q":
              points.push(p3.shift(), p3.shift());
              cpx = p3.shift();
              cpy = p3.shift();
              points.push(cpx, cpy);
              break;
            case "q":
              points.push(cpx + p3.shift(), cpy + p3.shift());
              cpx += p3.shift();
              cpy += p3.shift();
              cmd = "Q";
              points.push(cpx, cpy);
              break;
            case "T":
              ctlPtx = cpx;
              ctlPty = cpy;
              prevCmd = ca2[ca2.length - 1];
              if (prevCmd.command === "Q") {
                ctlPtx = cpx + (cpx - prevCmd.points[0]);
                ctlPty = cpy + (cpy - prevCmd.points[1]);
              }
              cpx = p3.shift();
              cpy = p3.shift();
              cmd = "Q";
              points.push(ctlPtx, ctlPty, cpx, cpy);
              break;
            case "t":
              ctlPtx = cpx;
              ctlPty = cpy;
              prevCmd = ca2[ca2.length - 1];
              if (prevCmd.command === "Q") {
                ctlPtx = cpx + (cpx - prevCmd.points[0]);
                ctlPty = cpy + (cpy - prevCmd.points[1]);
              }
              cpx += p3.shift();
              cpy += p3.shift();
              cmd = "Q";
              points.push(ctlPtx, ctlPty, cpx, cpy);
              break;
            case "A":
              rx = p3.shift();
              ry = p3.shift();
              psi = p3.shift();
              fa = p3.shift();
              fs = p3.shift();
              x1 = cpx;
              y1 = cpy;
              cpx = p3.shift();
              cpy = p3.shift();
              cmd = "A";
              points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
              break;
            case "a":
              rx = p3.shift();
              ry = p3.shift();
              psi = p3.shift();
              fa = p3.shift();
              fs = p3.shift();
              x1 = cpx;
              y1 = cpy;
              cpx += p3.shift();
              cpy += p3.shift();
              cmd = "A";
              points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
              break;
          }
          ca2.push({
            command: cmd || c4,
            points,
            start: {
              x: startX,
              y: startY
            },
            pathLength: this.calcLength(startX, startY, cmd || c4, points)
          });
        }
        if (c4 === "z" || c4 === "Z") {
          ca2.push({
            command: "z",
            points: [],
            start: void 0,
            pathLength: 0
          });
        }
      }
      return ca2;
    }
    static calcLength(x2, y3, cmd, points) {
      let len, p1, p22, t5;
      const path = _Path;
      switch (cmd) {
        case "L":
          return path.getLineLength(x2, y3, points[0], points[1]);
        case "C":
          return getCubicArcLength([x2, points[0], points[2], points[4]], [y3, points[1], points[3], points[5]], 1);
        case "Q":
          return getQuadraticArcLength([x2, points[0], points[2]], [y3, points[1], points[3]], 1);
        case "A":
          len = 0;
          const start = points[4];
          const dTheta = points[5];
          const end = points[4] + dTheta;
          let inc = Math.PI / 180;
          if (Math.abs(start - end) < inc) {
            inc = Math.abs(start - end);
          }
          p1 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], start, 0);
          if (dTheta < 0) {
            for (t5 = start - inc; t5 > end; t5 -= inc) {
              p22 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t5, 0);
              len += path.getLineLength(p1.x, p1.y, p22.x, p22.y);
              p1 = p22;
            }
          } else {
            for (t5 = start + inc; t5 < end; t5 += inc) {
              p22 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t5, 0);
              len += path.getLineLength(p1.x, p1.y, p22.x, p22.y);
              p1 = p22;
            }
          }
          p22 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], end, 0);
          len += path.getLineLength(p1.x, p1.y, p22.x, p22.y);
          return len;
      }
      return 0;
    }
    static convertEndpointToCenterParameterization(x1, y1, x2, y22, fa, fs, rx, ry, psiDeg) {
      const psi = psiDeg * (Math.PI / 180);
      const xp = Math.cos(psi) * (x1 - x2) / 2 + Math.sin(psi) * (y1 - y22) / 2;
      const yp = -1 * Math.sin(psi) * (x1 - x2) / 2 + Math.cos(psi) * (y1 - y22) / 2;
      const lambda = xp * xp / (rx * rx) + yp * yp / (ry * ry);
      if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
      }
      let f3 = Math.sqrt((rx * rx * (ry * ry) - rx * rx * (yp * yp) - ry * ry * (xp * xp)) / (rx * rx * (yp * yp) + ry * ry * (xp * xp)));
      if (fa === fs) {
        f3 *= -1;
      }
      if (isNaN(f3)) {
        f3 = 0;
      }
      const cxp = f3 * rx * yp / ry;
      const cyp = f3 * -ry * xp / rx;
      const cx = (x1 + x2) / 2 + Math.cos(psi) * cxp - Math.sin(psi) * cyp;
      const cy = (y1 + y22) / 2 + Math.sin(psi) * cxp + Math.cos(psi) * cyp;
      const vMag = function(v4) {
        return Math.sqrt(v4[0] * v4[0] + v4[1] * v4[1]);
      };
      const vRatio = function(u5, v4) {
        return (u5[0] * v4[0] + u5[1] * v4[1]) / (vMag(u5) * vMag(v4));
      };
      const vAngle = function(u5, v4) {
        return (u5[0] * v4[1] < u5[1] * v4[0] ? -1 : 1) * Math.acos(vRatio(u5, v4));
      };
      const theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
      const u4 = [(xp - cxp) / rx, (yp - cyp) / ry];
      const v3 = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
      let dTheta = vAngle(u4, v3);
      if (vRatio(u4, v3) <= -1) {
        dTheta = Math.PI;
      }
      if (vRatio(u4, v3) >= 1) {
        dTheta = 0;
      }
      if (fs === 0 && dTheta > 0) {
        dTheta = dTheta - 2 * Math.PI;
      }
      if (fs === 1 && dTheta < 0) {
        dTheta = dTheta + 2 * Math.PI;
      }
      return [cx, cy, rx, ry, theta, dTheta, psi, fs];
    }
  };
  Path.prototype.className = "Path";
  Path.prototype._attrsAffectingSize = ["data"];
  _registerNode(Path);
  Factory.addGetterSetter(Path, "data");

  // node_modules/konva/lib/shapes/Arrow.js
  var Arrow = class extends Line {
    _sceneFunc(ctx) {
      super._sceneFunc(ctx);
      const PI2 = Math.PI * 2;
      const points = this.points();
      let tp = points;
      const fromTension = this.tension() !== 0 && points.length > 4;
      if (fromTension) {
        tp = this.getTensionPoints();
      }
      const length = this.pointerLength();
      const n5 = points.length;
      let dx, dy;
      if (fromTension) {
        const lp = [
          tp[tp.length - 4],
          tp[tp.length - 3],
          tp[tp.length - 2],
          tp[tp.length - 1],
          points[n5 - 2],
          points[n5 - 1]
        ];
        const lastLength = Path.calcLength(tp[tp.length - 4], tp[tp.length - 3], "C", lp);
        const previous = Path.getPointOnQuadraticBezier(Math.min(1, 1 - length / lastLength), lp[0], lp[1], lp[2], lp[3], lp[4], lp[5]);
        dx = points[n5 - 2] - previous.x;
        dy = points[n5 - 1] - previous.y;
      } else {
        dx = points[n5 - 2] - points[n5 - 4];
        dy = points[n5 - 1] - points[n5 - 3];
      }
      const radians = (Math.atan2(dy, dx) + PI2) % PI2;
      const width = this.pointerWidth();
      if (this.pointerAtEnding()) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(points[n5 - 2], points[n5 - 1]);
        ctx.rotate(radians);
        ctx.moveTo(0, 0);
        ctx.lineTo(-length, width / 2);
        ctx.lineTo(-length, -width / 2);
        ctx.closePath();
        ctx.restore();
        this.__fillStroke(ctx);
      }
      if (this.pointerAtBeginning()) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(points[0], points[1]);
        if (fromTension) {
          dx = (tp[0] + tp[2]) / 2 - points[0];
          dy = (tp[1] + tp[3]) / 2 - points[1];
        } else {
          dx = points[2] - points[0];
          dy = points[3] - points[1];
        }
        ctx.rotate((Math.atan2(-dy, -dx) + PI2) % PI2);
        ctx.moveTo(0, 0);
        ctx.lineTo(-length, width / 2);
        ctx.lineTo(-length, -width / 2);
        ctx.closePath();
        ctx.restore();
        this.__fillStroke(ctx);
      }
    }
    __fillStroke(ctx) {
      const isDashEnabled = this.dashEnabled();
      if (isDashEnabled) {
        this.attrs.dashEnabled = false;
        ctx.setLineDash([]);
      }
      ctx.fillStrokeShape(this);
      if (isDashEnabled) {
        this.attrs.dashEnabled = true;
      }
    }
    getSelfRect() {
      const lineRect = super.getSelfRect();
      const offset = this.pointerWidth() / 2;
      return {
        x: lineRect.x,
        y: lineRect.y - offset,
        width: lineRect.width,
        height: lineRect.height + offset * 2
      };
    }
  };
  Arrow.prototype.className = "Arrow";
  _registerNode(Arrow);
  Factory.addGetterSetter(Arrow, "pointerLength", 10, getNumberValidator());
  Factory.addGetterSetter(Arrow, "pointerWidth", 10, getNumberValidator());
  Factory.addGetterSetter(Arrow, "pointerAtBeginning", false);
  Factory.addGetterSetter(Arrow, "pointerAtEnding", true);

  // node_modules/konva/lib/shapes/Circle.js
  var Circle = class extends Shape {
    _sceneFunc(context) {
      context.beginPath();
      context.arc(0, 0, this.attrs.radius || 0, 0, Math.PI * 2, false);
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      return this.radius() * 2;
    }
    getHeight() {
      return this.radius() * 2;
    }
    setWidth(width) {
      if (this.radius() !== width / 2) {
        this.radius(width / 2);
      }
    }
    setHeight(height) {
      if (this.radius() !== height / 2) {
        this.radius(height / 2);
      }
    }
  };
  Circle.prototype._centroid = true;
  Circle.prototype.className = "Circle";
  Circle.prototype._attrsAffectingSize = ["radius"];
  _registerNode(Circle);
  Factory.addGetterSetter(Circle, "radius", 0, getNumberValidator());

  // node_modules/konva/lib/shapes/Ellipse.js
  var Ellipse = class extends Shape {
    _sceneFunc(context) {
      const rx = this.radiusX(), ry = this.radiusY();
      context.beginPath();
      context.save();
      if (rx !== ry) {
        context.scale(1, ry / rx);
      }
      context.arc(0, 0, rx, 0, Math.PI * 2, false);
      context.restore();
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      return this.radiusX() * 2;
    }
    getHeight() {
      return this.radiusY() * 2;
    }
    setWidth(width) {
      this.radiusX(width / 2);
    }
    setHeight(height) {
      this.radiusY(height / 2);
    }
  };
  Ellipse.prototype.className = "Ellipse";
  Ellipse.prototype._centroid = true;
  Ellipse.prototype._attrsAffectingSize = ["radiusX", "radiusY"];
  _registerNode(Ellipse);
  Factory.addComponentsGetterSetter(Ellipse, "radius", ["x", "y"]);
  Factory.addGetterSetter(Ellipse, "radiusX", 0, getNumberValidator());
  Factory.addGetterSetter(Ellipse, "radiusY", 0, getNumberValidator());

  // node_modules/konva/lib/shapes/Image.js
  var Image2 = class _Image extends Shape {
    constructor(attrs) {
      super(attrs);
      this._loadListener = () => {
        this._requestDraw();
      };
      this.on("imageChange.konva", (props) => {
        this._removeImageLoad(props.oldVal);
        this._setImageLoad();
      });
      this._setImageLoad();
    }
    _setImageLoad() {
      const image = this.image();
      if (image && image.complete) {
        return;
      }
      if (image && image.readyState === 4) {
        return;
      }
      if (image && image["addEventListener"]) {
        image["addEventListener"]("load", this._loadListener);
      }
    }
    _removeImageLoad(image) {
      if (image && image["removeEventListener"]) {
        image["removeEventListener"]("load", this._loadListener);
      }
    }
    destroy() {
      this._removeImageLoad(this.image());
      super.destroy();
      return this;
    }
    _useBufferCanvas() {
      const hasCornerRadius = !!this.cornerRadius();
      const hasShadow = this.hasShadow();
      if (hasCornerRadius && hasShadow) {
        return true;
      }
      return super._useBufferCanvas(true);
    }
    _sceneFunc(context) {
      const width = this.getWidth();
      const height = this.getHeight();
      const cornerRadius = this.cornerRadius();
      const image = this.attrs.image;
      let params;
      if (image) {
        const cropWidth = this.attrs.cropWidth;
        const cropHeight = this.attrs.cropHeight;
        if (cropWidth && cropHeight) {
          params = [
            image,
            this.cropX(),
            this.cropY(),
            cropWidth,
            cropHeight,
            0,
            0,
            width,
            height
          ];
        } else {
          params = [image, 0, 0, width, height];
        }
      }
      if (this.hasFill() || this.hasStroke() || cornerRadius) {
        context.beginPath();
        cornerRadius ? Util.drawRoundedRectPath(context, width, height, cornerRadius) : context.rect(0, 0, width, height);
        context.closePath();
        context.fillStrokeShape(this);
      }
      if (image) {
        if (cornerRadius) {
          context.clip();
        }
        context.drawImage.apply(context, params);
      }
    }
    _hitFunc(context) {
      const width = this.width(), height = this.height(), cornerRadius = this.cornerRadius();
      context.beginPath();
      if (!cornerRadius) {
        context.rect(0, 0, width, height);
      } else {
        Util.drawRoundedRectPath(context, width, height, cornerRadius);
      }
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      var _a, _b, _c;
      return (_c = (_a = this.attrs.width) !== null && _a !== void 0 ? _a : (_b = this.image()) === null || _b === void 0 ? void 0 : _b.width) !== null && _c !== void 0 ? _c : 0;
    }
    getHeight() {
      var _a, _b, _c;
      return (_c = (_a = this.attrs.height) !== null && _a !== void 0 ? _a : (_b = this.image()) === null || _b === void 0 ? void 0 : _b.height) !== null && _c !== void 0 ? _c : 0;
    }
    static fromURL(url, callback, onError = null) {
      const img = Util.createImageElement();
      img.onload = function() {
        const image = new _Image({
          image: img
        });
        callback(image);
      };
      img.onerror = onError;
      img.crossOrigin = "Anonymous";
      img.src = url;
    }
  };
  Image2.prototype.className = "Image";
  Image2.prototype._attrsAffectingSize = ["image"];
  _registerNode(Image2);
  Factory.addGetterSetter(Image2, "cornerRadius", 0, getNumberOrArrayOfNumbersValidator(4));
  Factory.addGetterSetter(Image2, "image");
  Factory.addComponentsGetterSetter(Image2, "crop", ["x", "y", "width", "height"]);
  Factory.addGetterSetter(Image2, "cropX", 0, getNumberValidator());
  Factory.addGetterSetter(Image2, "cropY", 0, getNumberValidator());
  Factory.addGetterSetter(Image2, "cropWidth", 0, getNumberValidator());
  Factory.addGetterSetter(Image2, "cropHeight", 0, getNumberValidator());

  // node_modules/konva/lib/shapes/Label.js
  var ATTR_CHANGE_LIST = [
    "fontFamily",
    "fontSize",
    "fontStyle",
    "padding",
    "lineHeight",
    "text",
    "width",
    "height",
    "pointerDirection",
    "pointerWidth",
    "pointerHeight"
  ];
  var CHANGE_KONVA = "Change.konva";
  var NONE = "none";
  var UP = "up";
  var RIGHT = "right";
  var DOWN = "down";
  var LEFT = "left";
  var attrChangeListLen = ATTR_CHANGE_LIST.length;
  var Label = class extends Group {
    constructor(config) {
      super(config);
      this.on("add.konva", function(evt) {
        this._addListeners(evt.child);
        this._sync();
      });
    }
    getText() {
      return this.find("Text")[0];
    }
    getTag() {
      return this.find("Tag")[0];
    }
    _addListeners(text) {
      let that = this, n5;
      const func = function() {
        that._sync();
      };
      for (n5 = 0; n5 < attrChangeListLen; n5++) {
        text.on(ATTR_CHANGE_LIST[n5] + CHANGE_KONVA, func);
      }
    }
    getWidth() {
      return this.getText().width();
    }
    getHeight() {
      return this.getText().height();
    }
    _sync() {
      let text = this.getText(), tag = this.getTag(), width, height, pointerDirection, pointerWidth, x2, y3, pointerHeight;
      if (text && tag) {
        width = text.width();
        height = text.height();
        pointerDirection = tag.pointerDirection();
        pointerWidth = tag.pointerWidth();
        pointerHeight = tag.pointerHeight();
        x2 = 0;
        y3 = 0;
        switch (pointerDirection) {
          case UP:
            x2 = width / 2;
            y3 = -1 * pointerHeight;
            break;
          case RIGHT:
            x2 = width + pointerWidth;
            y3 = height / 2;
            break;
          case DOWN:
            x2 = width / 2;
            y3 = height + pointerHeight;
            break;
          case LEFT:
            x2 = -1 * pointerWidth;
            y3 = height / 2;
            break;
        }
        tag.setAttrs({
          x: -1 * x2,
          y: -1 * y3,
          width,
          height
        });
        text.setAttrs({
          x: -1 * x2,
          y: -1 * y3
        });
      }
    }
  };
  Label.prototype.className = "Label";
  _registerNode(Label);
  var Tag = class extends Shape {
    _sceneFunc(context) {
      const width = this.width(), height = this.height(), pointerDirection = this.pointerDirection(), pointerWidth = this.pointerWidth(), pointerHeight = this.pointerHeight(), cornerRadius = this.cornerRadius();
      let topLeft = 0;
      let topRight = 0;
      let bottomLeft = 0;
      let bottomRight = 0;
      if (typeof cornerRadius === "number") {
        topLeft = topRight = bottomLeft = bottomRight = Math.min(cornerRadius, width / 2, height / 2);
      } else {
        topLeft = Math.min(cornerRadius[0] || 0, width / 2, height / 2);
        topRight = Math.min(cornerRadius[1] || 0, width / 2, height / 2);
        bottomRight = Math.min(cornerRadius[2] || 0, width / 2, height / 2);
        bottomLeft = Math.min(cornerRadius[3] || 0, width / 2, height / 2);
      }
      context.beginPath();
      context.moveTo(topLeft, 0);
      if (pointerDirection === UP) {
        context.lineTo((width - pointerWidth) / 2, 0);
        context.lineTo(width / 2, -1 * pointerHeight);
        context.lineTo((width + pointerWidth) / 2, 0);
      }
      context.lineTo(width - topRight, 0);
      context.arc(width - topRight, topRight, topRight, Math.PI * 3 / 2, 0, false);
      if (pointerDirection === RIGHT) {
        context.lineTo(width, (height - pointerHeight) / 2);
        context.lineTo(width + pointerWidth, height / 2);
        context.lineTo(width, (height + pointerHeight) / 2);
      }
      context.lineTo(width, height - bottomRight);
      context.arc(width - bottomRight, height - bottomRight, bottomRight, 0, Math.PI / 2, false);
      if (pointerDirection === DOWN) {
        context.lineTo((width + pointerWidth) / 2, height);
        context.lineTo(width / 2, height + pointerHeight);
        context.lineTo((width - pointerWidth) / 2, height);
      }
      context.lineTo(bottomLeft, height);
      context.arc(bottomLeft, height - bottomLeft, bottomLeft, Math.PI / 2, Math.PI, false);
      if (pointerDirection === LEFT) {
        context.lineTo(0, (height + pointerHeight) / 2);
        context.lineTo(-1 * pointerWidth, height / 2);
        context.lineTo(0, (height - pointerHeight) / 2);
      }
      context.lineTo(0, topLeft);
      context.arc(topLeft, topLeft, topLeft, Math.PI, Math.PI * 3 / 2, false);
      context.closePath();
      context.fillStrokeShape(this);
    }
    getSelfRect() {
      let x2 = 0, y3 = 0, pointerWidth = this.pointerWidth(), pointerHeight = this.pointerHeight(), direction = this.pointerDirection(), width = this.width(), height = this.height();
      if (direction === UP) {
        y3 -= pointerHeight;
        height += pointerHeight;
      } else if (direction === DOWN) {
        height += pointerHeight;
      } else if (direction === LEFT) {
        x2 -= pointerWidth * 1.5;
        width += pointerWidth;
      } else if (direction === RIGHT) {
        width += pointerWidth * 1.5;
      }
      return {
        x: x2,
        y: y3,
        width,
        height
      };
    }
  };
  Tag.prototype.className = "Tag";
  _registerNode(Tag);
  Factory.addGetterSetter(Tag, "pointerDirection", NONE);
  Factory.addGetterSetter(Tag, "pointerWidth", 0, getNumberValidator());
  Factory.addGetterSetter(Tag, "pointerHeight", 0, getNumberValidator());
  Factory.addGetterSetter(Tag, "cornerRadius", 0, getNumberOrArrayOfNumbersValidator(4));

  // node_modules/konva/lib/shapes/Rect.js
  var Rect = class extends Shape {
    _sceneFunc(context) {
      const cornerRadius = this.cornerRadius(), width = this.width(), height = this.height();
      context.beginPath();
      if (!cornerRadius) {
        context.rect(0, 0, width, height);
      } else {
        Util.drawRoundedRectPath(context, width, height, cornerRadius);
      }
      context.closePath();
      context.fillStrokeShape(this);
    }
  };
  Rect.prototype.className = "Rect";
  _registerNode(Rect);
  Factory.addGetterSetter(Rect, "cornerRadius", 0, getNumberOrArrayOfNumbersValidator(4));

  // node_modules/konva/lib/shapes/RegularPolygon.js
  var RegularPolygon = class extends Shape {
    _sceneFunc(context) {
      const points = this._getPoints(), radius = this.radius(), sides = this.sides(), cornerRadius = this.cornerRadius();
      context.beginPath();
      if (!cornerRadius) {
        context.moveTo(points[0].x, points[0].y);
        for (let n5 = 1; n5 < points.length; n5++) {
          context.lineTo(points[n5].x, points[n5].y);
        }
      } else {
        Util.drawRoundedPolygonPath(context, points, sides, radius, cornerRadius);
      }
      context.closePath();
      context.fillStrokeShape(this);
    }
    _getPoints() {
      const sides = this.attrs.sides;
      const radius = this.attrs.radius || 0;
      const points = [];
      for (let n5 = 0; n5 < sides; n5++) {
        points.push({
          x: radius * Math.sin(n5 * 2 * Math.PI / sides),
          y: -1 * radius * Math.cos(n5 * 2 * Math.PI / sides)
        });
      }
      return points;
    }
    getSelfRect() {
      const points = this._getPoints();
      let minX = points[0].x;
      let maxX = points[0].x;
      let minY = points[0].y;
      let maxY = points[0].y;
      points.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    getWidth() {
      return this.radius() * 2;
    }
    getHeight() {
      return this.radius() * 2;
    }
    setWidth(width) {
      this.radius(width / 2);
    }
    setHeight(height) {
      this.radius(height / 2);
    }
  };
  RegularPolygon.prototype.className = "RegularPolygon";
  RegularPolygon.prototype._centroid = true;
  RegularPolygon.prototype._attrsAffectingSize = ["radius"];
  _registerNode(RegularPolygon);
  Factory.addGetterSetter(RegularPolygon, "radius", 0, getNumberValidator());
  Factory.addGetterSetter(RegularPolygon, "sides", 0, getNumberValidator());
  Factory.addGetterSetter(RegularPolygon, "cornerRadius", 0, getNumberOrArrayOfNumbersValidator(4));

  // node_modules/konva/lib/shapes/Ring.js
  var PIx2 = Math.PI * 2;
  var Ring = class extends Shape {
    _sceneFunc(context) {
      context.beginPath();
      context.arc(0, 0, this.innerRadius(), 0, PIx2, false);
      context.moveTo(this.outerRadius(), 0);
      context.arc(0, 0, this.outerRadius(), PIx2, 0, true);
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      return this.outerRadius() * 2;
    }
    getHeight() {
      return this.outerRadius() * 2;
    }
    setWidth(width) {
      this.outerRadius(width / 2);
    }
    setHeight(height) {
      this.outerRadius(height / 2);
    }
  };
  Ring.prototype.className = "Ring";
  Ring.prototype._centroid = true;
  Ring.prototype._attrsAffectingSize = ["innerRadius", "outerRadius"];
  _registerNode(Ring);
  Factory.addGetterSetter(Ring, "innerRadius", 0, getNumberValidator());
  Factory.addGetterSetter(Ring, "outerRadius", 0, getNumberValidator());

  // node_modules/konva/lib/shapes/Sprite.js
  var Sprite = class extends Shape {
    constructor(config) {
      super(config);
      this._updated = true;
      this.anim = new Animation(() => {
        const updated = this._updated;
        this._updated = false;
        return updated;
      });
      this.on("animationChange.konva", function() {
        this.frameIndex(0);
      });
      this.on("frameIndexChange.konva", function() {
        this._updated = true;
      });
      this.on("frameRateChange.konva", function() {
        if (!this.anim.isRunning()) {
          return;
        }
        clearInterval(this.interval);
        this._setInterval();
      });
    }
    _sceneFunc(context) {
      const anim = this.animation(), index = this.frameIndex(), ix4 = index * 4, set = this.animations()[anim], offsets = this.frameOffsets(), x2 = set[ix4 + 0], y3 = set[ix4 + 1], width = set[ix4 + 2], height = set[ix4 + 3], image = this.image();
      if (this.hasFill() || this.hasStroke()) {
        context.beginPath();
        context.rect(0, 0, width, height);
        context.closePath();
        context.fillStrokeShape(this);
      }
      if (image) {
        if (offsets) {
          const offset = offsets[anim], ix2 = index * 2;
          context.drawImage(image, x2, y3, width, height, offset[ix2 + 0], offset[ix2 + 1], width, height);
        } else {
          context.drawImage(image, x2, y3, width, height, 0, 0, width, height);
        }
      }
    }
    _hitFunc(context) {
      const anim = this.animation(), index = this.frameIndex(), ix4 = index * 4, set = this.animations()[anim], offsets = this.frameOffsets(), width = set[ix4 + 2], height = set[ix4 + 3];
      context.beginPath();
      if (offsets) {
        const offset = offsets[anim];
        const ix2 = index * 2;
        context.rect(offset[ix2 + 0], offset[ix2 + 1], width, height);
      } else {
        context.rect(0, 0, width, height);
      }
      context.closePath();
      context.fillShape(this);
    }
    _useBufferCanvas() {
      return super._useBufferCanvas(true);
    }
    _setInterval() {
      const that = this;
      this.interval = setInterval(function() {
        that._updateIndex();
      }, 1e3 / this.frameRate());
    }
    start() {
      if (this.isRunning()) {
        return;
      }
      const layer = this.getLayer();
      this.anim.setLayers(layer);
      this._setInterval();
      this.anim.start();
    }
    stop() {
      this.anim.stop();
      clearInterval(this.interval);
    }
    isRunning() {
      return this.anim.isRunning();
    }
    _updateIndex() {
      const index = this.frameIndex(), animation = this.animation(), animations = this.animations(), anim = animations[animation], len = anim.length / 4;
      if (index < len - 1) {
        this.frameIndex(index + 1);
      } else {
        this.frameIndex(0);
      }
    }
  };
  Sprite.prototype.className = "Sprite";
  _registerNode(Sprite);
  Factory.addGetterSetter(Sprite, "animation");
  Factory.addGetterSetter(Sprite, "animations");
  Factory.addGetterSetter(Sprite, "frameOffsets");
  Factory.addGetterSetter(Sprite, "image");
  Factory.addGetterSetter(Sprite, "frameIndex", 0, getNumberValidator());
  Factory.addGetterSetter(Sprite, "frameRate", 17, getNumberValidator());
  Factory.backCompat(Sprite, {
    index: "frameIndex",
    getIndex: "getFrameIndex",
    setIndex: "setFrameIndex"
  });

  // node_modules/konva/lib/shapes/Star.js
  var Star = class extends Shape {
    _sceneFunc(context) {
      const innerRadius = this.innerRadius(), outerRadius = this.outerRadius(), numPoints = this.numPoints();
      context.beginPath();
      context.moveTo(0, 0 - outerRadius);
      for (let n5 = 1; n5 < numPoints * 2; n5++) {
        const radius = n5 % 2 === 0 ? outerRadius : innerRadius;
        const x2 = radius * Math.sin(n5 * Math.PI / numPoints);
        const y3 = -1 * radius * Math.cos(n5 * Math.PI / numPoints);
        context.lineTo(x2, y3);
      }
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      return this.outerRadius() * 2;
    }
    getHeight() {
      return this.outerRadius() * 2;
    }
    setWidth(width) {
      this.outerRadius(width / 2);
    }
    setHeight(height) {
      this.outerRadius(height / 2);
    }
  };
  Star.prototype.className = "Star";
  Star.prototype._centroid = true;
  Star.prototype._attrsAffectingSize = ["innerRadius", "outerRadius"];
  _registerNode(Star);
  Factory.addGetterSetter(Star, "numPoints", 5, getNumberValidator());
  Factory.addGetterSetter(Star, "innerRadius", 0, getNumberValidator());
  Factory.addGetterSetter(Star, "outerRadius", 0, getNumberValidator());

  // node_modules/konva/lib/shapes/Text.js
  function stringToArray(string) {
    return [...string].reduce((acc, char, index, array) => {
      if (/\p{Emoji}/u.test(char)) {
        const nextChar = array[index + 1];
        if (nextChar && /\p{Emoji_Modifier}|\u200D/u.test(nextChar)) {
          acc.push(char + nextChar);
          array[index + 1] = "";
        } else {
          acc.push(char);
        }
      } else if (/\p{Regional_Indicator}{2}/u.test(char + (array[index + 1] || ""))) {
        acc.push(char + array[index + 1]);
      } else if (index > 0 && /\p{Mn}|\p{Me}|\p{Mc}/u.test(char)) {
        acc[acc.length - 1] += char;
      } else if (char) {
        acc.push(char);
      }
      return acc;
    }, []);
  }
  var AUTO = "auto";
  var CENTER = "center";
  var INHERIT = "inherit";
  var JUSTIFY = "justify";
  var CHANGE_KONVA2 = "Change.konva";
  var CONTEXT_2D = "2d";
  var DASH = "-";
  var LEFT2 = "left";
  var TEXT = "text";
  var TEXT_UPPER = "Text";
  var TOP = "top";
  var BOTTOM = "bottom";
  var MIDDLE = "middle";
  var NORMAL = "normal";
  var PX_SPACE = "px ";
  var SPACE2 = " ";
  var RIGHT2 = "right";
  var RTL = "rtl";
  var WORD = "word";
  var CHAR = "char";
  var NONE2 = "none";
  var ELLIPSIS = "\u2026";
  var ATTR_CHANGE_LIST2 = [
    "direction",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontVariant",
    "padding",
    "align",
    "verticalAlign",
    "lineHeight",
    "text",
    "width",
    "height",
    "wrap",
    "ellipsis",
    "letterSpacing"
  ];
  var attrChangeListLen2 = ATTR_CHANGE_LIST2.length;
  var _shadowOpacityBuggy = null;
  function hasShadowOpacityBug() {
    if (_shadowOpacityBuggy !== null) {
      return _shadowOpacityBuggy;
    }
    _shadowOpacityBuggy = false;
    try {
      const c4 = document.createElement("canvas");
      c4.width = 10;
      c4.height = 10;
      const ctx = c4.getContext(CONTEXT_2D);
      if (ctx) {
        ctx.globalAlpha = 0;
        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = "black";
        ctx.font = "10px Arial";
        ctx.fillText("X", 0, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        for (let i3 = 3; i3 < data.length; i3 += 4) {
          if (data[i3] > 0) {
            _shadowOpacityBuggy = true;
            break;
          }
        }
      }
    } catch (e3) {
    }
    return _shadowOpacityBuggy;
  }
  function normalizeFontFamily(fontFamily) {
    return fontFamily.split(",").map((family) => {
      family = family.trim();
      const hasSpace = family.indexOf(" ") >= 0;
      const hasQuotes = family.indexOf('"') >= 0 || family.indexOf("'") >= 0;
      if (hasSpace && !hasQuotes) {
        family = `"${family}"`;
      }
      return family;
    }).join(", ");
  }
  var dummyContext2;
  function getDummyContext2() {
    if (dummyContext2) {
      return dummyContext2;
    }
    dummyContext2 = Util.createCanvasElement().getContext(CONTEXT_2D);
    return dummyContext2;
  }
  function _fillFunc2(context) {
    if (this._partialFillStyle) {
      context.setAttr("fillStyle", this._partialFillStyle);
    }
    context.fillText(this._partialText, this._partialTextX, this._partialTextY);
  }
  function _strokeFunc2(context) {
    context.setAttr("miterLimit", 2);
    if (this._partialStrokeStyle) {
      context.setAttr("strokeStyle", this._partialStrokeStyle);
    }
    context.strokeText(this._partialText, this._partialTextX, this._partialTextY);
  }
  function checkDefaultFill(config) {
    config = config || {};
    if (!config.fillLinearGradientColorStops && !config.fillRadialGradientColorStops && !config.fillPatternImage) {
      config.fill = config.fill || "black";
    }
    return config;
  }
  var Text = class extends Shape {
    constructor(config) {
      super(checkDefaultFill(config));
      this._partialTextX = 0;
      this._partialTextY = 0;
      for (let n5 = 0; n5 < attrChangeListLen2; n5++) {
        this.on(ATTR_CHANGE_LIST2[n5] + CHANGE_KONVA2, this._setTextData);
      }
      this._setTextData();
    }
    _sceneFunc(context) {
      var _a, _b;
      const textArr = this.textArr, textArrLen = textArr.length;
      if (!this.text()) {
        return;
      }
      let padding = this.padding(), fontSize = this.fontSize(), lineHeightPx = this.lineHeight() * fontSize, verticalAlign = this.verticalAlign(), direction = this.direction(), alignY = 0, align = this.align(), totalWidth = this.getWidth(), letterSpacing = this.letterSpacing(), charRenderFunc = this.charRenderFunc(), fill = this.fill(), textDecoration = this.textDecoration(), underlineOffset = this.underlineOffset(), shouldUnderline = textDecoration.indexOf("underline") !== -1, shouldLineThrough = textDecoration.indexOf("line-through") !== -1, n5;
      direction = direction === INHERIT ? context.direction : direction;
      let translateY = lineHeightPx / 2;
      let baseline2 = MIDDLE;
      if (!Konva.legacyTextRendering) {
        const metrics = this.measureSize("M");
        baseline2 = "alphabetic";
        const ascent = (_a = metrics.fontBoundingBoxAscent) !== null && _a !== void 0 ? _a : metrics.actualBoundingBoxAscent;
        const descent = (_b = metrics.fontBoundingBoxDescent) !== null && _b !== void 0 ? _b : metrics.actualBoundingBoxDescent;
        translateY = (ascent - descent) / 2 + lineHeightPx / 2;
      }
      if (direction === RTL) {
        context.setAttr("direction", direction);
      }
      context.setAttr("font", this._getContextFont());
      context.setAttr("textBaseline", baseline2);
      context.setAttr("textAlign", LEFT2);
      if (verticalAlign === MIDDLE) {
        alignY = (this.getHeight() - textArrLen * lineHeightPx - padding * 2) / 2;
      } else if (verticalAlign === BOTTOM) {
        alignY = this.getHeight() - textArrLen * lineHeightPx - padding * 2;
      }
      context.translate(padding, alignY + padding);
      const fillStyleBefore = charRenderFunc ? context.fillStyle : void 0;
      const strokeStyleBefore = charRenderFunc ? context.strokeStyle : void 0;
      for (n5 = 0; n5 < textArrLen; n5++) {
        let lineTranslateX = 0;
        let lineTranslateY = 0;
        const obj = textArr[n5], text = obj.text, width = obj.width, lastLine = obj.lastInParagraph;
        context.save();
        if (align === RIGHT2) {
          lineTranslateX += totalWidth - width - padding * 2;
        } else if (align === CENTER) {
          lineTranslateX += (totalWidth - width - padding * 2) / 2;
        }
        if (shouldUnderline) {
          context.save();
          context.beginPath();
          const yOffset = underlineOffset !== null && underlineOffset !== void 0 ? underlineOffset : !Konva.legacyTextRendering ? Math.round(fontSize / 4) : Math.round(fontSize / 2);
          const x2 = lineTranslateX;
          const y3 = translateY + lineTranslateY + yOffset;
          context.moveTo(x2, y3);
          const lineWidth = align === JUSTIFY && !lastLine ? totalWidth - padding * 2 : width;
          context.lineTo(x2 + Math.round(lineWidth), y3);
          context.lineWidth = fontSize / 15;
          const gradient = this._getLinearGradient();
          context.strokeStyle = gradient || fill;
          context.stroke();
          context.restore();
        }
        const lineThroughStartX = lineTranslateX;
        if (direction !== RTL && (letterSpacing !== 0 || align === JUSTIFY || charRenderFunc)) {
          const spacesNumber = text.split(" ").length - 1;
          const array = stringToArray(text);
          for (let li2 = 0; li2 < array.length; li2++) {
            const letter = array[li2];
            if (letter === " " && !lastLine && align === JUSTIFY) {
              lineTranslateX += (totalWidth - padding * 2 - width) / spacesNumber;
            }
            this._partialTextX = lineTranslateX;
            this._partialTextY = translateY + lineTranslateY;
            this._partialText = letter;
            if (charRenderFunc) {
              context.save();
              const previousLines = textArr.slice(0, n5);
              const previousGraphemes = previousLines.reduce((acc, line) => acc + stringToArray(line.text).length, 0);
              const charIndex = li2 + previousGraphemes;
              charRenderFunc({
                char: letter,
                index: charIndex,
                x: lineTranslateX,
                y: translateY + lineTranslateY,
                lineIndex: n5,
                column: li2,
                isLastInLine: lastLine,
                width: this.measureSize(letter).width,
                context
              });
              const fillStyleAfter = context.fillStyle;
              if (fillStyleAfter !== fillStyleBefore) {
                this._partialFillStyle = fillStyleAfter;
              }
              const strokeStyleAfter = context.strokeStyle;
              if (strokeStyleAfter !== strokeStyleBefore) {
                this._partialStrokeStyle = strokeStyleAfter;
              }
            }
            context.fillStrokeShape(this);
            if (charRenderFunc) {
              this._partialFillStyle = void 0;
              this._partialStrokeStyle = void 0;
              context.restore();
            }
            lineTranslateX += this.measureSize(letter).width + letterSpacing;
          }
        } else {
          if (letterSpacing !== 0) {
            context.setAttr("letterSpacing", `${letterSpacing}px`);
          }
          this._partialTextX = lineTranslateX;
          this._partialTextY = translateY + lineTranslateY;
          this._partialText = text;
          context.fillStrokeShape(this);
        }
        if (shouldLineThrough) {
          context.save();
          context.beginPath();
          const yOffset = !Konva.legacyTextRendering ? -Math.round(fontSize / 4) : 0;
          const x2 = lineThroughStartX;
          context.moveTo(x2, translateY + lineTranslateY + yOffset);
          const lineWidth = align === JUSTIFY && !lastLine ? totalWidth - padding * 2 : width;
          context.lineTo(x2 + Math.round(lineWidth), translateY + lineTranslateY + yOffset);
          context.lineWidth = fontSize / 15;
          const gradient = this._getLinearGradient();
          context.strokeStyle = gradient || fill;
          context.stroke();
          context.restore();
        }
        context.restore();
        if (textArrLen > 1) {
          translateY += lineHeightPx;
        }
      }
    }
    _hitFunc(context) {
      const width = this.getWidth(), height = this.getHeight();
      context.beginPath();
      context.rect(0, 0, width, height);
      context.closePath();
      context.fillStrokeShape(this);
    }
    setText(text) {
      const str2 = Util._isString(text) ? text : text === null || text === void 0 ? "" : text + "";
      this._setAttr(TEXT, str2);
      return this;
    }
    getWidth() {
      const isAuto = this.attrs.width === AUTO || this.attrs.width === void 0;
      return isAuto ? this.getTextWidth() + this.padding() * 2 : this.attrs.width;
    }
    getHeight() {
      const isAuto = this.attrs.height === AUTO || this.attrs.height === void 0;
      return isAuto ? this.fontSize() * this.textArr.length * this.lineHeight() + this.padding() * 2 : this.attrs.height;
    }
    getTextWidth() {
      return this.textWidth;
    }
    getTextHeight() {
      Util.warn("text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height.");
      return this.textHeight;
    }
    measureSize(text) {
      var _a, _b, _c, _d, _e2, _f, _g, _h, _j, _k, _l;
      let _context = getDummyContext2(), fontSize = this.fontSize(), metrics;
      _context.save();
      _context.font = this._getContextFont();
      metrics = _context.measureText(text);
      _context.restore();
      const scaleFactor = fontSize / 100;
      return {
        actualBoundingBoxAscent: (_a = metrics.actualBoundingBoxAscent) !== null && _a !== void 0 ? _a : 71.58203125 * scaleFactor,
        actualBoundingBoxDescent: (_b = metrics.actualBoundingBoxDescent) !== null && _b !== void 0 ? _b : 0,
        actualBoundingBoxLeft: (_c = metrics.actualBoundingBoxLeft) !== null && _c !== void 0 ? _c : -7.421875 * scaleFactor,
        actualBoundingBoxRight: (_d = metrics.actualBoundingBoxRight) !== null && _d !== void 0 ? _d : 75.732421875 * scaleFactor,
        alphabeticBaseline: (_e2 = metrics.alphabeticBaseline) !== null && _e2 !== void 0 ? _e2 : 0,
        emHeightAscent: (_f = metrics.emHeightAscent) !== null && _f !== void 0 ? _f : 100 * scaleFactor,
        emHeightDescent: (_g = metrics.emHeightDescent) !== null && _g !== void 0 ? _g : -20 * scaleFactor,
        fontBoundingBoxAscent: (_h = metrics.fontBoundingBoxAscent) !== null && _h !== void 0 ? _h : 91 * scaleFactor,
        fontBoundingBoxDescent: (_j = metrics.fontBoundingBoxDescent) !== null && _j !== void 0 ? _j : 21 * scaleFactor,
        hangingBaseline: (_k = metrics.hangingBaseline) !== null && _k !== void 0 ? _k : 72.80000305175781 * scaleFactor,
        ideographicBaseline: (_l = metrics.ideographicBaseline) !== null && _l !== void 0 ? _l : -21 * scaleFactor,
        width: metrics.width,
        height: fontSize
      };
    }
    _getContextFont() {
      return this.fontStyle() + SPACE2 + this.fontVariant() + SPACE2 + (this.fontSize() + PX_SPACE) + normalizeFontFamily(this.fontFamily());
    }
    _addTextLine(line) {
      const align = this.align();
      if (align === JUSTIFY) {
        line = line.trim();
      }
      const width = this._getTextWidth(line);
      return this.textArr.push({
        text: line,
        width,
        lastInParagraph: false
      });
    }
    _getTextWidth(text) {
      const letterSpacing = this.letterSpacing();
      const length = text.length;
      return getDummyContext2().measureText(text).width + letterSpacing * length;
    }
    _setTextData() {
      let lines = this.text().split("\n"), fontSize = +this.fontSize(), textWidth = 0, lineHeightPx = this.lineHeight() * fontSize, width = this.attrs.width, height = this.attrs.height, fixedWidth = width !== AUTO && width !== void 0, fixedHeight = height !== AUTO && height !== void 0, padding = this.padding(), maxWidth = width - padding * 2, maxHeightPx = height - padding * 2, currentHeightPx = 0, wrap = this.wrap(), shouldWrap = wrap !== NONE2, wrapAtWord = wrap !== CHAR && shouldWrap, shouldAddEllipsis = this.ellipsis();
      this.textArr = [];
      getDummyContext2().font = this._getContextFont();
      const additionalWidth = shouldAddEllipsis ? this._getTextWidth(ELLIPSIS) : 0;
      for (let i3 = 0, max = lines.length; i3 < max; ++i3) {
        let line = lines[i3];
        let lineWidth = this._getTextWidth(line);
        if (fixedWidth && lineWidth > maxWidth) {
          while (line.length > 0) {
            const lineArray = stringToArray(line);
            let low = 0, high = lineArray.length, match = "", matchWidth = 0;
            while (low < high) {
              const mid = low + high >>> 1, substr = lineArray.slice(0, mid + 1).join(""), substrWidth = this._getTextWidth(substr);
              const shouldConsiderEllipsis = shouldAddEllipsis && fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx;
              const effectiveWidth = shouldConsiderEllipsis ? substrWidth + additionalWidth : substrWidth;
              if (effectiveWidth <= maxWidth) {
                low = mid + 1;
                match = substr;
                matchWidth = substrWidth;
              } else {
                high = mid;
              }
            }
            if (match) {
              if (wrapAtWord) {
                const matchArray = stringToArray(match);
                const nextChar = lineArray[matchArray.length];
                const nextIsSpaceOrDash = nextChar === SPACE2 || nextChar === DASH;
                let wrapIndex;
                if (nextIsSpaceOrDash && matchWidth <= maxWidth) {
                  wrapIndex = matchArray.length;
                } else {
                  const lastSpaceIndex = matchArray.lastIndexOf(SPACE2);
                  const lastDashIndex = matchArray.lastIndexOf(DASH);
                  wrapIndex = Math.max(lastSpaceIndex, lastDashIndex) + 1;
                }
                if (wrapIndex > 0) {
                  low = wrapIndex;
                  match = lineArray.slice(0, low).join("");
                  matchWidth = this._getTextWidth(match);
                }
              }
              match = match.trimRight();
              this._addTextLine(match);
              textWidth = Math.max(textWidth, matchWidth);
              currentHeightPx += lineHeightPx;
              const shouldHandleEllipsis = this._shouldHandleEllipsis(currentHeightPx);
              if (shouldHandleEllipsis) {
                this._tryToAddEllipsisToLastLine();
                break;
              }
              line = lineArray.slice(low).join("").trimLeft();
              if (line.length > 0) {
                lineWidth = this._getTextWidth(line);
                if (lineWidth <= maxWidth) {
                  this._addTextLine(line);
                  currentHeightPx += lineHeightPx;
                  textWidth = Math.max(textWidth, lineWidth);
                  break;
                }
              }
            } else {
              break;
            }
          }
        } else {
          this._addTextLine(line);
          currentHeightPx += lineHeightPx;
          textWidth = Math.max(textWidth, lineWidth);
          if (this._shouldHandleEllipsis(currentHeightPx) && i3 < max - 1) {
            this._tryToAddEllipsisToLastLine();
          }
        }
        if (this.textArr[this.textArr.length - 1]) {
          this.textArr[this.textArr.length - 1].lastInParagraph = true;
        }
        if (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
          break;
        }
      }
      this.textHeight = fontSize;
      this.textWidth = textWidth;
    }
    _shouldHandleEllipsis(currentHeightPx) {
      const fontSize = +this.fontSize(), lineHeightPx = this.lineHeight() * fontSize, height = this.attrs.height, fixedHeight = height !== AUTO && height !== void 0, padding = this.padding(), maxHeightPx = height - padding * 2, wrap = this.wrap(), shouldWrap = wrap !== NONE2;
      return !shouldWrap || fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx;
    }
    _tryToAddEllipsisToLastLine() {
      const width = this.attrs.width, fixedWidth = width !== AUTO && width !== void 0, padding = this.padding(), maxWidth = width - padding * 2, shouldAddEllipsis = this.ellipsis();
      const lastLine = this.textArr[this.textArr.length - 1];
      if (!lastLine || !shouldAddEllipsis) {
        return;
      }
      if (fixedWidth) {
        const haveSpace = this._getTextWidth(lastLine.text + ELLIPSIS) < maxWidth;
        if (!haveSpace) {
          lastLine.text = lastLine.text.slice(0, lastLine.text.length - 3);
        }
      }
      this.textArr.splice(this.textArr.length - 1, 1);
      this._addTextLine(lastLine.text + ELLIPSIS);
    }
    getStrokeScaleEnabled() {
      return true;
    }
    _useBufferCanvas() {
      const hasLine = this.textDecoration().indexOf("underline") !== -1 || this.textDecoration().indexOf("line-through") !== -1;
      const hasShadow = this.hasShadow();
      if (hasLine && hasShadow) {
        return true;
      }
      if (hasShadow && this.getAbsoluteOpacity() !== 1 && hasShadowOpacityBug()) {
        return true;
      }
      return super._useBufferCanvas();
    }
  };
  Text.prototype._fillFunc = _fillFunc2;
  Text.prototype._strokeFunc = _strokeFunc2;
  Text.prototype.className = TEXT_UPPER;
  Text.prototype._attrsAffectingSize = [
    "text",
    "fontSize",
    "padding",
    "wrap",
    "lineHeight",
    "letterSpacing"
  ];
  _registerNode(Text);
  Factory.overWriteSetter(Text, "width", getNumberOrAutoValidator());
  Factory.overWriteSetter(Text, "height", getNumberOrAutoValidator());
  Factory.addGetterSetter(Text, "direction", INHERIT);
  Factory.addGetterSetter(Text, "fontFamily", "Arial");
  Factory.addGetterSetter(Text, "fontSize", 12, getNumberValidator());
  Factory.addGetterSetter(Text, "fontStyle", NORMAL);
  Factory.addGetterSetter(Text, "fontVariant", NORMAL);
  Factory.addGetterSetter(Text, "padding", 0, getNumberValidator());
  Factory.addGetterSetter(Text, "align", LEFT2);
  Factory.addGetterSetter(Text, "verticalAlign", TOP);
  Factory.addGetterSetter(Text, "lineHeight", 1, getNumberValidator());
  Factory.addGetterSetter(Text, "wrap", WORD);
  Factory.addGetterSetter(Text, "ellipsis", false, getBooleanValidator());
  Factory.addGetterSetter(Text, "letterSpacing", 0, getNumberValidator());
  Factory.addGetterSetter(Text, "text", "", getStringValidator());
  Factory.addGetterSetter(Text, "textDecoration", "");
  Factory.addGetterSetter(Text, "underlineOffset", void 0, getNumberValidator());
  Factory.addGetterSetter(Text, "charRenderFunc", void 0);

  // node_modules/konva/lib/shapes/TextPath.js
  var EMPTY_STRING2 = "";
  var NORMAL2 = "normal";
  function _fillFunc3(context) {
    context.fillText(this.partialText, 0, 0);
  }
  function _strokeFunc3(context) {
    context.strokeText(this.partialText, 0, 0);
  }
  var TextPath = class extends Shape {
    constructor(config) {
      super(config);
      this.dummyCanvas = Util.createCanvasElement();
      this.dataArray = [];
      this._readDataAttribute();
      this.on("dataChange.konva", function() {
        this._readDataAttribute();
        this._setTextData();
      });
      this.on("textChange.konva alignChange.konva letterSpacingChange.konva kerningFuncChange.konva fontSizeChange.konva fontFamilyChange.konva directionChange.konva", this._setTextData);
      this._setTextData();
    }
    _getTextPathLength() {
      return Path.getPathLength(this.dataArray);
    }
    _getPointAtLength(length) {
      if (!this.attrs.data) {
        return null;
      }
      const totalLength = this.pathLength;
      if (length > totalLength) {
        return null;
      }
      return Path.getPointAtLengthOfDataArray(length, this.dataArray);
    }
    _readDataAttribute() {
      this.dataArray = Path.parsePathData(this.attrs.data);
      this.pathLength = this._getTextPathLength();
    }
    _sceneFunc(context) {
      context.setAttr("font", this._getContextFont());
      context.setAttr("textBaseline", this.textBaseline());
      context.setAttr("textAlign", "left");
      context.save();
      const textDecoration = this.textDecoration();
      const fill = this.fill();
      const fontSize = this.fontSize();
      const glyphInfo = this.glyphInfo;
      const hasUnderline = textDecoration.indexOf("underline") !== -1;
      const hasLineThrough = textDecoration.indexOf("line-through") !== -1;
      if (hasUnderline) {
        context.beginPath();
      }
      for (let i3 = 0; i3 < glyphInfo.length; i3++) {
        context.save();
        const p0 = glyphInfo[i3].p0;
        context.translate(p0.x, p0.y);
        context.rotate(glyphInfo[i3].rotation);
        this.partialText = glyphInfo[i3].text;
        context.fillStrokeShape(this);
        if (hasUnderline) {
          if (i3 === 0) {
            context.moveTo(0, fontSize / 2 + 1);
          }
          context.lineTo(glyphInfo[i3].width, fontSize / 2 + 1);
        }
        context.restore();
      }
      if (hasUnderline) {
        context.strokeStyle = fill;
        context.lineWidth = fontSize / 20;
        context.stroke();
      }
      if (hasLineThrough) {
        context.beginPath();
        for (let i3 = 0; i3 < glyphInfo.length; i3++) {
          context.save();
          const p0 = glyphInfo[i3].p0;
          context.translate(p0.x, p0.y);
          context.rotate(glyphInfo[i3].rotation);
          if (i3 === 0) {
            context.moveTo(0, 0);
          }
          context.lineTo(glyphInfo[i3].width, 0);
          context.restore();
        }
        context.strokeStyle = fill;
        context.lineWidth = fontSize / 20;
        context.stroke();
      }
      context.restore();
    }
    _hitFunc(context) {
      context.beginPath();
      const glyphInfo = this.glyphInfo;
      if (glyphInfo.length >= 1) {
        const p0 = glyphInfo[0].p0;
        context.moveTo(p0.x, p0.y);
      }
      for (let i3 = 0; i3 < glyphInfo.length; i3++) {
        const p1 = glyphInfo[i3].p1;
        context.lineTo(p1.x, p1.y);
      }
      context.setAttr("lineWidth", this.fontSize());
      context.setAttr("strokeStyle", this.colorKey);
      context.stroke();
    }
    getTextWidth() {
      return this.textWidth;
    }
    getTextHeight() {
      Util.warn("text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height.");
      return this.textHeight;
    }
    setText(text) {
      return Text.prototype.setText.call(this, text);
    }
    _getContextFont() {
      return Text.prototype._getContextFont.call(this);
    }
    _getTextSize(text) {
      const dummyCanvas = this.dummyCanvas;
      const _context = dummyCanvas.getContext("2d");
      _context.save();
      _context.font = this._getContextFont();
      const metrics = _context.measureText(text);
      _context.restore();
      return {
        width: metrics.width,
        height: parseInt(`${this.fontSize()}`, 10)
      };
    }
    _setTextData() {
      const charArr = stringToArray(this.text());
      if (this.direction() === "rtl") {
        charArr.reverse();
      }
      const chars = [];
      let width = 0;
      for (let i3 = 0; i3 < charArr.length; i3++) {
        chars.push({
          char: charArr[i3],
          width: this._getTextSize(charArr[i3]).width
        });
        width += chars[i3].width;
      }
      const { width: fullTextWidth, height } = this._getTextSize(this.attrs.text);
      this.textWidth = width;
      this.textHeight = height;
      this.glyphInfo = [];
      if (!this.attrs.data) {
        return null;
      }
      const letterSpacing = this.letterSpacing();
      const align = this.align();
      const kerningFunc = this.kerningFunc();
      const kerningAdjustment = Math.max(0, width - fullTextWidth);
      const textWidth = Math.max(this.textWidth + ((this.attrs.text || "").length - 1) * letterSpacing, 0);
      let offset = 0;
      if (align === "center") {
        offset = Math.max(0, this.pathLength / 2 - textWidth / 2);
      }
      if (align === "right") {
        offset = Math.max(0, this.pathLength - textWidth);
      }
      let offsetToGlyph = offset;
      for (let i3 = 0; i3 < chars.length; i3++) {
        const charStartPoint = this._getPointAtLength(offsetToGlyph);
        if (!charStartPoint)
          return;
        const char = chars[i3].char;
        let glyphWidth = chars[i3].width + letterSpacing;
        if (char === " " && align === "justify") {
          const numberOfSpaces = this.text().split(" ").length - 1;
          glyphWidth += (this.pathLength - textWidth) / numberOfSpaces;
        }
        const charEndLength = offsetToGlyph + glyphWidth;
        const charEndPoint = this._getPointAtLength(charEndLength > this.pathLength && charEndLength - this.pathLength <= kerningAdjustment ? this.pathLength : charEndLength);
        if (!charEndPoint) {
          return;
        }
        const width2 = Path.getLineLength(charStartPoint.x, charStartPoint.y, charEndPoint.x, charEndPoint.y);
        let kern = 0;
        if (kerningFunc) {
          try {
            kern = kerningFunc(chars[i3 - 1].char, char) * this.fontSize();
          } catch (e3) {
            kern = 0;
          }
        }
        charStartPoint.x += kern;
        charEndPoint.x += kern;
        this.textWidth += kern;
        const midpoint = Path.getPointOnLine(kern + width2 / 2, charStartPoint.x, charStartPoint.y, charEndPoint.x, charEndPoint.y);
        const rotation = Math.atan2(charEndPoint.y - charStartPoint.y, charEndPoint.x - charStartPoint.x);
        this.glyphInfo.push({
          transposeX: midpoint.x,
          transposeY: midpoint.y,
          text: charArr[i3],
          rotation,
          p0: charStartPoint,
          p1: charEndPoint,
          width: width2
        });
        offsetToGlyph += glyphWidth;
      }
    }
    getSelfRect() {
      if (!this.glyphInfo.length) {
        return {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      }
      const points = [];
      this.glyphInfo.forEach(function(info) {
        points.push(info.p0.x);
        points.push(info.p0.y);
        points.push(info.p1.x);
        points.push(info.p1.y);
      });
      let minX = points[0] || 0;
      let maxX = points[0] || 0;
      let minY = points[1] || 0;
      let maxY = points[1] || 0;
      let x2, y3;
      for (let i3 = 0; i3 < points.length / 2; i3++) {
        x2 = points[i3 * 2];
        y3 = points[i3 * 2 + 1];
        minX = Math.min(minX, x2);
        maxX = Math.max(maxX, x2);
        minY = Math.min(minY, y3);
        maxY = Math.max(maxY, y3);
      }
      const fontSize = this.fontSize();
      return {
        x: minX - fontSize / 2,
        y: minY - fontSize / 2,
        width: maxX - minX + fontSize,
        height: maxY - minY + fontSize
      };
    }
    destroy() {
      Util.releaseCanvas(this.dummyCanvas);
      return super.destroy();
    }
  };
  TextPath.prototype._fillFunc = _fillFunc3;
  TextPath.prototype._strokeFunc = _strokeFunc3;
  TextPath.prototype._fillFuncHit = _fillFunc3;
  TextPath.prototype._strokeFuncHit = _strokeFunc3;
  TextPath.prototype.className = "TextPath";
  TextPath.prototype._attrsAffectingSize = ["text", "fontSize", "data"];
  _registerNode(TextPath);
  Factory.addGetterSetter(TextPath, "data");
  Factory.addGetterSetter(TextPath, "fontFamily", "Arial");
  Factory.addGetterSetter(TextPath, "fontSize", 12, getNumberValidator());
  Factory.addGetterSetter(TextPath, "fontStyle", NORMAL2);
  Factory.addGetterSetter(TextPath, "align", "left");
  Factory.addGetterSetter(TextPath, "letterSpacing", 0, getNumberValidator());
  Factory.addGetterSetter(TextPath, "textBaseline", "middle");
  Factory.addGetterSetter(TextPath, "fontVariant", NORMAL2);
  Factory.addGetterSetter(TextPath, "text", EMPTY_STRING2);
  Factory.addGetterSetter(TextPath, "textDecoration", "");
  Factory.addGetterSetter(TextPath, "kerningFunc", void 0);
  Factory.addGetterSetter(TextPath, "direction", "inherit");

  // node_modules/konva/lib/shapes/Transformer.js
  var EVENTS_NAME = "tr-konva";
  var ATTR_CHANGE_LIST3 = [
    "resizeEnabledChange",
    "rotateAnchorOffsetChange",
    "rotateAnchorAngleChange",
    "rotateEnabledChange",
    "enabledAnchorsChange",
    "anchorSizeChange",
    "borderEnabledChange",
    "borderStrokeChange",
    "borderStrokeWidthChange",
    "borderDashChange",
    "anchorStrokeChange",
    "anchorStrokeWidthChange",
    "anchorFillChange",
    "anchorCornerRadiusChange",
    "ignoreStrokeChange",
    "anchorStyleFuncChange"
  ].map((e3) => e3 + `.${EVENTS_NAME}`).join(" ");
  var NODES_RECT = "nodesRect";
  var TRANSFORM_CHANGE_STR2 = [
    "widthChange",
    "heightChange",
    "scaleXChange",
    "scaleYChange",
    "skewXChange",
    "skewYChange",
    "rotationChange",
    "offsetXChange",
    "offsetYChange",
    "transformsEnabledChange",
    "strokeWidthChange",
    "draggableChange"
  ];
  var ANGLES = {
    "top-left": -45,
    "top-center": 0,
    "top-right": 45,
    "middle-right": -90,
    "middle-left": 90,
    "bottom-left": -135,
    "bottom-center": 180,
    "bottom-right": 135
  };
  var TOUCH_DEVICE = "ontouchstart" in Konva._global;
  function getCursor(anchorName, rad, rotateCursor) {
    if (anchorName === "rotater") {
      return rotateCursor;
    }
    rad += Util.degToRad(ANGLES[anchorName] || 0);
    const angle = (Util.radToDeg(rad) % 360 + 360) % 360;
    if (Util._inRange(angle, 315 + 22.5, 360) || Util._inRange(angle, 0, 22.5)) {
      return "ns-resize";
    } else if (Util._inRange(angle, 45 - 22.5, 45 + 22.5)) {
      return "nesw-resize";
    } else if (Util._inRange(angle, 90 - 22.5, 90 + 22.5)) {
      return "ew-resize";
    } else if (Util._inRange(angle, 135 - 22.5, 135 + 22.5)) {
      return "nwse-resize";
    } else if (Util._inRange(angle, 180 - 22.5, 180 + 22.5)) {
      return "ns-resize";
    } else if (Util._inRange(angle, 225 - 22.5, 225 + 22.5)) {
      return "nesw-resize";
    } else if (Util._inRange(angle, 270 - 22.5, 270 + 22.5)) {
      return "ew-resize";
    } else if (Util._inRange(angle, 315 - 22.5, 315 + 22.5)) {
      return "nwse-resize";
    } else {
      Util.error("Transformer has unknown angle for cursor detection: " + angle);
      return "pointer";
    }
  }
  var ANCHORS_NAMES = [
    "top-left",
    "top-center",
    "top-right",
    "middle-right",
    "middle-left",
    "bottom-left",
    "bottom-center",
    "bottom-right"
  ];
  var MAX_SAFE_INTEGER = 1e8;
  function getCenter(shape) {
    return {
      x: shape.x + shape.width / 2 * Math.cos(shape.rotation) + shape.height / 2 * Math.sin(-shape.rotation),
      y: shape.y + shape.height / 2 * Math.cos(shape.rotation) + shape.width / 2 * Math.sin(shape.rotation)
    };
  }
  function rotateAroundPoint(shape, angleRad, point) {
    const x2 = point.x + (shape.x - point.x) * Math.cos(angleRad) - (shape.y - point.y) * Math.sin(angleRad);
    const y3 = point.y + (shape.x - point.x) * Math.sin(angleRad) + (shape.y - point.y) * Math.cos(angleRad);
    return {
      ...shape,
      rotation: shape.rotation + angleRad,
      x: x2,
      y: y3
    };
  }
  function rotateAroundCenter(shape, deltaRad) {
    const center = getCenter(shape);
    return rotateAroundPoint(shape, deltaRad, center);
  }
  function getSnap(snaps, newRotationRad, tol) {
    let snapped = newRotationRad;
    for (let i3 = 0; i3 < snaps.length; i3++) {
      const angle = Konva.getAngle(snaps[i3]);
      const absDiff = Math.abs(angle - newRotationRad) % (Math.PI * 2);
      const dif = Math.min(absDiff, Math.PI * 2 - absDiff);
      if (dif < tol) {
        snapped = angle;
      }
    }
    return snapped;
  }
  var activeTransformersCount = 0;
  var Transformer = class extends Group {
    constructor(config) {
      super(config);
      this._movingAnchorName = null;
      this._transforming = false;
      this._transformWindow = null;
      this._elementsCreated = false;
      this._updateScheduled = false;
      this._createElements();
      this._handleMouseMove = this._handleMouseMove.bind(this);
      this._handleMouseUp = this._handleMouseUp.bind(this);
      this.update = this.update.bind(this);
      this.on(ATTR_CHANGE_LIST3, this.update);
      if (this.getNode()) {
        this.update();
      }
    }
    attachTo(node) {
      this.setNode(node);
      return this;
    }
    setNode(node) {
      Util.warn("tr.setNode(shape), tr.node(shape) and tr.attachTo(shape) methods are deprecated. Please use tr.nodes(nodesArray) instead.");
      return this.setNodes([node]);
    }
    getNode() {
      return this._nodes && this._nodes[0];
    }
    _getEventNamespace() {
      return EVENTS_NAME + this._id;
    }
    setNodes(nodes = []) {
      if (this._nodes && this._nodes.length) {
        this.detach();
      }
      const filteredNodes = nodes.filter((node) => {
        if (node.isAncestorOf(this)) {
          Util.error("Konva.Transformer cannot be an a child of the node you are trying to attach");
          return false;
        }
        return true;
      });
      this._nodes = nodes = filteredNodes;
      if (nodes.length === 1 && this.useSingleNodeRotation()) {
        this.rotation(nodes[0].getAbsoluteRotation());
      } else {
        this.rotation(0);
      }
      this._nodes.forEach((node) => {
        const onChange = () => {
          if (this._transforming)
            return;
          if (this.nodes().length === 1 && this.useSingleNodeRotation()) {
            this.rotation(this.nodes()[0].getAbsoluteRotation());
          }
          this._resetTransformCache();
          if (!this.isDragging()) {
            this._scheduleUpdate();
          }
        };
        if (node._attrsAffectingSize.length) {
          const additionalEvents = node._attrsAffectingSize.map((prop) => prop + "Change." + this._getEventNamespace()).join(" ");
          node.on(additionalEvents, onChange);
        }
        node.on(TRANSFORM_CHANGE_STR2.map((e3) => e3 + `.${this._getEventNamespace()}`).join(" "), onChange);
        node.on(`absoluteTransformChange.${this._getEventNamespace()}`, onChange);
        this._proxyDrag(node);
      });
      this._resetTransformCache();
      const elementsCreated = !!this.findOne(".top-left");
      if (elementsCreated) {
        this.update();
      }
      return this;
    }
    _proxyDrag(node) {
      let lastPos;
      node.on(`dragstart.${this._getEventNamespace()}`, (e3) => {
        lastPos = node.getAbsolutePosition();
        if (!this.isDragging() && node !== this.findOne(".back")) {
          this.startDrag(e3, false);
        }
      });
      node.on(`dragmove.${this._getEventNamespace()}`, (e3) => {
        if (!lastPos) {
          return;
        }
        const abs = node.getAbsolutePosition();
        const dx = abs.x - lastPos.x;
        const dy = abs.y - lastPos.y;
        this.nodes().forEach((otherNode) => {
          if (otherNode === node) {
            return;
          }
          if (otherNode.isDragging()) {
            return;
          }
          const otherAbs = otherNode.getAbsolutePosition();
          otherNode.setAbsolutePosition({
            x: otherAbs.x + dx,
            y: otherAbs.y + dy
          });
          otherNode.startDrag(e3);
        });
        lastPos = null;
      });
    }
    getNodes() {
      return this._nodes || [];
    }
    getActiveAnchor() {
      return this._movingAnchorName;
    }
    detach() {
      if (this._nodes) {
        this._nodes.forEach((node) => {
          node.off("." + this._getEventNamespace());
        });
      }
      this._nodes = [];
      this._resetTransformCache();
    }
    _resetTransformCache() {
      this._clearCache(NODES_RECT);
      this._clearCache("transform");
      this._clearSelfAndDescendantCache("absoluteTransform");
    }
    _getNodeRect() {
      return this._getCache(NODES_RECT, this.__getNodeRect);
    }
    __getNodeShape(node, rot = this.rotation(), relative) {
      const rect = node.getClientRect({
        skipTransform: true,
        skipShadow: true,
        skipStroke: this.ignoreStroke()
      });
      const absScale = node.getAbsoluteScale(relative);
      const absPos = node.getAbsolutePosition(relative);
      const dx = rect.x * absScale.x - node.offsetX() * absScale.x;
      const dy = rect.y * absScale.y - node.offsetY() * absScale.y;
      const rotation = (Konva.getAngle(node.getAbsoluteRotation()) + Math.PI * 2) % (Math.PI * 2);
      const box = {
        x: absPos.x + dx * Math.cos(rotation) + dy * Math.sin(-rotation),
        y: absPos.y + dy * Math.cos(rotation) + dx * Math.sin(rotation),
        width: rect.width * absScale.x,
        height: rect.height * absScale.y,
        rotation
      };
      return rotateAroundPoint(box, -Konva.getAngle(rot), {
        x: 0,
        y: 0
      });
    }
    __getNodeRect() {
      const node = this.getNode();
      if (!node) {
        return {
          x: -MAX_SAFE_INTEGER,
          y: -MAX_SAFE_INTEGER,
          width: 0,
          height: 0,
          rotation: 0
        };
      }
      const totalPoints = [];
      this.nodes().map((node2) => {
        const box = node2.getClientRect({
          skipTransform: true,
          skipShadow: true,
          skipStroke: this.ignoreStroke()
        });
        const points = [
          { x: box.x, y: box.y },
          { x: box.x + box.width, y: box.y },
          { x: box.x + box.width, y: box.y + box.height },
          { x: box.x, y: box.y + box.height }
        ];
        const trans = node2.getAbsoluteTransform();
        points.forEach(function(point) {
          const transformed = trans.point(point);
          totalPoints.push(transformed);
        });
      });
      const tr = new Transform();
      tr.rotate(-Konva.getAngle(this.rotation()));
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      totalPoints.forEach(function(point) {
        const transformed = tr.point(point);
        if (minX === void 0) {
          minX = maxX = transformed.x;
          minY = maxY = transformed.y;
        }
        minX = Math.min(minX, transformed.x);
        minY = Math.min(minY, transformed.y);
        maxX = Math.max(maxX, transformed.x);
        maxY = Math.max(maxY, transformed.y);
      });
      tr.invert();
      const p3 = tr.point({ x: minX, y: minY });
      return {
        x: p3.x,
        y: p3.y,
        width: maxX - minX,
        height: maxY - minY,
        rotation: Konva.getAngle(this.rotation())
      };
    }
    getX() {
      return this._getNodeRect().x;
    }
    getY() {
      return this._getNodeRect().y;
    }
    getWidth() {
      return this._getNodeRect().width;
    }
    getHeight() {
      return this._getNodeRect().height;
    }
    _createElements() {
      this._createBack();
      ANCHORS_NAMES.forEach((name) => {
        this._createAnchor(name);
      });
      this._createAnchor("rotater");
      this._elementsCreated = true;
    }
    _createAnchor(name) {
      const anchor = new Rect({
        stroke: "rgb(0, 161, 255)",
        fill: "white",
        strokeWidth: 1,
        name: name + " _anchor",
        dragDistance: 0,
        draggable: true,
        hitStrokeWidth: TOUCH_DEVICE ? 10 : "auto"
      });
      const self2 = this;
      anchor.on("mousedown touchstart", function(e3) {
        self2._handleMouseDown(e3);
      });
      anchor.on("dragstart", (e3) => {
        anchor.stopDrag();
        e3.cancelBubble = true;
      });
      anchor.on("dragend", (e3) => {
        e3.cancelBubble = true;
      });
      anchor.on("mouseenter", () => {
        const rad = Konva.getAngle(this.rotation());
        const rotateCursor = this.rotateAnchorCursor();
        const cursor = getCursor(name, rad, rotateCursor);
        anchor.getStage().content && (anchor.getStage().content.style.cursor = cursor);
        this._cursorChange = true;
      });
      anchor.on("mouseout", () => {
        anchor.getStage().content && (anchor.getStage().content.style.cursor = "");
        this._cursorChange = false;
      });
      this.add(anchor);
    }
    _createBack() {
      const back = new Shape({
        name: "back",
        width: 0,
        height: 0,
        sceneFunc(ctx, shape) {
          const tr = shape.getParent();
          const padding = tr.padding();
          const width = shape.width();
          const height = shape.height();
          ctx.beginPath();
          ctx.rect(-padding, -padding, width + padding * 2, height + padding * 2);
          if (tr.rotateEnabled() && tr.rotateLineVisible()) {
            const rotateAnchorAngle = tr.rotateAnchorAngle();
            const rotateAnchorOffset = tr.rotateAnchorOffset();
            const rad = Util.degToRad(rotateAnchorAngle);
            const dirX = Math.sin(rad);
            const dirY = -Math.cos(rad);
            const cx = width / 2;
            const cy = height / 2;
            let t5 = Infinity;
            if (dirY < 0) {
              t5 = Math.min(t5, -cy / dirY);
            } else if (dirY > 0) {
              t5 = Math.min(t5, (height - cy) / dirY);
            }
            if (dirX < 0) {
              t5 = Math.min(t5, -cx / dirX);
            } else if (dirX > 0) {
              t5 = Math.min(t5, (width - cx) / dirX);
            }
            const edgeX = cx + dirX * t5;
            const edgeY = cy + dirY * t5;
            const sign = Util._sign(height);
            const endX = edgeX + dirX * rotateAnchorOffset * sign;
            const endY = edgeY + dirY * rotateAnchorOffset * sign;
            ctx.moveTo(edgeX, edgeY);
            ctx.lineTo(endX, endY);
          }
          ctx.fillStrokeShape(shape);
        },
        hitFunc: (ctx, shape) => {
          if (!this.shouldOverdrawWholeArea()) {
            return;
          }
          const padding = this.padding();
          ctx.beginPath();
          ctx.rect(-padding, -padding, shape.width() + padding * 2, shape.height() + padding * 2);
          ctx.fillStrokeShape(shape);
        }
      });
      this.add(back);
      this._proxyDrag(back);
      back.on("dragstart", (e3) => {
        e3.cancelBubble = true;
      });
      back.on("dragmove", (e3) => {
        e3.cancelBubble = true;
      });
      back.on("dragend", (e3) => {
        e3.cancelBubble = true;
      });
      this.on("dragmove", (e3) => {
        this.update();
      });
    }
    _handleMouseDown(e3) {
      var _a;
      if (this._transforming) {
        return;
      }
      this._movingAnchorName = e3.target.name().split(" ")[0];
      const attrs = this._getNodeRect();
      const width = attrs.width;
      const height = attrs.height;
      const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
      this.sin = Math.abs(height / hypotenuse);
      this.cos = Math.abs(width / hypotenuse);
      const win = (_a = this.getStage()) === null || _a === void 0 ? void 0 : _a._getOwnerWindow();
      this._transformWindow = win || null;
      if (win) {
        win.addEventListener("mousemove", this._handleMouseMove);
        win.addEventListener("touchmove", this._handleMouseMove);
        win.addEventListener("mouseup", this._handleMouseUp, true);
        win.addEventListener("touchend", this._handleMouseUp, true);
      }
      this._transforming = true;
      const ap = e3.target.getAbsolutePosition();
      const pos = e3.target.getStage().getPointerPosition();
      this._anchorDragOffset = {
        x: pos.x - ap.x,
        y: pos.y - ap.y
      };
      activeTransformersCount++;
      this._fire("transformstart", { evt: e3.evt, target: this.getNode() });
      this._nodes.forEach((target) => {
        target._fire("transformstart", { evt: e3.evt, target });
      });
    }
    _handleMouseMove(e3) {
      let x2, y3, newHypotenuse;
      const anchorNode = this.findOne("." + this._movingAnchorName);
      const stage = anchorNode.getStage();
      stage.setPointersPositions(e3);
      const pp = stage.getPointerPosition();
      let newNodePos = {
        x: pp.x - this._anchorDragOffset.x,
        y: pp.y - this._anchorDragOffset.y
      };
      const oldAbs = anchorNode.getAbsolutePosition();
      if (this.anchorDragBoundFunc()) {
        newNodePos = this.anchorDragBoundFunc()(oldAbs, newNodePos, e3);
      }
      anchorNode.setAbsolutePosition(newNodePos);
      const newAbs = anchorNode.getAbsolutePosition();
      if (oldAbs.x === newAbs.x && oldAbs.y === newAbs.y) {
        return;
      }
      if (this._movingAnchorName === "rotater") {
        const attrs = this._getNodeRect();
        x2 = anchorNode.x() - attrs.width / 2;
        y3 = -anchorNode.y() + attrs.height / 2;
        const rotateAnchorAngleRad = Konva.getAngle(this.rotateAnchorAngle());
        let delta = Math.atan2(-y3, x2) + Math.PI / 2 - rotateAnchorAngleRad;
        if (attrs.height < 0) {
          delta -= Math.PI;
        }
        const oldRotation = Konva.getAngle(this.rotation());
        const newRotation = oldRotation + delta;
        const tol = Konva.getAngle(this.rotationSnapTolerance());
        const snappedRot = getSnap(this.rotationSnaps(), newRotation, tol);
        const diff = snappedRot - attrs.rotation;
        const shape = rotateAroundCenter(attrs, diff);
        this._fitNodesInto(shape, e3);
        return;
      }
      const shiftBehavior = this.shiftBehavior();
      let keepProportion;
      if (shiftBehavior === "inverted") {
        keepProportion = this.keepRatio() && !e3.shiftKey;
      } else if (shiftBehavior === "none") {
        keepProportion = this.keepRatio();
      } else {
        keepProportion = this.keepRatio() || e3.shiftKey;
      }
      let centeredScaling = this.centeredScaling() || e3.altKey;
      let anchorProjected = false;
      if (this._movingAnchorName === "top-left") {
        if (keepProportion) {
          anchorProjected = true;
          const comparePoint = centeredScaling ? {
            x: this.width() / 2,
            y: this.height() / 2
          } : {
            x: this.findOne(".bottom-right").x(),
            y: this.findOne(".bottom-right").y()
          };
          newHypotenuse = Math.sqrt(Math.pow(comparePoint.x - anchorNode.x(), 2) + Math.pow(comparePoint.y - anchorNode.y(), 2));
          const reverseX = this.findOne(".top-left").x() > comparePoint.x ? -1 : 1;
          const reverseY = this.findOne(".top-left").y() > comparePoint.y ? -1 : 1;
          x2 = newHypotenuse * this.cos * reverseX;
          y3 = newHypotenuse * this.sin * reverseY;
          this.findOne(".top-left").x(comparePoint.x - x2);
          this.findOne(".top-left").y(comparePoint.y - y3);
        }
      } else if (this._movingAnchorName === "top-center") {
        this.findOne(".top-left").y(anchorNode.y());
      } else if (this._movingAnchorName === "top-right") {
        if (keepProportion) {
          anchorProjected = true;
          const comparePoint = centeredScaling ? {
            x: this.width() / 2,
            y: this.height() / 2
          } : {
            x: this.findOne(".bottom-left").x(),
            y: this.findOne(".bottom-left").y()
          };
          newHypotenuse = Math.sqrt(Math.pow(anchorNode.x() - comparePoint.x, 2) + Math.pow(comparePoint.y - anchorNode.y(), 2));
          const reverseX = this.findOne(".top-right").x() < comparePoint.x ? -1 : 1;
          const reverseY = this.findOne(".top-right").y() > comparePoint.y ? -1 : 1;
          x2 = newHypotenuse * this.cos * reverseX;
          y3 = newHypotenuse * this.sin * reverseY;
          this.findOne(".top-right").x(comparePoint.x + x2);
          this.findOne(".top-right").y(comparePoint.y - y3);
        }
        var pos = anchorNode.position();
        this.findOne(".top-left").y(pos.y);
        this.findOne(".bottom-right").x(pos.x);
      } else if (this._movingAnchorName === "middle-left") {
        this.findOne(".top-left").x(anchorNode.x());
      } else if (this._movingAnchorName === "middle-right") {
        this.findOne(".bottom-right").x(anchorNode.x());
      } else if (this._movingAnchorName === "bottom-left") {
        if (keepProportion) {
          anchorProjected = true;
          const comparePoint = centeredScaling ? {
            x: this.width() / 2,
            y: this.height() / 2
          } : {
            x: this.findOne(".top-right").x(),
            y: this.findOne(".top-right").y()
          };
          newHypotenuse = Math.sqrt(Math.pow(comparePoint.x - anchorNode.x(), 2) + Math.pow(anchorNode.y() - comparePoint.y, 2));
          const reverseX = comparePoint.x < anchorNode.x() ? -1 : 1;
          const reverseY = anchorNode.y() < comparePoint.y ? -1 : 1;
          x2 = newHypotenuse * this.cos * reverseX;
          y3 = newHypotenuse * this.sin * reverseY;
          anchorNode.x(comparePoint.x - x2);
          anchorNode.y(comparePoint.y + y3);
        }
        pos = anchorNode.position();
        this.findOne(".top-left").x(pos.x);
        this.findOne(".bottom-right").y(pos.y);
      } else if (this._movingAnchorName === "bottom-center") {
        this.findOne(".bottom-right").y(anchorNode.y());
      } else if (this._movingAnchorName === "bottom-right") {
        if (keepProportion) {
          anchorProjected = true;
          const comparePoint = centeredScaling ? {
            x: this.width() / 2,
            y: this.height() / 2
          } : {
            x: this.findOne(".top-left").x(),
            y: this.findOne(".top-left").y()
          };
          newHypotenuse = Math.sqrt(Math.pow(anchorNode.x() - comparePoint.x, 2) + Math.pow(anchorNode.y() - comparePoint.y, 2));
          const reverseX = this.findOne(".bottom-right").x() < comparePoint.x ? -1 : 1;
          const reverseY = this.findOne(".bottom-right").y() < comparePoint.y ? -1 : 1;
          x2 = newHypotenuse * this.cos * reverseX;
          y3 = newHypotenuse * this.sin * reverseY;
          this.findOne(".bottom-right").x(comparePoint.x + x2);
          this.findOne(".bottom-right").y(comparePoint.y + y3);
        }
      } else {
        console.error(new Error("Wrong position argument of selection resizer: " + this._movingAnchorName));
      }
      centeredScaling = this.centeredScaling() || e3.altKey;
      if (centeredScaling) {
        const topLeft = this.findOne(".top-left");
        const bottomRight = this.findOne(".bottom-right");
        const topOffsetX = topLeft.x();
        const topOffsetY = topLeft.y();
        const bottomOffsetX = this.getWidth() - bottomRight.x();
        const bottomOffsetY = this.getHeight() - bottomRight.y();
        bottomRight.move({
          x: -topOffsetX,
          y: -topOffsetY
        });
        topLeft.move({
          x: bottomOffsetX,
          y: bottomOffsetY
        });
      }
      const absPos = this.findOne(".top-left").getAbsolutePosition();
      x2 = absPos.x;
      y3 = absPos.y;
      const width = this.findOne(".bottom-right").x() - this.findOne(".top-left").x();
      const height = this.findOne(".bottom-right").y() - this.findOne(".top-left").y();
      this._fitNodesInto({
        x: x2,
        y: y3,
        width,
        height,
        rotation: Konva.getAngle(this.rotation())
      }, e3, anchorProjected);
    }
    _handleMouseUp(e3) {
      this._removeEvents(e3);
    }
    getAbsoluteTransform() {
      return this.getTransform();
    }
    _removeEvents(e3) {
      var _a;
      if (this._transforming) {
        this._transforming = false;
        const win = this._transformWindow;
        this._transformWindow = null;
        if (win) {
          win.removeEventListener("mousemove", this._handleMouseMove);
          win.removeEventListener("touchmove", this._handleMouseMove);
          win.removeEventListener("mouseup", this._handleMouseUp, true);
          win.removeEventListener("touchend", this._handleMouseUp, true);
        }
        const node = this.getNode();
        activeTransformersCount--;
        this._fire("transformend", { evt: e3, target: node });
        (_a = this.getLayer()) === null || _a === void 0 ? void 0 : _a.batchDraw();
        if (node) {
          this._nodes.forEach((target) => {
            var _a2;
            target._fire("transformend", { evt: e3, target });
            (_a2 = target.getLayer()) === null || _a2 === void 0 ? void 0 : _a2.batchDraw();
          });
        }
        this._movingAnchorName = null;
      }
    }
    _fitNodesInto(newAttrs, evt, anchorProjected = false) {
      const prevAutoDraw = Konva.autoDrawEnabled;
      Konva.autoDrawEnabled = false;
      try {
        return this._doFitNodesInto(newAttrs, evt, anchorProjected);
      } finally {
        Konva.autoDrawEnabled = prevAutoDraw;
      }
    }
    _doFitNodesInto(newAttrs, evt, anchorProjected = false) {
      const oldAttrs = this._getNodeRect();
      const minSize = 1;
      if (Util._inRange(newAttrs.width, -this.padding() * 2 - minSize, minSize)) {
        this.update();
        return;
      }
      if (Util._inRange(newAttrs.height, -this.padding() * 2 - minSize, minSize)) {
        this.update();
        return;
      }
      const t5 = new Transform();
      t5.rotate(Konva.getAngle(this.rotation()));
      const flipPadding = anchorProjected ? 0 : this.padding() * 2;
      let widthFlip = null;
      let heightFlip = null;
      if (this._movingAnchorName && newAttrs.width < 0 && this._movingAnchorName.indexOf("left") >= 0) {
        const offset = t5.point({
          x: -flipPadding,
          y: 0
        });
        newAttrs.x += offset.x;
        newAttrs.y += offset.y;
        newAttrs.width += flipPadding;
        widthFlip = { axis: "width", from: "left", to: "right", offset };
      } else if (this._movingAnchorName && newAttrs.width < 0 && this._movingAnchorName.indexOf("right") >= 0) {
        const offset = t5.point({
          x: flipPadding,
          y: 0
        });
        newAttrs.width += flipPadding;
        widthFlip = { axis: "width", from: "right", to: "left", offset };
      }
      if (this._movingAnchorName && newAttrs.height < 0 && this._movingAnchorName.indexOf("top") >= 0) {
        const offset = t5.point({
          x: 0,
          y: -flipPadding
        });
        newAttrs.x += offset.x;
        newAttrs.y += offset.y;
        newAttrs.height += flipPadding;
        heightFlip = { axis: "height", from: "top", to: "bottom", offset };
      } else if (this._movingAnchorName && newAttrs.height < 0 && this._movingAnchorName.indexOf("bottom") >= 0) {
        const offset = t5.point({
          x: 0,
          y: flipPadding
        });
        newAttrs.height += flipPadding;
        heightFlip = { axis: "height", from: "bottom", to: "top", offset };
      }
      if (this.boundBoxFunc()) {
        const bounded = this.boundBoxFunc()(oldAttrs, newAttrs);
        if (bounded) {
          newAttrs = bounded;
        } else {
          Util.warn("boundBoxFunc returned falsy. You should return new bound rect from it!");
        }
      }
      for (const flip of [widthFlip, heightFlip]) {
        if (flip && newAttrs[flip.axis] < 0 && this._movingAnchorName) {
          this._movingAnchorName = this._movingAnchorName.replace(flip.from, flip.to);
          this._anchorDragOffset.x -= flip.offset.x;
          this._anchorDragOffset.y -= flip.offset.y;
        }
      }
      const baseSize = 1e7;
      const oldTr = new Transform();
      oldTr.translate(oldAttrs.x, oldAttrs.y);
      oldTr.rotate(oldAttrs.rotation);
      oldTr.scale(oldAttrs.width / baseSize, oldAttrs.height / baseSize);
      const newTr = new Transform();
      const newScaleX = newAttrs.width / baseSize;
      const newScaleY = newAttrs.height / baseSize;
      if (this.flipEnabled() === false) {
        newTr.translate(newAttrs.x, newAttrs.y);
        newTr.rotate(newAttrs.rotation);
        newTr.translate(newAttrs.width < 0 ? newAttrs.width : 0, newAttrs.height < 0 ? newAttrs.height : 0);
        newTr.scale(Math.abs(newScaleX), Math.abs(newScaleY));
      } else {
        newTr.translate(newAttrs.x, newAttrs.y);
        newTr.rotate(newAttrs.rotation);
        newTr.scale(newScaleX, newScaleY);
      }
      const delta = newTr.multiply(oldTr.invert());
      const layersToDraw = /* @__PURE__ */ new Set();
      this._nodes.forEach((node) => {
        if (!node.getStage()) {
          return;
        }
        const parentTransform = node.getParent().getAbsoluteTransform();
        const localTransform = node.getTransform().copy();
        localTransform.translate(node.offsetX(), node.offsetY());
        const newLocalTransform = new Transform();
        newLocalTransform.multiply(parentTransform.copy().invert()).multiply(delta).multiply(parentTransform).multiply(localTransform);
        const attrs = newLocalTransform.decompose();
        node.setAttrs(attrs);
        const layer = node.getLayer();
        if (layer) {
          layersToDraw.add(layer);
        }
      });
      this.rotation(Util._getRotation(newAttrs.rotation));
      this._nodes.forEach((node) => {
        this._fire("transform", { evt, target: node });
        node._fire("transform", { evt, target: node });
      });
      this._resetTransformCache();
      this.update();
      layersToDraw.add(this.getLayer());
      layersToDraw.forEach((layer) => layer && layer.batchDraw());
    }
    _scheduleUpdate() {
      if (this._updateScheduled)
        return;
      this._updateScheduled = true;
      Node._runAfterAbsTransformCascade(() => {
        var _a;
        this._updateScheduled = false;
        if (!((_a = this._nodes) === null || _a === void 0 ? void 0 : _a.length) || this._transforming || this.isDragging()) {
          return;
        }
        this.update();
      });
    }
    forceUpdate() {
      this._resetTransformCache();
      this.update();
    }
    _batchChangeChild(selector, attrs) {
      const anchor = this.findOne(selector);
      anchor.setAttrs(attrs);
    }
    update() {
      var _a;
      const attrs = this._getNodeRect();
      this.rotation(Util._getRotation(attrs.rotation));
      const width = attrs.width;
      const height = attrs.height;
      const enabledAnchors = this.enabledAnchors();
      const resizeEnabled = this.resizeEnabled();
      const padding = this.padding();
      const anchorSize = this.anchorSize();
      const anchors = this.find("._anchor");
      anchors.forEach((node) => {
        node.setAttrs({
          width: anchorSize,
          height: anchorSize,
          offsetX: anchorSize / 2,
          offsetY: anchorSize / 2,
          stroke: this.anchorStroke(),
          strokeWidth: this.anchorStrokeWidth(),
          fill: this.anchorFill(),
          cornerRadius: this.anchorCornerRadius()
        });
      });
      this._batchChangeChild(".top-left", {
        x: 0,
        y: 0,
        offsetX: anchorSize / 2 + padding,
        offsetY: anchorSize / 2 + padding,
        visible: resizeEnabled && enabledAnchors.indexOf("top-left") >= 0
      });
      this._batchChangeChild(".top-center", {
        x: width / 2,
        y: 0,
        offsetY: anchorSize / 2 + padding,
        visible: resizeEnabled && enabledAnchors.indexOf("top-center") >= 0
      });
      this._batchChangeChild(".top-right", {
        x: width,
        y: 0,
        offsetX: anchorSize / 2 - padding,
        offsetY: anchorSize / 2 + padding,
        visible: resizeEnabled && enabledAnchors.indexOf("top-right") >= 0
      });
      this._batchChangeChild(".middle-left", {
        x: 0,
        y: height / 2,
        offsetX: anchorSize / 2 + padding,
        visible: resizeEnabled && enabledAnchors.indexOf("middle-left") >= 0
      });
      this._batchChangeChild(".middle-right", {
        x: width,
        y: height / 2,
        offsetX: anchorSize / 2 - padding,
        visible: resizeEnabled && enabledAnchors.indexOf("middle-right") >= 0
      });
      this._batchChangeChild(".bottom-left", {
        x: 0,
        y: height,
        offsetX: anchorSize / 2 + padding,
        offsetY: anchorSize / 2 - padding,
        visible: resizeEnabled && enabledAnchors.indexOf("bottom-left") >= 0
      });
      this._batchChangeChild(".bottom-center", {
        x: width / 2,
        y: height,
        offsetY: anchorSize / 2 - padding,
        visible: resizeEnabled && enabledAnchors.indexOf("bottom-center") >= 0
      });
      this._batchChangeChild(".bottom-right", {
        x: width,
        y: height,
        offsetX: anchorSize / 2 - padding,
        offsetY: anchorSize / 2 - padding,
        visible: resizeEnabled && enabledAnchors.indexOf("bottom-right") >= 0
      });
      const rotateAnchorAngle = this.rotateAnchorAngle();
      const rotateAnchorOffset = this.rotateAnchorOffset();
      const rad = Util.degToRad(rotateAnchorAngle);
      const dirX = Math.sin(rad);
      const dirY = -Math.cos(rad);
      const cx = width / 2;
      const cy = height / 2;
      let t5 = Infinity;
      if (dirY < 0) {
        t5 = Math.min(t5, -cy / dirY);
      } else if (dirY > 0) {
        t5 = Math.min(t5, (height - cy) / dirY);
      }
      if (dirX < 0) {
        t5 = Math.min(t5, -cx / dirX);
      } else if (dirX > 0) {
        t5 = Math.min(t5, (width - cx) / dirX);
      }
      const edgeX = cx + dirX * t5;
      const edgeY = cy + dirY * t5;
      const sign = Util._sign(height);
      this._batchChangeChild(".rotater", {
        x: edgeX + dirX * rotateAnchorOffset * sign,
        y: edgeY + dirY * rotateAnchorOffset * sign - padding * dirY,
        visible: this.rotateEnabled()
      });
      this._batchChangeChild(".back", {
        width,
        height,
        visible: this.borderEnabled(),
        stroke: this.borderStroke(),
        strokeWidth: this.borderStrokeWidth(),
        dash: this.borderDash(),
        draggable: this.nodes().some((node) => node.draggable()),
        x: 0,
        y: 0
      });
      const styleFunc = this.anchorStyleFunc();
      if (styleFunc) {
        anchors.forEach((node) => {
          styleFunc(node);
        });
      }
      (_a = this.getLayer()) === null || _a === void 0 ? void 0 : _a.batchDraw();
    }
    isTransforming() {
      return this._transforming;
    }
    stopTransform() {
      if (this._transforming) {
        this._removeEvents();
        const anchorNode = this.findOne("." + this._movingAnchorName);
        if (anchorNode) {
          anchorNode.stopDrag();
        }
      }
    }
    destroy() {
      if (this.getStage() && this._cursorChange) {
        this.getStage().content && (this.getStage().content.style.cursor = "");
      }
      Group.prototype.destroy.call(this);
      this.detach();
      this._removeEvents();
      return this;
    }
    add(...children) {
      if (this._elementsCreated) {
        Util.error("You cannot add external nodes to the Transformer. Use tr.nodes([node]) instead.");
        return this;
      }
      return super.add(...children);
    }
    toObject() {
      return Node.prototype.toObject.call(this);
    }
    clone(obj) {
      const node = Node.prototype.clone.call(this, obj);
      return node;
    }
    getClientRect() {
      if (this.nodes().length > 0) {
        return super.getClientRect();
      } else {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
    }
  };
  Transformer.isTransforming = () => {
    return activeTransformersCount > 0;
  };
  function validateAnchors(val) {
    if (!(val instanceof Array)) {
      Util.warn("enabledAnchors value should be an array");
    }
    if (val instanceof Array) {
      val.forEach(function(name) {
        if (ANCHORS_NAMES.indexOf(name) === -1) {
          Util.warn("Unknown anchor name: " + name + ". Available names are: " + ANCHORS_NAMES.join(", "));
        }
      });
    }
    return val || [];
  }
  Transformer.prototype.className = "Transformer";
  _registerNode(Transformer);
  Factory.addGetterSetter(Transformer, "enabledAnchors", ANCHORS_NAMES, validateAnchors);
  Factory.addGetterSetter(Transformer, "flipEnabled", true, getBooleanValidator());
  Factory.addGetterSetter(Transformer, "resizeEnabled", true);
  Factory.addGetterSetter(Transformer, "anchorSize", 10, getNumberValidator());
  Factory.addGetterSetter(Transformer, "rotateEnabled", true);
  Factory.addGetterSetter(Transformer, "rotateLineVisible", true);
  Factory.addGetterSetter(Transformer, "rotationSnaps", []);
  Factory.addGetterSetter(Transformer, "rotateAnchorOffset", 50, getNumberValidator());
  Factory.addGetterSetter(Transformer, "rotateAnchorAngle", 0, getNumberValidator());
  Factory.addGetterSetter(Transformer, "rotateAnchorCursor", "crosshair");
  Factory.addGetterSetter(Transformer, "rotationSnapTolerance", 5, getNumberValidator());
  Factory.addGetterSetter(Transformer, "borderEnabled", true);
  Factory.addGetterSetter(Transformer, "anchorStroke", "rgb(0, 161, 255)");
  Factory.addGetterSetter(Transformer, "anchorStrokeWidth", 1, getNumberValidator());
  Factory.addGetterSetter(Transformer, "anchorFill", "white");
  Factory.addGetterSetter(Transformer, "anchorCornerRadius", 0, getNumberValidator());
  Factory.addGetterSetter(Transformer, "borderStroke", "rgb(0, 161, 255)");
  Factory.addGetterSetter(Transformer, "borderStrokeWidth", 1, getNumberValidator());
  Factory.addGetterSetter(Transformer, "borderDash");
  Factory.addGetterSetter(Transformer, "keepRatio", true);
  Factory.addGetterSetter(Transformer, "shiftBehavior", "default");
  Factory.addGetterSetter(Transformer, "centeredScaling", false);
  Factory.addGetterSetter(Transformer, "ignoreStroke", false);
  Factory.addGetterSetter(Transformer, "padding", 0, getNumberValidator());
  Factory.addGetterSetter(Transformer, "nodes");
  Factory.addGetterSetter(Transformer, "node");
  Factory.addGetterSetter(Transformer, "boundBoxFunc");
  Factory.addGetterSetter(Transformer, "anchorDragBoundFunc");
  Factory.addGetterSetter(Transformer, "anchorStyleFunc");
  Factory.addGetterSetter(Transformer, "shouldOverdrawWholeArea", false);
  Factory.addGetterSetter(Transformer, "useSingleNodeRotation", true);
  Factory.backCompat(Transformer, {
    lineEnabled: "borderEnabled",
    rotateHandlerOffset: "rotateAnchorOffset",
    enabledHandlers: "enabledAnchors"
  });

  // node_modules/konva/lib/shapes/Wedge.js
  var Wedge = class extends Shape {
    _sceneFunc(context) {
      context.beginPath();
      context.arc(0, 0, this.radius(), 0, Konva.getAngle(this.angle()), this.clockwise());
      context.lineTo(0, 0);
      context.closePath();
      context.fillStrokeShape(this);
    }
    getWidth() {
      return this.radius() * 2;
    }
    getHeight() {
      return this.radius() * 2;
    }
    setWidth(width) {
      this.radius(width / 2);
    }
    setHeight(height) {
      this.radius(height / 2);
    }
  };
  Wedge.prototype.className = "Wedge";
  Wedge.prototype._centroid = true;
  Wedge.prototype._attrsAffectingSize = ["radius"];
  _registerNode(Wedge);
  Factory.addGetterSetter(Wedge, "radius", 0, getNumberValidator());
  Factory.addGetterSetter(Wedge, "angle", 0, getNumberValidator());
  Factory.addGetterSetter(Wedge, "clockwise", false);
  Factory.backCompat(Wedge, {
    angleDeg: "angle",
    getAngleDeg: "getAngle",
    setAngleDeg: "setAngle"
  });

  // node_modules/konva/lib/filters/Blur.js
  function BlurStack() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.next = null;
  }
  var mul_table = [
    512,
    512,
    456,
    512,
    328,
    456,
    335,
    512,
    405,
    328,
    271,
    456,
    388,
    335,
    292,
    512,
    454,
    405,
    364,
    328,
    298,
    271,
    496,
    456,
    420,
    388,
    360,
    335,
    312,
    292,
    273,
    512,
    482,
    454,
    428,
    405,
    383,
    364,
    345,
    328,
    312,
    298,
    284,
    271,
    259,
    496,
    475,
    456,
    437,
    420,
    404,
    388,
    374,
    360,
    347,
    335,
    323,
    312,
    302,
    292,
    282,
    273,
    265,
    512,
    497,
    482,
    468,
    454,
    441,
    428,
    417,
    405,
    394,
    383,
    373,
    364,
    354,
    345,
    337,
    328,
    320,
    312,
    305,
    298,
    291,
    284,
    278,
    271,
    265,
    259,
    507,
    496,
    485,
    475,
    465,
    456,
    446,
    437,
    428,
    420,
    412,
    404,
    396,
    388,
    381,
    374,
    367,
    360,
    354,
    347,
    341,
    335,
    329,
    323,
    318,
    312,
    307,
    302,
    297,
    292,
    287,
    282,
    278,
    273,
    269,
    265,
    261,
    512,
    505,
    497,
    489,
    482,
    475,
    468,
    461,
    454,
    447,
    441,
    435,
    428,
    422,
    417,
    411,
    405,
    399,
    394,
    389,
    383,
    378,
    373,
    368,
    364,
    359,
    354,
    350,
    345,
    341,
    337,
    332,
    328,
    324,
    320,
    316,
    312,
    309,
    305,
    301,
    298,
    294,
    291,
    287,
    284,
    281,
    278,
    274,
    271,
    268,
    265,
    262,
    259,
    257,
    507,
    501,
    496,
    491,
    485,
    480,
    475,
    470,
    465,
    460,
    456,
    451,
    446,
    442,
    437,
    433,
    428,
    424,
    420,
    416,
    412,
    408,
    404,
    400,
    396,
    392,
    388,
    385,
    381,
    377,
    374,
    370,
    367,
    363,
    360,
    357,
    354,
    350,
    347,
    344,
    341,
    338,
    335,
    332,
    329,
    326,
    323,
    320,
    318,
    315,
    312,
    310,
    307,
    304,
    302,
    299,
    297,
    294,
    292,
    289,
    287,
    285,
    282,
    280,
    278,
    275,
    273,
    271,
    269,
    267,
    265,
    263,
    261,
    259
  ];
  var shg_table = [
    9,
    11,
    12,
    13,
    13,
    14,
    14,
    15,
    15,
    15,
    15,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    18,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    21,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    22,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    23,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24,
    24
  ];
  function filterGaussBlurRGBA(imageData, radius) {
    const pixels = imageData.data, width = imageData.width, height = imageData.height;
    let p3, yi, yw, r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum, pr, pg, pb, pa, rbs;
    const div = radius + radius + 1, widthMinus1 = width - 1, heightMinus1 = height - 1, radiusPlus1 = radius + 1, sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2, stackStart = new BlurStack(), mul_sum = mul_table[radius], shg_sum = shg_table[radius];
    let stackEnd = null, stack = stackStart, stackIn = null, stackOut = null;
    for (let i3 = 1; i3 < div; i3++) {
      stack = stack.next = new BlurStack();
      if (i3 === radiusPlus1) {
        stackEnd = stack;
      }
    }
    stack.next = stackStart;
    yw = yi = 0;
    for (let y3 = 0; y3 < height; y3++) {
      r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
      r_out_sum = radiusPlus1 * (pr = pixels[yi]);
      g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
      b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
      a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
      r_sum += sumFactor * pr;
      g_sum += sumFactor * pg;
      b_sum += sumFactor * pb;
      a_sum += sumFactor * pa;
      stack = stackStart;
      for (let i3 = 0; i3 < radiusPlus1; i3++) {
        stack.r = pr;
        stack.g = pg;
        stack.b = pb;
        stack.a = pa;
        stack = stack.next;
      }
      for (let i3 = 1; i3 < radiusPlus1; i3++) {
        p3 = yi + ((widthMinus1 < i3 ? widthMinus1 : i3) << 2);
        r_sum += (stack.r = pr = pixels[p3]) * (rbs = radiusPlus1 - i3);
        g_sum += (stack.g = pg = pixels[p3 + 1]) * rbs;
        b_sum += (stack.b = pb = pixels[p3 + 2]) * rbs;
        a_sum += (stack.a = pa = pixels[p3 + 3]) * rbs;
        r_in_sum += pr;
        g_in_sum += pg;
        b_in_sum += pb;
        a_in_sum += pa;
        stack = stack.next;
      }
      stackIn = stackStart;
      stackOut = stackEnd;
      for (let x2 = 0; x2 < width; x2++) {
        pixels[yi + 3] = pa = a_sum * mul_sum >> shg_sum;
        if (pa !== 0) {
          pa = 255 / pa;
          pixels[yi] = (r_sum * mul_sum >> shg_sum) * pa;
          pixels[yi + 1] = (g_sum * mul_sum >> shg_sum) * pa;
          pixels[yi + 2] = (b_sum * mul_sum >> shg_sum) * pa;
        } else {
          pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
        }
        r_sum -= r_out_sum;
        g_sum -= g_out_sum;
        b_sum -= b_out_sum;
        a_sum -= a_out_sum;
        r_out_sum -= stackIn.r;
        g_out_sum -= stackIn.g;
        b_out_sum -= stackIn.b;
        a_out_sum -= stackIn.a;
        p3 = yw + ((p3 = x2 + radius + 1) < widthMinus1 ? p3 : widthMinus1) << 2;
        r_in_sum += stackIn.r = pixels[p3];
        g_in_sum += stackIn.g = pixels[p3 + 1];
        b_in_sum += stackIn.b = pixels[p3 + 2];
        a_in_sum += stackIn.a = pixels[p3 + 3];
        r_sum += r_in_sum;
        g_sum += g_in_sum;
        b_sum += b_in_sum;
        a_sum += a_in_sum;
        stackIn = stackIn.next;
        r_out_sum += pr = stackOut.r;
        g_out_sum += pg = stackOut.g;
        b_out_sum += pb = stackOut.b;
        a_out_sum += pa = stackOut.a;
        r_in_sum -= pr;
        g_in_sum -= pg;
        b_in_sum -= pb;
        a_in_sum -= pa;
        stackOut = stackOut.next;
        yi += 4;
      }
      yw += width;
    }
    for (let x2 = 0; x2 < width; x2++) {
      g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
      yi = x2 << 2;
      r_out_sum = radiusPlus1 * (pr = pixels[yi]);
      g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
      b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
      a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
      r_sum += sumFactor * pr;
      g_sum += sumFactor * pg;
      b_sum += sumFactor * pb;
      a_sum += sumFactor * pa;
      stack = stackStart;
      for (let i3 = 0; i3 < radiusPlus1; i3++) {
        stack.r = pr;
        stack.g = pg;
        stack.b = pb;
        stack.a = pa;
        stack = stack.next;
      }
      let yp = width;
      for (let i3 = 1; i3 <= radius; i3++) {
        yi = yp + x2 << 2;
        r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i3);
        g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
        b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;
        a_sum += (stack.a = pa = pixels[yi + 3]) * rbs;
        r_in_sum += pr;
        g_in_sum += pg;
        b_in_sum += pb;
        a_in_sum += pa;
        stack = stack.next;
        if (i3 < heightMinus1) {
          yp += width;
        }
      }
      yi = x2;
      stackIn = stackStart;
      stackOut = stackEnd;
      for (let y3 = 0; y3 < height; y3++) {
        p3 = yi << 2;
        pixels[p3 + 3] = pa = a_sum * mul_sum >> shg_sum;
        if (pa > 0) {
          pa = 255 / pa;
          pixels[p3] = (r_sum * mul_sum >> shg_sum) * pa;
          pixels[p3 + 1] = (g_sum * mul_sum >> shg_sum) * pa;
          pixels[p3 + 2] = (b_sum * mul_sum >> shg_sum) * pa;
        } else {
          pixels[p3] = pixels[p3 + 1] = pixels[p3 + 2] = 0;
        }
        r_sum -= r_out_sum;
        g_sum -= g_out_sum;
        b_sum -= b_out_sum;
        a_sum -= a_out_sum;
        r_out_sum -= stackIn.r;
        g_out_sum -= stackIn.g;
        b_out_sum -= stackIn.b;
        a_out_sum -= stackIn.a;
        p3 = x2 + ((p3 = y3 + radiusPlus1) < heightMinus1 ? p3 : heightMinus1) * width << 2;
        r_sum += r_in_sum += stackIn.r = pixels[p3];
        g_sum += g_in_sum += stackIn.g = pixels[p3 + 1];
        b_sum += b_in_sum += stackIn.b = pixels[p3 + 2];
        a_sum += a_in_sum += stackIn.a = pixels[p3 + 3];
        stackIn = stackIn.next;
        r_out_sum += pr = stackOut.r;
        g_out_sum += pg = stackOut.g;
        b_out_sum += pb = stackOut.b;
        a_out_sum += pa = stackOut.a;
        r_in_sum -= pr;
        g_in_sum -= pg;
        b_in_sum -= pb;
        a_in_sum -= pa;
        stackOut = stackOut.next;
        yi += width;
      }
    }
  }
  var Blur = function Blur2(imageData) {
    const radius = Math.round(this.blurRadius());
    if (radius > 0) {
      filterGaussBlurRGBA(imageData, radius);
    }
  };
  Factory.addGetterSetter(Node, "blurRadius", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Brighten.js
  var Brighten = function(imageData) {
    const brightness = this.brightness() * 255, data = imageData.data, len = data.length;
    for (let i3 = 0; i3 < len; i3 += 4) {
      data[i3] += brightness;
      data[i3 + 1] += brightness;
      data[i3 + 2] += brightness;
    }
  };
  Factory.addGetterSetter(Node, "brightness", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Brightness.js
  var Brightness = function(imageData) {
    const brightness = this.brightness(), data = imageData.data, len = data.length;
    for (let i3 = 0; i3 < len; i3 += 4) {
      data[i3] = Math.min(255, data[i3] * brightness);
      data[i3 + 1] = Math.min(255, data[i3 + 1] * brightness);
      data[i3 + 2] = Math.min(255, data[i3 + 2] * brightness);
    }
  };

  // node_modules/konva/lib/filters/Contrast.js
  var Contrast = function(imageData) {
    const adjust = Math.pow((this.contrast() + 100) / 100, 2);
    const data = imageData.data, nPixels = data.length;
    let red = 150, green = 150, blue = 150;
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      red = data[i3];
      green = data[i3 + 1];
      blue = data[i3 + 2];
      red /= 255;
      red -= 0.5;
      red *= adjust;
      red += 0.5;
      red *= 255;
      green /= 255;
      green -= 0.5;
      green *= adjust;
      green += 0.5;
      green *= 255;
      blue /= 255;
      blue -= 0.5;
      blue *= adjust;
      blue += 0.5;
      blue *= 255;
      red = red < 0 ? 0 : red > 255 ? 255 : red;
      green = green < 0 ? 0 : green > 255 ? 255 : green;
      blue = blue < 0 ? 0 : blue > 255 ? 255 : blue;
      data[i3] = red;
      data[i3 + 1] = green;
      data[i3 + 2] = blue;
    }
  };
  Factory.addGetterSetter(Node, "contrast", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Emboss.js
  var Emboss = function(imageData) {
    var _a, _b, _c, _d, _e2, _f, _g, _h, _j;
    const data = imageData.data;
    const w2 = imageData.width;
    const h3 = imageData.height;
    const strength01 = Math.min(1, Math.max(0, (_b = (_a = this.embossStrength) === null || _a === void 0 ? void 0 : _a.call(this)) !== null && _b !== void 0 ? _b : 0.5));
    const whiteLevel01 = Math.min(1, Math.max(0, (_d = (_c = this.embossWhiteLevel) === null || _c === void 0 ? void 0 : _c.call(this)) !== null && _d !== void 0 ? _d : 0.5));
    const directionMap = {
      "top-left": 315,
      top: 270,
      "top-right": 225,
      right: 180,
      "bottom-right": 135,
      bottom: 90,
      "bottom-left": 45,
      left: 0
    };
    const directionDeg = (_g = directionMap[(_f = (_e2 = this.embossDirection) === null || _e2 === void 0 ? void 0 : _e2.call(this)) !== null && _f !== void 0 ? _f : "top-left"]) !== null && _g !== void 0 ? _g : 315;
    const blend = !!((_j = (_h = this.embossBlend) === null || _h === void 0 ? void 0 : _h.call(this)) !== null && _j !== void 0 ? _j : false);
    const strength = strength01 * 10;
    const bias = whiteLevel01 * 255;
    const dirRad = directionDeg * Math.PI / 180;
    const cx = Math.cos(dirRad);
    const cy = Math.sin(dirRad);
    const SCALE = 128 / 1020 * strength;
    const src = new Uint8ClampedArray(data);
    const lum = new Float32Array(w2 * h3);
    for (let p3 = 0, i3 = 0; i3 < data.length; i3 += 4, p3++) {
      lum[p3] = 0.2126 * src[i3] + 0.7152 * src[i3 + 1] + 0.0722 * src[i3 + 2];
    }
    const Gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const Gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    const OFF = [-w2 - 1, -w2, -w2 + 1, -1, 0, 1, w2 - 1, w2, w2 + 1];
    const clamp8 = (v3) => v3 < 0 ? 0 : v3 > 255 ? 255 : v3;
    for (let y3 = 1; y3 < h3 - 1; y3++) {
      for (let x2 = 1; x2 < w2 - 1; x2++) {
        const p3 = y3 * w2 + x2;
        let sx = 0, sy = 0;
        sx += lum[p3 + OFF[0]] * Gx[0];
        sy += lum[p3 + OFF[0]] * Gy[0];
        sx += lum[p3 + OFF[1]] * Gx[1];
        sy += lum[p3 + OFF[1]] * Gy[1];
        sx += lum[p3 + OFF[2]] * Gx[2];
        sy += lum[p3 + OFF[2]] * Gy[2];
        sx += lum[p3 + OFF[3]] * Gx[3];
        sy += lum[p3 + OFF[3]] * Gy[3];
        sx += lum[p3 + OFF[5]] * Gx[5];
        sy += lum[p3 + OFF[5]] * Gy[5];
        sx += lum[p3 + OFF[6]] * Gx[6];
        sy += lum[p3 + OFF[6]] * Gy[6];
        sx += lum[p3 + OFF[7]] * Gx[7];
        sy += lum[p3 + OFF[7]] * Gy[7];
        sx += lum[p3 + OFF[8]] * Gx[8];
        sy += lum[p3 + OFF[8]] * Gy[8];
        const r5 = cx * sx + cy * sy;
        const outGray = clamp8(bias + r5 * SCALE);
        const o3 = p3 * 4;
        if (blend) {
          const delta = outGray - bias;
          data[o3] = clamp8(src[o3] + delta);
          data[o3 + 1] = clamp8(src[o3 + 1] + delta);
          data[o3 + 2] = clamp8(src[o3 + 2] + delta);
          data[o3 + 3] = src[o3 + 3];
        } else {
          data[o3] = data[o3 + 1] = data[o3 + 2] = outGray;
          data[o3 + 3] = src[o3 + 3];
        }
      }
    }
    for (let x2 = 0; x2 < w2; x2++) {
      let oTop = x2 * 4, oBot = ((h3 - 1) * w2 + x2) * 4;
      data[oTop] = src[oTop];
      data[oTop + 1] = src[oTop + 1];
      data[oTop + 2] = src[oTop + 2];
      data[oTop + 3] = src[oTop + 3];
      data[oBot] = src[oBot];
      data[oBot + 1] = src[oBot + 1];
      data[oBot + 2] = src[oBot + 2];
      data[oBot + 3] = src[oBot + 3];
    }
    for (let y3 = 1; y3 < h3 - 1; y3++) {
      let oL = y3 * w2 * 4, oR = (y3 * w2 + (w2 - 1)) * 4;
      data[oL] = src[oL];
      data[oL + 1] = src[oL + 1];
      data[oL + 2] = src[oL + 2];
      data[oL + 3] = src[oL + 3];
      data[oR] = src[oR];
      data[oR + 1] = src[oR + 1];
      data[oR + 2] = src[oR + 2];
      data[oR + 3] = src[oR + 3];
    }
    return imageData;
  };
  Factory.addGetterSetter(Node, "embossStrength", 0.5, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "embossWhiteLevel", 0.5, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "embossDirection", "top-left", void 0, Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "embossBlend", false, void 0, Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Enhance.js
  function remap(fromValue, fromMin, fromMax, toMin, toMax) {
    const fromRange = fromMax - fromMin, toRange = toMax - toMin;
    if (fromRange === 0) {
      return toMin + toRange / 2;
    }
    if (toRange === 0) {
      return toMin;
    }
    let toValue = (fromValue - fromMin) / fromRange;
    toValue = toRange * toValue + toMin;
    return toValue;
  }
  var Enhance = function(imageData) {
    const data = imageData.data, nSubPixels = data.length;
    let rMin = data[0], rMax = rMin, r5, gMin = data[1], gMax = gMin, g3, bMin = data[2], bMax = bMin, b3;
    const enhanceAmount = this.enhance();
    if (enhanceAmount === 0) {
      return;
    }
    for (let i3 = 0; i3 < nSubPixels; i3 += 4) {
      r5 = data[i3 + 0];
      if (r5 < rMin) {
        rMin = r5;
      } else if (r5 > rMax) {
        rMax = r5;
      }
      g3 = data[i3 + 1];
      if (g3 < gMin) {
        gMin = g3;
      } else if (g3 > gMax) {
        gMax = g3;
      }
      b3 = data[i3 + 2];
      if (b3 < bMin) {
        bMin = b3;
      } else if (b3 > bMax) {
        bMax = b3;
      }
    }
    if (rMax === rMin) {
      rMax = 255;
      rMin = 0;
    }
    if (gMax === gMin) {
      gMax = 255;
      gMin = 0;
    }
    if (bMax === bMin) {
      bMax = 255;
      bMin = 0;
    }
    let rGoalMax, rGoalMin, gGoalMax, gGoalMin, bGoalMax, bGoalMin;
    if (enhanceAmount > 0) {
      rGoalMax = rMax + enhanceAmount * (255 - rMax);
      rGoalMin = rMin - enhanceAmount * (rMin - 0);
      gGoalMax = gMax + enhanceAmount * (255 - gMax);
      gGoalMin = gMin - enhanceAmount * (gMin - 0);
      bGoalMax = bMax + enhanceAmount * (255 - bMax);
      bGoalMin = bMin - enhanceAmount * (bMin - 0);
    } else {
      const rMid = (rMax + rMin) * 0.5;
      rGoalMax = rMax + enhanceAmount * (rMax - rMid);
      rGoalMin = rMin + enhanceAmount * (rMin - rMid);
      const gMid = (gMax + gMin) * 0.5;
      gGoalMax = gMax + enhanceAmount * (gMax - gMid);
      gGoalMin = gMin + enhanceAmount * (gMin - gMid);
      const bMid = (bMax + bMin) * 0.5;
      bGoalMax = bMax + enhanceAmount * (bMax - bMid);
      bGoalMin = bMin + enhanceAmount * (bMin - bMid);
    }
    for (let i3 = 0; i3 < nSubPixels; i3 += 4) {
      data[i3 + 0] = remap(data[i3 + 0], rMin, rMax, rGoalMin, rGoalMax);
      data[i3 + 1] = remap(data[i3 + 1], gMin, gMax, gGoalMin, gGoalMax);
      data[i3 + 2] = remap(data[i3 + 2], bMin, bMax, bGoalMin, bGoalMax);
    }
  };
  Factory.addGetterSetter(Node, "enhance", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Grayscale.js
  var Grayscale = function(imageData) {
    const data = imageData.data, len = data.length;
    for (let i3 = 0; i3 < len; i3 += 4) {
      const brightness = 0.34 * data[i3] + 0.5 * data[i3 + 1] + 0.16 * data[i3 + 2];
      data[i3] = brightness;
      data[i3 + 1] = brightness;
      data[i3 + 2] = brightness;
    }
  };

  // node_modules/konva/lib/filters/HSL.js
  Factory.addGetterSetter(Node, "hue", 0, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "saturation", 0, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "luminance", 0, getNumberValidator(), Factory.afterSetFilter);
  var HSL = function(imageData) {
    const data = imageData.data, nPixels = data.length, v3 = 1, s4 = Math.pow(2, this.saturation()), h3 = Math.abs(this.hue() + 360) % 360, l4 = this.luminance() * 127;
    const vsu = v3 * s4 * Math.cos(h3 * Math.PI / 180), vsw = v3 * s4 * Math.sin(h3 * Math.PI / 180);
    const rr = 0.299 * v3 + 0.701 * vsu + 0.167 * vsw, rg = 0.587 * v3 - 0.587 * vsu + 0.33 * vsw, rb = 0.114 * v3 - 0.114 * vsu - 0.497 * vsw;
    const gr = 0.299 * v3 - 0.299 * vsu - 0.328 * vsw, gg = 0.587 * v3 + 0.413 * vsu + 0.035 * vsw, gb = 0.114 * v3 - 0.114 * vsu + 0.293 * vsw;
    const br = 0.299 * v3 - 0.3 * vsu + 1.25 * vsw, bg = 0.587 * v3 - 0.586 * vsu - 1.05 * vsw, bb = 0.114 * v3 + 0.886 * vsu - 0.2 * vsw;
    let r5, g3, b3, a3;
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      r5 = data[i3 + 0];
      g3 = data[i3 + 1];
      b3 = data[i3 + 2];
      a3 = data[i3 + 3];
      data[i3 + 0] = rr * r5 + rg * g3 + rb * b3 + l4;
      data[i3 + 1] = gr * r5 + gg * g3 + gb * b3 + l4;
      data[i3 + 2] = br * r5 + bg * g3 + bb * b3 + l4;
      data[i3 + 3] = a3;
    }
  };

  // node_modules/konva/lib/filters/HSV.js
  var HSV = function(imageData) {
    const data = imageData.data, nPixels = data.length, v3 = Math.pow(2, this.value()), s4 = Math.pow(2, this.saturation()), h3 = Math.abs(this.hue() + 360) % 360;
    const vsu = v3 * s4 * Math.cos(h3 * Math.PI / 180), vsw = v3 * s4 * Math.sin(h3 * Math.PI / 180);
    const rr = 0.299 * v3 + 0.701 * vsu + 0.167 * vsw, rg = 0.587 * v3 - 0.587 * vsu + 0.33 * vsw, rb = 0.114 * v3 - 0.114 * vsu - 0.497 * vsw;
    const gr = 0.299 * v3 - 0.299 * vsu - 0.328 * vsw, gg = 0.587 * v3 + 0.413 * vsu + 0.035 * vsw, gb = 0.114 * v3 - 0.114 * vsu + 0.293 * vsw;
    const br = 0.299 * v3 - 0.3 * vsu + 1.25 * vsw, bg = 0.587 * v3 - 0.586 * vsu - 1.05 * vsw, bb = 0.114 * v3 + 0.886 * vsu - 0.2 * vsw;
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      const r5 = data[i3 + 0];
      const g3 = data[i3 + 1];
      const b3 = data[i3 + 2];
      const a3 = data[i3 + 3];
      data[i3 + 0] = rr * r5 + rg * g3 + rb * b3;
      data[i3 + 1] = gr * r5 + gg * g3 + gb * b3;
      data[i3 + 2] = br * r5 + bg * g3 + bb * b3;
      data[i3 + 3] = a3;
    }
  };
  Factory.addGetterSetter(Node, "hue", 0, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "saturation", 0, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "value", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Invert.js
  var Invert = function(imageData) {
    const data = imageData.data, len = data.length;
    for (let i3 = 0; i3 < len; i3 += 4) {
      data[i3] = 255 - data[i3];
      data[i3 + 1] = 255 - data[i3 + 1];
      data[i3 + 2] = 255 - data[i3 + 2];
    }
  };

  // node_modules/konva/lib/filters/Kaleidoscope.js
  var ToPolar = function(src, dst, opt) {
    const srcPixels = src.data, dstPixels = dst.data, xSize = src.width, ySize = src.height, xMid = opt.polarCenterX || xSize / 2, yMid = opt.polarCenterY || ySize / 2;
    let rMax = Math.sqrt(xMid * xMid + yMid * yMid);
    let x2 = xSize - xMid;
    let y3 = ySize - yMid;
    const rad = Math.sqrt(x2 * x2 + y3 * y3);
    rMax = rad > rMax ? rad : rMax;
    const rSize = ySize, tSize = xSize;
    const conversion = 360 / tSize * Math.PI / 180;
    for (let theta = 0; theta < tSize; theta += 1) {
      const sin = Math.sin(theta * conversion);
      const cos = Math.cos(theta * conversion);
      for (let radius = 0; radius < rSize; radius += 1) {
        x2 = Math.floor(xMid + rMax * radius / rSize * cos);
        y3 = Math.floor(yMid + rMax * radius / rSize * sin);
        let i3 = (y3 * xSize + x2) * 4;
        const r5 = srcPixels[i3 + 0];
        const g3 = srcPixels[i3 + 1];
        const b3 = srcPixels[i3 + 2];
        const a3 = srcPixels[i3 + 3];
        i3 = (theta + radius * xSize) * 4;
        dstPixels[i3 + 0] = r5;
        dstPixels[i3 + 1] = g3;
        dstPixels[i3 + 2] = b3;
        dstPixels[i3 + 3] = a3;
      }
    }
  };
  var FromPolar = function(src, dst, opt) {
    const srcPixels = src.data, dstPixels = dst.data, xSize = src.width, ySize = src.height, xMid = opt.polarCenterX || xSize / 2, yMid = opt.polarCenterY || ySize / 2;
    let rMax = Math.sqrt(xMid * xMid + yMid * yMid);
    let x2 = xSize - xMid;
    let y3 = ySize - yMid;
    const rad = Math.sqrt(x2 * x2 + y3 * y3);
    rMax = rad > rMax ? rad : rMax;
    const rSize = ySize, tSize = xSize, phaseShift = opt.polarRotation || 0;
    let x1, y1;
    for (x2 = 0; x2 < xSize; x2 += 1) {
      for (y3 = 0; y3 < ySize; y3 += 1) {
        const dx = x2 - xMid;
        const dy = y3 - yMid;
        const radius = Math.sqrt(dx * dx + dy * dy) * rSize / rMax;
        let theta = (Math.atan2(dy, dx) * 180 / Math.PI + 360 + phaseShift) % 360;
        theta = theta * tSize / 360;
        x1 = Math.floor(theta);
        y1 = Math.floor(radius);
        let i3 = (y1 * xSize + x1) * 4;
        const r5 = srcPixels[i3 + 0];
        const g3 = srcPixels[i3 + 1];
        const b3 = srcPixels[i3 + 2];
        const a3 = srcPixels[i3 + 3];
        i3 = (y3 * xSize + x2) * 4;
        dstPixels[i3 + 0] = r5;
        dstPixels[i3 + 1] = g3;
        dstPixels[i3 + 2] = b3;
        dstPixels[i3 + 3] = a3;
      }
    }
  };
  var Kaleidoscope = function(imageData) {
    const xSize = imageData.width, ySize = imageData.height;
    let x2, y3, xoff, i3, r5, g3, b3, a3, srcPos, dstPos;
    let power = Math.round(this.kaleidoscopePower());
    const angle = Math.round(this.kaleidoscopeAngle());
    const offset = Math.floor(xSize * (angle % 360) / 360);
    if (power < 1) {
      return;
    }
    const tempCanvas = Util.createCanvasElement();
    tempCanvas.width = xSize;
    tempCanvas.height = ySize;
    const scratchData = tempCanvas.getContext("2d").getImageData(0, 0, xSize, ySize);
    Util.releaseCanvas(tempCanvas);
    ToPolar(imageData, scratchData, {
      polarCenterX: xSize / 2,
      polarCenterY: ySize / 2
    });
    let minSectionSize = xSize / Math.pow(2, power);
    while (minSectionSize <= 8) {
      minSectionSize = minSectionSize * 2;
      power -= 1;
    }
    minSectionSize = Math.ceil(minSectionSize);
    let sectionSize = minSectionSize;
    let xStart = 0, xEnd = sectionSize, xDelta = 1;
    if (offset + minSectionSize > xSize) {
      xStart = sectionSize;
      xEnd = 0;
      xDelta = -1;
    }
    for (y3 = 0; y3 < ySize; y3 += 1) {
      for (x2 = xStart; x2 !== xEnd; x2 += xDelta) {
        xoff = Math.round(x2 + offset) % xSize;
        srcPos = (xSize * y3 + xoff) * 4;
        r5 = scratchData.data[srcPos + 0];
        g3 = scratchData.data[srcPos + 1];
        b3 = scratchData.data[srcPos + 2];
        a3 = scratchData.data[srcPos + 3];
        dstPos = (xSize * y3 + x2) * 4;
        scratchData.data[dstPos + 0] = r5;
        scratchData.data[dstPos + 1] = g3;
        scratchData.data[dstPos + 2] = b3;
        scratchData.data[dstPos + 3] = a3;
      }
    }
    for (y3 = 0; y3 < ySize; y3 += 1) {
      sectionSize = Math.floor(minSectionSize);
      for (i3 = 0; i3 < power; i3 += 1) {
        for (x2 = 0; x2 < sectionSize + 1; x2 += 1) {
          srcPos = (xSize * y3 + x2) * 4;
          r5 = scratchData.data[srcPos + 0];
          g3 = scratchData.data[srcPos + 1];
          b3 = scratchData.data[srcPos + 2];
          a3 = scratchData.data[srcPos + 3];
          dstPos = (xSize * y3 + sectionSize * 2 - x2 - 1) * 4;
          scratchData.data[dstPos + 0] = r5;
          scratchData.data[dstPos + 1] = g3;
          scratchData.data[dstPos + 2] = b3;
          scratchData.data[dstPos + 3] = a3;
        }
        sectionSize *= 2;
      }
    }
    FromPolar(scratchData, imageData, { polarRotation: 0 });
  };
  Factory.addGetterSetter(Node, "kaleidoscopePower", 2, getNumberValidator(), Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "kaleidoscopeAngle", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Mask.js
  function pixelAt(idata, x2, y3) {
    let idx = (y3 * idata.width + x2) * 4;
    const d2 = [];
    d2.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
    return d2;
  }
  function rgbDistance(p1, p22) {
    return Math.sqrt(Math.pow(p1[0] - p22[0], 2) + Math.pow(p1[1] - p22[1], 2) + Math.pow(p1[2] - p22[2], 2));
  }
  function rgbMean(pTab) {
    const m3 = [0, 0, 0];
    for (let i3 = 0; i3 < pTab.length; i3++) {
      m3[0] += pTab[i3][0];
      m3[1] += pTab[i3][1];
      m3[2] += pTab[i3][2];
    }
    m3[0] /= pTab.length;
    m3[1] /= pTab.length;
    m3[2] /= pTab.length;
    return m3;
  }
  function backgroundMask(idata, threshold) {
    const rgbv_no = pixelAt(idata, 0, 0);
    const rgbv_ne = pixelAt(idata, idata.width - 1, 0);
    const rgbv_so = pixelAt(idata, 0, idata.height - 1);
    const rgbv_se = pixelAt(idata, idata.width - 1, idata.height - 1);
    const thres = threshold || 10;
    if (rgbDistance(rgbv_no, rgbv_ne) < thres && rgbDistance(rgbv_ne, rgbv_se) < thres && rgbDistance(rgbv_se, rgbv_so) < thres && rgbDistance(rgbv_so, rgbv_no) < thres) {
      const mean = rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);
      const mask = [];
      for (let i3 = 0; i3 < idata.width * idata.height; i3++) {
        const d2 = rgbDistance(mean, [
          idata.data[i3 * 4],
          idata.data[i3 * 4 + 1],
          idata.data[i3 * 4 + 2]
        ]);
        mask[i3] = d2 < thres ? 0 : 255;
      }
      return mask;
    }
  }
  function applyMask(idata, mask) {
    for (let i3 = 0; i3 < idata.width * idata.height; i3++) {
      idata.data[4 * i3 + 3] = mask[i3];
    }
  }
  function erodeMask(mask, sw, sh) {
    const weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const maskResult = [];
    for (let y3 = 0; y3 < sh; y3++) {
      for (let x2 = 0; x2 < sw; x2++) {
        const so = y3 * sw + x2;
        let a3 = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y3 + cy - halfSide;
            const scx = x2 + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              const srcOff = scy * sw + scx;
              const wt = weights[cy * side + cx];
              a3 += mask[srcOff] * wt;
            }
          }
        }
        maskResult[so] = a3 === 255 * 8 ? 255 : 0;
      }
    }
    return maskResult;
  }
  function dilateMask(mask, sw, sh) {
    const weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const maskResult = [];
    for (let y3 = 0; y3 < sh; y3++) {
      for (let x2 = 0; x2 < sw; x2++) {
        const so = y3 * sw + x2;
        let a3 = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y3 + cy - halfSide;
            const scx = x2 + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              const srcOff = scy * sw + scx;
              const wt = weights[cy * side + cx];
              a3 += mask[srcOff] * wt;
            }
          }
        }
        maskResult[so] = a3 >= 255 * 4 ? 255 : 0;
      }
    }
    return maskResult;
  }
  function smoothEdgeMask(mask, sw, sh) {
    const weights = [
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9
    ];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const maskResult = [];
    for (let y3 = 0; y3 < sh; y3++) {
      for (let x2 = 0; x2 < sw; x2++) {
        const so = y3 * sw + x2;
        let a3 = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y3 + cy - halfSide;
            const scx = x2 + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              const srcOff = scy * sw + scx;
              const wt = weights[cy * side + cx];
              a3 += mask[srcOff] * wt;
            }
          }
        }
        maskResult[so] = a3;
      }
    }
    return maskResult;
  }
  var Mask = function(imageData) {
    const threshold = this.threshold();
    let mask = backgroundMask(imageData, threshold);
    if (mask) {
      mask = erodeMask(mask, imageData.width, imageData.height);
      mask = dilateMask(mask, imageData.width, imageData.height);
      mask = smoothEdgeMask(mask, imageData.width, imageData.height);
      applyMask(imageData, mask);
    }
    return imageData;
  };
  Factory.addGetterSetter(Node, "threshold", 0, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Noise.js
  var Noise = function(imageData) {
    const amount = this.noise() * 255, data = imageData.data, nPixels = data.length, half = amount / 2;
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      data[i3 + 0] += half - 2 * half * Math.random();
      data[i3 + 1] += half - 2 * half * Math.random();
      data[i3 + 2] += half - 2 * half * Math.random();
    }
  };
  Factory.addGetterSetter(Node, "noise", 0.2, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Pixelate.js
  var Pixelate = function(imageData) {
    let pixelSize = Math.ceil(this.pixelSize()), width = imageData.width, height = imageData.height, nBinsX = Math.ceil(width / pixelSize), nBinsY = Math.ceil(height / pixelSize), data = imageData.data;
    if (pixelSize <= 0) {
      Util.error("pixelSize value can not be <= 0");
      return;
    }
    for (let xBin = 0; xBin < nBinsX; xBin += 1) {
      for (let yBin = 0; yBin < nBinsY; yBin += 1) {
        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 0;
        const xBinStart = xBin * pixelSize;
        const xBinEnd = xBinStart + pixelSize;
        const yBinStart = yBin * pixelSize;
        const yBinEnd = yBinStart + pixelSize;
        let pixelsInBin = 0;
        for (let x2 = xBinStart; x2 < xBinEnd; x2 += 1) {
          if (x2 >= width) {
            continue;
          }
          for (let y3 = yBinStart; y3 < yBinEnd; y3 += 1) {
            if (y3 >= height) {
              continue;
            }
            const i3 = (width * y3 + x2) * 4;
            red += data[i3 + 0];
            green += data[i3 + 1];
            blue += data[i3 + 2];
            alpha += data[i3 + 3];
            pixelsInBin += 1;
          }
        }
        red = red / pixelsInBin;
        green = green / pixelsInBin;
        blue = blue / pixelsInBin;
        alpha = alpha / pixelsInBin;
        for (let x2 = xBinStart; x2 < xBinEnd; x2 += 1) {
          if (x2 >= width) {
            continue;
          }
          for (let y3 = yBinStart; y3 < yBinEnd; y3 += 1) {
            if (y3 >= height) {
              continue;
            }
            const i3 = (width * y3 + x2) * 4;
            data[i3 + 0] = red;
            data[i3 + 1] = green;
            data[i3 + 2] = blue;
            data[i3 + 3] = alpha;
          }
        }
      }
    }
  };
  Factory.addGetterSetter(Node, "pixelSize", 8, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/Posterize.js
  var Posterize = function(imageData) {
    const levels = Math.round(this.levels() * 254) + 1, data = imageData.data, len = data.length, scale = 255 / levels;
    for (let i3 = 0; i3 < len; i3 += 1) {
      data[i3] = Math.floor(data[i3] / scale) * scale;
    }
  };
  Factory.addGetterSetter(Node, "levels", 0.5, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/filters/RGB.js
  var RGB = function(imageData) {
    const data = imageData.data, nPixels = data.length, red = this.red(), green = this.green(), blue = this.blue();
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      const brightness = (0.34 * data[i3] + 0.5 * data[i3 + 1] + 0.16 * data[i3 + 2]) / 255;
      data[i3] = brightness * red;
      data[i3 + 1] = brightness * green;
      data[i3 + 2] = brightness * blue;
      data[i3 + 3] = data[i3 + 3];
    }
  };
  Factory.addGetterSetter(Node, "red", 0, function(val) {
    this._filterUpToDate = false;
    if (val > 255) {
      return 255;
    } else if (val < 0) {
      return 0;
    } else {
      return Math.round(val);
    }
  });
  Factory.addGetterSetter(Node, "green", 0, function(val) {
    this._filterUpToDate = false;
    if (val > 255) {
      return 255;
    } else if (val < 0) {
      return 0;
    } else {
      return Math.round(val);
    }
  });
  Factory.addGetterSetter(Node, "blue", 0, RGBComponent, Factory.afterSetFilter);

  // node_modules/konva/lib/filters/RGBA.js
  var RGBA = function(imageData) {
    const data = imageData.data, nPixels = data.length, red = this.red(), green = this.green(), blue = this.blue(), alpha = this.alpha();
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      const ia2 = 1 - alpha;
      data[i3] = red * alpha + data[i3] * ia2;
      data[i3 + 1] = green * alpha + data[i3 + 1] * ia2;
      data[i3 + 2] = blue * alpha + data[i3 + 2] * ia2;
    }
  };
  Factory.addGetterSetter(Node, "red", 0, function(val) {
    this._filterUpToDate = false;
    if (val > 255) {
      return 255;
    } else if (val < 0) {
      return 0;
    } else {
      return Math.round(val);
    }
  });
  Factory.addGetterSetter(Node, "green", 0, function(val) {
    this._filterUpToDate = false;
    if (val > 255) {
      return 255;
    } else if (val < 0) {
      return 0;
    } else {
      return Math.round(val);
    }
  });
  Factory.addGetterSetter(Node, "blue", 0, RGBComponent, Factory.afterSetFilter);
  Factory.addGetterSetter(Node, "alpha", 1, function(val) {
    this._filterUpToDate = false;
    if (val > 1) {
      return 1;
    } else if (val < 0) {
      return 0;
    } else {
      return val;
    }
  });

  // node_modules/konva/lib/filters/Sepia.js
  var Sepia = function(imageData) {
    const data = imageData.data, nPixels = data.length;
    for (let i3 = 0; i3 < nPixels; i3 += 4) {
      const r5 = data[i3 + 0];
      const g3 = data[i3 + 1];
      const b3 = data[i3 + 2];
      data[i3 + 0] = Math.min(255, r5 * 0.393 + g3 * 0.769 + b3 * 0.189);
      data[i3 + 1] = Math.min(255, r5 * 0.349 + g3 * 0.686 + b3 * 0.168);
      data[i3 + 2] = Math.min(255, r5 * 0.272 + g3 * 0.534 + b3 * 0.131);
    }
  };

  // node_modules/konva/lib/filters/Solarize.js
  var Solarize = function(imageData) {
    const threshold = 128;
    const d2 = imageData.data;
    for (let i3 = 0; i3 < d2.length; i3 += 4) {
      const r5 = d2[i3], g3 = d2[i3 + 1], b3 = d2[i3 + 2];
      const L2 = 0.2126 * r5 + 0.7152 * g3 + 0.0722 * b3;
      if (L2 >= threshold) {
        d2[i3] = 255 - r5;
        d2[i3 + 1] = 255 - g3;
        d2[i3 + 2] = 255 - b3;
      }
    }
    return imageData;
  };

  // node_modules/konva/lib/filters/Threshold.js
  var Threshold = function(imageData) {
    const level = this.threshold() * 255, data = imageData.data, len = data.length;
    for (let i3 = 0; i3 < len; i3 += 1) {
      data[i3] = data[i3] < level ? 0 : 255;
    }
  };
  Factory.addGetterSetter(Node, "threshold", 0.5, getNumberValidator(), Factory.afterSetFilter);

  // node_modules/konva/lib/_FullInternals.js
  var Konva3 = Konva2.Util._assign(Konva2, {
    Arc,
    Arrow,
    Circle,
    Ellipse,
    Image: Image2,
    Label,
    Tag,
    Line,
    Path,
    Rect,
    RegularPolygon,
    Ring,
    Sprite,
    Star,
    Text,
    TextPath,
    Transformer,
    Wedge,
    Filters: {
      Blur,
      Brightness,
      Brighten,
      Contrast,
      Emboss,
      Enhance,
      Grayscale,
      HSL,
      HSV,
      Invert,
      Kaleidoscope,
      Mask,
      Noise,
      Pixelate,
      Posterize,
      RGB,
      RGBA,
      Sepia,
      Solarize,
      Threshold
    }
  });

  // node_modules/konva/lib/index.js
  var lib_default = Konva3;

  // node_modules/mudlet-map-renderer/dist/flushSceneShapes-c7ttw7D-.js
  function t(e3) {
    let t5, n5, r5, i3 = e3.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (i3) t5 = parseInt(i3[1]) / 255, n5 = parseInt(i3[2]) / 255, r5 = parseInt(i3[3]) / 255;
    else if (e3.startsWith("#") && e3.length >= 7) t5 = parseInt(e3.slice(1, 3), 16) / 255, n5 = parseInt(e3.slice(3, 5), 16) / 255, r5 = parseInt(e3.slice(5, 7), 16) / 255;
    else return 0.5;
    return (Math.max(t5, n5, r5) + Math.min(t5, n5, r5)) / 2;
  }
  function n(e3) {
    let t5 = e3.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?/);
    if (t5) return {
      r: parseInt(t5[1]),
      g: parseInt(t5[2]),
      b: parseInt(t5[3]),
      a: t5[4] === void 0 ? void 0 : parseFloat(t5[4])
    };
    if (e3.startsWith("#") && e3.length >= 7) return {
      r: parseInt(e3.slice(1, 3), 16),
      g: parseInt(e3.slice(3, 5), 16),
      b: parseInt(e3.slice(5, 7), 16)
    };
  }
  function r(e3, t5, n5, r5) {
    return r5 === void 0 ? `rgb(${e3}, ${t5}, ${n5})` : `rgba(${e3}, ${t5}, ${n5}, ${r5})`;
  }
  function i(e3, t5) {
    let i3 = n(e3);
    return i3 ? r(Math.round(i3.r * (1 - t5)), Math.round(i3.g * (1 - t5)), Math.round(i3.b * (1 - t5)), i3.a) : e3;
  }
  function a(e3, t5) {
    let i3 = n(e3);
    return i3 ? r(Math.min(255, Math.round(i3.r + (255 - i3.r) * t5)), Math.min(255, Math.round(i3.g + (255 - i3.g) * t5)), Math.min(255, Math.round(i3.b + (255 - i3.b) * t5)), i3.a) : e3;
  }
  var o = {
    black: [
      0,
      0,
      0
    ],
    white: [
      255,
      255,
      255
    ],
    red: [
      255,
      0,
      0
    ],
    green: [
      0,
      128,
      0
    ],
    lime: [
      0,
      255,
      0
    ],
    blue: [
      0,
      0,
      255
    ],
    yellow: [
      255,
      255,
      0
    ],
    cyan: [
      0,
      255,
      255
    ],
    aqua: [
      0,
      255,
      255
    ],
    magenta: [
      255,
      0,
      255
    ],
    fuchsia: [
      255,
      0,
      255
    ],
    silver: [
      192,
      192,
      192
    ],
    gray: [
      128,
      128,
      128
    ],
    grey: [
      128,
      128,
      128
    ],
    maroon: [
      128,
      0,
      0
    ],
    olive: [
      128,
      128,
      0
    ],
    purple: [
      128,
      0,
      128
    ],
    teal: [
      0,
      128,
      128
    ],
    navy: [
      0,
      0,
      128
    ],
    orange: [
      255,
      165,
      0
    ],
    pink: [
      255,
      192,
      203
    ],
    gold: [
      255,
      215,
      0
    ],
    brown: [
      165,
      42,
      42
    ],
    violet: [
      238,
      130,
      238
    ],
    indigo: [
      75,
      0,
      130
    ],
    transparent: [
      0,
      0,
      0
    ]
  };
  function s(e3, t5) {
    let n5 = e3.trim();
    if (n5.startsWith("#")) {
      let r6, i4, a3;
      if (n5.length === 4) r6 = parseInt(n5[1] + n5[1], 16), i4 = parseInt(n5[2] + n5[2], 16), a3 = parseInt(n5[3] + n5[3], 16);
      else if (n5.length >= 7) r6 = parseInt(n5.slice(1, 3), 16), i4 = parseInt(n5.slice(3, 5), 16), a3 = parseInt(n5.slice(5, 7), 16);
      else return e3;
      return Number.isNaN(r6) || Number.isNaN(i4) || Number.isNaN(a3) ? e3 : `rgba(${r6}, ${i4}, ${a3}, ${t5})`;
    }
    let r5 = n5.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (r5) return `rgba(${parseInt(r5[1], 10)}, ${parseInt(r5[2], 10)}, ${parseInt(r5[3], 10)}, ${r5[4] === void 0 ? t5 : parseFloat(r5[4]) * t5})`;
    let i3 = o[n5.toLowerCase()];
    return i3 ? `rgba(${i3[0]}, ${i3[1]}, ${i3[2]}, ${t5})` : e3;
  }
  var c = "system.fallback_hidden";
  var l = "room.ui_borderColor";
  var u = "room.ui_borderThickness";
  function d(e3) {
    let t5 = e3.userData?.[c];
    return typeof t5 == "string" && t5.toLowerCase() === "true";
  }
  function f(e3) {
    let t5 = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{6})$/.exec(e3.trim());
    if (!t5) return e3;
    let [, n5, r5] = t5;
    return n5.toLowerCase() === "ff" ? `#${r5}` : `#${r5}${n5}`;
  }
  function p(e3) {
    let t5 = e3.userData?.[l];
    return t5 ? f(t5) : void 0;
  }
  var m = 0.35;
  function h(e3, t5) {
    return d(e3) ? t5 === "faded" ? { fade: m } : t5 === "dashed" ? { dashedBorder: true } : {} : {};
  }
  function g(e3) {
    let t5 = e3.userData?.[u];
    if (t5 === void 0) return;
    let n5 = parseInt(t5, 10);
    if (Number.isFinite(n5)) return Math.min(10, Math.max(1, n5));
  }
  var _ = class {
    constructor(e3) {
      this.listeners = /* @__PURE__ */ new Map(), this.container = e3;
    }
    on(e3, t5) {
      let n5 = this.listeners.get(e3);
      n5 || (n5 = /* @__PURE__ */ new Set(), this.listeners.set(e3, n5)), n5.add(t5);
    }
    off(e3, t5) {
      this.listeners.get(e3)?.delete(t5);
    }
    removeAllListeners() {
      this.listeners.clear();
    }
    emit(e3, t5) {
      this.listeners.get(e3)?.forEach((e4) => e4(t5)), this.container && this.container.dispatchEvent(new CustomEvent(e3, { detail: t5 }));
    }
  };
  var v = {
    isVisible: () => true,
    getVersion: () => 0
  };
  function y(e3, t5, n5, r5) {
    let i3 = e3.isVisible(n5), a3 = e3.isVisible(r5);
    return i3 && a3 ? "full" : i3 || a3 ? "stub" : "hidden";
  }
  function ee(e3) {
    return e3 < 0.5 ? 2 * e3 * e3 : -1 + (4 - 2 * e3) * e3;
  }
  var b = class e extends _ {
    constructor(e3, t5) {
      super(), this.zoom = 1, this.minZoom = 0.05, this.position = {
        x: 0,
        y: 0
      }, this.centerOnResize = true, this.dragging = false, this.dragStart = {
        x: 0,
        y: 0
      }, this.positionAtDragStart = {
        x: 0,
        y: 0
      }, this.batchDepth = 0, this.batchDirty = false, this.width = e3, this.height = t5;
    }
    getScale() {
      return 75 * this.zoom;
    }
    setZoom(e3) {
      let t5 = Math.max(this.minZoom, e3);
      return this.zoom === t5 ? false : (this.zoom = t5, this.notify(), true);
    }
    zoomToCenter(e3) {
      let t5 = Math.max(this.minZoom, e3);
      if (this.zoom === t5) return false;
      let n5 = this.getScale(), r5 = this.width / 2, i3 = this.height / 2, a3 = {
        x: (r5 - this.position.x) / n5,
        y: (i3 - this.position.y) / n5
      };
      this.zoom = t5;
      let o3 = this.getScale();
      return this.position = {
        x: r5 - a3.x * o3,
        y: i3 - a3.y * o3
      }, this.notify(), true;
    }
    zoomToPoint(e3, t5, n5) {
      let r5 = this.getScale(), i3 = {
        x: (t5 - this.position.x) / r5,
        y: (n5 - this.position.y) / r5
      }, a3 = Math.max(this.minZoom, e3);
      if (this.zoom === a3) return false;
      this.zoom = a3;
      let o3 = this.getScale();
      return this.position = {
        x: t5 - i3.x * o3,
        y: n5 - i3.y * o3
      }, this.notify(), true;
    }
    getViewportBounds() {
      let e3 = this.getScale();
      return {
        minX: (0 - this.position.x) / e3,
        maxX: (this.width - this.position.x) / e3,
        minY: (0 - this.position.y) / e3,
        maxY: (this.height - this.position.y) / e3
      };
    }
    getCullingViewport(e3) {
      if (!e3) return this.getViewportBounds();
      let t5 = this.getScale(), n5 = this.position;
      return {
        minX: (e3.x - n5.x) / t5,
        maxX: (e3.x + e3.width - n5.x) / t5,
        minY: (e3.y - n5.y) / t5,
        maxY: (e3.y + e3.height - n5.y) / t5
      };
    }
    static forMapBounds(t5, n5, r5, i3) {
      let a3 = new e((n5 - t5) * 75, (i3 - r5) * 75);
      return a3.zoom = 1, a3.position = {
        x: -t5 * 75,
        y: -r5 * 75
      }, a3;
    }
    static forRenderCamera(t5, n5, r5, i3, a3) {
      let o3 = new e(t5, n5);
      return o3.zoom = r5 / 75, o3.position = {
        x: i3,
        y: a3
      }, o3;
    }
    clientToMapPoint(e3, t5, n5) {
      let r5 = e3 - (n5?.left ?? 0), i3 = t5 - (n5?.top ?? 0), a3 = this.getScale();
      return a3 ? {
        x: (r5 - this.position.x) / a3,
        y: (i3 - this.position.y) / a3
      } : null;
    }
    panToMapPoint(e3, t5) {
      let n5 = this.getScale();
      this.position = {
        x: this.width / 2 - e3 * n5,
        y: this.height / 2 - t5 * n5
      }, this.notify();
    }
    panToMapPointAnimated(e3, t5, n5) {
      if (n5) {
        this.panToMapPoint(e3, t5);
        return;
      }
      let r5 = { ...this.position }, i3 = this.getScale(), a3 = {
        x: this.width / 2 - e3 * i3,
        y: this.height / 2 - t5 * i3
      };
      this.animate(200, (e4) => {
        this.position = {
          x: r5.x + (a3.x - r5.x) * e4,
          y: r5.y + (a3.y - r5.y) * e4
        };
      });
    }
    computeFitZoom(e3, t5, n5, r5, i3) {
      let a3 = t5 - e3, o3 = r5 - n5;
      if (a3 <= 0 || o3 <= 0) return this.zoom;
      let s4 = i3?.top ?? 0, c4 = i3?.right ?? 0, l4 = i3?.bottom ?? 0, u4 = i3?.left ?? 0, d2 = Math.max(1, this.width - u4 - c4), f3 = Math.max(1, this.height - s4 - l4), p3 = d2 / ((a3 + 4) * 75), m3 = f3 / ((o3 + 4) * 75);
      return Math.min(p3, m3);
    }
    fitToMapBounds(e3, t5, n5, r5, i3) {
      let a3 = t5 - e3, o3 = r5 - n5;
      if (a3 <= 0 || o3 <= 0) return;
      let s4 = i3?.top ?? 0, c4 = i3?.left ?? 0, l4 = Math.max(1, this.width - c4 - (i3?.right ?? 0)), u4 = Math.max(1, this.height - s4 - (i3?.bottom ?? 0));
      this.zoom = this.computeFitZoom(e3, t5, n5, r5, i3), this.minZoom = this.zoom;
      let d2 = this.getScale(), f3 = (e3 + t5) / 2, p3 = (n5 + r5) / 2;
      this.position = {
        x: c4 + l4 / 2 - f3 * d2,
        y: s4 + u4 / 2 - p3 * d2
      }, this.notify();
    }
    setSize(e3, t5) {
      this.width = e3, this.height = t5, this.notify();
    }
    startDrag(e3, t5) {
      this.cancelAnimation(), this.dragging = true, this.dragStart = {
        x: e3,
        y: t5
      }, this.positionAtDragStart = { ...this.position };
    }
    updateDrag(e3, t5) {
      this.dragging && (this.position = {
        x: this.positionAtDragStart.x + (e3 - this.dragStart.x),
        y: this.positionAtDragStart.y + (t5 - this.dragStart.y)
      }, this.notify());
    }
    endDrag() {
      this.dragging = false;
    }
    isDragging() {
      return this.dragging;
    }
    animate(e3, t5) {
      this.cancelAnimation();
      let n5 = performance.now(), r5 = typeof requestAnimationFrame < "u" ? requestAnimationFrame : (e4) => setTimeout(() => e4(performance.now()), 16), i3 = (a3) => {
        let o3 = a3 - n5, s4 = Math.min(o3 / e3, 1);
        t5(ee(s4)), this.notify(), s4 < 1 ? this.animationId = r5(i3) : this.animationId = void 0;
      };
      this.animationId = r5(i3);
    }
    cancelAnimation() {
      this.animationId !== void 0 && ((typeof cancelAnimationFrame < "u" ? cancelAnimationFrame : (e3) => clearTimeout(e3))(this.animationId), this.animationId = void 0);
    }
    isAnimating() {
      return this.animationId !== void 0;
    }
    batch(e3) {
      this.batchDepth++;
      try {
        return e3();
      } finally {
        this.batchDepth--, this.batchDepth === 0 && this.batchDirty && (this.batchDirty = false, this.emit("change", void 0));
      }
    }
    notify() {
      if (this.batchDepth > 0) {
        this.batchDirty = true;
        return;
      }
      this.emit("change", void 0);
    }
  };
  var x = (e3, t5) => ({
    x: e3,
    y: t5
  });
  var S = class {
    constructor(e3, t5) {
      this.settings = e3, this.onCullingNeeded = t5, this.cullingScheduled = false, this.coordinateTransform = x;
    }
    setCoordinateTransform(e3) {
      this.coordinateTransform = e3;
    }
    getCoordinateTransform() {
      return this.coordinateTransform;
    }
    scheduleCulling() {
      if (this.cullingScheduled) return;
      this.cullingScheduled = true;
      let e3 = () => {
        this.cullingScheduled = false, this.onCullingNeeded();
      };
      typeof requestAnimationFrame < "u" ? requestAnimationFrame(e3) : e3();
    }
    updateCulling() {
      this.onCullingNeeded();
    }
  };
  var C = [
    "north",
    "south",
    "east",
    "west",
    "northeast",
    "northwest",
    "southeast",
    "southwest"
  ];
  var w = {
    n: "north",
    s: "south",
    e: "east",
    w: "west",
    ne: "northeast",
    nw: "northwest",
    se: "southeast",
    sw: "southwest"
  };
  var T = {
    north: "n",
    south: "s",
    east: "e",
    west: "w",
    northeast: "ne",
    northwest: "nw",
    southeast: "se",
    southwest: "sw",
    up: "u",
    down: "d",
    in: "i",
    out: "o"
  };
  var E = {
    north: {
      x: 0,
      y: -1
    },
    south: {
      x: 0,
      y: 1
    },
    east: {
      x: 1,
      y: 0
    },
    west: {
      x: -1,
      y: 0
    },
    northeast: {
      x: 1,
      y: -1
    },
    northwest: {
      x: -1,
      y: -1
    },
    southeast: {
      x: 1,
      y: 1
    },
    southwest: {
      x: -1,
      y: 1
    }
  };
  var D = [
    "north",
    "south",
    "east",
    "west",
    "northeast",
    "northwest",
    "southeast",
    "southwest"
  ];
  var O = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
    northeast: "southwest",
    northwest: "southeast",
    southeast: "northwest",
    southwest: "northeast"
  };
  function k(e3) {
    return e3 ? Object.prototype.hasOwnProperty.call(E, e3) : false;
  }
  function A(e3, t5, n5, r5 = 1) {
    if (!k(n5)) return {
      x: e3,
      y: t5
    };
    let i3 = E[n5];
    return {
      x: e3 + i3.x * r5,
      y: t5 + i3.y * r5
    };
  }
  function j(e3, t5, n5, r5 = 1, i3 = 0) {
    if (!k(n5)) return {
      x: e3,
      y: t5
    };
    let a3 = E[n5];
    if (!(a3.x !== 0 && a3.y !== 0) || i3 <= 0) return A(e3, t5, n5, r5);
    let o3 = r5 - i3 + i3 / Math.SQRT2;
    return {
      x: e3 + a3.x * o3,
      y: t5 + a3.y * o3
    };
  }
  function M(e3, t5, n5, r5 = 1) {
    if (!k(n5)) return {
      x: e3,
      y: t5
    };
    let i3 = E[n5], a3 = Math.atan2(i3.y, i3.x);
    return {
      x: e3 + Math.cos(a3) * r5,
      y: t5 + Math.sin(a3) * r5
    };
  }
  var N = {
    OPEN_DOOR: "rgb(10, 155, 10)",
    CLOSED_DOOR: "rgb(226, 205, 59)",
    LOCKED_DOOR: "rgb(155, 10, 10)",
    ONE_WAY_FILL: "rgb(155, 10, 10)"
  };
  function P(e3) {
    switch (e3) {
      case 1:
        return N.OPEN_DOOR;
      case 2:
        return N.CLOSED_DOOR;
      default:
        return N.LOCKED_DOOR;
    }
  }
  var F = class {
    constructor(e3, t5) {
      this.mapReader = e3, this.settings = t5;
    }
    getRoomEdgePoint(e3, t5, n5, r5) {
      let i3 = r5 - (this.settings.borders ? this.settings.lineWidth / 2 : 0);
      return this.settings.roomShape === "circle" ? M(e3, t5, n5, i3) : this.settings.roomShape === "roundedRectangle" ? j(e3, t5, n5, i3, this.settings.roomSize * 0.2) : A(e3, t5, n5, i3);
    }
    renderData(e3, t5) {
      return this.renderDataWithColor(e3, this.settings.lineColor, t5);
    }
    renderDataWithColor(e3, t5, n5) {
      let r5 = e3.aDir && C.includes(e3.aDir), i3 = e3.bDir && C.includes(e3.bDir);
      if (r5 && i3) return this.renderTwoWayExitData(e3, t5, n5);
      if (r5 || i3) {
        let n6 = r5 ? "a" : "b";
        return this.renderOneWayExitData(e3, t5, n6);
      }
    }
    renderTwoWayExitData(e3, t5, n5) {
      let r5 = this.mapReader.getRoom(e3.a), i3 = this.mapReader.getRoom(e3.b);
      if (!r5 || !i3 || !e3.aDir || !e3.bDir || r5.customLines[T[e3.aDir]] && i3.customLines[T[e3.bDir]] || r5.z !== i3.z && (n5 !== i3.z && r5.customLines[T[e3.aDir]] || n5 !== r5.z && i3.customLines[T[e3.bDir]])) return;
      let a3 = this.getRoomEdgePoint(r5.x, r5.y, e3.aDir, this.settings.roomSize / 2), o3 = this.getRoomEdgePoint(i3.x, i3.y, e3.bDir, this.settings.roomSize / 2), s4 = [
        a3.x,
        a3.y,
        o3.x,
        o3.y
      ], c4 = [{
        points: s4,
        stroke: t5,
        strokeWidth: this.settings.lineWidth
      }], l4 = [], u4 = r5.doors[T[e3.aDir]] ?? i3.doors[T[e3.bDir]];
      if (u4) {
        let e4 = s4[0] + (s4[2] - s4[0]) / 2, t6 = s4[1] + (s4[3] - s4[1]) / 2;
        l4.push({
          x: e4 - this.settings.roomSize / 4,
          y: t6 - this.settings.roomSize / 4,
          width: this.settings.roomSize / 2,
          height: this.settings.roomSize / 2,
          stroke: P(u4),
          strokeWidth: this.settings.lineWidth
        });
      }
      let d2 = Math.min(s4[0], s4[2]), f3 = Math.max(s4[0], s4[2]), p3 = Math.min(s4[1], s4[3]), m3 = Math.max(s4[1], s4[3]), h3 = (r5.z === i3.z ? void 0 : r5.z === n5 ? i3.id : r5.id) ?? (r5.area === i3.area ? void 0 : i3.id), g3 = h3 === void 0 ? {} : {
        from: {
          x: r5.x,
          y: r5.y
        },
        tip: {
          x: o3.x,
          y: o3.y
        },
        arrowColor: this.mapReader.getColorValue(i3.env)
      };
      return {
        lines: c4,
        arrows: [],
        doors: l4,
        bounds: {
          x: d2,
          y: p3,
          width: f3 - d2,
          height: m3 - p3
        },
        targetRoomId: h3,
        ...g3
      };
    }
    renderOneWayExitData(e3, t5, n5) {
      let r5 = n5 === "a" || !n5 && e3.aDir, i3 = r5 ? this.mapReader.getRoom(e3.a) : this.mapReader.getRoom(e3.b), a3 = r5 ? this.mapReader.getRoom(e3.b) : this.mapReader.getRoom(e3.a), o3 = r5 ? e3.aDir : e3.bDir;
      if (!o3 || !i3 || !a3 || !C.includes(o3) || i3.customLines[T[o3] || o3]) return;
      if (i3.area != a3.area && o3) {
        let e4 = this.mapReader.getColorValue(a3.env), t6 = this.getRoomEdgePoint(i3.x, i3.y, o3, this.settings.roomSize / 2), n6 = A(i3.x, i3.y, o3, this.settings.roomSize * 1.5), r6 = e4;
        return {
          lines: [],
          arrows: [{
            points: [
              t6.x,
              t6.y,
              n6.x,
              n6.y
            ],
            pointerLength: 0.3,
            pointerWidth: 0.3,
            strokeWidth: this.settings.lineWidth * 1.4,
            stroke: r6,
            fill: r6
          }],
          doors: [],
          bounds: {
            x: Math.min(t6.x, n6.x),
            y: Math.min(t6.y, n6.y),
            width: Math.abs(n6.x - t6.x),
            height: Math.abs(n6.y - t6.y)
          },
          targetRoomId: a3.id,
          from: {
            x: i3.x,
            y: i3.y
          },
          tip: {
            x: n6.x,
            y: n6.y
          },
          arrowColor: r6
        };
      }
      let s4 = a3.area !== i3.area || a3.z !== i3.z, c4 = {
        x: a3.x,
        y: a3.y
      };
      s4 && (c4 = A(i3.x, i3.y, o3, this.settings.roomSize / 2));
      let l4 = A(i3.x, i3.y, o3, 0.3), u4 = l4.x - (l4.x - c4.x) / 2, d2 = l4.y - (l4.y - c4.y) / 2, f3 = this.getRoomEdgePoint(i3.x, i3.y, o3, this.settings.roomSize / 2), p3 = [
        f3.x,
        f3.y,
        c4.x,
        c4.y
      ], m3 = [
        f3.x,
        c4.x,
        u4
      ], h3 = [
        f3.y,
        c4.y,
        d2
      ], g3 = Math.min(...m3), _3 = Math.max(...m3), v3 = Math.min(...h3), y3 = Math.max(...h3);
      return {
        lines: [{
          points: p3,
          stroke: t5,
          strokeWidth: this.settings.lineWidth,
          dash: [0.1, 0.05]
        }],
        arrows: [{
          points: [
            p3[0],
            p3[1],
            u4,
            d2
          ],
          pointerLength: 0.5,
          pointerWidth: 0.35,
          strokeWidth: this.settings.lineWidth * 1.4,
          stroke: t5,
          fill: N.ONE_WAY_FILL,
          dash: [0.1, 0.05]
        }],
        doors: [],
        bounds: {
          x: g3,
          y: v3,
          width: _3 - g3,
          height: y3 - v3
        },
        ...s4 ? { targetRoomId: a3.id } : {}
      };
    }
    getInnerExitAreaTargets(e3) {
      let t5 = [
        "up",
        "down",
        "in",
        "out"
      ], n5 = this.settings.roomSize, r5 = [];
      for (let i3 of t5) {
        let t6 = e3.exits[i3];
        if (t6 === void 0) continue;
        let a3 = this.mapReader.getRoom(t6);
        !a3 || a3.area === e3.area || r5.push({
          bounds: {
            x: e3.x - n5 / 4,
            y: e3.y - n5 / 4,
            width: n5 / 2,
            height: n5 / 2
          },
          targetRoomId: t6,
          from: {
            x: e3.x,
            y: e3.y
          },
          tip: {
            x: e3.x,
            y: e3.y
          },
          arrowColor: this.mapReader.getColorValue(a3.env)
        });
      }
      return r5;
    }
    getSpecialExitAreaTargets(e3) {
      let t5 = [], n5 = {
        u: "up",
        d: "down",
        i: "in",
        o: "out"
      };
      for (let [r5, i3] of Object.entries(e3.customLines)) {
        let a3 = e3.specialExits[r5];
        if (a3 === void 0) {
          let t6 = w[r5] ?? n5[r5];
          t6 && (a3 = e3.exits[t6] ?? e3.specialExits[t6]);
        }
        if (a3 === void 0 && (a3 = e3.exits[r5] ?? e3.specialExits[r5]), a3 === void 0) continue;
        let o3 = this.mapReader.getRoom(a3);
        if (!o3 || o3.area === e3.area && o3.z === e3.z) continue;
        let s4 = [e3.x, e3.y];
        i3.points.reduce((e4, t6) => (e4.push(t6.x, -t6.y), e4), s4);
        let c4 = Infinity, l4 = Infinity, u4 = -Infinity, d2 = -Infinity;
        for (let e4 = 0; e4 < s4.length; e4 += 2) c4 = Math.min(c4, s4[e4]), u4 = Math.max(u4, s4[e4]), l4 = Math.min(l4, s4[e4 + 1]), d2 = Math.max(d2, s4[e4 + 1]);
        let f3 = s4.length - 2, p3 = {
          x: s4[f3],
          y: s4[f3 + 1]
        };
        t5.push({
          bounds: {
            x: c4,
            y: l4,
            width: u4 - c4,
            height: d2 - l4
          },
          targetRoomId: a3,
          from: {
            x: e3.x,
            y: e3.y
          },
          tip: p3,
          arrowColor: this.mapReader.getColorValue(o3.env)
        });
      }
      return t5;
    }
  };
  var te = {
    1: "north",
    2: "northeast",
    3: "northwest",
    4: "east",
    5: "west",
    6: "south",
    7: "southeast",
    8: "southwest",
    9: "up",
    10: "down",
    11: "in",
    12: "out"
  };
  function ne(e3, t5, n5, r5, i3) {
    return e3.roomShape === "circle" ? M(t5, n5, r5, i3) : e3.roomShape === "roundedRectangle" ? j(t5, n5, r5, i3, e3.roomSize * 0.2) : A(t5, n5, r5, i3);
  }
  function re(e3, t5, n5) {
    let r5 = [];
    for (let i3 of e3.stubs) {
      let a3 = te[i3];
      if (!a3) continue;
      let o3 = ne(t5, e3.x, e3.y, a3, t5.roomSize / 2), s4 = A(e3.x, e3.y, a3, t5.roomSize / 2 + 0.5);
      r5.push({
        roomId: e3.id,
        direction: a3,
        x1: o3.x,
        y1: o3.y,
        x2: s4.x,
        y2: s4.y,
        stroke: n5 ?? t5.lineColor,
        strokeWidth: t5.lineWidth
      });
    }
    return r5;
  }
  var ie = {
    1: "rgb(10, 155, 10)",
    2: "rgb(226, 205, 59)",
    3: "rgb(155, 10, 10)"
  };
  function I(e3, t5, n5) {
    let r5 = [];
    for (let [i3, a3] of Object.entries(e3.customLines)) {
      let o3 = [e3.x, e3.y];
      for (let e4 of a3.points) o3.push(e4.x, -e4.y);
      let s4 = n5 ?? `rgb(${a3.attributes.color.r}, ${a3.attributes.color.g}, ${a3.attributes.color.b})`, c4;
      a3.attributes.style === "dot line" ? c4 = [0.05, 0.05] : a3.attributes.style === "dash line" ? c4 = [0.4, 0.2] : a3.attributes.style === "dash dot line" ? c4 = [
        0.4,
        0.15,
        0.05,
        0.15
      ] : a3.attributes.style === "dash dot dot line" && (c4 = [
        0.4,
        0.15,
        0.05,
        0.15,
        0.05,
        0.15
      ]);
      let l4 = {
        points: o3,
        stroke: s4,
        strokeWidth: t5.lineWidth,
        dash: c4
      }, u4;
      if (a3.attributes.arrow && o3.length >= 4) {
        let e4 = o3.length - 2, n6 = o3[e4], r6 = o3[e4 + 1], i4 = o3[e4 - 2], a4 = o3[e4 - 1], c5 = Math.atan2(r6 - a4, n6 - i4), l5 = 0.3, d3 = 0.1;
        u4 = {
          tipX: n6,
          tipY: r6,
          x1: n6 - l5 * Math.cos(c5 - Math.atan2(d3, l5)),
          y1: r6 - l5 * Math.sin(c5 - Math.atan2(d3, l5)),
          x2: n6 - l5 * Math.cos(c5 + Math.atan2(d3, l5)),
          y2: r6 - l5 * Math.sin(c5 + Math.atan2(d3, l5)),
          fill: s4,
          stroke: s4,
          strokeWidth: t5.lineWidth
        };
      }
      let d2, f3 = e3.doors[i3];
      if (f3 && o3.length >= 4) {
        let e4 = o3[0] + (o3[2] - o3[0]) / 2, n6 = o3[1] + (o3[3] - o3[1]) / 2, r6 = t5.roomSize / 2;
        d2 = {
          x: e4 - r6 / 2,
          y: n6 - r6 / 2,
          width: r6,
          height: r6,
          stroke: ie[f3] ?? ie[3],
          strokeWidth: t5.lineWidth
        };
      }
      r5.push({
        dir: i3,
        line: l4,
        arrow: u4,
        door: d2
      });
    }
    return r5;
  }
  var L = 72;
  var R = 200;
  var z = 120;
  var B = /* @__PURE__ */ new Map();
  var V = null;
  function ae() {
    return V || (V = lib_default.Util.createCanvasElement(), V.width = R, V.height = R), V;
  }
  function oe(e3, t5) {
    let n5 = `${e3}::${t5}`, r5 = B.get(n5);
    if (r5 !== void 0) return r5;
    let i3 = ae().getContext("2d", { willReadFrequently: true }), a3 = `bold ${L}px ${t5}`;
    i3.clearRect(0, 0, R, R), i3.font = a3, i3.textBaseline = "alphabetic", i3.textAlign = "center", i3.fillStyle = "#ffffff", i3.fillText(e3, R / 2, z);
    let { data: o3 } = i3.getImageData(0, 0, R, R), s4 = R, c4 = -1;
    for (let e4 = 0; e4 < R; e4++) for (let t6 = 0; t6 < R; t6++) o3[(e4 * R + t6) * 4 + 3] > 16 && (e4 < s4 && (s4 = e4), e4 > c4 && (c4 = e4));
    if (c4 === -1) {
      let e4 = {
        baselineRatio: 0.35,
        konvaCorrectionRatio: 0
      };
      return B.set(n5, e4), e4;
    }
    let l4 = (z - s4 - Math.max(0, c4 - z)) / 2 / L, u4 = i3.measureText("M"), d2 = {
      baselineRatio: l4,
      konvaCorrectionRatio: ((u4.fontBoundingBoxAscent ?? u4.actualBoundingBoxAscent ?? 0) - (u4.fontBoundingBoxDescent ?? u4.actualBoundingBoxDescent ?? 0)) / 2 / L - l4
    };
    return B.set(n5, d2), d2;
  }
  function se(e3, t5, n5, r5) {
    let o3 = t5.getColorValue(e3.env), s4 = n5.coloredMode ? i(o3, 0.5) : n5.frameMode ? n5.backgroundColor : o3, c4 = n5.coloredMode ? a(o3, 0.1) : o3, l4 = r5 ? n5.frameMode || n5.coloredMode ? c4 : r5 : n5.frameMode || n5.coloredMode ? c4 : n5.lineColor, u4 = n5.borders ? n5.lineWidth : 0, d2 = p(e3), f3 = g(e3);
    d2 && (l4 = d2), f3 === void 0 ? d2 && u4 === 0 && (u4 = n5.lineWidth) : u4 = n5.lineWidth * f3;
    let m3 = e3.userData?.["system.fallback_symbol_color"] ?? (n5.frameMode || n5.coloredMode ? c4 : t5.getSymbolColor(e3.env));
    return {
      fillColor: s4,
      strokeColor: l4,
      borderWidth: u4,
      symbolColor: m3,
      envColor: o3,
      customBorder: d2 !== void 0
    };
  }
  function ce(e3, t5) {
    if (!t5.emboss) return null;
    let n5 = t5.roomSize, r5 = t5.borders ? t5.lineWidth / 2 : 0, o3 = t5.lineWidth, s4 = a(e3, 0.35), c4 = i(e3, 0.45);
    if (t5.roomShape === "circle") {
      let e4 = n5 / 2, t6 = n5 / 2, i3 = n5 / 2 - r5, a3 = [];
      for (let n6 = 0; n6 <= 48; n6++) {
        let r6 = n6 / 48 * 360 * Math.PI / 180;
        a3.push(e4 + Math.cos(r6) * i3, t6 + Math.sin(r6) * i3);
      }
      let l4 = [];
      for (let n6 = 0; n6 <= 19; n6++) {
        let r6 = (200 + n6 / 19 * 140) * Math.PI / 180;
        l4.push(e4 + Math.cos(r6) * i3, t6 + Math.sin(r6) * i3);
      }
      return {
        shadow: {
          points: a3,
          stroke: c4,
          strokeWidth: o3,
          lineCap: "round",
          lineJoin: "round"
        },
        highlight: {
          points: l4,
          stroke: s4,
          strokeWidth: o3,
          lineCap: "round",
          lineJoin: "round"
        }
      };
    }
    if (t5.roomShape === "roundedRectangle") {
      let e4 = (n5 - r5 * 2) * 0.2, t6 = r5, i3 = r5, a3 = n5 - r5, l4 = n5 - r5, u4 = [];
      for (let n6 = 0; n6 <= 10 / 2; n6++) {
        let r6 = (135 + n6 / (10 / 2) * 45) * Math.PI / 180;
        u4.push(t6 + e4 + Math.cos(r6) * e4, l4 - e4 + Math.sin(r6) * e4);
      }
      for (let n6 = 1; n6 <= 10; n6++) {
        let r6 = (180 + n6 / 10 * 90) * Math.PI / 180;
        u4.push(t6 + e4 + Math.cos(r6) * e4, i3 + e4 + Math.sin(r6) * e4);
      }
      for (let t7 = 1; t7 <= 10 / 2; t7++) {
        let n6 = (270 + t7 / (10 / 2) * 45) * Math.PI / 180;
        u4.push(a3 - e4 + Math.cos(n6) * e4, i3 + e4 + Math.sin(n6) * e4);
      }
      let d2 = u4.slice(), f3 = [];
      for (let t7 = 0; t7 <= 10 / 2; t7++) {
        let n6 = (315 + t7 / (10 / 2) * 45) * Math.PI / 180;
        f3.push(a3 - e4 + Math.cos(n6) * e4, i3 + e4 + Math.sin(n6) * e4);
      }
      for (let t7 = 1; t7 <= 10; t7++) {
        let n6 = t7 / 10 * 90 * Math.PI / 180;
        f3.push(a3 - e4 + Math.cos(n6) * e4, l4 - e4 + Math.sin(n6) * e4);
      }
      for (let n6 = 1; n6 <= 10 / 2; n6++) {
        let r6 = (90 + n6 / (10 / 2) * 45) * Math.PI / 180;
        f3.push(t6 + e4 + Math.cos(r6) * e4, l4 - e4 + Math.sin(r6) * e4);
      }
      return {
        highlight: {
          points: d2,
          stroke: s4,
          strokeWidth: o3,
          lineCap: "round",
          lineJoin: "round"
        },
        shadow: {
          points: f3,
          stroke: c4,
          strokeWidth: o3,
          lineCap: "round",
          lineJoin: "round"
        }
      };
    }
    return {
      highlight: {
        points: [
          r5,
          n5 - r5,
          r5,
          r5,
          n5 - r5,
          r5
        ],
        stroke: s4,
        strokeWidth: o3
      },
      shadow: {
        points: [
          r5,
          n5 - r5,
          n5 - r5,
          n5 - r5,
          n5 - r5,
          r5
        ],
        stroke: c4,
        strokeWidth: o3
      }
    };
  }
  function H(e3, t5, n5, r5) {
    let a3 = se(e3, t5, n5, r5.strokeOverride), o3 = r5.fade, c4 = o3 === void 0 ? a3.fillColor : s(a3.fillColor, o3), l4 = o3 === void 0 ? a3.strokeColor : s(a3.strokeColor, o3), u4 = o3 === void 0 ? a3.symbolColor : s(a3.symbolColor, o3), d2 = a3.borderWidth, f3 = n5.roomSize, p3 = [], m3 = r5.dashedBorder ?? false, h3 = a3.customBorder || m3 ? null : ce(c4, n5), g3 = h3 ? 0 : d2;
    m3 && g3 === 0 && (g3 = n5.lineWidth);
    let _3 = m3 ? [Math.max(f3 * 0.32, n5.lineWidth * 4), Math.max(f3 * 0.13, n5.lineWidth * 1.5)] : void 0, v3 = !m3 && n5.coloredMode && g3 > 0 && r5.flatPipeline, y3 = (e4) => n5.roomShape === "roundedRectangle" ? Math.max(0, (f3 - 2 * e4) * 0.2) : 0;
    if (v3) {
      let e4 = [i(l4, 0.5), l4], t6 = d2 * 2;
      n5.roomShape === "circle" ? p3.push({
        type: "circle",
        cx: f3 / 2,
        cy: f3 / 2,
        radius: f3 / 2 - t6,
        paint: { fill: c4 }
      }) : p3.push({
        type: "rect",
        x: t6,
        y: t6,
        width: f3 - t6 * 2,
        height: f3 - t6 * 2,
        cornerRadius: y3(t6),
        paint: { fill: c4 }
      });
      for (let t7 = 0; t7 < e4.length; t7++) {
        let r6 = d2 / 2 + t7 * d2;
        n5.roomShape === "circle" ? p3.push({
          type: "circle",
          cx: f3 / 2,
          cy: f3 / 2,
          radius: f3 / 2 - r6,
          paint: {
            stroke: e4[t7],
            strokeWidth: d2
          }
        }) : p3.push({
          type: "rect",
          x: r6,
          y: r6,
          width: f3 - r6 * 2,
          height: f3 - r6 * 2,
          cornerRadius: y3(r6),
          paint: {
            stroke: e4[t7],
            strokeWidth: d2
          }
        });
      }
    } else n5.roomShape === "circle" ? p3.push({
      type: "circle",
      cx: f3 / 2,
      cy: f3 / 2,
      radius: f3 / 2,
      paint: {
        fill: c4,
        stroke: g3 ? l4 : void 0,
        strokeWidth: g3,
        dash: _3,
        dashEnabled: _3 ? true : void 0
      }
    }) : p3.push({
      type: "rect",
      x: 0,
      y: 0,
      width: f3,
      height: f3,
      cornerRadius: n5.roomShape === "roundedRectangle" ? f3 * 0.2 : 0,
      paint: {
        fill: c4,
        stroke: g3 ? l4 : void 0,
        strokeWidth: g3,
        dash: _3,
        dashEnabled: _3 ? true : void 0
      }
    });
    if (h3 && (p3.push({
      type: "line",
      points: h3.shadow.points,
      paint: {
        stroke: h3.shadow.stroke,
        strokeWidth: h3.shadow.strokeWidth
      },
      lineCap: h3.shadow.lineCap,
      lineJoin: h3.shadow.lineJoin
    }), p3.push({
      type: "line",
      points: h3.highlight.points,
      paint: {
        stroke: h3.highlight.stroke,
        strokeWidth: h3.highlight.strokeWidth
      },
      lineCap: h3.highlight.lineCap,
      lineJoin: h3.shadow.lineJoin
    })), e3.roomChar) {
      let t6 = f3 * 0.75, { baselineRatio: r6, konvaCorrectionRatio: i3 } = oe(e3.roomChar, n5.fontFamily), a4 = Math.max(f3, e3.roomChar.length * t6 * 0.8), o4 = (a4 - f3) / 2;
      p3.push({
        type: "text",
        x: -o4,
        y: 0,
        text: e3.roomChar,
        fontSize: t6,
        fontFamily: n5.fontFamily,
        fontStyle: "bold",
        fill: u4,
        align: "center",
        verticalAlign: "middle",
        width: a4,
        height: f3,
        baselineRatio: r6,
        konvaCorrectionRatio: i3
      });
    }
    return {
      type: "group",
      x: e3.x - f3 / 2,
      y: e3.y - f3 / 2,
      layer: "room",
      hit: {
        kind: "room",
        id: e3.id,
        payload: e3
      },
      children: p3
    };
  }
  var le = [
    "up",
    "down",
    "in",
    "out"
  ];
  function ue(e3, t5, n5, r5) {
    let i3 = r5 * Math.PI / 180, a3 = [];
    for (let r6 = 0; r6 < 3; r6++) {
      let o3 = 2 * Math.PI * r6 / 3 - Math.PI / 2, s4 = Math.cos(o3) * n5 * 1.4, c4 = Math.sin(o3) * n5 * 0.8, l4 = s4 * Math.cos(i3) - c4 * Math.sin(i3), u4 = s4 * Math.sin(i3) + c4 * Math.cos(i3);
      a3.push(e3 + l4, t5 + u4);
    }
    return a3;
  }
  function de(e3, t5, n5) {
    let r5 = e3.userData?.["system.fallback_symbol_color"];
    return {
      symbolColor: r5 ?? (n5.frameMode || n5.coloredMode ? t5.getColorValue(e3.env) : t5.getSymbolColor(e3.env)),
      symbolFill: r5 ?? (n5.frameMode || n5.coloredMode ? t5.getColorValue(e3.env) : t5.getSymbolColor(e3.env, 0.6))
    };
  }
  var U = {
    1: "rgb(10, 155, 10)",
    2: "rgb(226, 205, 59)",
    3: "rgb(155, 10, 10)"
  };
  function W(e3, t5, n5) {
    let r5 = n5.roomSize, i3 = r5 / 5, a3 = (e4, t6, n6) => ({
      cx: e4,
      cy: t6,
      vertices: ue(e4, t6, i3, n6)
    });
    switch (t5) {
      case "up": {
        let t6 = A(e3.x, e3.y, "south", r5 / 4);
        return [a3(t6.x, t6.y, 0)];
      }
      case "down": {
        let t6 = A(e3.x, e3.y, "north", r5 / 4);
        return [a3(t6.x, t6.y, 180)];
      }
      case "in": {
        let t6 = A(e3.x, e3.y, "west", r5 / 4), n6 = A(e3.x, e3.y, "east", r5 / 4);
        return [a3(t6.x, t6.y, 90), a3(n6.x, n6.y, -90)];
      }
      case "out": {
        let t6 = A(e3.x, e3.y, "west", r5 / 4), n6 = A(e3.x, e3.y, "east", r5 / 4);
        return [a3(t6.x, t6.y, -90), a3(n6.x, n6.y, 90)];
      }
      default:
        return [];
    }
  }
  function fe(e3, t5, n5) {
    let r5 = [], { symbolColor: i3, symbolFill: a3 } = de(e3, t5, n5);
    for (let t6 of le) {
      if (!e3.exits[t6]) continue;
      let o3 = e3.doors[t6], s4 = o3 === void 0 ? i3 : U[o3] ?? U[3];
      for (let i4 of W(e3, t6, n5)) r5.push({
        cx: i4.cx,
        cy: i4.cy,
        vertices: i4.vertices,
        fill: a3,
        stroke: s4,
        strokeWidth: n5.lineWidth
      });
    }
    return { triangles: r5 };
  }
  function G(e3, t5, n5) {
    let r5 = n5.roomSize, i3 = e3.x - r5 / 2, a3 = e3.y - r5 / 2, { triangles: o3 } = fe(e3, t5, n5);
    return o3.map((e4) => {
      let t6 = Array(e4.vertices.length);
      for (let n6 = 0; n6 < e4.vertices.length; n6 += 2) t6[n6] = e4.vertices[n6] - i3, t6[n6 + 1] = e4.vertices[n6 + 1] - a3;
      return {
        type: "polygon",
        vertices: t6,
        paint: {
          fill: e4.fill,
          stroke: e4.stroke,
          strokeWidth: e4.strokeWidth
        }
      };
    });
  }
  function pe(e3, t5) {
    let n5 = [];
    for (let t6 of e3.lines) n5.push({
      type: "line",
      points: t6.points,
      paint: {
        stroke: t6.stroke,
        strokeWidth: t6.strokeWidth,
        dash: t6.dash
      }
    });
    for (let t6 of e3.arrows) me(n5, t6);
    for (let t6 of e3.doors) n5.push({
      type: "rect",
      x: t6.x,
      y: t6.y,
      width: t6.width,
      height: t6.height,
      paint: {
        stroke: t6.stroke,
        strokeWidth: t6.strokeWidth
      }
    });
    return {
      type: "group",
      x: 0,
      y: 0,
      layer: "link",
      ...t5 ? { hit: t5 } : {},
      children: n5
    };
  }
  function me(e3, t5) {
    e3.push({
      type: "line",
      points: t5.points,
      paint: {
        stroke: t5.stroke,
        strokeWidth: t5.strokeWidth,
        dash: t5.dash
      }
    });
    let n5 = t5.points.length - 2, r5 = t5.points[n5], i3 = t5.points[n5 + 1], a3 = t5.points[n5 - 2], o3 = t5.points[n5 - 1], s4 = Math.atan2(i3 - o3, r5 - a3), c4 = t5.pointerLength, l4 = t5.pointerWidth / 2, u4 = r5 - c4 * Math.cos(s4 - Math.atan2(l4, c4)), d2 = i3 - c4 * Math.sin(s4 - Math.atan2(l4, c4)), f3 = r5 - c4 * Math.cos(s4 + Math.atan2(l4, c4)), p3 = i3 - c4 * Math.sin(s4 + Math.atan2(l4, c4));
    e3.push({
      type: "polygon",
      vertices: [
        r5,
        i3,
        u4,
        d2,
        f3,
        p3
      ],
      paint: {
        fill: t5.fill,
        stroke: t5.stroke,
        strokeWidth: t5.strokeWidth
      }
    });
  }
  function he(e3, t5) {
    let n5 = [];
    if (n5.push({
      type: "line",
      points: e3.line.points,
      paint: {
        stroke: e3.line.stroke,
        strokeWidth: e3.line.strokeWidth,
        dash: e3.line.dash
      }
    }), e3.arrow) {
      let t6 = e3.arrow;
      n5.push({
        type: "polygon",
        vertices: [
          t6.tipX,
          t6.tipY,
          t6.x1,
          t6.y1,
          t6.x2,
          t6.y2
        ],
        paint: {
          fill: t6.fill,
          stroke: t6.stroke,
          strokeWidth: t6.strokeWidth
        }
      });
    }
    if (e3.door) {
      let t6 = e3.door;
      n5.push({
        type: "rect",
        x: t6.x,
        y: t6.y,
        width: t6.width,
        height: t6.height,
        paint: {
          stroke: t6.stroke,
          strokeWidth: t6.strokeWidth
        }
      });
    }
    return {
      type: "group",
      x: 0,
      y: 0,
      layer: "link",
      hit: {
        kind: "specialExit",
        id: `${t5}:${e3.dir}`,
        payload: {
          roomId: t5,
          exitName: e3.dir
        }
      },
      children: n5
    };
  }
  function K(e3) {
    return {
      type: "group",
      x: 0,
      y: 0,
      layer: "link",
      hit: {
        kind: "stub",
        id: `${e3.roomId}:${e3.direction}`,
        payload: e3
      },
      children: [{
        type: "line",
        points: [
          e3.x1,
          e3.y1,
          e3.x2,
          e3.y2
        ],
        paint: {
          stroke: e3.stroke,
          strokeWidth: e3.strokeWidth
        }
      }]
    };
  }
  function ge(e3) {
    let t5 = (e3?.alpha ?? 255) / 255, n5 = (e4) => Math.min(255, Math.max(0, e4 ?? 0));
    return `rgba(${n5(e3?.r)}, ${n5(e3?.g)}, ${n5(e3?.b)}, ${t5})`;
  }
  function _e(e3, t5) {
    if (t5.labelRenderMode === "none") return null;
    let n5 = e3.X, r5 = -e3.Y, i3 = !!e3.noScaling, a3 = i3 ? n5 : 0, o3 = i3 ? r5 : 0, s4 = i3 ? 0 : n5, c4 = i3 ? 0 : r5;
    if (t5.labelRenderMode === "image" && e3.pixMap) return {
      type: "group",
      x: a3,
      y: o3,
      layer: e3.showOnTop ? "top" : "link",
      noScale: i3,
      hit: {
        kind: "label",
        payload: e3
      },
      children: [{
        type: "image",
        x: s4,
        y: c4,
        width: e3.Width,
        height: e3.Height,
        src: `data:image/png;base64,${e3.pixMap}`
      }]
    };
    let l4 = [];
    if ((e3.BgColor?.alpha ?? 0) > 0 && !t5.transparentLabels && l4.push({
      type: "rect",
      x: s4,
      y: c4,
      width: e3.Width,
      height: e3.Height,
      paint: { fill: ge(e3.BgColor) }
    }), e3.Text) {
      let t6 = Math.min(0.75, e3.Width / Math.max(e3.Text.length / 2, 1)), n6 = Math.max(0.1, Math.min(t6, Math.max(e3.Height * 0.9, 0.1)));
      l4.push({
        type: "text",
        x: s4,
        y: c4,
        width: e3.Width,
        height: e3.Height,
        text: e3.Text,
        fontSize: n6,
        fill: ge(e3.FgColor),
        align: "center",
        verticalAlign: "middle"
      });
    }
    return {
      type: "group",
      x: a3,
      y: o3,
      layer: e3.showOnTop ? "top" : "link",
      noScale: i3,
      hit: {
        kind: "label",
        payload: e3
      },
      children: l4
    };
  }
  function ve(e3, t5) {
    return t5 ? {
      isVisible: (t6) => e3.isVisible(t6) && !d(t6),
      getExitTreatment: (t6, n5, r5) => d(n5) || d(r5) ? "hidden" : e3.getExitTreatment ? e3.getExitTreatment(t6, n5, r5) : y(e3, t6, n5, r5),
      getVersion: () => e3.getVersion()
    } : e3;
  }
  var ye = new Set(D);
  function q(e3, t5, n5, r5, i3) {
    let a3 = t5 - e3.x, o3 = n5 - e3.y, s4 = e3.customLines;
    if (s4 && Object.keys(s4).length > 0 && (a3 !== 0 || o3 !== 0)) {
      s4 = {};
      for (let [t6, n6] of Object.entries(e3.customLines)) s4[t6] = {
        ...n6,
        points: n6.points.map((e4) => ({
          x: e4.x + a3,
          y: e4.y - o3
        }))
      };
    }
    return {
      ...e3,
      x: t5,
      y: n5,
      area: r5,
      z: i3,
      customLines: s4
    };
  }
  function be(e3, t5) {
    let n5 = (t6) => !!(e3.customLines[t6] || e3.customLines[T[t6]]);
    for (let [r5, i3] of Object.entries(e3.exits ?? {})) if (i3 === t5.id && n5(r5)) return true;
    for (let [r5, i3] of Object.entries(e3.specialExits ?? {})) if (i3 === t5.id && n5(r5)) return true;
    return false;
  }
  var xe = 2;
  function Se(e3, t5, n5, r5, i3, a3 = () => true) {
    let o3 = e3.getRoom(r5);
    if (!o3 || i3 <= 0) return;
    let s4 = /* @__PURE__ */ new Map();
    s4.set(o3.id, {
      x: o3.x,
      y: o3.y
    });
    let c4 = [{
      id: o3.id,
      x: o3.x,
      y: o3.y,
      depth: 0
    }], l4 = [], u4 = [];
    for (; c4.length > 0; ) {
      let r6 = c4.shift();
      if (r6.depth >= i3) continue;
      let o4 = e3.getRoom(r6.id);
      if (!o4) continue;
      let u5 = [...Object.entries(o4.exits ?? {}).map(([e4, t6]) => ({
        targetId: t6,
        dir: e4
      })), ...Object.values(o4.specialExits ?? {}).map((e4) => ({ targetId: e4 }))];
      for (let { targetId: i4, dir: d3 } of u5) {
        let u6 = e3.getRoom(i4);
        if (!u6 || s4.has(u6.id)) continue;
        let f4 = u6.area === o4.area, p3, m3;
        if (f4) p3 = r6.x + (u6.x - o4.x), m3 = r6.y + (u6.y - o4.y);
        else {
          if (!d3) continue;
          let e4 = A(r6.x, r6.y, d3, xe);
          if (e4.x === r6.x && e4.y === r6.y) continue;
          p3 = e4.x, m3 = e4.y;
        }
        s4.set(u6.id, {
          x: p3,
          y: m3
        }), c4.push({
          id: u6.id,
          x: p3,
          y: m3,
          depth: r6.depth + 1
        }), u6.area !== t5 && u6.z === n5 && a3(u6) && l4.push(u6.id);
      }
    }
    if (l4.length === 0) return;
    let d2 = l4.map((t6) => {
      let n6 = s4.get(t6);
      return {
        room: e3.getRoom(t6),
        x: n6.x,
        y: n6.y
      };
    }), f3 = /* @__PURE__ */ new Set();
    for (let [r6, i4] of s4) {
      let o4 = e3.getRoom(r6);
      if (!o4 || o4.z !== n5 || !a3(o4)) continue;
      let c5 = o4.area !== t5, l5 = [...Object.entries(o4.exits ?? {}).filter(([e4]) => ye.has(e4)).map(([, e4]) => e4), ...Object.values(o4.specialExits ?? {})];
      for (let d3 of l5) {
        let l6 = s4.get(d3);
        if (!l6) continue;
        let p3 = e3.getRoom(d3);
        if (!p3 || p3.z !== n5 || !a3(p3) || !c5 && p3.area === t5 || be(o4, p3) || be(p3, o4)) continue;
        let m3 = r6 < d3 ? `${r6}-${d3}` : `${d3}-${r6}`;
        f3.has(m3) || (f3.add(m3), u4.push({
          ax: i4.x,
          ay: i4.y,
          bx: l6.x,
          by: l6.y
        }));
      }
    }
    return {
      rooms: d2,
      edges: u4
    };
  }
  var Ce = class {
    constructor(e3, t5, n5, r5) {
      this.base = e3, this.currentArea = t5, this.currentZ = n5, this.projected = r5;
    }
    getRoom(e3) {
      let t5 = this.base.getRoom(e3), n5 = t5 ? this.projected.get(e3) : void 0;
      return n5 ? q(t5, n5.x, n5.y, this.currentArea, this.currentZ) : t5;
    }
    getArea(e3) {
      return this.base.getArea(e3);
    }
    getAreas() {
      return this.base.getAreas();
    }
    getRooms() {
      return this.base.getRooms();
    }
    getColorValue(e3) {
      return this.base.getColorValue(e3);
    }
    getSymbolColor(e3, t5) {
      return this.base.getSymbolColor(e3, t5);
    }
  };
  function we(e3) {
    return new Map(e3.rooms.map((e4) => [e4.room.id, {
      x: e4.x,
      y: e4.y
    }]));
  }
  function Te(e3, t5) {
    let n5 = J(e3);
    return n5 ? `rgba(${n5.r}, ${n5.g}, ${n5.b}, ${t5})` : e3;
  }
  function J(e3) {
    let t5 = e3.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (t5) return {
      r: +t5[1],
      g: +t5[2],
      b: +t5[3]
    };
    if (e3.startsWith("#") && e3.length >= 7) return {
      r: parseInt(e3.slice(1, 3), 16),
      g: parseInt(e3.slice(3, 5), 16),
      b: parseInt(e3.slice(5, 7), 16)
    };
  }
  function Ee(e3, t5, n5) {
    let r5 = J(e3), i3 = J(t5);
    return !r5 || !i3 ? e3 : `rgb(${Math.round(r5.r * n5 + i3.r * (1 - n5))}, ${Math.round(r5.g * n5 + i3.g * (1 - n5))}, ${Math.round(r5.b * n5 + i3.b * (1 - n5))})`;
  }
  function De(e3, t5) {
    let n5 = t5 * t5, r5 = [];
    outer: for (let t6 of e3) {
      for (let e4 of r5) for (let r6 of e4) {
        let i3 = t6.tip.x - r6.tip.x, a3 = t6.tip.y - r6.tip.y;
        if (i3 * i3 + a3 * a3 <= n5) {
          e4.push(t6);
          continue outer;
        }
      }
      r5.push([t6]);
    }
    return r5;
  }
  var Oe = class {
    constructor(e3, t5) {
      this.linkShapes = [], this.roomShapes = [], this.topLabelShapes = [], this.labelShapeRefs = [], this.specialExitShapeRefs = [], this.stubShapeRefs = [], this.areaExitLabelShapeRefs = [], this.spilledRoomIds = /* @__PURE__ */ new Set(), this.mapReader = e3, this.settings = t5, this.exitRenderer = new F(e3, t5);
    }
    buildScene(e3, t5, n5, r5 = v, i3) {
      this.linkShapes = [], this.roomShapes = [], this.topLabelShapes = [], this.labelShapeRefs = [], this.specialExitShapeRefs = [], this.stubShapeRefs = [], this.areaExitLabelShapeRefs = [], this.spilledRoomIds = i3 ? new Set(i3.rooms.map((e4) => e4.room.id)) : /* @__PURE__ */ new Set(), this.renderLabels(t5.getLabels(), e3.getAreaId());
      let a3 = this.settings.hiddenRooms === "hide", o3 = ve(r5, a3), s4 = this.renderLinkExits(e3.getLinkExits(n5), n5, o3), c4 = (t5.getRooms() ?? []).filter((e4) => o3.isVisible(e4)), l4 = i3 ? i3.rooms.filter((e4) => !(a3 && d(e4.room))).map((t6) => q(t6.room, t6.x, t6.y, e3.getAreaId(), n5)) : [], u4 = this.renderRooms([...c4, ...l4], n5);
      i3 && this.renderSpillConnectors(i3), this.renderAreaName(e3, t5);
      let f3 = [...s4.areaExitHitZones, ...u4.areaExitHitZones], p3 = this.renderAreaExitLabels(f3, e3.getAreaId(), c4, s4.standaloneExitShapeRefs.map((e4) => e4.bounds));
      f3.push(...p3);
      let m3 = [
        ...this.linkShapes,
        ...this.roomShapes,
        ...this.topLabelShapes
      ];
      return {
        roomShapeRefs: u4.roomShapeRefs,
        standaloneExitShapeRefs: s4.standaloneExitShapeRefs,
        labelShapeRefs: this.labelShapeRefs,
        specialExitShapeRefs: this.specialExitShapeRefs,
        stubShapeRefs: this.stubShapeRefs,
        areaExitLabelShapeRefs: this.areaExitLabelShapeRefs,
        areaExitHitZones: f3,
        drawnExits: s4.drawnExits,
        drawnSpecialExits: u4.drawnSpecialExits,
        drawnStubs: u4.drawnStubs,
        hitShapes: m3,
        sceneShapes: {
          grid: [],
          link: this.linkShapes,
          room: this.roomShapes,
          topLabel: this.topLabelShapes
        }
      };
    }
    getEffectiveBounds(e3, t5) {
      return this.settings.uniformLevelSize ? e3.getFullBounds() : t5.getBounds();
    }
    renderRooms(e3, t5) {
      let n5 = /* @__PURE__ */ new Map(), r5 = [], i3 = [], a3 = [], o3 = [];
      e3.forEach((e4) => {
        let t6 = H(e4, this.mapReader, this.settings, {
          flatPipeline: true,
          ...h(e4, this.settings.hiddenRooms)
        });
        t6.children.push(...G(e4, this.mapReader, this.settings));
        for (let t7 of I(e4, this.settings)) {
          let n6 = he(t7, e4.id);
          this.linkShapes.push(n6);
          let r6 = t7.line.points, a4 = Infinity, o4 = Infinity, s4 = -Infinity, c4 = -Infinity;
          for (let e5 = 0; e5 < r6.length; e5 += 2) r6[e5] < a4 && (a4 = r6[e5]), r6[e5] > s4 && (s4 = r6[e5]), r6[e5 + 1] < o4 && (o4 = r6[e5 + 1]), r6[e5 + 1] > c4 && (c4 = r6[e5 + 1]);
          let l4 = {
            x: a4,
            y: o4,
            width: s4 - a4,
            height: c4 - o4
          };
          i3.push({
            roomId: e4.id,
            exitName: t7.dir,
            points: r6,
            stroke: t7.line.stroke,
            strokeWidth: t7.line.strokeWidth,
            dash: t7.line.dash,
            hasArrow: !!t7.arrow,
            arrowTip: t7.arrow ? {
              x: t7.arrow.tipX,
              y: t7.arrow.tipY
            } : void 0,
            bounds: l4
          }), this.specialExitShapeRefs.push({
            shape: n6,
            bounds: l4
          });
        }
        this.spilledRoomIds.has(e4.id) || (this.exitRenderer.getSpecialExitAreaTargets(e4).forEach((e5) => {
          this.spilledRoomIds.has(e5.targetRoomId) || r5.push({
            bounds: e5.bounds,
            targetRoomId: e5.targetRoomId,
            from: e5.from,
            tip: e5.tip,
            arrowColor: e5.arrowColor
          });
        }), this.exitRenderer.getInnerExitAreaTargets(e4).forEach((e5) => {
          this.spilledRoomIds.has(e5.targetRoomId) || r5.push({
            bounds: e5.bounds,
            targetRoomId: e5.targetRoomId,
            from: e5.from,
            tip: e5.tip,
            arrowColor: e5.arrowColor
          });
        }));
        for (let t7 of re(e4, this.settings)) {
          let e5 = K(t7);
          this.linkShapes.push(e5), a3.push({
            roomId: t7.roomId,
            direction: t7.direction,
            x1: t7.x1,
            y1: t7.y1,
            x2: t7.x2,
            y2: t7.y2,
            stroke: t7.stroke,
            strokeWidth: t7.strokeWidth
          }), this.stubShapeRefs.push({
            shape: e5,
            bounds: {
              x: Math.min(t7.x1, t7.x2),
              y: Math.min(t7.y1, t7.y2),
              width: Math.abs(t7.x2 - t7.x1),
              height: Math.abs(t7.y2 - t7.y1)
            }
          });
        }
        o3.push([e4, t6]), n5.set(e4.id, {
          room: e4,
          shape: t6
        });
      });
      for (let [, e4] of o3) this.roomShapes.push(e4);
      return {
        roomShapeRefs: n5,
        areaExitHitZones: r5,
        drawnSpecialExits: i3,
        drawnStubs: a3
      };
    }
    renderSpillConnectors(e3) {
      for (let t5 of e3.edges) this.linkShapes.push({
        type: "line",
        layer: "link",
        points: [
          t5.ax,
          t5.ay,
          t5.bx,
          t5.by
        ],
        paint: {
          stroke: this.settings.lineColor,
          strokeWidth: this.settings.lineWidth
        }
      });
    }
    renderLinkExits(e3, t5, n5) {
      let r5 = [], i3 = [], a3 = [];
      return e3.forEach((e4) => {
        let o3 = this.mapReader.getRoom(e4.a), s4 = this.mapReader.getRoom(e4.b);
        if (!o3 || !s4) return;
        let c4 = n5.getExitTreatment ? n5.getExitTreatment(e4, o3, s4) : y(n5, e4, o3, s4);
        if (c4 === "hidden") return;
        if (c4 === "stub") {
          let t6 = this.buildLensStub(e4, o3, s4, n5);
          t6 && this.emitLensStub(t6);
          return;
        }
        let l4 = this.exitRenderer.renderData(e4, t5);
        if (!l4 || l4.targetRoomId !== void 0 && this.spilledRoomIds.has(l4.targetRoomId)) return;
        let u4 = pe(l4, {
          kind: "exit",
          id: `${e4.a}:${e4.b}:${e4.aDir ?? ""}:${e4.bDir ?? ""}`,
          payload: {
            a: e4.a,
            b: e4.b,
            aDir: e4.aDir,
            bDir: e4.bDir,
            kind: e4.kind ?? "exit"
          }
        });
        this.linkShapes.push(u4), r5.push({
          shape: u4,
          bounds: l4.bounds,
          targetRoomId: l4.targetRoomId
        }), a3.push({
          a: e4.a,
          b: e4.b,
          aDir: e4.aDir,
          bDir: e4.bDir,
          kind: e4.kind ?? "exit",
          zIndex: e4.zIndex,
          data: l4
        }), l4.targetRoomId !== void 0 && i3.push({
          bounds: l4.bounds,
          targetRoomId: l4.targetRoomId,
          from: l4.from,
          tip: l4.tip,
          arrowColor: l4.arrowColor
        });
      }), {
        standaloneExitShapeRefs: r5,
        areaExitHitZones: i3,
        drawnExits: a3
      };
    }
    buildLensStub(e3, t5, n5, r5) {
      let i3 = r5.isVisible(t5);
      if (i3 === r5.isVisible(n5)) return;
      let a3 = i3 ? t5 : n5, o3 = i3 ? e3.aDir : e3.bDir;
      if (!o3 || !C.includes(o3) || a3.customLines[T[o3]]) return;
      let s4 = this.settings.roomSize, c4 = this.getRoomEdgePoint(a3.x, a3.y, o3, s4 / 2), l4 = A(a3.x, a3.y, o3, s4 / 2 + 0.5);
      return {
        roomId: a3.id,
        direction: o3,
        x1: c4.x,
        y1: c4.y,
        x2: l4.x,
        y2: l4.y,
        stroke: this.settings.lineColor,
        strokeWidth: this.settings.lineWidth
      };
    }
    emitLensStub(e3) {
      let t5 = K(e3);
      this.linkShapes.push(t5), this.stubShapeRefs.push({
        shape: t5,
        bounds: {
          x: Math.min(e3.x1, e3.x2),
          y: Math.min(e3.y1, e3.y2),
          width: Math.abs(e3.x2 - e3.x1),
          height: Math.abs(e3.y2 - e3.y1)
        }
      });
    }
    getRoomEdgePoint(e3, t5, n5, r5) {
      return this.settings.roomShape === "circle" ? M(e3, t5, n5, r5) : this.settings.roomShape === "roundedRectangle" ? j(e3, t5, n5, r5, this.settings.roomSize * 0.2) : A(e3, t5, n5, r5);
    }
    buildExitShape(e3) {
      return pe(e3);
    }
    renderLabels(e3, t5) {
      for (let n5 of e3) {
        let e4 = _e(n5, this.settings);
        e4 && (e4.hit = {
          kind: "label",
          id: n5.labelId,
          payload: {
            label: n5,
            areaId: t5
          }
        }, n5.showOnTop ? this.topLabelShapes.push(e4) : this.linkShapes.push(e4), n5.noScaling || this.labelShapeRefs.push({
          shape: e4,
          bounds: {
            x: n5.X,
            y: -n5.Y,
            width: n5.Width,
            height: n5.Height
          }
        }));
      }
    }
    renderAreaExitLabels(e3, n5, r5, i3) {
      let a3 = [];
      if (!this.settings.areaExitLabels || e3.length === 0) return a3;
      let o3 = /* @__PURE__ */ new Map();
      for (let t5 of e3) {
        if (!t5.tip || !t5.from) continue;
        let e4 = this.mapReader.getRoom(t5.targetRoomId);
        if (!e4 || e4.area === n5) continue;
        let r6 = t5.tip.x - t5.from.x, i4 = t5.tip.y - t5.from.y, a4 = Math.hypot(r6, i4) || 1, s5 = {
          tip: t5.tip,
          dir: {
            x: r6 / a4,
            y: i4 / a4
          },
          color: t5.arrowColor ?? "white",
          bounds: t5.bounds,
          targetRoomId: t5.targetRoomId
        }, c5 = o3.get(e4.area);
        c5 ? c5.push(s5) : o3.set(e4.area, [s5]);
      }
      let s4 = this.settings.areaExitLabelFontSize, c4 = s4 * 0.6, l4 = s4 * 0.333, u4 = s4 * 0.55, d2 = s4 * 1.1, f3 = s4 * 0.6, p3 = 0.35, m3 = s4 * 0.1, h3 = this.settings.roomSize, g3 = r5.map((e4) => ({
        x: e4.x - h3 / 2,
        y: e4.y - h3 / 2,
        width: h3,
        height: h3
      })), _3 = e3.map((e4) => e4.bounds), v3 = (e4, t5, n6) => {
        let r6 = Math.max(0, Math.max(e4.x, t5.x) - Math.min(e4.x + e4.w, t5.x + t5.w)), i4 = Math.max(0, Math.max(e4.y, t5.y) - Math.min(e4.y + e4.h, t5.y + t5.h));
        return Math.hypot(r6, i4) <= n6;
      }, y3 = (e4, t5, n6, r6, i4) => {
        for (let a4 of i4) if (e4 < a4.x + a4.width && e4 + n6 > a4.x && t5 < a4.y + a4.height && t5 + r6 > a4.y) return true;
        return false;
      }, ee2 = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [0.707, 0.707],
        [-0.707, 0.707],
        [0.707, -0.707],
        [-0.707, -0.707]
      ], b3 = (e4, t5, n6) => {
        let r6 = t5.length * u4 + c4 * 2, a4 = d2 + l4 * 2, o4 = 0, s5 = 0, f4 = 0, p4 = 0, m4 = Infinity, h4 = -Infinity, v4 = Infinity, b4 = -Infinity, x2 = /* @__PURE__ */ new Map();
        for (let t6 of e4) o4 += t6.tip.x, s5 += t6.tip.y, f4 += t6.dir.x, p4 += t6.dir.y, t6.tip.x < m4 && (m4 = t6.tip.x), t6.tip.x > h4 && (h4 = t6.tip.x), t6.tip.y < v4 && (v4 = t6.tip.y), t6.tip.y > b4 && (b4 = t6.tip.y), x2.set(t6.color, (x2.get(t6.color) ?? 0) + 1);
        let S2 = e4.length, C2 = Math.hypot(f4, p4), w2 = C2 > 0 ? f4 / C2 : 0, T2 = C2 > 0 ? p4 / C2 : 0, E2 = 0;
        for (let t6 = 0; t6 < e4.length; t6++) for (let n7 = t6 + 1; n7 < e4.length; n7++) {
          let r7 = e4[t6].tip.x - e4[n7].tip.x, i4 = e4[t6].tip.y - e4[n7].tip.y, a5 = Math.hypot(r7, i4);
          a5 > E2 && (E2 = a5);
        }
        let D2 = E2 > 3, O3 = C2 / S2 >= 0.4, k3 = n6?.x ?? (D2 ? (m4 + h4) / 2 : o4 / S2), A3 = n6?.y ?? (D2 ? (v4 + b4) / 2 : s5 / S2), j3 = "white", M3 = 0;
        for (let [e5, t6] of x2) t6 > M3 && (j3 = e5, M3 = t6);
        let N3 = g3.concat(_3).concat(i3), P3 = (e5, t6, n7 = 0) => 0.5 + n7 + Math.abs(e5) * r6 / 2 + Math.abs(t6) * a4 / 2, F2 = [];
        if (O3) {
          let e5 = P3(w2, T2);
          F2.push({
            x: k3 + w2 * e5,
            y: A3 + T2 * e5
          });
        }
        F2.push({
          x: k3,
          y: A3
        });
        for (let e5 of [
          0,
          0.6,
          1.4
        ]) for (let [t6, n7] of ee2) {
          let r7 = P3(t6, n7, e5);
          F2.push({
            x: k3 + t6 * r7,
            y: A3 + n7 * r7
          });
        }
        for (let t6 of F2) {
          let n7 = t6.x - r6 / 2, i4 = t6.y - a4 / 2;
          if (!y3(n7, i4, r6, a4, N3)) return {
            cluster: e4,
            boxX: n7,
            boxY: i4,
            boxW: r6,
            boxH: a4,
            color: j3
          };
        }
      };
      for (let [e4, n6] of o3) {
        let r6 = this.mapReader.getArea(e4)?.getAreaName() || `Area ${e4}`, i4 = De(n6, 10).map((e5) => b3(e5, r6)).filter((e5) => e5 !== void 0), o4 = true;
        for (; o4 && i4.length > 1; ) {
          o4 = false;
          outer: for (let e5 = 0; e5 < i4.length; e5++) for (let t5 = e5 + 1; t5 < i4.length; t5++) {
            let n7 = {
              x: i4[e5].boxX,
              y: i4[e5].boxY,
              w: i4[e5].boxW,
              h: i4[e5].boxH
            }, a4 = {
              x: i4[t5].boxX,
              y: i4[t5].boxY,
              w: i4[t5].boxW,
              h: i4[t5].boxH
            };
            if (v3(n7, a4, 2)) {
              let s5 = [...i4[e5].cluster, ...i4[t5].cluster], c5 = b3(s5, r6, {
                x: (n7.x + n7.w / 2 + a4.x + a4.w / 2) / 2,
                y: (n7.y + n7.h / 2 + a4.y + a4.h / 2) / 2
              }) ?? b3(s5, r6);
              c5 ? (i4[e5] = c5, i4.splice(t5, 1)) : (i4.splice(t5, 1), i4.splice(e5, 1)), o4 = true;
              break outer;
            }
          }
        }
        for (let e5 of i4) {
          let n7 = Te(e5.color, p3), i5 = t(Ee(e5.color, this.settings.backgroundColor, p3)) > 0.55 ? "#000" : "#fff", o5 = {
            type: "group",
            x: 0,
            y: 0,
            layer: "room",
            hit: {
              kind: "areaExit",
              id: e5.cluster[0].targetRoomId,
              payload: { targetRoomId: e5.cluster[0].targetRoomId }
            },
            children: [{
              type: "rect",
              x: e5.boxX,
              y: e5.boxY,
              width: e5.boxW,
              height: e5.boxH,
              cornerRadius: f3,
              paint: {
                fill: n7,
                stroke: e5.color,
                strokeWidth: m3
              }
            }, {
              type: "text",
              x: e5.boxX + c4,
              y: e5.boxY + l4,
              width: e5.boxW - c4 * 2,
              height: e5.boxH - l4 * 2,
              text: r6,
              fontSize: s4,
              fontFamily: this.settings.fontFamily,
              fill: i5,
              align: "center",
              verticalAlign: "middle"
            }]
          }, u5 = {
            x: e5.boxX,
            y: e5.boxY,
            width: e5.boxW,
            height: e5.boxH
          };
          this.roomShapes.push(o5), this.areaExitLabelShapeRefs.push({
            shape: o5,
            bounds: u5
          }), a3.push({
            bounds: u5,
            targetRoomId: e5.cluster[0].targetRoomId
          });
        }
      }
      return a3;
    }
    renderAreaName(e3, t5) {
      if (!this.settings.areaName) return;
      let n5 = e3.getAreaName();
      if (!n5) return;
      let r5 = this.getEffectiveBounds(e3, t5), i3 = {
        type: "group",
        x: 0,
        y: 0,
        layer: "room",
        children: [{
          type: "text",
          x: r5.minX - 3.5,
          y: r5.minY - 4.5,
          text: n5,
          fontSize: 2.5,
          fontFamily: this.settings.fontFamily,
          fill: this.settings.lineColor
        }]
      };
      this.roomShapes.push(i3);
    }
  };
  var ke = class {
    setCursor(e3) {
      this.container.dataset.editorCursor || (this.container.style.cursor = e3);
    }
    constructor(e3, t5, n5, r5, i3) {
      this.cleanupFns = [], this.destroyed = false, this.container = e3, this.camera = t5, this.state = n5, this.hitTest = r5, this.events = i3, this.initViewportEvents(), this.initMapEvents();
    }
    destroy() {
      if (!this.destroyed) {
        this.destroyed = true;
        for (let e3 of this.cleanupFns) e3();
        this.cleanupFns.length = 0;
      }
    }
    listen(e3, t5, n5, r5) {
      e3.addEventListener(t5, n5, r5), this.cleanupFns.push(() => e3.removeEventListener(t5, n5, r5));
    }
    initViewportEvents() {
      let e3 = this.container, t5 = this.camera, n5 = 1.1, r5 = () => {
        t5.batch(() => {
          if (t5.setSize(e3.clientWidth, e3.clientHeight), t5.centerOnResize && this.state.positionRoomId) {
            let e4 = this.state.mapReader.getRoom(this.state.positionRoomId);
            e4 && t5.panToMapPoint(e4.x, e4.y);
          }
        });
      };
      typeof window < "u" && this.listen(window, "resize", r5), this.listen(e3, "resize", r5);
      let i3 = false, a3;
      this.listen(e3, "pointerdown", (n6) => {
        if (n6.button !== 0 || n6.pointerType === "touch") return;
        i3 = true, a3 = n6.pointerId, e3.setPointerCapture(n6.pointerId);
        let r6 = e3.getBoundingClientRect();
        t5.startDrag(n6.clientX - r6.left, n6.clientY - r6.top);
      }), this.listen(e3, "pointermove", (n6) => {
        if (!i3 || n6.pointerId !== a3) return;
        let r6 = e3.getBoundingClientRect();
        t5.updateDrag(n6.clientX - r6.left, n6.clientY - r6.top), this.events.emit("pan", t5.getViewportBounds());
      }), this.listen(e3, "pointerup", (e4) => {
        e4.pointerId === a3 && (i3 = false, a3 = void 0, t5.endDrag(), this.events.emit("pan", t5.getViewportBounds()));
      }), this.listen(e3, "pointercancel", (e4) => {
        e4.pointerId === a3 && (i3 = false, a3 = void 0, t5.endDrag());
      });
      let o3;
      this.listen(e3, "touchstart", (n6) => {
        if (n6.touches.length === 1) {
          let r6 = n6.touches[0];
          o3 = r6.identifier;
          let i4 = e3.getBoundingClientRect();
          t5.startDrag(r6.clientX - i4.left, r6.clientY - i4.top);
        } else t5.isDragging() && t5.endDrag(), o3 = void 0;
      }, { passive: true }), this.listen(e3, "touchmove", (n6) => {
        let r6 = n6.touches;
        if (r6.length >= 2) {
          n6.preventDefault(), t5.isDragging() && t5.endDrag(), o3 = void 0;
          let i4 = e3.getBoundingClientRect(), a4 = {
            x: r6[0].clientX - i4.left,
            y: r6[0].clientY - i4.top
          }, s4 = {
            x: r6[1].clientX - i4.left,
            y: r6[1].clientY - i4.top
          };
          this.handlePinch(a4, s4);
          return;
        }
        if (r6.length === 1 && o3 === r6[0].identifier) {
          let n7 = r6[0], i4 = e3.getBoundingClientRect();
          t5.updateDrag(n7.clientX - i4.left, n7.clientY - i4.top), this.events.emit("pan", t5.getViewportBounds());
        }
      }), this.listen(e3, "touchend", (n6) => {
        if (this.lastPinchDistance = void 0, n6.touches.length === 0) t5.isDragging() && (t5.endDrag(), this.events.emit("pan", t5.getViewportBounds())), o3 = void 0;
        else if (n6.touches.length === 1) {
          let r6 = n6.touches[0];
          o3 = r6.identifier;
          let i4 = e3.getBoundingClientRect();
          t5.startDrag(r6.clientX - i4.left, r6.clientY - i4.top);
        }
      }, { passive: true }), this.listen(e3, "touchcancel", () => {
        this.lastPinchDistance = void 0, t5.isDragging() && t5.endDrag(), o3 = void 0;
      }, { passive: true }), this.listen(e3, "wheel", (r6) => {
        r6.preventDefault();
        let i4 = e3.getBoundingClientRect(), a4 = r6.clientX - i4.left, o4 = r6.clientY - i4.top, s4 = r6.deltaY > 0 ? -1 : 1;
        r6.ctrlKey && (s4 = -s4);
        let c4 = s4 > 0 ? t5.zoom * n5 : t5.zoom / n5;
        t5.zoomToPoint(c4, a4, o4) && (this.events.emit("zoom", { zoom: t5.zoom }), this.events.emit("pan", t5.getViewportBounds()));
      }, { passive: false });
    }
    handlePinch(e3, t5) {
      let n5 = Math.hypot(e3.x - t5.x, e3.y - t5.y);
      if (this.lastPinchDistance === void 0 || this.lastPinchDistance === 0 || n5 === 0) {
        this.lastPinchDistance = n5;
        return;
      }
      let r5 = (e3.x + t5.x) / 2, i3 = (e3.y + t5.y) / 2, a3 = this.camera.zoom * (n5 / this.lastPinchDistance);
      this.camera.zoomToPoint(a3, r5, i3) && (this.events.emit("zoom", { zoom: this.camera.zoom }), this.events.emit("pan", this.camera.getViewportBounds())), this.lastPinchDistance = n5;
    }
    initMapEvents() {
      let e3 = this.container, t5 = null;
      this.listen(e3, "mousemove", (e4) => {
        let n6 = this.pickAtClientPoint(e4.clientX, e4.clientY)?.kind ?? null;
        n6 !== t5 && (t5 = n6, this.setCursor(n6 === "room" || n6 === "areaExit" ? "pointer" : "auto"));
      }), this.listen(e3, "mouseleave", () => {
        t5 = null, this.setCursor("auto");
      });
      let n5 = null;
      this.listen(e3, "mousedown", (e4) => {
        e4.button === 0 && (n5 = {
          x: e4.clientX,
          y: e4.clientY
        });
      }), this.listen(e3, "mouseup", (e4) => {
        if (e4.button !== 0 || !n5) return;
        let t6 = e4.clientX - n5.x, r6 = e4.clientY - n5.y;
        if (n5 = null, t6 * t6 + r6 * r6 > 25) return;
        let i4 = this.pickAtClientPoint(e4.clientX, e4.clientY);
        if (i4?.kind === "room") {
          this.emitRoomClickEvent(i4.id, e4.clientX, e4.clientY);
          return;
        }
        if (i4?.kind === "areaExit") {
          let t7 = i4.payload?.targetRoomId ?? i4.id;
          this.emitAreaExitClickEvent(t7, e4.clientX, e4.clientY);
          return;
        }
        this.emitMapClickEvent();
      }), this.listen(e3, "contextmenu", (e4) => {
        let t6 = this.pickAtClientPoint(e4.clientX, e4.clientY);
        t6?.kind === "room" && (e4.preventDefault(), this.emitRoomContextEvent(t6.id, e4.clientX, e4.clientY));
      });
      let r5, i3, a3 = () => {
        r5 !== void 0 && (window.clearTimeout(r5), r5 = void 0), i3 = void 0;
      };
      this.listen(e3, "touchstart", (e4) => {
        if (a3(), e4.touches.length > 1) return;
        let t6 = e4.touches[0];
        t6 && this.pickAtClientPoint(t6.clientX, t6.clientY)?.kind === "room" && (i3 = {
          clientX: t6.clientX,
          clientY: t6.clientY
        }, r5 = window.setTimeout(() => {
          if (i3) {
            let e5 = this.pickAtClientPoint(i3.clientX, i3.clientY);
            e5?.kind === "room" && this.emitRoomContextEvent(e5.id, i3.clientX, i3.clientY);
          }
          a3();
        }, 500));
      }, { passive: true }), this.listen(e3, "touchend", () => a3(), { passive: true }), this.listen(e3, "touchcancel", () => a3(), { passive: true }), this.listen(e3, "touchmove", (e4) => {
        if (!i3) return;
        let t6 = e4.touches[0];
        if (!t6) {
          a3();
          return;
        }
        let n6 = t6.clientX - i3.clientX, r6 = t6.clientY - i3.clientY;
        n6 * n6 + r6 * r6 > 100 && a3();
      }, { passive: true });
    }
    pickAtClientPoint(e3, t5) {
      let n5 = this.hitTest.clientToMapPoint(e3, t5);
      return n5 ? this.hitTest.pickAtPoint(n5.x, n5.y) : null;
    }
    emitRoomClickEvent(e3, t5, n5) {
      let r5 = this.container.getBoundingClientRect();
      this.events.emit("roomclick", {
        roomId: e3,
        position: {
          x: t5 - r5.left,
          y: n5 - r5.top
        }
      });
    }
    emitRoomContextEvent(e3, t5, n5) {
      let r5 = this.container.getBoundingClientRect();
      this.events.emit("roomcontextmenu", {
        roomId: e3,
        position: {
          x: t5 - r5.left,
          y: n5 - r5.top
        }
      });
    }
    emitAreaExitClickEvent(e3, t5, n5) {
      let r5 = this.container.getBoundingClientRect();
      this.events.emit("areaexitclick", {
        targetRoomId: e3,
        position: {
          x: t5 - r5.left,
          y: n5 - r5.top
        }
      });
    }
    emitMapClickEvent() {
      this.events.emit("mapclick", void 0);
    }
  };
  var Y = [
    "up",
    "down",
    "in",
    "out"
  ];
  function X(e3, t5, n5, r5, i3) {
    return e3.roomShape === "circle" ? M(t5, n5, r5, i3) : e3.roomShape === "roundedRectangle" ? j(t5, n5, r5, i3, e3.roomSize * 0.2) : A(t5, n5, r5, i3);
  }
  function Ae(e3, t5, n5) {
    for (let [e4, r5] of Object.entries(t5.exits)) if (r5 === n5.id) {
      let r6 = e4;
      if (Y.includes(r6)) {
        let e5 = T[r6];
        return {
          type: "inner",
          fromDir: r6,
          customLineKey: t5.customLines[e5] ? e5 : t5.customLines[r6] ? r6 : void 0,
          fromRoom: t5,
          toRoom: n5
        };
      }
      let i3 = T[r6];
      return t5.customLines[i3] ? {
        type: "special",
        fromDir: r6,
        customLineKey: i3,
        fromRoom: t5,
        toRoom: n5
      } : t5.customLines[r6] ? {
        type: "special",
        fromDir: r6,
        customLineKey: r6,
        fromRoom: t5,
        toRoom: n5
      } : {
        type: "regular",
        fromDir: r6,
        toDir: je(n5, t5.id),
        fromRoom: t5,
        toRoom: n5
      };
    }
    for (let [e4, r5] of Object.entries(t5.specialExits)) if (r5 === n5.id) return t5.customLines[e4] ? {
      type: "special",
      customLineKey: e4,
      fromRoom: t5,
      toRoom: n5
    } : {
      type: "inner",
      fromRoom: t5,
      toRoom: n5
    };
    for (let [e4, r5] of Object.entries(n5.exits)) if (r5 === t5.id) {
      let r6 = e4;
      if (Y.includes(r6)) {
        let e5 = T[r6];
        return {
          type: "inner",
          toDir: r6,
          customLineKey: n5.customLines[e5] ? e5 : n5.customLines[r6] ? r6 : void 0,
          fromRoom: t5,
          toRoom: n5
        };
      }
      let i3 = T[r6];
      return n5.customLines[i3] ? {
        type: "special",
        toDir: r6,
        customLineKey: i3,
        fromRoom: t5,
        toRoom: n5
      } : n5.customLines[r6] ? {
        type: "special",
        toDir: r6,
        customLineKey: r6,
        fromRoom: t5,
        toRoom: n5
      } : {
        type: "regular",
        toDir: r6,
        fromRoom: t5,
        toRoom: n5
      };
    }
    for (let [e4, r5] of Object.entries(n5.specialExits)) if (r5 === t5.id) return n5.customLines[e4] ? {
      type: "special",
      customLineKey: e4,
      fromRoom: t5,
      toRoom: n5
    } : {
      type: "inner",
      fromRoom: t5,
      toRoom: n5
    };
    return {
      type: "none",
      fromRoom: t5,
      toRoom: n5
    };
  }
  function je(e3, t5) {
    for (let [n5, r5] of Object.entries(e3.exits)) if (r5 === t5) return n5;
  }
  function Me(e3, t5, n5) {
    return e3 ? e3.area === t5 && e3.z === n5 : false;
  }
  function Ne(e3, t5) {
    for (let [n5, r5] of Object.entries(e3.exits)) if (r5 === t5.id) return { direction: n5 };
    for (let [n5, r5] of Object.entries(e3.specialExits)) if (r5 === t5.id) return;
  }
  function Pe(e3, t5) {
    for (let n5 of D) if (e3.exits[n5] === t5.id) return n5;
    for (let n5 of D) if (t5.exits[n5] === e3.id) return O[n5];
  }
  function Fe(e3, t5, n5) {
    let { fromRoom: r5, toRoom: i3, fromDir: a3, toDir: o3 } = t5;
    if (n5.length === 0 && n5.push(r5.x, r5.y), a3 && C.includes(a3)) {
      let t6 = X(e3, r5.x, r5.y, a3, e3.roomSize / 2);
      n5.push(t6.x, t6.y);
    }
    if (o3 && C.includes(o3)) {
      let t6 = X(e3, i3.x, i3.y, o3, e3.roomSize / 2);
      n5.push(t6.x, t6.y);
    }
    n5.push(i3.x, i3.y);
  }
  function Ie(e3, t5) {
    let { fromRoom: n5, toRoom: r5, customLineKey: i3 } = e3, a3 = n5, o3;
    i3 && (o3 = n5.customLines[i3], o3 || (o3 = r5.customLines[i3], a3 = r5)), t5.length === 0 && t5.push(a3.x, a3.y), o3 && o3.points.forEach((e4) => {
      t5.push(e4.x, -e4.y);
    }), t5.push(r5.x, r5.y);
  }
  function Le(e3, t5, n5, r5, i3) {
    let a3 = [], o3 = [], s4 = [], c4 = n5.map((t6) => e3.getRoom(t6)).filter((e4) => e4 !== void 0), l4 = [], u4 = () => {
      l4.length >= 4 && a3.push({ points: [...l4] }), l4 = [];
    }, d2 = (e4) => {
      let { fromRoom: t6, toRoom: n6, fromDir: r6, toDir: i4, customLineKey: a4 } = e4;
      if (a4) {
        let e5 = t6, r7 = t6.customLines[a4];
        if (r7 || (r7 = n6.customLines[a4], e5 = n6), r7) {
          let t7 = [e5.x, e5.y];
          r7.points.forEach((e6) => {
            t7.push(e6.x, -e6.y);
          }), s4.push({ points: t7 });
        }
      }
      r6 && Y.includes(r6) && o3.push({
        room: t6,
        direction: r6
      }), i4 && Y.includes(i4) && o3.push({
        room: n6,
        direction: i4
      });
    };
    for (let n6 = 0; n6 < c4.length - 1; n6++) {
      let a4 = c4[n6], s5 = c4[n6 + 1], f3 = Me(a4, r5, i3), p3 = Me(s5, r5, i3);
      if (!f3 && !p3) {
        u4();
        continue;
      }
      if (f3 && p3) {
        let n7 = Ae(e3, a4, s5);
        switch (n7.type) {
          case "regular":
            Fe(t5, n7, l4);
            break;
          case "special":
            Ie(n7, l4);
            break;
          case "inner":
            u4(), d2(n7);
            break;
          case "none":
            l4.length === 0 && l4.push(a4.x, a4.y), l4.push(s5.x, s5.y);
            break;
        }
      } else {
        let e4 = f3 ? a4 : s5, n7 = f3 ? s5 : a4, r6 = Ne(e4, n7);
        if (r6) {
          if (Y.includes(r6.direction)) u4(), o3.push({
            room: e4,
            direction: r6.direction
          });
          else if (C.includes(r6.direction)) {
            l4.length === 0 && l4.push(e4.x, e4.y);
            let n8 = X(t5, e4.x, e4.y, r6.direction, t5.roomSize / 2), i4 = A(e4.x, e4.y, r6.direction, t5.roomSize);
            l4.push(n8.x, n8.y, i4.x, i4.y), u4();
          }
        } else {
          let r7 = Pe(e4, n7);
          if (r7) {
            l4.length === 0 && l4.push(e4.x, e4.y);
            let n8 = X(t5, e4.x, e4.y, r7, t5.roomSize / 2), i4 = A(e4.x, e4.y, r7, t5.roomSize);
            l4.push(n8.x, n8.y, i4.x, i4.y), u4();
          }
        }
      }
    }
    return u4(), {
      segments: a3,
      innerMarkers: o3,
      customLines: s4
    };
  }
  function Re(e3, t5) {
    let n5 = e3.shape ?? "match";
    return n5 === "match" ? (e3.matchRoomShape ?? true) && t5 !== "circle" ? t5 === "roundedRectangle" ? "roundedRectangle" : "rectangle" : "circle" : n5;
  }
  function ze(e3, t5, n5) {
    let r5 = n5.highlight, i3 = n5.roomSize, a3 = r5.sizeFactor, o3 = Re(r5, n5.roomShape), s4 = Array.isArray(t5) ? t5.length > 0 ? [...t5] : ["#ffffff"] : [t5];
    return {
      shape: o3 === "circle" ? "circle" : "rect",
      cx: e3.x,
      cy: e3.y,
      size: i3 / 2 * a3,
      cornerRadius: o3 === "roundedRectangle" ? i3 * a3 * 0.2 : 0,
      colors: s4,
      strokeAlpha: r5.strokeAlpha,
      strokeWidth: r5.strokeWidth,
      fillAlpha: r5.fillAlpha,
      dash: r5.dash,
      dashEnabled: r5.dashEnabled
    };
  }
  function Be(e3, t5) {
    let n5 = t5.playerMarker, r5 = t5.roomSize * n5.sizeFactor, i3 = n5.matchRoomShape && t5.roomShape !== "circle";
    return {
      shape: i3 ? "rect" : "circle",
      cx: e3.x,
      cy: e3.y,
      size: r5 / 2,
      cornerRadius: i3 && t5.roomShape === "roundedRectangle" ? r5 * 0.2 : 0,
      strokeColor: n5.strokeColor,
      strokeWidth: n5.strokeWidth,
      strokeAlpha: n5.strokeAlpha,
      fillColor: n5.fillColor,
      fillAlpha: n5.fillAlpha,
      dash: n5.dash,
      dashEnabled: n5.dashEnabled
    };
  }
  function Ve(e3, t5, n5, r5, i3, a3) {
    let o3 = Le(e3, t5, n5, i3, a3), s4 = t5.lineWidth, c4 = [];
    for (let e4 of o3.segments) e4.points.length >= 4 && c4.push({ points: e4.points });
    for (let e4 of o3.customLines) e4.points.length >= 4 && c4.push({ points: e4.points });
    let l4 = [];
    for (let e4 of o3.innerMarkers) for (let n6 of W(e4.room, e4.direction, t5)) l4.push({ vertices: n6.vertices });
    return {
      segments: c4,
      triangles: l4,
      color: r5,
      outlineWidth: s4 * 8,
      lineWidth: s4 * 4
    };
  }
  function He(e3) {
    if (e3.colors.length > 1) return Ue(e3);
    let t5 = e3.colors[0], n5 = s(t5, e3.strokeAlpha), r5 = e3.fillAlpha > 0 ? s(t5, e3.fillAlpha) : void 0;
    if (e3.shape === "circle") return {
      type: "circle",
      cx: e3.cx,
      cy: e3.cy,
      radius: e3.size,
      paint: {
        fill: r5,
        stroke: n5,
        strokeWidth: e3.strokeWidth,
        dash: e3.dash,
        dashEnabled: e3.dashEnabled
      },
      layer: "overlay"
    };
    if (e3.cornerRadius > 0) return {
      type: "rect",
      x: e3.cx - e3.size,
      y: e3.cy - e3.size,
      width: e3.size * 2,
      height: e3.size * 2,
      cornerRadius: e3.cornerRadius,
      paint: {
        fill: r5,
        stroke: n5,
        strokeWidth: e3.strokeWidth,
        dash: e3.dash,
        dashEnabled: e3.dashEnabled
      },
      layer: "overlay"
    };
    let i3 = e3.cx - e3.size, a3 = e3.cy - e3.size, o3 = e3.cx + e3.size, c4 = e3.cy + e3.size, l4 = [
      [
        i3,
        a3,
        o3,
        a3
      ],
      [
        o3,
        a3,
        o3,
        c4
      ],
      [
        o3,
        c4,
        i3,
        c4
      ],
      [
        i3,
        c4,
        i3,
        a3
      ]
    ], u4 = [];
    r5 && u4.push({
      type: "rect",
      x: i3,
      y: a3,
      width: e3.size * 2,
      height: e3.size * 2,
      cornerRadius: e3.cornerRadius,
      paint: { fill: r5 },
      layer: "overlay"
    });
    for (let t6 of l4) u4.push({
      type: "line",
      points: t6,
      paint: {
        stroke: n5,
        strokeWidth: e3.strokeWidth,
        dash: e3.dash,
        dashEnabled: e3.dashEnabled
      },
      lineCap: "butt",
      layer: "overlay"
    });
    return {
      type: "group",
      x: 0,
      y: 0,
      children: u4,
      layer: "overlay"
    };
  }
  function Ue(e3) {
    let t5 = e3.colors.length, n5 = Math.PI * 2 / t5, r5 = -Math.PI / 2, i3 = [];
    for (let a3 = 0; a3 < t5; a3++) {
      let t6 = e3.colors[a3], o3 = s(t6, e3.strokeAlpha), c4 = e3.fillAlpha > 0 ? s(t6, e3.fillAlpha) : void 0, l4 = r5 + a3 * n5, u4 = Ge(e3, l4, l4 + n5);
      if (c4) {
        let t7 = [e3.cx, e3.cy];
        for (let [e4, n6] of u4) t7.push(e4, n6);
        i3.push({
          type: "polygon",
          vertices: t7,
          paint: { fill: c4 },
          layer: "overlay"
        });
      }
      let d2 = [];
      for (let [e4, t7] of u4) d2.push(e4, t7);
      i3.push({
        type: "line",
        points: d2,
        paint: {
          stroke: o3,
          strokeWidth: e3.strokeWidth,
          dash: e3.dash,
          dashEnabled: e3.dashEnabled
        },
        lineCap: "butt",
        layer: "overlay"
      });
    }
    return {
      type: "group",
      x: 0,
      y: 0,
      children: i3,
      layer: "overlay"
    };
  }
  function We(e3, t5) {
    let n5 = Math.cos(t5), r5 = Math.sin(t5);
    if (e3.shape === "circle") return [e3.cx + e3.size * n5, e3.cy + e3.size * r5];
    let i3 = e3.size, a3 = Math.max(Math.abs(n5), Math.abs(r5)), o3 = i3 / a3 * n5, s4 = i3 / a3 * r5, c4 = Math.min(e3.cornerRadius, i3), l4 = i3 - c4;
    if (c4 > 0 && Math.abs(o3) > l4 && Math.abs(s4) > l4) {
      let t6 = Math.sign(o3) * l4, i4 = Math.sign(s4) * l4, a4 = t6 * n5 + i4 * r5, u4 = t6 * t6 + i4 * i4, d2 = a4 + Math.sqrt(Math.max(0, a4 * a4 - (u4 - c4 * c4)));
      return [e3.cx + d2 * n5, e3.cy + d2 * r5];
    }
    return [e3.cx + o3, e3.cy + s4];
  }
  function Ge(e3, t5, n5) {
    let r5 = [t5], i3 = e3.shape !== "circle" && e3.cornerRadius > 0;
    if (e3.shape === "circle" || i3) {
      let e4 = i3 ? Math.PI / 36 : Math.PI / 18, a3 = Math.max(1, Math.ceil((n5 - t5) / e4));
      for (let e5 = 1; e5 < a3; e5++) r5.push(t5 + (n5 - t5) * e5 / a3);
    } else {
      let e4 = Math.PI / 2, i4 = Math.PI / 4, a3 = Math.ceil((t5 - i4) / e4), o3 = Math.floor((n5 - i4) / e4);
      for (let s4 = a3; s4 <= o3; s4++) {
        let a4 = i4 + s4 * e4;
        a4 > t5 + 1e-9 && a4 < n5 - 1e-9 && r5.push(a4);
      }
    }
    return r5.push(n5), r5.sort((e4, t6) => e4 - t6), r5.map((t6) => We(e3, t6));
  }
  function Ke(e3) {
    let t5 = s(e3.strokeColor, e3.strokeAlpha), n5 = e3.fillAlpha > 0 ? s(e3.fillColor, e3.fillAlpha) : void 0;
    return e3.shape === "circle" ? {
      type: "circle",
      cx: e3.cx,
      cy: e3.cy,
      radius: e3.size,
      paint: {
        fill: n5,
        stroke: t5,
        strokeWidth: e3.strokeWidth,
        dash: e3.dash,
        dashEnabled: e3.dashEnabled
      },
      layer: "overlay"
    } : {
      type: "rect",
      x: e3.cx - e3.size,
      y: e3.cy - e3.size,
      width: e3.size * 2,
      height: e3.size * 2,
      cornerRadius: e3.cornerRadius,
      paint: {
        fill: n5,
        stroke: t5,
        strokeWidth: e3.strokeWidth,
        dash: e3.dash,
        dashEnabled: e3.dashEnabled
      },
      layer: "overlay"
    };
  }
  function qe(e3) {
    let t5 = [];
    for (let n5 of e3.segments) t5.push({
      type: "line",
      points: n5.points,
      paint: {
        stroke: "black",
        strokeWidth: e3.outlineWidth,
        alpha: 0.8
      },
      lineCap: "round",
      lineJoin: "round",
      layer: "overlay"
    }), t5.push({
      type: "line",
      points: n5.points,
      paint: {
        stroke: e3.color,
        strokeWidth: e3.lineWidth,
        alpha: 0.8
      },
      lineCap: "round",
      lineJoin: "round",
      layer: "overlay"
    });
    for (let n5 of e3.triangles) t5.push({
      type: "polygon",
      vertices: n5.vertices,
      paint: {
        fill: e3.color,
        stroke: "black",
        strokeWidth: e3.outlineWidth / 4
      },
      layer: "overlay"
    });
    return t5;
  }
  var Je = {
    areaExit: 110,
    room: 100,
    label: 80,
    specialExit: 60,
    exit: 40,
    stub: 20
  };
  var Ye = {
    room: 0.3,
    areaExit: 1,
    label: 1,
    specialExit: 0.5,
    exit: 0.35,
    stub: 0.3
  };
  var Xe = (e3, t5) => ({
    x: e3,
    y: t5
  });
  var Ze = class {
    constructor() {
      this.entries = [], this.bucketSize = 5, this.roomSize = 1, this.spatialIndex = /* @__PURE__ */ new Map(), this.transform = Xe;
    }
    build(e3, t5, n5, r5) {
      this.clear(), this.roomSize = t5, this.bucketSize = Math.max(t5 * 10, 5), this.transform = n5 ?? Xe, this.layerOffset = r5, this.collectHitShapes(e3, 0, 0);
    }
    clear() {
      this.entries = [], this.spatialIndex.clear();
    }
    pick(e3, t5) {
      let n5 = null, r5 = Infinity, i3 = Infinity, a3 = -Infinity;
      return this.forEachCandidate(e3, t5, (o3, s4) => {
        let c4 = e3 - o3.cx, l4 = t5 - o3.cy, u4 = c4 * c4 + l4 * l4;
        (o3.priority > a3 || o3.priority === a3 && s4 < r5 || o3.priority === a3 && s4 === r5 && u4 < i3) && (n5 = o3, r5 = s4, i3 = u4, a3 = o3.priority);
      }), n5 ? this.toResult(n5, r5) : null;
    }
    pickAll(e3, t5) {
      let n5 = [];
      return this.forEachCandidate(e3, t5, (e4, t6) => {
        n5.push({
          entry: e4,
          dist: t6
        });
      }), n5.sort((e4, t6) => t6.entry.priority - e4.entry.priority || e4.dist - t6.dist), n5.map((e4) => this.toResult(e4.entry, e4.dist));
    }
    pickInRect(e3, t5, n5, r5, i3) {
      let a3 = Math.min(e3, n5), o3 = Math.max(e3, n5), s4 = Math.min(t5, r5), c4 = Math.max(t5, r5), l4 = [];
      for (let e4 of this.entries) i3 && !i3.includes(e4.info.kind) || e4.cx < a3 || e4.cx > o3 || e4.cy < s4 || e4.cy > c4 || l4.push(this.toResult(e4, 0));
      return l4.sort((e4, t6) => t6.priority - e4.priority), l4;
    }
    findRoomAtPoint(e3, t5) {
      let n5 = this.pick(e3, t5);
      return !n5 || n5.kind !== "room" ? null : n5.payload ?? null;
    }
    debugEntries() {
      return this.entries.map((e3) => ({
        kind: e3.info.kind,
        geoms: e3.geoms,
        marginRadius: e3.margin * this.roomSize,
        minX: e3.rMinX,
        maxX: e3.rMaxX,
        minY: e3.rMinY,
        maxY: e3.rMaxY
      }));
    }
    forEachCandidate(e3, t5, n5) {
      let r5 = Math.floor(e3 / this.bucketSize), i3 = Math.floor(t5 / this.bucketSize), a3 = /* @__PURE__ */ new Set();
      for (let o3 = -1; o3 <= 1; o3++) for (let s4 = -1; s4 <= 1; s4++) {
        let c4 = this.spatialIndex.get(at(r5 + o3, i3 + s4));
        if (c4) for (let r6 of c4) {
          if (a3.has(r6)) continue;
          a3.add(r6);
          let i4 = r6.margin * this.roomSize;
          if (e3 < r6.rMinX - i4 || e3 > r6.rMaxX + i4 || t5 < r6.rMinY - i4 || t5 > r6.rMaxY + i4) continue;
          let o4 = et(r6, e3, t5);
          o4 > i4 || n5(r6, o4);
        }
      }
    }
    toResult(e3, t5) {
      return {
        kind: e3.info.kind,
        id: e3.info.id,
        payload: e3.info.payload,
        distance: t5,
        priority: e3.priority,
        centerX: e3.cx,
        centerY: e3.cy
      };
    }
    collectHitShapes(e3, t5, n5) {
      for (let r5 of e3) {
        if (r5.hit) {
          let e4 = [], i3 = Qe();
          $e(r5, t5, n5, this.entryTransform(r5.layer), e4, i3), e4.length > 0 && i3.minX <= i3.maxX && this.indexEntry(i3, e4, r5.hit);
        }
        r5.type === "group" && this.collectHitShapes(r5.children, t5 + r5.x, n5 + r5.y);
      }
    }
    entryTransform(e3) {
      let t5 = this.layerOffset?.(e3);
      if (!t5 || t5.x === 0 && t5.y === 0) return this.transform;
      let n5 = this.transform;
      return (e4, r5) => {
        let i3 = n5(e4, r5);
        return {
          x: i3.x + t5.x,
          y: i3.y + t5.y
        };
      };
    }
    indexEntry(e3, t5, n5) {
      let r5 = n5.margin ?? Ye[n5.kind] ?? 1, i3 = n5.priority ?? Je[n5.kind] ?? 50, a3 = (e3.minX + e3.maxX) / 2, o3 = (e3.minY + e3.maxY) / 2, s4 = {
        info: n5,
        margin: r5,
        priority: i3,
        rMinX: e3.minX,
        rMaxX: e3.maxX,
        rMinY: e3.minY,
        rMaxY: e3.maxY,
        cx: a3,
        cy: o3,
        geoms: t5
      };
      this.entries.push(s4);
      let c4 = this.bucketSize, l4 = Math.floor(e3.minX / c4), u4 = Math.floor(e3.maxX / c4), d2 = Math.floor(e3.minY / c4), f3 = Math.floor(e3.maxY / c4);
      for (let e4 = l4; e4 <= u4; e4++) for (let t6 = d2; t6 <= f3; t6++) {
        let n6 = at(e4, t6), r6 = this.spatialIndex.get(n6);
        r6 || (r6 = [], this.spatialIndex.set(n6, r6)), r6.push(s4);
      }
    }
  };
  function Qe() {
    return {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    };
  }
  function Z(e3, t5, n5) {
    t5 < e3.minX && (e3.minX = t5), t5 > e3.maxX && (e3.maxX = t5), n5 < e3.minY && (e3.minY = n5), n5 > e3.maxY && (e3.maxY = n5);
  }
  function $e(e3, t5, n5, r5, i3, a3) {
    if (e3.type === "group") {
      for (let o3 of e3.children) o3.hit || Q(o3, t5 + e3.x, n5 + e3.y, r5, i3, a3);
      return;
    }
    Q(e3, t5, n5, r5, i3, a3);
  }
  function Q(e3, t5, n5, r5, i3, a3) {
    switch (e3.type) {
      case "rect":
      case "image": {
        let o3 = r5(t5 + e3.x, n5 + e3.y), s4 = r5(t5 + e3.x + e3.width, n5 + e3.y), c4 = r5(t5 + e3.x + e3.width, n5 + e3.y + e3.height), l4 = r5(t5 + e3.x, n5 + e3.y + e3.height), u4 = [
          o3.x,
          o3.y,
          s4.x,
          s4.y,
          c4.x,
          c4.y,
          l4.x,
          l4.y
        ];
        i3.push({
          type: "polyline",
          pts: u4,
          closed: true
        });
        for (let e4 = 0; e4 < u4.length; e4 += 2) Z(a3, u4[e4], u4[e4 + 1]);
        return;
      }
      case "text": {
        let o3 = e3.width ?? 0, s4 = e3.height ?? 0;
        if (o3 === 0 || s4 === 0) {
          let i4 = r5(t5 + e3.x, n5 + e3.y);
          Z(a3, i4.x, i4.y);
          return;
        }
        let c4 = r5(t5 + e3.x, n5 + e3.y), l4 = r5(t5 + e3.x + o3, n5 + e3.y), u4 = r5(t5 + e3.x + o3, n5 + e3.y + s4), d2 = r5(t5 + e3.x, n5 + e3.y + s4), f3 = [
          c4.x,
          c4.y,
          l4.x,
          l4.y,
          u4.x,
          u4.y,
          d2.x,
          d2.y
        ];
        i3.push({
          type: "polyline",
          pts: f3,
          closed: true
        });
        for (let e4 = 0; e4 < f3.length; e4 += 2) Z(a3, f3[e4], f3[e4 + 1]);
        return;
      }
      case "circle": {
        let o3 = r5(t5 + e3.cx, n5 + e3.cy);
        i3.push({
          type: "circle",
          cx: o3.x,
          cy: o3.y,
          r: e3.radius
        }), Z(a3, o3.x - e3.radius, o3.y - e3.radius), Z(a3, o3.x + e3.radius, o3.y + e3.radius);
        return;
      }
      case "line": {
        let o3 = [];
        for (let i4 = 0; i4 < e3.points.length; i4 += 2) {
          let s4 = r5(t5 + e3.points[i4], n5 + e3.points[i4 + 1]);
          o3.push(s4.x, s4.y), Z(a3, s4.x, s4.y);
        }
        o3.length >= 2 && i3.push({
          type: "polyline",
          pts: o3,
          closed: false
        });
        return;
      }
      case "polygon": {
        let o3 = [];
        for (let i4 = 0; i4 < e3.vertices.length; i4 += 2) {
          let s4 = r5(t5 + e3.vertices[i4], n5 + e3.vertices[i4 + 1]);
          o3.push(s4.x, s4.y), Z(a3, s4.x, s4.y);
        }
        o3.length >= 2 && i3.push({
          type: "polyline",
          pts: o3,
          closed: true
        });
        return;
      }
      case "group":
        for (let o3 of e3.children) o3.hit || Q(o3, t5 + e3.x, n5 + e3.y, r5, i3, a3);
        return;
    }
  }
  function et(e3, t5, n5) {
    let r5 = Infinity;
    for (let i3 of e3.geoms) {
      let e4 = tt(i3, t5, n5);
      if (e4 < r5 && (r5 = e4), r5 === 0) return 0;
    }
    return r5;
  }
  function tt(e3, t5, n5) {
    if (e3.type === "circle") {
      let r5 = t5 - e3.cx, i3 = n5 - e3.cy;
      return Math.max(0, Math.hypot(r5, i3) - e3.r);
    }
    return e3.closed && it(e3.pts, t5, n5) ? 0 : nt(e3.pts, t5, n5, e3.closed);
  }
  function nt(e3, t5, n5, r5) {
    let i3 = e3.length / 2;
    if (i3 < 2) return i3 === 1 ? Math.hypot(t5 - e3[0], n5 - e3[1]) : Infinity;
    let a3 = Infinity, o3 = r5 ? i3 : i3 - 1;
    for (let r6 = 0; r6 < o3; r6++) {
      let o4 = r6 * 2, s4 = (r6 + 1) % i3 * 2, c4 = rt(t5, n5, e3[o4], e3[o4 + 1], e3[s4], e3[s4 + 1]);
      c4 < a3 && (a3 = c4);
    }
    return a3;
  }
  function rt(e3, t5, n5, r5, i3, a3) {
    let o3 = i3 - n5, s4 = a3 - r5, c4 = o3 * o3 + s4 * s4, l4 = c4 === 0 ? 0 : ((e3 - n5) * o3 + (t5 - r5) * s4) / c4;
    l4 < 0 ? l4 = 0 : l4 > 1 && (l4 = 1);
    let u4 = n5 + l4 * o3, d2 = r5 + l4 * s4;
    return Math.hypot(e3 - u4, t5 - d2);
  }
  function it(e3, t5, n5) {
    let r5 = false, i3 = e3.length / 2;
    for (let a3 = 0, o3 = i3 - 1; a3 < i3; o3 = a3++) {
      let i4 = e3[a3 * 2], s4 = e3[a3 * 2 + 1], c4 = e3[o3 * 2], l4 = e3[o3 * 2 + 1], u4 = l4 - s4 || 1e-12;
      s4 > n5 != l4 > n5 && t5 < (c4 - i4) * (n5 - s4) / u4 + i4 && (r5 = !r5);
    }
    return r5;
  }
  function at(e3, t5) {
    return e3 * 1000003 + t5;
  }
  var ot = { transform: (e3) => e3 };
  function ct(e3, t5, n5) {
    let r5 = [];
    for (let i3 of e3) {
      let e4 = lt(i3, t5, n5);
      Array.isArray(e4) ? r5.push(...e4) : r5.push(e4);
    }
    return r5;
  }
  function lt(e3, t5, n5) {
    if (e3.type === "group") {
      let r5 = [];
      for (let i3 of e3.children) {
        let e4 = lt(i3, t5, n5);
        Array.isArray(e4) ? r5.push(...e4) : r5.push(e4);
      }
      return t5.transform({
        ...e3,
        children: r5
      }, n5);
    }
    return t5.transform(e3, n5);
  }

  // node_modules/mudlet-map-renderer/dist/Area-MLM4Xe0E.js
  var e2 = class {
    constructor(e3, t5) {
      this.rooms = [], this.labels = [], this.rooms = e3, this.labels = t5, this.bounds = this.createBounds();
    }
    getRooms() {
      return this.rooms;
    }
    getLabels() {
      return this.labels;
    }
    getBounds() {
      return this.bounds;
    }
    createBounds() {
      let e3 = this.rooms.reduce((e4, t5) => ({
        minX: Math.min(e4.minX, t5.x),
        maxX: Math.max(e4.maxX, t5.x),
        minY: Math.min(e4.minY, t5.y),
        maxY: Math.max(e4.maxY, t5.y)
      }), {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      });
      for (let t5 of this.labels) {
        let n5 = t5.X, r5 = -t5.Y;
        e3.minX = Math.min(e3.minX, n5), e3.maxX = Math.max(e3.maxX, n5 + t5.Width), e3.minY = Math.min(e3.minY, r5), e3.maxY = Math.max(e3.maxY, r5 + t5.Height);
      }
      return e3;
    }
  };
  var t2 = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
    northeast: "southwest",
    southwest: "northeast",
    northwest: "southeast",
    southeast: "northwest",
    up: "down",
    down: "up",
    in: "out",
    out: "in"
  };
  function n2(e3) {
    let n5 = /* @__PURE__ */ new Map();
    e3.forEach((e4) => {
      Object.entries(e4.exits).forEach(([t5, r6]) => {
        if (e4.id === r6) return;
        let i3 = `${Math.min(e4.id, r6)}-${Math.max(e4.id, r6)}`;
        n5.has(i3) || n5.set(i3, []), n5.get(i3).push({
          origin: e4.id,
          target: r6,
          z: e4.z,
          dir: t5
        });
      });
    });
    let r5 = /* @__PURE__ */ new Map();
    for (let [e4, i3] of n5) {
      let [n6, a3] = e4.split("-"), o3 = parseInt(n6), s4 = parseInt(a3), c4 = i3.filter((e5) => e5.origin === o3), l4 = i3.filter((e5) => e5.origin === s4), u4 = /* @__PURE__ */ new Set();
      for (let n7 of c4) {
        let i4 = -1;
        for (let e5 = 0; e5 < l4.length; e5++) if (!u4.has(e5) && l4[e5].dir === t2[n7.dir]) {
          i4 = e5;
          break;
        }
        if (i4 !== -1) {
          u4.add(i4);
          let t5 = l4[i4];
          r5.set(`${e4}-${n7.dir}`, {
            a: o3,
            b: s4,
            aDir: n7.dir,
            bDir: t5.dir,
            zIndex: [n7.z, t5.z]
          });
        } else r5.set(`${e4}-a:${n7.dir}`, {
          a: o3,
          b: s4,
          aDir: n7.dir,
          zIndex: [n7.z]
        });
      }
      for (let t5 = 0; t5 < l4.length; t5++) if (!u4.has(t5)) {
        let n7 = l4[t5];
        r5.set(`${e4}-b:${n7.dir}`, {
          a: o3,
          b: s4,
          bDir: n7.dir,
          zIndex: [n7.z]
        });
      }
    }
    return r5;
  }
  var r2 = class {
    constructor(e3) {
      this.planes = {}, this.exits = /* @__PURE__ */ new Map(), this.version = 0, this.area = e3, this.planes = this.createPlanes(), this.createExits();
    }
    getAreaName() {
      return this.area.areaName;
    }
    getAreaId() {
      return parseInt(this.area.areaId);
    }
    getVersion() {
      return this.version;
    }
    markDirty() {
      this.version++;
    }
    getPlane(e3) {
      return this.planes[e3];
    }
    getPlanes() {
      return Object.values(this.planes);
    }
    getZLevels() {
      return Object.keys(this.planes).map(Number).sort((e3, t5) => e3 - t5);
    }
    getRooms() {
      return this.area.rooms;
    }
    getFullBounds() {
      return this.getPlanes().reduce((e3, t5) => {
        let n5 = t5.getBounds();
        return {
          minX: Math.min(e3.minX, n5.minX),
          maxX: Math.max(e3.maxX, n5.maxX),
          minY: Math.min(e3.minY, n5.minY),
          maxY: Math.max(e3.maxY, n5.maxY)
        };
      }, {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      });
    }
    getLinkExits(e3) {
      return Array.from(this.exits.values()).filter((t5) => t5.zIndex.includes(e3));
    }
    createPlanes() {
      let t5 = this.area.rooms.reduce((e3, t6) => (e3[t6.z] || (e3[t6.z] = []), e3[t6.z].push(t6), e3), {});
      return Object.entries(t5).reduce((t6, [n5, r5]) => (t6[+n5] = new e2(r5, this.area.labels.filter((e3) => e3.Z === +n5)), t6), {});
    }
    createExits() {
      this.exits = n2(this.area.rooms);
    }
  };

  // node_modules/mudlet-map-renderer/dist/MapReader-BeVNpm6y.js
  var t3 = {
    rgb: [
      114,
      1,
      0
    ],
    rgbValue: "rgb(114, 1, 0)",
    symbolColor: [
      225,
      225,
      225
    ],
    symbolColorValue: "rgb(225,225,225)"
  };
  function n3(e3) {
    let t5 = e3[0] / 255, n5 = e3[1] / 255, r5 = e3[2] / 255;
    return (Math.max(t5, n5, r5) + Math.min(t5, n5, r5)) / 2;
  }
  var r3 = class {
    constructor(t5, r5) {
      this.rooms = {}, this.areas = {}, this.colors = {}, t5.forEach((t6) => {
        let n5 = {
          ...t6,
          rooms: t6.rooms.map((e3) => ({
            ...e3,
            y: -e3.y
          }))
        };
        n5.rooms.forEach((e3) => {
          this.rooms[e3.id] = e3;
        });
        let r6 = parseInt(t6.areaId);
        this.areas[r6] = new r2(n5);
      }), this.colors = r5.reduce((e3, t6) => ({
        ...e3,
        [t6.envId]: {
          rgb: t6.colors,
          rgbValue: `rgb(${t6.colors.join(",")})`,
          symbolColor: n3(t6.colors) > 0.41 ? [
            25,
            25,
            25
          ] : [
            225,
            255,
            255
          ],
          symbolColorValue: n3(t6.colors) > 0.41 ? "rgb(25,25,25)" : "rgb(225,255,255)"
        }
      }), {});
    }
    getArea(e3) {
      return this.areas[e3];
    }
    getAreas() {
      return Object.values(this.areas);
    }
    getRooms() {
      return Object.values(this.rooms);
    }
    getRoom(e3) {
      return this.rooms[e3];
    }
    getColorValue(e3) {
      return this.colors[e3]?.rgbValue ?? t3.rgbValue;
    }
    getSymbolColor(e3, n5) {
      let r5 = this.colors[e3]?.symbolColor ?? t3.symbolColor, i3 = Math.min(Math.max(n5 ?? 1, 0), 1), a3 = r5.join(",");
      return i3 == 1 ? `rgba(${a3})` : `rgba(${a3}, ${i3})`;
    }
  };

  // node_modules/mudlet-map-renderer/dist/index.mjs
  var be2 = Object.create;
  var xe2 = Object.defineProperty;
  var Se2 = Object.getOwnPropertyDescriptor;
  var Ce2 = Object.getOwnPropertyNames;
  var we2 = Object.getPrototypeOf;
  var Te2 = Object.prototype.hasOwnProperty;
  var O2 = (e3, t5) => () => (t5 || e3((t5 = { exports: {} }).exports, t5), t5.exports);
  var Ee2 = (e3, t5, n5, r5) => {
    if (t5 && typeof t5 == "object" || typeof t5 == "function") for (var i3 = Ce2(t5), a3 = 0, o3 = i3.length, s4; a3 < o3; a3++) s4 = i3[a3], !Te2.call(e3, s4) && s4 !== n5 && xe2(e3, s4, {
      get: ((e4) => t5[e4]).bind(null, s4),
      enumerable: !(r5 = Se2(t5, s4)) || r5.enumerable
    });
    return e3;
  };
  var De2 = (e3, t5, n5) => (n5 = e3 == null ? {} : be2(we2(e3)), Ee2(t5 || !e3 || !e3.__esModule ? xe2(n5, "default", {
    value: e3,
    enumerable: true
  }) : n5, e3));
  var Oe2 = 0.6;
  var ke2 = 0.025;
  var Ae2 = "rgb(225, 225, 225)";
  function je2() {
    return {
      roomSize: Oe2,
      lineWidth: ke2,
      lineColor: Ae2,
      backgroundColor: "#000000",
      instantMapMove: false,
      highlightCurrentRoom: true,
      cullingEnabled: true,
      cullingMode: "indexed",
      coalesceRooms: false,
      cullingBounds: null,
      labelRenderMode: "image",
      transparentLabels: false,
      roomShape: "rectangle",
      hiddenRooms: "hide",
      playerMarker: {
        strokeColor: "#00e5b2",
        strokeAlpha: 1,
        fillColor: "#00e5b2",
        fillAlpha: 0,
        strokeWidth: 0.1,
        sizeFactor: 1.7,
        dash: [0.05, 0.05],
        dashEnabled: true,
        matchRoomShape: false
      },
      highlight: {
        strokeAlpha: 1,
        fillAlpha: 0,
        strokeWidth: 0.1,
        sizeFactor: 1.425,
        dash: [0.05, 0.05],
        dashEnabled: true,
        matchRoomShape: true,
        shape: "match"
      },
      gridEnabled: false,
      gridSize: 1,
      gridColor: "rgba(200, 200, 200, 0.15)",
      gridLineWidth: 0.03,
      borders: true,
      frameMode: false,
      coloredMode: false,
      emboss: false,
      areaName: true,
      fontFamily: "sans-serif",
      uniformLevelSize: false,
      areaExitLabels: false,
      areaExitLabelFontSize: 0.3,
      neighborSpill: false,
      neighborSpillDistance: 20,
      lodEnabled: false,
      lodRoomBudget: 16e3,
      lodHitTestBudget: 1e4,
      lodExitBudget: 12e3
    };
  }
  var Me2 = class {
    constructor(e3, t5) {
      this.events = new _(), this.highlights = /* @__PURE__ */ new Map(), this.paths = [], this.lens = v, this.mapReader = e3, this.settings = t5;
    }
    setLens(e3) {
      this.lens = e3, this.events.emit("lens", { lens: e3 });
    }
    setArea(e3, t5) {
      let n5 = this.mapReader.getArea(e3);
      return n5 ? (this.currentArea = e3, this.currentAreaInstance = n5, this.currentZIndex = t5, this.currentAreaVersion = n5.getVersion(), this.events.emit("area", {
        area: n5,
        zIndex: t5
      }), true) : false;
    }
    setPosition(e3, t5 = true) {
      let n5 = this.mapReader.getRoom(e3);
      if (!n5) return false;
      let r5 = this.mapReader.getArea(n5.area), i3 = r5?.getVersion(), a3 = this.currentArea !== n5.area || this.currentZIndex !== n5.z || i3 !== void 0 && this.currentAreaVersion !== i3 || r5 !== void 0 && this.currentAreaInstance !== r5;
      return a3 && this.setArea(n5.area, n5.z), this.positionRoomId = e3, this.events.emit("position", {
        roomId: e3,
        center: t5,
        areaChanged: a3
      }), true;
    }
    updatePositionMarker(e3) {
      this.positionRoomId = e3, this.events.emit("position", {
        roomId: e3,
        center: false,
        areaChanged: false
      });
    }
    refreshPosition() {
      this.positionRoomId !== void 0 && this.events.emit("position", {
        roomId: this.positionRoomId,
        center: false,
        areaChanged: false
      });
    }
    clearPosition() {
      this.positionRoomId = void 0, this.events.emit("position", {
        roomId: void 0,
        center: false,
        areaChanged: false
      });
    }
    setCenterRoom(e3, t5) {
      let n5 = this.mapReader.getRoom(e3);
      if (!n5) return false;
      let r5 = this.currentArea !== n5.area || this.currentZIndex !== n5.z;
      return (r5 || this.needsAreaRedraw(n5)) && this.setArea(n5.area, n5.z), this.centerRoomId = e3, this.events.emit("center", {
        roomId: e3,
        instant: t5 ?? r5
      }), true;
    }
    needsAreaRedraw(e3) {
      let t5 = this.mapReader.getArea(e3.area), n5 = t5?.getVersion();
      return n5 !== void 0 && this.currentAreaVersion !== n5 || t5 !== void 0 && this.currentAreaInstance !== t5;
    }
    addHighlight(e3, t5) {
      let n5 = this.mapReader.getRoom(e3);
      if (!n5) return false;
      let r5 = Array.isArray(t5) ? t5.length > 0 ? [...t5] : ["#ffffff"] : [t5];
      return this.highlights.set(e3, {
        colors: r5,
        color: r5[0],
        area: n5.area,
        z: n5.z
      }), this.events.emit("highlight", {
        roomId: e3,
        colors: r5,
        color: r5[0]
      }), true;
    }
    removeHighlight(e3) {
      this.highlights.has(e3) && (this.highlights.delete(e3), this.events.emit("highlight", {
        roomId: e3,
        colors: void 0,
        color: void 0
      }));
    }
    hasHighlight(e3) {
      return this.highlights.has(e3);
    }
    clearHighlights() {
      this.highlights.clear(), this.events.emit("clear", void 0);
    }
    addPath(e3, t5 = "#66E64D") {
      this.paths.push({
        locations: e3,
        color: t5
      }), this.events.emit("path", void 0);
    }
    clearPaths() {
      this.paths = [], this.events.emit("path", void 0);
    }
    getOverlaysForArea(e3) {
      let t5 = { ...e3 };
      if (this.positionRoomId !== void 0) {
        let e4 = this.mapReader.getRoom(this.positionRoomId);
        e4 && e4.area === this.currentArea && e4.z === this.currentZIndex && (t5.position = { roomId: this.positionRoomId });
      }
      let n5 = [...e3?.highlights ?? []];
      for (let [e4, t6] of this.highlights) t6.area === this.currentArea && t6.z === this.currentZIndex && n5.push({
        roomId: e4,
        color: t6.colors
      });
      n5.length > 0 && (t5.highlights = n5);
      let r5 = [...e3?.paths ?? []];
      return r5.push(...this.paths), r5.length > 0 && (t5.paths = r5), t5;
    }
    getEffectiveBounds(e3, t5) {
      return this.settings.uniformLevelSize ? e3.getFullBounds() : t5.getBounds();
    }
    computeExportBounds(e3, t5, n5, r5) {
      if (n5 !== void 0) {
        let e4 = this.mapReader.getRoom(n5);
        if (!e4) throw Error(`Room ${n5} not found`);
        return {
          x: e4.x - r5,
          y: e4.y - r5,
          w: r5 * 2,
          h: r5 * 2
        };
      }
      let i3 = this.getEffectiveBounds(e3, t5), a3 = this.settings.areaName ? e3.getAreaName() : void 0, o3 = a3 ? 7 : 0, s4 = a3 ? 3.5 : 0, c4 = i3.minX - s4, l4 = i3.minY - o3, u4 = a3 ? i3.minX - 3.5 + a3.length * 2.5 * 0.6 : -Infinity, d2 = Math.max(i3.maxX, u4);
      return {
        x: c4 - r5,
        y: l4 - r5,
        w: d2 - c4 + r5 * 2,
        h: i3.maxY - l4 + r5 * 2
      };
    }
  };
  function Ne2(e3, t5, n5 = {}) {
    if (!t5.gridEnabled) return [];
    let r5 = n5.inverseTransform ?? ((e4, t6) => ({
      x: e4,
      y: t6
    })), { minX: i3, maxX: a3, minY: o3, maxY: s4 } = e3, c4 = r5(i3, o3), l4 = r5(a3, o3), u4 = r5(a3, s4), d2 = r5(i3, s4), f3 = Math.min(c4.x, l4.x, u4.x, d2.x), p3 = Math.max(c4.x, l4.x, u4.x, d2.x), m3 = Math.min(c4.y, l4.y, u4.y, d2.y), h3 = Math.max(c4.y, l4.y, u4.y, d2.y), g3 = t5.gridSize * 2, _3 = Math.floor((f3 - g3) / t5.gridSize) * t5.gridSize, v3 = Math.ceil((p3 + g3) / t5.gridSize) * t5.gridSize, y3 = Math.floor((m3 - g3) / t5.gridSize) * t5.gridSize, b3 = Math.ceil((h3 + g3) / t5.gridSize) * t5.gridSize, x2 = [], S2 = {
      stroke: t5.gridColor,
      strokeWidth: t5.gridLineWidth
    };
    for (let e4 = _3; e4 <= v3; e4 += t5.gridSize) x2.push({
      type: "line",
      points: [
        e4,
        y3,
        e4,
        b3
      ],
      paint: S2,
      grid: true,
      layer: "grid"
    });
    for (let e4 = y3; e4 <= b3; e4 += t5.gridSize) x2.push({
      type: "line",
      points: [
        _3,
        e4,
        v3,
        e4
      ],
      paint: S2,
      grid: true,
      layer: "grid"
    });
    return x2;
  }
  function Pe2(e3, t5, n5, r5) {
    if (!n5.cullingEnabled) return /* @__PURE__ */ new Map();
    let { minX: i3, maxX: a3, minY: o3, maxY: s4 } = t5, c4 = n5.roomSize / 2, l4 = r5?.forward, u4 = (e4, t6, n6, r6) => {
      if (l4) {
        let c5 = Fe2(e4, t6, n6, r6, l4);
        return c5.maxX >= i3 && c5.minX <= a3 && c5.maxY >= o3 && c5.minY <= s4;
      }
      return n6 >= i3 && e4 <= a3 && r6 >= o3 && t6 <= s4;
    }, d2 = /* @__PURE__ */ new Map();
    for (let { room: t6, shape: n6 } of e3.roomShapeRefs.values()) d2.set(n6, u4(t6.x - c4, t6.y - c4, t6.x + c4, t6.y + c4));
    for (let { shape: t6, bounds: n6 } of e3.standaloneExitShapeRefs) d2.set(t6, u4(n6.x, n6.y, n6.x + n6.width, n6.y + n6.height));
    for (let { shape: t6, bounds: n6 } of e3.labelShapeRefs) d2.set(t6, u4(n6.x, n6.y, n6.x + n6.width, n6.y + n6.height));
    for (let { shape: t6, bounds: n6 } of e3.specialExitShapeRefs) d2.set(t6, u4(n6.x, n6.y, n6.x + n6.width, n6.y + n6.height));
    for (let { shape: t6, bounds: n6 } of e3.stubShapeRefs) d2.set(t6, u4(n6.x, n6.y, n6.x + n6.width, n6.y + n6.height));
    for (let { shape: t6, bounds: n6 } of e3.areaExitLabelShapeRefs) d2.set(t6, u4(n6.x, n6.y, n6.x + n6.width, n6.y + n6.height));
    return d2;
  }
  function Fe2(e3, t5, n5, r5, i3) {
    let a3 = i3(e3, t5), o3 = i3(n5, t5), s4 = i3(n5, r5), c4 = i3(e3, r5);
    return {
      minX: Math.min(a3.x, o3.x, s4.x, c4.x),
      minY: Math.min(a3.y, o3.y, s4.y, c4.y),
      maxX: Math.max(a3.x, o3.x, s4.x, c4.x),
      maxY: Math.max(a3.y, o3.y, s4.y, c4.y)
    };
  }
  function Ie2(e3, t5, n5, r5) {
    let i3 = Ne2(t5, n5, { inverseTransform: r5?.inverse });
    if (!n5.cullingEnabled) return {
      ...e3.sceneShapes,
      grid: i3
    };
    let a3 = Pe2(e3, t5, n5, r5);
    return {
      grid: i3,
      link: e3.sceneShapes.link.filter((e4) => a3.get(e4) ?? true),
      room: e3.sceneShapes.room.filter((e4) => a3.get(e4) ?? true),
      topLabel: e3.sceneShapes.topLabel
    };
  }
  var Le2 = 256;
  var Re2 = 2;
  var ze2 = 32;
  var Be2 = 1 << 20;
  var Ve2 = class {
    constructor() {
      this.entries = [], this.allShapes = /* @__PURE__ */ new Set(), this.linear = true, this.originX = 0, this.originY = 0, this.cellSize = 1, this.cols = 0, this.rows = 0, this.cells = [], this.oversized = [], this.stamp = new Int32Array(), this.queryGen = 0;
    }
    build(e3) {
      this.entries = e3, this.allShapes = new Set(e3.map((e4) => e4.shape));
      let t5 = e3.length;
      if (t5 < Le2) {
        this.linear = true;
        return;
      }
      this.linear = false;
      let n5 = Infinity, r5 = Infinity, i3 = -Infinity, a3 = -Infinity;
      for (let t6 of e3) t6.minX < n5 && (n5 = t6.minX), t6.minY < r5 && (r5 = t6.minY), t6.maxX > i3 && (i3 = t6.maxX), t6.maxY > a3 && (a3 = t6.maxY);
      let o3 = Math.max(i3 - n5, 1e-6), s4 = Math.max(a3 - r5, 1e-6), c4 = Math.sqrt(o3 * s4 / Math.max(t5 / Re2, 1));
      (!isFinite(c4) || c4 <= 0) && (c4 = Math.max(o3, s4));
      let l4 = Math.max(1, Math.ceil(o3 / c4)), u4 = Math.max(1, Math.ceil(s4 / c4));
      for (; l4 * u4 > Be2; ) c4 *= 2, l4 = Math.max(1, Math.ceil(o3 / c4)), u4 = Math.max(1, Math.ceil(s4 / c4));
      this.originX = n5, this.originY = r5, this.cellSize = c4, this.cols = l4, this.rows = u4, this.cells = Array.from({ length: l4 * u4 }, () => []), this.oversized = [], this.stamp = new Int32Array(t5), this.queryGen = 0;
      for (let i4 = 0; i4 < t5; i4++) {
        let t6 = e3[i4], a4 = this.clampCol(Math.floor((t6.minX - n5) / c4)), o4 = this.clampCol(Math.floor((t6.maxX - n5) / c4)), s5 = this.clampRow(Math.floor((t6.minY - r5) / c4)), u5 = this.clampRow(Math.floor((t6.maxY - r5) / c4));
        if ((o4 - a4 + 1) * (u5 - s5 + 1) > ze2) {
          this.oversized.push(i4);
          continue;
        }
        for (let e4 = s5; e4 <= u5; e4++) {
          let t7 = e4 * l4;
          for (let e5 = a4; e5 <= o4; e5++) this.cells[t7 + e5].push(i4);
        }
      }
    }
    getAllShapes() {
      return this.allShapes;
    }
    queryVisible(e3) {
      let t5 = /* @__PURE__ */ new Set(), { minX: n5, maxX: r5, minY: i3, maxY: a3 } = e3;
      if (this.linear) {
        for (let e4 of this.entries) e4.maxX >= n5 && e4.minX <= r5 && e4.maxY >= i3 && e4.minY <= a3 && t5.add(e4.shape);
        return t5;
      }
      let o3 = ++this.queryGen, s4 = this.stamp, c4 = this.entries, l4 = this.cols, u4 = this.clampCol(Math.floor((n5 - this.originX) / this.cellSize)), d2 = this.clampCol(Math.floor((r5 - this.originX) / this.cellSize)), f3 = this.clampRow(Math.floor((i3 - this.originY) / this.cellSize)), p3 = this.clampRow(Math.floor((a3 - this.originY) / this.cellSize));
      for (let e4 = f3; e4 <= p3; e4++) {
        let f4 = e4 * l4;
        for (let e5 = u4; e5 <= d2; e5++) {
          let l5 = this.cells[f4 + e5];
          for (let e6 = 0; e6 < l5.length; e6++) {
            let u5 = l5[e6];
            if (s4[u5] === o3) continue;
            s4[u5] = o3;
            let d3 = c4[u5];
            d3.maxX >= n5 && d3.minX <= r5 && d3.maxY >= i3 && d3.minY <= a3 && t5.add(d3.shape);
          }
        }
      }
      for (let e4 = 0; e4 < this.oversized.length; e4++) {
        let o4 = c4[this.oversized[e4]];
        o4.maxX >= n5 && o4.minX <= r5 && o4.maxY >= i3 && o4.minY <= a3 && t5.add(o4.shape);
      }
      return t5;
    }
    clampCol(e3) {
      return e3 < 0 ? 0 : e3 >= this.cols ? this.cols - 1 : e3;
    }
    clampRow(e3) {
      return e3 < 0 ? 0 : e3 >= this.rows ? this.rows - 1 : e3;
    }
  };
  function He2(t5, n5, r5, i3, a3) {
    if (a3 === x) return {
      minX: t5,
      minY: n5,
      maxX: r5,
      maxY: i3
    };
    let o3 = a3(t5, n5), s4 = a3(r5, n5), c4 = a3(r5, i3), l4 = a3(t5, i3);
    return {
      minX: Math.min(o3.x, s4.x, c4.x, l4.x),
      minY: Math.min(o3.y, s4.y, c4.y, l4.y),
      maxX: Math.max(o3.x, s4.x, c4.x, l4.x),
      maxY: Math.max(o3.y, s4.y, c4.y, l4.y)
    };
  }
  var Ue2 = {
    grid: [],
    link: [],
    room: [],
    topLabel: []
  };
  var We2 = class {
    constructor(e3, t5, n5) {
      this.camera = e3, this.settings = t5, this.standaloneExitShapeSet = /* @__PURE__ */ new Set(), this.pipeline = new Oe(n5, t5);
    }
    get exitRenderer() {
      return this.pipeline.exitRenderer;
    }
    get lastResult() {
      return this.lastBuildResult;
    }
    get drawnExits() {
      return this.lastBuildResult?.drawnExits ?? [];
    }
    get drawnSpecialExits() {
      return this.lastBuildResult?.drawnSpecialExits ?? [];
    }
    get drawnStubs() {
      return this.lastBuildResult?.drawnStubs ?? [];
    }
    get areaExitHitZones() {
      return this.lastBuildResult?.areaExitHitZones ?? [];
    }
    get hitShapes() {
      return this.lastBuildResult?.hitShapes ?? [];
    }
    rebuild(e3, t5, n5, r5, i3) {
      return this.lastBuildResult = this.pipeline.buildScene(e3, t5, n5, r5, i3), this.standaloneExitShapeSet = new Set(this.lastBuildResult.standaloneExitShapeRefs.map((e4) => e4.shape)), this.cullIndex = void 0, this.cullIndexTransform = void 0, this.lastBuildResult;
    }
    buildExitShape(e3) {
      return this.pipeline.buildExitShape(e3);
    }
    reset() {
      this.lastBuildResult = void 0, this.standaloneExitShapeSet = /* @__PURE__ */ new Set(), this.cullIndex = void 0, this.cullIndexTransform = void 0;
    }
    resetPipeline(e3) {
      this.pipeline = new Oe(e3, this.settings), this.reset();
    }
    cullInteractive(t5 = x) {
      if (!this.lastBuildResult) return /* @__PURE__ */ new Set();
      let n5 = this.ensureCullIndex(t5);
      if (!this.settings.cullingEnabled) return new Set(n5.getAllShapes());
      let r5 = this.camera.getCullingViewport(this.settings.cullingBounds);
      return n5.queryVisible(r5);
    }
    managedShapes(t5 = x) {
      return this.lastBuildResult ? new Set(this.ensureCullIndex(t5).getAllShapes()) : /* @__PURE__ */ new Set();
    }
    ensureCullIndex(e3) {
      if (this.cullIndex && this.cullIndexTransform === e3) return this.cullIndex;
      let t5 = new Ve2();
      return t5.build(this.buildCullEntries(e3)), this.cullIndex = t5, this.cullIndexTransform = e3, t5;
    }
    buildCullEntries(e3) {
      let t5 = this.lastBuildResult, n5 = this.settings.roomSize / 2, r5 = [], i3 = (t6, n6, i4, a3, o3) => {
        let s4 = He2(n6, i4, a3, o3, e3);
        r5.push({
          shape: t6,
          minX: s4.minX,
          minY: s4.minY,
          maxX: s4.maxX,
          maxY: s4.maxY
        });
      };
      for (let { room: e4, shape: r6 } of t5.roomShapeRefs.values()) i3(r6, e4.x - n5, e4.y - n5, e4.x + n5, e4.y + n5);
      for (let { shape: e4, bounds: n6 } of t5.standaloneExitShapeRefs) i3(e4, n6.x, n6.y, n6.x + n6.width, n6.y + n6.height);
      for (let { shape: e4, bounds: n6 } of t5.labelShapeRefs) i3(e4, n6.x, n6.y, n6.x + n6.width, n6.y + n6.height);
      for (let { shape: e4, bounds: n6 } of t5.specialExitShapeRefs) i3(e4, n6.x, n6.y, n6.x + n6.width, n6.y + n6.height);
      for (let { shape: e4, bounds: n6 } of t5.stubShapeRefs) i3(e4, n6.x, n6.y, n6.x + n6.width, n6.y + n6.height);
      for (let { shape: e4, bounds: n6 } of t5.areaExitLabelShapeRefs) i3(e4, n6.x, n6.y, n6.x + n6.width, n6.y + n6.height);
      return r5;
    }
    cull(t5 = x) {
      if (!this.lastBuildResult) return {
        shapes: Ue2,
        stats: {
          visibleRooms: 0,
          totalRooms: 0,
          visibleExits: 0
        }
      };
      let n5 = this.camera.getCullingViewport(this.settings.cullingBounds), r5 = t5 === x ? void 0 : { forward: t5 }, i3 = Ie2(this.lastBuildResult, n5, this.settings, r5);
      return {
        shapes: i3,
        stats: {
          visibleRooms: i3.room.length,
          totalRooms: this.lastBuildResult.roomShapeRefs.size,
          visibleExits: i3.link.filter((e3) => this.standaloneExitShapeSet.has(e3)).length
        }
      };
    }
  };
  function k2(e3, t5) {
    if (typeof t5 == "string") return t5;
    if (t5.type === "linear") {
      let n6 = e3.createLinearGradient(t5.x0, t5.y0, t5.x1, t5.y1);
      for (let e4 of t5.stops) n6.addColorStop(e4.offset, e4.color);
      return n6;
    }
    let n5 = t5.fx ?? t5.cx, r5 = t5.fy ?? t5.cy, i3 = t5.fr ?? 0, a3 = e3.createRadialGradient(n5, r5, i3, t5.cx, t5.cy, t5.r);
    for (let e4 of t5.stops) a3.addColorStop(e4.offset, e4.color);
    return a3;
  }
  function A2(e3, t5) {
    switch (t5.type) {
      case "rect":
        e3.beginPath(), t5.cr > 0 && typeof e3.roundRect == "function" ? e3.roundRect(t5.x, t5.y, t5.w, t5.h, t5.cr) : e3.rect(t5.x, t5.y, t5.w, t5.h), t5.fill && (e3.fillStyle = k2(e3, t5.fill), e3.fill()), t5.stroke && t5.sw > 0 && (e3.strokeStyle = t5.stroke, e3.lineWidth = t5.sw, t5.dash ? e3.setLineDash(t5.dash) : e3.setLineDash([]), e3.stroke());
        break;
      case "circle":
        e3.beginPath(), e3.arc(t5.cx, t5.cy, t5.r, 0, Math.PI * 2), t5.fill && (e3.fillStyle = k2(e3, t5.fill), e3.fill()), t5.stroke && t5.sw > 0 && (e3.strokeStyle = t5.stroke, e3.lineWidth = t5.sw, t5.dash ? e3.setLineDash(t5.dash) : e3.setLineDash([]), e3.stroke());
        break;
      case "line": {
        if (t5.points.length < 4) break;
        let n5 = e3.globalAlpha;
        t5.alpha !== void 0 && (e3.globalAlpha = t5.alpha), e3.beginPath(), e3.moveTo(t5.points[0], t5.points[1]);
        for (let n6 = 2; n6 < t5.points.length; n6 += 2) e3.lineTo(t5.points[n6], t5.points[n6 + 1]);
        t5.stroke && (e3.strokeStyle = t5.stroke), e3.lineWidth = t5.sw, t5.dash ? e3.setLineDash(t5.dash) : e3.setLineDash([]), t5.lineCap && (e3.lineCap = t5.lineCap), t5.lineJoin && (e3.lineJoin = t5.lineJoin), e3.stroke(), t5.alpha !== void 0 && (e3.globalAlpha = n5);
        break;
      }
      case "polygon":
        if (t5.vertices.length < 4) break;
        e3.beginPath(), e3.moveTo(t5.vertices[0], t5.vertices[1]);
        for (let n5 = 2; n5 < t5.vertices.length; n5 += 2) e3.lineTo(t5.vertices[n5], t5.vertices[n5 + 1]);
        e3.closePath(), t5.fill && (e3.fillStyle = k2(e3, t5.fill), e3.fill()), t5.stroke && t5.sw > 0 && (e3.strokeStyle = t5.stroke, e3.lineWidth = t5.sw, e3.setLineDash([]), e3.stroke());
        break;
      case "text": {
        let n5 = t5.fontSize * 100, r5 = `${t5.fontStyle} ${n5}px ${t5.fontFamily}`;
        e3.save(), e3.font = r5, e3.fillStyle = t5.fill, t5.stroke && t5.sw > 0 && (e3.strokeStyle = t5.stroke, e3.lineWidth = t5.sw * 100, e3.lineJoin = "round");
        let i3 = t5.baselineRatio !== void 0;
        if (t5.transform) if (e3.transform(...t5.transform), e3.scale(1 / 100, 1 / 100), e3.textAlign = "center", i3) {
          e3.textBaseline = "alphabetic";
          let n6 = (t5.h / 2 + t5.baselineRatio * t5.fontSize) * 100;
          t5.stroke && t5.sw > 0 && e3.strokeText(t5.text, t5.w * 100 / 2, n6), e3.fillText(t5.text, t5.w * 100 / 2, n6);
        } else {
          e3.textBaseline = "middle";
          let n6 = t5.w * 100 / 2, r6 = t5.h * 100 / 2;
          t5.stroke && t5.sw > 0 && e3.strokeText(t5.text, n6, r6), e3.fillText(t5.text, n6, r6);
        }
        else if (t5.w > 0 && t5.h > 0) {
          e3.textAlign = t5.align || "left";
          let n6 = t5.align === "center" ? t5.x + t5.w / 2 : t5.x;
          if (e3.scale(1 / 100, 1 / 100), t5.vAlign === "middle" && i3) {
            e3.textBaseline = "alphabetic";
            let r6 = t5.y + t5.h / 2 + t5.baselineRatio * t5.fontSize;
            t5.stroke && t5.sw > 0 && e3.strokeText(t5.text, n6 * 100, r6 * 100), e3.fillText(t5.text, n6 * 100, r6 * 100);
          } else {
            e3.textBaseline = t5.vAlign === "middle" ? "middle" : "top";
            let r6 = t5.vAlign === "middle" ? t5.y + t5.h / 2 : t5.y;
            t5.stroke && t5.sw > 0 && e3.strokeText(t5.text, n6 * 100, r6 * 100), e3.fillText(t5.text, n6 * 100, r6 * 100);
          }
        } else e3.textAlign = "left", e3.textBaseline = "top", e3.scale(1 / 100, 1 / 100), t5.stroke && t5.sw > 0 && e3.strokeText(t5.text, t5.x * 100, t5.y * 100), e3.fillText(t5.text, t5.x * 100, t5.y * 100);
        e3.restore();
        break;
      }
      case "image":
        if (!t5.image) break;
        t5.transform ? (e3.save(), e3.transform(...t5.transform), e3.drawImage(t5.image, 0, 0, t5.w, t5.h), e3.restore()) : e3.drawImage(t5.image, t5.x, t5.y, t5.w, t5.h);
        break;
    }
  }
  var Ge2 = class {
    constructor(e3, t5) {
      this._visible = true, this.noScaling = false, this.commands = [], this.x = e3, this.y = t5;
    }
    setVisible(e3) {
      this._visible = e3, this._konvaGroup?.visible(e3);
    }
    isVisible() {
      return this._visible;
    }
    destroy() {
      this._konvaGroup?.destroy(), this._konvaGroup = void 0, this.commands.length = 0;
    }
    setPosition(e3, t5) {
      this.x = e3, this.y = t5, this._konvaGroup?.position({
        x: e3,
        y: t5
      });
    }
    getPosition() {
      return {
        x: this.x,
        y: this.y
      };
    }
    moveToTop() {
      this._konvaGroup?.moveToTop();
    }
    materialize() {
      if (this._konvaGroup) return this._konvaGroup;
      let e3 = new lib_default.Group({
        x: this.x,
        y: this.y,
        listening: false,
        visible: this._visible
      }), t5 = this.commands;
      return e3.add(new lib_default.Shape({
        listening: false,
        perfectDrawEnabled: false,
        sceneFunc: (e4) => {
          let n5 = e4._context;
          for (let e5 of t5) A2(n5, e5);
        }
      })), this._konvaGroup = e3, e3;
    }
  };
  function Ke2(e3) {
    if (e3.noScaling || e3.commands.length !== 1) return null;
    let t5 = e3.commands[0];
    return t5.type === "rect" ? typeof t5.fill != "string" && t5.fill !== void 0 || t5.dash ? null : `r|${t5.fill ?? ""}|${t5.stroke ?? ""}|${t5.sw}|${t5.cr}` : t5.type === "circle" ? typeof t5.fill != "string" && t5.fill !== void 0 || t5.dash ? null : `c|${t5.fill ?? ""}|${t5.stroke ?? ""}|${t5.sw}|${t5.r}` : t5.type === "line" ? t5.dash || t5.alpha !== void 0 ? null : `l|${t5.stroke ?? ""}|${t5.sw}|${t5.lineCap ?? ""}|${t5.lineJoin ?? ""}` : null;
  }
  var qe2 = class {
    constructor(e3, t5 = () => false) {
      this.coalesce = t5, this.entries = [], this.nodeToEntry = /* @__PURE__ */ new Map(), this.buckets = /* @__PURE__ */ new Map(), this.konvaLayer = e3, e3.destroyChildren();
      let n5 = this;
      this.konvaShape = new lib_default.Shape({
        listening: false,
        perfectDrawEnabled: false,
        sceneFunc: (e4) => {
          let t6 = e4._context;
          n5.coalesce() ? n5.drawCoalesced(t6) : n5.drawPerEntry(t6);
        }
      }), e3.add(this.konvaShape);
    }
    drawPerEntry(e3) {
      let t5 = e3.getTransform(), n5 = t5.a, r5 = t5.b, i3 = t5.c, a3 = t5.d;
      for (let o3 of this.entries) {
        if (!o3.visible) continue;
        let s4 = n5 * o3.x + i3 * o3.y + t5.e, c4 = r5 * o3.x + a3 * o3.y + t5.f;
        o3.noScaling ? e3.setTransform(75, 0, 0, 75, s4, c4) : e3.setTransform(n5, r5, i3, a3, s4, c4);
        for (let t6 of o3.commands) A2(e3, t6);
      }
      e3.setTransform(t5);
    }
    drawCoalesced(e3) {
      let t5 = e3.getTransform();
      this.sweep(e3, t5, (e4) => e4.layer !== "room"), this.sweep(e3, t5, (e4) => e4.layer === "room"), e3.setTransform(t5);
    }
    sweep(e3, t5, n5) {
      let r5 = t5.a, i3 = t5.b, a3 = t5.c, o3 = t5.d, s4 = t5.e, c4 = t5.f, l4 = this.buckets;
      l4.clear();
      for (let t6 of this.entries) {
        if (!t6.visible || !n5(t6)) continue;
        let u4 = Ke2(t6);
        if (u4 === null) {
          let n6 = r5 * t6.x + a3 * t6.y + s4, l5 = i3 * t6.x + o3 * t6.y + c4;
          t6.noScaling ? e3.setTransform(75, 0, 0, 75, n6, l5) : e3.setTransform(r5, i3, a3, o3, n6, l5);
          for (let n7 of t6.commands) A2(e3, n7);
        } else {
          let e4 = l4.get(u4);
          e4 || l4.set(u4, e4 = []), e4.push(t6);
        }
      }
      if (l4.size !== 0) {
        e3.setTransform(r5, i3, a3, o3, s4, c4);
        for (let t6 of l4.values()) {
          let n6 = t6[0].commands[0];
          if (e3.beginPath(), n6.type === "rect") {
            let r6 = n6.cr > 0 && typeof e3.roundRect == "function";
            for (let i4 of t6) r6 ? e3.roundRect(i4.x + n6.x, i4.y + n6.y, n6.w, n6.h, n6.cr) : e3.rect(i4.x + n6.x, i4.y + n6.y, n6.w, n6.h);
            n6.fill && (e3.fillStyle = n6.fill, e3.fill()), n6.stroke && n6.sw > 0 && (e3.strokeStyle = n6.stroke, e3.lineWidth = n6.sw, e3.setLineDash([]), e3.stroke());
          } else if (n6.type === "circle") {
            for (let r6 of t6) {
              let t7 = r6.x + n6.cx, i4 = r6.y + n6.cy;
              e3.moveTo(t7 + n6.r, i4), e3.arc(t7, i4, n6.r, 0, Math.PI * 2);
            }
            n6.fill && (e3.fillStyle = n6.fill, e3.fill()), n6.stroke && n6.sw > 0 && (e3.strokeStyle = n6.stroke, e3.lineWidth = n6.sw, e3.setLineDash([]), e3.stroke());
          } else if (n6.type === "line") {
            for (let n7 of t6) {
              let t7 = n7.commands[0].points;
              if (!(t7.length < 4)) {
                e3.moveTo(t7[0] + n7.x, t7[1] + n7.y);
                for (let r6 = 2; r6 < t7.length; r6 += 2) e3.lineTo(t7[r6] + n7.x, t7[r6 + 1] + n7.y);
              }
            }
            n6.stroke && (e3.strokeStyle = n6.stroke), e3.lineWidth = n6.sw, e3.setLineDash([]), n6.lineCap && (e3.lineCap = n6.lineCap), n6.lineJoin && (e3.lineJoin = n6.lineJoin), e3.stroke();
          }
        }
      }
    }
    addNode(e3) {
      let t5 = {
        x: e3.x,
        y: e3.y,
        noScaling: e3.noScaling,
        layer: e3.layer,
        commands: e3.commands,
        visible: e3._visible
      };
      this.entries.push(t5), this.nodeToEntry.set(e3, t5), this.ensureShape();
    }
    getEntry(e3) {
      return this.nodeToEntry.get(e3);
    }
    destroyChildren() {
      this.entries.length = 0, this.nodeToEntry.clear();
    }
    batchDraw() {
      this.konvaLayer.batchDraw();
    }
    ensureShape() {
      this.konvaShape.getParent() || this.konvaLayer.add(this.konvaShape);
    }
  };
  var j2 = class {
    constructor(e3) {
      this.groups = [], this.konvaLayer = e3, e3.destroyChildren();
      let t5 = this;
      this.konvaShape = new lib_default.Shape({
        listening: false,
        perfectDrawEnabled: false,
        sceneFunc: (e4) => {
          let n5 = e4._context, r5 = n5.getTransform(), i3 = r5.a, a3 = r5.b, o3 = r5.c, s4 = r5.d;
          for (let e5 of t5.groups) {
            if (!e5._visible) continue;
            let t6 = i3 * e5.x + o3 * e5.y + r5.e, c4 = a3 * e5.x + s4 * e5.y + r5.f;
            e5.noScaling ? n5.setTransform(75, 0, 0, 75, t6, c4) : n5.setTransform(i3, a3, o3, s4, t6, c4);
            for (let t7 of e5.commands) A2(n5, t7);
          }
          n5.setTransform(r5);
        }
      }), e3.add(this.konvaShape);
    }
    addNode(e3) {
      this.groups.push(e3), this.ensureShape();
    }
    destroyChildren() {
      this.groups.length = 0;
    }
    batchDraw() {
      this.konvaLayer.batchDraw();
    }
    ensureShape() {
      this.konvaShape.getParent() || this.konvaLayer.add(this.konvaShape);
    }
  };
  var Je2 = class {
    constructor(e3) {
      this.konvaLayer = e3;
    }
    addNode(e3) {
      this.konvaLayer.add(e3.materialize());
    }
    destroyChildren() {
      this.konvaLayer.destroyChildren();
    }
    batchDraw() {
      this.konvaLayer.batchDraw();
    }
  };
  function Ye2(e3) {
    return typeof e3 == "object" && !!e3;
  }
  function Xe2(e3, t5) {
    return t5 !== false && e3 ? e3 : void 0;
  }
  function M2(e3, t5, n5, r5, i3, a3) {
    return Ye2(e3) ? e3.type === "linear" ? {
      type: "linear",
      x0: (t5 + e3.x0) * r5 + i3,
      y0: (n5 + e3.y0) * r5 + a3,
      x1: (t5 + e3.x1) * r5 + i3,
      y1: (n5 + e3.y1) * r5 + a3,
      stops: e3.stops
    } : {
      type: "radial",
      cx: (t5 + e3.cx) * r5 + i3,
      cy: (n5 + e3.cy) * r5 + a3,
      r: e3.r * r5,
      fx: e3.fx === void 0 ? void 0 : (t5 + e3.fx) * r5 + i3,
      fy: e3.fy === void 0 ? void 0 : (n5 + e3.fy) * r5 + a3,
      fr: e3.fr === void 0 ? void 0 : e3.fr * r5,
      stops: e3.stops
    } : e3;
  }
  function Ze2(e3) {
    let t5 = new Ge2(e3.x, e3.y);
    return e3.noScale && (t5.noScaling = true), t5.layer = e3.layer, Qe2(t5, e3.children, 0, 0), t5;
  }
  function Qe2(e3, t5, n5, r5) {
    for (let i3 of t5) $e2(e3, i3, n5, r5);
  }
  function $e2(e3, t5, n5, r5) {
    switch (t5.type) {
      case "rect":
        e3.commands.push({
          type: "rect",
          x: t5.x + n5,
          y: t5.y + r5,
          w: t5.width,
          h: t5.height,
          fill: M2(t5.paint.fill, n5, r5, 1, 0, 0),
          stroke: t5.paint.stroke,
          sw: t5.paint.strokeWidth ?? 0,
          cr: t5.cornerRadius ?? 0,
          dash: Xe2(t5.paint.dash, t5.paint.dashEnabled)
        });
        return;
      case "circle":
        e3.commands.push({
          type: "circle",
          cx: t5.cx + n5,
          cy: t5.cy + r5,
          r: t5.radius,
          fill: M2(t5.paint.fill, n5, r5, 1, 0, 0),
          stroke: t5.paint.stroke,
          sw: t5.paint.strokeWidth ?? 0,
          dash: Xe2(t5.paint.dash, t5.paint.dashEnabled)
        });
        return;
      case "line": {
        let i3 = n5 === 0 && r5 === 0 ? t5.points : et2(t5.points, n5, r5);
        e3.commands.push({
          type: "line",
          points: i3,
          stroke: t5.paint.stroke,
          sw: t5.paint.strokeWidth ?? 0,
          dash: Xe2(t5.paint.dash, t5.paint.dashEnabled),
          lineCap: t5.lineCap,
          lineJoin: t5.lineJoin,
          alpha: t5.paint.alpha
        });
        return;
      }
      case "polygon":
        e3.commands.push({
          type: "polygon",
          vertices: n5 === 0 && r5 === 0 ? t5.vertices : et2(t5.vertices, n5, r5),
          fill: M2(t5.paint.fill, n5, r5, 1, 0, 0),
          stroke: t5.paint.stroke,
          sw: t5.paint.strokeWidth ?? 0
        });
        return;
      case "text":
        e3.commands.push({
          type: "text",
          x: t5.x + n5,
          y: t5.y + r5,
          text: t5.text,
          fontSize: t5.fontSize,
          fontFamily: t5.fontFamily ?? "sans-serif",
          fontStyle: t5.fontStyle ?? "normal",
          fill: t5.fill ?? "black",
          stroke: t5.stroke,
          sw: t5.strokeWidth ?? 0,
          align: t5.align ?? "left",
          vAlign: t5.verticalAlign ?? "top",
          w: t5.width ?? 0,
          h: t5.height ?? 0,
          baselineRatio: t5.baselineRatio,
          transform: t5.transform
        });
        return;
      case "image": {
        let i3 = tt2(t5.src);
        e3.commands.push({
          type: "image",
          x: t5.x + n5,
          y: t5.y + r5,
          w: t5.width,
          h: t5.height,
          image: i3,
          transform: t5.transform
        });
        return;
      }
      case "group":
        Qe2(e3, t5.children, n5 + t5.x, r5 + t5.y);
        return;
    }
  }
  function et2(e3, t5, n5) {
    let r5 = Array(e3.length);
    for (let i3 = 0; i3 < e3.length; i3 += 2) r5[i3] = e3[i3] + t5, r5[i3 + 1] = e3[i3 + 1] + n5;
    return r5;
  }
  function tt2(e3) {
    let t5 = lib_default === void 0 ? typeof Image < "u" ? new Image() : null : lib_default.Util.createImageElement();
    return t5 && (t5.src = e3), t5;
  }
  function N2(e3) {
    return !!e3 && e3.viewportAware === true;
  }
  function nt2(e3, t5 = 1) {
    let n5 = Math.ceil(e3) + 1, r5 = Math.ceil(e3 * t5) + 1;
    return Math.max(1, Math.min(48, Math.max(n5, r5)));
  }
  function rt2(e3, t5, n5) {
    let r5 = e3.width, i3 = e3.height, a3 = new Uint32Array(e3.data.buffer), o3 = nt2(n5.scale, n5.roomSize), s4 = o3 >> 1;
    t5((e4, t6, c4) => {
      let l4 = Math.round(e4 * n5.scale + n5.offsetX) - s4, u4 = Math.round(t6 * n5.scale + n5.offsetY) - s4, d2 = n5.colorOf(c4);
      for (let e5 = 0; e5 < o3; e5++) {
        let t7 = u4 + e5;
        if (t7 < 0 || t7 >= i3) continue;
        let n6 = t7 * r5;
        for (let e6 = 0; e6 < o3; e6++) {
          let t8 = l4 + e6;
          t8 >= 0 && t8 < r5 && (a3[n6 + t8] = d2);
        }
      }
    });
  }
  function it2(e3) {
    let t5 = e3.trim(), n5 = 0, r5 = 0, i3 = 0;
    if (t5[0] === "#") t5.length === 4 ? (n5 = parseInt(t5[1] + t5[1], 16), r5 = parseInt(t5[2] + t5[2], 16), i3 = parseInt(t5[3] + t5[3], 16)) : (n5 = parseInt(t5.slice(1, 3), 16), r5 = parseInt(t5.slice(3, 5), 16), i3 = parseInt(t5.slice(5, 7), 16));
    else {
      let e4 = t5.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      e4 && (n5 = +e4[1], r5 = +e4[2], i3 = +e4[3]);
    }
    return (255 << 24 | i3 << 16 | r5 << 8 | n5) >>> 0;
  }
  var at2 = 0.25;
  var ot2 = 8192;
  var st2 = class {
    constructor(e3, t5, n5, r5) {
      this.layer = e3, this.camera = t5, this.colorCss = n5, this.roomSizeOf = r5, this.visit = null, this.paintedRegion = null, this.paintedScale = 0, this.repaintScheduled = false, this.destroyed = false, this.packedCache = /* @__PURE__ */ new Map(), this.colorOf = (e4) => {
        let t6 = this.packedCache.get(e4);
        return t6 === void 0 && (t6 = it2(this.colorCss(e4)), this.packedCache.set(e4, t6)), t6;
      }, this.canvas = lib_default.Util.createCanvasElement(), this.layer.visible(false);
    }
    setSource(e3) {
      this.visit = e3, this.packedCache.clear(), this.paint();
    }
    clear() {
      this.visit === null && !this.layer.visible() || (this.visit = null, this.paintedRegion = null, this.layer.visible(false), this.layer.batchDraw());
    }
    onViewportChange() {
      if (!this.visit || this.repaintScheduled) return;
      let e3 = this.paintedRegion;
      if (e3 && this.camera.getScale() === this.paintedScale) {
        let t6 = this.camera.getViewportBounds();
        if (t6.minX >= e3.minX && t6.maxX <= e3.maxX && t6.minY >= e3.minY && t6.maxY <= e3.maxY) return;
      }
      this.repaintScheduled = true;
      let t5 = () => {
        this.repaintScheduled = false, !this.destroyed && this.visit && this.paint();
      };
      typeof requestAnimationFrame < "u" ? requestAnimationFrame(t5) : queueMicrotask(t5);
    }
    destroy() {
      this.destroyed = true, this.visit = null;
    }
    paint() {
      let e3 = this.visit;
      if (!e3) return;
      let t5 = this.camera.getViewportBounds(), n5 = this.camera.getScale(), r5 = (t5.maxX - t5.minX) * at2, i3 = (t5.maxY - t5.minY) * at2, a3 = {
        minX: t5.minX - r5,
        maxX: t5.maxX + r5,
        minY: t5.minY - i3,
        maxY: t5.maxY + i3
      }, o3 = Math.min(ot2, Math.max(1, Math.ceil((a3.maxX - a3.minX) * n5))), s4 = Math.min(ot2, Math.max(1, Math.ceil((a3.maxY - a3.minY) * n5)));
      this.canvas.width = o3, this.canvas.height = s4;
      let c4 = this.canvas.getContext("2d"), l4 = c4.createImageData(o3, s4);
      rt2(l4, (t6) => e3(a3, t6), {
        scale: n5,
        offsetX: -a3.minX * n5,
        offsetY: -a3.minY * n5,
        colorOf: this.colorOf,
        roomSize: this.roomSizeOf()
      }), c4.putImageData(l4, 0, 0), this.image ? this.image.image(this.canvas) : (this.image = new lib_default.Image({
        image: this.canvas,
        listening: false
      }), this.layer.add(this.image)), this.image.position({
        x: a3.minX,
        y: a3.minY
      }), this.image.size({
        width: a3.maxX - a3.minX,
        height: a3.maxY - a3.minY
      }), this.paintedRegion = a3, this.paintedScale = n5, this.layer.visible(true), this.layer.batchDraw();
    }
  };
  function ct2(e3) {
    return e3.planeRoomCount > e3.roomBudget && e3.scale * e3.scale < e3.stageWidth * e3.stageHeight / e3.roomBudget;
  }
  function lt2(e3) {
    return ct2({
      ...e3,
      roomBudget: e3.roomBudget
    }) ? "raster" : e3.exitBudget !== void 0 && ct2({
      ...e3,
      roomBudget: e3.exitBudget
    }) ? "roomsOnly" : "vector";
  }
  function ut2(e3) {
    return {
      getAreaName: () => e3.getAreaName(),
      getAreaId: () => e3.getAreaId(),
      getVersion: () => e3.getVersion(),
      getPlane: (t5) => e3.getPlane(t5),
      getPlanes: () => e3.getPlanes(),
      getZLevels: () => e3.getZLevels(),
      getRooms: () => e3.getRooms(),
      getFullBounds: () => e3.getFullBounds(),
      getLinkExits: () => []
    };
  }
  var P2 = "rgb(120, 72, 0)";
  var dt = 0.5;
  var ft = (1 + 2 * dt) ** 2;
  var pt = class {
    get coordinateTransform() {
      return this._coordinateTransform;
    }
    constructor(t5, n5) {
      this.gridCachedBounds = null, this.currentStyle = ot, this.hitTester = new Ze(), this.lastHitShapes = [], this.shapeToDrawEntry = /* @__PURE__ */ new Map(), this.lastVisibleShapes = /* @__PURE__ */ new Set(), this.shapeToGroup = /* @__PURE__ */ new Map(), this.highlightShapes = /* @__PURE__ */ new Map(), this.pathShapes = [], this.spilledRoomPositions = /* @__PURE__ */ new Map(), this.currentRoomOverlay = [], this.destroyed = false, this._coordinateTransform = x, this.coordinateInverse = x, this.liveEffects = /* @__PURE__ */ new Map(), this.sceneOverlays = /* @__PURE__ */ new Map(), this.sceneOverlayNodes = /* @__PURE__ */ new Map(), this.viewportSubscribers = /* @__PURE__ */ new Set(), this.lodMode = "vector", this.lastAppliedViewport = null, this.lastAppliedScale = null, this.refreshScheduled = false, this.state = t5, this.container = n5, n5 ? (this.stage = new lib_default.Stage({
        container: n5,
        width: n5.clientWidth,
        height: n5.clientHeight,
        draggable: false
      }), n5.style.backgroundColor = t5.settings.backgroundColor, this.camera = new b(n5.clientWidth, n5.clientHeight)) : (this.stage = new lib_default.Stage({
        width: 1,
        height: 1
      }), this.camera = new b(1, 1)), this.lodLayer = new lib_default.Layer({ listening: false }), this.stage.add(this.lodLayer), this.gridLayer = new lib_default.Layer({ listening: false }), this.stage.add(this.gridLayer);
      let r5 = new lib_default.Layer({ listening: false });
      if (this.linkLayer = r5, this.roomLayer = r5, this.stage.add(r5), this.positionLayer = new lib_default.Layer({ listening: false }), this.stage.add(this.positionLayer), this.overlayLayer = new lib_default.Layer({ listening: false }), this.stage.add(this.overlayLayer), this.topLabelLayer = new lib_default.Layer({ listening: false }), this.stage.add(this.topLabelLayer), this.positionLayerNode = new Je2(this.positionLayer), this.overlayLayerNode = new Je2(this.overlayLayer), this.sceneNode = new qe2(r5, () => t5.settings.coalesceRooms), this.gridLayerNode = new j2(this.gridLayer), this.topLabelLayerNode = new j2(this.topLabelLayer), this.sceneManager = new We2(this.camera, t5.settings, t5.mapReader), this.lodController = new st2(this.lodLayer, this.camera, (e3) => this.state.mapReader.getColorValue(e3), () => this.state.settings.roomSize), this.events = new _(n5), this.culling = new S(t5.settings, () => this.applyClipping()), this.cameraChangeHandler = () => this.applyViewportToStage(), this.camera.on("change", this.cameraChangeHandler), n5) {
        this.origSetSize = this.camera.setSize.bind(this.camera);
        let e3 = this.origSetSize;
        this.camera.setSize = (t6, n6) => {
          e3(t6, n6), this.stage.width(t6), this.stage.height(n6);
        }, this.interactionHandler = new ke(n5, this.camera, t5, {
          clientToMapPoint: (e4, t6) => this.camera.clientToMapPoint(e4, t6, n5.getBoundingClientRect()),
          pickAtPoint: (e4, t6) => this.hitTester.pick(e4, t6)
        }, this.events);
      }
      this.applyStyleTransforms(), this.subscribeToState(t5);
    }
    setStyle(e3) {
      this.currentStyle = e3, this.sceneNode = new qe2(this.linkLayer, () => this.state.settings.coalesceRooms), this.gridLayerNode = new j2(this.gridLayer), this.topLabelLayerNode = new j2(this.topLabelLayer), this.gridCachedBounds = null, this.sceneManager.resetPipeline(this.state.mapReader), this.shapeToDrawEntry = /* @__PURE__ */ new Map(), this.shapeToGroup.clear(), this.lastHitShapes = [], this.hitTester.clear(), this.applyStyleTransforms(), this.refresh();
    }
    applyStyleTransforms() {
      let t5 = this.currentStyle, n5 = t5.worldToScene ? (e3, n6) => t5.worldToScene(e3, n6) : x, r5 = t5.sceneToWorld ? (e3, n6) => t5.sceneToWorld(e3, n6) : x, i3 = this.coordinateInverse, a3 = t5.sceneLayerOffset ? (e3) => t5.sceneLayerOffset(e3) : void 0;
      this._coordinateTransform = n5, this.coordinateInverse = r5, this.coordinateLayerOffset = a3, this.culling.setCoordinateTransform(n5), this.gridCachedBounds = null, this.lastHitShapes.length > 0 && (this.hitTestBudgetExceeded() ? this.hitTester.clear() : this.hitTester.build(this.lastHitShapes, this.state.settings.roomSize, n5, a3));
      let o3 = this.camera.getScale(), s4 = this.camera.width / 2, c4 = this.camera.height / 2, l4 = i3((s4 - this.camera.position.x) / o3, (c4 - this.camera.position.y) / o3), u4 = n5(l4.x, l4.y);
      this.camera.position = {
        x: s4 - u4.x * o3,
        y: c4 - u4.y * o3
      }, this.applyViewportToStage();
    }
    styleContext() {
      return {
        scale: this.camera.getScale(),
        roomSize: this.state.settings.roomSize
      };
    }
    mapPoint(e3, t5) {
      return this._coordinateTransform(e3, t5);
    }
    get exitRenderer() {
      return this.sceneManager.exitRenderer;
    }
    getDrawnExits() {
      return this.sceneManager.drawnExits;
    }
    getDrawnSpecialExits() {
      return this.sceneManager.drawnSpecialExits;
    }
    getDrawnStubs() {
      return this.sceneManager.drawnStubs;
    }
    destroy() {
      if (!this.destroyed) {
        this.destroyed = true, this.state.events.removeAllListeners(), this.interactionHandler?.destroy();
        for (let e3 of this.liveEffects.values()) e3.destroy();
        this.liveEffects.clear();
        for (let e3 of this.sceneOverlays.values()) e3.detach?.();
        this.sceneOverlays.clear();
        for (let e3 of this.sceneOverlayNodes.values()) for (let t5 of e3) t5.destroy();
        this.sceneOverlayNodes.clear(), this.viewportSubscribers.clear(), this.camera.cancelAnimation(), this.lodController.destroy(), this.origSetSize && (this.camera.setSize = this.origSetSize), this.cameraChangeHandler && (this.cameraChangeHandler = (this.camera.off("change", this.cameraChangeHandler), void 0)), this.clearOverlayShapes(), this.clearCurrentRoomOverlay(), this.positionMarker && (this.positionMarker = (this.positionMarker.destroy(), void 0)), this.stage.destroy(), this.events.removeAllListeners();
      }
    }
    updateBackground() {
      this.container && (this.container.style.backgroundColor = this.state.settings.backgroundColor);
    }
    exportCanvas(e3) {
      if (this.state.currentArea === void 0 || this.state.currentZIndex === void 0) return;
      let t5 = this.stage.toCanvas({ pixelRatio: e3?.pixelRatio ?? 1 }), n5 = document.createElement("canvas");
      n5.width = t5.width, n5.height = t5.height;
      let r5 = n5.getContext("2d");
      return r5.fillStyle = this.state.settings.backgroundColor, r5.fillRect(0, 0, n5.width, n5.height), r5.drawImage(t5, 0, 0), n5;
    }
    applyViewportToStage() {
      let e3 = this.camera.getScale();
      this.stage.scale({
        x: e3,
        y: e3
      }), this.stage.position(this.camera.position), this.stage.batchDraw();
      let t5 = this.camera.getViewportBounds();
      this.refreshGrid(t5), this.culling.scheduleCulling(), this.onCameraViewportChanged(t5), this.events.emit("pan", t5);
      for (let e4 of this.viewportSubscribers) e4();
      for (let n5 of this.liveEffects.values()) n5.updateViewport(t5, e3, this.coordinateTransform);
    }
    onCameraViewportChanged(e3) {
      let { currentAreaInstance: t5, currentZIndex: n5 } = this.state;
      if (t5 && n5 !== void 0 && this.hasRealViewport()) {
        let t6 = this.state.settings.lodEnabled && this.computeLodMode() !== this.lodMode;
        if (!t6 && N2(this.state.mapReader)) {
          let n6 = this.lastAppliedViewport, r5 = this.lastAppliedScale, i3 = this.camera.getScale();
          t6 = !n6 || r5 === null || e3.minX < n6.minX || e3.maxX > n6.maxX || e3.minY < n6.minY || e3.maxY > n6.maxY || i3 > r5 * 1.2 || i3 < r5 / 1.2;
        }
        t6 && this.scheduleRefresh();
      }
      this.lodController.onViewportChange();
    }
    scheduleRefresh() {
      if (this.refreshScheduled) return;
      this.refreshScheduled = true;
      let e3 = () => {
        this.refreshScheduled = false, this.destroyed || this.refresh();
      };
      typeof requestAnimationFrame < "u" ? requestAnimationFrame(e3) : queueMicrotask(e3);
    }
    refresh() {
      let { currentAreaInstance: e3, currentZIndex: t5, positionRoomId: n5 } = this.state;
      if (!e3 || t5 === void 0) return;
      let r5 = e3.getPlane(t5);
      if (!r5) {
        this.shapeToDrawEntry = /* @__PURE__ */ new Map(), this.sceneManager.reset(), this.hitTester.clear(), this.lastHitShapes = [], this.gridLayer.destroyChildren(), this.linkLayer.destroyChildren(), this.positionLayer.destroyChildren(), this.positionMarker = void 0, this.clearOverlayShapes(), this.currentRoomOverlay = [], this.lodController.clear(), this.lodMode = "vector", this.stage.batchDraw();
        return;
      }
      this.updateBackground();
      let i3 = this.state.mapReader;
      if (N2(i3) && this.hasRealViewport()) {
        let e4 = this.padViewport(this.camera.getViewportBounds()), t6 = He2(e4.minX, e4.minY, e4.maxX, e4.maxY, this.coordinateInverse);
        i3.setViewport(t6), this.lastAppliedViewport = e4, this.lastAppliedScale = this.camera.getScale();
      }
      let a3 = this.computeLodMode();
      if (this.lodMode = a3, a3 === "raster") this.clearVectorScene(), this.lodController.setSource(this.rasterVisit(e3, r5, t5));
      else {
        this.lodController.clear();
        let n6 = a3 === "roomsOnly" ? ut2(e3) : e3;
        this.buildScene(n6, r5, t5), this.onSceneBuilt();
      }
      this.syncHighlights(), this.syncPaths(), n5 !== void 0 && this.onPositionChanged(n5, false, false);
      for (let [e4, t6] of this.sceneOverlays) this.renderSceneOverlay(e4, t6);
      this.emitLodEvent(a3, e3, r5, t5);
    }
    hasRealViewport() {
      return this.camera.width > 1 || this.camera.height > 1;
    }
    padViewport(e3) {
      let t5 = (e3.maxX - e3.minX) * dt + 1, n5 = (e3.maxY - e3.minY) * dt + 1;
      return {
        minX: e3.minX - t5,
        maxX: e3.maxX + t5,
        minY: e3.minY - n5,
        maxY: e3.maxY + n5
      };
    }
    planeRoomCount(e3, t5, n5) {
      let r5 = this.state.mapReader;
      return N2(r5) ? r5.getPlaneRoomCount(e3.getAreaId(), n5) : t5.getRooms().length;
    }
    computeLodMode() {
      let e3 = this.state.settings;
      if (!e3.lodEnabled || !this.hasRealViewport()) return "vector";
      let { currentAreaInstance: t5, currentZIndex: n5 } = this.state;
      if (!t5 || n5 === void 0) return "vector";
      let r5 = t5.getPlane(n5);
      return r5 ? lt2({
        planeRoomCount: this.planeRoomCount(t5, r5, n5),
        scale: this.camera.getScale(),
        stageWidth: this.camera.width,
        stageHeight: this.camera.height,
        roomBudget: e3.lodRoomBudget / ft,
        exitBudget: e3.lodExitBudget / ft
      }) : "vector";
    }
    rasterVisit(e3, t5, n5) {
      let r5 = this.state.mapReader;
      if (N2(r5)) {
        let t6 = e3.getAreaId();
        return (e4, i3) => r5.forEachInBounds(t6, n5, e4, i3);
      }
      return (e4, n6) => {
        for (let r6 of t5.getRooms()) r6.x >= e4.minX && r6.x <= e4.maxX && r6.y >= e4.minY && r6.y <= e4.maxY && n6(r6.x, r6.y, r6.env);
      };
    }
    clearVectorScene() {
      this.shapeToDrawEntry = /* @__PURE__ */ new Map(), this.shapeToGroup.clear(), this.sceneManager.reset(), this.hitTester.clear(), this.lastHitShapes = [], this.lastVisibleShapes = /* @__PURE__ */ new Set(), this.spilledRoomPositions = /* @__PURE__ */ new Map(), this.sceneNode.destroyChildren(), this.topLabelLayerNode.destroyChildren(), this.stage.batchDraw();
    }
    hitTestBudgetExceeded() {
      if (!this.state.settings.lodEnabled) return false;
      let { currentAreaInstance: e3, currentZIndex: t5 } = this.state;
      if (!e3 || t5 === void 0) return false;
      let n5 = e3.getPlane(t5);
      return n5 ? n5.getRooms().length > this.state.settings.lodHitTestBudget : false;
    }
    emitLodEvent(e3, t5, n5, r5) {
      if (!this.state.settings.lodEnabled) return;
      let i3 = this.state.mapReader, a3 = this.planeRoomCount(t5, n5, r5), o3 = this.lastAppliedViewport ?? this.camera.getViewportBounds(), s4 = N2(i3) ? i3.estimateVisibleCount(t5.getAreaId(), r5, o3) : a3, c4 = e3 === "raster" ? false : !this.hitTestBudgetExceeded();
      this.events.emit("lod", {
        mode: e3,
        planeRoomCount: a3,
        visibleEstimate: s4,
        hitTestActive: c4
      });
    }
    addLiveEffect(e3, t5) {
      this.removeLiveEffect(e3), t5.attach(this.overlayLayer), this.liveEffects.set(e3, t5), t5.updateViewport(this.camera.getViewportBounds(), this.camera.getScale(), this.coordinateTransform);
    }
    removeLiveEffect(e3) {
      let t5 = this.liveEffects.get(e3);
      t5 && (t5.destroy(), this.liveEffects.delete(e3));
    }
    addSceneOverlay(e3, t5) {
      let n5 = this.sceneOverlays.get(e3);
      n5 && (n5.detach?.(), this.clearSceneOverlayNodes(e3)), this.sceneOverlays.set(e3, t5), t5.attach?.(this.createOverlayContext(e3, t5)), this.renderSceneOverlay(e3, t5);
    }
    removeSceneOverlay(e3) {
      let t5 = this.sceneOverlays.get(e3);
      t5 && (t5.detach?.(), this.sceneOverlays.delete(e3), this.clearSceneOverlayNodes(e3), this.overlayLayer.batchDraw());
    }
    getSceneOverlays() {
      return this.sceneOverlays.values();
    }
    createOverlayContext(e3, t5) {
      return {
        state: this.state,
        onViewportChange: (e4) => (this.viewportSubscribers.add(e4), () => this.viewportSubscribers.delete(e4)),
        invalidate: () => {
          this.sceneOverlays.get(e3) === t5 && this.renderSceneOverlay(e3, t5);
        }
      };
    }
    renderSceneOverlay(e3, t5) {
      this.clearSceneOverlayNodes(e3);
      let n5 = this.camera.getViewportBounds(), r5 = t5.render(this.state, n5);
      if (r5) {
        let n6 = Array.isArray(r5) ? r5 : [r5], i3 = [];
        for (let e4 of n6) {
          let n7 = this.addStyledShape(e4, this.overlayLayerNode, t5.sceneSpace);
          n7 && i3.push(n7);
        }
        this.sceneOverlayNodes.set(e3, i3);
      }
      this.overlayLayer.batchDraw();
    }
    clearSceneOverlayNodes(e3) {
      let t5 = this.sceneOverlayNodes.get(e3);
      if (t5) {
        for (let e4 of t5) e4.destroy();
        this.sceneOverlayNodes.delete(e3);
      }
    }
    subscribeToState(e3) {
      e3.events.on("area", () => {
        this.refresh();
      }), e3.events.on("position", ({ roomId: e4, center: t5, areaChanged: n5 }) => {
        this.onPositionChanged(e4, t5, n5), this.state.settings.neighborSpill && e4 !== void 0 && this.refresh();
      }), e3.events.on("center", ({ roomId: t5, instant: n5 }) => {
        let r5 = e3.mapReader.getRoom(t5);
        if (r5) {
          let e4 = this.mapPoint(r5.x, r5.y);
          this.camera.panToMapPointAnimated(e4.x, e4.y, n5 || this.state.settings.instantMapMove);
        }
      }), e3.events.on("highlight", ({ roomId: e4, colors: t5 }) => {
        this.syncHighlight(e4, t5);
      }), e3.events.on("path", () => {
        this.syncPaths();
      }), e3.events.on("clear", () => {
        this.syncHighlights();
      }), e3.events.on("lens", () => {
        this.refresh();
      });
    }
    buildScene(e3, t5, n5) {
      this.positionLayer.destroyChildren(), this.positionMarker = void 0, this.clearOverlayShapes(), this.currentRoomOverlay = [], this.sceneNode.destroyChildren(), this.gridLayerNode.destroyChildren(), this.gridCachedBounds = null, this.topLabelLayerNode.destroyChildren();
      let r5 = this.computeNeighborSpill(e3, n5);
      this.spilledRoomPositions = r5 ? we(r5) : /* @__PURE__ */ new Map();
      let i3 = this.sceneManager.rebuild(e3, t5, n5, this.state.lens, r5);
      this.shapeToGroup = /* @__PURE__ */ new Map(), this.refreshGrid(this.camera.getViewportBounds());
      for (let e4 of i3.sceneShapes.link) {
        let t6 = this.addStyledShape(e4, this.sceneNode);
        t6 && this.shapeToGroup.set(e4, t6);
      }
      for (let e4 of i3.sceneShapes.room) {
        let t6 = this.addStyledShape(e4, this.sceneNode);
        t6 && this.shapeToGroup.set(e4, t6);
      }
      for (let e4 of i3.sceneShapes.topLabel) this.addStyledShape(e4, this.topLabelLayerNode);
    }
    computeNeighborSpill(e3, t5) {
      let n5 = this.state.settings;
      if (!n5.neighborSpill) return;
      let r5 = this.state.positionRoomId;
      if (r5 === void 0) return;
      let i3 = this.state.mapReader.getRoom(r5);
      if (!i3 || i3.area !== e3.getAreaId() || i3.z !== t5) return;
      let a3 = this.state.lens;
      return Se(this.state.mapReader, e3.getAreaId(), t5, r5, n5.neighborSpillDistance, (e4) => a3.isVisible(e4));
    }
    overlayReader() {
      return this.spilledRoomPositions.size === 0 || this.state.currentArea === void 0 || this.state.currentZIndex === void 0 ? this.state.mapReader : new Ce(this.state.mapReader, this.state.currentArea, this.state.currentZIndex, this.spilledRoomPositions);
    }
    addStyledShape(e3, t5, n5 = false) {
      let r5 = n5 || this.currentStyle === ot ? [e3] : ct([e3], this.currentStyle, this.styleContext());
      if (r5.length === 0) return;
      let i3;
      i3 = r5.length === 1 && r5[0].type === "group" ? r5[0] : {
        type: "group",
        x: 0,
        y: 0,
        children: r5,
        layer: e3.layer,
        noScale: e3.noScale
      };
      let a3 = Ze2(i3);
      return t5.addNode(a3), a3;
    }
    refreshGrid(e3) {
      let t5 = this.state.settings;
      if (!t5.gridEnabled) {
        this.gridCachedBounds !== null && (this.gridLayerNode.destroyChildren(), this.gridLayerNode.batchDraw(), this.gridCachedBounds = null);
        return;
      }
      let n5 = this.coordinateInverse, r5 = n5(e3.minX, e3.minY), i3 = n5(e3.maxX, e3.minY), a3 = n5(e3.maxX, e3.maxY), o3 = n5(e3.minX, e3.maxY), s4 = Math.min(r5.x, i3.x, a3.x, o3.x), c4 = Math.max(r5.x, i3.x, a3.x, o3.x), l4 = Math.min(r5.y, i3.y, a3.y, o3.y), u4 = Math.max(r5.y, i3.y, a3.y, o3.y), d2 = t5.gridSize * 2, f3 = Math.floor((s4 - d2) / t5.gridSize) * t5.gridSize, p3 = Math.ceil((c4 + d2) / t5.gridSize) * t5.gridSize, m3 = Math.floor((l4 - d2) / t5.gridSize) * t5.gridSize, h3 = Math.ceil((u4 + d2) / t5.gridSize) * t5.gridSize, g3 = this.gridCachedBounds;
      if (g3 && g3.left === f3 && g3.right === p3 && g3.top === m3 && g3.bottom === h3) return;
      this.gridLayerNode.destroyChildren();
      let _3 = Ne2(e3, t5, { inverseTransform: this.coordinateInverse });
      for (let e4 of _3) this.addStyledShape(e4, this.gridLayerNode);
      this.gridCachedBounds = {
        left: f3,
        right: p3,
        top: m3,
        bottom: h3
      }, this.gridLayerNode.batchDraw();
    }
    onSceneBuilt() {
      this.lastHitShapes = this.sceneManager.hitShapes, this.hitTestBudgetExceeded() ? this.hitTester.clear() : this.hitTester.build(this.lastHitShapes, this.state.settings.roomSize, this._coordinateTransform, this.coordinateLayerOffset);
      let e3 = this.camera.getScale();
      this.stage.scale({
        x: e3,
        y: e3
      }), this.shapeToDrawEntry = /* @__PURE__ */ new Map();
      for (let [e4, t5] of this.shapeToGroup) {
        let n5 = this.sceneNode.getEntry(t5);
        n5 && this.shapeToDrawEntry.set(e4, n5);
      }
      this.lastVisibleShapes = this.sceneManager.managedShapes(this._coordinateTransform), this.applyClipping(), this.stage.batchDraw();
    }
    applyClipping() {
      if (!this.sceneManager.lastResult) return;
      let e3 = this.sceneManager.cullInteractive(this._coordinateTransform), t5 = this.lastVisibleShapes, n5 = false;
      for (let r5 of t5) {
        if (e3.has(r5)) continue;
        let t6 = this.shapeToDrawEntry.get(r5);
        t6 && t6.visible && (t6.visible = false, n5 = true);
      }
      for (let r5 of e3) {
        if (t5.has(r5)) continue;
        let e4 = this.shapeToDrawEntry.get(r5);
        e4 && !e4.visible && (e4.visible = true, n5 = true);
      }
      this.lastVisibleShapes = e3, n5 && this.sceneNode.batchDraw();
    }
    onPositionChanged(e3, t5, n5) {
      if (e3 === void 0) {
        this.positionMarker && (this.positionMarker = (this.positionMarker.destroy(), void 0)), this.positionLayerNode.batchDraw(), this.clearCurrentRoomOverlay(), this.overlayLayerNode.batchDraw();
        return;
      }
      let r5 = this.state.mapReader.getRoom(e3);
      if (r5) {
        if (t5) {
          let e4 = this.mapPoint(r5.x, r5.y);
          this.camera.panToMapPointAnimated(e4.x, e4.y, n5 || this.state.settings.instantMapMove);
        }
        this.updateCurrentRoomOverlay(r5), this.applyPositionMarker(r5);
      }
    }
    applyPositionMarker(e3) {
      if (this.positionMarker && (this.positionMarker = (this.positionMarker.destroy(), void 0)), e3.area !== this.state.currentArea || e3.z !== this.state.currentZIndex) {
        this.positionLayerNode.batchDraw();
        return;
      }
      let t5 = Be(e3, this.state.settings);
      this.positionMarker = this.addStyledShape(Ke(t5), this.positionLayerNode);
    }
    clearCurrentRoomOverlay() {
      this.currentRoomOverlay.forEach((e3) => e3.destroy()), this.currentRoomOverlay = [], this.positionLayerNode.batchDraw();
    }
    updateCurrentRoomOverlay(e3) {
      if (this.clearCurrentRoomOverlay(), e3.area !== this.state.currentArea || e3.z !== this.state.currentZIndex) {
        this.positionLayerNode.batchDraw();
        return;
      }
      let r5 = this.state.settings;
      if (this.lodMode === "raster") {
        this.positionMarker && this.positionMarker.moveToTop(), this.positionLayerNode.batchDraw();
        return;
      }
      if (!r5.highlightCurrentRoom) {
        this.positionMarker && this.positionMarker.moveToTop(), this.positionLayerNode.batchDraw();
        return;
      }
      let a3 = /* @__PURE__ */ new Map();
      a3.set(e3.id, e3);
      let o3 = [], s4 = this.sceneManager.exitRenderer, c4 = ve(this.state.lens, r5.hiddenRooms === "hide");
      this.state.currentAreaInstance && this.state.currentZIndex !== void 0 && this.state.currentAreaInstance.getLinkExits(this.state.currentZIndex).filter((t5) => t5.a === e3.id || t5.b === e3.id).forEach((e4) => {
        let t5 = this.state.mapReader.getRoom(e4.a), n5 = this.state.mapReader.getRoom(e4.b);
        if (!t5 || !n5 || (c4.getExitTreatment ? c4.getExitTreatment(e4, t5, n5) : y(c4, e4, t5, n5)) !== "full") return;
        let r6 = s4.renderDataWithColor(e4, P2, this.state.currentZIndex);
        if (r6) {
          if (r6.targetRoomId !== void 0 && this.spilledRoomPositions.has(r6.targetRoomId)) return;
          o3.push(this.sceneManager.buildExitShape(r6));
        }
      });
      for (let t5 of I(e3, r5, P2)) o3.push(he(t5, e3.id));
      for (let t5 of re(e3, r5, P2)) o3.push(K(t5));
      [...Object.values(e3.exits), ...Object.values(e3.specialExits)].forEach((e4) => {
        let t5 = this.state.mapReader.getRoom(e4);
        t5 && t5.area === this.state.currentArea && t5.z === this.state.currentZIndex && c4.isVisible(t5) && a3.set(e4, t5);
      }), o3.forEach((e4) => {
        let t5 = this.addStyledShape(e4, this.positionLayerNode);
        t5 && this.currentRoomOverlay.push(t5);
      }), a3.forEach((i3, a4) => {
        let o4 = a4 === e3.id, s5 = H(i3, this.state.mapReader, r5, {
          strokeOverride: o4 ? P2 : r5.lineColor,
          flatPipeline: true,
          ...h(i3, r5.hiddenRooms)
        });
        s5.children.push(...G(i3, this.state.mapReader, r5));
        let c5 = this.addStyledShape(s5, this.positionLayerNode);
        c5 && this.currentRoomOverlay.push(c5);
      }), this.positionMarker && this.positionMarker.moveToTop(), this.positionLayerNode.batchDraw();
    }
    syncHighlight(e3, t5) {
      let n5 = this.highlightShapes.get(e3);
      if (n5 && (n5.destroy(), this.highlightShapes.delete(e3)), t5 !== void 0) {
        let n6 = this.overlayReader().getRoom(e3);
        if (n6 && n6.area === this.state.currentArea && n6.z === this.state.currentZIndex) {
          let r5 = ze(n6, t5, this.state.settings), i3 = this.addStyledShape(He(r5), this.overlayLayerNode);
          i3 && this.highlightShapes.set(e3, i3);
        }
      }
      this.overlayLayerNode.batchDraw();
    }
    syncHighlights() {
      for (let e4 of this.highlightShapes.values()) e4.destroy();
      this.highlightShapes.clear();
      let e3 = this.overlayReader();
      for (let [t5] of this.state.highlights) {
        let n5 = e3.getRoom(t5);
        if (!n5 || n5.area !== this.state.currentArea || n5.z !== this.state.currentZIndex) continue;
        let r5 = ze(n5, this.state.highlights.get(t5).colors, this.state.settings), i3 = this.addStyledShape(He(r5), this.overlayLayerNode);
        i3 && this.highlightShapes.set(t5, i3);
      }
      this.overlayLayerNode.batchDraw();
    }
    syncPaths() {
      this.clearPathShapes();
      let { currentArea: e3, currentZIndex: t5 } = this.state;
      if (e3 === void 0 || t5 === void 0) return;
      let n5 = this.overlayReader();
      for (let r5 of this.state.paths) {
        let i3 = Ve(n5, this.state.settings, r5.locations, r5.color, e3, t5);
        for (let e4 of qe(i3)) {
          let t6 = this.addStyledShape(e4, this.overlayLayerNode);
          t6 && this.pathShapes.push(t6);
        }
      }
      this.overlayLayerNode.batchDraw();
    }
    clearOverlayShapes() {
      for (let e3 of this.highlightShapes.values()) e3.destroy();
      this.highlightShapes.clear(), this.clearPathShapes();
    }
    clearPathShapes() {
      for (let e3 of this.pathShapes) e3.destroy();
      this.pathShapes = [];
    }
  };
  var li = class {
    get settings() {
      return this.state.settings;
    }
    get camera() {
      return this.backend.camera;
    }
    get culling() {
      return this.backend.culling;
    }
    get hitTester() {
      return this.backend.hitTester;
    }
    get events() {
      return this.backend.events;
    }
    constructor(e3, t5, n5, r5) {
      this.currentStyle = ot, this.state = new Me2(e3, t5 ?? je2()), this.backend = r5 ? r5(this.state) : new pt(this.state, n5);
    }
    destroy() {
      this.backend.destroy();
    }
    drawArea(e3, t5) {
      this.state.setArea(e3, t5);
    }
    getCurrentArea() {
      return this.state.currentAreaInstance;
    }
    setPosition(e3, t5 = true) {
      this.state.setPosition(e3, t5);
    }
    updatePositionMarker(e3) {
      this.state.updatePositionMarker(e3);
    }
    clearPosition() {
      this.state.clearPosition();
    }
    centerOn(e3, t5) {
      this.state.setCenterRoom(e3, t5);
    }
    renderHighlight(e3, t5) {
      this.state.addHighlight(e3, t5);
    }
    removeHighlight(e3) {
      this.state.removeHighlight(e3);
    }
    hasHighlight(e3) {
      return this.state.hasHighlight(e3);
    }
    clearHighlights() {
      this.state.clearHighlights();
    }
    renderPath(e3, t5) {
      this.state.addPath(e3, t5);
    }
    clearPaths() {
      this.state.clearPaths();
    }
    refreshCurrentRoomOverlay() {
      this.state.refreshPosition();
    }
    setLens(e3) {
      this.state.setLens(e3);
    }
    getLens() {
      return this.state.lens;
    }
    setStyle(e3) {
      this.currentStyle = e3, this.backend.setStyle(e3);
    }
    clearStyle() {
      this.setStyle(ot);
    }
    getStyle() {
      return this.currentStyle;
    }
    updateBackground() {
      this.backend.updateBackground();
    }
    refresh() {
      this.backend.updateBackground(), this.backend.refresh();
    }
    addSceneOverlay(e3, t5) {
      this.backend.addSceneOverlay(e3, t5);
    }
    removeSceneOverlay(e3) {
      this.backend.removeSceneOverlay(e3);
    }
    addLiveEffect(e3, t5) {
      this.backend.addLiveEffect?.(e3, t5);
    }
    removeLiveEffect(e3) {
      this.backend.removeLiveEffect?.(e3);
    }
    hitTest(e3, t5) {
      let n5 = this.backend.coordinateTransform(e3, t5);
      return this.backend.hitTester.pick(n5.x, n5.y);
    }
    getDrawnExits() {
      return this.backend.getDrawnExits();
    }
    getDrawnSpecialExits() {
      return this.backend.getDrawnSpecialExits();
    }
    getDrawnStubs() {
      return this.backend.getDrawnStubs();
    }
    export(e3) {
      let t5 = {
        state: this.state,
        backend: this.backend,
        style: this.currentStyle,
        sceneOverlays: this.backend.getSceneOverlays()
      };
      return e3.render(t5);
    }
    on(e3, t5) {
      this.backend.events.on(e3, t5);
    }
    off(e3, t5) {
      this.backend.events.off(e3, t5);
    }
    setZoom(e3) {
      return this.backend.camera.setZoom(e3);
    }
    zoomToCenter(e3) {
      return this.backend.camera.zoomToCenter(e3);
    }
    getZoom() {
      return this.backend.camera.zoom;
    }
    getViewportBounds() {
      return this.backend.camera.getViewportBounds();
    }
    getAreaBounds() {
      if (!this.state.currentAreaInstance || this.state.currentZIndex === void 0) return null;
      let e3 = this.state.currentAreaInstance.getPlane(this.state.currentZIndex);
      if (!e3) return null;
      let t5 = this.state.getEffectiveBounds(this.state.currentAreaInstance, e3), n5 = this.state.settings.areaName ? this.state.currentAreaInstance.getAreaName() : null, r5 = n5 ? t5.minX - 3.5 + n5.length * 2.5 * 0.6 : t5.maxX, i3 = {
        minX: n5 ? t5.minX - 3.5 : t5.minX,
        maxX: Math.max(t5.maxX, r5),
        minY: n5 ? t5.minY - 7 : t5.minY,
        maxY: t5.maxY
      }, a3 = this.backend.coordinateTransform, o3 = a3(i3.minX, i3.minY), s4 = a3(i3.maxX, i3.minY), c4 = a3(i3.maxX, i3.maxY), l4 = a3(i3.minX, i3.maxY);
      return {
        minX: Math.min(o3.x, s4.x, c4.x, l4.x),
        maxX: Math.max(o3.x, s4.x, c4.x, l4.x),
        minY: Math.min(o3.y, s4.y, c4.y, l4.y),
        maxY: Math.max(o3.y, s4.y, c4.y, l4.y)
      };
    }
    fitArea(e3) {
      let t5 = this.getAreaBounds();
      t5 && this.backend.camera.fitToMapBounds(t5.minX, t5.maxX, t5.minY, t5.maxY, e3);
    }
    get centerOnResize() {
      return this.backend.camera.centerOnResize;
    }
    set centerOnResize(e3) {
      this.backend.camera.centerOnResize = e3;
    }
    get minZoom() {
      return this.backend.camera.minZoom;
    }
    set minZoom(e3) {
      this.backend.camera.minZoom = e3;
    }
    setCullingMode(e3) {
      this.state.settings.cullingMode = e3, this.state.settings.cullingEnabled = e3 !== "none", this.backend.culling.scheduleCulling();
    }
    getCullingMode() {
      return this.state.settings.cullingMode;
    }
  };
  var Ji = {
    n: {
      x: 0,
      y: -1
    },
    s: {
      x: 0,
      y: 1
    },
    e: {
      x: 1,
      y: 0
    },
    w: {
      x: -1,
      y: 0
    },
    ne: {
      x: Math.SQRT1_2,
      y: -Math.SQRT1_2
    },
    nw: {
      x: -Math.SQRT1_2,
      y: -Math.SQRT1_2
    },
    se: {
      x: Math.SQRT1_2,
      y: Math.SQRT1_2
    },
    sw: {
      x: -Math.SQRT1_2,
      y: Math.SQRT1_2
    }
  };
  var ia = /* @__PURE__ */ O2(((e3, t5) => {
    t5.exports = class {
      constructor() {
        this.keys = /* @__PURE__ */ new Set(), this.queue = [];
      }
      sort() {
        this.queue.sort((e4, t6) => e4.priority - t6.priority);
      }
      set(e4, t6) {
        let n5 = Number(t6);
        if (isNaN(n5)) throw TypeError('"priority" must be a number');
        return this.keys.has(e4) ? this.queue.map((t7) => (t7.key === e4 && Object.assign(t7, { priority: n5 }), t7)) : (this.keys.add(e4), this.queue.push({
          key: e4,
          priority: n5
        })), this.sort(), this.queue.length;
      }
      next() {
        let e4 = this.queue.shift();
        return this.keys.delete(e4.key), e4;
      }
      isEmpty() {
        return this.queue.length === 0;
      }
      has(e4) {
        return this.keys.has(e4);
      }
      get(e4) {
        return this.queue.find((t6) => t6.key === e4);
      }
    };
  }));
  var aa = /* @__PURE__ */ O2(((e3, t5) => {
    function n5(e4, t6) {
      let r5 = /* @__PURE__ */ new Map();
      for (let [i3, a3] of e4) i3 !== t6 && a3 instanceof Map ? r5.set(i3, n5(a3, t6)) : i3 !== t6 && r5.set(i3, a3);
      return r5;
    }
    t5.exports = n5;
  }));
  var oa = /* @__PURE__ */ O2(((e3, t5) => {
    function n5(e4) {
      let t6 = Number(e4);
      return !(isNaN(t6) || t6 <= 0);
    }
    function r5(e4) {
      let t6 = /* @__PURE__ */ new Map();
      return Object.keys(e4).forEach((i3) => {
        let a3 = e4[i3];
        if (typeof a3 == "object" && a3 && !Array.isArray(a3)) return t6.set(i3, r5(a3));
        if (!n5(a3)) throw Error(`Could not add node at key "${i3}", make sure it's a valid node`, a3);
        return t6.set(i3, Number(a3));
      }), t6;
    }
    t5.exports = r5;
  }));
  var sa = /* @__PURE__ */ O2(((e3, t5) => {
    function n5(e4) {
      if (!(e4 instanceof Map)) throw Error(`Invalid graph: Expected Map instead found ${typeof e4}`);
      e4.forEach((e5, t6) => {
        if (typeof e5 == "object" && e5 instanceof Map) {
          n5(e5);
          return;
        }
        if (typeof e5 != "number" || e5 <= 0) throw Error(`Values must be numbers greater than 0. Found value ${e5} at ${t6}`);
      });
    }
    t5.exports = n5;
  }));
  var ca = /* @__PURE__ */ De2((/* @__PURE__ */ O2(((e3, t5) => {
    var n5 = ia(), r5 = aa(), i3 = oa(), a3 = sa();
    t5.exports = class {
      constructor(e4) {
        e4 instanceof Map ? (a3(e4), this.graph = e4) : e4 ? this.graph = i3(e4) : this.graph = /* @__PURE__ */ new Map();
      }
      addNode(e4, t6) {
        let n6;
        return t6 instanceof Map ? (a3(t6), n6 = t6) : n6 = i3(t6), this.graph.set(e4, n6), this;
      }
      addVertex(e4, t6) {
        return this.addNode(e4, t6);
      }
      removeNode(e4) {
        return this.graph = r5(this.graph, e4), this;
      }
      path(e4, t6, r6 = {}) {
        if (!this.graph.size) return r6.cost ? {
          path: null,
          cost: 0
        } : null;
        let i4 = /* @__PURE__ */ new Set(), a4 = new n5(), o3 = /* @__PURE__ */ new Map(), s4 = [], c4 = 0, l4 = [];
        if (r6.avoid && (l4 = [].concat(r6.avoid)), l4.includes(e4)) throw Error(`Starting node (${e4}) cannot be avoided`);
        if (l4.includes(t6)) throw Error(`Ending node (${t6}) cannot be avoided`);
        for (a4.set(e4, 0); !a4.isEmpty(); ) {
          let e5 = a4.next();
          if (e5.key === t6) {
            c4 = e5.priority;
            let t7 = e5.key;
            for (; o3.has(t7); ) s4.push(t7), t7 = o3.get(t7);
            break;
          }
          i4.add(e5.key), (this.graph.get(e5.key) || /* @__PURE__ */ new Map()).forEach((t7, n6) => {
            if (i4.has(n6) || l4.includes(n6)) return null;
            if (!a4.has(n6)) return o3.set(n6, e5.key), a4.set(n6, e5.priority + t7);
            let r7 = a4.get(n6).priority, s5 = e5.priority + t7;
            return s5 < r7 ? (o3.set(n6, e5.key), a4.set(n6, s5)) : null;
          });
        }
        return s4.length ? (r6.trim ? s4.shift() : s4 = s4.concat([e4]), r6.reverse || (s4 = s4.reverse()), r6.cost ? {
          path: s4,
          cost: c4
        } : s4) : r6.cost ? {
          path: null,
          cost: 0
        } : null;
      }
      shortestPath(...e4) {
        return this.path(...e4);
      }
    };
  })))(), 1);

  // node_modules/mudlet-map-renderer/dist/SkeletonMapReader-ZPwsqemZ.js
  var t4 = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
    "up",
    "down",
    "in",
    "out"
  ];
  function n4(e3, t5, n5) {
    let r5 = [], i3 = Infinity, a3 = -Infinity, o3 = Infinity, s4 = -Infinity;
    for (let c5 = 0; c5 < e3.count; c5++) {
      if (e3.area[c5] !== t5 || e3.z[c5] !== n5) continue;
      r5.push(c5);
      let l5 = e3.x[c5], u5 = e3.y[c5];
      l5 < i3 && (i3 = l5), l5 > a3 && (a3 = l5), u5 < o3 && (o3 = u5), u5 > s4 && (s4 = u5);
    }
    let c4 = Int32Array.from(r5);
    if (c4.length === 0) return {
      indices: c4,
      minX: 0,
      minY: 0,
      cs: 1,
      cols: 1,
      rows: 1,
      cellStart: new Int32Array(2),
      order: c4,
      bounds: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
      }
    };
    let l4 = Math.max(a3 - i3, s4 - o3, 1), u4 = Math.max(1, Math.ceil(l4 / 128)), d2 = Math.floor((a3 - i3) / u4) + 1, f3 = Math.floor((s4 - o3) / u4) + 1, p3 = (t6) => Math.floor((e3.y[t6] - o3) / u4) * d2 + Math.floor((e3.x[t6] - i3) / u4), m3 = new Int32Array(d2 * f3);
    for (let e4 = 0; e4 < c4.length; e4++) m3[p3(c4[e4])]++;
    let h3 = new Int32Array(d2 * f3 + 1);
    for (let e4 = 0; e4 < d2 * f3; e4++) h3[e4 + 1] = h3[e4] + m3[e4];
    let g3 = h3.slice(0, d2 * f3), _3 = new Int32Array(c4.length);
    for (let e4 = 0; e4 < c4.length; e4++) {
      let t6 = c4[e4], n6 = p3(t6);
      _3[g3[n6]++] = t6;
    }
    return {
      indices: c4,
      minX: i3,
      minY: o3,
      cs: u4,
      cols: d2,
      rows: f3,
      cellStart: h3,
      order: _3,
      bounds: {
        minX: i3,
        maxX: a3,
        minY: o3,
        maxY: s4
      }
    };
  }
  function r4(e3, t5) {
    let n5 = Math.max(0, Math.floor((t5.minX - e3.minX) / e3.cs)), r5 = Math.min(e3.cols - 1, Math.floor((t5.maxX - e3.minX) / e3.cs)), i3 = Math.max(0, Math.floor((t5.minY - e3.minY) / e3.cs)), a3 = Math.min(e3.rows - 1, Math.floor((t5.maxY - e3.minY) / e3.cs));
    return r5 < n5 || a3 < i3 ? null : {
      cx0: n5,
      cx1: r5,
      cy0: i3,
      cy1: a3
    };
  }
  function i2(e3, t5, n5, i3) {
    let a3 = r4(t5, n5);
    if (!a3) return;
    let { cols: o3, cellStart: s4, order: c4 } = t5;
    for (let t6 = a3.cy0; t6 <= a3.cy1; t6++) {
      let r5 = t6 * o3;
      for (let t7 = a3.cx0; t7 <= a3.cx1; t7++) {
        let a4 = r5 + t7;
        for (let t8 = s4[a4]; t8 < s4[a4 + 1]; t8++) {
          let r6 = c4[t8];
          e3.x[r6] >= n5.minX && e3.x[r6] <= n5.maxX && e3.y[r6] >= n5.minY && e3.y[r6] <= n5.maxY && i3(r6);
        }
      }
    }
  }
  function a2(e3, t5) {
    let n5 = r4(e3, t5);
    if (!n5) return 0;
    let i3 = 0;
    for (let t6 = n5.cy0; t6 <= n5.cy1; t6++) {
      let r5 = t6 * e3.cols;
      for (let t7 = n5.cx0; t7 <= n5.cx1; t7++) {
        let n6 = r5 + t7;
        i3 += e3.cellStart[n6 + 1] - e3.cellStart[n6];
      }
    }
    return i3;
  }
  var o2 = {
    minX: -Infinity,
    maxX: Infinity,
    minY: -Infinity,
    maxY: Infinity
  };
  function s2(e3, t5, n5) {
    let r5 = (1 - Math.abs(2 * n5 - 1)) * t5, i3 = r5 * (1 - Math.abs(e3 / 60 % 2 - 1)), a3 = n5 - r5 / 2, o3 = 0, s4 = 0, c4 = 0;
    return e3 < 60 ? [o3, s4, c4] = [
      r5,
      i3,
      0
    ] : e3 < 120 ? [o3, s4, c4] = [
      i3,
      r5,
      0
    ] : e3 < 180 ? [o3, s4, c4] = [
      0,
      r5,
      i3
    ] : e3 < 240 ? [o3, s4, c4] = [
      0,
      i3,
      r5
    ] : e3 < 300 ? [o3, s4, c4] = [
      i3,
      0,
      r5
    ] : [o3, s4, c4] = [
      r5,
      0,
      i3
    ], [
      Math.round((o3 + a3) * 255),
      Math.round((s4 + a3) * 255),
      Math.round((c4 + a3) * 255)
    ];
  }
  var c2 = class {
    constructor(e3) {
      this.viewportAware = true, this.hashLookupCapable = true, this.viewport = o2, this.version = 0, this.planeCache = /* @__PURE__ */ new Map(), this.areaCache = /* @__PURE__ */ new Map(), this.rgbCache = /* @__PURE__ */ new Map(), this.visibleCache = /* @__PURE__ */ new Map(), this.detail = /* @__PURE__ */ new Map(), this.userDataMap = /* @__PURE__ */ new Map(), this.sk = e3;
      let t5 = e3.y;
      for (let n5 = 0; n5 < e3.count; n5++) t5[n5] = -t5[n5];
      for (let t6 of e3.userData ?? []) this.userDataMap.set(t6.id, t6.data);
      for (let t6 of e3.detailRooms ?? []) t6.y = -t6.y, this.isGrid(t6.area) && (t6.exits = {}, t6.stubs = []), this.detail.set(t6.id, t6);
    }
    skeleton() {
      return this.sk;
    }
    getRoomIdByHash(e3) {
      return this.sk.hashToId?.[e3];
    }
    setViewport(e3) {
      let t5 = this.viewport;
      e3.minX === t5.minX && e3.maxX === t5.maxX && e3.minY === t5.minY && e3.maxY === t5.maxY || (this.viewport = { ...e3 }, this.visibleCache.clear(), this.version++);
    }
    getViewport() {
      return this.viewport;
    }
    getPlaneRoomCount(e3, t5) {
      return this.planeIndex(e3, t5).indices.length;
    }
    estimateVisibleCount(e3, t5, n5) {
      return a2(this.planeIndex(e3, t5), n5);
    }
    forEachInBounds(e3, t5, n5, r5) {
      let a3 = this.sk;
      i2(a3, this.planeIndex(e3, t5), n5, (e4) => r5(a3.x[e4], a3.y[e4], a3.env[e4]));
    }
    getArea(e3) {
      let t5 = this.areaCache.get(e3);
      return t5 || (t5 = new l2(e3, this), this.areaCache.set(e3, t5)), t5;
    }
    getAreas() {
      return [...new Set(Array.from(this.sk.area))].map((e3) => this.getArea(e3));
    }
    getRooms() {
      return [];
    }
    getRoom(e3) {
      let t5 = this.detail.get(e3);
      if (t5) return t5;
      if (!this.idIndex) {
        this.idIndex = /* @__PURE__ */ new Map();
        for (let e4 = 0; e4 < this.sk.count; e4++) this.idIndex.set(this.sk.id[e4], e4);
      }
      let n5 = this.idIndex.get(e3);
      return n5 === void 0 ? void 0 : this.makeRoom(n5);
    }
    getColorValue(e3) {
      let [t5, n5, r5] = this.rgb(e3);
      return `rgb(${t5},${n5},${r5})`;
    }
    getSymbolColor(e3, t5) {
      let [n5, r5, i3] = this.rgb(e3), a3 = (Math.max(n5, r5, i3) + Math.min(n5, r5, i3)) / 2 / 255 > 0.41 ? "25,25,25" : "225,255,255", o3 = Math.min(Math.max(t5 ?? 1, 0), 1);
      return o3 === 1 ? `rgba(${a3})` : `rgba(${a3}, ${o3})`;
    }
    getReaderVersion() {
      return this.version;
    }
    labelsFor(e3, t5) {
      return (this.sk.labels ?? []).filter((n5) => n5.areaId === e3 && n5.Z === t5);
    }
    isGrid(e3) {
      return !!this.sk.areaGridMode[e3];
    }
    rgb(e3) {
      let t5 = this.rgbCache.get(e3);
      if (!t5) {
        let n5 = this.sk.customEnvColors[e3];
        t5 = n5 ? [
          n5.r,
          n5.g,
          n5.b
        ] : s2((e3 * 2654435761 >>> 0) % 360, 0.5, 0.55), this.rgbCache.set(e3, t5);
      }
      return t5;
    }
    hashFor(e3) {
      if (!this.sk.hashToId) return "";
      if (!this.idToHashIndex) {
        this.idToHashIndex = /* @__PURE__ */ new Map();
        for (let e4 in this.sk.hashToId) this.idToHashIndex.set(this.sk.hashToId[e4], e4);
      }
      return this.idToHashIndex.get(e3) ?? "";
    }
    makeRoom(e3) {
      let n5 = this.sk, r5 = this.detail.get(n5.id[e3]);
      if (r5) return r5;
      let i3 = {};
      if (!this.isGrid(n5.area[e3])) {
        let r6 = e3 * 12;
        for (let e4 = 0; e4 < 12; e4++) {
          let a3 = n5.exits[r6 + e4];
          a3 !== -1 && (i3[t4[e4]] = a3);
        }
      }
      return {
        id: n5.id[e3],
        area: n5.area[e3],
        x: n5.x[e3],
        y: n5.y[e3],
        z: n5.z[e3],
        areaId: String(n5.area[e3]),
        weight: 1,
        roomChar: "",
        name: n5.names?.[e3] ?? "",
        userData: this.userDataMap.get(n5.id[e3]) ?? {},
        customLines: {},
        stubs: [],
        hash: this.hashFor(n5.id[e3]),
        env: n5.env[e3],
        exits: i3,
        doors: {},
        specialExits: {}
      };
    }
    planeIndex(e3, t5) {
      let r5 = `${e3}:${t5}`, i3 = this.planeCache.get(r5);
      return i3 || (i3 = n4(this.sk, e3, t5), this.planeCache.set(r5, i3)), i3;
    }
    visibleRooms(e3, t5) {
      let n5 = `${e3}:${t5}`, r5 = this.visibleCache.get(n5);
      if (!r5) {
        let a3 = [];
        i2(this.sk, this.planeIndex(e3, t5), this.viewport, (e4) => a3.push(this.makeRoom(e4))), r5 = a3, this.visibleCache.set(n5, r5);
      }
      return r5;
    }
  };
  var l2 = class {
    constructor(e3, t5) {
      this.areaId = e3, this.reader = t5, this.planeCache = /* @__PURE__ */ new Map();
    }
    getAreaName() {
      return this.reader.skeleton().areaNames[this.areaId] ?? `#${this.areaId}`;
    }
    getAreaId() {
      return this.areaId;
    }
    getVersion() {
      return this.reader.getReaderVersion();
    }
    getPlane(e3) {
      let t5 = this.planeCache.get(e3);
      return t5 || (t5 = new u2(this.areaId, e3, this.reader), this.planeCache.set(e3, t5)), t5;
    }
    getPlanes() {
      return this.getZLevels().map((e3) => this.getPlane(e3));
    }
    getZLevels() {
      let e3 = this.reader.skeleton(), t5 = /* @__PURE__ */ new Set();
      for (let n5 = 0; n5 < e3.count; n5++) e3.area[n5] === this.areaId && t5.add(e3.z[n5]);
      return [...t5].sort((e4, t6) => e4 - t6);
    }
    getRooms() {
      return [];
    }
    getFullBounds() {
      let e3 = this.getZLevels(), t5 = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      };
      for (let n5 of e3) {
        let e4 = this.reader.planeIndex(this.areaId, n5).bounds;
        t5 = {
          minX: Math.min(t5.minX, e4.minX),
          maxX: Math.max(t5.maxX, e4.maxX),
          minY: Math.min(t5.minY, e4.minY),
          maxY: Math.max(t5.maxY, e4.maxY)
        };
      }
      return t5;
    }
    getLinkExits(t5) {
      if (this.reader.isGrid(this.areaId)) return [];
      let n5 = this.reader.visibleRooms(this.areaId, t5);
      return n5.length === 0 ? [] : Array.from(n2(n5).values()).filter((e3) => e3.zIndex.includes(t5));
    }
  };
  var u2 = class {
    constructor(e3, t5, n5) {
      this.areaId = e3, this.z = t5, this.reader = n5;
    }
    getRooms() {
      return this.reader.visibleRooms(this.areaId, this.z);
    }
    getLabels() {
      return this.reader.labelsFor(this.areaId, this.z);
    }
    getBounds() {
      let e3 = { ...this.reader.planeIndex(this.areaId, this.z).bounds };
      for (let t5 of this.reader.labelsFor(this.areaId, this.z)) {
        let n5 = t5.X, r5 = -t5.Y;
        e3.minX = Math.min(e3.minX, n5), e3.maxX = Math.max(e3.maxX, n5 + t5.Width), e3.minY = Math.min(e3.minY, r5), e3.maxY = Math.max(e3.maxY, r5 + t5.Height);
      }
      return e3;
    }
  };

  // node_modules/qtdatastream-web/dist/src/bytes.js
  function concat(chunks) {
    let total = 0;
    for (const c4 of chunks)
      total += c4.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c4 of chunks) {
      out.set(c4, offset);
      offset += c4.length;
    }
    return out;
  }
  function toUint8(input) {
    if (input instanceof Uint8Array)
      return input;
    if (input instanceof ArrayBuffer)
      return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    if (Array.isArray(input))
      return Uint8Array.from(input);
    throw new TypeError("Expected Uint8Array, ArrayBuffer, TypedArray, or number[]");
  }
  var textEncoder = new TextEncoder();
  var textDecoder = new TextDecoder("utf-8");
  function encodeUtf8(str2) {
    return textEncoder.encode(str2);
  }
  function decodeUtf8(bytes) {
    return textDecoder.decode(bytes);
  }
  function encodeUtf16BE(str2) {
    const out = new Uint8Array(str2.length * 2);
    const view = new DataView(out.buffer);
    for (let i3 = 0; i3 < str2.length; i3++) {
      view.setUint16(i3 * 2, str2.charCodeAt(i3), false);
    }
    return out;
  }
  function decodeUtf16BE(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const units = [];
    for (let i3 = 0; i3 + 1 < bytes.byteLength; i3 += 2) {
      units.push(view.getUint16(i3, false));
    }
    let str2 = "";
    const CHUNK = 8192;
    for (let i3 = 0; i3 < units.length; i3 += CHUNK) {
      str2 += String.fromCharCode(...units.slice(i3, i3 + CHUNK));
    }
    return str2;
  }
  function fromInt8(v3) {
    const b3 = new Uint8Array(1);
    new DataView(b3.buffer).setInt8(0, v3);
    return b3;
  }
  function fromUint16BE(v3) {
    const b3 = new Uint8Array(2);
    new DataView(b3.buffer).setUint16(0, v3 & 65535, false);
    return b3;
  }
  function fromInt32BE(v3) {
    const b3 = new Uint8Array(4);
    new DataView(b3.buffer).setInt32(0, v3, false);
    return b3;
  }
  function fromUint32BE(v3) {
    const b3 = new Uint8Array(4);
    new DataView(b3.buffer).setUint32(0, v3 >>> 0, false);
    return b3;
  }
  function fromBigInt64BE(v3) {
    const b3 = new Uint8Array(8);
    new DataView(b3.buffer).setBigInt64(0, BigInt.asIntN(64, BigInt(v3)), false);
    return b3;
  }
  function fromBigUint64BE(v3) {
    const b3 = new Uint8Array(8);
    new DataView(b3.buffer).setBigUint64(0, BigInt.asUintN(64, BigInt(v3)), false);
    return b3;
  }
  function fromDoubleBE(v3) {
    const b3 = new Uint8Array(8);
    new DataView(b3.buffer).setFloat64(0, v3, false);
    return b3;
  }

  // node_modules/qtdatastream-web/dist/src/buffer.js
  var buffer_exports = {};
  __export(buffer_exports, {
    ReadBuffer: () => ReadBuffer
  });
  var ReadBuffer = class {
    constructor(input) {
      __publicField(this, "buffer");
      __publicField(this, "view");
      __publicField(this, "read_offset");
      this.buffer = toUint8(input);
      this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
      this.read_offset = 0;
    }
    /** Remaining unread bytes as a view, or `null` if the buffer is exhausted. */
    remaining() {
      if (this.read_offset >= this.buffer.byteLength)
        return null;
      return this.buffer.subarray(this.read_offset);
    }
    readInt8() {
      const result = this.view.getInt8(this.read_offset);
      this.read_offset += 1;
      return result;
    }
    readInt16BE() {
      const result = this.view.getInt16(this.read_offset, false);
      this.read_offset += 2;
      return result;
    }
    readUInt16BE() {
      const result = this.view.getUint16(this.read_offset, false);
      this.read_offset += 2;
      return result;
    }
    readInt32BE() {
      const result = this.view.getInt32(this.read_offset, false);
      this.read_offset += 4;
      return result;
    }
    readUInt32BE() {
      const result = this.view.getUint32(this.read_offset, false);
      this.read_offset += 4;
      return result;
    }
    readInt64BE() {
      const result = this.view.getBigInt64(this.read_offset, false);
      this.read_offset += 8;
      return result;
    }
    readUInt64BE() {
      const result = this.view.getBigUint64(this.read_offset, false);
      this.read_offset += 8;
      return result;
    }
    readDoubleBE() {
      const result = this.view.getFloat64(this.read_offset, false);
      this.read_offset += 8;
      return result;
    }
    /** Read `size` bytes as a view (shares memory with the underlying buffer). */
    slice(size) {
      const result = this.buffer.subarray(this.read_offset, this.read_offset + size);
      this.read_offset += size;
      return result;
    }
  };

  // node_modules/qtdatastream-web/dist/src/util.js
  function str(obj) {
    const decoded = typeof obj === "string" ? obj : decodeUtf8(obj);
    return decoded.replace("\0", "");
  }
  function dateToJulianDay(d2) {
    const year = d2.getFullYear();
    const month = d2.getMonth() + 1;
    const day = d2.getDate();
    const a3 = Math.floor((14 - month) / 12);
    const y3 = Math.floor(year + 4800 - a3);
    const m3 = month + 12 * a3 - 3;
    return day + Math.floor((153 * m3 + 2) / 5) + 365 * y3 + Math.floor(y3 / 4) - Math.floor(y3 / 100) + Math.floor(y3 / 400) - 32045;
  }
  function julianDayToDate(i3) {
    const y3 = 4716;
    const v3 = 3;
    const j3 = 1401;
    const u4 = 5;
    const m3 = 2;
    const s4 = 153;
    const n5 = 12;
    const w2 = 2;
    const r5 = 4;
    const B2 = 274277;
    const p3 = 1461;
    const C2 = -38;
    const f3 = i3 + j3 + Math.floor(Math.floor((4 * i3 + B2) / 146097) * 3 / 4) + C2;
    const e3 = r5 * f3 + v3;
    const g3 = Math.floor(e3 % p3 / r5);
    const h3 = u4 * g3 + w2;
    const D2 = Math.floor(h3 % s4 / u4) + 1;
    const M3 = (Math.floor(h3 / s4) + m3) % n5 + 1;
    const Y2 = Math.floor(e3 / p3) - y3 + Math.floor((n5 + m3 - M3) / n5);
    return new Date(Y2, M3 - 1, D2);
  }

  // node_modules/qtdatastream-web/dist/src/types.js
  var Types = {
    INVALID: 0,
    BOOL: 1,
    INT: 2,
    UINT: 3,
    INT64: 4,
    UINT64: 5,
    DOUBLE: 6,
    CHAR: 7,
    MAP: 8,
    LIST: 9,
    STRING: 10,
    STRINGLIST: 11,
    BYTEARRAY: 12,
    TIME: 15,
    DATETIME: 16,
    USERTYPE: 127,
    SHORT: 133
  };
  function prepare(obj) {
    return obj !== void 0 && obj !== null && typeof obj.export === "function" ? obj.export() : obj;
  }
  var QClass = class {
    constructor(obj) {
      __publicField(this, "__obj");
      this.__obj = obj;
    }
    static from(subject, force = false) {
      const ctor = this;
      if (subject instanceof ctor && !force) {
        return subject;
      }
      subject = prepare(subject);
      if (subject instanceof ctor) {
        return subject;
      }
      return new ctor(subject);
    }
    /**
     * Read a value of this type from a buffer. Concrete subclasses override this;
     * the base implementation documents the contract and throws if called.
     */
    static read(_buffer, _name) {
      throw new Error(`${this.name}.read() is not implemented`);
    }
  };
  __publicField(QClass, "qtype");
  __publicField(QClass, "types", /* @__PURE__ */ new Map());
  function qtype(qvarianttype) {
    return function(target) {
      if (qvarianttype !== void 0) {
        QClass.types.set(qvarianttype, target);
      }
      target.qtype = qvarianttype;
    };
  }
  var QInvalid = class extends QClass {
    static read(_buffer) {
      return void 0;
    }
    toBuffer() {
      return new Uint8Array(0);
    }
  };
  qtype(Types.INVALID)(QInvalid);
  var QBool = class extends QClass {
    static read(buffer) {
      return Boolean(buffer.readInt8());
    }
    toBuffer() {
      return fromInt8(this.__obj ? 1 : 0);
    }
  };
  qtype(Types.BOOL)(QBool);
  var QShort = class extends QClass {
    static read(buffer) {
      return buffer.readInt16BE();
    }
    toBuffer() {
      return fromUint16BE(this.__obj);
    }
  };
  qtype(Types.SHORT)(QShort);
  var QInt = class extends QClass {
    static read(buffer) {
      return buffer.readInt32BE();
    }
    toBuffer() {
      return fromInt32BE(this.__obj);
    }
  };
  qtype(Types.INT)(QInt);
  var QUInt = class extends QClass {
    static read(buffer) {
      return buffer.readUInt32BE();
    }
    toBuffer() {
      return fromUint32BE(this.__obj);
    }
  };
  qtype(Types.UINT)(QUInt);
  var QInt64 = class extends QClass {
    static read(buffer) {
      return buffer.readInt64BE();
    }
    toBuffer() {
      return fromBigInt64BE(this.__obj);
    }
  };
  qtype(Types.INT64)(QInt64);
  var QUInt64 = class extends QClass {
    static read(buffer) {
      return buffer.readUInt64BE();
    }
    toBuffer() {
      return fromBigUint64BE(this.__obj);
    }
  };
  qtype(Types.UINT64)(QUInt64);
  var QDouble = class extends QClass {
    static read(buffer) {
      return buffer.readDoubleBE();
    }
    toBuffer() {
      return fromDoubleBE(this.__obj);
    }
  };
  qtype(Types.DOUBLE)(QDouble);
  var QChar = class extends QClass {
    constructor(obj) {
      super(obj);
      if (typeof this.__obj !== "string")
        throw new Error(`${this.__obj} is not a string`);
      if (this.__obj.length !== 1)
        throw new Error(`${this.__obj} length must equal 1`);
    }
    static read(buffer) {
      return decodeUtf16BE(buffer.slice(2));
    }
    toBuffer() {
      return encodeUtf16BE(this.__obj);
    }
  };
  qtype(Types.CHAR)(QChar);
  var QTime = class extends QUInt {
  };
  qtype(Types.TIME)(QTime);
  var QByteArray = class extends QClass {
    /** Reads the raw bytes as a Uint8Array view (use `util.str` to get a string). */
    static read(buffer) {
      const arraySize = QUInt.read(buffer);
      if (arraySize === 0 || arraySize === 4294967295)
        return null;
      return buffer.slice(arraySize);
    }
    toBuffer() {
      if (this.__obj === null) {
        return fromUint32BE(4294967295);
      }
      const buf = typeof this.__obj === "string" ? encodeUtf8(this.__obj) : toUint8(this.__obj);
      return concat([fromUint32BE(buf.length), buf]);
    }
  };
  qtype(Types.BYTEARRAY)(QByteArray);
  var QString = class extends QClass {
    static read(buffer) {
      const stringSize = QUInt.read(buffer);
      if (stringSize === 0 || stringSize === 4294967295)
        return "";
      return decodeUtf16BE(buffer.slice(stringSize));
    }
    toBuffer() {
      if (this.__obj === null) {
        return fromUint32BE(4294967295);
      }
      const value = typeof this.__obj === "number" ? String(this.__obj) : this.__obj;
      const bufstring = encodeUtf16BE(value);
      return concat([fromUint32BE(bufstring.length), bufstring]);
    }
  };
  qtype(Types.STRING)(QString);
  var QList = class extends QClass {
    static read(buffer) {
      const listSize = QUInt.read(buffer);
      const l4 = new Array(listSize);
      for (let i3 = 0; i3 < listSize; i3++) {
        l4[i3] = QVariant.read(buffer);
      }
      return l4;
    }
    /** Create a QList subclass whose elements are coerced to a given QClass/usertype. */
    static of(qclass) {
      const elementClass = typeof qclass === "string" ? QUserType.get(qclass) : qclass;
      const parent = this;
      return class extends parent {
        static from(subject) {
          if (Array.isArray(subject)) {
            subject = subject.map((elt) => prepare(elementClass.from(elt)));
          }
          return parent.from(subject);
        }
      };
    }
    toBuffer() {
      const bufs = [fromUint32BE(this.__obj.length)];
      for (const el of this.__obj) {
        bufs.push(QVariant.from(el).toBuffer());
      }
      return concat(bufs);
    }
  };
  qtype(Types.LIST)(QList);
  var QStringList = class extends QClass {
    static read(buffer) {
      const listSize = QUInt.read(buffer);
      const l4 = new Array(listSize);
      for (let i3 = 0; i3 < listSize; i3++) {
        l4[i3] = QString.read(buffer);
      }
      return l4;
    }
    toBuffer() {
      const bufs = [fromUint32BE(this.__obj.length)];
      for (const el of this.__obj) {
        bufs.push(QString.from(el).toBuffer());
      }
      return concat(bufs);
    }
  };
  qtype(Types.STRINGLIST)(QStringList);
  var QDateTime = class extends QClass {
    static read(buffer) {
      const julianDay = QUInt.read(buffer);
      const msecondsSinceMidnight = QUInt.read(buffer);
      QBool.read(buffer);
      const dateAtMidnight = julianDayToDate(julianDay);
      dateAtMidnight.setMilliseconds(msecondsSinceMidnight);
      return dateAtMidnight;
    }
    toBuffer() {
      const date = this.__obj;
      const milliseconds = (date.getTime() - date.getTimezoneOffset() * 6e4) % 864e5;
      const julianday = dateToJulianDay(date);
      return concat([
        fromUint32BE(julianday),
        fromUint32BE(milliseconds),
        QBool.from(date.getTimezoneOffset() === 0).toBuffer()
      ]);
    }
  };
  qtype(Types.DATETIME)(QDateTime);
  var QMap = class extends QClass {
    static read(buffer) {
      const mapSize = QUInt.read(buffer);
      const map = {};
      for (let i3 = 0; i3 < mapSize; i3++) {
        const key = QString.read(buffer);
        map[key] = QVariant.read(buffer);
      }
      return map;
    }
    toBuffer() {
      const bufs = [];
      if (this.__obj instanceof Map) {
        bufs.push(fromUint32BE(this.__obj.size));
        for (const [key, value] of this.__obj) {
          bufs.push(QString.from(key).toBuffer());
          bufs.push(QVariant.from(value).toBuffer());
        }
      } else {
        const keys = this.__obj ? Object.keys(this.__obj) : [];
        bufs.push(fromUint32BE(keys.length));
        for (const key of keys) {
          bufs.push(QString.from(key).toBuffer());
          bufs.push(QVariant.from(this.__obj[key]).toBuffer());
        }
      }
      return concat(bufs);
    }
  };
  qtype(Types.MAP)(QMap);
  var _QUserType = class _QUserType extends QClass {
    constructor(name, obj) {
      super(obj);
      __publicField(this, "name");
      this.name = name;
    }
    static from(subject) {
      if (subject instanceof _QUserType) {
        return subject;
      }
      return new this(subject);
    }
    /** Build a usertype class from a structured (array) definition. */
    static createComplexUserType(name, value) {
      const compiled = [];
      for (const type of value) {
        const [key] = Object.keys(type);
        const entry = {
          key,
          quserclass: void 0
        };
        if (typeof type[key] === "string") {
          entry.quserclassname = type[key];
          entry.quserclass = _QUserType.usertypes.get(type[key]);
        } else {
          entry.quserclass = QClass.types.get(type[key]);
        }
        if (!entry.quserclass) {
          throw new Error(`Type ${type[key]} does not exists`);
        }
        compiled.push(entry);
      }
      return class extends _QUserType {
        constructor(obj) {
          super(name, obj);
        }
        static read(buffer) {
          const obj = {};
          for (const elt of compiled) {
            obj[elt.key] = elt.quserclass.read(buffer, elt.quserclassname);
          }
          return obj;
        }
        toBuffer(skipname = false) {
          const bufs = [this._getNameBuffer(skipname)];
          for (const elt of compiled) {
            bufs.push(elt.quserclass.from(this.__obj[elt.key]).toBuffer(true));
          }
          return concat(bufs);
        }
      };
    }
    /** Build a usertype class from a simple (single Qt type) definition. */
    static createUserType(name, value) {
      if (Array.isArray(value)) {
        return _QUserType.createComplexUserType(name, value);
      }
      const qclass = QClass.types.get(value);
      return class extends _QUserType {
        constructor(obj) {
          super(name, obj);
        }
        static read(buffer) {
          return qclass.read(buffer);
        }
        toBuffer(skipname = false) {
          return concat([this._getNameBuffer(skipname), qclass.from(this.__obj).toBuffer(true)]);
        }
      };
    }
    /** Register a custom usertype under a name. */
    static register(name, value) {
      _QUserType.usertypes.set(name, _QUserType.createUserType(name, value));
    }
    /** Get a previously registered usertype class. */
    static get(name) {
      return _QUserType.usertypes.get(name);
    }
    static read(buffer, name) {
      if (!name) {
        const bname = QByteArray.read(buffer);
        name = str(bname ?? new Uint8Array(0));
      }
      const usertype = _QUserType.usertypes.get(name);
      if (!usertype) {
        throw new Error(`Unregistered usertype ${name}`);
      }
      return usertype.read(buffer);
    }
    _getNameBuffer(skipname) {
      if (!this.name) {
        throw new Error("Abstract QUserType cannot be converted to a buffer");
      }
      if (!skipname) {
        return QByteArray.from(this.name).toBuffer();
      }
      return new Uint8Array(0);
    }
    toBuffer(skipname = false) {
      return concat([
        this._getNameBuffer(skipname),
        _QUserType.usertypes.get(this.name).from(this.__obj).toBuffer(true)
      ]);
    }
  };
  __publicField(_QUserType, "usertypes", /* @__PURE__ */ new Map());
  var QUserType = _QUserType;
  qtype(Types.USERTYPE)(QUserType);
  var _QVariant = class _QVariant extends QClass {
    /**
     * Change the default QClass that plain numbers are coerced to (default QUInt).
     */
    static coerceNumbersTo(type) {
      const qclass = QClass.types.get(type);
      if (qclass === void 0) {
        throw new Error(`undefined type ${type}`);
      }
      _QVariant.coerceNumbersClass = qclass;
    }
    static read(buffer) {
      const type = QUInt.read(buffer);
      QBool.read(buffer);
      return QClass.types.get(type).read(buffer);
    }
    toBuffer() {
      const isNull = this.__obj === void 0 || this.__obj === null;
      const typeofobj = typeof this.__obj;
      let qclass;
      if (this.__obj === void 0) {
        qclass = QInvalid;
      } else if (this.__obj instanceof QUserType) {
        qclass = QUserType;
      } else if (this.__obj instanceof _QVariant) {
        throw new Error(`Can't nest QVariant`);
      } else if (this.__obj instanceof QClass) {
        qclass = this.__obj.constructor;
      } else if (typeofobj === "string") {
        qclass = QString;
      } else if (typeofobj === "bigint") {
        qclass = QInt64;
      } else if (typeofobj === "number") {
        qclass = _QVariant.coerceNumbersClass;
      } else if (typeofobj === "boolean") {
        qclass = QBool;
      } else if (this.__obj instanceof Date) {
        qclass = QDateTime;
      } else if (Array.isArray(this.__obj)) {
        qclass = QList;
      } else {
        qclass = QMap;
      }
      const bufs = [fromUint32BE(qclass.qtype), QBool.from(isNull).toBuffer()];
      if (!isNull) {
        bufs.push(qclass.from(this.__obj).toBuffer());
      }
      return concat(bufs);
    }
  };
  __publicField(_QVariant, "coerceNumbersClass", QUInt);
  var QVariant = _QVariant;

  // node_modules/mudlet-map-binary-reader/dist/index.js
  var QEnum = class extends QClass {
    static read(buffer) {
      return buffer.readInt8();
    }
    toBuffer() {
      return fromInt8(this.__obj);
    }
  };
  var QUint16 = class extends QClass {
    static read(buffer) {
      return buffer.readUInt16BE();
    }
    toBuffer() {
      return fromUint16BE(this.__obj);
    }
  };
  var QColor = class extends QClass {
    static read(buffer) {
      return {
        spec: QEnum.read(buffer),
        alpha: QUint16.read(buffer) >> 8,
        r: QUint16.read(buffer) >> 8,
        g: QUint16.read(buffer) >> 8,
        b: QUint16.read(buffer) >> 8,
        pad: QUint16.read(buffer) >> 8
      };
    }
    toBuffer() {
      const color = this.__obj;
      const bufs = [];
      bufs.push(QEnum.from(color.spec).toBuffer(false));
      bufs.push(QUint16.from(color.alpha * 257).toBuffer(false));
      bufs.push(QUint16.from(color.r * 257).toBuffer(false));
      bufs.push(QUint16.from(color.g * 257).toBuffer(false));
      bufs.push(QUint16.from(color.b * 257).toBuffer(false));
      bufs.push(QUint16.from((color.pad ?? 0) * 257).toBuffer(false));
      return concat(bufs);
    }
  };
  var QString$1 = class extends QString {
    toBuffer() {
      if (this.__obj === "") return QUInt.from(4294967295).toBuffer();
      return super.toBuffer();
    }
  };
  var QFont = class extends QClass {
    static read(buffer) {
      const family = QString$1.read(buffer);
      const style = QString$1.read(buffer);
      const pointSize = QDouble.read(buffer);
      const pixelSize = QInt.read(buffer);
      const styleHint = QEnum.read(buffer);
      const styleStrategy = QUint16.read(buffer);
      buffer.readInt8();
      const weight = buffer.readInt8() >>> 0;
      const fontBits = buffer.readInt8() >>> 0;
      const stretch = buffer.readUInt16BE();
      const extendedFontBits = buffer.readInt8() >>> 0;
      return {
        family,
        style,
        pointSize,
        pixelSize,
        styleHint,
        styleStrategy,
        weight,
        fontBits,
        stretch,
        extendedFontBits,
        letterSpacing: QInt.read(buffer),
        wordSpacing: QInt.read(buffer),
        hintingPreference: buffer.readInt8() >>> 0,
        capital: buffer.readInt8() >>> 0,
        styleSetting: (fontBits & 1) !== 0,
        underline: (fontBits & 2) !== 0,
        overline: (fontBits & 64) !== 0,
        strikeOut: (fontBits & 4) !== 0,
        fixedPitch: (fontBits & 8) !== 0,
        kerning: (fontBits & 16) !== 0,
        styleOblique: (fontBits & 128) !== 0,
        ignorePitch: (extendedFontBits & 1) !== 0,
        letterSpacingIsAbsolute: (extendedFontBits & 2) !== 0
      };
    }
    toBuffer() {
      const f3 = this.__obj;
      return concat([
        QString$1.from(f3.family).toBuffer(),
        QString$1.from(f3.style).toBuffer(),
        QDouble.from(f3.pointSize).toBuffer(),
        QInt.from(f3.pixelSize).toBuffer(),
        QEnum.from(f3.styleHint).toBuffer(),
        QUint16.from(f3.styleStrategy).toBuffer(),
        new Uint8Array(1),
        fromInt8(f3.weight),
        fromInt8(f3.fontBits),
        fromUint16BE(f3.stretch),
        fromInt8(f3.extendedFontBits),
        QInt.from(f3.letterSpacing).toBuffer(),
        QInt.from(f3.wordSpacing).toBuffer(),
        fromInt8(f3.hintingPreference),
        fromInt8(f3.capital)
      ]);
    }
  };
  var QPoint = class extends QClass {
    static read(buffer) {
      return [QDouble.read(buffer), QDouble.read(buffer)];
    }
    toBuffer() {
      const [x2, y3] = this.__obj;
      return concat([QDouble.from(x2).toBuffer(), QDouble.from(y3).toBuffer()]);
    }
  };
  var QVector = class extends QClass {
    static read(buffer) {
      return [
        Math.fround(QDouble.read(buffer)),
        Math.fround(QDouble.read(buffer)),
        Math.fround(QDouble.read(buffer))
      ];
    }
    toBuffer() {
      const [x2, y3, z2] = this.__obj;
      return concat([
        QDouble.from(x2).toBuffer(),
        QDouble.from(y3).toBuffer(),
        QDouble.from(z2).toBuffer()
      ]);
    }
  };
  var QPixMap = class extends QClass {
    static read(buffer) {
      QUInt.read(buffer);
      const start = buffer.read_offset;
      if (buffer.readUInt32BE() !== 2303741511) {
        buffer.read_offset -= 4;
        return "";
      }
      while (buffer.readUInt32BE() !== 1229278788) buffer.read_offset -= 3;
      const end = buffer.read_offset;
      buffer.read_offset = start;
      const size = end - start;
      return buffer.slice(size + 4);
    }
    toBuffer() {
      const data = this.__obj;
      return concat([QUInt.from(1).toBuffer(), data !== "" ? data : new Uint8Array(0)]);
    }
  };
  var Types$1 = {
    ...Types,
    POINT: 25,
    FONT: 64,
    PIXMAP: 65,
    COLOR: 67,
    VECTOR: 84
  };
  var registered = false;
  function registerBaseTypes() {
    if (registered) return;
    registered = true;
    qtype(Types$1.POINT)(QPoint);
    qtype(Types$1.FONT)(QFont);
    qtype(Types$1.PIXMAP)(QPixMap);
    qtype(Types$1.COLOR)(QColor);
    qtype(Types$1.VECTOR)(QVector);
  }
  function createMudletLabels(labelType) {
    return class MudletLabels extends QClass {
      static read(buffer) {
        const areasWithLabelsTotal = QInt.read(buffer);
        const labels = {};
        for (let index = 0; index < areasWithLabelsTotal; index++) {
          const totalLabels = QInt.read(buffer);
          const areaId = QInt.read(buffer);
          labels[areaId] = [];
          for (let i3 = 0; i3 < totalLabels; i3++) labels[areaId].push(QUserType.get(labelType).read(buffer));
        }
        return labels;
      }
      toBuffer() {
        const obj = this.__obj;
        const buffers = [];
        buffers.push(QInt.from(Object.keys(obj).length).toBuffer());
        for (const key of Object.keys(obj)) {
          const areaId = parseInt(key);
          buffers.push(QInt.from(obj[areaId].length).toBuffer());
          buffers.push(QInt.from(areaId).toBuffer());
          for (const label of obj[areaId]) buffers.push(QUserType.get(labelType).from(label).toBuffer(true));
        }
        return concat(buffers);
      }
    };
  }
  function createMudletAreas(areaType) {
    return class MudletAreas extends QClass {
      static read(buffer) {
        const areas = {};
        const areaSize = QInt.read(buffer);
        for (let index = 0; index < areaSize; index++) {
          const id = QInt.read(buffer);
          areas[id] = QUserType.get(areaType).read(buffer);
        }
        return areas;
      }
      toBuffer() {
        const obj = this.__obj;
        const buffers = [];
        buffers.push(QInt.from(Object.keys(obj).length).toBuffer());
        for (const [key, area] of Object.entries(obj).sort((a3, b3) => parseInt(a3[0]) - parseInt(b3[0]))) {
          buffers.push(QInt.from(parseInt(key)).toBuffer());
          buffers.push(QUserType.get(areaType).from(area).toBuffer(true));
        }
        return concat(buffers);
      }
    };
  }
  function createMudletRooms(roomType) {
    return class MudletRooms extends QClass {
      static read(buffer) {
        const rooms = {};
        while (buffer.buffer.length > buffer.read_offset) {
          const id = QInt.read(buffer);
          rooms[id] = QUserType.get(roomType).read(buffer);
        }
        return rooms;
      }
      toBuffer() {
        const obj = this.__obj;
        const buffers = [];
        for (const [key, room2] of Object.entries(obj).reverse()) {
          buffers.push(QInt.from(parseInt(key)).toBuffer());
          buffers.push(QUserType.get(roomType).from(room2).toBuffer(true));
        }
        return concat(buffers);
      }
    };
  }
  var customCounter = 1e3;
  var customMapCache = {};
  var customMultiMapCache = {};
  var customArrayCache = {};
  var customPairCache = {};
  function resolveQType(typeOrClass) {
    if (typeof typeOrClass === "number" || !typeOrClass.qtype) return QClass.types.get(typeOrClass);
    return typeOrClass;
  }
  function mudletSorter(a3, b3) {
    if (parseInt(a3[0]) === -1) return -1;
    if (parseInt(b3[0]) === -1) return 1;
    return parseInt(a3[0]) - parseInt(b3[0]);
  }
  function createTypedMultiMap(keyClass, valueClass) {
    return class QTypedMultiMap extends QClass {
      static read(buffer) {
        const map = {};
        const count = QUInt.read(buffer);
        for (let index = 0; index < count; index++) {
          const key = keyClass.read(buffer);
          const value = valueClass.read(buffer);
          if (map[key] === void 0) map[key] = [];
          map[key].push(value);
        }
        return map;
      }
      toBuffer() {
        const bufs = [];
        const obj = this.__obj;
        if (obj instanceof Map) {
          bufs.push(QUInt.from(obj.size).toBuffer());
          for (const [key, value] of obj) {
            bufs.push(keyClass.from(key).toBuffer());
            bufs.push(valueClass.from(value).toBuffer());
          }
        } else {
          let counter = 0;
          for (const [key, value] of Object.entries(obj).reverse()) for (const item of value) {
            counter++;
            bufs.push(keyClass.from(key).toBuffer());
            bufs.push(valueClass.from(item).toBuffer());
          }
          bufs.unshift(QUInt.from(counter).toBuffer());
        }
        return concat(bufs);
      }
    };
  }
  function createTypedMap(keyClass, valueClass) {
    return class QTypedMap extends QClass {
      static read(buffer) {
        const map = {};
        const count = QUInt.read(buffer);
        for (let index = 0; index < count; index++) {
          const key = keyClass.read(buffer);
          map[key] = valueClass.read(buffer);
        }
        return map;
      }
      toBuffer() {
        const bufs = [];
        const obj = this.__obj;
        if (obj instanceof Map) {
          bufs.push(QUInt.from(obj.size).toBuffer());
          for (const [key, value] of obj) {
            bufs.push(keyClass.from(key).toBuffer());
            bufs.push(valueClass.from(value).toBuffer());
          }
        } else {
          const entries = Object.entries(obj);
          bufs.push(QUInt.from(entries.length).toBuffer());
          for (const [key, value] of entries.sort(mudletSorter)) {
            bufs.push(keyClass.from(key).toBuffer());
            bufs.push(valueClass.from(value).toBuffer());
          }
        }
        return concat(bufs);
      }
    };
  }
  function createTypedList(valueClass) {
    return class QTypedList extends QClass {
      static read(buffer) {
        const list = [];
        const count = QUInt.read(buffer);
        for (let index = 0; index < count; index++) list.push(valueClass.read(buffer));
        return list;
      }
      toBuffer() {
        const bufs = [];
        const arr = this.__obj;
        bufs.push(QUInt.from(arr.length).toBuffer());
        for (const el of arr) bufs.push(valueClass.from(el).toBuffer());
        return concat(bufs);
      }
    };
  }
  function createTypedPair(first, second) {
    return class QTypedPair extends QClass {
      static read(buffer) {
        return [first.read(buffer), second.read(buffer)];
      }
      toBuffer() {
        const pair = this.__obj;
        return concat([first.from(pair[0]).toBuffer(), second.from(pair[1]).toBuffer()]);
      }
    };
  }
  function QMultiMap(keyClass, valueClass) {
    const resolvedKey = resolveQType(keyClass);
    const resolvedValue = resolveQType(valueClass);
    const keyStr = String(resolvedKey);
    const valStr = String(resolvedValue);
    if (!customMultiMapCache[keyStr]) customMultiMapCache[keyStr] = {};
    if (!customMultiMapCache[keyStr][valStr]) {
      const clazz = createTypedMultiMap(resolvedKey, resolvedValue);
      const counter = customCounter++;
      qtype(counter)(clazz);
      customMultiMapCache[keyStr][valStr] = counter;
    }
    return customMultiMapCache[keyStr][valStr];
  }
  function QMap2(keyClass, valueClass, _reversed) {
    const resolvedKey = resolveQType(keyClass);
    const resolvedValue = resolveQType(valueClass);
    const keyStr = String(resolvedKey);
    const valStr = String(resolvedValue);
    if (!customMapCache[keyStr]) customMapCache[keyStr] = {};
    if (!customMapCache[keyStr][valStr]) {
      const clazz = createTypedMap(resolvedKey, resolvedValue);
      const counter = customCounter++;
      qtype(counter)(clazz);
      customMapCache[keyStr][valStr] = counter;
    }
    return customMapCache[keyStr][valStr];
  }
  function QList2(valueClass) {
    const cacheKey = String(valueClass);
    if (!customArrayCache[cacheKey]) {
      const clazz = createTypedList(valueClass);
      const counter = customCounter++;
      qtype(counter)(clazz);
      customArrayCache[cacheKey] = counter;
    }
    return customArrayCache[cacheKey];
  }
  function QPair(first, second) {
    const key = `${first.name}#${second.name}`;
    if (!customPairCache[key]) {
      const clazz = createTypedPair(first, second);
      const counter = customCounter++;
      qtype(counter)(clazz);
      customPairCache[key] = counter;
    }
    return customPairCache[key];
  }
  var models = /* @__PURE__ */ new Map();
  function registerMapModel(model) {
    models.set(model.version, model);
  }
  function getMapModel(version) {
    return models.get(version);
  }
  function getSupportedVersions() {
    return [...models.keys()].sort((a3, b3) => a3 - b3);
  }
  var ROOM_SYMBOL_KEY = "system.fallback_symbol";
  var MAP_FONT_KEY = "system.fallback_mapSymbolFont";
  var MAP_FONT_FUDGE_KEY = "system.fallback_mapSymbolFontFudgeFactor";
  var MAP_ONLY_FONT_KEY = "system.fallback_onlyUseMapSymbolFont";
  var NATIVE_SYMBOL_VERSION = 19;
  var NATIVE_MAP_FONT_VERSION = 19;
  function take(userData, key) {
    const value = userData[key];
    delete userData[key];
    return value;
  }
  var FONT_BIT = {
    italic: 1,
    underline: 2,
    strikeOut: 4,
    fixedPitch: 8,
    oblique: 128
  };
  var STYLE_OBLIQUE = 2;
  function fontFromString(description, base) {
    const fields = description.split(",").slice(0, 10);
    if (fields.length < 10) return void 0;
    const [family, pointSize, pixelSize, styleHint, weight, style, underline, strikeOut, fixedPitch] = fields;
    const italic = Number(style) !== 0;
    const oblique = Number(style) === STYLE_OBLIQUE;
    const isSet = (field) => Number(field) !== 0;
    let fontBits = base.fontBits;
    const setBit = (bit, on) => {
      fontBits = on ? fontBits | bit : fontBits & ~bit;
    };
    setBit(FONT_BIT.italic, italic);
    setBit(FONT_BIT.oblique, oblique);
    setBit(FONT_BIT.underline, isSet(underline));
    setBit(FONT_BIT.strikeOut, isSet(strikeOut));
    setBit(FONT_BIT.fixedPitch, isSet(fixedPitch));
    return {
      ...base,
      family,
      pointSize: Number(pointSize),
      pixelSize: Number(pixelSize),
      styleHint: Number(styleHint),
      weight: Number(weight),
      fontBits,
      styleSetting: italic,
      styleOblique: oblique,
      underline: isSet(underline),
      strikeOut: isSet(strikeOut),
      fixedPitch: isSet(fixedPitch)
    };
  }
  function applyRoomFallbacks(room2, version) {
    const userData = room2.userData;
    if (!userData) return;
    if (version >= NATIVE_SYMBOL_VERSION) {
      delete userData[ROOM_SYMBOL_KEY];
      return;
    }
    const symbol = take(userData, ROOM_SYMBOL_KEY);
    if (symbol) room2.symbol = symbol;
  }
  function applyMapFallbacks(header, version) {
    const userData = header.mUserData;
    if (!userData) return;
    if (version >= NATIVE_MAP_FONT_VERSION) {
      delete userData[MAP_FONT_KEY];
      delete userData[MAP_FONT_FUDGE_KEY];
      delete userData[MAP_ONLY_FONT_KEY];
      return;
    }
    const description = take(userData, MAP_FONT_KEY);
    const fudgeFactor = take(userData, MAP_FONT_FUDGE_KEY);
    const onlyUseMapFont = take(userData, MAP_ONLY_FONT_KEY);
    if (description) {
      const font = fontFromString(description, header.mapSymbolFont);
      if (font) header.mapSymbolFont = font;
    }
    if (fudgeFactor) header.mapFontFudgeFactor = Number(fudgeFactor);
    if (onlyUseMapFont) header.useOnlyMapFont = onlyUseMapFont.toLowerCase() === "true";
  }
  registerBaseTypes();
  var PEN_STYLE = {
    "dot line": 3,
    "dash line": 2,
    "dash dot line": 4,
    "dash dot dot line": 5
  };
  var LEGACY_DIRECTION_KEYS = {
    N: "n",
    E: "e",
    S: "s",
    W: "w",
    UP: "up",
    DOWN: "down",
    NE: "ne",
    SE: "se",
    SW: "sw",
    NW: "nw",
    IN: "in",
    OUT: "out"
  };
  function normalizeDirectionKeys(record) {
    const out = {};
    for (const key of Object.keys(record)) out[LEGACY_DIRECTION_KEYS[key] ?? key] = record[key];
    return out;
  }
  var DEFAULT_FONT = {
    family: "Bitstream Vera Sans Mono",
    style: "",
    pointSize: 10,
    pixelSize: -1,
    styleHint: 0,
    styleStrategy: 0,
    weight: 50,
    fontBits: 0,
    stretch: 0,
    extendedFontBits: 0,
    letterSpacing: 0,
    wordSpacing: 0,
    hintingPreference: 0,
    capital: 0,
    styleSetting: false,
    underline: false,
    overline: false,
    strikeOut: false,
    fixedPitch: true,
    kerning: false,
    styleOblique: false,
    ignorePitch: false,
    letterSpacingIsAbsolute: false
  };
  var QSymbolByte = class extends QClass {
    static read(buffer) {
      const code = buffer.readInt8();
      return code > 32 ? String.fromCodePoint(code) : "";
    }
    toBuffer() {
      throw new Error("writing legacy Mudlet map versions is not supported");
    }
  };
  var QColorFromIntList = class extends QClass {
    static read(buffer) {
      const count = QUInt.read(buffer);
      const channels = [];
      for (let i3 = 0; i3 < count; i3++) channels.push(QInt.read(buffer));
      if (channels.length >= 3) return {
        spec: 1,
        alpha: 255,
        r: channels[0],
        g: channels[1],
        b: channels[2],
        pad: 0
      };
      return {
        spec: 1,
        alpha: 255,
        r: 255,
        g: 0,
        b: 0,
        pad: 0
      };
    }
    toBuffer() {
      throw new Error("writing legacy Mudlet map versions is not supported");
    }
  };
  var QStyleFromString = class extends QClass {
    static read(buffer) {
      return PEN_STYLE[QString$1.read(buffer)] ?? 1;
    }
    toBuffer() {
      throw new Error("writing legacy Mudlet map versions is not supported");
    }
  };
  var QLegacyRoomId = class extends QClass {
    static read(buffer) {
      QInt.read(buffer);
      return {};
    }
    toBuffer() {
      throw new Error("writing legacy Mudlet map versions is not supported");
    }
  };
  var LEGACY_TYPE = {
    SYMBOL_BYTE: 300,
    COLOR_INTLIST: 301,
    STYLE_STRING: 302,
    ROOM_ID: 303
  };
  var legacyTypesRegistered = false;
  function registerLegacyValueTypes() {
    if (legacyTypesRegistered) return;
    legacyTypesRegistered = true;
    qtype(LEGACY_TYPE.SYMBOL_BYTE)(QSymbolByte);
    qtype(LEGACY_TYPE.COLOR_INTLIST)(QColorFromIntList);
    qtype(LEGACY_TYPE.STYLE_STRING)(QStyleFromString);
    qtype(LEGACY_TYPE.ROOM_ID)(QLegacyRoomId);
  }
  var CONFIGS = {
    16: {
      hasMapUserData: false,
      hasMapFont: false,
      modernRoomIdHash: false,
      modernArea: false,
      stringSymbol: false
    },
    17: {
      hasMapUserData: true,
      hasMapFont: false,
      modernRoomIdHash: false,
      modernArea: true,
      stringSymbol: false
    },
    18: {
      hasMapUserData: true,
      hasMapFont: false,
      modernRoomIdHash: true,
      modernArea: true,
      stringSymbol: false
    },
    19: {
      hasMapUserData: true,
      hasMapFont: true,
      modernRoomIdHash: true,
      modernArea: true,
      stringSymbol: true
    }
  };
  function backfillHeader(header, cfg, version) {
    if (!cfg.hasMapUserData) header.mUserData = {};
    if (!cfg.hasMapFont) {
      header.mapSymbolFont = { ...DEFAULT_FONT };
      header.mapFontFudgeFactor = 1;
      header.useOnlyMapFont = false;
    }
    applyMapFallbacks(header, version);
    if (!cfg.modernArea) for (const value of Object.values(header.areas)) {
      const area = value;
      delete area.legacyForZUnused1;
      delete area.legacyForZUnused2;
      area.userData = {};
    }
  }
  function backfillRoom(room2, version) {
    applyRoomFallbacks(room2, version);
    room2.customLines = normalizeDirectionKeys(room2.customLines);
    room2.customLinesArrow = normalizeDirectionKeys(room2.customLinesArrow);
    room2.customLinesColor = normalizeDirectionKeys(room2.customLinesColor);
    room2.customLinesStyle = normalizeDirectionKeys(room2.customLinesStyle);
  }
  function registerLegacyMapModel(version) {
    const cfg = CONFIGS[version];
    if (!cfg) throw new Error(`No legacy config for Mudlet map version ${version}`);
    registerLegacyValueTypes();
    const TYPE2 = {
      MAP: `MudletMap@${version}`,
      HEADER: `MudletMapHeader@${version}`,
      AREA: `MudletArea@${version}`,
      ROOM: `MudletRoom@${version}`,
      LABEL: `MudletLabel@${version}`
    };
    const CONTAINER2 = {
      LABELS: version * 10,
      ROOMS: version * 10 + 1,
      AREAS: version * 10 + 2
    };
    qtype(CONTAINER2.LABELS)(createMudletLabels(TYPE2.LABEL));
    qtype(CONTAINER2.ROOMS)(createMudletRooms(TYPE2.ROOM));
    qtype(CONTAINER2.AREAS)(createMudletAreas(TYPE2.AREA));
    const areaFields = [
      { rooms: QList2(QUInt) },
      { zLevels: QList2(QInt) },
      { mAreaExits: QMultiMap(QInt, QPair(QInt, QInt)) },
      { gridMode: Types$1.BOOL },
      { max_x: Types$1.INT },
      { max_y: Types$1.INT },
      { max_z: Types$1.INT },
      { min_x: Types$1.INT },
      { min_y: Types$1.INT },
      { min_z: Types$1.INT },
      { span: Types$1.VECTOR }
    ];
    if (cfg.modernArea) areaFields.push({ xmaxForZ: QMap2(QInt, QInt) }, { ymaxForZ: QMap2(QInt, QInt) }, { xminForZ: QMap2(QInt, QInt) }, { yminForZ: QMap2(QInt, QInt) });
    else areaFields.push({ xmaxForZ: QMap2(QInt, QInt) }, { ymaxForZ: QMap2(QInt, QInt) }, { legacyForZUnused1: QMap2(QInt, QInt) }, { xminForZ: QMap2(QInt, QInt) }, { yminForZ: QMap2(QInt, QInt) }, { legacyForZUnused2: QMap2(QInt, QInt) });
    areaFields.push({ pos: Types$1.VECTOR }, { isZone: Types$1.BOOL }, { zoneAreaRef: Types$1.INT });
    if (cfg.modernArea) areaFields.push({ userData: QMap2(QString$1, QString$1) });
    QUserType.register(TYPE2.AREA, areaFields);
    QUserType.register(TYPE2.ROOM, [
      { area: Types$1.INT },
      { x: Types$1.INT },
      { y: Types$1.INT },
      { z: Types$1.INT },
      { north: Types$1.INT },
      { northeast: Types$1.INT },
      { east: Types$1.INT },
      { southeast: Types$1.INT },
      { south: Types$1.INT },
      { southwest: Types$1.INT },
      { west: Types$1.INT },
      { northwest: Types$1.INT },
      { up: Types$1.INT },
      { down: Types$1.INT },
      { in: Types$1.INT },
      { out: Types$1.INT },
      { environment: Types$1.INT },
      { weight: Types$1.INT },
      { name: Types$1.STRING },
      { isLocked: Types$1.BOOL },
      { rawSpecialExits: QMultiMap(QUInt, QString$1) },
      { symbol: cfg.stringSymbol ? Types$1.STRING : LEGACY_TYPE.SYMBOL_BYTE },
      { userData: QMap2(QString$1, QString$1) },
      { customLines: QMap2(QString$1, QList2(QPoint)) },
      { customLinesArrow: QMap2(QString$1, QBool) },
      { customLinesColor: QMap2(QString$1, QColorFromIntList) },
      { customLinesStyle: QMap2(QString$1, QStyleFromString) },
      { exitLocks: QList2(QInt) },
      { stubs: QList2(QInt) },
      { exitWeights: QMap2(QString$1, QInt) },
      { doors: QMap2(QString$1, QInt) }
    ]);
    QUserType.register(TYPE2.LABEL, [
      { id: Types$1.INT },
      { pos: Types$1.VECTOR },
      { dummy1: Types$1.DOUBLE },
      { dummy2: Types$1.DOUBLE },
      { size: QPair(QDouble, QDouble) },
      { text: Types$1.STRING },
      { fgColor: Types$1.COLOR },
      { bgColor: Types$1.COLOR },
      { pixMap: Types$1.PIXMAP },
      { noScaling: Types$1.BOOL },
      { showOnTop: Types$1.BOOL }
    ]);
    const mapFields = [
      { version: Types$1.INT },
      { envColors: QMap2(QInt, QInt) },
      { areaNames: QMap2(QInt, QString$1, true) },
      { mCustomEnvColors: QMap2(QInt, QColor) },
      { mpRoomDbHashToRoomId: QMap2(QString$1, QUInt) }
    ];
    if (cfg.hasMapUserData) mapFields.push({ mUserData: QMap2(QString$1, QString$1) });
    if (cfg.hasMapFont) mapFields.push({ mapSymbolFont: Types$1.FONT }, { mapFontFudgeFactor: Types$1.DOUBLE }, { useOnlyMapFont: Types$1.BOOL });
    mapFields.push({ areas: CONTAINER2.AREAS });
    mapFields.push(cfg.modernRoomIdHash ? { mRoomIdHash: QMap2(QString$1, QInt) } : { mRoomIdHash: LEGACY_TYPE.ROOM_ID });
    mapFields.push({ labels: CONTAINER2.LABELS });
    QUserType.register(TYPE2.HEADER, mapFields);
    QUserType.register(TYPE2.MAP, [...mapFields, { rooms: CONTAINER2.ROOMS }]);
    registerMapModel({
      version,
      read: (rb) => {
        const map = QUserType.read(rb, TYPE2.MAP);
        backfillHeader(map, cfg, version);
        for (const room2 of Object.values(map.rooms)) backfillRoom(room2, version);
        return map;
      },
      write: () => {
        throw new Error(`Writing Mudlet map version ${version} is not supported (read-only). Mudlet only saves the latest format.`);
      },
      readHeader: (rb) => {
        const header = QUserType.read(rb, TYPE2.HEADER);
        backfillHeader(header, cfg, version);
        return header;
      },
      readRoom: (rb) => {
        const id = QInt.read(rb);
        const room2 = QUserType.get(TYPE2.ROOM).read(rb);
        backfillRoom(room2, version);
        return {
          id,
          room: room2
        };
      }
    });
  }
  registerLegacyMapModel(16);
  registerLegacyMapModel(17);
  registerLegacyMapModel(18);
  registerLegacyMapModel(19);
  var VERSION = 20;
  registerBaseTypes();
  var TYPE = {
    MAP: `MudletMap@${VERSION}`,
    HEADER: `MudletMapHeader@${VERSION}`,
    AREA: `MudletArea@${VERSION}`,
    ROOM: `MudletRoom@${VERSION}`,
    LABEL: `MudletLabel@${VERSION}`
  };
  var CONTAINER = {
    LABELS: 200,
    ROOMS: 201,
    AREAS: 202
  };
  qtype(CONTAINER.LABELS)(createMudletLabels(TYPE.LABEL));
  qtype(CONTAINER.ROOMS)(createMudletRooms(TYPE.ROOM));
  qtype(CONTAINER.AREAS)(createMudletAreas(TYPE.AREA));
  QUserType.register(TYPE.AREA, [
    { rooms: QList2(QUInt) },
    { zLevels: QList2(QInt) },
    { mAreaExits: QMultiMap(QInt, QPair(QInt, QInt)) },
    { gridMode: Types$1.BOOL },
    { max_x: Types$1.INT },
    { max_y: Types$1.INT },
    { max_z: Types$1.INT },
    { min_x: Types$1.INT },
    { min_y: Types$1.INT },
    { min_z: Types$1.INT },
    { span: Types$1.VECTOR },
    { xmaxForZ: QMap2(QInt, QInt) },
    { ymaxForZ: QMap2(QInt, QInt) },
    { xminForZ: QMap2(QInt, QInt) },
    { yminForZ: QMap2(QInt, QInt) },
    { pos: Types$1.VECTOR },
    { isZone: Types$1.BOOL },
    { zoneAreaRef: Types$1.INT },
    { userData: QMap2(QString$1, QString$1) }
  ]);
  QUserType.register(TYPE.ROOM, [
    { area: Types$1.INT },
    { x: Types$1.INT },
    { y: Types$1.INT },
    { z: Types$1.INT },
    { north: Types$1.INT },
    { northeast: Types$1.INT },
    { east: Types$1.INT },
    { southeast: Types$1.INT },
    { south: Types$1.INT },
    { southwest: Types$1.INT },
    { west: Types$1.INT },
    { northwest: Types$1.INT },
    { up: Types$1.INT },
    { down: Types$1.INT },
    { in: Types$1.INT },
    { out: Types$1.INT },
    { environment: Types$1.INT },
    { weight: Types$1.INT },
    { name: Types$1.STRING },
    { isLocked: Types$1.BOOL },
    { rawSpecialExits: QMultiMap(QUInt, QString$1) },
    { symbol: Types$1.STRING },
    { userData: QMap2(QString$1, QString$1) },
    { customLines: QMap2(QString$1, QList2(QPoint)) },
    { customLinesArrow: QMap2(QString$1, QBool) },
    { customLinesColor: QMap2(QString$1, QColor) },
    { customLinesStyle: QMap2(QString$1, QUInt) },
    { exitLocks: QList2(QInt) },
    { stubs: QList2(QInt) },
    { exitWeights: QMap2(QString$1, QInt) },
    { doors: QMap2(QString$1, QInt) }
  ]);
  QUserType.register(TYPE.LABEL, [
    { id: Types$1.INT },
    { pos: Types$1.VECTOR },
    { dummy1: Types$1.DOUBLE },
    { dummy2: Types$1.DOUBLE },
    { size: QPair(QDouble, QDouble) },
    { text: Types$1.STRING },
    { fgColor: Types$1.COLOR },
    { bgColor: Types$1.COLOR },
    { pixMap: Types$1.PIXMAP },
    { noScaling: Types$1.BOOL },
    { showOnTop: Types$1.BOOL }
  ]);
  var HEADER_FIELDS = [
    { version: Types$1.INT },
    { envColors: QMap2(QInt, QInt) },
    { areaNames: QMap2(QInt, QString$1, true) },
    { mCustomEnvColors: QMap2(QInt, QColor) },
    { mpRoomDbHashToRoomId: QMap2(QString$1, QUInt) },
    { mUserData: QMap2(QString$1, QString$1) },
    { mapSymbolFont: Types$1.FONT },
    { mapFontFudgeFactor: Types$1.DOUBLE },
    { useOnlyMapFont: Types$1.BOOL },
    { areas: CONTAINER.AREAS },
    { mRoomIdHash: QMap2(QString$1, QInt) },
    { labels: CONTAINER.LABELS }
  ];
  QUserType.register(TYPE.HEADER, HEADER_FIELDS);
  QUserType.register(TYPE.MAP, [...HEADER_FIELDS, { rooms: CONTAINER.ROOMS }]);
  registerMapModel({
    version: VERSION,
    read: (rb) => {
      const map = QUserType.read(rb, TYPE.MAP);
      applyMapFallbacks(map, VERSION);
      for (const room2 of Object.values(map.rooms)) applyRoomFallbacks(room2, VERSION);
      return map;
    },
    write: (map) => QUserType.get(TYPE.MAP).from(map).toBuffer(true),
    readHeader: (rb) => {
      const header = QUserType.read(rb, TYPE.HEADER);
      applyMapFallbacks(header, VERSION);
      return header;
    },
    readRoom: (rb) => {
      const id = QInt.read(rb);
      const room2 = QUserType.get(TYPE.ROOM).read(rb);
      applyRoomFallbacks(room2, VERSION);
      return {
        id,
        room: room2
      };
    }
  });
  var { ReadBuffer: ReadBuffer2 } = buffer_exports;
  function populateRoomHashes(map) {
    for (const hash in map.mpRoomDbHashToRoomId) {
      if (!Object.hasOwn(map.mpRoomDbHashToRoomId, hash)) continue;
      const roomId = map.mpRoomDbHashToRoomId[hash];
      const room2 = map.rooms[roomId];
      if (room2) room2.hash = hash;
    }
  }
  function hydrateRoomSpecialExits(room2) {
    room2.mSpecialExits = {};
    room2.mSpecialExitLocks = [];
    for (const key in room2.rawSpecialExits) {
      if (!Object.hasOwn(room2.rawSpecialExits, key)) continue;
      for (const ex of room2.rawSpecialExits[key]) if (ex.startsWith("0")) room2.mSpecialExits[ex.substring(1)] = parseInt(key);
      else if (ex.startsWith("1")) {
        room2.mSpecialExits[ex.substring(1)] = parseInt(key);
        room2.mSpecialExitLocks.push(ex.substring(1));
      } else room2.mSpecialExits[ex] = parseInt(key);
    }
  }
  function hydrateSpecialExits(map) {
    for (const roomId in map.rooms) {
      if (!Object.hasOwn(map.rooms, roomId)) continue;
      hydrateRoomSpecialExits(map.rooms[roomId]);
    }
  }
  function readMapVersion(buf) {
    return QInt.read(new ReadBuffer2(buf));
  }
  function readMapFromBuffer$1(buf) {
    const version = readMapVersion(buf);
    const model = getMapModel(version);
    if (!model) throw new Error(`Unsupported Mudlet map version ${version}. Supported version(s): ${getSupportedVersions().join(", ")}.`);
    const map = model.read(new ReadBuffer2(buf));
    hydrateSpecialExits(map);
    populateRoomHashes(map);
    return map;
  }
  function streamRooms$1(buf, onRoom, onHeader) {
    const version = readMapVersion(buf);
    const model = getMapModel(version);
    if (!model) throw new Error(`Unsupported Mudlet map version ${version}. Supported version(s): ${getSupportedVersions().join(", ")}.`);
    const rb = new ReadBuffer2(buf);
    const header = model.readHeader(rb);
    onHeader?.(header);
    while (rb.read_offset < rb.buffer.length) {
      const { id, room: room2 } = model.readRoom(rb);
      hydrateRoomSpecialExits(room2);
      onRoom(id, room2);
    }
    return header;
  }
  var mudlet_colors_default = {
    light_gray: [
      211,
      211,
      211
    ],
    ansi_027: [
      0,
      95,
      255
    ],
    pale_turquoise: [
      175,
      238,
      238
    ],
    ansi_178: [
      215,
      175,
      0
    ],
    purple: [
      160,
      32,
      240
    ],
    ansi_079: [
      95,
      215,
      175
    ],
    ansi_047: [
      0,
      255,
      95
    ],
    PaleGreen: [
      152,
      251,
      152
    ],
    ansi_041: [
      0,
      215,
      95
    ],
    sky_blue: [
      135,
      206,
      235
    ],
    light_goldenrod_yellow: [
      250,
      250,
      210
    ],
    OrangeRed: [
      255,
      69,
      0
    ],
    ansi_185: [
      215,
      215,
      95
    ],
    ansi_014: [
      0,
      255,
      255
    ],
    OliveDrab: [
      107,
      142,
      35
    ],
    PapayaWhip: [
      255,
      239,
      213
    ],
    chocolate: [
      210,
      105,
      30
    ],
    cornflower_blue: [
      100,
      149,
      237
    ],
    ansi_160: [
      215,
      0,
      0
    ],
    ansi_black: [
      0,
      0,
      0
    ],
    ansi_058: [
      95,
      95,
      0
    ],
    gold: [
      255,
      215,
      0
    ],
    lawn_green: [
      124,
      252,
      0
    ],
    ansi_036: [
      0,
      175,
      135
    ],
    grey: [
      190,
      190,
      190
    ],
    NavajoWhite: [
      255,
      222,
      173
    ],
    ansi_008: [
      128,
      128,
      128
    ],
    ansi_204: [
      255,
      95,
      135
    ],
    sandy_brown: [
      244,
      164,
      96
    ],
    ansi_024: [
      0,
      95,
      135
    ],
    ansi_048: [
      0,
      255,
      135
    ],
    MediumSpringGreen: [
      0,
      250,
      154
    ],
    DarkOliveGreen: [
      85,
      107,
      47
    ],
    ansi_244: [
      128,
      128,
      128
    ],
    ansi_012: [
      0,
      0,
      255
    ],
    ansi_025: [
      0,
      95,
      175
    ],
    light_salmon: [
      255,
      160,
      122
    ],
    ansi_182: [
      215,
      175,
      215
    ],
    ForestGreen: [
      34,
      139,
      34
    ],
    ansi_194: [
      215,
      255,
      215
    ],
    burlywood: [
      222,
      184,
      135
    ],
    BlanchedAlmond: [
      255,
      235,
      205
    ],
    ansi_131: [
      175,
      95,
      95
    ],
    HotPink: [
      255,
      105,
      180
    ],
    dark_sea_green: [
      143,
      188,
      143
    ],
    MediumSlateBlue: [
      123,
      104,
      238
    ],
    LightGrey: [
      211,
      211,
      211
    ],
    dark_violet: [
      148,
      0,
      211
    ],
    saddle_brown: [
      139,
      69,
      19
    ],
    medium_orchid: [
      186,
      85,
      211
    ],
    ansi_yellow: [
      128,
      128,
      0
    ],
    ansi_230: [
      255,
      255,
      215
    ],
    ansi_238: [
      68,
      68,
      68
    ],
    MintCream: [
      245,
      255,
      250
    ],
    ansi_188: [
      215,
      215,
      215
    ],
    pale_green: [
      152,
      251,
      152
    ],
    pale_goldenrod: [
      238,
      232,
      170
    ],
    ansi_164: [
      215,
      0,
      215
    ],
    mint_cream: [
      245,
      255,
      250
    ],
    violet_red: [
      208,
      32,
      144
    ],
    ansi_215: [
      255,
      175,
      95
    ],
    ansi_248: [
      168,
      168,
      168
    ],
    ansi_163: [
      215,
      0,
      175
    ],
    ansi_023: [
      0,
      95,
      95
    ],
    ansi_044: [
      0,
      215,
      215
    ],
    spring_green: [
      0,
      255,
      127
    ],
    orange: [
      255,
      165,
      0
    ],
    LightCyan: [
      224,
      255,
      255
    ],
    ansi_143: [
      175,
      175,
      95
    ],
    LightSeaGreen: [
      32,
      178,
      170
    ],
    salmon: [
      250,
      128,
      114
    ],
    LightSteelBlue: [
      176,
      196,
      222
    ],
    ansi_000: [
      0,
      0,
      0
    ],
    indian_red: [
      205,
      92,
      92
    ],
    ansi_144: [
      175,
      175,
      135
    ],
    light_steel_blue: [
      176,
      196,
      222
    ],
    ansi_251: [
      198,
      198,
      198
    ],
    ansi_090: [
      135,
      0,
      135
    ],
    dark_green: [
      0,
      100,
      0
    ],
    ansi_064: [
      95,
      135,
      0
    ],
    ghost_white: [
      248,
      248,
      255
    ],
    ansi_016: [
      0,
      0,
      0
    ],
    gray: [
      190,
      190,
      190
    ],
    ansi_127: [
      175,
      0,
      175
    ],
    ansi_222: [
      255,
      215,
      135
    ],
    DarkViolet: [
      148,
      0,
      211
    ],
    ansi_098: [
      135,
      95,
      215
    ],
    old_lace: [
      253,
      245,
      230
    ],
    maroon: [
      176,
      48,
      96
    ],
    snow: [
      255,
      250,
      250
    ],
    ansi_094: [
      135,
      95,
      0
    ],
    ansi_050: [
      0,
      255,
      215
    ],
    ansi_139: [
      175,
      135,
      175
    ],
    ansi_171: [
      215,
      95,
      255
    ],
    MediumTurquoise: [
      72,
      209,
      204
    ],
    blanched_almond: [
      255,
      235,
      205
    ],
    ansi_087: [
      95,
      255,
      255
    ],
    LightBlue: [
      173,
      216,
      230
    ],
    seashell: [
      255,
      245,
      238
    ],
    ansi_111: [
      135,
      175,
      255
    ],
    ansi_013: [
      255,
      0,
      255
    ],
    ansi_light_red: [
      255,
      0,
      0
    ],
    blue: [
      0,
      0,
      255
    ],
    dark_slate_grey: [
      47,
      79,
      79
    ],
    LightGray: [
      211,
      211,
      211
    ],
    ansi_121: [
      135,
      255,
      175
    ],
    light_blue: [
      173,
      216,
      230
    ],
    ansi_119: [
      135,
      255,
      95
    ],
    DarkSalmon: [
      233,
      150,
      122
    ],
    ansi_211: [
      255,
      135,
      175
    ],
    ansi_214: [
      255,
      175,
      0
    ],
    ansi_077: [
      95,
      215,
      95
    ],
    floral_white: [
      255,
      250,
      240
    ],
    ansiCyan: [
      0,
      128,
      128
    ],
    ansi_086: [
      95,
      255,
      215
    ],
    ansi_002: [
      0,
      128,
      0
    ],
    ansi_156: [
      175,
      255,
      135
    ],
    ansi_042: [
      0,
      215,
      135
    ],
    SaddleBrown: [
      139,
      69,
      19
    ],
    ansi_199: [
      255,
      0,
      175
    ],
    honeydew: [
      240,
      255,
      240
    ],
    LightSlateGrey: [
      119,
      136,
      153
    ],
    ansi_217: [
      255,
      175,
      175
    ],
    tomato: [
      255,
      99,
      71
    ],
    ansi_184: [
      215,
      215,
      0
    ],
    forest_green: [
      34,
      139,
      34
    ],
    ansi_212: [
      255,
      135,
      215
    ],
    LightSlateBlue: [
      132,
      112,
      255
    ],
    light_slate_gray: [
      119,
      136,
      153
    ],
    ansi_light_black: [
      128,
      128,
      128
    ],
    PaleVioletRed: [
      219,
      112,
      147
    ],
    LightGoldenrod: [
      238,
      221,
      130
    ],
    light_slate_blue: [
      132,
      112,
      255
    ],
    medium_purple: [
      147,
      112,
      219
    ],
    ansi_175: [
      215,
      135,
      175
    ],
    ansi_183: [
      215,
      175,
      255
    ],
    PaleGoldenrod: [
      238,
      232,
      170
    ],
    ansi_234: [
      28,
      28,
      28
    ],
    ansi_129: [
      175,
      0,
      255
    ],
    red: [
      255,
      0,
      0
    ],
    ansi_010: [
      0,
      255,
      0
    ],
    ansi_176: [
      215,
      135,
      215
    ],
    ansi_magenta: [
      128,
      0,
      128
    ],
    ansi_001: [
      128,
      0,
      0
    ],
    lavender: [
      230,
      230,
      250
    ],
    green_yellow: [
      173,
      255,
      47
    ],
    ansi_046: [
      0,
      255,
      0
    ],
    dark_olive_green: [
      85,
      107,
      47
    ],
    ansi_068: [
      95,
      135,
      215
    ],
    midnight_blue: [
      25,
      25,
      112
    ],
    ansi_104: [
      135,
      135,
      215
    ],
    moccasin: [
      255,
      228,
      181
    ],
    DarkOrange: [
      255,
      140,
      0
    ],
    ansi_017: [
      0,
      0,
      95
    ],
    NavyBlue: [
      0,
      0,
      128
    ],
    papaya_whip: [
      255,
      239,
      213
    ],
    ansi_240: [
      88,
      88,
      88
    ],
    light_sea_green: [
      32,
      178,
      170
    ],
    ansi_109: [
      135,
      175,
      175
    ],
    ansi_126: [
      175,
      0,
      135
    ],
    ansi_168: [
      215,
      95,
      135
    ],
    ansi_005: [
      128,
      0,
      128
    ],
    black: [
      0,
      0,
      0
    ],
    ansi_009: [
      255,
      0,
      0
    ],
    yellow: [
      255,
      255,
      0
    ],
    light_slate_grey: [
      119,
      136,
      153
    ],
    goldenrod: [
      218,
      165,
      32
    ],
    lavender_blush: [
      255,
      240,
      245
    ],
    ansi_227: [
      255,
      255,
      95
    ],
    ansi_053: [
      95,
      0,
      95
    ],
    ansiWhite: [
      192,
      192,
      192
    ],
    ansi_197: [
      255,
      0,
      95
    ],
    GreenYellow: [
      173,
      255,
      47
    ],
    magenta: [
      255,
      0,
      255
    ],
    ansi_100: [
      135,
      135,
      0
    ],
    ansi_145: [
      175,
      175,
      175
    ],
    ansi_140: [
      175,
      135,
      215
    ],
    ansi_202: [
      255,
      95,
      0
    ],
    MediumAquamarine: [
      102,
      205,
      170
    ],
    ansi_235: [
      38,
      38,
      38
    ],
    thistle: [
      216,
      191,
      216
    ],
    ansi_162: [
      215,
      0,
      135
    ],
    ansi_066: [
      95,
      135,
      135
    ],
    ansi_221: [
      255,
      215,
      95
    ],
    ansi_097: [
      135,
      95,
      175
    ],
    ansi_236: [
      48,
      48,
      48
    ],
    ansi_102: [
      135,
      135,
      135
    ],
    ansi_011: [
      255,
      255,
      0
    ],
    ansi_029: [
      0,
      135,
      95
    ],
    ansi_146: [
      175,
      175,
      215
    ],
    ansi_223: [
      255,
      215,
      175
    ],
    ansi_070: [
      95,
      175,
      0
    ],
    ansi_231: [
      255,
      255,
      255
    ],
    ansi_233: [
      18,
      18,
      18
    ],
    ansi_055: [
      95,
      0,
      175
    ],
    antique_white: [
      250,
      235,
      215
    ],
    ansi_115: [
      135,
      215,
      175
    ],
    ansi_133: [
      175,
      95,
      175
    ],
    ansi_red: [
      128,
      0,
      0
    ],
    ansi_255: [
      238,
      238,
      238
    ],
    PaleTurquoise: [
      175,
      238,
      238
    ],
    ansi_037: [
      0,
      175,
      175
    ],
    ansi_063: [
      95,
      95,
      255
    ],
    ansi_242: [
      108,
      108,
      108
    ],
    ansi_191: [
      215,
      255,
      95
    ],
    DarkGoldenrod: [
      184,
      134,
      11
    ],
    ansi_071: [
      95,
      175,
      95
    ],
    ansi_228: [
      255,
      255,
      135
    ],
    SpringGreen: [
      0,
      255,
      127
    ],
    ansi_093: [
      135,
      0,
      255
    ],
    dark_khaki: [
      189,
      183,
      107
    ],
    SlateBlue: [
      106,
      90,
      205
    ],
    ansiRed: [
      128,
      0,
      0
    ],
    ansi_153: [
      175,
      215,
      255
    ],
    ansi_167: [
      215,
      95,
      95
    ],
    ansi_018: [
      0,
      0,
      135
    ],
    ansi_033: [
      0,
      135,
      255
    ],
    ansi_022: [
      0,
      95,
      0
    ],
    alice_blue: [
      240,
      248,
      255
    ],
    ansi_241: [
      98,
      98,
      98
    ],
    DarkSlateGray: [
      47,
      79,
      79
    ],
    ansi_035: [
      0,
      175,
      95
    ],
    slate_blue: [
      106,
      90,
      205
    ],
    ansi_237: [
      58,
      58,
      58
    ],
    bisque: [
      255,
      228,
      196
    ],
    AntiqueWhite: [
      250,
      235,
      215
    ],
    IndianRed: [
      205,
      92,
      92
    ],
    ansi_white: [
      192,
      192,
      192
    ],
    ansi_148: [
      175,
      215,
      0
    ],
    light_goldenrod: [
      238,
      221,
      130
    ],
    ansi_blue: [
      0,
      0,
      128
    ],
    ansi_253: [
      218,
      218,
      218
    ],
    ansiLightMagenta: [
      255,
      0,
      255
    ],
    DimGrey: [
      105,
      105,
      105
    ],
    ansi_103: [
      135,
      135,
      175
    ],
    ansi_172: [
      215,
      135,
      0
    ],
    LightSlateGray: [
      119,
      136,
      153
    ],
    ansi_038: [
      0,
      175,
      215
    ],
    lime_green: [
      50,
      205,
      50
    ],
    deep_sky_blue: [
      0,
      191,
      255
    ],
    ansiYellow: [
      128,
      128,
      0
    ],
    misty_rose: [
      255,
      228,
      225
    ],
    rosy_brown: [
      188,
      143,
      143
    ],
    ansi_245: [
      138,
      138,
      138
    ],
    DimGray: [
      105,
      105,
      105
    ],
    ansi_light_cyan: [
      0,
      255,
      255
    ],
    ansi_light_green: [
      0,
      255,
      0
    ],
    ansi_207: [
      255,
      95,
      255
    ],
    white_smoke: [
      245,
      245,
      245
    ],
    dark_slate_gray: [
      47,
      79,
      79
    ],
    ansi_141: [
      175,
      135,
      255
    ],
    DeepSkyBlue: [
      0,
      191,
      255
    ],
    ansi_213: [
      255,
      135,
      255
    ],
    gainsboro: [
      220,
      220,
      220
    ],
    medium_blue: [
      0,
      0,
      205
    ],
    ansi_193: [
      215,
      255,
      175
    ],
    MediumPurple: [
      147,
      112,
      219
    ],
    ansi_089: [
      135,
      0,
      95
    ],
    ansi_198: [
      255,
      0,
      135
    ],
    ansi_166: [
      215,
      95,
      0
    ],
    firebrick: [
      178,
      34,
      34
    ],
    VioletRed: [
      208,
      32,
      144
    ],
    ansi_065: [
      95,
      135,
      95
    ],
    DarkSeaGreen: [
      143,
      188,
      143
    ],
    ansi_122: [
      135,
      255,
      215
    ],
    navy: [
      0,
      0,
      128
    ],
    cornsilk: [
      255,
      248,
      220
    ],
    ansi_189: [
      215,
      215,
      255
    ],
    LightPink: [
      255,
      182,
      193
    ],
    LightSkyBlue: [
      135,
      206,
      250
    ],
    ansi_060: [
      95,
      95,
      135
    ],
    ansi_088: [
      135,
      0,
      0
    ],
    DarkSlateGrey: [
      47,
      79,
      79
    ],
    pink: [
      255,
      192,
      203
    ],
    medium_violet_red: [
      199,
      21,
      133
    ],
    peru: [
      205,
      133,
      63
    ],
    ansi_021: [
      0,
      0,
      255
    ],
    ansi_200: [
      255,
      0,
      215
    ],
    ansi_028: [
      0,
      135,
      0
    ],
    ansi_069: [
      95,
      135,
      255
    ],
    ansi_142: [
      175,
      175,
      0
    ],
    ansi_052: [
      95,
      0,
      0
    ],
    beige: [
      245,
      245,
      220
    ],
    ansi_007: [
      192,
      192,
      192
    ],
    deep_pink: [
      255,
      20,
      147
    ],
    medium_turquoise: [
      72,
      209,
      204
    ],
    ansi_161: [
      215,
      0,
      95
    ],
    RoyalBlue: [
      65,
      105,
      225
    ],
    ansi_135: [
      175,
      95,
      255
    ],
    ansi_020: [
      0,
      0,
      215
    ],
    ansi_136: [
      175,
      135,
      0
    ],
    ansi_225: [
      255,
      215,
      255
    ],
    ansi_249: [
      178,
      178,
      178
    ],
    DarkTurquoise: [
      0,
      206,
      209
    ],
    ansi_light_white: [
      255,
      255,
      255
    ],
    GhostWhite: [
      248,
      248,
      255
    ],
    ansi_123: [
      135,
      255,
      255
    ],
    ansi_208: [
      255,
      135,
      0
    ],
    ansi_062: [
      95,
      95,
      215
    ],
    ansi_015: [
      255,
      255,
      255
    ],
    ansi_125: [
      175,
      0,
      95
    ],
    LightGoldenrodYellow: [
      250,
      250,
      210
    ],
    DarkKhaki: [
      189,
      183,
      107
    ],
    ansi_232: [
      8,
      8,
      8
    ],
    ansi_239: [
      78,
      78,
      78
    ],
    ansi_219: [
      255,
      175,
      255
    ],
    ansi_083: [
      95,
      255,
      95
    ],
    ansi_061: [
      95,
      95,
      175
    ],
    ansi_075: [
      95,
      175,
      255
    ],
    linen: [
      250,
      240,
      230
    ],
    light_coral: [
      240,
      128,
      128
    ],
    AliceBlue: [
      240,
      248,
      255
    ],
    ansi_059: [
      95,
      95,
      95
    ],
    LightSalmon: [
      255,
      160,
      122
    ],
    khaki: [
      240,
      230,
      140
    ],
    ansi_073: [
      95,
      175,
      175
    ],
    ansi_201: [
      255,
      0,
      255
    ],
    ansi_128: [
      175,
      0,
      215
    ],
    ansiBlue: [
      0,
      0,
      128
    ],
    hot_pink: [
      255,
      105,
      180
    ],
    LemonChiffon: [
      255,
      250,
      205
    ],
    OldLace: [
      253,
      245,
      230
    ],
    FloralWhite: [
      255,
      250,
      240
    ],
    ansi_216: [
      255,
      175,
      135
    ],
    sienna: [
      160,
      82,
      45
    ],
    ansi_149: [
      175,
      215,
      95
    ],
    ansi_056: [
      95,
      0,
      215
    ],
    ansi_203: [
      255,
      95,
      95
    ],
    CadetBlue: [
      95,
      158,
      160
    ],
    ansi_159: [
      175,
      255,
      255
    ],
    LightCoral: [
      240,
      128,
      128
    ],
    ansi_187: [
      215,
      215,
      175
    ],
    sea_green: [
      46,
      139,
      87
    ],
    ansiLightGreen: [
      0,
      255,
      0
    ],
    coral: [
      255,
      127,
      80
    ],
    YellowGreen: [
      154,
      205,
      50
    ],
    yellow_green: [
      154,
      205,
      50
    ],
    ansi_224: [
      255,
      215,
      215
    ],
    ansi_173: [
      215,
      135,
      95
    ],
    WhiteSmoke: [
      245,
      245,
      245
    ],
    ansi_034: [
      0,
      175,
      0
    ],
    ansi_106: [
      135,
      175,
      0
    ],
    ansi_250: [
      188,
      188,
      188
    ],
    white: [
      255,
      255,
      255
    ],
    azure: [
      240,
      255,
      255
    ],
    wheat: [
      245,
      222,
      179
    ],
    violet: [
      238,
      130,
      238
    ],
    ansi_205: [
      255,
      95,
      175
    ],
    dark_orange: [
      255,
      140,
      0
    ],
    lemon_chiffon: [
      255,
      250,
      205
    ],
    LimeGreen: [
      50,
      205,
      50
    ],
    pale_violet_red: [
      219,
      112,
      147
    ],
    ansi_177: [
      215,
      135,
      255
    ],
    ansi_078: [
      95,
      215,
      135
    ],
    ansiLightBlue: [
      0,
      0,
      255
    ],
    turquoise: [
      64,
      224,
      208
    ],
    transparent: [
      255,
      255,
      255,
      0
    ],
    ansi_116: [
      135,
      215,
      215
    ],
    ansi_152: [
      175,
      215,
      215
    ],
    ansi_195: [
      215,
      255,
      255
    ],
    ansi_light_yellow: [
      255,
      255,
      0
    ],
    tan: [
      210,
      180,
      140
    ],
    ansiLightCyan: [
      0,
      255,
      255
    ],
    ansi_057: [
      95,
      0,
      255
    ],
    cadet_blue: [
      95,
      158,
      160
    ],
    ansi_040: [
      0,
      215,
      0
    ],
    ansi_081: [
      95,
      215,
      255
    ],
    ansi_085: [
      95,
      255,
      175
    ],
    SteelBlue: [
      70,
      130,
      180
    ],
    steel_blue: [
      70,
      130,
      180
    ],
    SlateGrey: [
      112,
      128,
      144
    ],
    slate_grey: [
      112,
      128,
      144
    ],
    DarkGreen: [
      0,
      100,
      0
    ],
    slate_gray: [
      112,
      128,
      144
    ],
    ansi_158: [
      175,
      255,
      215
    ],
    ansi_067: [
      95,
      135,
      175
    ],
    royal_blue: [
      65,
      105,
      225
    ],
    SkyBlue: [
      135,
      206,
      235
    ],
    ansi_107: [
      135,
      175,
      95
    ],
    ansi_096: [
      135,
      95,
      135
    ],
    ansi_157: [
      175,
      255,
      175
    ],
    DodgerBlue: [
      30,
      144,
      255
    ],
    ansi_169: [
      215,
      95,
      175
    ],
    ansi_174: [
      215,
      135,
      135
    ],
    ansi_170: [
      215,
      95,
      215
    ],
    ansi_124: [
      175,
      0,
      0
    ],
    BlueViolet: [
      138,
      43,
      226
    ],
    SeaGreen: [
      46,
      139,
      87
    ],
    cyan: [
      0,
      255,
      255
    ],
    SandyBrown: [
      244,
      164,
      96
    ],
    ansi_210: [
      255,
      135,
      135
    ],
    ansi_196: [
      255,
      0,
      0
    ],
    ansi_045: [
      0,
      215,
      255
    ],
    ansi_039: [
      0,
      175,
      255
    ],
    ansi_180: [
      215,
      175,
      135
    ],
    plum: [
      221,
      160,
      221
    ],
    ansi_light_magenta: [
      255,
      0,
      255
    ],
    ansi_243: [
      118,
      118,
      118
    ],
    ansi_186: [
      215,
      215,
      135
    ],
    ansi_054: [
      95,
      0,
      135
    ],
    RosyBrown: [
      188,
      143,
      143
    ],
    ansi_134: [
      175,
      95,
      215
    ],
    DeepPink: [
      255,
      20,
      147
    ],
    PowderBlue: [
      176,
      224,
      230
    ],
    ansi_147: [
      175,
      175,
      255
    ],
    ansi_019: [
      0,
      0,
      175
    ],
    powder_blue: [
      176,
      224,
      230
    ],
    PeachPuff: [
      255,
      218,
      185
    ],
    ansi_151: [
      175,
      215,
      175
    ],
    ansi_032: [
      0,
      135,
      215
    ],
    ansi_099: [
      135,
      95,
      255
    ],
    ansi_031: [
      0,
      135,
      175
    ],
    ansi_137: [
      175,
      135,
      95
    ],
    orchid: [
      218,
      112,
      214
    ],
    ansi_091: [
      135,
      0,
      175
    ],
    ansi_074: [
      95,
      175,
      215
    ],
    ansi_112: [
      135,
      215,
      0
    ],
    ansi_108: [
      135,
      175,
      135
    ],
    dark_slate_blue: [
      72,
      61,
      139
    ],
    olive_drab: [
      107,
      142,
      35
    ],
    dark_goldenrod: [
      184,
      134,
      11
    ],
    ansi_101: [
      135,
      135,
      95
    ],
    medium_spring_green: [
      0,
      250,
      154
    ],
    DarkOrchid: [
      153,
      50,
      204
    ],
    ansi_246: [
      148,
      148,
      148
    ],
    CornflowerBlue: [
      100,
      149,
      237
    ],
    ansi_030: [
      0,
      135,
      135
    ],
    ansiLightYellow: [
      255,
      255,
      0
    ],
    navy_blue: [
      0,
      0,
      128
    ],
    ansi_095: [
      135,
      95,
      95
    ],
    navajo_white: [
      255,
      222,
      173
    ],
    MistyRose: [
      255,
      228,
      225
    ],
    ansiGreen: [
      0,
      128,
      0
    ],
    light_cyan: [
      224,
      255,
      255
    ],
    ansi_150: [
      175,
      215,
      135
    ],
    dark_orchid: [
      153,
      50,
      204
    ],
    ansi_117: [
      135,
      215,
      255
    ],
    ansi_132: [
      175,
      95,
      135
    ],
    ansi_138: [
      175,
      135,
      135
    ],
    ansi_190: [
      215,
      255,
      0
    ],
    MediumVioletRed: [
      199,
      21,
      133
    ],
    MediumBlue: [
      0,
      0,
      205
    ],
    ansi_220: [
      255,
      215,
      0
    ],
    ansi_003: [
      128,
      128,
      0
    ],
    green: [
      0,
      255,
      0
    ],
    medium_slate_blue: [
      123,
      104,
      238
    ],
    MediumSeaGreen: [
      60,
      179,
      113
    ],
    medium_sea_green: [
      60,
      179,
      113
    ],
    ansi_051: [
      0,
      255,
      255
    ],
    MediumOrchid: [
      186,
      85,
      211
    ],
    DarkSlateBlue: [
      72,
      61,
      139
    ],
    ansi_cyan: [
      0,
      128,
      128
    ],
    ansi_084: [
      95,
      255,
      135
    ],
    ansi_154: [
      175,
      255,
      0
    ],
    medium_aquamarine: [
      102,
      205,
      170
    ],
    ansiLightRed: [
      255,
      0,
      0
    ],
    ansi_192: [
      215,
      255,
      135
    ],
    ansiLightBlack: [
      128,
      128,
      128
    ],
    LightYellow: [
      255,
      255,
      224
    ],
    ansiBlack: [
      0,
      0,
      0
    ],
    ansi_green: [
      0,
      128,
      0
    ],
    light_yellow: [
      255,
      255,
      224
    ],
    ansi_179: [
      215,
      175,
      95
    ],
    ansi_120: [
      135,
      255,
      135
    ],
    light_pink: [
      255,
      182,
      193
    ],
    light_sky_blue: [
      135,
      206,
      250
    ],
    ansi_252: [
      208,
      208,
      208
    ],
    light_grey: [
      211,
      211,
      211
    ],
    ansi_080: [
      95,
      215,
      215
    ],
    ansi_218: [
      255,
      175,
      215
    ],
    LawnGreen: [
      124,
      252,
      0
    ],
    ansi_209: [
      255,
      135,
      95
    ],
    LavenderBlush: [
      255,
      240,
      245
    ],
    ivory: [
      255,
      255,
      240
    ],
    ansiLightWhite: [
      255,
      255,
      255
    ],
    ansi_049: [
      0,
      255,
      175
    ],
    ansi_229: [
      255,
      255,
      175
    ],
    ansi_206: [
      255,
      95,
      215
    ],
    dim_grey: [
      105,
      105,
      105
    ],
    ansi_026: [
      0,
      95,
      215
    ],
    ansi_light_blue: [
      0,
      0,
      255
    ],
    ansi_110: [
      135,
      175,
      215
    ],
    blue_violet: [
      138,
      43,
      226
    ],
    ansiMagenta: [
      128,
      0,
      128
    ],
    brown: [
      165,
      42,
      42
    ],
    ansi_114: [
      135,
      215,
      135
    ],
    dark_turquoise: [
      0,
      206,
      209
    ],
    ansi_155: [
      175,
      255,
      95
    ],
    dark_salmon: [
      233,
      150,
      122
    ],
    ansi_165: [
      215,
      0,
      255
    ],
    ansi_006: [
      0,
      128,
      128
    ],
    chartreuse: [
      127,
      255,
      0
    ],
    orange_red: [
      255,
      69,
      0
    ],
    SlateGray: [
      112,
      128,
      144
    ],
    ansi_118: [
      135,
      255,
      0
    ],
    peach_puff: [
      255,
      218,
      185
    ],
    ansi_076: [
      95,
      215,
      0
    ],
    dodger_blue: [
      30,
      144,
      255
    ],
    ansi_105: [
      135,
      135,
      255
    ],
    dim_gray: [
      105,
      105,
      105
    ],
    MidnightBlue: [
      25,
      25,
      112
    ],
    aquamarine: [
      127,
      255,
      212
    ],
    ansi_113: [
      135,
      215,
      95
    ],
    ansi_254: [
      228,
      228,
      228
    ],
    ansi_247: [
      158,
      158,
      158
    ],
    ansi_130: [
      175,
      95,
      0
    ],
    ansi_226: [
      255,
      255,
      0
    ],
    ansi_092: [
      135,
      0,
      215
    ],
    ansi_072: [
      95,
      175,
      135
    ],
    ansi_043: [
      0,
      215,
      175
    ],
    ansi_004: [
      0,
      0,
      128
    ],
    ansi_082: [
      95,
      255,
      0
    ],
    ansi_181: [
      215,
      175,
      175
    ]
  };
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function uint8ToBase64(bytes) {
    let out = "";
    let i3 = 0;
    for (; i3 + 2 < bytes.length; i3 += 3) {
      const n5 = bytes[i3] << 16 | bytes[i3 + 1] << 8 | bytes[i3 + 2];
      out += B64[n5 >>> 18 & 63] + B64[n5 >>> 12 & 63] + B64[n5 >>> 6 & 63] + B64[n5 & 63];
    }
    const rem = bytes.length - i3;
    if (rem === 1) {
      const n5 = bytes[i3] << 16;
      out += B64[n5 >>> 18 & 63] + B64[n5 >>> 12 & 63] + "==";
    } else if (rem === 2) {
      const n5 = bytes[i3] << 16 | bytes[i3 + 1] << 8;
      out += B64[n5 >>> 18 & 63] + B64[n5 >>> 12 & 63] + B64[n5 >>> 6 & 63] + "=";
    }
    return out;
  }
  var roomExits = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
    "up",
    "down",
    "in",
    "out"
  ];
  var penStyles = {
    1: "solid line",
    2: "dash line",
    3: "dot line",
    4: "dash dot line",
    5: "dash dot dot line"
  };
  function convertRoom$2(roomId, room2, hash) {
    const exits = {};
    for (const key of roomExits) {
      const dest = room2[key];
      if (dest !== -1) exits[key] = dest;
    }
    const customLines = {};
    for (const key in room2.customLines) if (Object.hasOwn(room2.customLines, key)) {
      const color = room2.customLinesColor[key];
      customLines[key] = {
        points: room2.customLines[key].map(([x2, y3]) => ({
          x: x2,
          y: y3
        })),
        attributes: {
          color: {
            r: color.r,
            g: color.g,
            b: color.b
          },
          style: penStyles[room2.customLinesStyle[key]],
          arrow: room2.customLinesArrow[key]
        }
      };
    }
    const { north: _n, northeast: _ne, east: _e2, southeast: _se, south: _s, southwest: _sw, west: _w, northwest: _nw, up: _u, down: _d, in: _in, out: _out, mSpecialExits, mSpecialExitLocks, customLines: _cl, customLinesArrow: _cla, customLinesColor: _clc, customLinesStyle: _cls, environment, symbol, hash: _h, ...rest } = room2;
    const result = {
      ...rest,
      id: roomId,
      exits,
      specialExits: mSpecialExits,
      mSpecialExitLocks: [...new Set((mSpecialExitLocks ?? []).map((command) => mSpecialExits[command]).filter((destination) => destination !== void 0))],
      customLines
    };
    if (environment) result.env = environment;
    if (symbol) result.roomChar = symbol;
    if (hash) result.hash = hash;
    return result;
  }
  function convertLabel$2(label) {
    const pixMap = uint8ToBase64(label.pixMap);
    const { spec: _fSpec, pad: _fPad, ...fgColor } = label.fgColor;
    const { spec: _bSpec, pad: _bPad, ...bgColor } = label.bgColor;
    const { pos, size, text, fgColor: _fg, bgColor: _bg, dummy1: _d1, dummy2: _d2, pixMap: _pm, ...rest } = label;
    return {
      ...rest,
      X: pos[0],
      Y: pos[1],
      Z: pos[2],
      Width: size[0],
      Height: size[1],
      Text: text,
      FgColor: fgColor,
      BgColor: bgColor,
      pixMap
    };
  }
  var mudletColorsTyped = mudlet_colors_default;
  function generateColors(map) {
    const customEnvColors = map.mCustomEnvColors;
    const colors = {};
    for (let i3 = 0; i3 <= 255; i3++) if (i3 !== 16) {
      const key = `ansi_${String(i3).padStart(3, "0")}`;
      let envId;
      if (i3 === 0 || i3 === 8) envId = i3 + 8;
      else envId = i3;
      colors[envId] = mudletColorsTyped[key];
    }
    for (const key in customEnvColors) if (Object.hasOwn(customEnvColors, key)) {
      const element = customEnvColors[key];
      colors[key] = [
        element.r,
        element.g,
        element.b
      ];
    }
    for (const key in map.envColors) if (Object.hasOwn(map.envColors, key)) {
      const element = map.envColors[key];
      if (colors[key]) colors[key] = mudletColorsTyped[`ansi_${String(element).padStart(3, "0")}`];
    }
    return Object.entries(colors).map(([key, value]) => ({
      envId: parseInt(key),
      colors: value
    }));
  }
  function readerExport$1(mapModel) {
    const map = mapModel;
    const mapData = [];
    const roomToHash = Object.entries(map.mpRoomDbHashToRoomId).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {});
    for (const key in map.areas) if (Object.hasOwn(map.areas, key)) {
      const areaId = key;
      const element = map.areas[areaId];
      const area = {
        areaName: map.areaNames[areaId],
        areaId: key,
        rooms: element.rooms.map((roomId) => convertRoom$2(roomId, map.rooms[roomId], roomToHash[roomId])),
        labels: map.labels[areaId] ? map.labels[areaId].map((label) => convertLabel$2(label)) : []
      };
      mapData.push(area);
    }
    return {
      mapData,
      colors: generateColors(map)
    };
  }
  var readMapFromBuffer = readMapFromBuffer$1;
  var streamRooms = streamRooms$1;
  var readerExport = readerExport$1;
  var convertRoom = convertRoom$2;
  var convertLabel = convertLabel$2;

  // node_modules/mudlet-map-renderer/dist/binary.mjs
  function s3(e3, t5, n5 = "") {
    let r5 = {};
    for (let t6 in e3.customLines) {
      let n6 = e3.customLines[t6];
      r5[t6] = {
        points: n6.points,
        attributes: {
          color: {
            alpha: 255,
            r: n6.attributes.color.r,
            g: n6.attributes.color.g,
            b: n6.attributes.color.b
          },
          style: n6.attributes.style,
          arrow: n6.attributes.arrow
        }
      };
    }
    return {
      id: e3.id,
      area: e3.area,
      x: e3.x,
      y: e3.y,
      z: e3.z,
      areaId: t5,
      weight: e3.weight,
      roomChar: e3.roomChar ?? "",
      name: e3.name,
      userData: e3.userData,
      customLines: r5,
      stubs: e3.stubs,
      hash: e3.hash ?? n5,
      env: e3.env ?? 0,
      exits: e3.exits,
      doors: e3.doors,
      specialExits: e3.specialExits,
      exitLocks: e3.exitLocks,
      exitWeights: e3.exitWeights,
      mSpecialExitLocks: e3.mSpecialExitLocks
    };
  }
  function c3(e3, t5) {
    return {
      labelId: e3.labelId ?? e3.id,
      areaId: e3.areaId ?? t5,
      pixMap: e3.pixMap || void 0,
      X: e3.X,
      Y: e3.Y,
      Z: e3.Z,
      Width: e3.Width,
      Height: e3.Height,
      Text: e3.Text,
      FgColor: e3.FgColor,
      BgColor: e3.BgColor,
      noScaling: e3.noScaling,
      showOnTop: e3.showOnTop
    };
  }
  var l3 = (e3) => !!e3 && Object.keys(e3).length > 0;
  function u3(e3) {
    return !!e3.symbol || l3(e3.customLines) || l3(e3.mSpecialExits) || (e3.stubs?.length ?? 0) > 0 || l3(e3.doors) || (e3.exitLocks?.length ?? 0) > 0 || e3.weight !== 1 || l3(e3.exitWeights);
  }
  var f2 = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
    "up",
    "down",
    "in",
    "out"
  ];
  var p2 = class extends Error {
  };
  function m2(e3) {
    let t5;
    try {
      streamRooms(e3, () => {
        throw new p2();
      }, (e4) => {
        let n5 = 0;
        for (let t6 in e4.areas ?? {}) n5 += e4.areas[t6].rooms.length;
        throw t5 = {
          header: e4,
          total: n5
        }, new p2();
      });
    } catch (e4) {
      if (!(e4 instanceof p2)) throw e4;
    }
    if (!t5) throw Error("failed to decode map header");
    return t5;
  }
  function h2(e3) {
    let t5 = {};
    for (let n5 in e3.areas ?? {}) t5[n5] = e3.areas[n5].gridMode;
    return t5;
  }
  var g2 = (e3) => !!e3 && Object.keys(e3).length > 0;
  function _2(e3) {
    let { mapData: t5, colors: n5 } = readerExport(readMapFromBuffer(e3));
    return {
      kind: "plain",
      map: t5.map((e4) => ({
        areaName: e4.areaName,
        areaId: e4.areaId,
        rooms: e4.rooms.map((t6) => s3(t6, e4.areaId, t6.hash)),
        labels: e4.labels.map((t6) => c3(t6, parseInt(e4.areaId)))
      })),
      envs: n5
    };
  }
  function v2(e3, t5, i3, a3, l4 = u3) {
    let d2 = new Int32Array(i3), p3 = new Int32Array(i3), m3 = new Int32Array(i3), _3 = new Int32Array(i3), v3 = new Int32Array(i3), y3 = new Int32Array(i3), b3 = new Int32Array(i3 * 12).fill(-1), x2 = Array(i3), S2 = [], C2 = [], w2 = {};
    for (let e4 in t5.mpRoomDbHashToRoomId) w2[t5.mpRoomDbHashToRoomId[e4]] = e4;
    let T2 = () => typeof performance < "u" ? performance.now() : Date.now(), E2 = T2(), D2 = 0;
    streamRooms(e3, (e4, t6) => {
      d2[D2] = t6.x, p3[D2] = t6.y, m3[D2] = t6.z, _3[D2] = t6.area, v3[D2] = t6.environment, y3[D2] = e4;
      let n5 = D2 * 12;
      for (let e5 = 0; e5 < 12; e5++) b3[n5 + e5] = t6[f2[e5]];
      if (x2[D2] = t6.name ?? "", g2(t6.userData) && S2.push({
        id: e4,
        data: t6.userData
      }), l4(t6)) {
        let n6 = convertRoom(e4, t6, w2[e4]);
        C2.push(s3(n6, String(t6.area), w2[e4]));
      }
      if (D2++, a3) {
        let e5 = T2();
        e5 - E2 >= 80 && (E2 = e5, a3(D2, i3));
      }
    }), a3?.(D2, i3);
    let O3 = {};
    for (let e4 in t5.mCustomEnvColors ?? {}) {
      let n5 = t5.mCustomEnvColors[e4];
      O3[e4] = {
        r: n5.r,
        g: n5.g,
        b: n5.b
      };
    }
    let k3 = [];
    for (let e4 in t5.labels ?? {}) {
      let r5 = Number(e4);
      for (let e5 of t5.labels[r5]) k3.push(c3(convertLabel(e5), r5));
    }
    return {
      kind: "skeleton",
      skeleton: {
        count: D2,
        x: d2,
        y: p3,
        z: m3,
        area: _3,
        env: v3,
        id: y3,
        exits: b3,
        areaNames: t5.areaNames ?? {},
        areaGridMode: h2(t5),
        customEnvColors: O3,
        names: x2,
        userData: S2,
        detailRooms: C2,
        labels: k3,
        hashToId: t5.mpRoomDbHashToRoomId ?? {}
      }
    };
  }
  function y2(e3, t5 = {}) {
    let { mode: n5 = "auto", threshold: r5 = 5e4, onProgress: i3, isDetailRoom: a3 } = t5, { header: o3, total: s4 } = m2(e3);
    return (n5 === "auto" ? s4 > r5 ? "streaming" : "plain" : n5) === "plain" ? _2(e3) : v2(e3, o3, s4, i3, a3);
  }
  function b2(n5) {
    return n5.kind === "plain" ? new r3(n5.map, n5.envs) : new c2(n5.skeleton);
  }

  // website/javascripts/review-map.ts
  var baselineElement = document.querySelector("#baseline-map");
  var candidateElement = document.querySelector("#candidate-map");
  var baselineStatus = document.querySelector("#baseline-map-status");
  var candidateStatus = document.querySelector("#candidate-map-status");
  var comparisonElement = document.querySelector("#map-comparison");
  var baseline;
  var candidate;
  var baselineRenderer;
  var candidateRenderer;
  var currentChanges = [];
  var differenceMode = false;
  var syncing = false;
  var blinkTimer;
  var wipeMode = false;
  function room(snapshot, roomId) {
    if (!snapshot || snapshot.loaded.kind !== "plain") return void 0;
    return snapshot.loaded.map.flatMap((area) => area.rooms).find((item) => item.id === roomId);
  }
  function allChangedRoomIds(changes) {
    const ids = /* @__PURE__ */ new Set();
    changes.forEach((change) => {
      if (typeof change.roomNumber === "number") ids.add(change.roomNumber);
      if (typeof change.destination === "number" && change.type.includes("exit")) ids.add(change.destination);
    });
    return ids;
  }
  function exitPairs(changes) {
    const pairs = /* @__PURE__ */ new Set();
    changes.forEach((change) => {
      if (typeof change.roomNumber !== "number" || typeof change.destination !== "number" || !change.type.includes("exit")) return;
      pairs.add([change.roomNumber, change.destination].sort((a3, b3) => a3 - b3).join(":"));
    });
    return pairs;
  }
  function snapshotUrl(timesSeen, ids) {
    const query = new URLSearchParams({ format: "binary", timesSeen: String(timesSeen) });
    ids.forEach((id) => query.append("include", id));
    return "map?" + query;
  }
  async function fetchSnapshot(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Map request failed (HTTP " + response.status + ")");
    const loaded = y2(new Uint8Array(await response.arrayBuffer()));
    return { loaded, reader: b2(loaded) };
  }
  function rendererFor(snapshot, element) {
    const settings = je2();
    settings.backgroundColor = "#081321";
    settings.gridEnabled = true;
    settings.areaName = false;
    settings.highlight.fillAlpha = 0.18;
    settings.highlight.strokeWidth = 0.11;
    return new li(snapshot.reader, settings, element);
  }
  function resizeRenderer(renderer, element) {
    if (!renderer) return;
    renderer.camera.setSize(element.clientWidth, element.clientHeight);
    renderer.refresh();
  }
  function draw(renderer, snapshot, roomId) {
    if (!renderer || !snapshot) return;
    const target = room(snapshot, roomId || 0) || (snapshot.loaded.kind === "plain" ? snapshot.loaded.map[0]?.rooms[0] : void 0);
    if (!target) return;
    renderer.drawArea(target.area, target.z);
    renderer.setPosition(target.id);
  }
  function applyLens(renderer, changes) {
    if (!renderer) return;
    if (!differenceMode) {
      renderer.setLens(v);
      return;
    }
    const ids = allChangedRoomIds(changes);
    const pairs = exitPairs(changes);
    renderer.setLens({
      isVisible: (item) => ids.has(item.id),
      getExitTreatment: (exit) => pairs.has([exit.a, exit.b].sort((a3, b3) => a3 - b3).join(":")) ? "full" : "hidden",
      getVersion: () => 1
    });
  }
  function highlight(renderer, own, other, changes, missingColor) {
    if (!renderer) return;
    renderer.clearHighlights();
    allChangedRoomIds(changes).forEach((id) => {
      const here = room(own, id);
      const there = room(other, id);
      if (!here) return;
      renderer.renderHighlight(id, !there ? missingColor : "#ffbe55");
    });
  }
  function sync(from, to) {
    from.on("zoom", ({ zoom }) => {
      if (syncing) return;
      syncing = true;
      to.zoomToCenter(zoom);
      syncing = false;
    });
    from.on("pan", (bounds) => {
      if (syncing) return;
      syncing = true;
      to.camera.panToMapPoint((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
      syncing = false;
    });
    from.on("roomclick", ({ roomId }) => focus(roomId));
    from.on("areaexitclick", ({ targetRoomId }) => focus(targetRoomId));
  }
  function announceRoom(roomId) {
    window.dispatchEvent(new CustomEvent("crowdmapreview:roomselect", { detail: { roomId } }));
  }
  function focus(roomId) {
    draw(baselineRenderer, baseline, roomId);
    draw(candidateRenderer, candidate, roomId);
    if (baselineRenderer && room(baseline, roomId)) baselineRenderer.centerOn(roomId, true);
    if (candidateRenderer && room(candidate, roomId)) candidateRenderer.centerOn(roomId, true);
    announceRoom(roomId);
  }
  async function show(ids, changes, roomId) {
    baselineStatus.textContent = "Loading\u2026";
    candidateStatus.textContent = "Loading\u2026";
    currentChanges = changes;
    window.clearInterval(blinkTimer);
    comparisonElement.classList.remove("blinking");
    try {
      const result = await Promise.all([
        fetchSnapshot(snapshotUrl(2147483647, [])),
        fetchSnapshot(snapshotUrl(0, ids))
      ]);
      baseline = result[0];
      candidate = result[1];
      baselineRenderer?.destroy();
      candidateRenderer?.destroy();
      baselineElement.replaceChildren();
      candidateElement.replaceChildren();
      baselineRenderer = rendererFor(baseline, baselineElement);
      candidateRenderer = rendererFor(candidate, candidateElement);
      sync(baselineRenderer, candidateRenderer);
      sync(candidateRenderer, baselineRenderer);
      applyLens(baselineRenderer, changes);
      applyLens(candidateRenderer, changes);
      highlight(baselineRenderer, baseline, candidate, changes, "#ff6f7d");
      highlight(candidateRenderer, candidate, baseline, changes, "#5ee1b2");
      draw(baselineRenderer, baseline, roomId);
      draw(candidateRenderer, candidate, roomId);
      baselineStatus.textContent = "Published map";
      candidateStatus.textContent = ids.length ? ids.length + " selected report" + (ids.length === 1 ? "" : "s") : "No reports selected";
      if (roomId) announceRoom(roomId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Map preview unavailable";
      baselineStatus.textContent = message;
      candidateStatus.textContent = message;
    }
  }
  function setDifferenceMode(enabled) {
    differenceMode = enabled;
    applyLens(baselineRenderer, currentChanges);
    applyLens(candidateRenderer, currentChanges);
  }
  function setWipe(value) {
    comparisonElement.style.setProperty("--wipe-position", String(value) + "%");
  }
  function setWipeMode(enabled) {
    wipeMode = enabled;
    if (!enabled && blinkTimer) {
      window.clearInterval(blinkTimer);
      blinkTimer = void 0;
      comparisonElement.classList.remove("blinking");
      candidateElement.parentElement?.classList.remove("blink-hidden");
    }
    comparisonElement.classList.toggle("wipe", enabled);
    window.requestAnimationFrame(() => {
      resizeRenderer(baselineRenderer, baselineElement);
      resizeRenderer(candidateRenderer, candidateElement);
    });
  }
  function toggleBlink() {
    if (!wipeMode) return false;
    if (blinkTimer) {
      window.clearInterval(blinkTimer);
      blinkTimer = void 0;
      comparisonElement.classList.remove("blinking");
      candidateElement.parentElement?.classList.remove("blink-hidden");
      return false;
    }
    blinkTimer = window.setInterval(() => candidateElement.parentElement?.classList.toggle("blink-hidden"), 650);
    comparisonElement.classList.add("blinking");
    return true;
  }
  function getRoomComparison(roomId) {
    return { baseline: room(baseline, roomId), candidate: room(candidate, roomId), changes: currentChanges.filter((item) => item.roomNumber === roomId || item.destination === roomId) };
  }
  window.CrowdmapReviewMap = { focus, getRoomComparison, setDifferenceMode, setWipe, setWipeMode, show, toggleBlink };
})();
