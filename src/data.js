// data.js — 全部数值与内容配置
// 调平衡只需改这里，逻辑代码不写死数值

// ───────────────────────── 全局常量 ─────────────────────────
export const VIEW = { W: 540, H: 960 };
export const COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff2e9a',
  purple: '#9d4edd',
  gold: '#ffd84d',
  green: '#4dffb0',
  red: '#ff4d6d',
  white: '#e8f0ff',
  blue: '#4d9dff',
};

// ───────────────────────── 战机 ─────────────────────────
export const SHIPS = {
  breaker: {
    id: 'breaker', name: '破晓', title: '突袭型',
    desc: '高机动·闪避充能+1',
    color: COLORS.cyan,
    hp: 80, shield: 40, speed: 400,
    dashCharges: 3, dashCooldown: 1.6,
    ultName: '超载突袭', ultDesc: '瞬间贴脸爆发伤害',
    passive: 'dashCharge',
  },
  star: {
    id: 'star', name: '星骸', title: '均衡型',
    desc: '平衡·护盾回复+50%',
    color: COLORS.gold,
    hp: 100, shield: 60, speed: 360,
    dashCharges: 2, dashCooldown: 1.8,
    ultName: '星陨轰炸', ultDesc: '全屏持续弹幕',
    passive: 'shieldRegen',
  },
  void: {
    id: 'void', name: '虚空', title: '重装型',
    desc: '坦克·受伤减伤30%',
    color: COLORS.purple,
    hp: 140, shield: 50, speed: 320,
    dashCharges: 2, dashCooldown: 2.0,
    ultName: '虚空吞噬', ultDesc: '吸收敌弹转化为回血',
    passive: 'damageReduction',
  },
};

// ───────────────────────── 武器 ─────────────────────────
// 每级覆盖基础 stats。pattern 决定弹道（见 systems.js WeaponSystem）
export const WEAPONS = {
  pulse: {
    id: 'pulse', name: '脉冲激光', rarity: 'common', color: COLORS.cyan,
    pattern: 'pulse',
    levels: [
      { damage: 12, fireRate: 0.28, count: 1, speed: 720, pierce: 1 },
      { damage: 16, fireRate: 0.26, count: 1, speed: 760, pierce: 2 },
      { damage: 22, fireRate: 0.22, count: 2, speed: 800, pierce: 2 },
      { damage: 30, fireRate: 0.20, count: 2, speed: 840, pierce: 3 },
      { damage: 42, fireRate: 0.16, count: 3, speed: 900, pierce: 4 },
    ],
    evolve: 'pulse_lance',
  },
  spread: {
    id: 'spread', name: '散射粒子', rarity: 'common', color: COLORS.green,
    pattern: 'spread',
    levels: [
      { damage: 8, fireRate: 0.34, count: 3, spread: 0.4, speed: 620 },
      { damage: 10, fireRate: 0.32, count: 4, spread: 0.5, speed: 640 },
      { damage: 13, fireRate: 0.28, count: 5, spread: 0.6, speed: 660 },
      { damage: 17, fireRate: 0.26, count: 6, spread: 0.7, speed: 680 },
      { damage: 23, fireRate: 0.22, count: 8, spread: 0.9, speed: 720 },
    ],
  },
  homing: {
    id: 'homing', name: '追踪导弹', rarity: 'rare', color: COLORS.gold,
    pattern: 'homing',
    levels: [
      { damage: 18, fireRate: 0.5, count: 1, speed: 360, turn: 4, life: 2.5 },
      { damage: 22, fireRate: 0.48, count: 2, speed: 380, turn: 4.5, life: 2.5 },
      { damage: 28, fireRate: 0.44, count: 2, speed: 400, turn: 5, life: 2.8 },
      { damage: 36, fireRate: 0.40, count: 3, speed: 420, turn: 5.5, life: 3.0 },
      { damage: 48, fireRate: 0.34, count: 4, speed: 450, turn: 6, life: 3.2 },
    ],
    evolve: 'swarm',
  },
  plasma: {
    id: 'plasma', name: '等离子球', rarity: 'rare', color: COLORS.magenta,
    pattern: 'plasma',
    levels: [
      { damage: 6, fireRate: 0.18, count: 1, speed: 280, radius: 14, life: 1.6 },
      { damage: 8, fireRate: 0.16, count: 1, speed: 300, radius: 16, life: 1.8 },
      { damage: 11, fireRate: 0.14, count: 2, speed: 320, radius: 18, life: 2.0 },
      { damage: 15, fireRate: 0.12, count: 2, speed: 340, radius: 20, life: 2.2 },
      { damage: 20, fireRate: 0.10, count: 3, speed: 360, radius: 22, life: 2.4 },
    ],
  },
  drone: {
    id: 'drone', name: '浮游炮', rarity: 'rare', color: COLORS.blue,
    pattern: 'drone',
    levels: [
      { damage: 7, fireRate: 0.3, count: 1, speed: 600 },
      { damage: 9, fireRate: 0.28, count: 1, speed: 620 },
      { damage: 12, fireRate: 0.26, count: 2, speed: 640 },
      { damage: 16, fireRate: 0.24, count: 2, speed: 660 },
      { damage: 22, fireRate: 0.20, count: 3, speed: 700 },
    ],
  },
  blade: {
    id: 'blade', name: '回旋刃', rarity: 'epic', color: COLORS.purple,
    pattern: 'blade',
    levels: [
      { damage: 14, fireRate: 0.6, count: 1, speed: 360, radius: 30, life: 2.0 },
      { damage: 18, fireRate: 0.56, count: 1, speed: 380, radius: 32, life: 2.2 },
      { damage: 24, fireRate: 0.52, count: 2, speed: 400, radius: 34, life: 2.4 },
      { damage: 32, fireRate: 0.48, count: 2, speed: 420, radius: 36, life: 2.6 },
      { damage: 44, fireRate: 0.42, count: 3, speed: 460, radius: 40, life: 3.0 },
    ],
  },
};

// ───────────────────────── 敌人 ─────────────────────────
export const ENEMIES = {
  grunt: {
    id: 'grunt', name: '哨兵',
    hp: 18, score: 100, radius: 16, color: COLORS.red,
    movement: 'straight', speed: 140,
    fire: 'single', fireRate: 1.6, bulletSpeed: 200,
    drops: { power: 0.06, energy: 0.25, shield: 0.03 },
  },
  sine: {
    id: 'sine', name: '游骑兵',
    hp: 26, score: 150, radius: 16, color: '#ff7a3d',
    movement: 'sine', speed: 130, amp: 120, freq: 3,
    fire: 'aimed', fireRate: 2.0, bulletSpeed: 240,
    drops: { power: 0.08, energy: 0.3 },
  },
  bomber: {
    id: 'bomber', name: '自爆机',
    hp: 14, score: 120, radius: 14, color: COLORS.gold,
    movement: 'chase', speed: 220,
    fire: 'none',
    drops: { energy: 0.5 },
    explosive: true, explosiveRadius: 50, explosiveDamage: 18,
  },
  elite: {
    id: 'elite', name: '精英卫士',
    hp: 120, score: 500, radius: 24, color: COLORS.magenta,
    movement: 'hover', speed: 90, hoverY: 200,
    fire: 'ring3', fireRate: 1.4, bulletSpeed: 200,
    drops: { power: 1.0, core: 0.15, shield: 0.4 },
    buffs: ['shield'],
  },
  turret: {
    id: 'turret', name: '炮塔',
    hp: 60, score: 250, radius: 20, color: COLORS.purple,
    movement: 'stationary',
    fire: 'spread5', fireRate: 1.8, bulletSpeed: 220,
    drops: { power: 0.6, energy: 0.4 },
  },
};

// ───────────────────────── Boss ─────────────────────────
// 每个 phase 有 hp 阈值（占 maxHp 比例）和弹幕脚本 timeline
// timeline 项: { t, act: 'pattern名', args:{...}, dur } 在 phase 时长内循环
export const BOSSES = {
  sentinel: {
    id: 'sentinel', name: '哨兵·零式', title: '观测前哨',
    hp: 1200, radius: 50, color: COLORS.red, score: 3000,
    intro: '敌方信号源锁定... 哨兵型机体接近中',
    phases: [
      {
        hpThreshold: 1.0,
        duration: 999,
        patterns: [
          { type: 'ring', interval: 1.6, args: { count: 16, speed: 180, spin: 1.2 } },
          { type: 'aimed', interval: 0.8, args: { speed: 280 } },
        ],
      },
      {
        hpThreshold: 0.5,
        duration: 999,
        patterns: [
          { type: 'ring', interval: 1.2, args: { count: 24, speed: 200, spin: 2.0 } },
          { type: 'spread', interval: 1.0, args: { count: 7, spread: 1.2, speed: 240 } },
          { type: 'aimed', interval: 0.6, args: { speed: 320 } },
        ],
      },
    ],
  },
  twins: {
    id: 'twins', name: '双生蝶', title: '镜影协奏',
    hp: 2200, radius: 42, color: COLORS.magenta, score: 5000,
    dual: true,
    intro: '双重能量反应... 双生机体已现身',
    phases: [
      {
        hpThreshold: 1.0,
        patterns: [
          { type: 'ring', interval: 1.4, args: { count: 18, speed: 200, spin: 1.5 } },
        ],
      },
      {
        hpThreshold: 0.66,
        patterns: [
          { type: 'spiral', interval: 0.18, args: { arms: 2, speed: 220, spin: 3 } },
          { type: 'aimed', interval: 0.7, args: { speed: 300 } },
        ],
      },
      {
        hpThreshold: 0.33,
        patterns: [
          { type: 'ring', interval: 0.9, args: { count: 28, speed: 220, spin: 2.5 } },
          { type: 'spread', interval: 0.8, args: { count: 9, spread: 1.4, speed: 260 } },
          { type: 'laser', interval: 3.0, args: { warn: 0.8, fire: 1.2, speed: 0 } },
        ],
      },
    ],
  },
  abyss: {
    id: 'abyss', name: '深渊之眼', title: '凝视虚空的核',
    hp: 4000, radius: 60, color: COLORS.purple, score: 10000,
    intro: '警告：高维能量体入侵... 深渊之眼降临',
    phases: [
      {
        hpThreshold: 1.0,
        patterns: [
          { type: 'spiral', interval: 0.12, args: { arms: 3, speed: 200, spin: 2.2 } },
        ],
      },
      {
        hpThreshold: 0.75,
        patterns: [
          { type: 'spiral', interval: 0.1, args: { arms: 4, speed: 220, spin: 2.8 } },
          { type: 'ring', interval: 1.6, args: { count: 32, speed: 160, spin: 1 } },
        ],
      },
      {
        hpThreshold: 0.5,
        patterns: [
          { type: 'ring', interval: 0.7, args: { count: 36, speed: 200, spin: 3 } },
          { type: 'laser', interval: 2.2, args: { warn: 0.7, fire: 1.4, rotating: true } },
          { type: 'aimed', interval: 0.4, args: { speed: 360 } },
        ],
      },
      {
        hpThreshold: 0.25,
        patterns: [
          { type: 'spiral', interval: 0.08, args: { arms: 5, speed: 240, spin: 3.5 } },
          { type: 'ring', interval: 0.6, args: { count: 40, speed: 220, spin: 2 } },
          { type: 'spread', interval: 0.5, args: { count: 11, spread: 1.6, speed: 300 } },
        ],
        enrage: true,
      },
    ],
  },
  // ── 新增 Boss：复用现有弹幕 pattern，通过组合差异营造新鲜感 ──
  vortex: {
    id: 'vortex', name: '漩涡者', title: '螺旋之核',
    hp: 1800, radius: 44, color: COLORS.purple, score: 4000,
    intro: '螺旋能量场检测... 漩涡者降临',
    phases: [
      {
        hpThreshold: 1.0, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.22, args: { arms: 2, speed: 200, spin: 2.0 } },
          { type: 'aimed', interval: 1.0, args: { speed: 300 } },
        ],
      },
      {
        hpThreshold: 0.5, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.16, args: { arms: 3, speed: 220, spin: 2.8 } },
          { type: 'ring', interval: 1.8, args: { count: 20, speed: 180, spin: 1.0 } },
        ],
      },
    ],
  },
  phantom: {
    id: 'phantom', name: '幻影', title: '疾速残像',
    hp: 1500, radius: 38, color: COLORS.magenta, score: 3500,
    intro: '高速信号波动... 幻影突入战场',
    phases: [
      {
        hpThreshold: 1.0, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.18, args: { arms: 2, speed: 240, spin: 3.0 } },
          { type: 'aimed', interval: 0.6, args: { speed: 340 } },
        ],
      },
      {
        hpThreshold: 0.4, duration: 999,
        patterns: [
          { type: 'ring', interval: 0.8, args: { count: 24, speed: 220, spin: 2.5 } },
          { type: 'spiral', interval: 0.14, args: { arms: 3, speed: 260, spin: 3.5 } },
        ],
      },
    ],
  },
  barrage: {
    id: 'barrage', name: '弹幕堡垒', title: '重型炮台',
    hp: 3000, radius: 52, color: COLORS.red, score: 6000,
    intro: '重型装甲反应... 弹幕堡垒就位',
    phases: [
      {
        hpThreshold: 1.0, duration: 999,
        patterns: [
          { type: 'ring', interval: 1.4, args: { count: 18, speed: 180, spin: 1.0 } },
          { type: 'spread', interval: 1.2, args: { count: 7, spread: 1.2, speed: 220 } },
        ],
      },
      {
        hpThreshold: 0.66, duration: 999,
        patterns: [
          { type: 'ring', interval: 1.0, args: { count: 24, speed: 200, spin: 1.8 } },
          { type: 'aimed', interval: 0.7, args: { speed: 300 } },
        ],
      },
      {
        hpThreshold: 0.33, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.16, args: { arms: 3, speed: 220, spin: 2.5 } },
          { type: 'spread', interval: 0.8, args: { count: 9, spread: 1.4, speed: 260 } },
          { type: 'laser', interval: 3.2, args: { warn: 0.8, fire: 1.2 } },
        ],
      },
    ],
  },
  leviathan: {
    id: 'leviathan', name: '利维坦', title: '深渊霸主',
    hp: 5500, radius: 58, color: COLORS.blue, score: 12000,
    intro: '警告：终极生命体反应... 利维坦苏醒',
    phases: [
      {
        hpThreshold: 1.0, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.14, args: { arms: 3, speed: 200, spin: 2.2 } },
          { type: 'ring', interval: 1.6, args: { count: 24, speed: 180, spin: 1.0 } },
        ],
      },
      {
        hpThreshold: 0.6, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.10, args: { arms: 4, speed: 220, spin: 2.8 } },
          { type: 'spread', interval: 0.9, args: { count: 9, spread: 1.3, speed: 250 } },
          { type: 'aimed', interval: 0.5, args: { speed: 340 } },
        ],
      },
      {
        hpThreshold: 0.3, duration: 999,
        patterns: [
          { type: 'spiral', interval: 0.08, args: { arms: 5, speed: 240, spin: 3.2 } },
          { type: 'ring', interval: 0.7, args: { count: 32, speed: 220, spin: 2.0 } },
          { type: 'laser', interval: 2.5, args: { warn: 0.7, fire: 1.4, rotating: true } },
          { type: 'spread', interval: 0.6, args: { count: 11, spread: 1.5, speed: 280 } },
        ],
        enrage: true,
      },
    ],
  },
};

// ───────────────────────── 关卡（10 层闯关） ─────────────────────────
// 每关 3 层，每层 = 杂兵战(duration/3 秒) → 层 Boss；击败层 Boss 触发强化并推进下一层
// bosses[3]: 层0小Boss / 层1中Boss / 层2关底大Boss，hpMult 递增；mobs 为本关敌人池
export const LEVELS = [
  { id: 1,  name: '前哨突破', duration: 30, mobs: ['grunt','grunt','sine'],              interval: 2.0,
    bosses: [{ type:'sentinel', hpMult:0.50 }, { type:'vortex', hpMult:0.50 }, { type:'twins', hpMult:0.60 }] },
  { id: 2,  name: '镜影迷阵', duration: 32, mobs: ['grunt','sine','bomber'],            interval: 1.9,
    bosses: [{ type:'phantom', hpMult:0.50 }, { type:'sentinel', hpMult:0.70 }, { type:'twins', hpMult:0.70 }] },
  { id: 3,  name: '虚空回响', duration: 35, mobs: ['sine','bomber','turret'],           interval: 1.8,
    bosses: [{ type:'vortex', hpMult:0.45 }, { type:'phantom', hpMult:0.70 }, { type:'abyss', hpMult:0.45 }] },
  { id: 4,  name: '哨兵重生', duration: 38, mobs: ['grunt','sine','bomber','turret'],   interval: 1.7,
    bosses: [{ type:'phantom', hpMult:0.55 }, { type:'twins', hpMult:0.50 }, { type:'barrage', hpMult:0.70 }] },
  { id: 5,  name: '双蝶再临', duration: 40, mobs: ['sine','bomber','turret','elite'],   interval: 1.6,
    bosses: [{ type:'sentinel', hpMult:0.70 }, { type:'vortex', hpMult:0.70 }, { type:'twins', hpMult:1.00 }] },
  { id: 6,  name: '深渊凝视', duration: 42, mobs: ['bomber','turret','elite','sine'],   interval: 1.5,
    bosses: [{ type:'vortex', hpMult:0.60 }, { type:'barrage', hpMult:0.55 }, { type:'abyss', hpMult:0.65 }] },
  { id: 7,  name: '钢铁洪流', duration: 45, mobs: ['turret','elite','bomber','sine'],   interval: 1.4,
    bosses: [{ type:'phantom', hpMult:0.70 }, { type:'twins', hpMult:0.65 }, { type:'barrage', hpMult:0.95 }] },
  { id: 8,  name: '蝶舞终章', duration: 48, mobs: ['elite','turret','sine','bomber'],   interval: 1.3,
    bosses: [{ type:'sentinel', hpMult:0.80 }, { type:'vortex', hpMult:0.85 }, { type:'twins', hpMult:1.35 }] },
  { id: 9,  name: '虚空裂痕', duration: 50, mobs: ['elite','turret','bomber','sine'],   interval: 1.2,
    bosses: [{ type:'vortex', hpMult:0.75 }, { type:'barrage', hpMult:0.70 }, { type:'abyss', hpMult:1.20 }] },
  { id: 10, name: '终焉之眼', duration: 55, mobs: ['elite','turret','bomber','sine','grunt'], interval: 1.1,
    bosses: [{ type:'phantom', hpMult:0.85 }, { type:'twins', hpMult:0.90 }, { type:'leviathan', hpMult:1.00 }] },
];

// ───────────────────────── 每关 3 层结构 ─────────────────────────
// 每关 = 层0(小Boss) → 层1(中Boss) → 层2(关底大Boss)
// 每层 = 杂兵战(占该层50%进度) → 层 Boss(占该层50%进度)；Boss 死触发强化
export const SUBSTAGES = [
  { id: 0, name: '前哨', desc: '先遣守卫 · 层 Boss', theme: 'boss' },
  { id: 1, name: '突击', desc: '精英阻截 · 层 Boss', theme: 'boss' },
  { id: 2, name: '决战', desc: '关底统帅 · 终极 Boss', theme: 'boss' },
];

// ───────────────────────── 强化（三选一） ─────────────────────────
export const UPGRADES = [
  // 武器升级类（动态生成时附加武器 id）
  // 通用属性类
  { id: 'dmg1', name: '过载充能', desc: '伤害 +15%', rarity: 'common', apply: (p) => p.dmgMult *= 1.15 },
  { id: 'dmg2', name: '火力全开', desc: '伤害 +25%', rarity: 'rare', apply: (p) => p.dmgMult *= 1.25 },
  { id: 'rate1', name: '冷却压缩', desc: '射速 +15%', rarity: 'common', apply: (p) => p.fireRateMult *= 1.15 },
  { id: 'rate2', name: '极速循环', desc: '射速 +30%', rarity: 'rare', apply: (p) => p.fireRateMult *= 1.30 },
  { id: 'speed1', name: '推进升级', desc: '移速 +20%', rarity: 'common', apply: (p) => p.speed *= 1.2 },
  { id: 'hp1', name: '装甲强化', desc: '最大生命 +30 并回满', rarity: 'common', apply: (p) => { p.maxHp += 30; p.hp = p.maxHp; } },
  { id: 'shield1', name: '护盾扩容', desc: '最大护盾 +25 并回满', rarity: 'common', apply: (p) => { p.maxShield += 25; p.shield = p.maxShield; } },
  { id: 'shieldregen', name: '护盾自愈', desc: '护盾回复速度 +60%', rarity: 'rare', apply: (p) => p.shieldRegen *= 1.6 },
  { id: 'crit1', name: '精准打击', desc: '暴击率 +15%（暴击×2）', rarity: 'rare', apply: (p) => p.crit += 0.15 },
  { id: 'crit2', name: '致命瞄准', desc: '暴击率 +25%', rarity: 'epic', apply: (p) => p.crit += 0.25 },
  { id: 'lifesteal', name: '能量虹吸', desc: '伤害 8% 转为生命', rarity: 'epic', apply: (p) => p.lifesteal += 0.08 },
  { id: 'magnet', name: '引力场', desc: '拾取范围 +80%', rarity: 'common', apply: (p) => p.magnet *= 1.8 },
  { id: 'dash1', name: '闪避充能', desc: '闪避次数 +1', rarity: 'rare', apply: (p) => p.maxDash += 1 },
  { id: 'dashcd', name: '闪避冷却', desc: '闪避冷却 -25%', rarity: 'common', apply: (p) => p.dashCooldown *= 0.75 },
  { id: 'ultfast', name: '大招过载', desc: '大招充能速度 +40%', rarity: 'rare', apply: (p) => p.ultChargeRate *= 1.4 },
  { id: 'pierce', name: '穿透弹头', desc: '所有子弹穿透 +1', rarity: 'epic', apply: (p) => p.bonusPierce += 1 },
  { id: 'multishot', name: '多重射击', desc: '所有武器多发射 +1', rarity: 'epic', apply: (p) => p.bonusShots += 1 },
  { id: 'thorns', name: '反伤装甲', desc: '受击时反弹伤害', rarity: 'rare', apply: (p) => p.thorns += 0.5 },
  { id: 'regen', name: '自修系统', desc: '每秒回复 2 点生命', rarity: 'rare', apply: (p) => p.regen += 2 },
];

// ───────────────────────── 道具 ─────────────────────────
export const POWERUPS = {
  energy: { id: 'energy', color: COLORS.gold, radius: 9, score: 20, desc: '大招能量' },
  shield: { id: 'shield', color: COLORS.green, radius: 10, score: 30, desc: '回复护盾' },
  heal: { id: 'heal', color: COLORS.red, radius: 10, score: 30, desc: '回复生命' },
  power: { id: 'power', color: COLORS.cyan, radius: 12, score: 50, desc: '武器模块' },
  core: { id: 'core', color: COLORS.purple, radius: 13, score: 100, desc: '合成核心' },
  bomb: { id: 'bomb', color: '#ff8c1a', radius: 12, score: 50, desc: '清屏炸弹' },
  magnet: { id: 'magnet', color: COLORS.blue, radius: 12, score: 30, desc: '磁吸 6s' },
};

// ───────────────────────── 难度 ─────────────────────────
// 三个难度共用同一套 10 关，差别只在数值倍率：
//  · hpMult    敌人/Boss 血量倍率
//  · dmgMult   玩家受伤倍率（影响所有伤害来源：敌弹/碰撞/激光）
//  · dropMult  道具掉率倍率
//  · spawnMult 出怪间隔倍率（>1 更稀疏，<1 更密集）
//  · fireMult  敌人/Boss 开火频率倍率（>1 更猛，<1 更缓）
export const DIFFICULTY = {
  casual: {
    name: '休闲', label: 'CASUAL', color: COLORS.green,
    hpMult: 0.7, dmgMult: 0.6, dropMult: 1.3,
    spawnMult: 1.25, fireMult: 0.75,
    desc: '敌人虚弱、伤害低、出怪稀疏、弹幕缓慢、掉落丰厚。放松体验剧情与养成。',
    details: [
      '敌人血量 -30%（更易击破）',
      '玩家受伤 -40%（更耐扛）',
      '出怪间隔 +25%（更稀疏）',
      '敌弹频率 -25%（更缓慢）',
      '道具掉落 +30%（资源充裕）',
    ],
  },
  normal: {
    name: '标准', label: 'NORMAL', color: COLORS.cyan,
    hpMult: 1.0, dmgMult: 1.0, dropMult: 1.0,
    spawnMult: 1.0, fireMult: 1.0,
    desc: '攻防均衡的经典挑战，需走位与强化搭配。推荐首次游玩。',
    details: [
      '全部数值为基准值',
      '6 种武器 · 3 个 Boss · 10 层关卡',
      '容错适中，考验操作与强化构筑',
    ],
  },
  nightmare: {
    name: '噩梦', label: 'NIGHTMARE', color: COLORS.red,
    hpMult: 1.45, dmgMult: 1.4, dropMult: 0.8,
    spawnMult: 0.78, fireMult: 1.35,
    desc: '敌人血厚伤高、出怪更密、弹幕更猛、掉落更少。容错极低，考验极限操作。',
    details: [
      '敌人血量 +45%（击破更慢，暴露更久）',
      '玩家受伤 +40%（中弹即残，容错极低）',
      '出怪间隔 -22%（同屏敌人更多）',
      '敌弹频率 +35%（弹幕更密集，走位空间被压缩）',
      '道具掉落 -20%（回血/护盾资源更紧张）',
    ],
  },
};
