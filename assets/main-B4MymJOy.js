(function() {
    const t = document.createElement("link").relList;
    if (t && t.supports && t.supports("modulepreload")) return;
    for (const r of document.querySelectorAll('link[rel="modulepreload"]')) s(r);
    new MutationObserver(r => {
        for (const o of r)
            if (o.type === "childList")
                for (const i of o.addedNodes) i.tagName === "LINK" && i.rel === "modulepreload" && s(i)
    }).observe(document, {
        childList: !0,
        subtree: !0
    });

    function n(r) {
        const o = {};
        return r.integrity && (o.integrity = r.integrity), r.referrerPolicy && (o.referrerPolicy = r.referrerPolicy), r.crossOrigin === "use-credentials" ? o.credentials = "include" : r.crossOrigin === "anonymous" ? o.credentials = "omit" : o.credentials = "same-origin", o
    }

    function s(r) {
        if (r.ep) return;
        r.ep = !0;
        const o = n(r);
        fetch(r.href, o)
    }
})();
/**
 * @vue/shared v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
function xs(e) {
    const t = Object.create(null);
    for (const n of e.split(",")) t[n] = 1;
    return n => n in t
}
const X = {},
    It = [],
    Ve = () => {},
    Ur = () => !1,
    Dn = e => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
    ws = e => e.startsWith("onUpdate:"),
    le = Object.assign,
    Ss = (e, t) => {
        const n = e.indexOf(t);
        n > -1 && e.splice(n, 1)
    },
    pi = Object.prototype.hasOwnProperty,
    J = (e, t) => pi.call(e, t),
    V = Array.isArray,
    Pt = e => an(e) === "[object Map]",
    Gr = e => an(e) === "[object Set]",
    zs = e => an(e) === "[object Date]",
    U = e => typeof e == "function",
    re = e => typeof e == "string",
    Ue = e => typeof e == "symbol",
    Y = e => e !== null && typeof e == "object",
    qr = e => (Y(e) || U(e)) && U(e.then) && U(e.catch),
    Kr = Object.prototype.toString,
    an = e => Kr.call(e),
    hi = e => an(e).slice(8, -1),
    $r = e => an(e) === "[object Object]",
    Rs = e => re(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e,
    Jt = xs(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),
    Bn = e => {
        const t = Object.create(null);
        return n => t[n] || (t[n] = e(n))
    },
    gi = /-\w/g,
    Se = Bn(e => e.replace(gi, t => t.slice(1).toUpperCase())),
    mi = /\B([A-Z])/g,
    Et = Bn(e => e.replace(mi, "-$1").toLowerCase()),
    Ln = Bn(e => e.charAt(0).toUpperCase() + e.slice(1)),
    Jn = Bn(e => e ? `on${Ln(e)}` : ""),
    ft = (e, t) => !Object.is(e, t),
    zn = (e, ...t) => {
        for (let n = 0; n < e.length; n++) e[n](...t)
    },
    kr = (e, t, n, s = !1) => {
        Object.defineProperty(e, t, {
            configurable: !0,
            enumerable: !1,
            writable: s,
            value: n
        })
    },
    _i = e => {
        const t = parseFloat(e);
        return isNaN(t) ? e : t
    };
let Qs;
const Fn = () => Qs || (Qs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});

function jn(e) {
    if (V(e)) {
        const t = {};
        for (let n = 0; n < e.length; n++) {
            const s = e[n],
                r = re(s) ? Ei(s) : jn(s);
            if (r)
                for (const o in r) t[o] = r[o]
        }
        return t
    } else if (re(e) || Y(e)) return e
}
const vi = /;(?![^(]*\))/g,
    yi = /:([^]+)/,
    bi = /\/\*[^]*?\*\//g;

function Ei(e) {
    const t = {};
    return e.replace(bi, "").split(vi).forEach(n => {
        if (n) {
            const s = n.split(yi);
            s.length > 1 && (t[s[0].trim()] = s[1].trim())
        }
    }), t
}

function Cs(e) {
    let t = "";
    if (re(e)) t = e;
    else if (V(e))
        for (let n = 0; n < e.length; n++) {
            const s = Cs(e[n]);
            s && (t += s + " ")
        } else if (Y(e))
            for (const n in e) e[n] && (t += n + " ");
    return t.trim()
}
const Ai = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",
    xi = xs(Ai);

function Wr(e) {
    return !!e || e === ""
}

function wi(e, t) {
    if (e.length !== t.length) return !1;
    let n = !0;
    for (let s = 0; n && s < e.length; s++) n = Os(e[s], t[s]);
    return n
}

function Os(e, t) {
    if (e === t) return !0;
    let n = zs(e),
        s = zs(t);
    if (n || s) return n && s ? e.getTime() === t.getTime() : !1;
    if (n = Ue(e), s = Ue(t), n || s) return e === t;
    if (n = V(e), s = V(t), n || s) return n && s ? wi(e, t) : !1;
    if (n = Y(e), s = Y(t), n || s) {
        if (!n || !s) return !1;
        const r = Object.keys(e).length,
            o = Object.keys(t).length;
        if (r !== o) return !1;
        for (const i in e) {
            const l = e.hasOwnProperty(i),
                c = t.hasOwnProperty(i);
            if (l && !c || !l && c || !Os(e[i], t[i])) return !1
        }
    }
    return String(e) === String(t)
}
const Jr = e => !!(e && e.__v_isRef === !0),
    $t = e => re(e) ? e : e == null ? "" : V(e) || Y(e) && (e.toString === Kr || !U(e.toString)) ? Jr(e) ? $t(e.value) : JSON.stringify(e, zr, 2) : String(e),
    zr = (e, t) => Jr(t) ? zr(e, t.value) : Pt(t) ? {
        [`Map(${t.size})`]: [...t.entries()].reduce((n, [s, r], o) => (n[Qn(s, o) + " =>"] = r, n), {})
    } : Gr(t) ? {
        [`Set(${t.size})`]: [...t.values()].map(n => Qn(n))
    } : Ue(t) ? Qn(t) : Y(t) && !V(t) && !$r(t) ? String(t) : t,
    Qn = (e, t = "") => {
        var n;
        return Ue(e) ? `Symbol(${(n=e.description)!=null?n:t})` : e
    };
/**
 * @vue/reactivity v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
let ve;
class Si {
    constructor(t = !1) {
        this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.__v_skip = !0, this.parent = ve, !t && ve && (this.index = (ve.scopes || (ve.scopes = [])).push(this) - 1)
    }
    get active() {
        return this._active
    }
    pause() {
        if (this._active) {
            this._isPaused = !0;
            let t, n;
            if (this.scopes)
                for (t = 0, n = this.scopes.length; t < n; t++) this.scopes[t].pause();
            for (t = 0, n = this.effects.length; t < n; t++) this.effects[t].pause()
        }
    }
    resume() {
        if (this._active && this._isPaused) {
            this._isPaused = !1;
            let t, n;
            if (this.scopes)
                for (t = 0, n = this.scopes.length; t < n; t++) this.scopes[t].resume();
            for (t = 0, n = this.effects.length; t < n; t++) this.effects[t].resume()
        }
    }
    run(t) {
        if (this._active) {
            const n = ve;
            try {
                return ve = this, t()
            } finally {
                ve = n
            }
        }
    }
    on() {
        ++this._on === 1 && (this.prevScope = ve, ve = this)
    }
    off() {
        this._on > 0 && --this._on === 0 && (ve = this.prevScope, this.prevScope = void 0)
    }
    stop(t) {
        if (this._active) {
            this._active = !1;
            let n, s;
            for (n = 0, s = this.effects.length; n < s; n++) this.effects[n].stop();
            for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++) this.cleanups[n]();
            if (this.cleanups.length = 0, this.scopes) {
                for (n = 0, s = this.scopes.length; n < s; n++) this.scopes[n].stop(!0);
                this.scopes.length = 0
            }
            if (!this.detached && this.parent && !t) {
                const r = this.parent.scopes.pop();
                r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index)
            }
            this.parent = void 0
        }
    }
}

function Ri() {
    return ve
}
let ee;
const Yn = new WeakSet;
class Qr {
    constructor(t) {
        this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ve && ve.active && ve.effects.push(this)
    }
    pause() {
        this.flags |= 64
    }
    resume() {
        this.flags & 64 && (this.flags &= -65, Yn.has(this) && (Yn.delete(this), this.trigger()))
    }
    notify() {
        this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Xr(this)
    }
    run() {
        if (!(this.flags & 1)) return this.fn();
        this.flags |= 2, Ys(this), Zr(this);
        const t = ee,
            n = Re;
        ee = this, Re = !0;
        try {
            return this.fn()
        } finally {
            eo(this), ee = t, Re = n, this.flags &= -3
        }
    }
    stop() {
        if (this.flags & 1) {
            for (let t = this.deps; t; t = t.nextDep) Ps(t);
            this.deps = this.depsTail = void 0, Ys(this), this.onStop && this.onStop(), this.flags &= -2
        }
    }
    trigger() {
        this.flags & 64 ? Yn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty()
    }
    runIfDirty() {
        cs(this) && this.run()
    }
    get dirty() {
        return cs(this)
    }
}
let Yr = 0,
    zt, Qt;

function Xr(e, t = !1) {
    if (e.flags |= 8, t) {
        e.next = Qt, Qt = e;
        return
    }
    e.next = zt, zt = e
}

function Ts() {
    Yr++
}

function Is() {
    if (--Yr > 0) return;
    if (Qt) {
        let t = Qt;
        for (Qt = void 0; t;) {
            const n = t.next;
            t.next = void 0, t.flags &= -9, t = n
        }
    }
    let e;
    for (; zt;) {
        let t = zt;
        for (zt = void 0; t;) {
            const n = t.next;
            if (t.next = void 0, t.flags &= -9, t.flags & 1) try {
                t.trigger()
            } catch (s) {
                e || (e = s)
            }
            t = n
        }
    }
    if (e) throw e
}

function Zr(e) {
    for (let t = e.deps; t; t = t.nextDep) t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t
}

function eo(e) {
    let t, n = e.depsTail,
        s = n;
    for (; s;) {
        const r = s.prevDep;
        s.version === -1 ? (s === n && (n = r), Ps(s), Ci(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = r
    }
    e.deps = t, e.depsTail = n
}

function cs(e) {
    for (let t = e.deps; t; t = t.nextDep)
        if (t.dep.version !== t.version || t.dep.computed && (to(t.dep.computed) || t.dep.version !== t.version)) return !0;
    return !!e._dirty
}

function to(e) {
    if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === nn) || (e.globalVersion = nn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !cs(e)))) return;
    e.flags |= 2;
    const t = e.dep,
        n = ee,
        s = Re;
    ee = e, Re = !0;
    try {
        Zr(e);
        const r = e.fn(e._value);
        (t.version === 0 || ft(r, e._value)) && (e.flags |= 128, e._value = r, t.version++)
    } catch (r) {
        throw t.version++, r
    } finally {
        ee = n, Re = s, eo(e), e.flags &= -3
    }
}

function Ps(e, t = !1) {
    const {
        dep: n,
        prevSub: s,
        nextSub: r
    } = e;
    if (s && (s.nextSub = r, e.prevSub = void 0), r && (r.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
        n.computed.flags &= -5;
        for (let o = n.computed.deps; o; o = o.nextDep) Ps(o, !0)
    }!t && !--n.sc && n.map && n.map.delete(n.key)
}

function Ci(e) {
    const {
        prevDep: t,
        nextDep: n
    } = e;
    t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0)
}
let Re = !0;
const no = [];

function Xe() {
    no.push(Re), Re = !1
}

function Ze() {
    const e = no.pop();
    Re = e === void 0 ? !0 : e
}

function Ys(e) {
    const {
        cleanup: t
    } = e;
    if (e.cleanup = void 0, t) {
        const n = ee;
        ee = void 0;
        try {
            t()
        } finally {
            ee = n
        }
    }
}
let nn = 0;
class Oi {
    constructor(t, n) {
        this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0
    }
}
class Ns {
    constructor(t) {
        this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0
    }
    track(t) {
        if (!ee || !Re || ee === this.computed) return;
        let n = this.activeLink;
        if (n === void 0 || n.sub !== ee) n = this.activeLink = new Oi(ee, this), ee.deps ? (n.prevDep = ee.depsTail, ee.depsTail.nextDep = n, ee.depsTail = n) : ee.deps = ee.depsTail = n, so(n);
        else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
            const s = n.nextDep;
            s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = ee.depsTail, n.nextDep = void 0, ee.depsTail.nextDep = n, ee.depsTail = n, ee.deps === n && (ee.deps = s)
        }
        return n
    }
    trigger(t) {
        this.version++, nn++, this.notify(t)
    }
    notify(t) {
        Ts();
        try {
            for (let n = this.subs; n; n = n.prevSub) n.sub.notify() && n.sub.dep.notify()
        } finally {
            Is()
        }
    }
}

function so(e) {
    if (e.dep.sc++, e.sub.flags & 4) {
        const t = e.dep.computed;
        if (t && !e.dep.subs) {
            t.flags |= 20;
            for (let s = t.deps; s; s = s.nextDep) so(s)
        }
        const n = e.dep.subs;
        n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e
    }
}
const us = new WeakMap,
    bt = Symbol(""),
    as = Symbol(""),
    sn = Symbol("");

function ce(e, t, n) {
    if (Re && ee) {
        let s = us.get(e);
        s || us.set(e, s = new Map);
        let r = s.get(n);
        r || (s.set(n, r = new Ns), r.map = s, r.key = n), r.track()
    }
}

function ze(e, t, n, s, r, o) {
    const i = us.get(e);
    if (!i) {
        nn++;
        return
    }
    const l = c => {
        c && c.trigger()
    };
    if (Ts(), t === "clear") i.forEach(l);
    else {
        const c = V(e),
            d = c && Rs(n);
        if (c && n === "length") {
            const f = Number(s);
            i.forEach((p, m) => {
                (m === "length" || m === sn || !Ue(m) && m >= f) && l(p)
            })
        } else switch ((n !== void 0 || i.has(void 0)) && l(i.get(n)), d && l(i.get(sn)), t) {
            case "add":
                c ? d && l(i.get("length")) : (l(i.get(bt)), Pt(e) && l(i.get(as)));
                break;
            case "delete":
                c || (l(i.get(bt)), Pt(e) && l(i.get(as)));
                break;
            case "set":
                Pt(e) && l(i.get(bt));
                break
        }
    }
    Is()
}

function Rt(e) {
    const t = W(e);
    return t === e ? t : (ce(t, "iterate", sn), Ce(e) ? t : t.map(et))
}

function Ms(e) {
    return ce(e = W(e), "iterate", sn), e
}

function it(e, t) {
    return dt(e) ? rn(Nt(e) ? et(t) : t) : et(t)
}
const Ti = {
    __proto__: null,
    [Symbol.iterator]() {
        return Xn(this, Symbol.iterator, e => it(this, e))
    },
    concat(...e) {
        return Rt(this).concat(...e.map(t => V(t) ? Rt(t) : t))
    },
    entries() {
        return Xn(this, "entries", e => (e[1] = it(this, e[1]), e))
    },
    every(e, t) {
        return Ke(this, "every", e, t, void 0, arguments)
    },
    filter(e, t) {
        return Ke(this, "filter", e, t, n => n.map(s => it(this, s)), arguments)
    },
    find(e, t) {
        return Ke(this, "find", e, t, n => it(this, n), arguments)
    },
    findIndex(e, t) {
        return Ke(this, "findIndex", e, t, void 0, arguments)
    },
    findLast(e, t) {
        return Ke(this, "findLast", e, t, n => it(this, n), arguments)
    },
    findLastIndex(e, t) {
        return Ke(this, "findLastIndex", e, t, void 0, arguments)
    },
    forEach(e, t) {
        return Ke(this, "forEach", e, t, void 0, arguments)
    },
    includes(...e) {
        return Zn(this, "includes", e)
    },
    indexOf(...e) {
        return Zn(this, "indexOf", e)
    },
    join(e) {
        return Rt(this).join(e)
    },
    lastIndexOf(...e) {
        return Zn(this, "lastIndexOf", e)
    },
    map(e, t) {
        return Ke(this, "map", e, t, void 0, arguments)
    },
    pop() {
        return Ut(this, "pop")
    },
    push(...e) {
        return Ut(this, "push", e)
    },
    reduce(e, ...t) {
        return Xs(this, "reduce", e, t)
    },
    reduceRight(e, ...t) {
        return Xs(this, "reduceRight", e, t)
    },
    shift() {
        return Ut(this, "shift")
    },
    some(e, t) {
        return Ke(this, "some", e, t, void 0, arguments)
    },
    splice(...e) {
        return Ut(this, "splice", e)
    },
    toReversed() {
        return Rt(this).toReversed()
    },
    toSorted(e) {
        return Rt(this).toSorted(e)
    },
    toSpliced(...e) {
        return Rt(this).toSpliced(...e)
    },
    unshift(...e) {
        return Ut(this, "unshift", e)
    },
    values() {
        return Xn(this, "values", e => it(this, e))
    }
};

function Xn(e, t, n) {
    const s = Ms(e),
        r = s[t]();
    return s !== e && !Ce(e) && (r._next = r.next, r.next = () => {
        const o = r._next();
        return o.done || (o.value = n(o.value)), o
    }), r
}
const Ii = Array.prototype;

function Ke(e, t, n, s, r, o) {
    const i = Ms(e),
        l = i !== e && !Ce(e),
        c = i[t];
    if (c !== Ii[t]) {
        const p = c.apply(e, o);
        return l ? et(p) : p
    }
    let d = n;
    i !== e && (l ? d = function(p, m) {
        return n.call(this, it(e, p), m, e)
    } : n.length > 2 && (d = function(p, m) {
        return n.call(this, p, m, e)
    }));
    const f = c.call(i, d, s);
    return l && r ? r(f) : f
}

function Xs(e, t, n, s) {
    const r = Ms(e);
    let o = n;
    return r !== e && (Ce(e) ? n.length > 3 && (o = function(i, l, c) {
        return n.call(this, i, l, c, e)
    }) : o = function(i, l, c) {
        return n.call(this, i, it(e, l), c, e)
    }), r[t](o, ...s)
}

function Zn(e, t, n) {
    const s = W(e);
    ce(s, "iterate", sn);
    const r = s[t](...n);
    return (r === -1 || r === !1) && Ls(n[0]) ? (n[0] = W(n[0]), s[t](...n)) : r
}

function Ut(e, t, n = []) {
    Xe(), Ts();
    const s = W(e)[t].apply(e, n);
    return Is(), Ze(), s
}
const Pi = xs("__proto__,__v_isRef,__isVue"),
    ro = new Set(Object.getOwnPropertyNames(Symbol).filter(e => e !== "arguments" && e !== "caller").map(e => Symbol[e]).filter(Ue));

function Ni(e) {
    Ue(e) || (e = String(e));
    const t = W(this);
    return ce(t, "has", e), t.hasOwnProperty(e)
}
class oo {
    constructor(t = !1, n = !1) {
        this._isReadonly = t, this._isShallow = n
    }
    get(t, n, s) {
        if (n === "__v_skip") return t.__v_skip;
        const r = this._isReadonly,
            o = this._isShallow;
        if (n === "__v_isReactive") return !r;
        if (n === "__v_isReadonly") return r;
        if (n === "__v_isShallow") return o;
        if (n === "__v_raw") return s === (r ? o ? Gi : uo : o ? co : lo).get(t) || Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
        const i = V(t);
        if (!r) {
            let c;
            if (i && (c = Ti[n])) return c;
            if (n === "hasOwnProperty") return Ni
        }
        const l = Reflect.get(t, n, ae(t) ? t : s);
        if ((Ue(n) ? ro.has(n) : Pi(n)) || (r || ce(t, "get", n), o)) return l;
        if (ae(l)) {
            const c = i && Rs(n) ? l : l.value;
            return r && Y(c) ? ds(c) : c
        }
        return Y(l) ? r ? ds(l) : Hn(l) : l
    }
}
class io extends oo {
    constructor(t = !1) {
        super(!1, t)
    }
    set(t, n, s, r) {
        let o = t[n];
        const i = V(t) && Rs(n);
        if (!this._isShallow) {
            const d = dt(o);
            if (!Ce(s) && !dt(s) && (o = W(o), s = W(s)), !i && ae(o) && !ae(s)) return d || (o.value = s), !0
        }
        const l = i ? Number(n) < t.length : J(t, n),
            c = Reflect.set(t, n, s, ae(t) ? t : r);
        return t === W(r) && (l ? ft(s, o) && ze(t, "set", n, s) : ze(t, "add", n, s)), c
    }
    deleteProperty(t, n) {
        const s = J(t, n);
        t[n];
        const r = Reflect.deleteProperty(t, n);
        return r && s && ze(t, "delete", n, void 0), r
    }
    has(t, n) {
        const s = Reflect.has(t, n);
        return (!Ue(n) || !ro.has(n)) && ce(t, "has", n), s
    }
    ownKeys(t) {
        return ce(t, "iterate", V(t) ? "length" : bt), Reflect.ownKeys(t)
    }
}
class Mi extends oo {
    constructor(t = !1) {
        super(!0, t)
    }
    set(t, n) {
        return !0
    }
    deleteProperty(t, n) {
        return !0
    }
}
const Di = new io,
    Bi = new Mi,
    Li = new io(!0);
const fs = e => e,
    pn = e => Reflect.getPrototypeOf(e);

function Fi(e, t, n) {
    return function(...s) {
        const r = this.__v_raw,
            o = W(r),
            i = Pt(o),
            l = e === "entries" || e === Symbol.iterator && i,
            c = e === "keys" && i,
            d = r[e](...s),
            f = n ? fs : t ? rn : et;
        return !t && ce(o, "iterate", c ? as : bt), le(Object.create(d), {
            next() {
                const {
                    value: p,
                    done: m
                } = d.next();
                return m ? {
                    value: p,
                    done: m
                } : {
                    value: l ? [f(p[0]), f(p[1])] : f(p),
                    done: m
                }
            }
        })
    }
}

function hn(e) {
    return function(...t) {
        return e === "delete" ? !1 : e === "clear" ? void 0 : this
    }
}

function ji(e, t) {
    const n = {
        get(r) {
            const o = this.__v_raw,
                i = W(o),
                l = W(r);
            e || (ft(r, l) && ce(i, "get", r), ce(i, "get", l));
            const {
                has: c
            } = pn(i), d = t ? fs : e ? rn : et;
            if (c.call(i, r)) return d(o.get(r));
            if (c.call(i, l)) return d(o.get(l));
            o !== i && o.get(r)
        },
        get size() {
            const r = this.__v_raw;
            return !e && ce(W(r), "iterate", bt), r.size
        },
        has(r) {
            const o = this.__v_raw,
                i = W(o),
                l = W(r);
            return e || (ft(r, l) && ce(i, "has", r), ce(i, "has", l)), r === l ? o.has(r) : o.has(r) || o.has(l)
        },
        forEach(r, o) {
            const i = this,
                l = i.__v_raw,
                c = W(l),
                d = t ? fs : e ? rn : et;
            return !e && ce(c, "iterate", bt), l.forEach((f, p) => r.call(o, d(f), d(p), i))
        }
    };
    return le(n, e ? {
        add: hn("add"),
        set: hn("set"),
        delete: hn("delete"),
        clear: hn("clear")
    } : {
        add(r) {
            !t && !Ce(r) && !dt(r) && (r = W(r));
            const o = W(this);
            return pn(o).has.call(o, r) || (o.add(r), ze(o, "add", r, r)), this
        },
        set(r, o) {
            !t && !Ce(o) && !dt(o) && (o = W(o));
            const i = W(this),
                {
                    has: l,
                    get: c
                } = pn(i);
            let d = l.call(i, r);
            d || (r = W(r), d = l.call(i, r));
            const f = c.call(i, r);
            return i.set(r, o), d ? ft(o, f) && ze(i, "set", r, o) : ze(i, "add", r, o), this
        },
        delete(r) {
            const o = W(this),
                {
                    has: i,
                    get: l
                } = pn(o);
            let c = i.call(o, r);
            c || (r = W(r), c = i.call(o, r)), l && l.call(o, r);
            const d = o.delete(r);
            return c && ze(o, "delete", r, void 0), d
        },
        clear() {
            const r = W(this),
                o = r.size !== 0,
                i = r.clear();
            return o && ze(r, "clear", void 0, void 0), i
        }
    }), ["keys", "values", "entries", Symbol.iterator].forEach(r => {
        n[r] = Fi(r, e, t)
    }), n
}

function Ds(e, t) {
    const n = ji(e, t);
    return (s, r, o) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? s : Reflect.get(J(n, r) && r in s ? n : s, r, o)
}
const Hi = {
        get: Ds(!1, !1)
    },
    Vi = {
        get: Ds(!1, !0)
    },
    Ui = {
        get: Ds(!0, !1)
    };
const lo = new WeakMap,
    co = new WeakMap,
    uo = new WeakMap,
    Gi = new WeakMap;

function qi(e) {
    switch (e) {
        case "Object":
        case "Array":
            return 1;
        case "Map":
        case "Set":
        case "WeakMap":
        case "WeakSet":
            return 2;
        default:
            return 0
    }
}

function Ki(e) {
    return e.__v_skip || !Object.isExtensible(e) ? 0 : qi(hi(e))
}

function Hn(e) {
    return dt(e) ? e : Bs(e, !1, Di, Hi, lo)
}

function ao(e) {
    return Bs(e, !1, Li, Vi, co)
}

function ds(e) {
    return Bs(e, !0, Bi, Ui, uo)
}

function Bs(e, t, n, s, r) {
    if (!Y(e) || e.__v_raw && !(t && e.__v_isReactive)) return e;
    const o = Ki(e);
    if (o === 0) return e;
    const i = r.get(e);
    if (i) return i;
    const l = new Proxy(e, o === 2 ? s : n);
    return r.set(e, l), l
}

function Nt(e) {
    return dt(e) ? Nt(e.__v_raw) : !!(e && e.__v_isReactive)
}

function dt(e) {
    return !!(e && e.__v_isReadonly)
}

function Ce(e) {
    return !!(e && e.__v_isShallow)
}

function Ls(e) {
    return e ? !!e.__v_raw : !1
}

function W(e) {
    const t = e && e.__v_raw;
    return t ? W(t) : e
}

function $i(e) {
    return !J(e, "__v_skip") && Object.isExtensible(e) && kr(e, "__v_skip", !0), e
}
const et = e => Y(e) ? Hn(e) : e,
    rn = e => Y(e) ? ds(e) : e;

function ae(e) {
    return e ? e.__v_isRef === !0 : !1
}

function At(e) {
    return fo(e, !1)
}

function ki(e) {
    return fo(e, !0)
}

function fo(e, t) {
    return ae(e) ? e : new Wi(e, t)
}
class Wi {
    constructor(t, n) {
        this.dep = new Ns, this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : W(t), this._value = n ? t : et(t), this.__v_isShallow = n
    }
    get value() {
        return this.dep.track(), this._value
    }
    set value(t) {
        const n = this._rawValue,
            s = this.__v_isShallow || Ce(t) || dt(t);
        t = s ? t : W(t), ft(t, n) && (this._rawValue = t, this._value = s ? t : et(t), this.dep.trigger())
    }
}

function Ye(e) {
    return ae(e) ? e.value : e
}
const Ji = {
    get: (e, t, n) => t === "__v_raw" ? e : Ye(Reflect.get(e, t, n)),
    set: (e, t, n, s) => {
        const r = e[t];
        return ae(r) && !ae(n) ? (r.value = n, !0) : Reflect.set(e, t, n, s)
    }
};

function po(e) {
    return Nt(e) ? e : new Proxy(e, Ji)
}
class zi {
    constructor(t, n, s) {
        this.fn = t, this.setter = n, this._value = void 0, this.dep = new Ns(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = nn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s
    }
    notify() {
        if (this.flags |= 16, !(this.flags & 8) && ee !== this) return Xr(this, !0), !0
    }
    get value() {
        const t = this.dep.track();
        return to(this), t && (t.version = this.dep.version), this._value
    }
    set value(t) {
        this.setter && this.setter(t)
    }
}

function Qi(e, t, n = !1) {
    let s, r;
    return U(e) ? s = e : (s = e.get, r = e.set), new zi(s, r, n)
}
const gn = {},
    xn = new WeakMap;
let vt;

function Yi(e, t = !1, n = vt) {
    if (n) {
        let s = xn.get(n);
        s || xn.set(n, s = []), s.push(e)
    }
}

function Xi(e, t, n = X) {
    const {
        immediate: s,
        deep: r,
        once: o,
        scheduler: i,
        augmentJob: l,
        call: c
    } = n, d = P => r ? P : Ce(P) || r === !1 || r === 0 ? Qe(P, 1) : Qe(P);
    let f, p, m, h, O = !1,
        A = !1;
    if (ae(e) ? (p = () => e.value, O = Ce(e)) : Nt(e) ? (p = () => d(e), O = !0) : V(e) ? (A = !0, O = e.some(P => Nt(P) || Ce(P)), p = () => e.map(P => {
            if (ae(P)) return P.value;
            if (Nt(P)) return d(P);
            if (U(P)) return c ? c(P, 2) : P()
        })) : U(e) ? t ? p = c ? () => c(e, 2) : e : p = () => {
            if (m) {
                Xe();
                try {
                    m()
                } finally {
                    Ze()
                }
            }
            const P = vt;
            vt = f;
            try {
                return c ? c(e, 3, [h]) : e(h)
            } finally {
                vt = P
            }
        } : p = Ve, t && r) {
        const P = p,
            K = r === !0 ? 1 / 0 : r;
        p = () => Qe(P(), K)
    }
    const L = Ri(),
        F = () => {
            f.stop(), L && L.active && Ss(L.effects, f)
        };
    if (o && t) {
        const P = t;
        t = (...K) => {
            P(...K), F()
        }
    }
    let S = A ? new Array(e.length).fill(gn) : gn;
    const N = P => {
        if (!(!(f.flags & 1) || !f.dirty && !P))
            if (t) {
                const K = f.run();
                if (r || O || (A ? K.some((ie, te) => ft(ie, S[te])) : ft(K, S))) {
                    m && m();
                    const ie = vt;
                    vt = f;
                    try {
                        const te = [K, S === gn ? void 0 : A && S[0] === gn ? [] : S, h];
                        S = K, c ? c(t, 3, te) : t(...te)
                    } finally {
                        vt = ie
                    }
                }
            } else f.run()
    };
    return l && l(N), f = new Qr(p), f.scheduler = i ? () => i(N, !1) : N, h = P => Yi(P, !1, f), m = f.onStop = () => {
        const P = xn.get(f);
        if (P) {
            if (c) c(P, 4);
            else
                for (const K of P) K();
            xn.delete(f)
        }
    }, t ? s ? N(!0) : S = f.run() : i ? i(N.bind(null, !0), !0) : f.run(), F.pause = f.pause.bind(f), F.resume = f.resume.bind(f), F.stop = F, F
}

function Qe(e, t = 1 / 0, n) {
    if (t <= 0 || !Y(e) || e.__v_skip || (n = n || new Map, (n.get(e) || 0) >= t)) return e;
    if (n.set(e, t), t--, ae(e)) Qe(e.value, t, n);
    else if (V(e))
        for (let s = 0; s < e.length; s++) Qe(e[s], t, n);
    else if (Gr(e) || Pt(e)) e.forEach(s => {
        Qe(s, t, n)
    });
    else if ($r(e)) {
        for (const s in e) Qe(e[s], t, n);
        for (const s of Object.getOwnPropertySymbols(e)) Object.prototype.propertyIsEnumerable.call(e, s) && Qe(e[s], t, n)
    }
    return e
}
/**
 * @vue/runtime-core v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
function fn(e, t, n, s) {
    try {
        return s ? e(...s) : e()
    } catch (r) {
        Vn(r, t, n)
    }
}

function Ge(e, t, n, s) {
    if (U(e)) {
        const r = fn(e, t, n, s);
        return r && qr(r) && r.catch(o => {
            Vn(o, t, n)
        }), r
    }
    if (V(e)) {
        const r = [];
        for (let o = 0; o < e.length; o++) r.push(Ge(e[o], t, n, s));
        return r
    }
}

function Vn(e, t, n, s = !0) {
    const r = t ? t.vnode : null,
        {
            errorHandler: o,
            throwUnhandledErrorInProduction: i
        } = t && t.appContext.config || X;
    if (t) {
        let l = t.parent;
        const c = t.proxy,
            d = `https://vuejs.org/error-reference/#runtime-${n}`;
        for (; l;) {
            const f = l.ec;
            if (f) {
                for (let p = 0; p < f.length; p++)
                    if (f[p](e, c, d) === !1) return
            }
            l = l.parent
        }
        if (o) {
            Xe(), fn(o, null, 10, [e, c, d]), Ze();
            return
        }
    }
    Zi(e, n, r, s, i)
}

function Zi(e, t, n, s = !0, r = !1) {
    if (r) throw e;
    console.error(e)
}
const pe = [];
let je = -1;
const Mt = [];
let lt = null,
    Ct = 0;
const ho = Promise.resolve();
let wn = null;

function Sn(e) {
    const t = wn || ho;
    return e ? t.then(this ? e.bind(this) : e) : t
}

function el(e) {
    let t = je + 1,
        n = pe.length;
    for (; t < n;) {
        const s = t + n >>> 1,
            r = pe[s],
            o = on(r);
        o < e || o === e && r.flags & 2 ? t = s + 1 : n = s
    }
    return t
}

function Fs(e) {
    if (!(e.flags & 1)) {
        const t = on(e),
            n = pe[pe.length - 1];
        !n || !(e.flags & 2) && t >= on(n) ? pe.push(e) : pe.splice(el(t), 0, e), e.flags |= 1, go()
    }
}

function go() {
    wn || (wn = ho.then(_o))
}

function tl(e) {
    V(e) ? Mt.push(...e) : lt && e.id === -1 ? lt.splice(Ct + 1, 0, e) : e.flags & 1 || (Mt.push(e), e.flags |= 1), go()
}

function Zs(e, t, n = je + 1) {
    for (; n < pe.length; n++) {
        const s = pe[n];
        if (s && s.flags & 2) {
            if (e && s.id !== e.uid) continue;
            pe.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2)
        }
    }
}

function mo(e) {
    if (Mt.length) {
        const t = [...new Set(Mt)].sort((n, s) => on(n) - on(s));
        if (Mt.length = 0, lt) {
            lt.push(...t);
            return
        }
        for (lt = t, Ct = 0; Ct < lt.length; Ct++) {
            const n = lt[Ct];
            n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2
        }
        lt = null, Ct = 0
    }
}
const on = e => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;

function _o(e) {
    try {
        for (je = 0; je < pe.length; je++) {
            const t = pe[je];
            t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), fn(t, t.i, t.i ? 15 : 14), t.flags & 4 || (t.flags &= -2))
        }
    } finally {
        for (; je < pe.length; je++) {
            const t = pe[je];
            t && (t.flags &= -2)
        }
        je = -1, pe.length = 0, mo(), wn = null, (pe.length || Mt.length) && _o()
    }
}
let Ee = null,
    vo = null;

function Rn(e) {
    const t = Ee;
    return Ee = e, vo = e && e.type.__scopeId || null, t
}

function nl(e, t = Ee, n) {
    if (!t || e._n) return e;
    const s = (...r) => {
        s._d && Bt(-1);
        const o = Rn(t);
        let i;
        try {
            i = e(...r)
        } finally {
            Rn(o), s._d && Bt(1)
        }
        return i
    };
    return s._n = !0, s._c = !0, s._d = !0, s
}

function sl(e, t) {
    if (Ee === null) return e;
    const n = $n(Ee),
        s = e.dirs || (e.dirs = []);
    for (let r = 0; r < t.length; r++) {
        let [o, i, l, c = X] = t[r];
        o && (U(o) && (o = {
            mounted: o,
            updated: o
        }), o.deep && Qe(i), s.push({
            dir: o,
            instance: n,
            value: i,
            oldValue: void 0,
            arg: l,
            modifiers: c
        }))
    }
    return e
}

function mt(e, t, n, s) {
    const r = e.dirs,
        o = t && t.dirs;
    for (let i = 0; i < r.length; i++) {
        const l = r[i];
        o && (l.oldValue = o[i].value);
        let c = l.dir[s];
        c && (Xe(), Ge(c, n, 8, [e.el, l, e, t]), Ze())
    }
}

function _n(e, t) {
    if (ue) {
        let n = ue.provides;
        const s = ue.parent && ue.parent.provides;
        s === n && (n = ue.provides = Object.create(s)), n[e] = t
    }
}

function Oe(e, t, n = !1) {
    const s = rc();
    if (s || Dt) {
        let r = Dt ? Dt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
        if (r && e in r) return r[e];
        if (arguments.length > 1) return n && U(t) ? t.call(s && s.proxy) : t
    }
}
const rl = Symbol.for("v-scx"),
    ol = () => Oe(rl);

function vn(e, t, n) {
    return yo(e, t, n)
}

function yo(e, t, n = X) {
    const {
        immediate: s,
        deep: r,
        flush: o,
        once: i
    } = n, l = le({}, n), c = t && s || !t && o !== "post";
    let d;
    if (cn) {
        if (o === "sync") {
            const h = ol();
            d = h.__watcherHandles || (h.__watcherHandles = [])
        } else if (!c) {
            const h = () => {};
            return h.stop = Ve, h.resume = Ve, h.pause = Ve, h
        }
    }
    const f = ue;
    l.call = (h, O, A) => Ge(h, f, O, A);
    let p = !1;
    o === "post" ? l.scheduler = h => {
        _e(h, f && f.suspense)
    } : o !== "sync" && (p = !0, l.scheduler = (h, O) => {
        O ? h() : Fs(h)
    }), l.augmentJob = h => {
        t && (h.flags |= 4), p && (h.flags |= 2, f && (h.id = f.uid, h.i = f))
    };
    const m = Xi(e, t, l);
    return cn && (d ? d.push(m) : c && m()), m
}

function il(e, t, n) {
    const s = this.proxy,
        r = re(e) ? e.includes(".") ? bo(s, e) : () => s[e] : e.bind(s, s);
    let o;
    U(t) ? o = t : (o = t.handler, n = t);
    const i = dn(this),
        l = yo(r, o.bind(s), n);
    return i(), l
}

function bo(e, t) {
    const n = t.split(".");
    return () => {
        let s = e;
        for (let r = 0; r < n.length && s; r++) s = s[n[r]];
        return s
    }
}
const ll = Symbol("_vte"),
    cl = e => e.__isTeleport,
    ul = Symbol("_leaveCb");

function js(e, t) {
    e.shapeFlag & 6 && e.component ? (e.transition = t, js(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t
}

function Eo(e, t) {
    return U(e) ? le({
        name: e.name
    }, t, {
        setup: e
    }) : e
}

function Ao(e) {
    e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0]
}

function er(e, t) {
    let n;
    return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable)
}
const Cn = new WeakMap;

function Yt(e, t, n, s, r = !1) {
    if (V(e)) {
        e.forEach((A, L) => Yt(A, t && (V(t) ? t[L] : t), n, s, r));
        return
    }
    if (Xt(s) && !r) {
        s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Yt(e, t, n, s.component.subTree);
        return
    }
    const o = s.shapeFlag & 4 ? $n(s.component) : s.el,
        i = r ? null : o,
        {
            i: l,
            r: c
        } = e,
        d = t && t.r,
        f = l.refs === X ? l.refs = {} : l.refs,
        p = l.setupState,
        m = W(p),
        h = p === X ? Ur : A => er(f, A) ? !1 : J(m, A),
        O = (A, L) => !(L && er(f, L));
    if (d != null && d !== c) {
        if (tr(t), re(d)) f[d] = null, h(d) && (p[d] = null);
        else if (ae(d)) {
            const A = t;
            O(d, A.k) && (d.value = null), A.k && (f[A.k] = null)
        }
    }
    if (U(c)) fn(c, l, 12, [i, f]);
    else {
        const A = re(c),
            L = ae(c);
        if (A || L) {
            const F = () => {
                if (e.f) {
                    const S = A ? h(c) ? p[c] : f[c] : O() || !e.k ? c.value : f[e.k];
                    if (r) V(S) && Ss(S, o);
                    else if (V(S)) S.includes(o) || S.push(o);
                    else if (A) f[c] = [o], h(c) && (p[c] = f[c]);
                    else {
                        const N = [o];
                        O(c, e.k) && (c.value = N), e.k && (f[e.k] = N)
                    }
                } else A ? (f[c] = i, h(c) && (p[c] = i)) : L && (O(c, e.k) && (c.value = i), e.k && (f[e.k] = i))
            };
            if (i) {
                const S = () => {
                    F(), Cn.delete(e)
                };
                S.id = -1, Cn.set(e, S), _e(S, n)
            } else tr(e), F()
        }
    }
}

function tr(e) {
    const t = Cn.get(e);
    t && (t.flags |= 8, Cn.delete(e))
}
Fn().requestIdleCallback;
Fn().cancelIdleCallback;
const Xt = e => !!e.type.__asyncLoader,
    xo = e => e.type.__isKeepAlive;

function al(e, t) {
    wo(e, "a", t)
}

function fl(e, t) {
    wo(e, "da", t)
}

function wo(e, t, n = ue) {
    const s = e.__wdc || (e.__wdc = () => {
        let r = n;
        for (; r;) {
            if (r.isDeactivated) return;
            r = r.parent
        }
        return e()
    });
    if (Un(t, s, n), n) {
        let r = n.parent;
        for (; r && r.parent;) xo(r.parent.vnode) && dl(s, t, n, r), r = r.parent
    }
}

function dl(e, t, n, s) {
    const r = Un(t, e, s, !0);
    Gn(() => {
        Ss(s[t], r)
    }, n)
}

function Un(e, t, n = ue, s = !1) {
    if (n) {
        const r = n[e] || (n[e] = []),
            o = t.__weh || (t.__weh = (...i) => {
                Xe();
                const l = dn(n),
                    c = Ge(t, n, e, i);
                return l(), Ze(), c
            });
        return s ? r.unshift(o) : r.push(o), o
    }
}
const tt = e => (t, n = ue) => {
        (!cn || e === "sp") && Un(e, (...s) => t(...s), n)
    },
    pl = tt("bm"),
    Hs = tt("m"),
    hl = tt("bu"),
    gl = tt("u"),
    ml = tt("bum"),
    Gn = tt("um"),
    _l = tt("sp"),
    vl = tt("rtg"),
    yl = tt("rtc");

function bl(e, t = ue) {
    Un("ec", e, t)
}
const El = "components";

function Al(e, t) {
    return wl(El, e, !0, t) || e
}
const xl = Symbol.for("v-ndc");

function wl(e, t, n = !0, s = !1) {
    const r = Ee || ue;
    if (r) {
        const o = r.type; {
            const l = uc(o, !1);
            if (l && (l === t || l === Se(t) || l === Ln(Se(t)))) return o
        }
        const i = nr(r[e] || o[e], t) || nr(r.appContext[e], t);
        return !i && s ? o : i
    }
}

function nr(e, t) {
    return e && (e[t] || e[Se(t)] || e[Ln(Se(t))])
}
const ps = e => e ? ko(e) ? $n(e) : ps(e.parent) : null,
    Zt = le(Object.create(null), {
        $: e => e,
        $el: e => e.vnode.el,
        $data: e => e.data,
        $props: e => e.props,
        $attrs: e => e.attrs,
        $slots: e => e.slots,
        $refs: e => e.refs,
        $parent: e => ps(e.parent),
        $root: e => ps(e.root),
        $host: e => e.ce,
        $emit: e => e.emit,
        $options: e => Ro(e),
        $forceUpdate: e => e.f || (e.f = () => {
            Fs(e.update)
        }),
        $nextTick: e => e.n || (e.n = Sn.bind(e.proxy)),
        $watch: e => il.bind(e)
    }),
    es = (e, t) => e !== X && !e.__isScriptSetup && J(e, t),
    Sl = {
        get({
            _: e
        }, t) {
            if (t === "__v_skip") return !0;
            const {
                ctx: n,
                setupState: s,
                data: r,
                props: o,
                accessCache: i,
                type: l,
                appContext: c
            } = e;
            if (t[0] !== "$") {
                const m = i[t];
                if (m !== void 0) switch (m) {
                    case 1:
                        return s[t];
                    case 2:
                        return r[t];
                    case 4:
                        return n[t];
                    case 3:
                        return o[t]
                } else {
                    if (es(s, t)) return i[t] = 1, s[t];
                    if (r !== X && J(r, t)) return i[t] = 2, r[t];
                    if (J(o, t)) return i[t] = 3, o[t];
                    if (n !== X && J(n, t)) return i[t] = 4, n[t];
                    hs && (i[t] = 0)
                }
            }
            const d = Zt[t];
            let f, p;
            if (d) return t === "$attrs" && ce(e.attrs, "get", ""), d(e);
            if ((f = l.__cssModules) && (f = f[t])) return f;
            if (n !== X && J(n, t)) return i[t] = 4, n[t];
            if (p = c.config.globalProperties, J(p, t)) return p[t]
        },
        set({
            _: e
        }, t, n) {
            const {
                data: s,
                setupState: r,
                ctx: o
            } = e;
            return es(r, t) ? (r[t] = n, !0) : s !== X && J(s, t) ? (s[t] = n, !0) : J(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (o[t] = n, !0)
        },
        has({
            _: {
                data: e,
                setupState: t,
                accessCache: n,
                ctx: s,
                appContext: r,
                props: o,
                type: i
            }
        }, l) {
            let c;
            return !!(n[l] || e !== X && l[0] !== "$" && J(e, l) || es(t, l) || J(o, l) || J(s, l) || J(Zt, l) || J(r.config.globalProperties, l) || (c = i.__cssModules) && c[l])
        },
        defineProperty(e, t, n) {
            return n.get != null ? e._.accessCache[t] = 0 : J(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n)
        }
    };

function sr(e) {
    return V(e) ? e.reduce((t, n) => (t[n] = null, t), {}) : e
}
let hs = !0;

function Rl(e) {
    const t = Ro(e),
        n = e.proxy,
        s = e.ctx;
    hs = !1, t.beforeCreate && rr(t.beforeCreate, e, "bc");
    const {
        data: r,
        computed: o,
        methods: i,
        watch: l,
        provide: c,
        inject: d,
        created: f,
        beforeMount: p,
        mounted: m,
        beforeUpdate: h,
        updated: O,
        activated: A,
        deactivated: L,
        beforeDestroy: F,
        beforeUnmount: S,
        destroyed: N,
        unmounted: P,
        render: K,
        renderTracked: ie,
        renderTriggered: te,
        errorCaptured: Ie,
        serverPrefetch: nt,
        expose: Pe,
        inheritAttrs: st,
        components: ht,
        directives: Ne,
        filters: Ht
    } = t;
    if (d && Cl(d, s, null), i)
        for (const Q in i) {
            const $ = i[Q];
            U($) && (s[Q] = $.bind(n))
        }
    if (r) {
        const Q = r.call(n, n);
        Y(Q) && (e.data = Hn(Q))
    }
    if (hs = !0, o)
        for (const Q in o) {
            const $ = o[Q],
                qe = U($) ? $.bind(n, n) : U($.get) ? $.get.bind(n, n) : Ve,
                rt = !U($) && U($.set) ? $.set.bind(n) : Ve,
                Me = we({
                    get: qe,
                    set: rt
                });
            Object.defineProperty(s, Q, {
                enumerable: !0,
                configurable: !0,
                get: () => Me.value,
                set: he => Me.value = he
            })
        }
    if (l)
        for (const Q in l) So(l[Q], s, n, Q);
    if (c) {
        const Q = U(c) ? c.call(n) : c;
        Reflect.ownKeys(Q).forEach($ => {
            _n($, Q[$])
        })
    }
    f && rr(f, e, "c");

    function oe(Q, $) {
        V($) ? $.forEach(qe => Q(qe.bind(n))) : $ && Q($.bind(n))
    }
    if (oe(pl, p), oe(Hs, m), oe(hl, h), oe(gl, O), oe(al, A), oe(fl, L), oe(bl, Ie), oe(yl, ie), oe(vl, te), oe(ml, S), oe(Gn, P), oe(_l, nt), V(Pe))
        if (Pe.length) {
            const Q = e.exposed || (e.exposed = {});
            Pe.forEach($ => {
                Object.defineProperty(Q, $, {
                    get: () => n[$],
                    set: qe => n[$] = qe,
                    enumerable: !0
                })
            })
        } else e.exposed || (e.exposed = {});
    K && e.render === Ve && (e.render = K), st != null && (e.inheritAttrs = st), ht && (e.components = ht), Ne && (e.directives = Ne), nt && Ao(e)
}

function Cl(e, t, n = Ve) {
    V(e) && (e = gs(e));
    for (const s in e) {
        const r = e[s];
        let o;
        Y(r) ? "default" in r ? o = Oe(r.from || s, r.default, !0) : o = Oe(r.from || s) : o = Oe(r), ae(o) ? Object.defineProperty(t, s, {
            enumerable: !0,
            configurable: !0,
            get: () => o.value,
            set: i => o.value = i
        }) : t[s] = o
    }
}

function rr(e, t, n) {
    Ge(V(e) ? e.map(s => s.bind(t.proxy)) : e.bind(t.proxy), t, n)
}

function So(e, t, n, s) {
    let r = s.includes(".") ? bo(n, s) : () => n[s];
    if (re(e)) {
        const o = t[e];
        U(o) && vn(r, o)
    } else if (U(e)) vn(r, e.bind(n));
    else if (Y(e))
        if (V(e)) e.forEach(o => So(o, t, n, s));
        else {
            const o = U(e.handler) ? e.handler.bind(n) : t[e.handler];
            U(o) && vn(r, o, e)
        }
}

function Ro(e) {
    const t = e.type,
        {
            mixins: n,
            extends: s
        } = t,
        {
            mixins: r,
            optionsCache: o,
            config: {
                optionMergeStrategies: i
            }
        } = e.appContext,
        l = o.get(t);
    let c;
    return l ? c = l : !r.length && !n && !s ? c = t : (c = {}, r.length && r.forEach(d => On(c, d, i, !0)), On(c, t, i)), Y(t) && o.set(t, c), c
}

function On(e, t, n, s = !1) {
    const {
        mixins: r,
        extends: o
    } = t;
    o && On(e, o, n, !0), r && r.forEach(i => On(e, i, n, !0));
    for (const i in t)
        if (!(s && i === "expose")) {
            const l = Ol[i] || n && n[i];
            e[i] = l ? l(e[i], t[i]) : t[i]
        }
    return e
}
const Ol = {
    data: or,
    props: ir,
    emits: ir,
    methods: kt,
    computed: kt,
    beforeCreate: fe,
    created: fe,
    beforeMount: fe,
    mounted: fe,
    beforeUpdate: fe,
    updated: fe,
    beforeDestroy: fe,
    beforeUnmount: fe,
    destroyed: fe,
    unmounted: fe,
    activated: fe,
    deactivated: fe,
    errorCaptured: fe,
    serverPrefetch: fe,
    components: kt,
    directives: kt,
    watch: Il,
    provide: or,
    inject: Tl
};

function or(e, t) {
    return t ? e ? function() {
        return le(U(e) ? e.call(this, this) : e, U(t) ? t.call(this, this) : t)
    } : t : e
}

function Tl(e, t) {
    return kt(gs(e), gs(t))
}

function gs(e) {
    if (V(e)) {
        const t = {};
        for (let n = 0; n < e.length; n++) t[e[n]] = e[n];
        return t
    }
    return e
}

function fe(e, t) {
    return e ? [...new Set([].concat(e, t))] : t
}

function kt(e, t) {
    return e ? le(Object.create(null), e, t) : t
}

function ir(e, t) {
    return e ? V(e) && V(t) ? [...new Set([...e, ...t])] : le(Object.create(null), sr(e), sr(t ? ? {})) : t
}

function Il(e, t) {
    if (!e) return t;
    if (!t) return e;
    const n = le(Object.create(null), e);
    for (const s in t) n[s] = fe(e[s], t[s]);
    return n
}

function Co() {
    return {
        app: null,
        config: {
            isNativeTag: Ur,
            performance: !1,
            globalProperties: {},
            optionMergeStrategies: {},
            errorHandler: void 0,
            warnHandler: void 0,
            compilerOptions: {}
        },
        mixins: [],
        components: {},
        directives: {},
        provides: Object.create(null),
        optionsCache: new WeakMap,
        propsCache: new WeakMap,
        emitsCache: new WeakMap
    }
}
let Pl = 0;

function Nl(e, t) {
    return function(s, r = null) {
        U(s) || (s = le({}, s)), r != null && !Y(r) && (r = null);
        const o = Co(),
            i = new WeakSet,
            l = [];
        let c = !1;
        const d = o.app = {
            _uid: Pl++,
            _component: s,
            _props: r,
            _container: null,
            _context: o,
            _instance: null,
            version: fc,
            get config() {
                return o.config
            },
            set config(f) {},
            use(f, ...p) {
                return i.has(f) || (f && U(f.install) ? (i.add(f), f.install(d, ...p)) : U(f) && (i.add(f), f(d, ...p))), d
            },
            mixin(f) {
                return o.mixins.includes(f) || o.mixins.push(f), d
            },
            component(f, p) {
                return p ? (o.components[f] = p, d) : o.components[f]
            },
            directive(f, p) {
                return p ? (o.directives[f] = p, d) : o.directives[f]
            },
            mount(f, p, m) {
                if (!c) {
                    const h = d._ceVNode || ye(s, r);
                    return h.appContext = o, m === !0 ? m = "svg" : m === !1 && (m = void 0), e(h, f, m), c = !0, d._container = f, f.__vue_app__ = d, $n(h.component)
                }
            },
            onUnmount(f) {
                l.push(f)
            },
            unmount() {
                c && (Ge(l, d._instance, 16), e(null, d._container), delete d._container.__vue_app__)
            },
            provide(f, p) {
                return o.provides[f] = p, d
            },
            runWithContext(f) {
                const p = Dt;
                Dt = d;
                try {
                    return f()
                } finally {
                    Dt = p
                }
            }
        };
        return d
    }
}
let Dt = null;
const Ml = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Se(t)}Modifiers`] || e[`${Et(t)}Modifiers`];

function Dl(e, t, ...n) {
    if (e.isUnmounted) return;
    const s = e.vnode.props || X;
    let r = n;
    const o = t.startsWith("update:"),
        i = o && Ml(s, t.slice(7));
    i && (i.trim && (r = n.map(f => re(f) ? f.trim() : f)), i.number && (r = n.map(_i)));
    let l, c = s[l = Jn(t)] || s[l = Jn(Se(t))];
    !c && o && (c = s[l = Jn(Et(t))]), c && Ge(c, e, 6, r);
    const d = s[l + "Once"];
    if (d) {
        if (!e.emitted) e.emitted = {};
        else if (e.emitted[l]) return;
        e.emitted[l] = !0, Ge(d, e, 6, r)
    }
}
const Bl = new WeakMap;

function Oo(e, t, n = !1) {
    const s = n ? Bl : t.emitsCache,
        r = s.get(e);
    if (r !== void 0) return r;
    const o = e.emits;
    let i = {},
        l = !1;
    if (!U(e)) {
        const c = d => {
            const f = Oo(d, t, !0);
            f && (l = !0, le(i, f))
        };
        !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c)
    }
    return !o && !l ? (Y(e) && s.set(e, null), null) : (V(o) ? o.forEach(c => i[c] = null) : le(i, o), Y(e) && s.set(e, i), i)
}

function qn(e, t) {
    return !e || !Dn(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), J(e, t[0].toLowerCase() + t.slice(1)) || J(e, Et(t)) || J(e, t))
}

function lr(e) {
    const {
        type: t,
        vnode: n,
        proxy: s,
        withProxy: r,
        propsOptions: [o],
        slots: i,
        attrs: l,
        emit: c,
        render: d,
        renderCache: f,
        props: p,
        data: m,
        setupState: h,
        ctx: O,
        inheritAttrs: A
    } = e, L = Rn(e);
    let F, S;
    try {
        if (n.shapeFlag & 4) {
            const P = r || s,
                K = P;
            F = He(d.call(K, P, f, p, h, m, O)), S = l
        } else {
            const P = t;
            F = He(P.length > 1 ? P(p, {
                attrs: l,
                slots: i,
                emit: c
            }) : P(p, null)), S = t.props ? l : Ll(l)
        }
    } catch (P) {
        en.length = 0, Vn(P, e, 1), F = ye(pt)
    }
    let N = F;
    if (S && A !== !1) {
        const P = Object.keys(S),
            {
                shapeFlag: K
            } = N;
        P.length && K & 7 && (o && P.some(ws) && (S = Fl(S, o)), N = Lt(N, S, !1, !0))
    }
    return n.dirs && (N = Lt(N, null, !1, !0), N.dirs = N.dirs ? N.dirs.concat(n.dirs) : n.dirs), n.transition && js(N, n.transition), F = N, Rn(L), F
}
const Ll = e => {
        let t;
        for (const n in e)(n === "class" || n === "style" || Dn(n)) && ((t || (t = {}))[n] = e[n]);
        return t
    },
    Fl = (e, t) => {
        const n = {};
        for (const s in e)(!ws(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
        return n
    };

function jl(e, t, n) {
    const {
        props: s,
        children: r,
        component: o
    } = e, {
        props: i,
        children: l,
        patchFlag: c
    } = t, d = o.emitsOptions;
    if (t.dirs || t.transition) return !0;
    if (n && c >= 0) {
        if (c & 1024) return !0;
        if (c & 16) return s ? cr(s, i, d) : !!i;
        if (c & 8) {
            const f = t.dynamicProps;
            for (let p = 0; p < f.length; p++) {
                const m = f[p];
                if (To(i, s, m) && !qn(d, m)) return !0
            }
        }
    } else return (r || l) && (!l || !l.$stable) ? !0 : s === i ? !1 : s ? i ? cr(s, i, d) : !0 : !!i;
    return !1
}

function cr(e, t, n) {
    const s = Object.keys(t);
    if (s.length !== Object.keys(e).length) return !0;
    for (let r = 0; r < s.length; r++) {
        const o = s[r];
        if (To(t, e, o) && !qn(n, o)) return !0
    }
    return !1
}

function To(e, t, n) {
    const s = e[n],
        r = t[n];
    return n === "style" && Y(s) && Y(r) ? !Os(s, r) : s !== r
}

function Hl({
    vnode: e,
    parent: t
}, n) {
    for (; t;) {
        const s = t.subTree;
        if (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)(e = t.vnode).el = n, t = t.parent;
        else break
    }
}
const Io = {},
    Po = () => Object.create(Io),
    No = e => Object.getPrototypeOf(e) === Io;

function Vl(e, t, n, s = !1) {
    const r = {},
        o = Po();
    e.propsDefaults = Object.create(null), Mo(e, t, r, o);
    for (const i in e.propsOptions[0]) i in r || (r[i] = void 0);
    n ? e.props = s ? r : ao(r) : e.type.props ? e.props = r : e.props = o, e.attrs = o
}

function Ul(e, t, n, s) {
    const {
        props: r,
        attrs: o,
        vnode: {
            patchFlag: i
        }
    } = e, l = W(r), [c] = e.propsOptions;
    let d = !1;
    if ((s || i > 0) && !(i & 16)) {
        if (i & 8) {
            const f = e.vnode.dynamicProps;
            for (let p = 0; p < f.length; p++) {
                let m = f[p];
                if (qn(e.emitsOptions, m)) continue;
                const h = t[m];
                if (c)
                    if (J(o, m)) h !== o[m] && (o[m] = h, d = !0);
                    else {
                        const O = Se(m);
                        r[O] = ms(c, l, O, h, e, !1)
                    }
                else h !== o[m] && (o[m] = h, d = !0)
            }
        }
    } else {
        Mo(e, t, r, o) && (d = !0);
        let f;
        for (const p in l)(!t || !J(t, p) && ((f = Et(p)) === p || !J(t, f))) && (c ? n && (n[p] !== void 0 || n[f] !== void 0) && (r[p] = ms(c, l, p, void 0, e, !0)) : delete r[p]);
        if (o !== l)
            for (const p in o)(!t || !J(t, p)) && (delete o[p], d = !0)
    }
    d && ze(e.attrs, "set", "")
}

function Mo(e, t, n, s) {
    const [r, o] = e.propsOptions;
    let i = !1,
        l;
    if (t)
        for (let c in t) {
            if (Jt(c)) continue;
            const d = t[c];
            let f;
            r && J(r, f = Se(c)) ? !o || !o.includes(f) ? n[f] = d : (l || (l = {}))[f] = d : qn(e.emitsOptions, c) || (!(c in s) || d !== s[c]) && (s[c] = d, i = !0)
        }
    if (o) {
        const c = W(n),
            d = l || X;
        for (let f = 0; f < o.length; f++) {
            const p = o[f];
            n[p] = ms(r, c, p, d[p], e, !J(d, p))
        }
    }
    return i
}

function ms(e, t, n, s, r, o) {
    const i = e[n];
    if (i != null) {
        const l = J(i, "default");
        if (l && s === void 0) {
            const c = i.default;
            if (i.type !== Function && !i.skipFactory && U(c)) {
                const {
                    propsDefaults: d
                } = r;
                if (n in d) s = d[n];
                else {
                    const f = dn(r);
                    s = d[n] = c.call(null, t), f()
                }
            } else s = c;
            r.ce && r.ce._setProp(n, s)
        }
        i[0] && (o && !l ? s = !1 : i[1] && (s === "" || s === Et(n)) && (s = !0))
    }
    return s
}
const Gl = new WeakMap;

function Do(e, t, n = !1) {
    const s = n ? Gl : t.propsCache,
        r = s.get(e);
    if (r) return r;
    const o = e.props,
        i = {},
        l = [];
    let c = !1;
    if (!U(e)) {
        const f = p => {
            c = !0;
            const [m, h] = Do(p, t, !0);
            le(i, m), h && l.push(...h)
        };
        !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f)
    }
    if (!o && !c) return Y(e) && s.set(e, It), It;
    if (V(o))
        for (let f = 0; f < o.length; f++) {
            const p = Se(o[f]);
            ur(p) && (i[p] = X)
        } else if (o)
            for (const f in o) {
                const p = Se(f);
                if (ur(p)) {
                    const m = o[f],
                        h = i[p] = V(m) || U(m) ? {
                            type: m
                        } : le({}, m),
                        O = h.type;
                    let A = !1,
                        L = !0;
                    if (V(O))
                        for (let F = 0; F < O.length; ++F) {
                            const S = O[F],
                                N = U(S) && S.name;
                            if (N === "Boolean") {
                                A = !0;
                                break
                            } else N === "String" && (L = !1)
                        } else A = U(O) && O.name === "Boolean";
                    h[0] = A, h[1] = L, (A || J(h, "default")) && l.push(p)
                }
            }
    const d = [i, l];
    return Y(e) && s.set(e, d), d
}

function ur(e) {
    return e[0] !== "$" && !Jt(e)
}
const Vs = e => e === "_" || e === "_ctx" || e === "$stable",
    Us = e => V(e) ? e.map(He) : [He(e)],
    ql = (e, t, n) => {
        if (t._n) return t;
        const s = nl((...r) => Us(t(...r)), n);
        return s._c = !1, s
    },
    Bo = (e, t, n) => {
        const s = e._ctx;
        for (const r in e) {
            if (Vs(r)) continue;
            const o = e[r];
            if (U(o)) t[r] = ql(r, o, s);
            else if (o != null) {
                const i = Us(o);
                t[r] = () => i
            }
        }
    },
    Lo = (e, t) => {
        const n = Us(t);
        e.slots.default = () => n
    },
    Fo = (e, t, n) => {
        for (const s in t)(n || !Vs(s)) && (e[s] = t[s])
    },
    Kl = (e, t, n) => {
        const s = e.slots = Po();
        if (e.vnode.shapeFlag & 32) {
            const r = t._;
            r ? (Fo(s, t, n), n && kr(s, "_", r, !0)) : Bo(t, s)
        } else t && Lo(e, t)
    },
    $l = (e, t, n) => {
        const {
            vnode: s,
            slots: r
        } = e;
        let o = !0,
            i = X;
        if (s.shapeFlag & 32) {
            const l = t._;
            l ? n && l === 1 ? o = !1 : Fo(r, t, n) : (o = !t.$stable, Bo(t, r)), i = t
        } else t && (Lo(e, t), i = {
            default: 1
        });
        if (o)
            for (const l in r) !Vs(l) && i[l] == null && delete r[l]
    },
    _e = Ql;

function kl(e) {
    return Wl(e)
}

function Wl(e, t) {
    const n = Fn();
    n.__VUE__ = !0;
    const {
        insert: s,
        remove: r,
        patchProp: o,
        createElement: i,
        createText: l,
        createComment: c,
        setText: d,
        setElementText: f,
        parentNode: p,
        nextSibling: m,
        setScopeId: h = Ve,
        insertStaticContent: O
    } = e, A = (u, a, g, _ = null, b = null, v = null, R = void 0, w = null, x = !!a.dynamicChildren) => {
        if (u === a) return;
        u && !Gt(u, a) && (_ = y(u), he(u, b, v, !0), u = null), a.patchFlag === -2 && (x = !1, a.dynamicChildren = null);
        const {
            type: E,
            ref: j,
            shapeFlag: T
        } = a;
        switch (E) {
            case Kn:
                L(u, a, g, _);
                break;
            case pt:
                F(u, a, g, _);
                break;
            case yn:
                u == null && S(a, g, _, R);
                break;
            case We:
                ht(u, a, g, _, b, v, R, w, x);
                break;
            default:
                T & 1 ? K(u, a, g, _, b, v, R, w, x) : T & 6 ? Ne(u, a, g, _, b, v, R, w, x) : (T & 64 || T & 128) && E.process(u, a, g, _, b, v, R, w, x, D)
        }
        j != null && b ? Yt(j, u && u.ref, v, a || u, !a) : j == null && u && u.ref != null && Yt(u.ref, null, v, u, !0)
    }, L = (u, a, g, _) => {
        if (u == null) s(a.el = l(a.children), g, _);
        else {
            const b = a.el = u.el;
            a.children !== u.children && d(b, a.children)
        }
    }, F = (u, a, g, _) => {
        u == null ? s(a.el = c(a.children || ""), g, _) : a.el = u.el
    }, S = (u, a, g, _) => {
        [u.el, u.anchor] = O(u.children, a, g, _, u.el, u.anchor)
    }, N = ({
        el: u,
        anchor: a
    }, g, _) => {
        let b;
        for (; u && u !== a;) b = m(u), s(u, g, _), u = b;
        s(a, g, _)
    }, P = ({
        el: u,
        anchor: a
    }) => {
        let g;
        for (; u && u !== a;) g = m(u), r(u), u = g;
        r(a)
    }, K = (u, a, g, _, b, v, R, w, x) => {
        if (a.type === "svg" ? R = "svg" : a.type === "math" && (R = "mathml"), u == null) ie(a, g, _, b, v, R, w, x);
        else {
            const E = u.el && u.el._isVueCE ? u.el : null;
            try {
                E && E._beginPatch(), nt(u, a, b, v, R, w, x)
            } finally {
                E && E._endPatch()
            }
        }
    }, ie = (u, a, g, _, b, v, R, w) => {
        let x, E;
        const {
            props: j,
            shapeFlag: T,
            transition: B,
            dirs: H
        } = u;
        if (x = u.el = i(u.type, v, j && j.is, j), T & 8 ? f(x, u.children) : T & 16 && Ie(u.children, x, null, _, b, ts(u, v), R, w), H && mt(u, null, _, "created"), te(x, u, u.scopeId, R, _), j) {
            for (const Z in j) Z !== "value" && !Jt(Z) && o(x, Z, null, j[Z], v, _);
            "value" in j && o(x, "value", null, j.value, v), (E = j.onVnodeBeforeMount) && Fe(E, _, u)
        }
        H && mt(u, null, _, "beforeMount");
        const q = Jl(b, B);
        q && B.beforeEnter(x), s(x, a, g), ((E = j && j.onVnodeMounted) || q || H) && _e(() => {
            E && Fe(E, _, u), q && B.enter(x), H && mt(u, null, _, "mounted")
        }, b)
    }, te = (u, a, g, _, b) => {
        if (g && h(u, g), _)
            for (let v = 0; v < _.length; v++) h(u, _[v]);
        if (b) {
            let v = b.subTree;
            if (a === v || Uo(v.type) && (v.ssContent === a || v.ssFallback === a)) {
                const R = b.vnode;
                te(u, R, R.scopeId, R.slotScopeIds, b.parent)
            }
        }
    }, Ie = (u, a, g, _, b, v, R, w, x = 0) => {
        for (let E = x; E < u.length; E++) {
            const j = u[E] = w ? Je(u[E]) : He(u[E]);
            A(null, j, a, g, _, b, v, R, w)
        }
    }, nt = (u, a, g, _, b, v, R) => {
        const w = a.el = u.el;
        let {
            patchFlag: x,
            dynamicChildren: E,
            dirs: j
        } = a;
        x |= u.patchFlag & 16;
        const T = u.props || X,
            B = a.props || X;
        let H;
        if (g && _t(g, !1), (H = B.onVnodeBeforeUpdate) && Fe(H, g, a, u), j && mt(a, u, g, "beforeUpdate"), g && _t(g, !0), (T.innerHTML && B.innerHTML == null || T.textContent && B.textContent == null) && f(w, ""), E ? Pe(u.dynamicChildren, E, w, g, _, ts(a, b), v) : R || $(u, a, w, null, g, _, ts(a, b), v, !1), x > 0) {
            if (x & 16) st(w, T, B, g, b);
            else if (x & 2 && T.class !== B.class && o(w, "class", null, B.class, b), x & 4 && o(w, "style", T.style, B.style, b), x & 8) {
                const q = a.dynamicProps;
                for (let Z = 0; Z < q.length; Z++) {
                    const z = q[Z],
                        ge = T[z],
                        me = B[z];
                    (me !== ge || z === "value") && o(w, z, ge, me, b, g)
                }
            }
            x & 1 && u.children !== a.children && f(w, a.children)
        } else !R && E == null && st(w, T, B, g, b);
        ((H = B.onVnodeUpdated) || j) && _e(() => {
            H && Fe(H, g, a, u), j && mt(a, u, g, "updated")
        }, _)
    }, Pe = (u, a, g, _, b, v, R) => {
        for (let w = 0; w < a.length; w++) {
            const x = u[w],
                E = a[w],
                j = x.el && (x.type === We || !Gt(x, E) || x.shapeFlag & 198) ? p(x.el) : g;
            A(x, E, j, null, _, b, v, R, !0)
        }
    }, st = (u, a, g, _, b) => {
        if (a !== g) {
            if (a !== X)
                for (const v in a) !Jt(v) && !(v in g) && o(u, v, a[v], null, b, _);
            for (const v in g) {
                if (Jt(v)) continue;
                const R = g[v],
                    w = a[v];
                R !== w && v !== "value" && o(u, v, w, R, b, _)
            }
            "value" in g && o(u, "value", a.value, g.value, b)
        }
    }, ht = (u, a, g, _, b, v, R, w, x) => {
        const E = a.el = u ? u.el : l(""),
            j = a.anchor = u ? u.anchor : l("");
        let {
            patchFlag: T,
            dynamicChildren: B,
            slotScopeIds: H
        } = a;
        H && (w = w ? w.concat(H) : H), u == null ? (s(E, g, _), s(j, g, _), Ie(a.children || [], g, j, b, v, R, w, x)) : T > 0 && T & 64 && B && u.dynamicChildren && u.dynamicChildren.length === B.length ? (Pe(u.dynamicChildren, B, g, b, v, R, w), (a.key != null || b && a === b.subTree) && jo(u, a, !0)) : $(u, a, g, j, b, v, R, w, x)
    }, Ne = (u, a, g, _, b, v, R, w, x) => {
        a.slotScopeIds = w, u == null ? a.shapeFlag & 512 ? b.ctx.activate(a, g, _, R, x) : Ht(a, g, _, b, v, R, x) : xt(u, a, x)
    }, Ht = (u, a, g, _, b, v, R) => {
        const w = u.component = sc(u, _, b);
        if (xo(u) && (w.ctx.renderer = D), oc(w, !1, R), w.asyncDep) {
            if (b && b.registerDep(w, oe, R), !u.el) {
                const x = w.subTree = ye(pt);
                F(null, x, a, g), u.placeholder = x.el
            }
        } else oe(w, u, a, g, b, v, R)
    }, xt = (u, a, g) => {
        const _ = a.component = u.component;
        if (jl(u, a, g))
            if (_.asyncDep && !_.asyncResolved) {
                Q(_, a, g);
                return
            } else _.next = a, _.update();
        else a.el = u.el, _.vnode = a
    }, oe = (u, a, g, _, b, v, R) => {
        const w = () => {
            if (u.isMounted) {
                let {
                    next: T,
                    bu: B,
                    u: H,
                    parent: q,
                    vnode: Z
                } = u; {
                    const Be = Ho(u);
                    if (Be) {
                        T && (T.el = Z.el, Q(u, T, R)), Be.asyncDep.then(() => {
                            _e(() => {
                                u.isUnmounted || E()
                            }, b)
                        });
                        return
                    }
                }
                let z = T,
                    ge;
                _t(u, !1), T ? (T.el = Z.el, Q(u, T, R)) : T = Z, B && zn(B), (ge = T.props && T.props.onVnodeBeforeUpdate) && Fe(ge, q, T, Z), _t(u, !0);
                const me = lr(u),
                    De = u.subTree;
                u.subTree = me, A(De, me, p(De.el), y(De), u, b, v), T.el = me.el, z === null && Hl(u, me.el), H && _e(H, b), (ge = T.props && T.props.onVnodeUpdated) && _e(() => Fe(ge, q, T, Z), b)
            } else {
                let T;
                const {
                    el: B,
                    props: H
                } = a, {
                    bm: q,
                    m: Z,
                    parent: z,
                    root: ge,
                    type: me
                } = u, De = Xt(a);
                _t(u, !1), q && zn(q), !De && (T = H && H.onVnodeBeforeMount) && Fe(T, z, a), _t(u, !0); {
                    ge.ce && ge.ce._hasShadowRoot() && ge.ce._injectChildStyle(me);
                    const Be = u.subTree = lr(u);
                    A(null, Be, g, _, u, b, v), a.el = Be.el
                }
                if (Z && _e(Z, b), !De && (T = H && H.onVnodeMounted)) {
                    const Be = a;
                    _e(() => Fe(T, z, Be), b)
                }(a.shapeFlag & 256 || z && Xt(z.vnode) && z.vnode.shapeFlag & 256) && u.a && _e(u.a, b), u.isMounted = !0, a = g = _ = null
            }
        };
        u.scope.on();
        const x = u.effect = new Qr(w);
        u.scope.off();
        const E = u.update = x.run.bind(x),
            j = u.job = x.runIfDirty.bind(x);
        j.i = u, j.id = u.uid, x.scheduler = () => Fs(j), _t(u, !0), E()
    }, Q = (u, a, g) => {
        a.component = u;
        const _ = u.vnode.props;
        u.vnode = a, u.next = null, Ul(u, a.props, _, g), $l(u, a.children, g), Xe(), Zs(u), Ze()
    }, $ = (u, a, g, _, b, v, R, w, x = !1) => {
        const E = u && u.children,
            j = u ? u.shapeFlag : 0,
            T = a.children,
            {
                patchFlag: B,
                shapeFlag: H
            } = a;
        if (B > 0) {
            if (B & 128) {
                rt(E, T, g, _, b, v, R, w, x);
                return
            } else if (B & 256) {
                qe(E, T, g, _, b, v, R, w, x);
                return
            }
        }
        H & 8 ? (j & 16 && xe(E, b, v), T !== E && f(g, T)) : j & 16 ? H & 16 ? rt(E, T, g, _, b, v, R, w, x) : xe(E, b, v, !0) : (j & 8 && f(g, ""), H & 16 && Ie(T, g, _, b, v, R, w, x))
    }, qe = (u, a, g, _, b, v, R, w, x) => {
        u = u || It, a = a || It;
        const E = u.length,
            j = a.length,
            T = Math.min(E, j);
        let B;
        for (B = 0; B < T; B++) {
            const H = a[B] = x ? Je(a[B]) : He(a[B]);
            A(u[B], H, g, null, b, v, R, w, x)
        }
        E > j ? xe(u, b, v, !0, !1, T) : Ie(a, g, _, b, v, R, w, x, T)
    }, rt = (u, a, g, _, b, v, R, w, x) => {
        let E = 0;
        const j = a.length;
        let T = u.length - 1,
            B = j - 1;
        for (; E <= T && E <= B;) {
            const H = u[E],
                q = a[E] = x ? Je(a[E]) : He(a[E]);
            if (Gt(H, q)) A(H, q, g, null, b, v, R, w, x);
            else break;
            E++
        }
        for (; E <= T && E <= B;) {
            const H = u[T],
                q = a[B] = x ? Je(a[B]) : He(a[B]);
            if (Gt(H, q)) A(H, q, g, null, b, v, R, w, x);
            else break;
            T--, B--
        }
        if (E > T) {
            if (E <= B) {
                const H = B + 1,
                    q = H < j ? a[H].el : _;
                for (; E <= B;) A(null, a[E] = x ? Je(a[E]) : He(a[E]), g, q, b, v, R, w, x), E++
            }
        } else if (E > B)
            for (; E <= T;) he(u[E], b, v, !0), E++;
        else {
            const H = E,
                q = E,
                Z = new Map;
            for (E = q; E <= B; E++) {
                const be = a[E] = x ? Je(a[E]) : He(a[E]);
                be.key != null && Z.set(be.key, E)
            }
            let z, ge = 0;
            const me = B - q + 1;
            let De = !1,
                Be = 0;
            const Vt = new Array(me);
            for (E = 0; E < me; E++) Vt[E] = 0;
            for (E = H; E <= T; E++) {
                const be = u[E];
                if (ge >= me) {
                    he(be, b, v, !0);
                    continue
                }
                let Le;
                if (be.key != null) Le = Z.get(be.key);
                else
                    for (z = q; z <= B; z++)
                        if (Vt[z - q] === 0 && Gt(be, a[z])) {
                            Le = z;
                            break
                        }
                Le === void 0 ? he(be, b, v, !0) : (Vt[Le - q] = E + 1, Le >= Be ? Be = Le : De = !0, A(be, a[Le], g, null, b, v, R, w, x), ge++)
            }
            const ks = De ? zl(Vt) : It;
            for (z = ks.length - 1, E = me - 1; E >= 0; E--) {
                const be = q + E,
                    Le = a[be],
                    Ws = a[be + 1],
                    Js = be + 1 < j ? Ws.el || Vo(Ws) : _;
                Vt[E] === 0 ? A(null, Le, g, Js, b, v, R, w, x) : De && (z < 0 || E !== ks[z] ? Me(Le, g, Js, 2) : z--)
            }
        }
    }, Me = (u, a, g, _, b = null) => {
        const {
            el: v,
            type: R,
            transition: w,
            children: x,
            shapeFlag: E
        } = u;
        if (E & 6) {
            Me(u.component.subTree, a, g, _);
            return
        }
        if (E & 128) {
            u.suspense.move(a, g, _);
            return
        }
        if (E & 64) {
            R.move(u, a, g, D);
            return
        }
        if (R === We) {
            s(v, a, g);
            for (let T = 0; T < x.length; T++) Me(x[T], a, g, _);
            s(u.anchor, a, g);
            return
        }
        if (R === yn) {
            N(u, a, g);
            return
        }
        if (_ !== 2 && E & 1 && w)
            if (_ === 0) w.beforeEnter(v), s(v, a, g), _e(() => w.enter(v), b);
            else {
                const {
                    leave: T,
                    delayLeave: B,
                    afterLeave: H
                } = w, q = () => {
                    u.ctx.isUnmounted ? r(v) : s(v, a, g)
                }, Z = () => {
                    v._isLeaving && v[ul](!0), T(v, () => {
                        q(), H && H()
                    })
                };
                B ? B(v, q, Z) : Z()
            }
        else s(v, a, g)
    }, he = (u, a, g, _ = !1, b = !1) => {
        const {
            type: v,
            props: R,
            ref: w,
            children: x,
            dynamicChildren: E,
            shapeFlag: j,
            patchFlag: T,
            dirs: B,
            cacheIndex: H
        } = u;
        if (T === -2 && (b = !1), w != null && (Xe(), Yt(w, null, g, u, !0), Ze()), H != null && (a.renderCache[H] = void 0), j & 256) {
            a.ctx.deactivate(u);
            return
        }
        const q = j & 1 && B,
            Z = !Xt(u);
        let z;
        if (Z && (z = R && R.onVnodeBeforeUnmount) && Fe(z, a, u), j & 6) gt(u.component, g, _);
        else {
            if (j & 128) {
                u.suspense.unmount(g, _);
                return
            }
            q && mt(u, null, a, "beforeUnmount"), j & 64 ? u.type.remove(u, a, g, D, _) : E && !E.hasOnce && (v !== We || T > 0 && T & 64) ? xe(E, a, g, !1, !0) : (v === We && T & 384 || !b && j & 16) && xe(x, a, g), _ && wt(u)
        }(Z && (z = R && R.onVnodeUnmounted) || q) && _e(() => {
            z && Fe(z, a, u), q && mt(u, null, a, "unmounted")
        }, g)
    }, wt = u => {
        const {
            type: a,
            el: g,
            anchor: _,
            transition: b
        } = u;
        if (a === We) {
            St(g, _);
            return
        }
        if (a === yn) {
            P(u);
            return
        }
        const v = () => {
            r(g), b && !b.persisted && b.afterLeave && b.afterLeave()
        };
        if (u.shapeFlag & 1 && b && !b.persisted) {
            const {
                leave: R,
                delayLeave: w
            } = b, x = () => R(g, v);
            w ? w(u.el, v, x) : x()
        } else v()
    }, St = (u, a) => {
        let g;
        for (; u !== a;) g = m(u), r(u), u = g;
        r(a)
    }, gt = (u, a, g) => {
        const {
            bum: _,
            scope: b,
            job: v,
            subTree: R,
            um: w,
            m: x,
            a: E
        } = u;
        ar(x), ar(E), _ && zn(_), b.stop(), v && (v.flags |= 8, he(R, u, a, g)), w && _e(w, a), _e(() => {
            u.isUnmounted = !0
        }, a)
    }, xe = (u, a, g, _ = !1, b = !1, v = 0) => {
        for (let R = v; R < u.length; R++) he(u[R], a, g, _, b)
    }, y = u => {
        if (u.shapeFlag & 6) return y(u.component.subTree);
        if (u.shapeFlag & 128) return u.suspense.next();
        const a = m(u.anchor || u.el),
            g = a && a[ll];
        return g ? m(g) : a
    };
    let I = !1;
    const C = (u, a, g) => {
            let _;
            u == null ? a._vnode && (he(a._vnode, null, null, !0), _ = a._vnode.component) : A(a._vnode || null, u, a, null, null, null, g), a._vnode = u, I || (I = !0, Zs(_), mo(), I = !1)
        },
        D = {
            p: A,
            um: he,
            m: Me,
            r: wt,
            mt: Ht,
            mc: Ie,
            pc: $,
            pbc: Pe,
            n: y,
            o: e
        };
    return {
        render: C,
        hydrate: void 0,
        createApp: Nl(C)
    }
}

function ts({
    type: e,
    props: t
}, n) {
    return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n
}

function _t({
    effect: e,
    job: t
}, n) {
    n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5)
}

function Jl(e, t) {
    return (!e || e && !e.pendingBranch) && t && !t.persisted
}

function jo(e, t, n = !1) {
    const s = e.children,
        r = t.children;
    if (V(s) && V(r))
        for (let o = 0; o < s.length; o++) {
            const i = s[o];
            let l = r[o];
            l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = r[o] = Je(r[o]), l.el = i.el), !n && l.patchFlag !== -2 && jo(i, l)), l.type === Kn && (l.patchFlag === -1 && (l = r[o] = Je(l)), l.el = i.el), l.type === pt && !l.el && (l.el = i.el)
        }
}

function zl(e) {
    const t = e.slice(),
        n = [0];
    let s, r, o, i, l;
    const c = e.length;
    for (s = 0; s < c; s++) {
        const d = e[s];
        if (d !== 0) {
            if (r = n[n.length - 1], e[r] < d) {
                t[s] = r, n.push(s);
                continue
            }
            for (o = 0, i = n.length - 1; o < i;) l = o + i >> 1, e[n[l]] < d ? o = l + 1 : i = l;
            d < e[n[o]] && (o > 0 && (t[s] = n[o - 1]), n[o] = s)
        }
    }
    for (o = n.length, i = n[o - 1]; o-- > 0;) n[o] = i, i = t[i];
    return n
}

function Ho(e) {
    const t = e.subTree.component;
    if (t) return t.asyncDep && !t.asyncResolved ? t : Ho(t)
}

function ar(e) {
    if (e)
        for (let t = 0; t < e.length; t++) e[t].flags |= 8
}

function Vo(e) {
    if (e.placeholder) return e.placeholder;
    const t = e.component;
    return t ? Vo(t.subTree) : null
}
const Uo = e => e.__isSuspense;

function Ql(e, t) {
    t && t.pendingBranch ? V(e) ? t.effects.push(...e) : t.effects.push(e) : tl(e)
}
const We = Symbol.for("v-fgt"),
    Kn = Symbol.for("v-txt"),
    pt = Symbol.for("v-cmt"),
    yn = Symbol.for("v-stc"),
    en = [];
let Ae = null;

function at(e = !1) {
    en.push(Ae = e ? null : [])
}

function Yl() {
    en.pop(), Ae = en[en.length - 1] || null
}
let ln = 1;

function Bt(e, t = !1) {
    ln += e, e < 0 && Ae && t && (Ae.hasOnce = !0)
}

function Go(e) {
    return e.dynamicChildren = ln > 0 ? Ae || It : null, Yl(), ln > 0 && Ae && Ae.push(e), e
}

function Ot(e, t, n, s, r, o) {
    return Go(M(e, t, n, s, r, o, !0))
}

function qo(e, t, n, s, r) {
    return Go(ye(e, t, n, s, r, !0))
}

function Tn(e) {
    return e ? e.__v_isVNode === !0 : !1
}

function Gt(e, t) {
    return e.type === t.type && e.key === t.key
}
const Ko = ({
        key: e
    }) => e ? ? null,
    bn = ({
        ref: e,
        ref_key: t,
        ref_for: n
    }) => (typeof e == "number" && (e = "" + e), e != null ? re(e) || ae(e) || U(e) ? {
        i: Ee,
        r: e,
        k: t,
        f: !!n
    } : e : null);

function M(e, t = null, n = null, s = 0, r = null, o = e === We ? 0 : 1, i = !1, l = !1) {
    const c = {
        __v_isVNode: !0,
        __v_skip: !0,
        type: e,
        props: t,
        key: t && Ko(t),
        ref: t && bn(t),
        scopeId: vo,
        slotScopeIds: null,
        children: n,
        component: null,
        suspense: null,
        ssContent: null,
        ssFallback: null,
        dirs: null,
        transition: null,
        el: null,
        anchor: null,
        target: null,
        targetStart: null,
        targetAnchor: null,
        staticCount: 0,
        shapeFlag: o,
        patchFlag: s,
        dynamicProps: r,
        dynamicChildren: null,
        appContext: null,
        ctx: Ee
    };
    return l ? (Gs(c, n), o & 128 && e.normalize(c)) : n && (c.shapeFlag |= re(n) ? 8 : 16), ln > 0 && !i && Ae && (c.patchFlag > 0 || o & 6) && c.patchFlag !== 32 && Ae.push(c), c
}
const ye = Xl;

function Xl(e, t = null, n = null, s = 0, r = null, o = !1) {
    if ((!e || e === xl) && (e = pt), Tn(e)) {
        const l = Lt(e, t, !0);
        return n && Gs(l, n), ln > 0 && !o && Ae && (l.shapeFlag & 6 ? Ae[Ae.indexOf(e)] = l : Ae.push(l)), l.patchFlag = -2, l
    }
    if (ac(e) && (e = e.__vccOpts), t) {
        t = Zl(t);
        let {
            class: l,
            style: c
        } = t;
        l && !re(l) && (t.class = Cs(l)), Y(c) && (Ls(c) && !V(c) && (c = le({}, c)), t.style = jn(c))
    }
    const i = re(e) ? 1 : Uo(e) ? 128 : cl(e) ? 64 : Y(e) ? 4 : U(e) ? 2 : 0;
    return M(e, t, n, s, r, i, o, !0)
}

function Zl(e) {
    return e ? Ls(e) || No(e) ? le({}, e) : e : null
}

function Lt(e, t, n = !1, s = !1) {
    const {
        props: r,
        ref: o,
        patchFlag: i,
        children: l,
        transition: c
    } = e, d = t ? ec(r || {}, t) : r, f = {
        __v_isVNode: !0,
        __v_skip: !0,
        type: e.type,
        props: d,
        key: d && Ko(d),
        ref: t && t.ref ? n && o ? V(o) ? o.concat(bn(t)) : [o, bn(t)] : bn(t) : o,
        scopeId: e.scopeId,
        slotScopeIds: e.slotScopeIds,
        children: l,
        target: e.target,
        targetStart: e.targetStart,
        targetAnchor: e.targetAnchor,
        staticCount: e.staticCount,
        shapeFlag: e.shapeFlag,
        patchFlag: t && e.type !== We ? i === -1 ? 16 : i | 16 : i,
        dynamicProps: e.dynamicProps,
        dynamicChildren: e.dynamicChildren,
        appContext: e.appContext,
        dirs: e.dirs,
        transition: c,
        component: e.component,
        suspense: e.suspense,
        ssContent: e.ssContent && Lt(e.ssContent),
        ssFallback: e.ssFallback && Lt(e.ssFallback),
        placeholder: e.placeholder,
        el: e.el,
        anchor: e.anchor,
        ctx: e.ctx,
        ce: e.ce
    };
    return c && s && js(f, c.clone(f)), f
}

function En(e = " ", t = 0) {
    return ye(Kn, null, e, t)
}

function $o(e, t) {
    const n = ye(yn, null, e);
    return n.staticCount = t, n
}

function mn(e = "", t = !1) {
    return t ? (at(), qo(pt, null, e)) : ye(pt, null, e)
}

function He(e) {
    return e == null || typeof e == "boolean" ? ye(pt) : V(e) ? ye(We, null, e.slice()) : Tn(e) ? Je(e) : ye(Kn, null, String(e))
}

function Je(e) {
    return e.el === null && e.patchFlag !== -1 || e.memo ? e : Lt(e)
}

function Gs(e, t) {
    let n = 0;
    const {
        shapeFlag: s
    } = e;
    if (t == null) t = null;
    else if (V(t)) n = 16;
    else if (typeof t == "object")
        if (s & 65) {
            const r = t.default;
            r && (r._c && (r._d = !1), Gs(e, r()), r._c && (r._d = !0));
            return
        } else {
            n = 32;
            const r = t._;
            !r && !No(t) ? t._ctx = Ee : r === 3 && Ee && (Ee.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024))
        }
    else U(t) ? (t = {
        default: t,
        _ctx: Ee
    }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [En(t)]) : n = 8);
    e.children = t, e.shapeFlag |= n
}

function ec(...e) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
        const s = e[n];
        for (const r in s)
            if (r === "class") t.class !== s.class && (t.class = Cs([t.class, s.class]));
            else if (r === "style") t.style = jn([t.style, s.style]);
        else if (Dn(r)) {
            const o = t[r],
                i = s[r];
            i && o !== i && !(V(o) && o.includes(i)) && (t[r] = o ? [].concat(o, i) : i)
        } else r !== "" && (t[r] = s[r])
    }
    return t
}

function Fe(e, t, n, s = null) {
    Ge(e, t, 7, [n, s])
}
const tc = Co();
let nc = 0;

function sc(e, t, n) {
    const s = e.type,
        r = (t ? t.appContext : e.appContext) || tc,
        o = {
            uid: nc++,
            vnode: e,
            type: s,
            parent: t,
            appContext: r,
            root: null,
            next: null,
            subTree: null,
            effect: null,
            update: null,
            job: null,
            scope: new Si(!0),
            render: null,
            proxy: null,
            exposed: null,
            exposeProxy: null,
            withProxy: null,
            provides: t ? t.provides : Object.create(r.provides),
            ids: t ? t.ids : ["", 0, 0],
            accessCache: null,
            renderCache: [],
            components: null,
            directives: null,
            propsOptions: Do(s, r),
            emitsOptions: Oo(s, r),
            emit: null,
            emitted: null,
            propsDefaults: X,
            inheritAttrs: s.inheritAttrs,
            ctx: X,
            data: X,
            props: X,
            attrs: X,
            slots: X,
            refs: X,
            setupState: X,
            setupContext: null,
            suspense: n,
            suspenseId: n ? n.pendingId : 0,
            asyncDep: null,
            asyncResolved: !1,
            isMounted: !1,
            isUnmounted: !1,
            isDeactivated: !1,
            bc: null,
            c: null,
            bm: null,
            m: null,
            bu: null,
            u: null,
            um: null,
            bum: null,
            da: null,
            a: null,
            rtg: null,
            rtc: null,
            ec: null,
            sp: null
        };
    return o.ctx = {
        _: o
    }, o.root = t ? t.root : o, o.emit = Dl.bind(null, o), e.ce && e.ce(o), o
}
let ue = null;
const rc = () => ue || Ee;
let In, _s; {
    const e = Fn(),
        t = (n, s) => {
            let r;
            return (r = e[n]) || (r = e[n] = []), r.push(s), o => {
                r.length > 1 ? r.forEach(i => i(o)) : r[0](o)
            }
        };
    In = t("__VUE_INSTANCE_SETTERS__", n => ue = n), _s = t("__VUE_SSR_SETTERS__", n => cn = n)
}
const dn = e => {
        const t = ue;
        return In(e), e.scope.on(), () => {
            e.scope.off(), In(t)
        }
    },
    fr = () => {
        ue && ue.scope.off(), In(null)
    };

function ko(e) {
    return e.vnode.shapeFlag & 4
}
let cn = !1;

function oc(e, t = !1, n = !1) {
    t && _s(t);
    const {
        props: s,
        children: r
    } = e.vnode, o = ko(e);
    Vl(e, s, o, t), Kl(e, r, n || t);
    const i = o ? ic(e, t) : void 0;
    return t && _s(!1), i
}

function ic(e, t) {
    const n = e.type;
    e.accessCache = Object.create(null), e.proxy = new Proxy(e.ctx, Sl);
    const {
        setup: s
    } = n;
    if (s) {
        Xe();
        const r = e.setupContext = s.length > 1 ? cc(e) : null,
            o = dn(e),
            i = fn(s, e, 0, [e.props, r]),
            l = qr(i);
        if (Ze(), o(), (l || e.sp) && !Xt(e) && Ao(e), l) {
            if (i.then(fr, fr), t) return i.then(c => {
                dr(e, c)
            }).catch(c => {
                Vn(c, e, 0)
            });
            e.asyncDep = i
        } else dr(e, i)
    } else Wo(e)
}

function dr(e, t, n) {
    U(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Y(t) && (e.setupState = po(t)), Wo(e)
}

function Wo(e, t, n) {
    const s = e.type;
    e.render || (e.render = s.render || Ve); {
        const r = dn(e);
        Xe();
        try {
            Rl(e)
        } finally {
            Ze(), r()
        }
    }
}
const lc = {
    get(e, t) {
        return ce(e, "get", ""), e[t]
    }
};

function cc(e) {
    const t = n => {
        e.exposed = n || {}
    };
    return {
        attrs: new Proxy(e.attrs, lc),
        slots: e.slots,
        emit: e.emit,
        expose: t
    }
}

function $n(e) {
    return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(po($i(e.exposed)), {
        get(t, n) {
            if (n in t) return t[n];
            if (n in Zt) return Zt[n](e)
        },
        has(t, n) {
            return n in t || n in Zt
        }
    })) : e.proxy
}

function uc(e, t = !0) {
    return U(e) ? e.displayName || e.name : e.name || t && e.__name
}

function ac(e) {
    return U(e) && "__vccOpts" in e
}
const we = (e, t) => Qi(e, t, cn);

function Jo(e, t, n) {
    try {
        Bt(-1);
        const s = arguments.length;
        return s === 2 ? Y(t) && !V(t) ? Tn(t) ? ye(e, null, [t]) : ye(e, t) : ye(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && Tn(n) && (n = [n]), ye(e, t, n))
    } finally {
        Bt(1)
    }
}
const fc = "3.5.28";
/**
 * @vue/runtime-dom v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/
let vs;
const pr = typeof window < "u" && window.trustedTypes;
if (pr) try {
    vs = pr.createPolicy("vue", {
        createHTML: e => e
    })
} catch {}
const zo = vs ? e => vs.createHTML(e) : e => e,
    dc = "http://www.w3.org/2000/svg",
    pc = "http://www.w3.org/1998/Math/MathML",
    ke = typeof document < "u" ? document : null,
    hr = ke && ke.createElement("template"),
    hc = {
        insert: (e, t, n) => {
            t.insertBefore(e, n || null)
        },
        remove: e => {
            const t = e.parentNode;
            t && t.removeChild(e)
        },
        createElement: (e, t, n, s) => {
            const r = t === "svg" ? ke.createElementNS(dc, e) : t === "mathml" ? ke.createElementNS(pc, e) : n ? ke.createElement(e, {
                is: n
            }) : ke.createElement(e);
            return e === "select" && s && s.multiple != null && r.setAttribute("multiple", s.multiple), r
        },
        createText: e => ke.createTextNode(e),
        createComment: e => ke.createComment(e),
        setText: (e, t) => {
            e.nodeValue = t
        },
        setElementText: (e, t) => {
            e.textContent = t
        },
        parentNode: e => e.parentNode,
        nextSibling: e => e.nextSibling,
        querySelector: e => ke.querySelector(e),
        setScopeId(e, t) {
            e.setAttribute(t, "")
        },
        insertStaticContent(e, t, n, s, r, o) {
            const i = n ? n.previousSibling : t.lastChild;
            if (r && (r === o || r.nextSibling))
                for (; t.insertBefore(r.cloneNode(!0), n), !(r === o || !(r = r.nextSibling)););
            else {
                hr.innerHTML = zo(s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e);
                const l = hr.content;
                if (s === "svg" || s === "mathml") {
                    const c = l.firstChild;
                    for (; c.firstChild;) l.appendChild(c.firstChild);
                    l.removeChild(c)
                }
                t.insertBefore(l, n)
            }
            return [i ? i.nextSibling : t.firstChild, n ? n.previousSibling : t.lastChild]
        }
    },
    gc = Symbol("_vtc");

function mc(e, t, n) {
    const s = e[gc];
    s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t
}
const Pn = Symbol("_vod"),
    Qo = Symbol("_vsh"),
    _c = {
        name: "show",
        beforeMount(e, {
            value: t
        }, {
            transition: n
        }) {
            e[Pn] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : qt(e, t)
        },
        mounted(e, {
            value: t
        }, {
            transition: n
        }) {
            n && t && n.enter(e)
        },
        updated(e, {
            value: t,
            oldValue: n
        }, {
            transition: s
        }) {
            !t != !n && (s ? t ? (s.beforeEnter(e), qt(e, !0), s.enter(e)) : s.leave(e, () => {
                qt(e, !1)
            }) : qt(e, t))
        },
        beforeUnmount(e, {
            value: t
        }) {
            qt(e, t)
        }
    };

function qt(e, t) {
    e.style.display = t ? e[Pn] : "none", e[Qo] = !t
}
const vc = Symbol(""),
    yc = /(?:^|;)\s*display\s*:/;

function bc(e, t, n) {
    const s = e.style,
        r = re(n);
    let o = !1;
    if (n && !r) {
        if (t)
            if (re(t))
                for (const i of t.split(";")) {
                    const l = i.slice(0, i.indexOf(":")).trim();
                    n[l] == null && An(s, l, "")
                } else
                    for (const i in t) n[i] == null && An(s, i, "");
        for (const i in n) i === "display" && (o = !0), An(s, i, n[i])
    } else if (r) {
        if (t !== n) {
            const i = s[vc];
            i && (n += ";" + i), s.cssText = n, o = yc.test(n)
        }
    } else t && e.removeAttribute("style");
    Pn in e && (e[Pn] = o ? s.display : "", e[Qo] && (s.display = "none"))
}
const gr = /\s*!important$/;

function An(e, t, n) {
    if (V(n)) n.forEach(s => An(e, t, s));
    else if (n == null && (n = ""), t.startsWith("--")) e.setProperty(t, n);
    else {
        const s = Ec(e, t);
        gr.test(n) ? e.setProperty(Et(s), n.replace(gr, ""), "important") : e[s] = n
    }
}
const mr = ["Webkit", "Moz", "ms"],
    ns = {};

function Ec(e, t) {
    const n = ns[t];
    if (n) return n;
    let s = Se(t);
    if (s !== "filter" && s in e) return ns[t] = s;
    s = Ln(s);
    for (let r = 0; r < mr.length; r++) {
        const o = mr[r] + s;
        if (o in e) return ns[t] = o
    }
    return t
}
const _r = "http://www.w3.org/1999/xlink";

function vr(e, t, n, s, r, o = xi(t)) {
    s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(_r, t.slice(6, t.length)) : e.setAttributeNS(_r, t, n) : n == null || o && !Wr(n) ? e.removeAttribute(t) : e.setAttribute(t, o ? "" : Ue(n) ? String(n) : n)
}

function yr(e, t, n, s, r) {
    if (t === "innerHTML" || t === "textContent") {
        n != null && (e[t] = t === "innerHTML" ? zo(n) : n);
        return
    }
    const o = e.tagName;
    if (t === "value" && o !== "PROGRESS" && !o.includes("-")) {
        const l = o === "OPTION" ? e.getAttribute("value") || "" : e.value,
            c = n == null ? e.type === "checkbox" ? "on" : "" : String(n);
        (l !== c || !("_value" in e)) && (e.value = c), n == null && e.removeAttribute(t), e._value = n;
        return
    }
    let i = !1;
    if (n === "" || n == null) {
        const l = typeof e[t];
        l === "boolean" ? n = Wr(n) : n == null && l === "string" ? (n = "", i = !0) : l === "number" && (n = 0, i = !0)
    }
    try {
        e[t] = n
    } catch {}
    i && e.removeAttribute(r || t)
}

function Ac(e, t, n, s) {
    e.addEventListener(t, n, s)
}

function xc(e, t, n, s) {
    e.removeEventListener(t, n, s)
}
const br = Symbol("_vei");

function wc(e, t, n, s, r = null) {
    const o = e[br] || (e[br] = {}),
        i = o[t];
    if (s && i) i.value = s;
    else {
        const [l, c] = Sc(t);
        if (s) {
            const d = o[t] = Oc(s, r);
            Ac(e, l, d, c)
        } else i && (xc(e, l, i, c), o[t] = void 0)
    }
}
const Er = /(?:Once|Passive|Capture)$/;

function Sc(e) {
    let t;
    if (Er.test(e)) {
        t = {};
        let s;
        for (; s = e.match(Er);) e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0
    }
    return [e[2] === ":" ? e.slice(3) : Et(e.slice(2)), t]
}
let ss = 0;
const Rc = Promise.resolve(),
    Cc = () => ss || (Rc.then(() => ss = 0), ss = Date.now());

function Oc(e, t) {
    const n = s => {
        if (!s._vts) s._vts = Date.now();
        else if (s._vts <= n.attached) return;
        Ge(Tc(s, n.value), t, 5, [s])
    };
    return n.value = e, n.attached = Cc(), n
}

function Tc(e, t) {
    if (V(t)) {
        const n = e.stopImmediatePropagation;
        return e.stopImmediatePropagation = () => {
            n.call(e), e._stopped = !0
        }, t.map(s => r => !r._stopped && s && s(r))
    } else return t
}
const Ar = e => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123,
    Ic = (e, t, n, s, r, o) => {
        const i = r === "svg";
        t === "class" ? mc(e, s, i) : t === "style" ? bc(e, n, s) : Dn(t) ? ws(t) || wc(e, t, n, s, o) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Pc(e, t, s, i)) ? (yr(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && vr(e, t, s, i, o, t !== "value")) : e._isVueCE && (/[A-Z]/.test(t) || !re(s)) ? yr(e, Se(t), s, o, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), vr(e, t, s, i))
    };

function Pc(e, t, n, s) {
    if (s) return !!(t === "innerHTML" || t === "textContent" || t in e && Ar(t) && U(n));
    if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA") return !1;
    if (t === "width" || t === "height") {
        const r = e.tagName;
        if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE") return !1
    }
    return Ar(t) && re(n) ? !1 : t in e
}
const Nc = le({
    patchProp: Ic
}, hc);
let xr;

function Mc() {
    return xr || (xr = kl(Nc))
}
const Dc = (...e) => {
    const t = Mc().createApp(...e),
        {
            mount: n
        } = t;
    return t.mount = s => {
        const r = Lc(s);
        if (!r) return;
        const o = t._component;
        !U(o) && !o.render && !o.template && (o.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
        const i = n(r, !1, Bc(r));
        return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), i
    }, t
};

function Bc(e) {
    if (e instanceof SVGElement) return "svg";
    if (typeof MathMLElement == "function" && e instanceof MathMLElement) return "mathml"
}

function Lc(e) {
    return re(e) ? document.querySelector(e) : e
}
const Fc = (e, t) => {
        const n = e.__vccOpts || e;
        for (const [s, r] of t) n[s] = r;
        return n
    },
    jc = {};

function Hc(e, t) {
    const n = Al("router-view");
    return at(), qo(n)
}
const Vc = Fc(jc, [
    ["render", Hc]
]);
/*!
 * vue-router v4.6.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
const Tt = typeof document < "u";

function Yo(e) {
    return typeof e == "object" || "displayName" in e || "props" in e || "__vccOpts" in e
}

function Uc(e) {
    return e.__esModule || e[Symbol.toStringTag] === "Module" || e.default && Yo(e.default)
}
const k = Object.assign;

function rs(e, t) {
    const n = {};
    for (const s in t) {
        const r = t[s];
        n[s] = Te(r) ? r.map(e) : e(r)
    }
    return n
}
const tn = () => {},
    Te = Array.isArray;

function wr(e, t) {
    const n = {};
    for (const s in e) n[s] = s in t ? t[s] : e[s];
    return n
}
const Xo = /#/g,
    Gc = /&/g,
    qc = /\//g,
    Kc = /=/g,
    $c = /\?/g,
    Zo = /\+/g,
    kc = /%5B/g,
    Wc = /%5D/g,
    ei = /%5E/g,
    Jc = /%60/g,
    ti = /%7B/g,
    zc = /%7C/g,
    ni = /%7D/g,
    Qc = /%20/g;

function qs(e) {
    return e == null ? "" : encodeURI("" + e).replace(zc, "|").replace(kc, "[").replace(Wc, "]")
}

function Yc(e) {
    return qs(e).replace(ti, "{").replace(ni, "}").replace(ei, "^")
}

function ys(e) {
    return qs(e).replace(Zo, "%2B").replace(Qc, "+").replace(Xo, "%23").replace(Gc, "%26").replace(Jc, "`").replace(ti, "{").replace(ni, "}").replace(ei, "^")
}

function Xc(e) {
    return ys(e).replace(Kc, "%3D")
}

function Zc(e) {
    return qs(e).replace(Xo, "%23").replace($c, "%3F")
}

function eu(e) {
    return Zc(e).replace(qc, "%2F")
}

function un(e) {
    if (e == null) return null;
    try {
        return decodeURIComponent("" + e)
    } catch {}
    return "" + e
}
const tu = /\/$/,
    nu = e => e.replace(tu, "");

function os(e, t, n = "/") {
    let s, r = {},
        o = "",
        i = "";
    const l = t.indexOf("#");
    let c = t.indexOf("?");
    return c = l >= 0 && c > l ? -1 : c, c >= 0 && (s = t.slice(0, c), o = t.slice(c, l > 0 ? l : t.length), r = e(o.slice(1))), l >= 0 && (s = s || t.slice(0, l), i = t.slice(l, t.length)), s = iu(s ? ? t, n), {
        fullPath: s + o + i,
        path: s,
        query: r,
        hash: un(i)
    }
}

function su(e, t) {
    const n = t.query ? e(t.query) : "";
    return t.path + (n && "?") + n + (t.hash || "")
}

function Sr(e, t) {
    return !t || !e.toLowerCase().startsWith(t.toLowerCase()) ? e : e.slice(t.length) || "/"
}

function ru(e, t, n) {
    const s = t.matched.length - 1,
        r = n.matched.length - 1;
    return s > -1 && s === r && Ft(t.matched[s], n.matched[r]) && si(t.params, n.params) && e(t.query) === e(n.query) && t.hash === n.hash
}

function Ft(e, t) {
    return (e.aliasOf || e) === (t.aliasOf || t)
}

function si(e, t) {
    if (Object.keys(e).length !== Object.keys(t).length) return !1;
    for (var n in e)
        if (!ou(e[n], t[n])) return !1;
    return !0
}

function ou(e, t) {
    return Te(e) ? Rr(e, t) : Te(t) ? Rr(t, e) : (e == null ? void 0 : e.valueOf()) === (t == null ? void 0 : t.valueOf())
}

function Rr(e, t) {
    return Te(t) ? e.length === t.length && e.every((n, s) => n === t[s]) : e.length === 1 && e[0] === t
}

function iu(e, t) {
    if (e.startsWith("/")) return e;
    if (!e) return t;
    const n = t.split("/"),
        s = e.split("/"),
        r = s[s.length - 1];
    (r === ".." || r === ".") && s.push("");
    let o = n.length - 1,
        i, l;
    for (i = 0; i < s.length; i++)
        if (l = s[i], l !== ".")
            if (l === "..") o > 1 && o--;
            else break;
    return n.slice(0, o).join("/") + "/" + s.slice(i).join("/")
}
const ot = {
    path: "/",
    name: void 0,
    params: {},
    query: {},
    hash: "",
    fullPath: "/",
    matched: [],
    meta: {},
    redirectedFrom: void 0
};
let bs = function(e) {
        return e.pop = "pop", e.push = "push", e
    }({}),
    is = function(e) {
        return e.back = "back", e.forward = "forward", e.unknown = "", e
    }({});

function lu(e) {
    if (!e)
        if (Tt) {
            const t = document.querySelector("base");
            e = t && t.getAttribute("href") || "/", e = e.replace(/^\w+:\/\/[^\/]+/, "")
        } else e = "/";
    return e[0] !== "/" && e[0] !== "#" && (e = "/" + e), nu(e)
}
const cu = /^[^#]+#/;

function uu(e, t) {
    return e.replace(cu, "#") + t
}

function au(e, t) {
    const n = document.documentElement.getBoundingClientRect(),
        s = e.getBoundingClientRect();
    return {
        behavior: t.behavior,
        left: s.left - n.left - (t.left || 0),
        top: s.top - n.top - (t.top || 0)
    }
}
const kn = () => ({
    left: window.scrollX,
    top: window.scrollY
});

function fu(e) {
    let t;
    if ("el" in e) {
        const n = e.el,
            s = typeof n == "string" && n.startsWith("#"),
            r = typeof n == "string" ? s ? document.getElementById(n.slice(1)) : document.querySelector(n) : n;
        if (!r) return;
        t = au(r, e)
    } else t = e;
    "scrollBehavior" in document.documentElement.style ? window.scrollTo(t) : window.scrollTo(t.left != null ? t.left : window.scrollX, t.top != null ? t.top : window.scrollY)
}

function Cr(e, t) {
    return (history.state ? history.state.position - t : -1) + e
}
const Es = new Map;

function du(e, t) {
    Es.set(e, t)
}

function pu(e) {
    const t = Es.get(e);
    return Es.delete(e), t
}

function hu(e) {
    return typeof e == "string" || e && typeof e == "object"
}

function ri(e) {
    return typeof e == "string" || typeof e == "symbol"
}
let ne = function(e) {
    return e[e.MATCHER_NOT_FOUND = 1] = "MATCHER_NOT_FOUND", e[e.NAVIGATION_GUARD_REDIRECT = 2] = "NAVIGATION_GUARD_REDIRECT", e[e.NAVIGATION_ABORTED = 4] = "NAVIGATION_ABORTED", e[e.NAVIGATION_CANCELLED = 8] = "NAVIGATION_CANCELLED", e[e.NAVIGATION_DUPLICATED = 16] = "NAVIGATION_DUPLICATED", e
}({});
const oi = Symbol("");
ne.MATCHER_NOT_FOUND + "", ne.NAVIGATION_GUARD_REDIRECT + "", ne.NAVIGATION_ABORTED + "", ne.NAVIGATION_CANCELLED + "", ne.NAVIGATION_DUPLICATED + "";

function jt(e, t) {
    return k(new Error, {
        type: e,
        [oi]: !0
    }, t)
}

function $e(e, t) {
    return e instanceof Error && oi in e && (t == null || !!(e.type & t))
}
const gu = ["params", "query", "hash"];

function mu(e) {
    if (typeof e == "string") return e;
    if (e.path != null) return e.path;
    const t = {};
    for (const n of gu) n in e && (t[n] = e[n]);
    return JSON.stringify(t, null, 2)
}

function _u(e) {
    const t = {};
    if (e === "" || e === "?") return t;
    const n = (e[0] === "?" ? e.slice(1) : e).split("&");
    for (let s = 0; s < n.length; ++s) {
        const r = n[s].replace(Zo, " "),
            o = r.indexOf("="),
            i = un(o < 0 ? r : r.slice(0, o)),
            l = o < 0 ? null : un(r.slice(o + 1));
        if (i in t) {
            let c = t[i];
            Te(c) || (c = t[i] = [c]), c.push(l)
        } else t[i] = l
    }
    return t
}

function Or(e) {
    let t = "";
    for (let n in e) {
        const s = e[n];
        if (n = Xc(n), s == null) {
            s !== void 0 && (t += (t.length ? "&" : "") + n);
            continue
        }(Te(s) ? s.map(r => r && ys(r)) : [s && ys(s)]).forEach(r => {
            r !== void 0 && (t += (t.length ? "&" : "") + n, r != null && (t += "=" + r))
        })
    }
    return t
}

function vu(e) {
    const t = {};
    for (const n in e) {
        const s = e[n];
        s !== void 0 && (t[n] = Te(s) ? s.map(r => r == null ? null : "" + r) : s == null ? s : "" + s)
    }
    return t
}
const yu = Symbol(""),
    Tr = Symbol(""),
    Wn = Symbol(""),
    Ks = Symbol(""),
    As = Symbol("");

function Kt() {
    let e = [];

    function t(s) {
        return e.push(s), () => {
            const r = e.indexOf(s);
            r > -1 && e.splice(r, 1)
        }
    }

    function n() {
        e = []
    }
    return {
        add: t,
        list: () => e.slice(),
        reset: n
    }
}

function ct(e, t, n, s, r, o = i => i()) {
    const i = s && (s.enterCallbacks[r] = s.enterCallbacks[r] || []);
    return () => new Promise((l, c) => {
        const d = m => {
                m === !1 ? c(jt(ne.NAVIGATION_ABORTED, {
                    from: n,
                    to: t
                })) : m instanceof Error ? c(m) : hu(m) ? c(jt(ne.NAVIGATION_GUARD_REDIRECT, {
                    from: t,
                    to: m
                })) : (i && s.enterCallbacks[r] === i && typeof m == "function" && i.push(m), l())
            },
            f = o(() => e.call(s && s.instances[r], t, n, d));
        let p = Promise.resolve(f);
        e.length < 3 && (p = p.then(d)), p.catch(m => c(m))
    })
}

function ls(e, t, n, s, r = o => o()) {
    const o = [];
    for (const i of e)
        for (const l in i.components) {
            let c = i.components[l];
            if (!(t !== "beforeRouteEnter" && !i.instances[l]))
                if (Yo(c)) {
                    const d = (c.__vccOpts || c)[t];
                    d && o.push(ct(d, n, s, i, l, r))
                } else {
                    let d = c();
                    o.push(() => d.then(f => {
                        if (!f) throw new Error(`Couldn't resolve component "${l}" at "${i.path}"`);
                        const p = Uc(f) ? f.default : f;
                        i.mods[l] = f, i.components[l] = p;
                        const m = (p.__vccOpts || p)[t];
                        return m && ct(m, n, s, i, l, r)()
                    }))
                }
        }
    return o
}

function bu(e, t) {
    const n = [],
        s = [],
        r = [],
        o = Math.max(t.matched.length, e.matched.length);
    for (let i = 0; i < o; i++) {
        const l = t.matched[i];
        l && (e.matched.find(d => Ft(d, l)) ? s.push(l) : n.push(l));
        const c = e.matched[i];
        c && (t.matched.find(d => Ft(d, c)) || r.push(c))
    }
    return [n, s, r]
}
/*!
 * vue-router v4.6.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */
let Eu = () => location.protocol + "//" + location.host;

function ii(e, t) {
    const {
        pathname: n,
        search: s,
        hash: r
    } = t, o = e.indexOf("#");
    if (o > -1) {
        let i = r.includes(e.slice(o)) ? e.slice(o).length : 1,
            l = r.slice(i);
        return l[0] !== "/" && (l = "/" + l), Sr(l, "")
    }
    return Sr(n, e) + s + r
}

function Au(e, t, n, s) {
    let r = [],
        o = [],
        i = null;
    const l = ({
        state: m
    }) => {
        const h = ii(e, location),
            O = n.value,
            A = t.value;
        let L = 0;
        if (m) {
            if (n.value = h, t.value = m, i && i === O) {
                i = null;
                return
            }
            L = A ? m.position - A.position : 0
        } else s(h);
        r.forEach(F => {
            F(n.value, O, {
                delta: L,
                type: bs.pop,
                direction: L ? L > 0 ? is.forward : is.back : is.unknown
            })
        })
    };

    function c() {
        i = n.value
    }

    function d(m) {
        r.push(m);
        const h = () => {
            const O = r.indexOf(m);
            O > -1 && r.splice(O, 1)
        };
        return o.push(h), h
    }

    function f() {
        if (document.visibilityState === "hidden") {
            const {
                history: m
            } = window;
            if (!m.state) return;
            m.replaceState(k({}, m.state, {
                scroll: kn()
            }), "")
        }
    }

    function p() {
        for (const m of o) m();
        o = [], window.removeEventListener("popstate", l), window.removeEventListener("pagehide", f), document.removeEventListener("visibilitychange", f)
    }
    return window.addEventListener("popstate", l), window.addEventListener("pagehide", f), document.addEventListener("visibilitychange", f), {
        pauseListeners: c,
        listen: d,
        destroy: p
    }
}

function Ir(e, t, n, s = !1, r = !1) {
    return {
        back: e,
        current: t,
        forward: n,
        replaced: s,
        position: window.history.length,
        scroll: r ? kn() : null
    }
}

function xu(e) {
    const {
        history: t,
        location: n
    } = window, s = {
        value: ii(e, n)
    }, r = {
        value: t.state
    };
    r.value || o(s.value, {
        back: null,
        current: s.value,
        forward: null,
        position: t.length - 1,
        replaced: !0,
        scroll: null
    }, !0);

    function o(c, d, f) {
        const p = e.indexOf("#"),
            m = p > -1 ? (n.host && document.querySelector("base") ? e : e.slice(p)) + c : Eu() + e + c;
        try {
            t[f ? "replaceState" : "pushState"](d, "", m), r.value = d
        } catch (h) {
            console.error(h), n[f ? "replace" : "assign"](m)
        }
    }

    function i(c, d) {
        o(c, k({}, t.state, Ir(r.value.back, c, r.value.forward, !0), d, {
            position: r.value.position
        }), !0), s.value = c
    }

    function l(c, d) {
        const f = k({}, r.value, t.state, {
            forward: c,
            scroll: kn()
        });
        o(f.current, f, !0), o(c, k({}, Ir(s.value, c, null), {
            position: f.position + 1
        }, d), !1), s.value = c
    }
    return {
        location: s,
        state: r,
        push: l,
        replace: i
    }
}

function wu(e) {
    e = lu(e);
    const t = xu(e),
        n = Au(e, t.state, t.location, t.replace);

    function s(o, i = !0) {
        i || n.pauseListeners(), history.go(o)
    }
    const r = k({
        location: "",
        base: e,
        go: s,
        createHref: uu.bind(null, e)
    }, t, n);
    return Object.defineProperty(r, "location", {
        enumerable: !0,
        get: () => t.location.value
    }), Object.defineProperty(r, "state", {
        enumerable: !0,
        get: () => t.state.value
    }), r
}
let yt = function(e) {
    return e[e.Static = 0] = "Static", e[e.Param = 1] = "Param", e[e.Group = 2] = "Group", e
}({});
var se = function(e) {
    return e[e.Static = 0] = "Static", e[e.Param = 1] = "Param", e[e.ParamRegExp = 2] = "ParamRegExp", e[e.ParamRegExpEnd = 3] = "ParamRegExpEnd", e[e.EscapeNext = 4] = "EscapeNext", e
}(se || {});
const Su = {
        type: yt.Static,
        value: ""
    },
    Ru = /[a-zA-Z0-9_]/;

function Cu(e) {
    if (!e) return [
        []
    ];
    if (e === "/") return [
        [Su]
    ];
    if (!e.startsWith("/")) throw new Error(`Invalid path "${e}"`);

    function t(h) {
        throw new Error(`ERR (${n})/"${d}": ${h}`)
    }
    let n = se.Static,
        s = n;
    const r = [];
    let o;

    function i() {
        o && r.push(o), o = []
    }
    let l = 0,
        c, d = "",
        f = "";

    function p() {
        d && (n === se.Static ? o.push({
            type: yt.Static,
            value: d
        }) : n === se.Param || n === se.ParamRegExp || n === se.ParamRegExpEnd ? (o.length > 1 && (c === "*" || c === "+") && t(`A repeatable param (${d}) must be alone in its segment. eg: '/:ids+.`), o.push({
            type: yt.Param,
            value: d,
            regexp: f,
            repeatable: c === "*" || c === "+",
            optional: c === "*" || c === "?"
        })) : t("Invalid state to consume buffer"), d = "")
    }

    function m() {
        d += c
    }
    for (; l < e.length;) {
        if (c = e[l++], c === "\\" && n !== se.ParamRegExp) {
            s = n, n = se.EscapeNext;
            continue
        }
        switch (n) {
            case se.Static:
                c === "/" ? (d && p(), i()) : c === ":" ? (p(), n = se.Param) : m();
                break;
            case se.EscapeNext:
                m(), n = s;
                break;
            case se.Param:
                c === "(" ? n = se.ParamRegExp : Ru.test(c) ? m() : (p(), n = se.Static, c !== "*" && c !== "?" && c !== "+" && l--);
                break;
            case se.ParamRegExp:
                c === ")" ? f[f.length - 1] == "\\" ? f = f.slice(0, -1) + c : n = se.ParamRegExpEnd : f += c;
                break;
            case se.ParamRegExpEnd:
                p(), n = se.Static, c !== "*" && c !== "?" && c !== "+" && l--, f = "";
                break;
            default:
                t("Unknown state");
                break
        }
    }
    return n === se.ParamRegExp && t(`Unfinished custom RegExp for param "${d}"`), p(), i(), r
}
const Pr = "[^/]+?",
    Ou = {
        sensitive: !1,
        strict: !1,
        start: !0,
        end: !0
    };
var de = function(e) {
    return e[e._multiplier = 10] = "_multiplier", e[e.Root = 90] = "Root", e[e.Segment = 40] = "Segment", e[e.SubSegment = 30] = "SubSegment", e[e.Static = 40] = "Static", e[e.Dynamic = 20] = "Dynamic", e[e.BonusCustomRegExp = 10] = "BonusCustomRegExp", e[e.BonusWildcard = -50] = "BonusWildcard", e[e.BonusRepeatable = -20] = "BonusRepeatable", e[e.BonusOptional = -8] = "BonusOptional", e[e.BonusStrict = .7000000000000001] = "BonusStrict", e[e.BonusCaseSensitive = .25] = "BonusCaseSensitive", e
}(de || {});
const Tu = /[.+*?^${}()[\]/\\]/g;

function Iu(e, t) {
    const n = k({}, Ou, t),
        s = [];
    let r = n.start ? "^" : "";
    const o = [];
    for (const d of e) {
        const f = d.length ? [] : [de.Root];
        n.strict && !d.length && (r += "/");
        for (let p = 0; p < d.length; p++) {
            const m = d[p];
            let h = de.Segment + (n.sensitive ? de.BonusCaseSensitive : 0);
            if (m.type === yt.Static) p || (r += "/"), r += m.value.replace(Tu, "\\$&"), h += de.Static;
            else if (m.type === yt.Param) {
                const {
                    value: O,
                    repeatable: A,
                    optional: L,
                    regexp: F
                } = m;
                o.push({
                    name: O,
                    repeatable: A,
                    optional: L
                });
                const S = F || Pr;
                if (S !== Pr) {
                    h += de.BonusCustomRegExp;
                    try {
                        `${S}`
                    } catch (P) {
                        throw new Error(`Invalid custom RegExp for param "${O}" (${S}): ` + P.message)
                    }
                }
                let N = A ? `((?:${S})(?:/(?:${S}))*)` : `(${S})`;
                p || (N = L && d.length < 2 ? `(?:/${N})` : "/" + N), L && (N += "?"), r += N, h += de.Dynamic, L && (h += de.BonusOptional), A && (h += de.BonusRepeatable), S === ".*" && (h += de.BonusWildcard)
            }
            f.push(h)
        }
        s.push(f)
    }
    if (n.strict && n.end) {
        const d = s.length - 1;
        s[d][s[d].length - 1] += de.BonusStrict
    }
    n.strict || (r += "/?"), n.end ? r += "$" : n.strict && !r.endsWith("/") && (r += "(?:/|$)");
    const i = new RegExp(r, n.sensitive ? "" : "i");

    function l(d) {
        const f = d.match(i),
            p = {};
        if (!f) return null;
        for (let m = 1; m < f.length; m++) {
            const h = f[m] || "",
                O = o[m - 1];
            p[O.name] = h && O.repeatable ? h.split("/") : h
        }
        return p
    }

    function c(d) {
        let f = "",
            p = !1;
        for (const m of e) {
            (!p || !f.endsWith("/")) && (f += "/"), p = !1;
            for (const h of m)
                if (h.type === yt.Static) f += h.value;
                else if (h.type === yt.Param) {
                const {
                    value: O,
                    repeatable: A,
                    optional: L
                } = h, F = O in d ? d[O] : "";
                if (Te(F) && !A) throw new Error(`Provided param "${O}" is an array but it is not repeatable (* or + modifiers)`);
                const S = Te(F) ? F.join("/") : F;
                if (!S)
                    if (L) m.length < 2 && (f.endsWith("/") ? f = f.slice(0, -1) : p = !0);
                    else throw new Error(`Missing required param "${O}"`);
                f += S
            }
        }
        return f || "/"
    }
    return {
        re: i,
        score: s,
        keys: o,
        parse: l,
        stringify: c
    }
}

function Pu(e, t) {
    let n = 0;
    for (; n < e.length && n < t.length;) {
        const s = t[n] - e[n];
        if (s) return s;
        n++
    }
    return e.length < t.length ? e.length === 1 && e[0] === de.Static + de.Segment ? -1 : 1 : e.length > t.length ? t.length === 1 && t[0] === de.Static + de.Segment ? 1 : -1 : 0
}

function li(e, t) {
    let n = 0;
    const s = e.score,
        r = t.score;
    for (; n < s.length && n < r.length;) {
        const o = Pu(s[n], r[n]);
        if (o) return o;
        n++
    }
    if (Math.abs(r.length - s.length) === 1) {
        if (Nr(s)) return 1;
        if (Nr(r)) return -1
    }
    return r.length - s.length
}

function Nr(e) {
    const t = e[e.length - 1];
    return e.length > 0 && t[t.length - 1] < 0
}
const Nu = {
    strict: !1,
    end: !0,
    sensitive: !1
};

function Mu(e, t, n) {
    const s = Iu(Cu(e.path), n),
        r = k(s, {
            record: e,
            parent: t,
            children: [],
            alias: []
        });
    return t && !r.record.aliasOf == !t.record.aliasOf && t.children.push(r), r
}

function Du(e, t) {
    const n = [],
        s = new Map;
    t = wr(Nu, t);

    function r(p) {
        return s.get(p)
    }

    function o(p, m, h) {
        const O = !h,
            A = Dr(p);
        A.aliasOf = h && h.record;
        const L = wr(t, p),
            F = [A];
        if ("alias" in p) {
            const P = typeof p.alias == "string" ? [p.alias] : p.alias;
            for (const K of P) F.push(Dr(k({}, A, {
                components: h ? h.record.components : A.components,
                path: K,
                aliasOf: h ? h.record : A
            })))
        }
        let S, N;
        for (const P of F) {
            const {
                path: K
            } = P;
            if (m && K[0] !== "/") {
                const ie = m.record.path,
                    te = ie[ie.length - 1] === "/" ? "" : "/";
                P.path = m.record.path + (K && te + K)
            }
            if (S = Mu(P, m, L), h ? h.alias.push(S) : (N = N || S, N !== S && N.alias.push(S), O && p.name && !Br(S) && i(p.name)), ci(S) && c(S), A.children) {
                const ie = A.children;
                for (let te = 0; te < ie.length; te++) o(ie[te], S, h && h.children[te])
            }
            h = h || S
        }
        return N ? () => {
            i(N)
        } : tn
    }

    function i(p) {
        if (ri(p)) {
            const m = s.get(p);
            m && (s.delete(p), n.splice(n.indexOf(m), 1), m.children.forEach(i), m.alias.forEach(i))
        } else {
            const m = n.indexOf(p);
            m > -1 && (n.splice(m, 1), p.record.name && s.delete(p.record.name), p.children.forEach(i), p.alias.forEach(i))
        }
    }

    function l() {
        return n
    }

    function c(p) {
        const m = Fu(p, n);
        n.splice(m, 0, p), p.record.name && !Br(p) && s.set(p.record.name, p)
    }

    function d(p, m) {
        let h, O = {},
            A, L;
        if ("name" in p && p.name) {
            if (h = s.get(p.name), !h) throw jt(ne.MATCHER_NOT_FOUND, {
                location: p
            });
            L = h.record.name, O = k(Mr(m.params, h.keys.filter(N => !N.optional).concat(h.parent ? h.parent.keys.filter(N => N.optional) : []).map(N => N.name)), p.params && Mr(p.params, h.keys.map(N => N.name))), A = h.stringify(O)
        } else if (p.path != null) A = p.path, h = n.find(N => N.re.test(A)), h && (O = h.parse(A), L = h.record.name);
        else {
            if (h = m.name ? s.get(m.name) : n.find(N => N.re.test(m.path)), !h) throw jt(ne.MATCHER_NOT_FOUND, {
                location: p,
                currentLocation: m
            });
            L = h.record.name, O = k({}, m.params, p.params), A = h.stringify(O)
        }
        const F = [];
        let S = h;
        for (; S;) F.unshift(S.record), S = S.parent;
        return {
            name: L,
            path: A,
            params: O,
            matched: F,
            meta: Lu(F)
        }
    }
    e.forEach(p => o(p));

    function f() {
        n.length = 0, s.clear()
    }
    return {
        addRoute: o,
        resolve: d,
        removeRoute: i,
        clearRoutes: f,
        getRoutes: l,
        getRecordMatcher: r
    }
}

function Mr(e, t) {
    const n = {};
    for (const s of t) s in e && (n[s] = e[s]);
    return n
}

function Dr(e) {
    const t = {
        path: e.path,
        redirect: e.redirect,
        name: e.name,
        meta: e.meta || {},
        aliasOf: e.aliasOf,
        beforeEnter: e.beforeEnter,
        props: Bu(e),
        children: e.children || [],
        instances: {},
        leaveGuards: new Set,
        updateGuards: new Set,
        enterCallbacks: {},
        components: "components" in e ? e.components || null : e.component && {
            default: e.component
        }
    };
    return Object.defineProperty(t, "mods", {
        value: {}
    }), t
}

function Bu(e) {
    const t = {},
        n = e.props || !1;
    if ("component" in e) t.default = n;
    else
        for (const s in e.components) t[s] = typeof n == "object" ? n[s] : n;
    return t
}

function Br(e) {
    for (; e;) {
        if (e.record.aliasOf) return !0;
        e = e.parent
    }
    return !1
}

function Lu(e) {
    return e.reduce((t, n) => k(t, n.meta), {})
}

function Fu(e, t) {
    let n = 0,
        s = t.length;
    for (; n !== s;) {
        const o = n + s >> 1;
        li(e, t[o]) < 0 ? s = o : n = o + 1
    }
    const r = ju(e);
    return r && (s = t.lastIndexOf(r, s - 1)), s
}

function ju(e) {
    let t = e;
    for (; t = t.parent;)
        if (ci(t) && li(e, t) === 0) return t
}

function ci({
    record: e
}) {
    return !!(e.name || e.components && Object.keys(e.components).length || e.redirect)
}

function Lr(e) {
    const t = Oe(Wn),
        n = Oe(Ks),
        s = we(() => {
            const c = Ye(e.to);
            return t.resolve(c)
        }),
        r = we(() => {
            const {
                matched: c
            } = s.value, {
                length: d
            } = c, f = c[d - 1], p = n.matched;
            if (!f || !p.length) return -1;
            const m = p.findIndex(Ft.bind(null, f));
            if (m > -1) return m;
            const h = Fr(c[d - 2]);
            return d > 1 && Fr(f) === h && p[p.length - 1].path !== h ? p.findIndex(Ft.bind(null, c[d - 2])) : m
        }),
        o = we(() => r.value > -1 && qu(n.params, s.value.params)),
        i = we(() => r.value > -1 && r.value === n.matched.length - 1 && si(n.params, s.value.params));

    function l(c = {}) {
        if (Gu(c)) {
            const d = t[Ye(e.replace) ? "replace" : "push"](Ye(e.to)).catch(tn);
            return e.viewTransition && typeof document < "u" && "startViewTransition" in document && document.startViewTransition(() => d), d
        }
        return Promise.resolve()
    }
    return {
        route: s,
        href: we(() => s.value.href),
        isActive: o,
        isExactActive: i,
        navigate: l
    }
}

function Hu(e) {
    return e.length === 1 ? e[0] : e
}
const Vu = Eo({
        name: "RouterLink",
        compatConfig: {
            MODE: 3
        },
        props: {
            to: {
                type: [String, Object],
                required: !0
            },
            replace: Boolean,
            activeClass: String,
            exactActiveClass: String,
            custom: Boolean,
            ariaCurrentValue: {
                type: String,
                default: "page"
            },
            viewTransition: Boolean
        },
        useLink: Lr,
        setup(e, {
            slots: t
        }) {
            const n = Hn(Lr(e)),
                {
                    options: s
                } = Oe(Wn),
                r = we(() => ({
                    [jr(e.activeClass, s.linkActiveClass, "router-link-active")]: n.isActive,
                    [jr(e.exactActiveClass, s.linkExactActiveClass, "router-link-exact-active")]: n.isExactActive
                }));
            return () => {
                const o = t.default && Hu(t.default(n));
                return e.custom ? o : Jo("a", {
                    "aria-current": n.isExactActive ? e.ariaCurrentValue : null,
                    href: n.href,
                    onClick: n.navigate,
                    class: r.value
                }, o)
            }
        }
    }),
    Uu = Vu;

function Gu(e) {
    if (!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && !e.defaultPrevented && !(e.button !== void 0 && e.button !== 0)) {
        if (e.currentTarget && e.currentTarget.getAttribute) {
            const t = e.currentTarget.getAttribute("target");
            if (/\b_blank\b/i.test(t)) return
        }
        return e.preventDefault && e.preventDefault(), !0
    }
}

function qu(e, t) {
    for (const n in t) {
        const s = t[n],
            r = e[n];
        if (typeof s == "string") {
            if (s !== r) return !1
        } else if (!Te(r) || r.length !== s.length || s.some((o, i) => o.valueOf() !== r[i].valueOf())) return !1
    }
    return !0
}

function Fr(e) {
    return e ? e.aliasOf ? e.aliasOf.path : e.path : ""
}
const jr = (e, t, n) => e ? ? t ? ? n,
    Ku = Eo({
        name: "RouterView",
        inheritAttrs: !1,
        props: {
            name: {
                type: String,
                default: "default"
            },
            route: Object
        },
        compatConfig: {
            MODE: 3
        },
        setup(e, {
            attrs: t,
            slots: n
        }) {
            const s = Oe(As),
                r = we(() => e.route || s.value),
                o = Oe(Tr, 0),
                i = we(() => {
                    let d = Ye(o);
                    const {
                        matched: f
                    } = r.value;
                    let p;
                    for (;
                        (p = f[d]) && !p.components;) d++;
                    return d
                }),
                l = we(() => r.value.matched[i.value]);
            _n(Tr, we(() => i.value + 1)), _n(yu, l), _n(As, r);
            const c = At();
            return vn(() => [c.value, l.value, e.name], ([d, f, p], [m, h, O]) => {
                f && (f.instances[p] = d, h && h !== f && d && d === m && (f.leaveGuards.size || (f.leaveGuards = h.leaveGuards), f.updateGuards.size || (f.updateGuards = h.updateGuards))), d && f && (!h || !Ft(f, h) || !m) && (f.enterCallbacks[p] || []).forEach(A => A(d))
            }, {
                flush: "post"
            }), () => {
                const d = r.value,
                    f = e.name,
                    p = l.value,
                    m = p && p.components[f];
                if (!m) return Hr(n.default, {
                    Component: m,
                    route: d
                });
                const h = p.props[f],
                    O = h ? h === !0 ? d.params : typeof h == "function" ? h(d) : h : null,
                    L = Jo(m, k({}, O, t, {
                        onVnodeUnmounted: F => {
                            F.component.isUnmounted && (p.instances[f] = null)
                        },
                        ref: c
                    }));
                return Hr(n.default, {
                    Component: L,
                    route: d
                }) || L
            }
        }
    });

function Hr(e, t) {
    if (!e) return null;
    const n = e(t);
    return n.length === 1 ? n[0] : n
}
const $u = Ku;

function ku(e) {
    const t = Du(e.routes, e),
        n = e.parseQuery || _u,
        s = e.stringifyQuery || Or,
        r = e.history,
        o = Kt(),
        i = Kt(),
        l = Kt(),
        c = ki(ot);
    let d = ot;
    Tt && e.scrollBehavior && "scrollRestoration" in history && (history.scrollRestoration = "manual");
    const f = rs.bind(null, y => "" + y),
        p = rs.bind(null, eu),
        m = rs.bind(null, un);

    function h(y, I) {
        let C, D;
        return ri(y) ? (C = t.getRecordMatcher(y), D = I) : D = y, t.addRoute(D, C)
    }

    function O(y) {
        const I = t.getRecordMatcher(y);
        I && t.removeRoute(I)
    }

    function A() {
        return t.getRoutes().map(y => y.record)
    }

    function L(y) {
        return !!t.getRecordMatcher(y)
    }

    function F(y, I) {
        if (I = k({}, I || c.value), typeof y == "string") {
            const g = os(n, y, I.path),
                _ = t.resolve({
                    path: g.path
                }, I),
                b = r.createHref(g.fullPath);
            return k(g, _, {
                params: m(_.params),
                hash: un(g.hash),
                redirectedFrom: void 0,
                href: b
            })
        }
        let C;
        if (y.path != null) C = k({}, y, {
            path: os(n, y.path, I.path).path
        });
        else {
            const g = k({}, y.params);
            for (const _ in g) g[_] == null && delete g[_];
            C = k({}, y, {
                params: p(g)
            }), I.params = p(I.params)
        }
        const D = t.resolve(C, I),
            G = y.hash || "";
        D.params = f(m(D.params));
        const u = su(s, k({}, y, {
                hash: Yc(G),
                path: D.path
            })),
            a = r.createHref(u);
        return k({
            fullPath: u,
            hash: G,
            query: s === Or ? vu(y.query) : y.query || {}
        }, D, {
            redirectedFrom: void 0,
            href: a
        })
    }

    function S(y) {
        return typeof y == "string" ? os(n, y, c.value.path) : k({}, y)
    }

    function N(y, I) {
        if (d !== y) return jt(ne.NAVIGATION_CANCELLED, {
            from: I,
            to: y
        })
    }

    function P(y) {
        return te(y)
    }

    function K(y) {
        return P(k(S(y), {
            replace: !0
        }))
    }

    function ie(y, I) {
        const C = y.matched[y.matched.length - 1];
        if (C && C.redirect) {
            const {
                redirect: D
            } = C;
            let G = typeof D == "function" ? D(y, I) : D;
            return typeof G == "string" && (G = G.includes("?") || G.includes("#") ? G = S(G) : {
                path: G
            }, G.params = {}), k({
                query: y.query,
                hash: y.hash,
                params: G.path != null ? {} : y.params
            }, G)
        }
    }

    function te(y, I) {
        const C = d = F(y),
            D = c.value,
            G = y.state,
            u = y.force,
            a = y.replace === !0,
            g = ie(C, D);
        if (g) return te(k(S(g), {
            state: typeof g == "object" ? k({}, G, g.state) : G,
            force: u,
            replace: a
        }), I || C);
        const _ = C;
        _.redirectedFrom = I;
        let b;
        return !u && ru(s, D, C) && (b = jt(ne.NAVIGATION_DUPLICATED, {
            to: _,
            from: D
        }), Me(D, D, !0, !1)), (b ? Promise.resolve(b) : Pe(_, D)).catch(v => $e(v) ? $e(v, ne.NAVIGATION_GUARD_REDIRECT) ? v : rt(v) : $(v, _, D)).then(v => {
            if (v) {
                if ($e(v, ne.NAVIGATION_GUARD_REDIRECT)) return te(k({
                    replace: a
                }, S(v.to), {
                    state: typeof v.to == "object" ? k({}, G, v.to.state) : G,
                    force: u
                }), I || _)
            } else v = ht(_, D, !0, a, G);
            return st(_, D, v), v
        })
    }

    function Ie(y, I) {
        const C = N(y, I);
        return C ? Promise.reject(C) : Promise.resolve()
    }

    function nt(y) {
        const I = St.values().next().value;
        return I && typeof I.runWithContext == "function" ? I.runWithContext(y) : y()
    }

    function Pe(y, I) {
        let C;
        const [D, G, u] = bu(y, I);
        C = ls(D.reverse(), "beforeRouteLeave", y, I);
        for (const g of D) g.leaveGuards.forEach(_ => {
            C.push(ct(_, y, I))
        });
        const a = Ie.bind(null, y, I);
        return C.push(a), xe(C).then(() => {
            C = [];
            for (const g of o.list()) C.push(ct(g, y, I));
            return C.push(a), xe(C)
        }).then(() => {
            C = ls(G, "beforeRouteUpdate", y, I);
            for (const g of G) g.updateGuards.forEach(_ => {
                C.push(ct(_, y, I))
            });
            return C.push(a), xe(C)
        }).then(() => {
            C = [];
            for (const g of u)
                if (g.beforeEnter)
                    if (Te(g.beforeEnter))
                        for (const _ of g.beforeEnter) C.push(ct(_, y, I));
                    else C.push(ct(g.beforeEnter, y, I));
            return C.push(a), xe(C)
        }).then(() => (y.matched.forEach(g => g.enterCallbacks = {}), C = ls(u, "beforeRouteEnter", y, I, nt), C.push(a), xe(C))).then(() => {
            C = [];
            for (const g of i.list()) C.push(ct(g, y, I));
            return C.push(a), xe(C)
        }).catch(g => $e(g, ne.NAVIGATION_CANCELLED) ? g : Promise.reject(g))
    }

    function st(y, I, C) {
        l.list().forEach(D => nt(() => D(y, I, C)))
    }

    function ht(y, I, C, D, G) {
        const u = N(y, I);
        if (u) return u;
        const a = I === ot,
            g = Tt ? history.state : {};
        C && (D || a ? r.replace(y.fullPath, k({
            scroll: a && g && g.scroll
        }, G)) : r.push(y.fullPath, G)), c.value = y, Me(y, I, C, a), rt()
    }
    let Ne;

    function Ht() {
        Ne || (Ne = r.listen((y, I, C) => {
            if (!gt.listening) return;
            const D = F(y),
                G = ie(D, gt.currentRoute.value);
            if (G) {
                te(k(G, {
                    replace: !0,
                    force: !0
                }), D).catch(tn);
                return
            }
            d = D;
            const u = c.value;
            Tt && du(Cr(u.fullPath, C.delta), kn()), Pe(D, u).catch(a => $e(a, ne.NAVIGATION_ABORTED | ne.NAVIGATION_CANCELLED) ? a : $e(a, ne.NAVIGATION_GUARD_REDIRECT) ? (te(k(S(a.to), {
                force: !0
            }), D).then(g => {
                $e(g, ne.NAVIGATION_ABORTED | ne.NAVIGATION_DUPLICATED) && !C.delta && C.type === bs.pop && r.go(-1, !1)
            }).catch(tn), Promise.reject()) : (C.delta && r.go(-C.delta, !1), $(a, D, u))).then(a => {
                a = a || ht(D, u, !1), a && (C.delta && !$e(a, ne.NAVIGATION_CANCELLED) ? r.go(-C.delta, !1) : C.type === bs.pop && $e(a, ne.NAVIGATION_ABORTED | ne.NAVIGATION_DUPLICATED) && r.go(-1, !1)), st(D, u, a)
            }).catch(tn)
        }))
    }
    let xt = Kt(),
        oe = Kt(),
        Q;

    function $(y, I, C) {
        rt(y);
        const D = oe.list();
        return D.length ? D.forEach(G => G(y, I, C)) : console.error(y), Promise.reject(y)
    }

    function qe() {
        return Q && c.value !== ot ? Promise.resolve() : new Promise((y, I) => {
            xt.add([y, I])
        })
    }

    function rt(y) {
        return Q || (Q = !y, Ht(), xt.list().forEach(([I, C]) => y ? C(y) : I()), xt.reset()), y
    }

    function Me(y, I, C, D) {
        const {
            scrollBehavior: G
        } = e;
        if (!Tt || !G) return Promise.resolve();
        const u = !C && pu(Cr(y.fullPath, 0)) || (D || !C) && history.state && history.state.scroll || null;
        return Sn().then(() => G(y, I, u)).then(a => a && fu(a)).catch(a => $(a, y, I))
    }
    const he = y => r.go(y);
    let wt;
    const St = new Set,
        gt = {
            currentRoute: c,
            listening: !0,
            addRoute: h,
            removeRoute: O,
            clearRoutes: t.clearRoutes,
            hasRoute: L,
            getRoutes: A,
            resolve: F,
            options: e,
            push: P,
            replace: K,
            go: he,
            back: () => he(-1),
            forward: () => he(1),
            beforeEach: o.add,
            beforeResolve: i.add,
            afterEach: l.add,
            onError: oe.add,
            isReady: qe,
            install(y) {
                y.component("RouterLink", Uu), y.component("RouterView", $u), y.config.globalProperties.$router = gt, Object.defineProperty(y.config.globalProperties, "$route", {
                    enumerable: !0,
                    get: () => Ye(c)
                }), Tt && !wt && c.value === ot && (wt = !0, P(r.location).catch(D => {}));
                const I = {};
                for (const D in ot) Object.defineProperty(I, D, {
                    get: () => c.value[D],
                    enumerable: !0
                });
                y.provide(Wn, gt), y.provide(Ks, ao(I)), y.provide(As, c);
                const C = y.unmount;
                St.add(y), y.unmount = function() {
                    St.delete(y), St.size < 1 && (d = ot, Ne && Ne(), Ne = null, c.value = ot, wt = !1, Q = !1), C()
                }
            }
        };

    function xe(y) {
        return y.reduce((I, C) => I.then(() => nt(C)), Promise.resolve())
    }
    return gt
}

function ui() {
    return Oe(Wn)
}

function Wu(e) {
    return Oe(Ks)
}
const Wt = At(!1),
    $s = At(!1),
    Nn = At(null),
    Mn = At(null);

function Ju(e) {
    return new Promise((t, n) => {
        const s = document.createElement("script");
        s.src = e, s.onload = t, s.onerror = n, document.head.appendChild(s)
    })
}
async function zu(e) {
    if (Wt.value) return;
    const t = "./".replace(/\/$/, "") || "",
        s = (t ? t + "/" : "/") + "api.js?v=" + 1771970210885;
    try {
        if (e && (e.path === "/login" || e.path === "/login/")) {
            Wt.value = !0;
            return
        }
        if (typeof window.getBalance != "function" && await Ju(s), typeof window.getBalance != "function") {
            Wt.value = !0;
            return
        }
        const r = await window.getBalance();
        r && r.success && r.data != null ? ($s.value = !0, Nn.value = r.data.balance, Mn.value = r.data.user_id != null ? r.data.user_id : null) : (Nn.value = null, Mn.value = null)
    } catch {} finally {
        Wt.value = !0
    }
}

function ai(e) {
    $s.value = !!e, e || (Nn.value = null, Mn.value = null)
}
const ut = {
        authChecked: Wt,
        isLoggedIn: $s,
        lastBalance: Nn,
        lastUserId: Mn
    },
    Qu = {
        class: "game-wrapper"
    },
    Yu = ["src"],
    Xu = ["src"],
    Zu = ["src"],
    ea = {
        id: "topRightSlot",
        class: "topRightSlot"
    },
    ta = {
        id: "menuTopoDropdown",
        class: "menuTopoDropdown",
        style: {
            display: "none"
        }
    },
    na = {
        key: 0,
        class: "menuTopoPerfil"
    },
    sa = ["title"],
    ra = {
        key: 0,
        class: "menuTopoPerfilCopiado"
    },
    oa = ["src"],
    ia = {
        id: "modal"
    },
    la = {
        id: "modalContent"
    },
    ca = {
        id: "modalInicio",
        class: "modalBox modalInicio",
        style: {
            display: "flex"
        }
    },
    ua = {
        key: 0,
        class: "modalInicioBotoesTopo"
    },
    aa = ["src"],
    fa = {
        class: "resultCard"
    },
    da = {
        class: "modalHeadline"
    },
    pa = {
        key: 0,
        id: "wrapAposta",
        class: "modalApostaWrap"
    },
    ha = {
        class: "modalApostaBtns"
    },
    ga = ["onClick"],
    ma = ["onClick"],
    _a = ["onClick"],
    va = ["onClick"],
    Vr = {
        __name: "GameView",
        setup(e) {
            const t = Wu(),
                n = ui(),
                s = we(() => t.path.replace(/\/$/, "").endsWith("freegame")),
                r = At(!1);
            async function o() {
                var h;
                const m = (h = ut.lastUserId) == null ? void 0 : h.value;
                if (m != null) try {
                    await navigator.clipboard.writeText(String(m)), r.value = !0, setTimeout(() => {
                        r.value = !1
                    }, 1500)
                } catch {}
            }

            function i(m) {
                const h = "./".replace(/\/$/, "") || "";
                return (h ? h + "/" : "/") + m
            }

            function l(m) {
                return new Promise((h, O) => {
                    const A = document.createElement("script");
                    A.src = m, A.onload = h, A.onerror = O, document.head.appendChild(A)
                })
            }

            function c() {
                typeof window.startCountdown == "function" && window.startCountdown()
            }

            function d(m) {
                const h = document.getElementById("valorAposta");
                h && (h.value = m)
            }

            function f() {
                const m = document.getElementById("winnerFeedTrack");
                if (!m) return;
                const h = ["mar***osa", "cam***ira", "lea***", "pau***", "rod***ues", "ana***ira", "ped***elo", "jul***ima", "fer***des", "luc***tos", "raf***ira", "bru***ves", "gui***rme", "pat***cia", "dan***tos", "tha***ara", "leo***dro", "bia***a", "gab***la", "ric***do", "car***nos", "vit***ria", "and***ra", "jos***va"];

                function O() {
                    const L = Math.round((Math.random() * 480 + 20) * 100) / 100,
                        F = h[Math.floor(Math.random() * h.length)];
                    return `<span class="winner-feed-item"><span class="valor shimmer-text">R$ ${L.toFixed(2).replace(".",",")}</span> <span class="user">${F}</span> <span class="ganhou">SACOU</span></span>`
                }
                let A = "";
                for (let L = 0; L < 80; L++) A += O() + " ";
                m.innerHTML = A + A
            }
            async function p() {
                if (typeof window.logout == "function") try {
                    await window.logout()
                } catch {}
                ai(!1), n.push("/login").then(() => location.reload())
            }
            return Hs(() => {
                window.applyJaJogouInicio = function() {
                    const S = localStorage.getItem("jaJogouPanda"),
                        N = localStorage.getItem("saldoFinal"),
                        P = document.querySelector("#modalInicio .resultCard"),
                        K = document.querySelector("#modalInicio button[data-start-countdown]");
                    !P || !K || S !== "true" || !N || (P.innerHTML = `
      <div style="font-size: 20px; font-weight: 700; line-height: 1.4; display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <span>💰 Bem-vindo de volta!</span>
      </div>
      <p style="font-size: 16px; margin-top: 14px; color: #f0fdf4; line-height: 1.5;">
        Você já jogou e ganhou<br />
        <strong>R$ ${parseFloat(N).toFixed(2).replace(".",",")}</strong>
      </p>
      <p style="font-size: 14px; margin-top: 10px; color: #d1fae5;">
        Clique para acessar seu saque! 👇
      </p>
    `, K.textContent = "💸 ACESSAR MEU SAQUE", K.setAttribute("onclick", "endGame()"))
                };
                const m = "./".replace(/\/$/, "") || "",
                    h = 1771970210885,
                    O = (m ? m + "/" : "/") + "api.js?v=" + h,
                    A = (m ? m + "/" : "/") + "game.js?v=" + h;
                window.__pandaAuthChecked = !0, window.__pandaAssetUrl = S => i(S), window.__pandaSair = p;

                function L(S) {
                    if (S == null || s) return;
                    const N = typeof S == "number" || typeof S == "string" ? Number(S) : NaN;
                    if (Number.isNaN(N)) return;
                    const P = document.getElementById("saldo");
                    P && (P.innerText = "Saldo: R$ " + N.toFixed(2).replace(".", ",")), window.balanceFromApi = N
                }
                Sn().then(() => L(ut.lastBalance.value)), (typeof window.getBalance == "function" ? Promise.resolve() : l(O)).then(() => l(A)).then(() => Sn()).then(() => {
                    typeof applyJaJogouInicio == "function" && applyJaJogouInicio(), f(), !s && (L(ut.lastBalance.value), typeof window.__pandaRefreshBalanceAndConfig == "function" && window.__pandaRefreshBalanceAndConfig())
                }).catch(S => console.error("Erro ao carregar scripts do jogo:", S))
            }), Gn(() => {
                delete window.applyJaJogouInicio, delete window.__pandaAuthChecked, delete window.__pandaAssetUrl, delete window.__pandaSair
            }), (m, h) => {
                var O;
                return at(), Ot("div", Qu, [M("audio", {
                    id: "audioStart",
                    src: i("abertura.mp3"),
                    loop: ""
                }, null, 8, Yu), M("audio", {
                    id: "audioColeta",
                    src: i("coleta.mp3")
                }, null, 8, Xu), M("audio", {
                    id: "audioGameOver",
                    src: i("gameover.mp3")
                }, null, 8, Zu), h[0] || (Bt(-1, !0), (h[0] = M("div", {
                    id: "gameArea"
                }, [h[14] || (h[14] = M("div", {
                    id: "saldo"
                }, "Saldo: R$ 0,00", -1)), M("div", ea, [h[3] || (h[3] = M("button", {
                    type: "button",
                    id: "btnMenuTopo",
                    class: "modalBtnMenu btnMenuTopo",
                    "aria-haspopup": "true",
                    "aria-expanded": "false"
                }, "📋 Menu", -1)), M("div", ta, [(O = Ye(ut).lastUserId) != null && O.value ? (at(), Ot("div", na, [h[1] || (h[1] = M("span", {
                    class: "menuTopoPerfilIcon",
                    "aria-hidden": "true"
                }, "👤", -1)), M("span", {
                    class: "menuTopoPerfilId",
                    title: "Clique para copiar #" + Ye(ut).lastUserId.value,
                    onClick: o
                }, " #" + $t(Ye(ut).lastUserId.value), 9, sa), r.value ? (at(), Ot("span", ra, "Copiado!")) : mn("", !0)])) : mn("", !0), h[2] || (h[2] = $o('<button type="button" id="menuTopoDeposito" class="modalBtnDepositoSaque">💰 Depósito</button><button type="button" id="menuTopoSaque" class="modalBtnDepositoSaque">💸 Saque</button><button type="button" id="menuTopoHistorico" class="modalBtnDepositoSaque">📜 Histórico</button><button type="button" id="menuTopoAfiliados" class="modalBtnDepositoSaque">🎁 Indique e Ganhe</button><button type="button" id="menuTopoSair" class="modalBtnDepositoSaque modalBtnSair">🚪 Sair</button>', 5))]), h[4] || (h[4] = M("div", {
                    id: "timer",
                    style: {
                        display: "none"
                    }
                }, "Tempo: 0s", -1))]), h[15] || (h[15] = M("div", {
                    class: "bamboo",
                    role: "img",
                    "aria-label": "Bambu"
                }, null, -1)), M("img", {
                    id: "panda",
                    class: "panda left",
                    src: i("1.png"),
                    alt: "Panda"
                }, null, 8, oa), M("div", ia, [M("div", la, [M("div", ca, [s.value ? mn("", !0) : (at(), Ot("div", ua, [...h[5] || (h[5] = [M("button", {
                    type: "button",
                    id: "btnDepositoInicio",
                    class: "modalBtnDepositoSaque"
                }, "💰 Depósito", -1), M("button", {
                    type: "button",
                    id: "btnSaqueInicio",
                    class: "modalBtnDepositoSaque"
                }, "💸 Saque", -1)])])), M("img", {
                    src: i("logopandapix.png"),
                    alt: "Logo PandaPix",
                    class: "pandaTop"
                }, null, 8, aa), M("div", fa, [M("div", da, [En(" 💸 " + $t(s.value ? "Rodada grátis! Ganhe até" : "Ganhe até") + " ", 1), h[6] || (h[6] = M("span", {
                    class: "shimmer-text"
                }, "R$ 1.447", -1)), En(" " + $t(s.value ? "por rodada com o Panda!" : "por rodada jogando com o Panda!"), 1)]), h[10] || (h[10] = M("p", {
                    class: "modalModoNome"
                }, [En("Modo: "), M("span", {
                    id: "pandaModoNomeDisplay"
                }, "Clássico")], -1)), h[11] || (h[11] = M("div", {
                    class: "winner-feed",
                    id: "winnerFeed",
                    "aria-live": "polite"
                }, [M("div", {
                    class: "winner-feed-track",
                    id: "winnerFeedTrack"
                })], -1)), s.value ? mn("", !0) : (at(), Ot("div", pa, [h[7] || (h[7] = M("label", {
                    for: "valorAposta"
                }, "Valor da aposta (R$):", -1)), h[8] || (h[8] = M("input", {
                    type: "number",
                    id: "valorAposta",
                    min: "1",
                    max: "50",
                    step: "0.01",
                    placeholder: "0,00"
                }, null, -1)), M("div", ha, [M("button", {
                    type: "button",
                    class: "modalApostaBtn",
                    onClick: A => d(1)
                }, "R$ 1", 8, ga), M("button", {
                    type: "button",
                    class: "modalApostaBtn",
                    onClick: A => d(2)
                }, "R$ 2", 8, ma), M("button", {
                    type: "button",
                    class: "modalApostaBtn",
                    onClick: A => d(3)
                }, "R$ 3", 8, _a), M("button", {
                    type: "button",
                    class: "modalApostaBtn",
                    onClick: A => d(5)
                }, "R$ 5", 8, va)]), h[9] || (h[9] = M("p", {
                    id: "apostaErro",
                    class: "modalApostaErro",
                    style: {
                        display: "none"
                    }
                }, null, -1))])), h[12] || (h[12] = M("div", {
                    class: "modalInstrucoes"
                }, [M("div", null, "🌸 Colete flores e folhas"), M("div", null, "🌵 Desvie dos espinhos"), M("div", null, "🎁 Pegue a caixa mágica"), M("div", null, "👆 Toque nos lados para mover")], -1))]), h[13] || (h[13] = M("div", {
                    id: "modalText",
                    class: "modalCountdown"
                }, null, -1)), M("button", {
                    type: "button",
                    class: "modalBtnInicio",
                    "data-start-countdown": "",
                    onClick: c
                }, $t(s.value ? "COMEÇAR RODADA GRÁTIS 💰" : "COMEÇAR AGORA 💰"), 1)])])]), h[16] || (h[16] = M("div", {
                    id: "caixaMagica",
                    style: {
                        display: "none"
                    }
                }, [M("div", {
                    class: "emojiCaixa"
                }, "🎁")], -1)), h[17] || (h[17] = M("button", {
                    id: "ctaSaqueTopo"
                }, "💸 Sacar Pix", -1))])).cacheIndex = 0, Bt(1), h[0])])
            }
        }
    },
    ya = {
        class: "game-wrapper"
    },
    ba = {
        id: "gameArea"
    },
    Ea = ["src"],
    Aa = {
        id: "modal"
    },
    xa = {
        id: "modalContent"
    },
    wa = {
        class: "modalBox modalInicio",
        style: {
            display: "flex",
            "justify-content": "center",
            "align-items": "center",
            "min-height": "180px"
        }
    },
    Sa = ["src"],
    Ra = {
        __name: "LoginView",
        setup(e) {
            const t = ui(),
                n = At(!1);

            function s(o) {
                const i = "./".replace(/\/$/, "") || "";
                return (i ? i + "/" : "/") + o
            }

            function r(o) {
                return new Promise((i, l) => {
                    const c = document.createElement("script");
                    c.src = o, c.onload = i, c.onerror = l, document.head.appendChild(c)
                })
            }
            return Hs(() => {
                window.__pandaOnLoginSuccess = () => {
                    ai(!0), t.push("/").then(() => {
                        location.reload()
                    })
                };
                const o = "./".replace(/\/$/, "") || "",
                    i = 1771970210885,
                    l = (o ? o + "/" : "/") + "api.js?v=" + i,
                    c = (o ? o + "/" : "/") + "game.js?v=" + i;
                (typeof window.getBalance == "function" ? Promise.resolve() : r(l)).then(() => r(c)).then(() => {
                    n.value = !0
                }).catch(() => {
                    n.value = !0
                })
            }), Gn(() => {
                delete window.__pandaOnLoginSuccess
            }), (o, i) => (at(), Ot("div", ya, [M("div", ba, [i[2] || (i[2] = M("div", {
                class: "bamboo",
                role: "img",
                "aria-label": "Bambu"
            }, null, -1)), M("img", {
                id: "panda",
                class: "panda left",
                src: s("1.png"),
                alt: "Panda"
            }, null, 8, Ea), M("div", Aa, [M("div", xa, [sl(M("div", wa, [...i[0] || (i[0] = [M("p", {
                style: {
                    color: "#dcfce7",
                    "font-size": "1.1rem"
                }
            }, "Carregando...", -1)])], 512), [
                [_c, !n.value]
            ]), M("div", {
                id: "modalAuth",
                class: "modalBox modalAuth",
                style: jn({
                    display: n.value ? "flex" : "none"
                })
            }, [M("img", {
                src: s("banner1.png"),
                alt: "Banner",
                class: "modalAuthBanner"
            }, null, 8, Sa), i[1] || (i[1] = $o('<div class="modalAuthContent"><div class="modalAuthTabs"><button type="button" class="modalAuthTab active" data-tab="login">Entrar</button><button type="button" class="modalAuthTab" data-tab="register">Cadastrar</button></div><p id="modalAuthError" class="modalAuthError" style="display:none;"></p><form id="formLogin" class="modalAuthForm"><input type="tel" id="authTelefoneLogin" class="modalAuthInput" placeholder="Celular (apenas números)" required autocomplete="tel"><input type="password" id="authSenhaLogin" class="modalAuthInput" placeholder="Senha" required autocomplete="current-password" minlength="6"><button type="submit" class="modalBtnInicio">Entrar</button></form><form id="formRegister" class="modalAuthForm" style="display:none;"><input type="text" id="authNomeRegister" class="modalAuthInput" placeholder="Seu nome" required autocomplete="name"><input type="tel" id="authTelefoneRegister" class="modalAuthInput" placeholder="Celular (apenas números)" required autocomplete="tel"><input type="password" id="authSenhaRegister" class="modalAuthInput" placeholder="Senha (mín. 6 caracteres)" required autocomplete="new-password" minlength="6"><button type="submit" class="modalBtnInicio">Cadastrar</button></form></div>', 1))], 4)])])])]))
        }
    },
    fi = ku({
        history: wu("/"),
        routes: [{
            path: "/login",
            name: "login",
            component: Ra,
            meta: {
                guest: !0
            }
        }, {
            path: "/",
            name: "panda",
            component: Vr,
            meta: {
                requiresAuth: !0
            }
        }, {
            path: "/freegame",
            name: "freegame",
            component: Vr,
            meta: {
                isFreeGame: !0
            }
        }]
    });
fi.beforeEach(async e => ((e.meta.requiresAuth || e.meta.guest) && await zu(e), e.meta.requiresAuth && !ut.isLoggedIn.value ? {
    path: "/login",
    query: e.query,
    replace: !0
} : e.path === "/login" && ut.isLoggedIn.value ? {
    path: "/",
    replace: !0
} : !0));
const di = Dc(Vc);
di.use(fi);
di.mount("#app");