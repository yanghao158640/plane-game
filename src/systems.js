// systems.js — 武器开火、敌弹模式、波次生成、强化选择
// 全部为纯函数/轻量类，通过 scene 提供的 spawn 方法发射，与实体层解耦
import { VIEW, COLORS, WEAPONS, UPGRADES, LEVELS, SUBSTAGES } from './data.js';
import { TAU, clamp, randRange, pick, chance } from './core.js';

// ───────────────────────── 玩家武器开火 ─────────────────────────
/** 计算单发伤害（含暴击） */
function rollDmg(player, base) {
  if (player.crit > 0 && chance(player.crit)) return { dmg: base * 2, crit: true };
  return { dmg: base, crit: false };
}

/**
 * 触发一把武器开火。scene.spawnPlayerBullet(spec) 返回子弹引用。
 */
export function fireWeapon(w, player, scene) {
  const def = WEAPONS[w.id];
  const lv = def.levels[w.level - 1];
  const baseDmg = lv.damage * player.dmgMult;
  const pierce = (lv.pierce || 0) + player.bonusPierce;
  const extra = player.bonusShots;
  const color = def.color;

  switch (def.pattern) {
    case 'pulse': {
      const n = lv.count + extra;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 10;
        const r = rollDmg(player, baseDmg);
        scene.spawnPlayerBullet({
          x: player.x + off, y: player.y - 16, vx: 0, vy: -lv.speed,
          radius: 5, damage: r.dmg, color, pierce, life: 2, _crit: r.crit,
        });
      }
      break;
    }
    case 'spread': {
      const n = lv.count + extra;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * lv.spread : 0);
        const r = rollDmg(player, baseDmg);
        scene.spawnPlayerBullet({
          x: player.x, y: player.y - 12, vx: Math.cos(a) * lv.speed, vy: Math.sin(a) * lv.speed,
          radius: 4, damage: r.dmg, color, pierce, life: 2, _crit: r.crit,
        });
      }
      break;
    }
    case 'homing': {
      const n = lv.count + extra;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.3;
        const r = rollDmg(player, baseDmg);
        scene.spawnPlayerBullet({
          x: player.x, y: player.y, vx: Math.cos(a) * lv.speed, vy: Math.sin(a) * lv.speed,
          radius: 5, damage: r.dmg, color, pierce: 1, life: lv.life,
          homing: true, turn: lv.turn, angle: a, _crit: r.crit,
        });
      }
      break;
    }
    case 'plasma': {
      const n = lv.count + extra;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 14;
        const r = rollDmg(player, baseDmg);
        scene.spawnPlayerBullet({
          x: player.x + off, y: player.y - 12, vx: 0, vy: -lv.speed,
          radius: lv.radius, damage: r.dmg, color, pierce: 2, life: lv.life, type: 'plasma', _crit: r.crit,
        });
      }
      break;
    }
    case 'drone': {
      // 每个浮游炮各发一发直射
      const r = rollDmg(player, baseDmg);
      for (const d of player.drones) {
        scene.spawnPlayerBullet({
          x: d.x, y: d.y, vx: 0, vy: -lv.speed,
          radius: 4, damage: r.dmg, color, pierce, life: 2, _crit: r.crit,
        });
      }
      break;
    }
    case 'blade': {
      // 维持 count 个环绕刃，过期会被自动清理
      const want = lv.count + extra;
      const alive = player.blades.filter(b => b.alive);
      while (alive.length < want) {
        const idx = alive.length;
        const r = rollDmg(player, baseDmg);
        const b = scene.spawnPlayerBullet({
          x: player.x, y: player.y, vx: 0, vy: 0,
          radius: lv.radius, damage: r.dmg, color, pierce: 99, life: lv.life,
          type: 'blade',
          orbit: { cx: player.x, cy: player.y, r: 70, a: (idx / want) * TAU, speed: 3 },
          cdHits: new Map(),
        });
        player.blades.push(b); alive.push(b);
      }
      // 清理失效引用
      player.blades = player.blades.filter(b => b.alive);
      break;
    }
  }
  scene.playSfx('shoot');
}

// ───────────────────────── 敌人开火 ─────────────────────────
export function enemyFire(e, scene) {
  const sp = e.bulletSpeed;
  const px = e.x, py = e.y;
  switch (e.fire) {
    case 'single':
      scene.spawnEnemyBullet({ x: px, y: py + e.radius, vx: 0, vy: sp, radius: 5, color: COLORS.red });
      break;
    case 'aimed': {
      const a = Math.atan2(scene.player.y - py, scene.player.x - px);
      scene.spawnEnemyBullet({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, radius: 5, color: '#ff7a3d' });
      break;
    }
    case 'ring3':
      for (let i = 0; i < 3; i++) {
        const a = Math.PI / 2 + (i - 1) * 0.5;
        scene.spawnEnemyBullet({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, radius: 5, color: e.color });
      }
      break;
    case 'spread5':
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + (i - 2) * 0.25;
        scene.spawnEnemyBullet({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, radius: 5, color: e.color });
      }
      break;
  }
}

// ───────────────────────── Boss 弹幕模式 ─────────────────────────
export function bossPattern(boss, pat, scene) {
  const { type, args } = pat;
  const bx = boss.x, by = boss.y;
  const col = boss.color;
  switch (type) {
    case 'ring': {
      const baseRot = (boss.t * (args.spin || 0));
      for (let i = 0; i < args.count; i++) {
        const a = (i / args.count) * TAU + baseRot;
        scene.spawnEnemyBullet({ x: bx, y: by, vx: Math.cos(a) * args.speed, vy: Math.sin(a) * args.speed, radius: 6, color: col });
      }
      break;
    }
    case 'spiral': {
      const baseA = boss.t * (args.spin || 0);
      for (let k = 0; k < args.arms; k++) {
        const a = baseA + (k / args.arms) * TAU;
        scene.spawnEnemyBullet({ x: bx, y: by, vx: Math.cos(a) * args.speed, vy: Math.sin(a) * args.speed, radius: 5, color: col });
      }
      break;
    }
    case 'spread': {
      const n = args.count;
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * args.spread : 0);
        scene.spawnEnemyBullet({ x: bx, y: by, vx: Math.cos(a) * args.speed, vy: Math.sin(a) * args.speed, radius: 6, color: col });
      }
      break;
    }
    case 'aimed': {
      const a = Math.atan2(scene.player.y - by, scene.player.x - bx);
      scene.spawnEnemyBullet({ x: bx, y: by, vx: Math.cos(a) * args.speed, vy: Math.sin(a) * args.speed, radius: 6, color: COLORS.gold });
      break;
    }
    case 'laser':
      scene.spawnLaser(boss, args);
      break;
  }
}

// ───────────────────────── 敌人生成器（每关 3 层 · 每层带 Boss） ─────────────────────────
/**
 * 关卡驱动：每关 = 层0(小Boss) → 层1(中Boss) → 层2(关底大Boss)
 * 每层 = 杂兵战(stageDuration 秒) → 层 Boss；击败层 Boss 触发强化并推进下一层
 * 击败层2关底 Boss 后由 scene 弹出"继续/退出"选择（最后一关直接通关）
 * phase: 'mob'(杂兵) | 'boss'(层Boss战) | 'cleared'(关底Boss已击败，待选择)
 * subStage: 0..2 当前层索引；强化时机：每层 Boss 死后触发一次（共 3 次/关）
 */
export class Spawner {
  constructor(spawnMult = 1) {
    this.spawnMult = spawnMult;  // 出怪间隔倍率（>1 更稀疏，<1 更密集）
    this.reset();
  }
  reset() {
    this.levelIdx = 0;          // 当前关索引（0..LEVELS.length-1）
    this.subStage = 0;          // 当前层 0..2
    this.phase = 'mob';
    this.stageElapsed = 0;      // 当前层杂兵阶段已用秒数
    this.stageTimer = 1.5;      // 下次出怪倒计时
  }
  get level() { return LEVELS[this.levelIdx]; }
  get isLastLevel() { return this.levelIdx >= LEVELS.length - 1; }
  get isFinalBoss() { return this.subStage >= 2; }   // 层2 = 关底大Boss
  get subStageDef() { return SUBSTAGES[this.subStage]; }
  /** 当前层杂兵阶段时长（每层均分关卡总时长 1/3） */
  get stageDuration() { return this.level.duration / 3; }
  /** 当前层杂兵进度 0..1 */
  get stageProgress() {
    if (this.stageDuration === 0) return 0;
    return clamp(this.stageElapsed / this.stageDuration, 0, 1);
  }
  /** 整关进度 0..1（3 层各 1/3；每层内杂兵占 50%、Boss 占 50%） */
  get levelProgress() {
    if (this.phase === 'cleared') return 1;
    const base = this.subStage / 3;
    if (this.phase === 'boss') return base + 0.5;   // Boss 阶段起始 = 该层 50%（精确进度由 HUD 用 bossHpRatio 补足）
    return base + clamp(this.stageProgress, 0, 1) * 0.5;
  }
  update(dt, scene) {
    if (this.phase !== 'mob' || scene.subState !== 'play') return;
    this.stageElapsed += dt;
    this.stageTimer -= dt;
    if (this.stageTimer <= 0) {
      this.spawnWave(scene);
      // 越往后层出怪越密
      const layerMult = [1.0, 0.85, 0.7][this.subStage] || 1;
      this.stageTimer = this.level.interval * (this.spawnMult || 1) * layerMult;
    }
    // 杂兵阶段结束 → 出该层 Boss
    if (this.stageElapsed >= this.stageDuration) {
      this._enterBoss(scene);
    }
  }
  /** 杂兵阶段结束，进入该层 Boss 战 */
  _enterBoss(scene) {
    this.phase = 'boss';
    this.stageElapsed = 0;
    const bdef = this.level.bosses[this.subStage];
    // 关间弹幕递增：每关 +5%、每层 +3%（与难度 fireMult 叠加）
    // 例：第1关层0=1.0；第10关层2=1+0.45+0.06=1.51；噩梦再 ×1.35
    const fireBonus = 1 + this.levelIdx * 0.05 + this.subStage * 0.03;
    scene.spawnBoss(bdef.type, bdef.hpMult, fireBonus);
  }
  spawnWave(scene) {
    const lv = this.level;
    const stage = this.subStage;
    const basic = lv.mobs.filter(m => m !== 'elite' && m !== 'turret');
    const pool = basic.length ? basic : lv.mobs;
    let type = pick(pool);
    // 层1/2 有概率掺精英或炮塔，增加变化
    if (stage >= 1 && chance(0.3) && lv.mobs.includes('elite')) type = 'elite';
    else if (stage >= 1 && chance(0.25) && lv.mobs.includes('turret')) type = 'turret';
    const count = 1 + Math.floor(Math.random() * 3) + Math.floor(this.levelIdx / 3) + stage;
    const formation = pick(['line', 'v', 'random']);
    this._spawn(scene, type, Math.min(count, 7), formation);
  }
  _spawn(scene, type, count, formation) {
    const W = VIEW.W;
    if (formation === 'line') {
      const cx = randRange(80, W - 80);
      for (let i = 0; i < count; i++)
        scene.spawnEnemy(type, clamp(cx + (i - count / 2) * 44, 30, W - 30), -30 - i * 10);
    } else if (formation === 'v') {
      const cx = randRange(80, W - 80);
      for (let i = 0; i < count; i++) {
        const off = (i - count / 2) * 40;
        scene.spawnEnemy(type, clamp(cx + off, 30, W - 30), -30 - Math.abs(off) * 0.6);
      }
    } else {
      for (let i = 0; i < count; i++)
        scene.spawnEnemy(type, randRange(30, W - 30), randRange(-100, -30));
    }
  }
  /** Boss 被击败：层Boss(0/1)待强化后推进；关底Boss(层2)进入 cleared 等选择 */
  onBossDead() {
    if (this.isFinalBoss) this.phase = 'cleared';
    // 层 Boss: 保持 phase='boss'，由 advanceAfterUpgrade 推进下一层
  }
  /** 强化结束后调用：推进到下一层；返回 true=已推进(层Boss)，false=关底待选择 */
  advanceAfterUpgrade(scene) {
    if (this.phase === 'cleared') return false;
    if (this.subStage < 2) {
      this.subStage++;
      this.phase = 'mob';
      this.stageElapsed = 0;
      this.stageTimer = 1.5;
      scene.showSubStageBanner(this.subStage);
      return true;
    }
    return false;
  }
  /** 进入下一关；返回 false 表示已通关（无下一关） */
  nextLevel() {
    if (this.levelIdx >= LEVELS.length - 1) return false;
    this.levelIdx++;
    this.subStage = 0;
    this.phase = 'mob';
    this.stageElapsed = 0;
    this.stageTimer = 2.2;          // 关切换横幅期间延迟出怪
    return true;
  }
}

// ───────────────────────── 强化选择 ─────────────────────────
const RARITY_WEIGHT = { common: 60, rare: 30, epic: 8 };

/** 生成三选一强化卡片 */
export function getUpgradeChoices(player) {
  const choices = [];
  // 已有武器升级
  for (const w of player.weapons) {
    const def = WEAPONS[w.id];
    if (w.level < def.levels.length) {
      choices.push({
        kind: 'weaponUp', rarity: def.rarity,
        name: `${def.name} 升级`,
        desc: `Lv${w.level} → Lv${w.level + 1}`,
        icon: '⬆',
        apply: (p) => {
          const ww = p.weapons.find(x => x.id === w.id);
          if (ww) ww.level++;
        },
      });
    }
  }
  // 新武器（槽位 < 3）
  if (player.weapons.length < 3) {
    for (const id of Object.keys(WEAPONS)) {
      if (!player.weapons.find(w => w.id === id)) {
        const def = WEAPONS[id];
        choices.push({
          kind: 'newWeapon', rarity: def.rarity,
          name: `新武器：${def.name}`,
          desc: def.pattern,
          icon: '✦',
          apply: (p) => p.weapons.push({ id, level: 1, cd: 0 }),
        });
      }
    }
  }
  // 通用属性
  for (const u of UPGRADES) choices.push({ ...u, kind: 'stat', icon: '+' });

  // 加权随机不重复取 3 个
  const pool = choices.slice();
  const picked = [];
  while (picked.length < 3 && pool.length > 0) {
    let total = 0;
    for (const c of pool) total += RARITY_WEIGHT[c.rarity] || 30;
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= (RARITY_WEIGHT[pool[i].rarity] || 30);
      if (r <= 0) { idx = i; break; }
    }
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}
