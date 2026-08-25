// scenes.js — 所有场景：菜单、战斗（核心）、结算
import { VIEW, COLORS, SHIPS, DIFFICULTY, POWERUPS, WEAPONS, LEVELS, SUBSTAGES, BOSSES } from './data.js';
import { t, setLang, getLang, LANGUAGES } from './lang.js';
import { TAU, clamp, randRange, randInt, pick, chance, dist, circleHit, Pool } from './core.js';
import { Background, Effects, HUD, Sfx, Bgm } from './render.js';
import { Player, Enemy, Boss, Bullet, Particle, PowerUp } from './entities.js';
import { fireWeapon, enemyFire, bossPattern, Spawner, getUpgradeChoices } from './systems.js';
import { saveSave } from './storage.js';

// ───────────────────────── 场景基类 ─────────────────────────
class Scene {
  constructor(game) { this.game = game; }
  enter() {} exit() {} update(dt, input) {} render(ctx) {}
}

// ───────────────────────── UI 工具 ─────────────────────────
const RARITY_COLOR = { common: '#9fb4d4', rare: COLORS.cyan, epic: COLORS.purple };

function uiBtn(ctx, input, x, y, w, h, label, color = COLORS.cyan) {
  const px = input.pointer.x, py = input.pointer.y;
  const hover = px >= x && px <= x + w && py >= y && py <= y + h;
  const clicked = hover && input.consume('pressed');
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = hover ? 16 : 6;
  ctx.globalAlpha = hover ? 1 : 0.85;
  ctx.fillStyle = 'rgba(5,6,15,0.7)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  // 角标
  const c = 8;
  ctx.beginPath();
  ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
  ctx.moveTo(x + w - c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + c);
  ctx.moveTo(x + w, y + h - c); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - c, y + h);
  ctx.moveTo(x + c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - c);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.font = 'bold 20px Orbitron, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
  return clicked;
}

// ═══════════════════════════════════════════════════════════
//  菜单场景
// ═══════════════════════════════════════════════════════════
export class MenuScene extends Scene {
  constructor(game) {
    super(game);
    this.shipIdx = 0;
    this.ships = Object.keys(SHIPS);
    this.diff = 'normal';
    this.bg = new Background();
    this.t = 0;
  }
  enter() { Sfx.init(); Bgm.setMode('menu'); }
  update(dt, input) {
    this.t += dt;
    this.bg.update(dt * 0.4);
  }
  render(ctx) {
    this.bg.render(ctx);
    const W = VIEW.W, H = VIEW.H;
    ctx.save();
    // 标题
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 52px Orbitron, monospace';
    const glitch = Math.sin(this.t * 3) * 2;
    ctx.fillStyle = COLORS.magenta;
    ctx.shadowColor = COLORS.magenta; ctx.shadowBlur = 20;
    ctx.fillText(t('title'), W / 2 + glitch, 130);
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 14;
    ctx.font = 'bold 16px Rajdhani, monospace';
    ctx.fillText(t('subtitle'), W / 2, 168);
    ctx.shadowBlur = 0;

    // 最高分
    ctx.fillStyle = COLORS.gold;
    ctx.font = '18px Rajdhani, monospace';
    ctx.fillText(`${t('bestScore')} ${this.game.save.bestScore}  ·  ${t('bestTime')} ${this.game.save.bestTime}s`, W / 2, 200);

    // 战机选择
    ctx.fillStyle = '#8899bb'; ctx.font = '14px Rajdhani, monospace';
    ctx.fillText(t('selectShip'), W / 2, 240);
    const ship = SHIPS[this.ships[this.shipIdx]];
    this._drawShipCard(ctx, ship, W / 2, 320);

    // 难度
    ctx.fillStyle = '#8899bb'; ctx.font = '14px Rajdhani, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t('difficulty'), W / 2, 420);
    const diffs = Object.keys(DIFFICULTY);
    const dw = 90, gap = 8, total = diffs.length * dw + (diffs.length - 1) * gap;
    let dx = W / 2 - total / 2;
    for (const d of diffs) {
      const sel = d === this.diff;
      const dfd = DIFFICULTY[d];
      const clk = uiBtn(ctx, this.game.input, dx, 438, dw, 36, t('diff' + d.charAt(0).toUpperCase() + d.slice(1)), sel ? dfd.color : '#556677');
      if (clk) { this.diff = d; Sfx.play('click'); }
      dx += dw + gap;
    }

    // 当前难度说明
    const df = DIFFICULTY[this.diff];
    ctx.font = '12px Rajdhani, monospace';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(t('diff_' + this.diff + '_desc'), W / 2, 494);
    ctx.textAlign = 'left';
    let ddy = 516;
    ctx.font = '11px Rajdhani, monospace';
    const detailKeys = ['detail1','detail2','detail3','detail4','detail5'];
    for (const dk of detailKeys) {
      const line = t('diff_' + this.diff + '_' + dk);
      if (line === 'diff_' + this.diff + '_' + dk) continue;
      ctx.fillStyle = df.color;
      ctx.fillText('▸', 64, ddy);
      ctx.fillStyle = '#c8d4e8';
      ctx.fillText(line, 78, ddy);
      ddy += 16;
    }

    // 进入关卡选择
    ctx.textAlign = 'center';
    if (uiBtn(ctx, this.game.input, W / 2 - 120, 600, 240, 52, t('levelSelect'), df.color)) {
      Sfx.play('powerup');
      this.game.gotoLevelSelect({ shipId: this.ships[this.shipIdx], difficulty: this.diff });
    }

    // 操作说明
    ctx.fillStyle = '#66778a'; ctx.font = '12px Rajdhani, monospace';
    ctx.textAlign = 'center';
    const help = [t('pcControls'), t('mobileControls'), t('tip')];
    help.forEach((s, i) => ctx.fillText(s, W / 2, 690 + i * 20));

    // 战机切换箭头
    ctx.fillStyle = COLORS.cyan; ctx.font = 'bold 32px Orbitron';
    ctx.fillText('‹', 60, 320); ctx.fillText('›', W - 60, 320);
    if (this.game.input.consume('pressed')) {
      const px = this.game.input.pointer.x;
      if (px < 110) { this.shipIdx = (this.shipIdx - 1 + this.ships.length) % this.ships.length; Sfx.play('click'); }
      else if (px > W - 110) { this.shipIdx = (this.shipIdx + 1) % this.ships.length; Sfx.play('click'); }
    }

    // 语言切换按钮
    const lang = getLang();
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    if (uiBtn(ctx, this.game.input, W - 60, 14, 50, 28, LANGUAGES[nextLang].name, COLORS.gold)) {
      setLang(nextLang); Sfx.play('click');
    }
    ctx.restore();
  }
  _drawShipCard(ctx, ship, cx, cy) {
    const W = VIEW.W;
    ctx.save();
    // 卡片框
    ctx.strokeStyle = ship.color; ctx.lineWidth = 2;
    ctx.shadowColor = ship.color; ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(5,6,15,0.6)';
    const w = 280, h = 130;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
    ctx.shadowBlur = 0;
    // 飞机预览
    ctx.translate(cx, cy - 20);
    ctx.scale(1.6, 1.6);
    ctx.shadowColor = ship.color; ctx.shadowBlur = 14;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(13, 12); ctx.lineTo(5, 8);
    ctx.lineTo(0, 12); ctx.lineTo(-5, 8); ctx.lineTo(-13, 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -4, 4, 0, TAU); ctx.fill();
    ctx.restore();
    // 文字
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = ship.color; ctx.font = 'bold 22px Orbitron, monospace';
    ctx.fillText(`${t('ship_' + ship.id + '_name')} · ${t('ship_' + ship.id + '_title')}`, cx, cy + 36);
    ctx.fillStyle = '#aabbcc'; ctx.font = '13px Rajdhani, monospace';
    ctx.fillText(t('ship_' + ship.id + '_desc'), cx, cy + 56);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
//  关卡选择场景（三难度均 10 关，逐关解锁）
// ═══════════════════════════════════════════════════════════
export class LevelSelectScene extends Scene {
  constructor(game, opts) {
    super(game);
    this.opts = opts; // { shipId, difficulty }
    this.bg = new Background();
    this.t = 0;
  }
  enter() { Bgm.setMode('menu'); }
  update(dt, input) {
    this.t += dt;
    this.bg.update(dt * 0.4);
  }
  render(ctx) {
    this.bg.render(ctx);
    const W = VIEW.W, H = VIEW.H;
    const diff = DIFFICULTY[this.opts.difficulty];
    const cleared = (this.game.save.progress[this.opts.difficulty] || { cleared: 0 }).cleared;

    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // 标题
    ctx.font = 'bold 30px Orbitron, monospace';
    ctx.fillStyle = diff.color;
    ctx.shadowColor = diff.color; ctx.shadowBlur = 14;
    ctx.fillText(`${t('diff' + this.opts.difficulty.charAt(0).toUpperCase() + this.opts.difficulty.slice(1))} · ${diff.label}`, W / 2, 64);
    ctx.shadowBlur = 0;
    ctx.font = '12px Rajdhani, monospace';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(t('diff_' + this.opts.difficulty + '_desc'), W / 2, 92);

    // 差异明细
    ctx.textAlign = 'left';
    let dy = 118;
    ctx.font = 'bold 11px Rajdhani, monospace';
    ctx.fillStyle = '#778899';
    ctx.fillText(t('difficultyDiff'), 30, dy);
    dy += 17;
    ctx.font = '11px Rajdhani, monospace';
    const detailKeys2 = ['detail1','detail2','detail3','detail4','detail5'];
    for (const dk of detailKeys2) {
      const line = t('diff_' + this.opts.difficulty + '_' + dk);
      if (line === 'diff_' + this.opts.difficulty + '_' + dk) continue;
      ctx.fillStyle = diff.color;
      ctx.fillText('▸', 32, dy);
      ctx.fillStyle = '#c8d4e8';
      ctx.fillText(line, 46, dy);
      dy += 16;
    }

    // 进度
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Rajdhani, monospace';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(t('progress', cleared, LEVELS.length), W / 2, dy + 8);

    // 关卡网格 5×2
    const cols = 5;
    const cw = 90, ch = 104, gap = 8;
    const totalW = cols * cw + (cols - 1) * gap;
    const x0 = (W - totalW) / 2;
    const y0 = dy + 32;
    for (let i = 0; i < LEVELS.length; i++) {
      const lv = LEVELS[i];
      const cx = x0 + (i % cols) * (cw + gap);
      const cy = y0 + Math.floor(i / cols) * (ch + gap);
      const locked = lv.id > cleared + 1;        // 第 N 关需通关 N-1 才解锁
      const clearedFlag = lv.id <= cleared;
      const clicked = this._drawCell(ctx, cx, cy, cw, ch, lv, locked, clearedFlag, diff.color);
      if (clicked) {
        Sfx.play('powerup');
        this.game.gotoGame({ shipId: this.opts.shipId, difficulty: this.opts.difficulty, startLevel: lv.id });
        return;
      }
    }

    // 返回按钮
    if (uiBtn(ctx, this.game.input, W / 2 - 80, H - 64, 160, 44, t('back'), '#556677')) {
      Sfx.play('click');
      this.game.gotoMenu();
    }

    // 语言切换按钮
    const lang = getLang();
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    if (uiBtn(ctx, this.game.input, W - 60, 14, 50, 28, LANGUAGES[nextLang].name, COLORS.gold)) {
      setLang(nextLang); Sfx.play('click');
    }
    ctx.restore();
  }
  /** 绘制单个关卡格子，返回是否被点击 */
  _drawCell(ctx, x, y, w, h, lv, locked, clearedFlag, accent) {
    const px = this.game.input.pointer.x, py = this.game.input.pointer.y;
    const hover = !locked && px >= x && px <= x + w && py >= y && py <= y + h;
    const clicked = hover && this.game.input.consume('pressed');
    ctx.save();
    ctx.lineWidth = 2;
    const col = locked ? '#334455' : (clearedFlag ? COLORS.gold : accent);
    ctx.strokeStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = hover ? 16 : 5;
    ctx.globalAlpha = locked ? 0.45 : (hover ? 1 : 0.92);
    ctx.fillStyle = 'rgba(5,6,15,0.7)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
    // 关卡号
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col; ctx.font = 'bold 26px Orbitron, monospace';
    ctx.fillText(String(lv.id), x + w / 2, y + 30);
    // 关卡名
    ctx.fillStyle = locked ? '#556677' : '#c8d4e8';
    ctx.font = 'bold 12px Rajdhani, monospace';
    this._cellWrap(ctx, t('lv_' + lv.id + '_name'), x + w / 2, y + 58, w - 10);
    // Boss 名（小字）
    ctx.fillStyle = locked ? '#445566' : '#778899';
    ctx.font = '10px Rajdhani, monospace';
    this._cellWrap(ctx, t('bossSuffix') + ' · ' + t('boss_' + BOSSES[lv.bosses[2].type].id + '_name'), x + w / 2, y + 78, w - 8);
    // 状态标签
    if (locked) {
      ctx.fillStyle = '#556677'; ctx.font = 'bold 10px Rajdhani, monospace';
      ctx.fillText(t('locked'), x + w / 2, y + h - 10);
    } else if (clearedFlag) {
      ctx.fillStyle = COLORS.gold; ctx.font = 'bold 10px Rajdhani, monospace';
      ctx.fillText(t('clearedLabel'), x + w / 2, y + h - 10);
    } else {
      ctx.fillStyle = accent; ctx.font = 'bold 10px Rajdhani, monospace';
      ctx.fillText(t('ready'), x + w / 2, y + h - 10);
    }
    ctx.restore();
    return clicked;
  }
  _cellWrap(ctx, text, cx, y, maxW) {
    const chars = text.split('');
    let line = '', yy = y;
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, yy); line = ch; yy += 13;
      } else line = test;
    }
    if (line) ctx.fillText(line, cx, yy);
  }
}

// ═══════════════════════════════════════════════════════════
//  战斗场景（核心）
// ═══════════════════════════════════════════════════════════
export class GameScene extends Scene {
  constructor(game, opts) {
    super(game);
    this.opts = opts;
    this.diff = DIFFICULTY[opts.difficulty || 'normal'];
  }
  exit() { Bgm.stop(); }
  enter() {
    const o = this.opts;
    Bgm.init();
    Bgm.resume();
    Bgm.setMode('normal');
    this.player = new Player(o.shipId);
    // 按难度放大玩家受伤（噩梦 +40%、休闲 -40%）
    this.player.dmgTakenMult = this.diff.dmgMult;
    this.enemies = [];
    this.boss = null;
    this.powerups = [];
    this.lasers = [];
    this.score = 0;
    this.combo = 0; this.comboTimer = 0; this.maxCombo = 0;
    this.kills = 0; this.time = 0; this.bossKills = 0;
    this.subState = 'play'; // play | upgrade | paused | dead
    this.deathTimer = 0;

    // 对象池
    this.pBullets = new Pool(() => new Bullet(), (b) => b.reset(), 128);
    this.eBullets = new Pool(() => new Bullet(), (b) => b.reset(), 256);
    this.particles = new Pool(() => new Particle(), (p) => p.reset(), 256);

    this.enemyPool = new Pool(() => new Enemy(), (e) => e.reset(), 32);

    this.spawner = new Spawner(this.diff.spawnMult);
    // 支持从指定关卡开始（关卡选择跳关 / 重玩）
    if (o.startLevel && o.startLevel > 1) {
      this.spawner.levelIdx = Math.min(o.startLevel - 1, LEVELS.length - 1);
      this.spawner.stageTimer = 2.2; // 横幅期间延迟出怪
    }
    this.bg = new Background();
    this.fx = new Effects();
    this.hud = new HUD();

    // 升级
    this.upgradeChoices = [];

    // 关卡横幅（开场 + 关切换时显示）；层间横幅单独计时
    this.levelBanner = 2.5;
    this.subStageBanner = 0;

    // Boss 登场演出
    this.bossIntroT = 0; this.bossIntroName = '';

    this._prepareEnemyPool();
  }
  _prepareEnemyPool() { /* enemyPool 按需 obtain */ }

  // ─── spawn 方法 ───
  spawnPlayerBullet(spec) {
    const b = this.pBullets.obtain();
    b.init(spec);
    return b;
  }
  spawnEnemyBullet(spec) {
    const b = this.eBullets.obtain();
    spec.owner = 'enemy';
    if (spec.damage == null) spec.damage = 10;
    b.init(spec);
    return b;
  }
  spawnParticle(spec) {
    const p = this.particles.obtain();
    p.init(spec);
    return p;
  }
  spawnEnemy(type, x, y) {
    const e = this.enemyPool.obtain();
    e.init(type, x, y, this.diff.hpMult, this.diff.fireMult);
    this.enemies.push(e);
  }
  spawnBoss(id, hpMult = 1, fireBonus = 1) {
    this.boss = new Boss();
    // fireMult = 难度倍率 × 关/层递增倍率（越往后弹幕越猛）
    this.boss.init(id, this.diff.hpMult * hpMult, this.diff.fireMult * fireBonus);
    this.bg.setSpeed(0.3);
    this.bossIntroT = 2.6;
    this.bossIntroName = t('boss_' + this.boss.def.id + '_name');
    Sfx.play('boss');
    Bgm.setMode('boss');
    this.fx.flash(this.boss.color, 0.3);
  }
  spawnLaser(boss, args) {
    const a = args.rotating ? -Math.PI / 2 + Math.random() * Math.PI : Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
    const len = VIEW.H * 1.5;
    this.lasers.push({
      ox: 0, oy: 0, origin: boss,
      angle: a, warn: args.warn || 0.8, fire: args.fire || 1.2, t: 0,
      state: 'warn', damage: 35, width: 18, color: boss.color, alive: true,
      rotating: !!args.rotating, _dmg: 0,
    });
  }

  // ─── 转发到系统层 ───
  fireWeapon(w, player) { fireWeapon(w, player, this); }
  enemyFire(e) { enemyFire(e, this); }
  bossPattern(b, pat) { bossPattern(b, pat, this); }

  // ─── 事件回调 ───
  onEnemyDeath(e, drop = true) {
    this.kills++; this.game.save.totalKills++;
    this.combo++; this.comboTimer = 2.2; this.maxCombo = Math.max(this.maxCombo, this.combo);
    const mult = 1 + Math.min(this.combo, 8) * 0.2;
    this.score += Math.floor(e.score * mult);
    this.explode(e.x, e.y, e.radius, e.color, e.type === 'elite');
    Sfx.play(e.type === 'elite' ? 'bigExplode' : 'explode');
    if (drop) this._dropLoot(e);
    this.player.ultCharge = Math.min(this.player.ultMax, this.player.ultCharge + 3 * this.player.ultChargeRate);
    // 强化由关卡驱动（杂兵 50% + Boss 死后），不再按击杀数触发
    // 释放敌人回池
    this.enemyPool.release(e);
  }
  onBossDeath(boss) {
    this.bossKills++; this.game.save.bossesKilled++;
    this.score += boss.def.score;
    this.explode(boss.x, boss.y, boss.radius * 1.5, boss.color, true);
    this.explode(boss.x + randRange(-40, 40), boss.y + randRange(-40, 40), boss.radius, '#fff', true);
    setTimeout(() => this.explode(boss.x + randRange(-30, 30), boss.y + randRange(-30, 30), boss.radius * 0.8, boss.color, true), 120);
    setTimeout(() => this.explode(boss.x + randRange(-30, 30), boss.y + randRange(-30, 30), boss.radius * 0.8, '#fff', true), 240);
    Sfx.play('bigExplode');
    this.fx.flash('#fff', 0.7);
    this.fx.shake(24);
    this.bg.setSpeed(1);
    this.boss = null;
    this.spawner.onBossDead();
    Bgm.setMode('normal');
    // 战利品雨
    for (let i = 0; i < 8; i++) {
      this._spawnPowerUp(boss.x + randRange(-40, 40), boss.y + randRange(-40, 40), pick(['power','power','energy','shield','heal','core']));
    }
    // 仅关底 Boss 记录通关进度（解锁下一关）；层 Boss 不记录
    if (this.spawner.phase === 'cleared') this._recordProgress();
    this._triggerUpgrade();
  }
  /** 记录当前难度下当前层通关（用于关卡解锁） */
  _recordProgress() {
    const lv = this.spawner.level;
    const diff = this.opts.difficulty || 'normal';
    const s = this.game.save;
    s.progress = s.progress || {};
    s.progress[diff] = s.progress[diff] || { cleared: 0 };
    s.progress[diff].cleared = Math.max(s.progress[diff].cleared, lv.id);
    saveSave(s);
  }
  onBossPhase(boss, idx) {
    this.fx.flash(COLORS.red, 0.35);
    this.fx.shake(14);
    this.clearEnemyBullets();
    Sfx.play('phase');
    // 阶段切换时清弹并给短暂弱点窗口
    boss.weakpoint = 2.5;
  }
  onPlayerDeath() {
    this.subState = 'dead';
    this.deathTimer = 1.8;
    this.explode(this.player.x, this.player.y, 40, this.player.ship.color, true);
    Sfx.play('bigExplode');
    this.fx.shake(20);
    this.fx.flash(COLORS.red, 0.5);
  }
  collectPowerUp(pu) {
    const p = this.player;
    switch (pu.type) {
      case 'energy': p.ultCharge = Math.min(p.ultMax, p.ultCharge + 20); break;
      case 'shield': p.healShield(30); break;
      case 'heal': p.heal(30); break;
      case 'power':
        // 升级已有武器或解锁
        this._applyPowerDrop();
        break;
      case 'core': this.score += 100; break;
      case 'bomb': this.clearEnemyBullets(); this.aoeDamage(p.x, p.y, 9999, 60, COLORS.gold); break;
      case 'magnet': p.magnetTimer = 6; break;
    }
    this.score += pu.score;
    Sfx.play(pu.type === 'power' || pu.type === 'core' ? 'powerup' : 'pickup');
    this.fx.flash(POWERUPS[pu.type].color, 0.15);
  }
  _applyPowerDrop() {
    const p = this.player;
    // 优先升级随机已有武器
    const upgradable = p.weapons.filter(w => w.level < WEAPONS[w.id].levels.length);
    if (upgradable.length > 0 && (p.weapons.length >= 3 || chance(0.7))) {
      const w = pick(upgradable);
      w.level++;
    } else if (p.weapons.length < 3) {
      // 加新武器
      const owned = new Set(p.weapons.map(w => w.id));
      const avail = Object.keys(WEAPONS).filter(id => !owned.has(id));
      if (avail.length) p.weapons.push({ id: pick(avail), level: 1, cd: 0 });
    } else {
      this.score += 80;
    }
  }
  _dropLoot(e) {
    const d = e.drops || {};
    const dm = this.diff.dropMult;
    for (const [type, p] of Object.entries(d)) {
      if (chance(p * dm)) this._spawnPowerUp(e.x, e.y, type);
    }
  }
  _spawnPowerUp(x, y, type) {
    const def = POWERUPS[type];
    const pu = new PowerUp();
    pu.init({ x, y, vy: 70, type, color: def.color, radius: def.radius, score: def.score });
    this.powerups.push(pu);
  }

  // ─── 工具方法 ───
  findNearestEnemy(x, y) {
    let best = null, bd = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (this.boss && this.boss.alive) {
      const d = dist(x, y, this.boss.x, this.boss.y);
      if (d < bd) best = this.boss;
    }
    return best;
  }
  clearEnemyBullets() { this.eBullets.clear(); }
  aoeDamage(x, y, r, dmg, color) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (dist(x, y, e.x, e.y) < r + e.radius) e.takeDamage(dmg, this);
    }
    if (this.boss && this.boss.alive && dist(x, y, this.boss.x, this.boss.y) < r + this.boss.radius) {
      this.boss.takeDamage(dmg, this);
    }
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * TAU, sp = randRange(100, 400);
      this.spawnParticle({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: randRange(0.3, 0.7), color, size: randRange(2, 4), glow: true });
    }
  }
  shake(n) { if (this.game.save.settings.screenShake) this.fx.shake(n); }
  flash(color, a) { this.fx.flash(color, a); }
  playSfx(name) { Sfx.play(name); }
  spawnDamageNumber(x, y, n, crit) { this.fx.damageNum(x, y, n, crit); }
  spawnHitSpark(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * TAU, sp = randRange(60, 180);
      this.spawnParticle({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: randRange(0.15, 0.3), color, size: randRange(1.5, 3), glow: true });
    }
  }
  explode(x, y, r, color, big = false) {
    const n = big ? 28 : 14;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = randRange(80, big ? 360 : 220);
      this.spawnParticle({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: randRange(0.3, big ? 0.9 : 0.5), color: chance(0.4) ? '#fff' : color, size: randRange(2, big ? 5 : 3.5), glow: true, drag: 0.92 });
    }
    // 冲击波环
    this.spawnParticle({ x, y, vx: 0, vy: 0, life: 0.3, color: '#fff', size: r, glow: false, drag: 1 });
    this.fx.shake(big ? 10 : 4);
  }
  emitDashTrail(p) {
    for (let i = 0; i < 8; i++) {
      this.spawnParticle({ x: p.x + randRange(-8, 8), y: p.y + randRange(-8, 8), vx: randRange(-30, 30), vy: randRange(40, 120), life: randRange(0.2, 0.4), color: p.ship.color, size: randRange(2, 4), glow: true });
    }
  }

  // ─── 升级 ───
  _triggerUpgrade() {
    if (this.subState !== 'play') { this._pendingUpgrade = true; return; }
    this.subState = 'upgrade';
    this.upgradeChoices = getUpgradeChoices(this.player);
    Sfx.play('powerup');
  }
  _resolveUpgrade(idx) {
    const c = this.upgradeChoices[idx];
    if (c) { c.apply(this.player); Sfx.play('powerup'); }
    this.subState = 'play';
    this.upgradeChoices = [];
    if (this._pendingUpgrade) { this._pendingUpgrade = false; this._triggerUpgrade(); return; }
    // 层 Boss(0/1) 死后强化结束 → 推进下一层（杂兵→层 Boss 循环）
    if (this.spawner.advanceAfterUpgrade(this)) return;
    // 关底 Boss(层2) 死后强化结束 → 继续/退出选择，最后一关直接通关
    if (this.spawner.phase === 'cleared') {
      if (this.spawner.isLastLevel) this._win();
      else this.subState = 'choosing';
    }
  }
  /** 关末选择：继续下一关（肉鸽推进） */
  _chooseContinue() {
    Sfx.play('powerup');
    this.spawner.nextLevel();
    this.subState = 'play';
    this.levelBanner = 2.5;   // 显示下一关横幅
  }
  /** 关末选择：退出到关卡选择（本关进度已记录，可随时重玩） */
  _chooseQuit() {
    Sfx.play('click');
    this.game.gotoLevelSelect({ shipId: this.player.ship.id, difficulty: this.opts.difficulty });
  }
  /** 层切换横幅（层0→1→2 推进时由 Spawner 调用） */
  showSubStageBanner(subStage) {
    this.subStageBanner = 1.8;
    Sfx.play('phase');
  }
  /** 通关第 10 层 */
  _win() {
    const s = this.game.save;
    if (this.score > s.bestScore) s.bestScore = this.score;
    if (this.time > s.bestTime) s.bestTime = this.time;
    s.maxLevel = Math.max(s.maxLevel || 0, LEVELS.length);
    saveSave(s);
    this.game.gotoGameOver({
      score: this.score, time: this.time, kills: this.kills,
      bossKills: this.bossKills, maxCombo: this.maxCombo, ship: this.player.ship,
      difficulty: this.opts.difficulty, victory: true,
    });
  }

  // ─── 主更新 ───
  update(dt, input) {
    if (this.subState === 'play') this._updatePlay(dt, input);
    else if (this.subState === 'upgrade') this._updateUpgrade(dt, input);
    else if (this.subState === 'choosing') this._updateChoosing(dt, input);
    else if (this.subState === 'paused') this._updatePaused(dt, input);
    else if (this.subState === 'dead') this._updateDead(dt, input);
  }

  _updatePlay(dt, input) {
    this.time += dt;
    // 暂停
    if (input.consume('pausePressed')) { this.subState = 'paused'; return; }

    this.spawner.update(dt, this);
    this.player.update(dt, input, this);

    for (const e of this.enemies) e.update(dt, this);
    if (this.boss) this.boss.update(dt, this);
    for (const b of this.pBullets.active) b.update(dt, this);
    for (const b of this.eBullets.active) b.update(dt, this);
    for (const p of this.powerups) p.update(dt, this);
    for (const p of this.particles.active) p.update(dt);
    for (const l of this.lasers) this._updateLaser(l, dt);

    this._collisions();

    this.pBullets.sweep(); this.eBullets.sweep(); this.particles.sweep();
    this.enemies = this.enemies.filter(e => e.alive);
    this.powerups = this.powerups.filter(p => p.alive);
    this.lasers = this.lasers.filter(l => l.alive);

    if (this.bossIntroT > 0) this.bossIntroT -= dt;

    // 连击衰减
    this.comboTimer -= dt;
    if (this.comboTimer <= 0 && this.combo > 0) { this.combo = 0; }
    if (this.combo > 1) this.hud.showCombo(`×${this.combo}`);

    if (this.levelBanner > 0) this.levelBanner -= dt;
    if (this.subStageBanner > 0) this.subStageBanner -= dt;
    this.bg.update(dt);
    this.fx.update(dt);
    this.hud.update(dt);
  }

  _updateLaser(l, dt) {
    l.t += dt;
    if (l.t < l.warn) {
      l.state = 'warn';
      if (l.rotating) l.angle += dt * 1.2; // 预警时缓慢旋转
    } else if (l.t < l.warn + l.fire) {
      l.state = 'fire';
      // fire 阶段固定方向
    } else { l.alive = false; return; }
    // 伤害（仅 fire）
    if (l.state === 'fire') {
      l._dmg -= dt;
      const p = this.player;
      const bx = l.origin.x, by = l.origin.y;
      const ex = bx + Math.cos(l.angle) * 2000, ey = by + Math.sin(l.angle) * 2000;
      const d = _pointSegDist(p.x, p.y, bx, by, ex, ey);
      if (d < l.width / 2 + p.hitbox && l._dmg <= 0) {
        p.takeDamage(l.damage, this, null);
        l._dmg = 0.15;
      }
    }
  }

  _collisions() {
    const p = this.player;
    if (!p.alive) return;
    // 玩家子弹 vs 敌人
    for (const b of this.pBullets.active) {
      if (!b.alive) continue;
      // blade 持续命中多目标
      if (b.type === 'blade') {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
            const cd = (b.cdHits && b.cdHits.get(e)) || 0;
            if (cd > 0) continue;
            e.takeDamage(b.damage, this, b._crit);
            if (b.cdHits) b.cdHits.set(e, 0.3);
            this.spawnHitSpark(b.x, b.y, b.color);
            if (p.lifesteal > 0) p.heal(b.damage * p.lifesteal);
          }
        }
        if (this.boss && this.boss.alive && circleHit(b.x, b.y, b.radius, this.boss.x, this.boss.y, this.boss.radius)) {
          const cd = (b.cdHits && b.cdHits.get(this.boss)) || 0;
          if (cd <= 0) {
            this.boss.takeDamage(b.damage * (this.boss.weakpoint > 0 ? 3 : 1), this, b._crit);
            if (b.cdHits) b.cdHits.set(this.boss, 0.3);
            if (p.lifesteal > 0) p.heal(b.damage * p.lifesteal);
          }
        }
      } else {
        let hit = false;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
            e.takeDamage(b.damage, this, b._crit);
            this.spawnHitSpark(b.x, b.y, b.color);
            if (p.lifesteal > 0) p.heal(b.damage * p.lifesteal);
            p.ultCharge = Math.min(p.ultMax, p.ultCharge + b.damage * 0.08 * p.ultChargeRate);
            if (b.pierce > 0) { b.pierce--; hit = true; continue; }
            b.alive = false; hit = true; break;
          }
        }
        if (!hit && this.boss && this.boss.alive && circleHit(b.x, b.y, b.radius, this.boss.x, this.boss.y, this.boss.radius)) {
          this.boss.takeDamage(b.damage * (this.boss.weakpoint > 0 ? 3 : 1), this, b._crit);
          this.spawnHitSpark(b.x, b.y, b.color);
          if (p.lifesteal > 0) p.heal(b.damage * p.lifesteal);
          p.ultCharge = Math.min(p.ultMax, p.ultCharge + b.damage * 0.08 * p.ultChargeRate);
          if (b.pierce > 0) b.pierce--; else b.alive = false;
        }
      }
    }
    // 敌弹 vs 玩家
    if (p.invuln <= 0 && p.dashTimer <= 0) {
      for (const b of this.eBullets.active) {
        if (!b.alive) continue;
        if (circleHit(b.x, b.y, b.radius, p.x, p.y, p.hitbox)) {
          p.takeDamage(b.damage, this, null);
          b.alive = false;
          this.spawnHitSpark(b.x, b.y, COLORS.red);
          Sfx.play('damage');
          break;
        }
      }
    }
    // 敌人 vs 玩家（碰撞伤害）
    if (p.invuln <= 0 && p.dashTimer <= 0) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (circleHit(e.x, e.y, e.radius, p.x, p.y, p.hitbox + 4)) {
          p.takeDamage(e.explosive ? e.explosiveDamage : 16, this, e);
          if (e.explosive) { e.alive = false; this.onEnemyDeath(e, false); }
          break;
        }
      }
      if (this.boss && this.boss.alive && circleHit(this.boss.x, this.boss.y, this.boss.radius * 0.7, p.x, p.y, p.hitbox)) {
        p.takeDamage(25, this, this.boss);
      }
    }
  }

  _updateUpgrade(dt, input) {
    // 背景缓慢滚动
    this.bg.update(dt * 0.2);
    this.fx.update(dt);
    // 选择
    for (let i = 0; i < 3; i++) {
      if (input.keys.has(`Digit${i + 1}`)) { this._resolveUpgrade(i); return; }
    }
    const card = this._cardRects();
    for (let i = 0; i < card.length; i++) {
      const r = card[i];
      if (input.pointer.x >= r.x && input.pointer.x <= r.x + r.w &&
          input.pointer.y >= r.y && input.pointer.y <= r.y + r.h && input.consume('pressed')) {
        this._resolveUpgrade(i); return;
      }
    }
  }
  _cardRects() {
    const w = 150, h = 220, gap = 14;
    const total = 3 * w + 2 * gap;
    const x0 = VIEW.W / 2 - total / 2;
    const y = VIEW.H / 2 - h / 2;
    return [0, 1, 2].map(i => ({ x: x0 + i * (w + gap), y, w, h }));
  }

  _updatePaused(dt, input) {
    this.bg.update(dt * 0.1);
    if (input.consume('pausePressed')) { this.subState = 'play'; }
    // 按钮点击在 _renderPaused 中处理
  }

  _updateChoosing(dt, input) {
    // 背景缓慢滚动，残余粒子/敌弹继续消散
    this.bg.update(dt * 0.25);
    this.fx.update(dt);
    for (const p of this.particles.active) p.update(dt);
    this.particles.sweep();
    // 按钮点击在 _renderChoosing 中处理
  }

  _updateDead(dt, input) {
    this.deathTimer -= dt;
    // 让残余粒子继续飞
    for (const p of this.particles.active) p.update(dt);
    this.particles.sweep();
    this.bg.update(dt * 0.5);
    this.fx.update(dt);
    if (this.deathTimer <= 0) {
      // 存档
      const s = this.game.save;
      if (this.score > s.bestScore) s.bestScore = this.score;
      if (this.time > s.bestTime) s.bestTime = this.time;
      s.maxLevel = Math.max(s.maxLevel || 0, this.spawner.levelIdx);
      saveSave(s);
      this.game.gotoGameOver({
        score: this.score, time: this.time, kills: this.kills,
        bossKills: this.bossKills, maxCombo: this.maxCombo, ship: this.player.ship,
        difficulty: this.opts.difficulty,
      });
    }
  }

  // ─── 渲染 ───
  render(ctx) {
    ctx.save();
    this.fx.applyShake(ctx);
    this.bg.render(ctx);

    // 实体（粒子在最上层渲染，避免被机体遮挡）
    for (const pu of this.powerups) pu.render(ctx);
    for (const e of this.enemies) e.render(ctx);
    if (this.boss) this.boss.render(ctx);
    for (const b of this.eBullets.active) b.render(ctx);
    for (const l of this.lasers) this._renderLaser(l, ctx);
    if (this.player.alive) this.player.render(ctx);
    for (const b of this.pBullets.active) b.render(ctx);
    for (const p of this.particles.active) {
      if (p.glow === false && p.drag === 1) this._renderShock(p, ctx);
      else p.render(ctx);
    }

    // 特效
    this.fx.renderDmg(ctx);

    // HUD
    this.hud.render(ctx, this.player, this.score, this.combo, this.time, this.boss, this.player.ultCharge >= this.player.ultMax);
    // 关卡进度条（3 层 · 每层带 Boss）
    this.hud.renderLevel(ctx, {
      levelIdx: this.spawner.levelIdx,
      subStage: this.spawner.subStage,
      phase: this.spawner.phase,
      levelProgress: this.spawner.levelProgress,
      bossHpRatio: this.boss && this.boss.alive ? this.boss._displayHp / this.boss.maxHp : 0,
    });

    // Boss 登场演出
    if (this.bossIntroT > 0) this._renderBossIntro(ctx);

    // 覆盖层
    if (this.subState === 'upgrade') this._renderUpgrade(ctx);
    else if (this.subState === 'choosing') this._renderChoosing(ctx);
    else if (this.subState === 'paused') this._renderPaused(ctx);

    this.fx.renderFlash(ctx);
    if (this.levelBanner > 0) this._renderLevelBanner(ctx);
    if (this.subStageBanner > 0) this._renderSubStageBanner(ctx);
    ctx.restore();
  }
  _renderShock(p, ctx) {
    const a = clamp(p.life / 0.3, 0, 1);
    ctx.save();
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - a) * 3, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  _renderLaser(l, ctx) {
    const bx = l.origin.x, by = l.origin.y;
    const ex = bx + Math.cos(l.angle) * 2000, ey = by + Math.sin(l.angle) * 2000;
    ctx.save();
    if (l.state === 'warn') {
      const blink = Math.floor(l.t * 12) % 2 === 0;
      ctx.globalAlpha = blink ? 0.6 : 0.2;
      ctx.strokeStyle = l.color; ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = l.color; ctx.shadowBlur = 20;
      ctx.strokeStyle = l.color; ctx.lineWidth = l.width;
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = l.width * 0.35;
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    }
    ctx.restore();
  }
  _renderBossIntro(ctx) {
    const a = this.bossIntroT > 2 ? (2.6 - this.bossIntroT) / 0.6 : Math.min(1, this.bossIntroT / 0.6);
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, VIEW.H / 2 - 80, VIEW.W, 160);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.red;
    ctx.shadowColor = COLORS.red; ctx.shadowBlur = 20;
    ctx.font = 'bold 14px Rajdhani, monospace';
    ctx.fillText(t('bossWarning'), VIEW.W / 2, VIEW.H / 2 - 40);
    ctx.font = 'bold 38px Orbitron, monospace';
    ctx.fillText(this.bossIntroName, VIEW.W / 2, VIEW.H / 2);
    ctx.restore();
  }
  /** 层切换横幅：显示层名 + 通关提示 */
  _renderLevelBanner(ctx) {
    const lv = this.spawner.level;
    const a = this.levelBanner > 2 ? (2.5 - this.levelBanner) / 0.5 : Math.min(1, this.levelBanner / 0.5);
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, VIEW.H / 2 - 70, VIEW.W, 140);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px Rajdhani, monospace';
    ctx.fillStyle = '#8899bb';
    ctx.fillText(`${t('level')} ${lv.id} / ${LEVELS.length}`, VIEW.W / 2, VIEW.H / 2 - 30);
    ctx.font = 'bold 40px Orbitron, monospace';
    ctx.fillStyle = lv.id === 1 ? COLORS.green : COLORS.cyan;
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16;
    ctx.fillText(t('lv_' + lv.id + '_name'), VIEW.W / 2, VIEW.H / 2 + 8);
    ctx.shadowBlur = 0;
    ctx.font = '13px Rajdhani, monospace';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(t('layerInfo'), VIEW.W / 2, VIEW.H / 2 + 44);
    ctx.restore();
  }
  /** 层间横幅：层0→1→2 推进时显示层名 + 主题 */
  _renderSubStageBanner(ctx) {
    const lv = this.spawner.level;
    const sd = SUBSTAGES[this.spawner.subStage];
    const a = this.subStageBanner > 1.5 ? (1.8 - this.subStageBanner) / 0.3 : Math.min(1, this.subStageBanner / 0.4);
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, VIEW.H / 2 - 50, VIEW.W, 100);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px Rajdhani, monospace';
    ctx.fillStyle = '#8899bb';
    ctx.fillText(`${t('level')} ${lv.id} · ${t('layerNum', this.spawner.subStage + 1, 3)}`, VIEW.W / 2, VIEW.H / 2 - 20);
    ctx.font = 'bold 32px Orbitron, monospace';
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 14;
    ctx.fillText(t('substage_' + sd.id + '_name'), VIEW.W / 2, VIEW.H / 2 + 12);
    ctx.shadowBlur = 0;
    ctx.font = '12px Rajdhani, monospace';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(t('substage_' + sd.id + '_desc'), VIEW.W / 2, VIEW.H / 2 + 38);
    ctx.restore();
  }
  /** 关末选择：继续下一关 / 退出到关卡选择（带本局战绩与当前构筑） */
  _renderChoosing(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(3,4,10,0.82)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lv = this.spawner.level;
    const next = LEVELS[Math.min(this.spawner.levelIdx + 1, LEVELS.length - 1)];

    // 标题
    ctx.fillStyle = COLORS.gold;
    ctx.shadowColor = COLORS.gold; ctx.shadowBlur = 16;
    ctx.font = 'bold 32px Orbitron, monospace';
    ctx.fillText(t('stageClear'), VIEW.W / 2, 150);
    ctx.shadowBlur = 0;
    ctx.font = '14px Rajdhani, monospace';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(t('levelPassed', lv.id, t('lv_' + lv.id + '_name')), VIEW.W / 2, 184);

    // 本局战绩
    const stats = [
      [t('score'), this.score],
      [t('kills'), this.kills],
      [t('survivalTime'), this.time.toFixed(0) + 's'],
      [t('bossKills'), this.bossKills],
    ];
    ctx.font = '15px Rajdhani, monospace';
    let sy = 230;
    for (const [k, v] of stats) {
      ctx.fillStyle = '#778899'; ctx.textAlign = 'left';
      ctx.fillText(k, VIEW.W / 2 - 90, sy);
      ctx.fillStyle = '#e8f0ff'; ctx.textAlign = 'right';
      ctx.fillText(v, VIEW.W / 2 + 90, sy);
      sy += 26;
    }

    // 当前构筑（武器 + 等级）
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Rajdhani, monospace';
    ctx.fillStyle = '#778899';
    ctx.fillText('BUILD', VIEW.W / 2, sy + 10);
    ctx.font = '12px Rajdhani, monospace';
    let bx = VIEW.W / 2 - (this.player.weapons.length - 1) * 50;
    for (const w of this.player.weapons) {
      const def = WEAPONS[w.id];
      ctx.fillStyle = def.color;
      ctx.fillText(`${def.name} Lv${w.level}`, bx, sy + 32);
      bx += 100;
    }

    // 下一关预览
    ctx.font = 'bold 13px Rajdhani, monospace';
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(t('nextLevel', next.id, t('lv_' + next.id + '_name')), VIEW.W / 2, sy + 64);

    // 按钮：继续 / 退出
    if (uiBtn(ctx, this.game.input, VIEW.W / 2 - 200, VIEW.H - 150, 190, 54, t('continue'), COLORS.green)) {
      this._chooseContinue();
    }
    if (uiBtn(ctx, this.game.input, VIEW.W / 2 + 10, VIEW.H - 150, 190, 54, t('quitToSelect'), '#556677')) {
      this._chooseQuit();
    }
    ctx.font = '11px Rajdhani, monospace';
    ctx.fillStyle = '#66778a';
    ctx.textAlign = 'center';
    ctx.fillText(t('quitSaveHint'), VIEW.W / 2, VIEW.H - 80);
    ctx.restore();
  }
  _renderUpgrade(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(3,4,10,0.78)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.gold;
    ctx.shadowColor = COLORS.gold; ctx.shadowBlur = 14;
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.fillText(t('upgrade'), VIEW.W / 2, VIEW.H / 2 - 160);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8899bb'; ctx.font = '13px Rajdhani, monospace';
    ctx.fillText(t('upgradeHint'), VIEW.W / 2, VIEW.H / 2 - 130);

    const rects = this._cardRects();
    for (let i = 0; i < 3; i++) {
      const r = rects[i];
      const c = this.upgradeChoices[i];
      if (!c) continue;
      const col = RARITY_COLOR[c.rarity] || '#888';
      const hover = this.game.input.pointer.x >= r.x && this.game.input.pointer.x <= r.x + r.w &&
                    this.game.input.pointer.y >= r.y && this.game.input.pointer.y <= r.y + r.h;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.lineWidth = 2; ctx.strokeStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = hover ? 20 : 8;
      ctx.fillStyle = 'rgba(8,10,22,0.9)';
      ctx.fillRect(0, 0, r.w, r.h);
      ctx.strokeRect(0, 0, r.w, r.h);
      if (hover) { ctx.globalAlpha = 0.15; ctx.fillStyle = col; ctx.fillRect(0, 0, r.w, r.h); ctx.globalAlpha = 1; }
      ctx.shadowBlur = 0;
      // 顶部稀有度条
      ctx.fillStyle = col; ctx.fillRect(0, 0, r.w, 4);
      // 序号
      ctx.fillStyle = '#445566'; ctx.font = 'bold 12px Rajdhani, monospace'; ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}`, 8, 18);
      // 图标
      ctx.textAlign = 'center';
      ctx.font = 'bold 40px Orbitron, monospace'; ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.fillText(c.icon || '✦', r.w / 2, 60);
      ctx.shadowBlur = 0;
      // 名字
      ctx.fillStyle = '#e8f0ff'; ctx.font = 'bold 17px Orbitron, monospace';
      ctx.fillText(c.name, r.w / 2, 110);
      // 稀有度
      ctx.fillStyle = col; ctx.font = '11px Rajdhani, monospace';
      ctx.fillText(c.rarity.toUpperCase(), r.w / 2, 130);
      // 描述
      ctx.fillStyle = '#aabbcc'; ctx.font = '13px Rajdhani, monospace';
      this._wrapText(ctx, c.desc, r.w / 2, 158, r.w - 20, 16);
      ctx.restore();
    }
    ctx.restore();
  }
  _wrapText(ctx, text, cx, y, maxW, lh) {
    const words = text.split('');
    let line = ''; let yy = y;
    for (const w of words) {
      const test = line + w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, yy); line = w; yy += lh;
      } else line = test;
    }
    if (line) ctx.fillText(line, cx, yy);
  }
  _renderPaused(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(3,4,10,0.7)';
    ctx.fillRect(0, 0, VIEW.W, VIEW.H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.cyan; ctx.font = 'bold 40px Orbitron, monospace';
    ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 14;
    ctx.fillText(t('pause'), VIEW.W / 2, VIEW.H / 2 - 100);
    ctx.shadowBlur = 0;
    ctx.restore();
    if (uiBtn(ctx, this.game.input, VIEW.W / 2 - 90, VIEW.H / 2 - 30, 180, 50, t('resume'), COLORS.green)) {
      this.subState = 'play'; Sfx.play('click');
    }
    if (uiBtn(ctx, this.game.input, VIEW.W / 2 - 90, VIEW.H / 2 + 36, 180, 50, t('quit'), COLORS.red)) {
      Sfx.play('click'); this.game.gotoMenu();
    }
  }
}

// 点到线段距离
function _pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return dist(px, py, cx, cy);
}

// ═══════════════════════════════════════════════════════════
//  结算场景
// ═══════════════════════════════════════════════════════════
export class GameOverScene extends Scene {
  constructor(game, stats) { super(game); this.stats = stats; this.t = 0; this.bg = new Background(); }
  update(dt, input) {
    this.t += dt;
    this.bg.update(dt * 0.3);
  }
  render(ctx) {
    this.bg.render(ctx);
    const W = VIEW.W, H = VIEW.H, s = this.stats;
    // 评级
    const score = s.score;
    let rank = 'C', rankColor = '#8899bb';
    if (score >= 30000) { rank = 'S'; rankColor = COLORS.gold; }
    else if (score >= 15000) { rank = 'A'; rankColor = COLORS.cyan; }
    else if (score >= 7000) { rank = 'B'; rankColor = COLORS.green; }

    const victory = s.victory;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = victory ? COLORS.gold : COLORS.red;
    ctx.shadowColor = victory ? COLORS.gold : COLORS.red; ctx.shadowBlur = 16;
    ctx.font = 'bold 44px Orbitron, monospace';
    ctx.fillText(victory ? t('victory') : t('gameOver'), W / 2, 150);
    ctx.shadowBlur = 0;

    // 评级（通关强制 S + 金色）
    const finalRank = victory ? 'S' : rank;
    const finalRankColor = victory ? COLORS.gold : rankColor;
    ctx.fillStyle = finalRankColor;
    ctx.shadowColor = finalRankColor; ctx.shadowBlur = 24;
    ctx.font = 'bold 110px Orbitron, monospace';
    ctx.fillText(finalRank, W / 2, 280);
    if (victory) {
      ctx.font = 'bold 18px Orbitron, monospace';
      ctx.fillText(t('fullClear'), W / 2, 340);
    }
    ctx.shadowBlur = 0;

    // 数据
    const lines = [
      [t('score'), s.score],
      [t('survivalTime'), s.time.toFixed(0) + 's'],
      [t('kills'), s.kills],
      [t('bossKills'), s.bossKills],
      [t('maxCombo'), s.maxCombo],
      [t('clearedLevels'), (victory ? LEVELS.length : (this.game.save.maxLevel || 0)) + ' / ' + LEVELS.length],
      [t('ship'), t('ship_' + s.ship.id + '_name')],
    ];
    ctx.font = '18px Rajdhani, monospace';
    let y = victory ? 376 : 380;
    for (const [k, v] of lines) {
      ctx.fillStyle = '#8899bb'; ctx.textAlign = 'left';
      ctx.fillText(k, W / 2 - 100, y);
      ctx.fillStyle = '#e8f0ff'; ctx.textAlign = 'right';
      ctx.fillText(v, W / 2 + 100, y);
      y += 30;
    }
    // 最高分
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.gold; ctx.font = '16px Rajdhani, monospace';
    ctx.fillText(`${t('bestScore2')} ${this.game.save.bestScore}`, W / 2, y + 10);

    // 按钮
    if (uiBtn(ctx, this.game.input, W / 2 - 180, H - 130, 170, 50, t('retry'), COLORS.green)) {
      Sfx.play('click');
      this.game.gotoGame({ shipId: s.ship.id, difficulty: s.difficulty || 'normal' });
    }
    if (uiBtn(ctx, this.game.input, W / 2 + 10, H - 130, 170, 50, t('mainMenu'), COLORS.cyan)) {
      Sfx.play('click');
      this.game.gotoMenu();
    }
    ctx.restore();
  }
}
