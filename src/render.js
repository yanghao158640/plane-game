// render.js — 背景、特效、HUD、程序化音效
import { VIEW, COLORS, LEVELS, SUBSTAGES } from './data.js';
import { TAU, clamp, randRange, pick } from './core.js';

// ───────────────────────── 滚动星空背景 ─────────────────────────
export class Background {
  constructor() {
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: randRange(0, VIEW.W), y: randRange(0, VIEW.H),
        z: randRange(0.2, 1), s: randRange(0.6, 2.2),
      });
    }
    this.nebula = [];
    for (let i = 0; i < 4; i++) {
      this.nebula.push({
        x: randRange(0, VIEW.W), y: randRange(0, VIEW.H),
        r: randRange(140, 240), c: pick([COLORS.purple, COLORS.cyan, COLORS.magenta]),
        vy: randRange(6, 16),
      });
    }
    this.t = 0;
    this.scrollSpeed = 1;
  }
  setSpeed(s) { this.scrollSpeed = s; }
  update(dt) {
    this.t += dt;
    const s = this.scrollSpeed;
    for (const st of this.stars) {
      st.y += (30 + st.z * 140) * dt * s;
      if (st.y > VIEW.H) { st.y = -2; st.x = randRange(0, VIEW.W); }
    }
    for (const n of this.nebula) {
      n.y += n.vy * dt * s;
      if (n.y - n.r > VIEW.H) { n.y = -n.r; n.x = randRange(0, VIEW.W); }
    }
  }
  render(ctx) {
    // 深空底色渐变
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.H);
    g.addColorStop(0, '#070a18');
    g.addColorStop(1, '#03040a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);

    // 星云
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const n of this.nebula) {
      const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      ng.addColorStop(0, n.c + '22');
      ng.addColorStop(0.5, n.c + '10');
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // 网格（科技感）—— +0.5 偏移让 1px 线对齐像素中心，避免半像素发糊
    ctx.strokeStyle = 'rgba(0,240,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= VIEW.W; x += 45) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, VIEW.H); ctx.stroke();
    }
    for (let y = 0; y <= VIEW.H; y += 45) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(VIEW.W, y + 0.5); ctx.stroke();
    }

    // 星星
    for (const st of this.stars) {
      ctx.globalAlpha = st.z;
      ctx.fillStyle = st.z > 0.7 ? '#ddeeff' : '#7788aa';
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;
  }
}

// ───────────────────────── 屏幕特效（震动/闪光/伤害数字） ─────────────────────────
export class Effects {
  constructor() {
    this.shakeAmt = 0;
    this.flashColor = '#fff'; this.flashAlpha = 0;
    this.dmgNums = [];
  }
  shake(n) { this.shakeAmt = Math.min(24, this.shakeAmt + n); }
  flash(color, alpha) { this.flashColor = color; this.flashAlpha = Math.max(this.flashAlpha, alpha); }
  damageNum(x, y, n, crit) {
    this.dmgNums.push({ x: x + randRange(-6, 6), y, n: String(n), crit, life: 0.8, vy: -50 });
    if (this.dmgNums.length > 60) this.dmgNums.shift();
  }
  update(dt) {
    this.shakeAmt *= Math.pow(0.002, dt);
    if (this.shakeAmt < 0.1) this.shakeAmt = 0;
    if (this.flashAlpha > 0) { this.flashAlpha -= dt * 2; if (this.flashAlpha < 0) this.flashAlpha = 0; }
    for (const d of this.dmgNums) { d.y += d.vy * dt; d.vy *= 0.92; d.life -= dt; }
    this.dmgNums = this.dmgNums.filter(d => d.life > 0);
  }
  applyShake(ctx) {
    if (this.shakeAmt > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt);
    }
  }
  renderFlash(ctx) {
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(this.flashAlpha, 0, 1);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, VIEW.W, VIEW.H);
      ctx.restore();
    }
  }
  renderDmg(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    for (const d of this.dmgNums) {
      const a = clamp(d.life / 0.8, 0, 1);
      ctx.globalAlpha = a;
      ctx.shadowColor = d.crit ? COLORS.gold : COLORS.cyan;
      ctx.shadowBlur = 8;
      ctx.fillStyle = d.crit ? COLORS.gold : '#fff';
      ctx.font = d.crit ? 'bold 22px Orbitron, monospace' : 'bold 14px Orbitron, monospace';
      ctx.fillText(d.n, d.x, d.y);
    }
    ctx.restore();
  }
}

// ───────────────────────── HUD ─────────────────────────
export class HUD {
  constructor() { this.comboText = ''; this.comboAlpha = 0; }
  showCombo(text) { this.comboText = text; this.comboAlpha = 1; }
  render(ctx, player, score, combo, time, boss, ultReady) {
    const pad = 12;
    // ── 顶部左：血量 + 护盾 ──
    const barW = 150, barH = 8;
    let y = 14;
    // 血量
    this._bar(ctx, pad, y, barW, barH, player.hp / player.maxHp, COLORS.red, 'HP', Math.ceil(player.hp));
    y += 16;
    // 护盾
    this._bar(ctx, pad, y, barW, barH, player.shield / player.maxShield, COLORS.green, 'SH', Math.ceil(player.shield));
    y += 16;
    // 大招能量
    const ultRatio = player.ultCharge / player.ultMax;
    this._bar(ctx, pad, y, barW, barH, ultRatio, ultReady ? COLORS.gold : COLORS.purple, 'ULT', ultReady ? 'READY' : Math.floor(ultRatio * 100) + '%');

    // ── 顶部右：分数 + 时间 + 闪避 ──
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 26px Orbitron, monospace';
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 8;
    ctx.fillText(String(score).padStart(6, '0'), VIEW.W - pad, 30);
    ctx.shadowBlur = 0;
    ctx.font = '13px Rajdhani, monospace';
    ctx.fillStyle = '#8899bb';
    ctx.fillText(`TIME ${time.toFixed(0)}s`, VIEW.W - pad, 50);
    // 闪避充能
    ctx.font = '14px Rajdhani, monospace';
    ctx.fillStyle = COLORS.cyan;
    let dashStr = 'DASH ';
    for (let i = 0; i < player.maxDash; i++) dashStr += i < player.dashes ? '◆' : '◇';
    ctx.fillText(dashStr, VIEW.W - pad, 70);
    ctx.restore();

    // ── 连击 ──
    if (combo > 1) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px Orbitron, monospace';
      ctx.fillStyle = COLORS.gold;
      ctx.shadowColor = COLORS.gold; ctx.shadowBlur = 12;
      ctx.globalAlpha = clamp(this.comboAlpha, 0, 1);
      ctx.fillText(`×${combo} COMBO`, VIEW.W / 2, 96);
      ctx.restore();
    }

    // ── Boss 血条 ──
    if (boss && boss.alive) {
      const bw = VIEW.W - 80, bx = 40, by = VIEW.H - 36;
      ctx.save();
      ctx.font = 'bold 14px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = boss.color;
      ctx.shadowColor = boss.color; ctx.shadowBlur = 8;
      ctx.fillText(boss.def.name, VIEW.W / 2, by - 8);
      ctx.shadowBlur = 0;
      // 底框
      ctx.strokeStyle = boss.color; ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, 12);
      // 血量
      const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
      const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      gr.addColorStop(0, boss.color);
      gr.addColorStop(1, '#fff');
      ctx.fillStyle = gr;
      ctx.fillRect(bx, by, bw * ratio, 12);
      // 阶段刻度
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      for (let i = 1; i < boss.def.phases.length; i++) {
        const px = bx + bw * boss.def.phases[i].hpThreshold;
        ctx.beginPath(); ctx.moveTo(px, by); ctx.lineTo(px, by + 12); ctx.stroke();
      }
      ctx.restore();
    }
  }
  _bar(ctx, x, y, w, h, ratio, color, label, value) {
    ratio = clamp(ratio, 0, 1);
    ctx.save();
    ctx.font = '9px Rajdhani, monospace';
    ctx.fillStyle = '#8899bb';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.fillText(value, x + w, y - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.restore();
  }
  /** 关卡进度条：3 层进度 · 每层带 Boss · Boss 血量反映该层后段进度 */
  renderLevel(ctx, info) {
    const { levelIdx, subStage, phase, levelProgress, bossHpRatio } = info;
    const total = LEVELS.length;
    const lv = LEVELS[levelIdx];
    const w = 300, h = 7;
    const x = (VIEW.W - w) / 2;
    const y = 96;
    const now = performance.now();
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // 关标题
    ctx.font = 'bold 11px Rajdhani, monospace';
    ctx.fillStyle = '#778899';
    ctx.fillText(`LEVEL ${lv.id} / ${total}`, VIEW.W / 2, y - 26);
    ctx.fillStyle = COLORS.cyan;
    ctx.font = 'bold 15px Orbitron, monospace';
    ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 6;
    ctx.fillText(lv.name, VIEW.W / 2, y - 10);
    ctx.shadowBlur = 0;

    // 进度条背景
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, h);

    // 精确填充进度（3 层各 1/3；每层内杂兵 50% + Boss 血量 50%）
    let fillRatio, fillColor, glow;
    if (phase === 'cleared') {
      fillRatio = 1; fillColor = COLORS.gold; glow = COLORS.gold;
    } else {
      const base = subStage / 3;
      if (phase === 'boss') {
        fillRatio = base + 0.5 + (1 - (bossHpRatio || 0)) * 0.5;
        fillColor = COLORS.red; glow = COLORS.red;
      } else {
        fillRatio = levelProgress; fillColor = COLORS.cyan; glow = null;
      }
    }
    fillRatio = clamp(fillRatio, 0, 1);
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = phase === 'boss' ? 8 + Math.sin(now * 0.01) * 5 : 8;
    }
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w * fillRatio, h);
    ctx.shadowBlur = 0;

    // 边框（+0.5 偏移避免半像素糊）
    ctx.strokeStyle = 'rgba(0,240,255,0.25)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // 3 层分隔刻度（1/3 / 2/3）
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      const px = x + w * (i / 3);
      ctx.beginPath(); ctx.moveTo(px, y - 3); ctx.lineTo(px, y + h + 3); ctx.stroke();
    }

    // 每层 Boss 标记（段末小竖条，当前层 Boss 战时脉动）
    const bossActive = phase === 'boss';
    for (let i = 0; i < 3; i++) {
      const px = x + w * ((i + 1) / 3);
      const cur = i === subStage && bossActive;
      ctx.fillStyle = cur ? COLORS.red : 'rgba(255,77,109,0.35)';
      if (cur) ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.012));
      ctx.fillRect(px - 1, y - 3, 3, h + 6);
      ctx.globalAlpha = 1;
    }

    // 状态文字（当前层）
    let stateText, stateColor;
    if (phase === 'cleared') {
      stateText = '关卡通关 · STAGE CLEAR';
      stateColor = COLORS.gold;
    } else if (phase === 'boss') {
      const sd = SUBSTAGES[subStage] || SUBSTAGES[0];
      stateText = subStage >= 2 ? `层 ${subStage + 1}/3 · 关底 BOSS` : `层 ${subStage + 1}/3 · ${sd.name} BOSS`;
      stateColor = COLORS.red;
    } else {
      const sd = SUBSTAGES[subStage] || SUBSTAGES[0];
      stateText = `层 ${subStage + 1}/3 · ${sd.name}`;
      stateColor = '#778899';
    }
    ctx.font = 'bold 11px Rajdhani, monospace';
    ctx.fillStyle = stateColor;
    if (phase !== 'mob') { ctx.shadowColor = stateColor; ctx.shadowBlur = 6; }
    ctx.fillText(stateText, VIEW.W / 2, y + h + 14);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  update(dt) {
    if (this.comboAlpha > 0) this.comboAlpha -= dt * 0.5;
  }
}

// ───────────────────────── 程序化音效 ─────────────────────────
export const Sfx = {
  ctx: null,
  enabled: true,
  sfxVol: 0.6,
  master: null,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.sfxVol;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.enabled = false; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setVol(v) { this.sfxVol = v; if (this.master) this.master.gain.value = v; },
  _tone(freq, dur, type = 'square', vol = 0.3, slide = 0) {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + dur);
  },
  _noise(dur, vol = 0.3, lowpass = 2000) {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass;
    const g = c.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + dur);
  },
  play(name) {
    if (!this.enabled) return;
    this.init(); this.resume();
    switch (name) {
      case 'shoot': this._tone(720, 0.06, 'square', 0.12, -300); break;
      case 'hit': this._tone(420, 0.04, 'triangle', 0.15, -100); break;
      case 'explode': this._noise(0.3, 0.35, 1200); this._tone(120, 0.25, 'sawtooth', 0.2, -60); break;
      case 'bigExplode': this._noise(0.6, 0.5, 800); this._tone(80, 0.5, 'sawtooth', 0.3, -40); break;
      case 'pickup': this._tone(660, 0.08, 'sine', 0.2, 200); break;
      case 'powerup': this._tone(523, 0.1, 'square', 0.2, 200); setTimeout(() => this._tone(784, 0.12, 'square', 0.2, 100), 80); break;
      case 'dash': this._tone(300, 0.12, 'sawtooth', 0.2, 400); this._noise(0.1, 0.15, 3000); break;
      case 'ult': this._tone(200, 0.6, 'sawtooth', 0.35, 600); this._noise(0.4, 0.3, 1500); break;
      case 'damage': this._tone(160, 0.2, 'sawtooth', 0.3, -80); this._noise(0.15, 0.2, 800); break;
      case 'boss': this._tone(110, 0.8, 'sawtooth', 0.35, 30); setTimeout(() => this._tone(82, 0.8, 'sawtooth', 0.3, 20), 200); break;
      case 'phase': this._tone(440, 0.2, 'square', 0.25, -200); this._noise(0.2, 0.2, 1000); break;
      case 'click': this._tone(880, 0.04, 'square', 0.15, 0); break;
      case 'gameover': this._tone(330, 0.3, 'sawtooth', 0.3, -150); setTimeout(() => this._tone(220, 0.5, 'sawtooth', 0.3, -100), 200); break;
    }
  },
};

// ───────────────────────── 背景音乐（程序化合成） ─────────────────────────
export const Bgm = {
  ctx: null,
  master: null,
  mode: 'menu',
  _nodes: [],
  _transition: 0,
  _targetMode: 'menu',
  _running: false,
  _arpTimer: null,
  _percTimer: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.12;
      this.master.connect(this.ctx.destination);
    } catch (e) { /* 静默失败 */ }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setVol(v) { if (this.master) this.master.gain.value = v * 0.12; },

  setMode(mode) {
    this.init();
    if (this._targetMode === mode) return;
    this._targetMode = mode;
    this._transition = 0;
    if (!this._running) { this._running = true; this._tick(); }
  },

  stop() {
    if (this._arpTimer) { clearInterval(this._arpTimer); this._arpTimer = null; }
    if (this._percTimer) { clearInterval(this._percTimer); this._percTimer = null; }
    for (const n of this._nodes) { try { n.stop(); } catch (e) {} }
    this._nodes = [];
    this._running = false;
    this.mode = 'menu';
    this._targetMode = 'menu';
  },

  _tick() {
    if (!this._running) return;
    if (this._transition < 1) { this._transition = Math.min(1, this._transition + 0.02); }
    if (this._transition >= 1 && this.mode !== this._targetMode) {
      this.mode = this._targetMode;
      this._rebuild();
    }
    if (this._nodes.length === 0 && this.mode !== 'menu') { this._rebuild(); }
    if (this.mode === 'menu') { this._clearNodes(); }
    requestAnimationFrame(() => this._tick());
  },

  _clearNodes() {
    for (const n of this._nodes) { try { n.stop(); } catch (e) {} }
    this._nodes = [];
  },

  _rebuild() {
    this._clearNodes();
    if (this._arpTimer) { clearInterval(this._arpTimer); this._arpTimer = null; }
    if (this._percTimer) { clearInterval(this._percTimer); this._percTimer = null; }
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const isBoss = this.mode === 'boss';

    // 1. 低频脉冲 Bass
    const bass = ctx.createOscillator();
    bass.type = isBoss ? 'sawtooth' : 'sine';
    const bassFreq = isBoss ? 110 : 55;
    bass.frequency.setValueAtTime(bassFreq, now);
    if (isBoss) {
      bass.frequency.linearRampToValueAtTime(130, now + 0.5);
      bass.frequency.linearRampToValueAtTime(110, now + 1.0);
    }
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(isBoss ? 0.12 : 0.08, now);
    const bassLfo = ctx.createOscillator();
    bassLfo.type = 'sine';
    bassLfo.frequency.setValueAtTime(isBoss ? 4 : 1.5, now);
    const bassMod = ctx.createGain();
    bassMod.gain.value = isBoss ? 0.1 : 0.06;
    bassLfo.connect(bassMod); bassMod.connect(bassGain.gain);
    bass.connect(bassGain); bassGain.connect(this.master);
    bassLfo.start(now); bass.start(now);
    this._nodes.push(bass, bassLfo, bassGain, bassMod);

    // 2. 和弦垫 Pad
    const padNotes = isBoss ? [220, 277, 330, 440] : [220, 330, 440, 550];
    for (const f of padNotes) {
      const o = ctx.createOscillator();
      o.type = isBoss ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(f, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(isBoss ? 0.03 : 0.02, now);
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(isBoss ? 3 + Math.random() : 0.5 + Math.random(), now);
      const mod = ctx.createGain();
      mod.gain.value = isBoss ? 0.02 : 0.01;
      lfo.connect(mod); mod.connect(g.gain);
      const fNode = ctx.createBiquadFilter();
      fNode.type = 'lowpass';
      fNode.frequency.value = isBoss ? 800 : 400;
      fNode.Q.value = 1;
      o.connect(g); g.connect(fNode); fNode.connect(this.master);
      lfo.start(now); o.start(now);
      this._nodes.push(o, g, lfo, mod, fNode);
    }

    // 3. 琶音 Arpeggio
    const scale = isBoss ? [440, 494, 554, 587, 622, 740, 880] : [262, 330, 392, 524, 660, 784];
    const arpRate = isBoss ? 0.08 : 0.3;
    const arpVol = isBoss ? 0.06 : 0.04;
    let arpIdx = 0;
    const arp = ctx.createOscillator();
    arp.type = isBoss ? 'square' : 'sine';
    const arpGain = ctx.createGain();
    arpGain.gain.value = 0;
    this._arpTimer = setInterval(() => {
      if (!this._running) { clearInterval(this._arpTimer); return; }
      const t = ctx.currentTime;
      arp.frequency.setValueAtTime(scale[arpIdx % scale.length], t);
      arpGain.gain.setValueAtTime(arpVol, t);
      arpGain.gain.exponentialRampToValueAtTime(0.001, t + arpRate * 0.8);
      arpIdx++;
      if (isBoss && arpIdx % 4 === 3) {
        arp.frequency.setValueAtTime(scale[arpIdx % scale.length] * 2, t);
      }
    }, arpRate * 1000);
    arp.connect(arpGain); arpGain.connect(this.master);
    arp.start(now);
    this._nodes.push(arp, arpGain);

    // 4. Boss 模式：打击噪声
    if (isBoss) {
      this._percTimer = setInterval(() => {
        if (!this._running) { clearInterval(this._percTimer); return; }
        const t = ctx.currentTime;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 2000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(f); f.connect(g); g.connect(this.master);
        src.start(t);
        this._nodes.push(src, f, g);
        setTimeout(() => { src.stop(); try { src.disconnect(); } catch(e) {} }, 100);
      }, 250);
    }
  },
};
