
const moduleLoader = () => {
	return e = {
			770: function(e, t, n) {
				"use strict";
				var r = this && this.__importDefault || function(e) {
					return e && e.__esModule ? e : {
						default: e
					}
				};
				Object.defineProperty(t, "__esModule", {
					value: !0
				}), t.setDefaultDebugCall = t.createOnigScanner = t.createOnigString = t.loadWASM = t.OnigScanner = t.OnigString = void 0;
				const i = r(n(418));
				let o = null,
					a = !1;
				class s {
					static _utf8ByteLength(e) {
						let t = 0;
						for (let n = 0, r = e.length; n < r; n++) {
							const i = e.charCodeAt(n);
							let o = i,
								a = !1;
							if (i >= 55296 && i <= 56319 && n + 1 < r) {
								const t = e.charCodeAt(n + 1);
								t >= 56320 && t <= 57343 && (o = 65536 + (i - 55296 << 10) | t - 56320, a = !0)
							}
							t += o <= 127 ? 1 : o <= 2047 ? 2 : o <= 65535 ? 3 : 4, a && n++
						}
						return t
					}
					constructor(e) {
						const t = e.length,
							n = s._utf8ByteLength(e),
							r = n !== t,
							i = r ? new Uint32Array(t + 1) : null;
						r && (i[t] = n);
						const o = r ? new Uint32Array(n + 1) : null;
						r && (o[n] = t);
						const a = new Uint8Array(n);
						let f = 0;
						for (let n = 0; n < t; n++) {
							const s = e.charCodeAt(n);
							let u = s,
								c = !1;
							if (s >= 55296 && s <= 56319 && n + 1 < t) {
								const t = e.charCodeAt(n + 1);
								t >= 56320 && t <= 57343 && (u = 65536 + (s - 55296 << 10) | t - 56320, c = !0)
							}
							r && (i[n] = f, c && (i[n + 1] = f), u <= 127 ? o[f + 0] = n : u <= 2047 ? (o[f + 0] = n, o[f + 1] = n) : u <= 65535 ? (o[f + 0] = n, o[f + 1] = n, o[f +
								2] = n) : (o[f + 0] = n, o[f + 1] = n, o[f + 2] = n, o[f + 3] = n)), u <= 127 ? a[f++] = u : u <= 2047 ? (a[f++] = 192 | (1984 & u) >>> 6, a[f++] =
								128 | (63 & u) >>> 0) : u <= 65535 ? (a[f++] = 224 | (61440 & u) >>> 12, a[f++] = 128 | (4032 & u) >>> 6, a[f++] = 128 | (63 & u) >>> 0) : (a[f++] =
								240 | (1835008 & u) >>> 18, a[f++] = 128 | (258048 & u) >>> 12, a[f++] = 128 | (4032 & u) >>> 6, a[f++] = 128 | (63 & u) >>> 0), c && n++
						}
						this.utf16Length = t, this.utf8Length = n, this.utf16Value = e, this.utf8Value = a, this.utf16OffsetToUtf8 = i, this.utf8OffsetToUtf16 = o
					}
					createString(e) {
						const t = e._omalloc(this.utf8Length);
						return e.HEAPU8.set(this.utf8Value, t), t
					}
				}
				class f {
					constructor(e) {
						if (this.id = ++f.LAST_ID, !o) throw new Error("Must invoke loadWASM first.");
						this._onigBinding = o, this.content = e;
						const t = new s(e);
						this.utf16Length = t.utf16Length, this.utf8Length = t.utf8Length, this.utf16OffsetToUtf8 = t.utf16OffsetToUtf8, this.utf8OffsetToUtf16 = t.utf8OffsetToUtf16,
							this.utf8Length < 1e4 && !f._sharedPtrInUse ? (f._sharedPtr || (f._sharedPtr = o._omalloc(1e4)), f._sharedPtrInUse = !0, o.HEAPU8.set(t.utf8Value, f
								._sharedPtr), this.ptr = f._sharedPtr) : this.ptr = t.createString(o)
					}
					convertUtf8OffsetToUtf16(e) {
						return this.utf8OffsetToUtf16 ? e < 0 ? 0 : e > this.utf8Length ? this.utf16Length : this.utf8OffsetToUtf16[e] : e
					}
					convertUtf16OffsetToUtf8(e) {
						return this.utf16OffsetToUtf8 ? e < 0 ? 0 : e > this.utf16Length ? this.utf8Length : this.utf16OffsetToUtf8[e] : e
					}
					dispose() {
						this.ptr === f._sharedPtr ? f._sharedPtrInUse = !1 : this._onigBinding._ofree(this.ptr)
					}
				}
				t.OnigString = f, f.LAST_ID = 0, f._sharedPtr = 0, f._sharedPtrInUse = !1;
				class u {
					constructor(e, t) {
						var n, r;
						if (!o) throw new Error("Must invoke loadWASM first.");
						const i = [],
							a = [];
						for (let t = 0, n = e.length; t < n; t++) {
							const n = new s(e[t]);
							i[t] = n.createString(o), a[t] = n.utf8Length
						}
						const f = o._omalloc(4 * e.length);
						o.HEAPU32.set(i, f / 4);
						const u = o._omalloc(4 * e.length);
						o.HEAPU32.set(a, u / 4), this._onigBinding = o, this._options = null !== (n = null == t ? void 0 : t.options) && void 0 !== n ? n : [10];
						const c = this.onigOptions(this._options),
							_ = this.onigSyntax(null !== (r = null == t ? void 0 : t.syntax) && void 0 !== r ? r : 0),
							d = o._createOnigScanner(f, u, e.length, c, _);
						this._ptr = d;
						for (let t = 0, n = e.length; t < n; t++) o._ofree(i[t]);
						o._ofree(u), o._ofree(f), 0 === d && function(e) {
							throw new Error(e.UTF8ToString(e._getLastOnigError()))
						}(o)
					}
					dispose() {
						this._onigBinding._freeOnigScanner(this._ptr)
					}
					findNextMatchSync(e, t, n) {
						let r = a,
							i = this._options;
						if (Array.isArray(n) ? (n.includes(25) && (r = !0), i = i.concat(n)) : "boolean" == typeof n && (r = n), "string" == typeof e) {
							e = new f(e);
							const n = this._findNextMatchSync(e, t, r, i);
							return e.dispose(), n
						}
						return this._findNextMatchSync(e, t, r, i)
					}
					_findNextMatchSync(e, t, n, r) {
						const i = this._onigBinding,
							o = this.onigOptions(r);
						let a;
						if (a = n ? i._findNextOnigScannerMatchDbg(this._ptr, e.id, e.ptr, e.utf8Length, e.convertUtf16OffsetToUtf8(t), o) : i._findNextOnigScannerMatch(this._ptr, e
								.id, e.ptr, e.utf8Length, e.convertUtf16OffsetToUtf8(t), o), 0 === a) return null;
						const s = i.HEAPU32;
						let f = a / 4;
						const u = s[f++],
							c = s[f++];
						let _ = [];
						for (let t = 0; t < c; t++) {
							const n = e.convertUtf8OffsetToUtf16(s[f++]),
								r = e.convertUtf8OffsetToUtf16(s[f++]);
							_[t] = {
								start: n,
								end: r,
								length: r - n
							}
						}
						return {
							index: u,
							captureIndices: _
						}
					}
					onigOptions(e) {
						return e.map((e => this.onigOption(e))).reduce(((e, t) => e | t), this._onigBinding.ONIG_OPTION_NONE)
					}
					onigSyntax(e) {
						switch (e) {
							case 0:
								return this._onigBinding.ONIG_SYNTAX_DEFAULT;
							case 1:
								return this._onigBinding.ONIG_SYNTAX_ASIS;
							case 2:
								return this._onigBinding.ONIG_SYNTAX_POSIX_BASIC;
							case 3:
								return this._onigBinding.ONIG_SYNTAX_POSIX_EXTENDED;
							case 4:
								return this._onigBinding.ONIG_SYNTAX_EMACS;
							case 5:
								return this._onigBinding.ONIG_SYNTAX_GREP;
							case 6:
								return this._onigBinding.ONIG_SYNTAX_GNU_REGEX;
							case 7:
								return this._onigBinding.ONIG_SYNTAX_JAVA;
							case 8:
								return this._onigBinding.ONIG_SYNTAX_PERL;
							case 9:
								return this._onigBinding.ONIG_SYNTAX_PERL_NG;
							case 10:
								return this._onigBinding.ONIG_SYNTAX_RUBY;
							case 11:
								return this._onigBinding.ONIG_SYNTAX_PYTHON;
							case 12:
								return this._onigBinding.ONIG_SYNTAX_ONIGURUMA
						}
					}
					onigOption(e) {
						switch (e) {
							case 1:
								return this._onigBinding.ONIG_OPTION_NONE;
							case 0:
							case 25:
								return this._onigBinding.ONIG_OPTION_DEFAULT;
							case 2:
								return this._onigBinding.ONIG_OPTION_IGNORECASE;
							case 3:
								return this._onigBinding.ONIG_OPTION_EXTEND;
							case 4:
								return this._onigBinding.ONIG_OPTION_MULTILINE;
							case 5:
								return this._onigBinding.ONIG_OPTION_SINGLELINE;
							case 6:
								return this._onigBinding.ONIG_OPTION_FIND_LONGEST;
							case 7:
								return this._onigBinding.ONIG_OPTION_FIND_NOT_EMPTY;
							case 8:
								return this._onigBinding.ONIG_OPTION_NEGATE_SINGLELINE;
							case 9:
								return this._onigBinding.ONIG_OPTION_DONT_CAPTURE_GROUP;
							case 10:
								return this._onigBinding.ONIG_OPTION_CAPTURE_GROUP;
							case 11:
								return this._onigBinding.ONIG_OPTION_NOTBOL;
							case 12:
								return this._onigBinding.ONIG_OPTION_NOTEOL;
							case 13:
								return this._onigBinding.ONIG_OPTION_CHECK_VALIDITY_OF_STRING;
							case 14:
								return this._onigBinding.ONIG_OPTION_IGNORECASE_IS_ASCII;
							case 15:
								return this._onigBinding.ONIG_OPTION_WORD_IS_ASCII;
							case 16:
								return this._onigBinding.ONIG_OPTION_DIGIT_IS_ASCII;
							case 17:
								return this._onigBinding.ONIG_OPTION_SPACE_IS_ASCII;
							case 18:
								return this._onigBinding.ONIG_OPTION_POSIX_IS_ASCII;
							case 19:
								return this._onigBinding.ONIG_OPTION_TEXT_SEGMENT_EXTENDED_GRAPHEME_CLUSTER;
							case 20:
								return this._onigBinding.ONIG_OPTION_TEXT_SEGMENT_WORD;
							case 21:
								return this._onigBinding.ONIG_OPTION_NOT_BEGIN_STRING;
							case 22:
								return this._onigBinding.ONIG_OPTION_NOT_END_STRING;
							case 23:
								return this._onigBinding.ONIG_OPTION_NOT_BEGIN_POSITION;
							case 24:
								return this._onigBinding.ONIG_OPTION_CALLBACK_EACH_MATCH
						}
					}
				}
				t.OnigScanner = u;
				let c = !1,
					_ = null;
				t.loadWASM = function(e) {
					if (c) return _;
					let t, n, r, a;
					if (c = !0, function(e) {
							return "function" == typeof e.instantiator
						}(e)) t = e.instantiator, n = e.print;
					else {
						let r;
						! function(e) {
							return void 0 !== e.data
						}(e) ? r = e: (r = e.data, n = e.print), t = function(e) {
							return "undefined" != typeof Response && e instanceof Response
						}(r) ? "function" == typeof WXWebAssembly.instantiateStreaming ? function(e) {
							return t => WXWebAssembly.instantiateStreaming(e, t)
						}(r) : function(e) {
							return async t => {
								const n = await e.arrayBuffer();
								return WXWebAssembly.instantiate(e.path, t)
							}
						}(r) : function(e) {
							return t => WXWebAssembly.instantiate(e.path, t)
						}(r)
					}
					return _ = new Promise(((e, t) => {
							r = e, a = t
						})),
						function(e, t, n, r) {
							(0, i.default)({
								print: t,
								instantiateWasm: (t, n) => {
									if ("undefined" == typeof performance) {
										const e = () => Date.now();
										t.env.emscripten_get_now = e, t.wasi_snapshot_preview1.emscripten_get_now = e
									}
									return e(t).then((e => n(e.instance)), r), {}
								}
							}).then((e => {
								o = e, n()
							}))
						}(t, n, r, a), _
				}, t.createOnigString = function(e) {
					return new f(e)
				}, t.createOnigScanner = function(e) {
					return new u(e)
				}, t.setDefaultDebugCall = function(e) {
					a = e
				}
			},
			418: e => {
				var t = ("undefined" != typeof document && document.currentScript && document.currentScript.src, function(e = {}) {
					var t, n, r = e;
					r.ready = new Promise(((e, r) => {
						t = e, n = r
					}));
					var i, o = Object.assign({}, r);
					"undefined" != typeof read && read, i = e => {
						if ("function" == typeof readbuffer) return new Uint8Array(readbuffer(e));
						let t = read(e, "binary");
						return "object" == typeof t || P(n), t;
						var n
					}, "undefined" == typeof clearTimeout && (globalThis.clearTimeout = e => {}), "undefined" == typeof setTimeout && (globalThis.setTimeout = e =>
						"function" == typeof e ? e() : P()), "undefined" != typeof scriptArgs && scriptArgs, "undefined" != typeof onig_print && ("undefined" ==
						typeof console && (console = {}), console.log = onig_print, console.warn = console.error = "undefined" != typeof printErr ? printErr : onig_print);
					var a, s, f = r.print || console.log.bind(console),
						u = r.printErr || console.error.bind(console);
					Object.assign(r, o), o = null, r.arguments && r.arguments, r.thisProgram && r.thisProgram, r.quit && r.quit, r.wasmBinary && (a = r.wasmBinary), r
						.noExitRuntime, "object" != typeof WXWebAssembly && P("no native wasm support detected");
					var c, _, d, g, l, h, p, O, v = !1;

					function m() {
						var e = s.buffer;
						r.HEAP8 = c = new Int8Array(e), r.HEAP16 = d = new Int16Array(e), r.HEAPU8 = _ = new Uint8Array(e), r.HEAPU16 = g = new Uint16Array(e), r.HEAP32 = l =
							new Int32Array(e), r.HEAPU32 = h = new Uint32Array(e), r.HEAPF32 = p = new Float32Array(e), r.HEAPF64 = O = new Float64Array(e)
					}
					var y = [],
						I = [],
						T = [];
					var N = 0,
						A = null,
						S = null;

					function P(e) {
						r.onAbort && r.onAbort(e), u(e = "Aborted(" + e + ")"), v = !0, e += ". Build with -sASSERTIONS for more info.";
						var t = new WXWebAssembly.RuntimeError(e);
						throw n(t), t
					}
					var E, w;

					function b(e) {
						return e.startsWith("data:application/octet-stream;base64,")
					}

					function C(e) {
						if (e == E && a) return new Uint8Array(a);
						if (i) return i(e);
						throw "both async and sync fetching of the wasm failed"
					}

					function U(e, t, n) {
						return function(e) {
							return Promise.resolve().then((() => C(e)))
						}(e).then((e => WXWebAssembly.instantiate(e, t))).then((e => e)).then(n, (e => {
							u(`failed to asynchronously prepare wasm: ${e}`), P(e)
						}))
					}
					b(E = "onig.wasm") || (w = E, E = r.locateFile ? r.locateFile(w, "") : "" + w);
					var G = e => {
							for (; e.length > 0;) e.shift()(r)
						},
						B = void 0,
						R = e => {
							for (var t = "", n = e; _[n];) t += B[_[n++]];
							return t
						},
						W = {},
						L = {},
						D = {},
						x = void 0,
						M = e => {
							throw new x(e)
						},
						F = void 0,
						X = (e, t, n) => {
							function r(t) {
								var r = n(t);
								r.length !== e.length && (e => {
									throw new F(e)
								})("Mismatched type converter count");
								for (var i = 0; i < e.length; ++i) k(e[i], r[i])
							}
							e.forEach((function(e) {
								D[e] = t
							}));
							var i = new Array(t.length),
								o = [],
								a = 0;
							t.forEach(((e, t) => {
								L.hasOwnProperty(e) ? i[t] = L[e] : (o.push(e), W.hasOwnProperty(e) || (W[e] = []), W[e].push((() => {
									i[t] = L[e], ++a === o.length && r(i)
								})))
							})), 0 === o.length && r(i)
						};

					function k(e, t, n = {}) {
						if (!("argPackAdvance" in t)) throw new TypeError("registerType registeredInstance requires argPackAdvance");
						return function(e, t, n = {}) {
							var r = t.name;
							if (e || M(`type "${r}" must have a positive integer typeid pointer`), L.hasOwnProperty(e)) {
								if (n.ignoreDuplicateRegistrations) return;
								M(`Cannot register type '${r}' twice`)
							}
							if (L[e] = t, delete D[e], W.hasOwnProperty(e)) {
								var i = W[e];
								delete W[e], i.forEach((e => e()))
							}
						}(e, t, n)
					}

					function H() {
						this.allocated = [void 0], this.freelist = []
					}
					var Y = new H,
						j = () => {
							for (var e = 0, t = Y.reserved; t < Y.allocated.length; ++t) void 0 !== Y.allocated[t] && ++e;
							return e
						},
						V = e => (e || M("Cannot use deleted val. handle = " + e), Y.get(e).value),
						$ = e => {
							switch (e) {
								case void 0:
									return 1;
								case null:
									return 2;
								case !0:
									return 3;
								case !1:
									return 4;
								default:
									return Y.allocate({
										refcount: 1,
										value: e
									})
							}
						};

					function z(e) {
						return this.fromWireType(l[e >> 2])
					}
					var q = (e, t) => {
							switch (t) {
								case 4:
									return function(e) {
										return this.fromWireType(p[e >> 2])
									};
								case 8:
									return function(e) {
										return this.fromWireType(O[e >> 3])
									};
								default:
									throw new TypeError(`invalid float width (${t}): ${e}`)
							}
						},
						K = (e, t, n) => {
							switch (t) {
								case 1:
									return n ? e => c[e >> 0] : e => _[e >> 0];
								case 2:
									return n ? e => d[e >> 1] : e => g[e >> 1];
								case 4:
									return n ? e => l[e >> 2] : e => h[e >> 2];
								default:
									throw new TypeError(`invalid integer width (${t}): ${e}`)
							}
						};

					function J(e) {
						return this.fromWireType(h[e >> 2])
					}
					var Q, Z = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0,
						ee = (e, t, n) => {
							for (var r = t + n, i = t; e[i] && !(i >= r);) ++i;
							if (i - t > 16 && e.buffer && Z) return Z.decode(e.subarray(t, i));
							for (var o = ""; t < i;) {
								var a = e[t++];
								if (128 & a) {
									var s = 63 & e[t++];
									if (192 != (224 & a)) {
										var f = 63 & e[t++];
										if ((a = 224 == (240 & a) ? (15 & a) << 12 | s << 6 | f : (7 & a) << 18 | s << 12 | f << 6 | 63 & e[t++]) < 65536) o += String.fromCharCode(
											a);
										else {
											var u = a - 65536;
											o += String.fromCharCode(55296 | u >> 10, 56320 | 1023 & u)
										}
									} else o += String.fromCharCode((31 & a) << 6 | s)
								} else o += String.fromCharCode(a)
							}
							return o
						},
						te = (e, t) => e ? ee(_, e, t) : "",
						ne = "undefined" != typeof TextDecoder ? new TextDecoder("utf-16le") : void 0,
						re = (e, t) => {
							for (var n = e, r = n >> 1, i = r + t / 2; !(r >= i) && g[r];) ++r;
							if ((n = r << 1) - e > 32 && ne) return ne.decode(_.subarray(e, n));
							for (var o = "", a = 0; !(a >= t / 2); ++a) {
								var s = d[e + 2 * a >> 1];
								if (0 == s) break;
								o += String.fromCharCode(s)
							}
							return o
						},
						ie = (e, t, n) => {
							if (void 0 === n && (n = 2147483647), n < 2) return 0;
							for (var r = t, i = (n -= 2) < 2 * e.length ? n / 2 : e.length, o = 0; o < i; ++o) {
								var a = e.charCodeAt(o);
								d[t >> 1] = a, t += 2
							}
							return d[t >> 1] = 0, t - r
						},
						oe = e => 2 * e.length,
						ae = (e, t) => {
							for (var n = 0, r = ""; !(n >= t / 4);) {
								var i = l[e + 4 * n >> 2];
								if (0 == i) break;
								if (++n, i >= 65536) {
									var o = i - 65536;
									r += String.fromCharCode(55296 | o >> 10, 56320 | 1023 & o)
								} else r += String.fromCharCode(i)
							}
							return r
						},
						se = (e, t, n) => {
							if (void 0 === n && (n = 2147483647), n < 4) return 0;
							for (var r = t, i = r + n - 4, o = 0; o < e.length; ++o) {
								var a = e.charCodeAt(o);
								if (a >= 55296 && a <= 57343 && (a = 65536 + ((1023 & a) << 10) | 1023 & e.charCodeAt(++o)), l[t >> 2] = a, (t += 4) + 4 > i) break
							}
							return l[t >> 2] = 0, t - r
						},
						fe = e => {
							for (var t = 0, n = 0; n < e.length; ++n) {
								var r = e.charCodeAt(n);
								r >= 55296 && r <= 57343 && ++n, t += 4
							}
							return t
						};
					Q = () => performance.now();
					var ue = e => {
							var t = (e - s.buffer.byteLength + 65535) / 65536;
							try {
								return s.grow(t), m(), 1
							} catch (e) {}
						},
						ce = [null, [],
							[]
						];
					(() => {
						for (var e = new Array(256), t = 0; t < 256; ++t) e[t] = String.fromCharCode(t);
						B = e
					})(), x = r.BindingError = class extends Error {
						constructor(e) {
							super(e), this.name = "BindingError"
						}
					}, F = r.InternalError = class extends Error {
						constructor(e) {
							super(e), this.name = "InternalError"
						}
					}, Object.assign(H.prototype, {
						get(e) {
							return this.allocated[e]
						},
						has(e) {
							return void 0 !== this.allocated[e]
						},
						allocate(e) {
							var t = this.freelist.pop() || this.allocated.length;
							return this.allocated[t] = e, t
						},
						free(e) {
							this.allocated[e] = void 0, this.freelist.push(e)
						}
					}), Y.allocated.push({
						value: void 0
					}, {
						value: null
					}, {
						value: !0
					}, {
						value: !1
					}), Y.reserved = Y.allocated.length, r.count_emval_handles = j;
					var _e, de = {
							_embind_register_bigint: (e, t, n, r, i) => {},
							_embind_register_bool: (e, t, n, r) => {
								k(e, {
									name: t = R(t),
									fromWireType: function(e) {
										return !!e
									},
									toWireType: function(e, t) {
										return t ? n : r
									},
									argPackAdvance: 8,
									readValueFromPointer: function(e) {
										return this.fromWireType(_[e])
									},
									destructorFunction: null
								})
							},
							_embind_register_constant: (e, t, n) => {
								e = R(e), X([], [t], (function(t) {
									return t = t[0], r[e] = t.fromWireType(n), []
								}))
							},
							_embind_register_emval: (e, t) => {
								k(e, {
									name: t = R(t),
									fromWireType: e => {
										var t = V(e);
										return (e => {
											e >= Y.reserved && 0 == --Y.get(e).refcount && Y.free(e)
										})(e), t
									},
									toWireType: (e, t) => $(t),
									argPackAdvance: 8,
									readValueFromPointer: z,
									destructorFunction: null
								})
							},
							_embind_register_float: (e, t, n) => {
								k(e, {
									name: t = R(t),
									fromWireType: e => e,
									toWireType: (e, t) => t,
									argPackAdvance: 8,
									readValueFromPointer: q(t, n),
									destructorFunction: null
								})
							},
							_embind_register_integer: (e, t, n, r, i) => {
								t = R(t), -1 === i && (i = 4294967295);
								var o = e => e;
								if (0 === r) {
									var a = 32 - 8 * n;
									o = e => e << a >>> a
								}
								var s = t.includes("unsigned");
								k(e, {
									name: t,
									fromWireType: o,
									toWireType: s ? function(e, t) {
										return this.name, t >>> 0
									} : function(e, t) {
										return this.name, t
									},
									argPackAdvance: 8,
									readValueFromPointer: K(t, n, 0 !== r),
									destructorFunction: null
								})
							},
							_embind_register_memory_view: (e, t, n) => {
								var r = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][t];

								function i(e) {
									var t = h[e >> 2],
										n = h[e + 4 >> 2];
									return new r(c.buffer, n, t)
								}
								k(e, {
									name: n = R(n),
									fromWireType: i,
									argPackAdvance: 8,
									readValueFromPointer: i
								}, {
									ignoreDuplicateRegistrations: !0
								})
							},
							_embind_register_std_string: (e, t) => {
								var n = "std::string" === (t = R(t));
								k(e, {
									name: t,
									fromWireType: e => {
										var t, r = h[e >> 2],
											i = e + 4;
										if (n)
											for (var o = i, a = 0; a <= r; ++a) {
												var s = i + a;
												if (a == r || 0 == _[s]) {
													var f = te(o, s - o);
													void 0 === t ? t = f : (t += String.fromCharCode(0), t += f), o = s + 1
												}
											} else {
												var u = new Array(r);
												for (a = 0; a < r; ++a) u[a] = String.fromCharCode(_[i + a]);
												t = u.join("")
											}
										return he(e), t
									},
									toWireType: (e, t) => {
										var r;
										t instanceof ArrayBuffer && (t = new Uint8Array(t));
										var i = "string" == typeof t;
										i || t instanceof Uint8Array || t instanceof Uint8ClampedArray || t instanceof Int8Array || M(
											"Cannot pass non-string to std::string"), r = n && i ? (e => {
											for (var t = 0, n = 0; n < e.length; ++n) {
												var r = e.charCodeAt(n);
												r <= 127 ? t++ : r <= 2047 ? t += 2 : r >= 55296 && r <= 57343 ? (t += 4, ++n) : t += 3
											}
											return t
										})(t) : t.length;
										var o = le(4 + r + 1),
											a = o + 4;
										if (h[o >> 2] = r, n && i)((e, t, n, r) => {
											if (!(r > 0)) return 0;
											for (var i = n, o = n + r - 1, a = 0; a < e.length; ++a) {
												var s = e.charCodeAt(a);
												if (s >= 55296 && s <= 57343 && (s = 65536 + ((1023 & s) << 10) | 1023 & e.charCodeAt(++a)), s <= 127) {
													if (n >= o) break;
													t[n++] = s
												} else if (s <= 2047) {
													if (n + 1 >= o) break;
													t[n++] = 192 | s >> 6, t[n++] = 128 | 63 & s
												} else if (s <= 65535) {
													if (n + 2 >= o) break;
													t[n++] = 224 | s >> 12, t[n++] = 128 | s >> 6 & 63, t[n++] = 128 | 63 & s
												} else {
													if (n + 3 >= o) break;
													t[n++] = 240 | s >> 18, t[n++] = 128 | s >> 12 & 63, t[n++] = 128 | s >> 6 & 63, t[n++] = 128 | 63 & s
												}
											}
											t[n] = 0
										})(t, _, a, r + 1);
										else if (i)
											for (var s = 0; s < r; ++s) {
												var f = t.charCodeAt(s);
												f > 255 && (he(a), M("String has UTF-16 code units that do not fit in 8 bits")), _[a + s] = f
											} else
												for (s = 0; s < r; ++s) _[a + s] = t[s];
										return null !== e && e.push(he, o), o
									},
									argPackAdvance: 8,
									readValueFromPointer: J,
									destructorFunction: e => he(e)
								})
							},
							_embind_register_std_wstring: (e, t, n) => {
								var r, i, o, a, s;
								n = R(n), 2 === t ? (r = re, i = ie, a = oe, o = () => g, s = 1) : 4 === t && (r = ae, i = se, a = fe, o = () => h, s = 2), k(e, {
									name: n,
									fromWireType: e => {
										for (var n, i = h[e >> 2], a = o(), f = e + 4, u = 0; u <= i; ++u) {
											var c = e + 4 + u * t;
											if (u == i || 0 == a[c >> s]) {
												var _ = r(f, c - f);
												void 0 === n ? n = _ : (n += String.fromCharCode(0), n += _), f = c + t
											}
										}
										return he(e), n
									},
									toWireType: (e, r) => {
										"string" != typeof r && M(`Cannot pass non-string to C++ string type ${n}`);
										var o = a(r),
											f = le(4 + o + t);
										return h[f >> 2] = o >> s, i(r, f + 4, o + t), null !== e && e.push(he, f), f
									},
									argPackAdvance: 8,
									readValueFromPointer: z,
									destructorFunction: e => he(e)
								})
							},
							_embind_register_void: (e, t) => {
								k(e, {
									isVoid: !0,
									name: t = R(t),
									argPackAdvance: 0,
									fromWireType: () => {},
									toWireType: (e, t) => {}
								})
							},
							emscripten_get_now: Q,
							emscripten_memcpy_big: (e, t, n) => _.copyWithin(e, t, t + n),
							emscripten_resize_heap: e => {
								var t = _.length,
									n = 2147483648;
								if ((e >>>= 0) > n) return !1;
								for (var r, i = 1; i <= 4; i *= 2) {
									var o = t * (1 + .2 / i);
									o = Math.min(o, e + 100663296);
									var a = Math.min(n, (r = Math.max(e, o)) + (65536 - r % 65536) % 65536);
									if (ue(a)) return !0
								}
								return !1
							},
							fd_write: (e, t, n, r) => {
								for (var i = 0, o = 0; o < n; o++) {
									var a = h[t >> 2],
										s = h[t + 4 >> 2];
									t += 8;
									for (var c = 0; c < s; c++) d = e, g = _[a + c], l = void 0, l = ce[d], 0 === g || 10 === g ? ((1 === d ? f : u)(ee(l, 0)), l.length = 0) :
										l.push(g);
									i += s
								}
								var d, g, l;
								return h[r >> 2] = i, 0
							}
						},
						ge = function() {
							var e, t, i, o, f = {
								env: de,
								wasi_snapshot_preview1: de
							};

							function c(e, t) {
								var n, i = e.exports;
								return s = (ge = i).memory, m(), ge.__indirect_function_table, n = ge.__wasm_call_ctors, I.unshift(n),
									function(e) {
										if (N--, r.monitorRunDependencies && r.monitorRunDependencies(N), 0 == N && (null !== A && (clearInterval(A), A = null), S)) {
											var t = S;
											S = null, t()
										}
									}(), i
							}
							if (N++, r.monitorRunDependencies && r.monitorRunDependencies(N), r.instantiateWasm) try {
								return r.instantiateWasm(f, c)
							} catch (e) {
								u(`Module.instantiateWasm callback failed with error: ${e}`), n(e)
							}
							return (e = a, t = E, i = f, o = function(e) {
								c(e.instance)
							}, e || "function" != typeof WXWebAssembly.instantiateStreaming || b(t) || "function" != typeof fetch ? U(t, i, o) : fetch(t, {
								credentials: "same-origin"
							}).then((e => WXWebAssembly.instantiateStreaming(e, i).then(o, (function(e) {
								return u(`wasm streaming compile failed: ${e}`), u("falling back to ArrayBuffer instantiation"), U(t, i, o)
							}))))).catch(n), {}
						}(),
						le = e => (le = ge.malloc)(e),
						he = e => (he = ge.free)(e);

					function pe() {
						function e() {
							_e || (_e = !0, r.calledRun = !0, v || (G(I), t(r), r.onRuntimeInitialized && r.onRuntimeInitialized(), function() {
								if (r.postRun)
									for ("function" == typeof r.postRun && (r.postRun = [r.postRun]); r.postRun.length;) e = r.postRun.shift(), T.unshift(e);
								var e;
								G(T)
							}()))
						}
						N > 0 || (function() {
							if (r.preRun)
								for ("function" == typeof r.preRun && (r.preRun = [r.preRun]); r.preRun.length;) e = r.preRun.shift(), y.unshift(e);
							var e;
							G(y)
						}(), N > 0 || (r.setStatus ? (r.setStatus("Running..."), setTimeout((function() {
							setTimeout((function() {
								r.setStatus("")
							}), 1), e()
						}), 1)) : e()))
					}
					if (r._omalloc = e => (r._omalloc = ge.omalloc)(e), r._ofree = e => (r._ofree = ge.ofree)(e), r._getLastOnigError = () => (r._getLastOnigError = ge
							.getLastOnigError)(), r._createOnigScanner = (e, t, n, i, o) => (r._createOnigScanner = ge.createOnigScanner)(e, t, n, i, o), r._freeOnigScanner = e =>
						(r._freeOnigScanner = ge.freeOnigScanner)(e), r._findNextOnigScannerMatch = (e, t, n, i, o, a) => (r._findNextOnigScannerMatch = ge
							.findNextOnigScannerMatch)(e, t, n, i, o, a), r._findNextOnigScannerMatchDbg = (e, t, n, i, o, a) => (r._findNextOnigScannerMatchDbg = ge
							.findNextOnigScannerMatchDbg)(e, t, n, i, o, a), r.__embind_initialize_bindings = () => (r.__embind_initialize_bindings = ge
							._embind_initialize_bindings)(), r.dynCall_jiji = (e, t, n, i, o) => (r.dynCall_jiji = ge.dynCall_jiji)(e, t, n, i, o), r.UTF8ToString = te, S =
						function e() {
							_e || pe(), _e || (S = e)
						}, r.preInit)
						for ("function" == typeof r.preInit && (r.preInit = [r.preInit]); r.preInit.length > 0;) r.preInit.pop()();
					return pe(), e.ready
				});
				e.exports = t
			}
		}, t = {},
		function n(r) {
			var i = t[r];
			if (void 0 !== i) return i.exports;
			var o = t[r] = {
				exports: {}
			};
			return e[r].call(o.exports, o, o.exports, n), o.exports
		}(770);
	var e, t
};
const modules = moduleLoader();
export default modules;
// ! function(e, t) {
// 	"object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.onig = t() : e
// 		.onig = t()
// }(this, ());