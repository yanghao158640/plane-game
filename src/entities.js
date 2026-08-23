// entities.js — 所有游戏实体
// 依赖: core.js, data.js；通过 scene 提供的 spawn 方法解耦系统层
import { VIEW, COLORS, SHIPS, WEAPONS, ENEMIES, BOSSES } from './data.js';
import { clamp, TAU, angleTowards, dist, circleHit } from './core.js';

// ───────────────────────── 基类 ─────────────────────────
export class Entity {
  constructor() { this.alive = true; this.x = 0; this.y = 0; }
  update() {}
  render() {}
}

// ───────────────────────── 子弹 ─────────────────────────
// 玩家子弹与敌弹共用，通过 owner 区分
export class Bullet {
  constructor() { this.reset(); }
  reset() {
    this.alive = false;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.radius = 5; this.damage = 0; this.color = '#fff';
    this.owner = 'player'; this.pierce = 0; this.life = 3;
    this.homing = false; this.turn = 0; this.target = null;
    this.type = 'solid'; // solid | plasma | blade
    this.angle = -Math.PI / 2;
    this.spin = 0;       // blade 自转
    this.orbit = null;   // blade: {cx,cy,r,offset,speed}
    this.glow = true;
    this._hits = null;   // 已击中集合（穿透去重）
  }
  init(spec) {
    Object.assign(this, spec);
    this.alive = true;
    this._hits = this.pierce > 0 ? new Set() : null;
  }
  update(dt, scene) {
    if (!this.alive) return;
    if (this.type === 'blade' && this.orbit) {
      // 环绕玩家
      this.orbit.a += this.orbit.speed * dt;
      this.x = this.orbit.cx + Math.cos(this.orbit.a) * this.orbit.r;
      this.y = this.orbit.cy + Math.sin(this.orbit.a) * this.orbit.r;
      this.spin += dt * 12;
      this.life -= dt;
      // 跟随玩家中心
      this.orbit.cx = scene.player.x; this.orbit.cy = scene.player.y;
      // 持续命中：用 _hits 做短冷却
    } else {
      if (this.homing) {
        const t = this.target && this.target.alive ? this.target : scene.findNearestEnemy(this.x, this.y, this.owner === 'player' ? 9999 : 9999, 600);
        if (t) {
          this.target = t;
          const want = Math.atan2(t.y - this.y, t.x - this.x);
          const sp = Math.hypot(this.vx, this.vy);
          this.angle = angleTowards(this.angle, want, this.turn * dt);
          this.vx = Math.cos(this.angle) * sp;
          this.vy = Math.sin(this.angle) * sp;
        }
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
    }
    if (this.life <= 0) { this.alive = false; return; }
    const m = 60;
    if (this.y < -m || this.y > VIEW.H + m || this.x < -m || this.x > VIEW.W + m) this.alive = false;
  }
  render(ctx) {
    const { x, y, color, radius } = this;
    if (this.type === 'plasma') {
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = 20;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }
    if (this.type === 'blade') {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(this.spin);
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -radius); ctx.lineTo(radius * 0.5, 0);
      ctx.lineTo(0, radius); ctx.lineTo(-radius * 0.5, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    }
    // 实心弹（拉长光点）
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    const len = this.owner === 'player' ? radius * 2.4 : radius;
    const ang = Math.atan2(this.vy, this.vx);
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath();
    ctx.ellipse(0, 0, len, radius, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// ───────────────────────── 粒子 ─────────────────────────
export class Particle {
  constructor() { this.reset(); }
  reset() {
    this.alive = false;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 1;
    this.color = '#fff'; this.size = 2; this.glow = false; this.drag = 0.94;
  }
  init(spec) { Object.assign(this, spec); this.alive = true; this.maxLife = this.life; }
  update(dt) {
    if (!this.alive) return;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vx *= this.drag; this.vy *= this.drag;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }
  render(ctx) {
    const a = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    if (this.glow) { ctx.shadowColor = this.color; ctx.shadowBlur = 8; }
    ctx.fillStyle = this.color;
    // 半径下限 1.2，避免 DPR=1 时粒子 <1px 渲染成模糊半透明块
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1.2, this.size * a + 0.5), 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ───────────────────────── 道具 ─────────────────────────
export class PowerUp {
  constructor() { this.reset(); }
  reset() {
    this.alive = false; this.x = 0; this.y = 0; this.vy = 80;
    this.type = 'energy'; this.color = '#fff'; this.radius = 9; this.score = 0;
    this.t = 0; this.collected = false;
  }
  init(spec) { Object.assign(this, spec); this.alive = true; this.t = 0; }
  update(dt, scene) {
    if (!this.alive) return;
    this.t += dt;
    const p = scene.player;
    // 磁吸
    const d = dist(this.x, this.y, p.x, p.y);
    const range = p.magnetTimer > 0 ? 9999 : p.magnet;
    if (d < range) {
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      const pull = range === 9999 ? 600 : 320 * (1 - d / range);
      this.x += Math.cos(a) * pull * dt;
      this.y += Math.sin(a) * pull * dt;
    } else {
      this.y += this.vy * dt;
    }
    if (this.y > VIEW.H + 30) this.alive = false;
    // 拾取
    if (d < p.hitbox + this.radius + 6) {
      scene.collectPowerUp(this);
      this.alive = false;
    }
  }
  render(ctx) {
    const bob = Math.sin(this.t * 6) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.shadowColor = this.color; ctx.shadowBlur = 14;
    ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(5,6,15,0.7)';
    // 菱形
    ctx.beginPath();
    ctx.moveTo(0, -this.radius); ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius); ctx.lineTo(-this.radius, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.35, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// ───────────────────────── 玩家 ─────────────────────────
export class Player {
  constructor(shipId) {
    const s = SHIPS[shipId];
    this.ship = s;
    this.x = VIEW.W / 2; this.y = VIEW.H - 150;
    this.radius = 18; this.hitbox = 6;
    this.hp = s.hp; this.maxHp = s.hp;
    this.shield = s.shield; this.maxShield = s.shield;
    this.speed = s.speed;
    // 武器
    this.weapons = [{ id: 'pulse', level: 1, cd: 0 }];
    this.drones = [];   // 浮游炮
    this.blades = [];   // 环绕刃（bullet 引用）
    // 数值 buff
    this.dmgMult = 1; this.fireRateMult = 1; this.crit = 0;
    this.lifesteal = 0; this.magnet = 80; this.bonusPierce = 0;
    this.bonusShots = 0; this.thorns = 0; this.regen = 0;
    // 难度：玩家受伤倍率（由 GameScene 按 DIFFICULTY.dmgMult 注入）
    this.dmgTakenMult = 1;
    this.shieldRegen = 8; this.shieldDelay = 2.5; this.shieldTimer = 0;
    // 闪避
    this.maxDash = s.dashCharges; this.dashes = s.dashCharges;
    this.dashCooldown = s.dashCooldown; this.dashCdTimer = 0;
    this.dashTimer = 0; this.dashDir = { x: 0, y: -1 };
    this.invuln = 0;
    // 大招
    this.ultCharge = 0; this.ultMax = 100; this.ultChargeRate = 1;
    this.ultActive = 0;
    // 状态
    this.alive = true; this.t = 0; this.magnetTimer = 0;
    this.thrust = 0; // 尾焰强度
    this._dronesDirty = false; this._bladeSpec = null;
    this.regenAcc = 0;
  }

  takeDamage(dmg, scene, source) {
    if (this.invuln > 0 || this.dashTimer > 0) return false;
    // 难度放大受伤（噩梦 +40%、休闲 -40%）
    dmg *= (this.dmgTakenMult || 1);
    // 护盾优先
    let remain = dmg;
    if (this.shield > 0) {
      const a = Math.min(this.shield, remain);
      this.shield -= a; remain -= a;
    }
    if (remain > 0) {
      remain *= (this.ship.passive === 'damageReduction' ? 0.7 : 1);
      this.hp -= remain;
    }
    this.invuln = 0.6;
    this.shieldTimer = 0;
    scene.shake(8);
    scene.flash(COLORS.red, 0.25);
    if (this.thorns > 0 && source && source.takeDamage) {
      source.takeDamage(dmg * this.thorns, scene);
    }
    if (this.hp <= 0) { this.hp = 0; this.alive = false; scene.onPlayerDeath(); }
    return true;
  }

  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }
  healShield(n) { this.shield = Math.min(this.maxShield, this.shield + n); }

  dash(input, scene) {
    if (this.dashes <= 0 || this.dashTimer > 0) return;
    let dx = input.move.x, dy = input.move.y;
    if (dx === 0 && dy === 0) dy = -1; // 默认向上
    const len = Math.hypot(dx, dy) || 1;
    this.dashDir = { x: dx / len, y: dy / len };
    this.dashTimer = 0.22;
    this.invuln = Math.max(this.invuln, 0.22);
    this.dashes--;
    if (this.dashCdTimer <= 0) this.dashCdTimer = this.dashCooldown;
    scene.emitDashTrail(this);
    scene.playSfx('dash');
  }

  fireUlt(scene) {
    if (this.ultCharge < this.ultMax || this.ultActive > 0) return;
    this.ultCharge = 0; this.ultActive = 1.2;
    scene.shake(20); scene.flash('#fff', 0.5);
    scene.playSfx('ult');
    // 清屏弹
    scene.clearEnemyBullets();
    // 各机型大招
    const ship = this.ship.id;
    if (ship === 'breaker') {
      // 前方巨型爆发：发射一排强力穿透弹
      for (let i = -6; i <= 6; i++) {
        scene.spawnPlayerBullet({
          x: this.x, y: this.y, vx: i * 40, vy: -900,
          radius: 10, damage: 80, color: COLORS.cyan, pierce: 99, life: 1.2, type: 'plasma',
        });
      }
    } else if (ship === 'star') {
      // 全屏持续弹幕
      for (let k = 0; k < 60; k++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        scene.spawnPlayerBullet({
          x: this.x, y: this.y, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600,
          radius: 6, damage: 30, color: COLORS.gold, pierce: 3, life: 2,
        });
      }
    } else if (ship === 'void') {
      // 虚空吞噬：回血 + 范围伤害
      this.heal(this.maxHp * 0.25);
      scene.aoeDamage(this.x, this.y, 300, 150, COLORS.purple);
    }
  }

  update(dt, input, scene) {
    this.t += dt;
    if (!this.alive) return;
    // 输入：优先触屏/鼠标拖拽，其次键盘
    let tx = this.x, ty = this.y;
    if (input.dragging && input.pointer.active) {
      // 指针上方偏移，避免手指遮挡玩家
      tx = input.pointer.x; ty = input.pointer.y - 44;
    } else if (input.move.x !== 0 || input.move.y !== 0) {
      tx = this.x + input.move.x * this.speed * dt;
      ty = this.y + input.move.y * this.speed * dt;
    }
    // 闪避位移
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      const ds = 900 * dt;
      tx = this.x + this.dashDir.x * ds;
      ty = this.y + this.dashDir.y * ds;
    }
    this.thrust = clamp(Math.hypot(tx - this.x, ty - this.y) / (this.speed * dt + 1), 0, 1);
    this.x = clamp(tx, 16, VIEW.W - 16);
    this.y = clamp(ty, 16, VIEW.H - 16);

    // 闪避充能恢复
    if (this.dashCdTimer > 0) {
      this.dashCdTimer -= dt;
      if (this.dashCdTimer <= 0 && this.dashes < this.maxDash) {
        this.dashes++;
        if (this.dashes < this.maxDash) this.dashCdTimer = this.dashCooldown;
      }
    }
    // 输入事件
    if (input.consume('dashPressed')) this.dash(input, scene);
    if (input.consume('ultPressed')) this.fireUlt(scene);

    // 无敌帧
    if (this.invuln > 0) this.invuln -= dt;
    if (this.ultActive > 0) this.ultActive -= dt;
    if (this.magnetTimer > 0) this.magnetTimer -= dt;

    // 护盾回复
    this.shieldTimer += dt;
    if (this.shieldTimer >= this.shieldDelay && this.shield < this.maxShield) {
      const reg = this.shieldRegen * (this.ship.passive === 'shieldRegen' ? 1.5 : 1);
      this.shield = Math.min(this.maxShield, this.shield + reg * dt);
    }
    // 生命回复
    if (this.regen > 0) {
      this.regenAcc += this.regen * dt;
      if (this.regenAcc >= 1) { const h = Math.floor(this.regenAcc); this.heal(h); this.regenAcc -= h; }
    }

    // 武器开火（由 scene.weaponSystem 处理）
    for (const w of this.weapons) {
      w.cd -= dt;
      if (w.cd <= 0) {
        scene.fireWeapon(w, this);
        const def = WEAPONS[w.id];
        const lv = def.levels[w.level - 1];
        w.cd = lv.fireRate / this.fireRateMult;
      }
    }
    // 浮游炮位置
    this.updateDrones(dt);
    // 大招充能（时间 + 击杀在 scene 处理）
    this.ultCharge = Math.min(this.ultMax, this.ultCharge + 6 * this.ultChargeRate * dt);
  }

  updateDrones(dt) {
    const droneW = this.weapons.find(w => w.id === 'drone');
    const want = droneW ? WEAPONS.drone.levels[droneW.level - 1].count : 0;
    // 调整 drone 数量
    while (this.drones.length < want) this.drones.push({ a: (this.drones.length / want) * TAU, cd: 0 });
    while (this.drones.length > want) this.drones.pop();
    for (const d of this.drones) {
      d.a += dt * 2.2;
      d.x = this.x + Math.cos(d.a) * 46;
      d.y = this.y + Math.sin(d.a) * 46 * 0.7 + 6;
    }
  }

  render(ctx) {
    const s = this.ship;
    // 尾焰
    const thrust = (this.dashTimer > 0 ? 1.6 : 0.6) + this.thrust * 0.6;
    ctx.save();
    ctx.translate(this.x, this.y);
    // 引擎尾焰
    const flame = 14 + Math.sin(this.t * 30) * 4 + thrust * 10;
    const g = ctx.createLinearGradient(0, 8, 0, 8 + flame);
    g.addColorStop(0, s.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-6, 8); ctx.lineTo(0, 8 + flame); ctx.lineTo(6, 8); ctx.closePath(); ctx.fill();

    // 无敌闪烁
    const blink = this.invuln > 0 && this.dashTimer <= 0 ? (Math.floor(this.t * 30) % 2 === 0 ? 0.4 : 1) : 1;
    ctx.globalAlpha = blink;
    ctx.shadowColor = s.color; ctx.shadowBlur = 14;
    // 机身（三角箭头）
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(13, 12); ctx.lineTo(5, 8);
    ctx.lineTo(0, 12); ctx.lineTo(-5, 8); ctx.lineTo(-13, 12);
    ctx.closePath(); ctx.fill();
    // 驾驶舱
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -4, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // 护盾光环
    if (this.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.t * 4);
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.green; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 8, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // 浮游炮
    for (const d of this.drones) {
      ctx.save();
      ctx.shadowColor = COLORS.blue; ctx.shadowBlur = 8;
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
}

// ───────────────────────── 敌人 ─────────────────────────
export class Enemy {
  constructor() { this.reset(); }
  reset() {
    this.alive = false; this.x = 0; this.y = 0; this.t = 0;
    this.type = 'grunt'; this.hp = 1; this.maxHp = 1; this.score = 0;
    this.radius = 16; this.color = '#fff'; this.speed = 100;
    this.movement = 'straight'; this.amp = 0; this.freq = 1;
    this.fire = 'none'; this.fireRate = 2; this.fireTimer = 0; this.bulletSpeed = 200;
    this.explosive = false; this.explosiveRadius = 0; this.explosiveDamage = 0;
    this.buffs = []; this.shieldHp = 0; this.enraged = false;
    this.hoverY = 200; this._baseX = 0; this.hitFlash = 0;
  }
  init(type, x, y, diffMult = 1, fireMult = 1) {
    const def = ENEMIES[type];
    Object.assign(this, def);
    this.type = type; this.x = x; this.y = y; this._baseX = x;
    this.maxHp = def.hp * diffMult; this.hp = this.maxHp;
    this.fireMult = fireMult;  // 开火频率倍率（>1 更猛）
    if (def.buffs?.includes('shield')) this.shieldHp = this.maxHp * 0.5;
    this.fireTimer = Math.random() * this.fireRate;
    this.alive = true; this.t = 0; this.hitFlash = 0;
  }
  takeDamage(dmg, scene, crit = false) {
    if (this.shieldHp > 0) {
      const a = Math.min(this.shieldHp, dmg);
      this.shieldHp -= a; dmg -= a;
    }
    this.hp -= dmg;
    this.hitFlash = 0.08;
    scene.spawnDamageNumber(this.x, this.y - this.radius, Math.ceil(dmg), crit);
    if (this.hp <= 0) { this.alive = false; scene.onEnemyDeath(this); }
  }
  update(dt, scene) {
    if (!this.alive) return;
    this.t += dt; this.hitFlash = Math.max(0, this.hitFlash - dt);
    // 移动
    switch (this.movement) {
      case 'straight': this.y += this.speed * dt; break;
      case 'sine':
        this.y += this.speed * dt;
        this.x = this._baseX + Math.sin(this.t * this.freq) * this.amp;
        this.x = clamp(this.x, 20, VIEW.W - 20);
        break;
      case 'chase': {
        const p = scene.player;
        const a = Math.atan2(p.y - this.y, p.x - this.x);
        this.x += Math.cos(a) * this.speed * dt;
        this.y += Math.sin(a) * this.speed * dt;
        break;
      }
      case 'hover':
        if (this.y < this.hoverY) this.y += this.speed * dt;
        else this.x = this._baseX + Math.sin(this.t * 1.2) * 120;
        this.x = clamp(this.x, 30, VIEW.W - 30);
        break;
      case 'stationary': break;
    }
    // 开火（fireMult>1 → 间隔更短、开火更猛）
    if (this.fire !== 'none' && this.y > 0) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        scene.enemyFire(this);
        this.fireTimer = this.fireRate / (this.fireMult || 1);
      }
    }
    // 出界
    if (this.y > VIEW.H + 60) this.alive = false;
    // 自爆机接触玩家
    if (this.explosive && scene.player.alive && circleHit(this.x, this.y, this.radius, scene.player.x, scene.player.y, scene.player.hitbox + 6)) {
      scene.player.takeDamage(this.explosiveDamage, scene, this);
      this.alive = false; scene.onEnemyDeath(this, false);
    }
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const flash = this.hitFlash > 0;
    ctx.shadowColor = this.color; ctx.shadowBlur = 10;
    ctx.fillStyle = flash ? '#fff' : this.color;
    const r = this.radius;
    switch (this.type) {
      case 'grunt':
        ctx.beginPath();
        ctx.moveTo(0, r); ctx.lineTo(r, -r * 0.6); ctx.lineTo(0, -r * 0.3);
        ctx.lineTo(-r, -r * 0.6); ctx.closePath(); ctx.fill();
        break;
      case 'sine':
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
        ctx.closePath(); ctx.fill();
        break;
      case 'bomber':
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.fillStyle = COLORS.gold; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill();
        break;
      case 'elite':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + this.t * 0.5;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill();
        break;
      case 'turret':
        ctx.fillRect(-r, -r * 0.7, r * 2, r * 1.4);
        ctx.fillStyle = COLORS.purple;
        ctx.fillRect(-r * 0.3, -r, r * 0.6, r * 0.6);
        break;
      default:
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 护盾
    if (this.shieldHp > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 6, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // 血条（精英/Boss 之外少血量也可显示）
    if (this.type === 'elite' || this.type === 'turret') {
      this._bar(ctx, this.maxHp);
    }
  }
  _bar(ctx, max) {
    const w = this.radius * 2;
    const h = 3;
    const x = this.x - w / 2, y = this.y - this.radius - 8;
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x, y, w * clamp(this.hp / max, 0, 1), h);
  }
}

// ───────────────────────── Boss ─────────────────────────
export class Boss {
  constructor() { this.reset(); }
  reset() {
    this.alive = false; this.x = 0; this.y = 0; this.t = 0;
    this.def = null; this.hp = 1; this.maxHp = 1;
    this.phaseIdx = 0; this.patternTimers = [];
    this.entering = true; this.weakpoint = 0;
    this.hitFlash = 0; this.invuln = 0; this.enraged = false;
    this.subs = []; // 双体 Boss 的副体
  }
  init(defId, diffMult = 1, fireMult = 1) {
    const def = BOSSES[defId];
    this.def = def; this.defId = defId;
    this.maxHp = def.hp * diffMult; this.hp = this.maxHp;
    this.radius = def.radius; this.color = def.color;
    this.fireMult = fireMult;  // 弹幕频率倍率（>1 更猛）
    this.x = VIEW.W / 2; this.y = -def.radius;
    this.phaseIdx = 0; this.patternTimers = def.phases[0].patterns.map(() => 0);
    this.entering = true; this.alive = true; this.t = 0;
    this.hitFlash = 0; this.invuln = 2; this.weakpoint = 0; this.enraged = false;
  }
  takeDamage(dmg, scene, crit = false) {
    if (this.invuln > 0) return;
    this.hp -= dmg;
    this.hitFlash = 0.06;
    scene.spawnDamageNumber(this.x + (Math.random() - 0.5) * 40, this.y - this.radius, Math.ceil(dmg), crit);
    if (this.hp <= 0) { this.hp = 0; this.alive = false; scene.onBossDeath(this); return; }
    // 阶段切换
    const def = this.def;
    const ratio = this.hp / this.maxHp;
    for (let i = this.phaseIdx + 1; i < def.phases.length; i++) {
      if (ratio <= def.phases[i].hpThreshold) {
        this.phaseIdx = i;
        this.patternTimers = def.phases[i].patterns.map(() => 0);
        this.invuln = 1.2;
        scene.onBossPhase(this, i);
        break;
      }
    }
  }
  update(dt, scene) {
    if (!this.alive) return;
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    // 入场
    if (this.entering) {
      this.y += 60 * dt;
      if (this.y >= 140) { this.y = 140; this.entering = false; }
      return;
    }
    // 移动：跟随玩家 X 缓动
    const p = scene.player;
    const targetX = clamp(p.x, this.radius + 20, VIEW.W - this.radius - 20);
    this.x += (targetX - this.x) * Math.min(1, dt * 1.5);
    this.y = 140 + Math.sin(this.t * 1.5) * 14;

    // 狂暴
    const phase = this.def.phases[this.phaseIdx];
    if (phase.enrage && !this.enraged) { this.enraged = true; scene.flash(COLORS.red, 0.5); }

    // 弹幕模式（fireMult>1 → 间隔更短、弹幕更猛）
    const rateMult = (this.enraged ? 0.6 : 1) / (this.fireMult || 1);
    for (let i = 0; i < phase.patterns.length; i++) {
      const pat = phase.patterns[i];
      this.patternTimers[i] -= dt;
      if (this.patternTimers[i] <= 0) {
        scene.bossPattern(this, pat);
        this.patternTimers[i] = pat.interval * rateMult;
      }
    }
    // 弱点窗口
    if (this.weakpoint > 0) this.weakpoint -= dt;
  }
  render(ctx) {
    const r = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    const flash = this.hitFlash > 0;
    // 外层旋转环
    ctx.rotate(this.t * 0.3);
    ctx.strokeStyle = this.color; ctx.lineWidth = 2;
    ctx.shadowColor = this.color; ctx.shadowBlur = 20;
    ctx.globalAlpha = this.invuln > 0 ? 0.6 : 1;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + (k * 0.3);
        const rr = r * (0.9 + k * 0.05);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
    ctx.rotate(-this.t * 0.3);
    // 核心球
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.7);
    g.addColorStop(0, flash ? '#fff' : '#fff');
    g.addColorStop(0.4, this.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.fill();
    // 弱点核心
    if (this.weakpoint > 0 || this.invuln <= 0) {
      ctx.fillStyle = this.weakpoint > 0 ? COLORS.gold : '#fff';
      ctx.shadowBlur = this.weakpoint > 0 ? 30 : 10;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Boss 血条由 HUD 绘制
  }
}

// Boss 查找使用顶部已导入的 BOSSES
