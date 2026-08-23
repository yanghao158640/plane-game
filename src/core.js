// core.js — 引擎核心：数学工具、对象池、碰撞、输入
// 全部为纯函数与轻量类，无外部依赖

// ───────────────────────── 数学工具 ─────────────────────────
export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (n = 1) => Math.random() * n;
export const randRange = (lo, hi) => lo + Math.random() * (hi - lo);
export const randInt = (lo, hi) => Math.floor(randRange(lo, hi + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;

export const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
};
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));

/** 角度归一化到 [-PI, PI] */
export function normalizeAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

/** 从 a 转向 b，最大转角 maxStep */
export function angleTowards(a, b, maxStep) {
  let d = normalizeAngle(b - a);
  if (d > maxStep) d = maxStep;
  if (d < -maxStep) d = -maxStep;
  return a + d;
}

// ───────────────────────── 缓动 ─────────────────────────
export const Ease = {
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

// ───────────────────────── 对象池 ─────────────────────────
/**
 * 通用对象池。高频实体（子弹/粒子）必须走池，避免 GC 抖动。
 * factory 创建新对象，reset 重置对象状态以便复用。
 */
export class Pool {
  constructor(factory, reset, prealloc = 64) {
    this.factory = factory;
    this.reset = reset || (() => {});
    this.free = [];
    this.active = [];
    for (let i = 0; i < prealloc; i++) this.free.push(factory());
  }
  obtain() {
    const o = this.free.pop() || this.factory();
    this.active.push(o);
    return o;
  }
  release(o) {
    this.reset(o);
    this.free.push(o);
  }
  /** 清理所有 alive=false 的活动对象 */
  sweep() {
    const keep = [];
    for (let i = 0; i < this.active.length; i++) {
      const o = this.active[i];
      if (o.alive) keep.push(o);
      else this.release(o);
    }
    this.active.length = 0;
    for (let i = 0; i < keep.length; i++) this.active[i] = keep[i];
  }
  clear() {
    for (const o of this.active) this.release(o);
    this.active.length = 0;
  }
}

// ───────────────────────── 碰撞 ─────────────────────────
export function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

// ───────────────────────── 输入管理 ─────────────────────────
/**
 * 统一抽象键盘、鼠标、触屏输入。
 * 提供给场景：move (dx,dy 归一化方向), pointer (x,y 画布坐标),
 * dashPressed, ultPressed, pausePressed 等边沿事件。
 */
export class Input {
  constructor(canvas, viewW = 540, viewH = 960) {
    this.canvas = canvas;
    this.viewW = viewW; this.viewH = viewH; // 逻辑画布尺寸，用于把客户端坐标换算为逻辑坐标
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, active: false };
    this.move = { x: 0, y: 0 };      // 键盘方向输入
    this.dragging = false;
    this.dragOffset = { x: 0, y: 0 }; // 触屏拖拽时手指相对玩家的偏移

    // 边沿事件（双缓冲：事件写入 _pending，每帧 update 转移到可消费字段）
    this.dashPressed = false;
    this.ultPressed = false;
    this.pausePressed = false;
    this.pressed = false;   // 指针按下（点击），用于 UI
    this.anyKey = false;
    this._pending = { dashPressed: false, ultPressed: false, pausePressed: false, pressed: false };

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.anyKey = true;
      if (e.code === 'Space') { this._pending.ultPressed = true; e.preventDefault(); }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this._pending.dashPressed = true;
      if (e.code === 'Escape' || e.code === 'KeyP') this._pending.pausePressed = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    const rectPos = (e) => {
      const r = this.canvas.getBoundingClientRect();
      // 换算到逻辑坐标（VIEW.W × VIEW.H），与玩家/UI 坐标系一致，避免高 DPR 设备错位
      const sx = this.viewW / r.width;
      const sy = this.viewH / r.height;
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    };

    // 鼠标：按住跟随
    this.canvas.addEventListener('mousedown', (e) => {
      const p = rectPos(e);
      this.pointer = { x: p.x, y: p.y, active: true };
      this.dragging = true;
      this._pending.pressed = true;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const p = rectPos(e);
      this.pointer.x = p.x; this.pointer.y = p.y;
    });
    window.addEventListener('mouseup', () => { this.dragging = false; });
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault(); this._pending.ultPressed = true;
    });

    // 触屏：单指拖拽控制玩家
    const touchPos = (t) => {
      const r = this.canvas.getBoundingClientRect();
      const sx = this.viewW / r.width;
      const sy = this.viewH / r.height;
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
    };
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const p = touchPos(e.touches[0]);
        this.pointer = { x: p.x, y: p.y, active: true };
        this.dragging = true;
        this._dragId = e.touches[0].identifier;
        this._pending.pressed = true;
      } else if (e.touches.length === 2) {
        this._pending.ultPressed = true;
      } else if (e.touches.length === 3) {
        this._pending.dashPressed = true;
      }
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.dragging) {
        for (const t of e.changedTouches) {
          if (t.identifier === this._dragId) {
            const p = touchPos(t);
            this.pointer.x = p.x; this.pointer.y = p.y;
          }
        }
      }
    }, { passive: false });
    const endTouch = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._dragId) {
          this.dragging = false;
          this._dragId = null;
        }
      }
    };
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); endTouch(e); }, { passive: false });
    this.canvas.addEventListener('touchcancel', endTouch);
  }

  /** 每帧开始时调用，转移边沿事件并刷新键盘方向输入 */
  update() {
    this.dashPressed = this._pending.dashPressed; this._pending.dashPressed = false;
    this.ultPressed = this._pending.ultPressed; this._pending.ultPressed = false;
    this.pausePressed = this._pending.pausePressed; this._pending.pausePressed = false;
    this.pressed = this._pending.pressed; this._pending.pressed = false;
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('ArrowLeft') || k.has('KeyA')) x -= 1;
    if (k.has('ArrowRight') || k.has('KeyD')) x += 1;
    if (k.has('ArrowUp') || k.has('KeyW')) y -= 1;
    if (k.has('ArrowDown') || k.has('KeyS')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    this.move.x = x; this.move.y = y;
  }

  /** 消费边沿事件 */
  consume(name) {
    const v = this[name];
    this[name] = false;
    return v;
  }
}
