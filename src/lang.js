// lang.js — 多语言 i18n 系统
// 用法: 在场景中导入 t, setLang, getLang, LANGUAGES
// 调用 t('key') 获取当前语言翻译

const LANGUAGES = {
  zh: { name: '中文' },
  en: { name: 'EN' },
};

const _lang = {
  current: 'zh', // 默认中文
};

function _load() {
  try {
    const saved = localStorage.getItem('game_lang');
    if (saved === 'zh' || saved === 'en') _lang.current = saved;
  } catch (e) { /* ignore */ }
}
_load();

function getLang() { return _lang.current; }

function setLang(code) {
  if (code !== 'zh' && code !== 'en') return;
  _lang.current = code;
  try { localStorage.setItem('game_lang', code); } catch (e) { /* ignore */ }
}

// ─── 翻译表 ───
const T = {
  zh: {
    // 标题
    title: '星陨·裂空战机',
    subtitle: 'STARFALL · RIFT FIGHTER',

    // 菜单
    bestScore: '最高分',
    bestTime: '最久存活',
    selectShip: '选择战机',
    difficulty: '难度',
    levelSelect: '关卡选择 LEVEL SELECT',
    back: '返回 BACK',
    pause: '已暂停 PAUSED',
    resume: '继续 RESUME',
    quit: '放弃 QUIT',
    retry: '再战 RETRY',
    mainMenu: '主菜单 MENU',
    continue: '继续下一关 CONTINUE',
    quitToSelect: '退出关卡选择 QUIT',
    quitSaveHint: '退出后本关进度已保存，可从关卡选择随时重玩或挑战更高关',

    // 操作说明
    pcControls: 'PC: WASD/方向键 移动 · 鼠标拖拽 · 空格大招 · Shift闪避 · P暂停',
    mobileControls: '手机: 拖拽移动 · 双指大招 · 三指闪避',
    tip: 'Tip: 自动开火，专注走位；过关解锁下一关',

    // 难度
    diffCasual: '休闲',
    diffNormal: '普通',
    diffNightmare: '噩梦',

    // 关卡选择
    difficultyDiff: '难度差异 DIFFICULTY DIFF',
    cleared: '已通关',
    locked: '未解锁 LOCKED',
    ready: '可挑战 READY',
    stageClear: '关卡通过 · STAGE CLEAR',
    levelPassed: (lvId, lvName) => `第 ${lvId} 关「${lvName}」已通关 · 进度已保存`,
    nextLevel: (lvId, lvName) => `下一关：第 ${lvId} 关「${lvName}」`,
    progress: (cleared, total) => `已通关 ${cleared} / ${total}  ·  通关解锁下一关`,
    clearedLabel: '已通关 CLEARED',
    bossSuffix: '关底',

    // 战斗
    hp: 'HP',
    shield: 'SH',
    ult: 'ULT',
    ultReady: 'READY',
    time: 'TIME',
    dash: 'DASH',
    combo: 'COMBO',
    level: 'LEVEL',
    layer: '层',
    bossWarning: '⚠ WARNING ⚠',
    stageClear2: '关卡通关 · STAGE CLEAR',
    layerInfo: '3 层挑战 · 每层击败 Boss 推进 · 通关解锁下一关',
    // 层状态
    layerNum: (n, total) => `层 ${n}/${total}`,
    layerBoss: (n, total, name) => `层 ${n}/${total} · ${name} BOSS`,
    finalBoss: (n, total) => `层 ${n}/${total} · 关底 BOSS`,
    layerName: (n, total, name) => `层 ${n}/${total} · ${name}`,

    // 升级
    upgrade: '强化选择 · UPGRADE',
    upgradeHint: '点击卡片或按 1 / 2 / 3',

    // 结算
    victory: '任务成功',
    gameOver: '任务结束',
    fullClear: 'CLEAR · 全 10 层通关',
    score: '分数',
    survivalTime: '存活时间',
    kills: '击杀数',
    bossKills: 'Boss 击破',
    maxCombo: '最高连击',
    clearedLevels: '通关层数',
    ship: '战机',
    bestScore2: '最高分',

    // 游戏结束
    gameOverTitle: '任务结束',

    // ─── 游戏数据翻译 ───
    // 战机
    ship_breaker_name: '破晓',
    ship_breaker_title: '突袭型',
    ship_breaker_desc: '高机动·闪避充能+1',
    ship_star_name: '星骸',
    ship_star_title: '均衡型',
    ship_star_desc: '平衡·护盾回复+50%',
    ship_void_name: '虚空',
    ship_void_title: '重装型',
    ship_void_desc: '坦克·受伤减伤30%',

    // 难度名称/描述
    diff_casual_label: 'CASUAL',
    diff_casual_desc: '敌人虚弱、伤害低、出怪稀疏、弹幕缓慢、掉落丰厚。放松体验剧情与养成。',
    diff_casual_detail1: '敌人血量 -30%（更易击破）',
    diff_casual_detail2: '玩家受伤 -40%（更耐扛）',
    diff_casual_detail3: '出怪间隔 +25%（更稀疏）',
    diff_casual_detail4: '敌弹频率 -25%（更缓慢）',
    diff_casual_detail5: '道具掉落 +30%（资源充裕）',
    diff_normal_label: 'NORMAL',
    diff_normal_desc: '攻防均衡的经典挑战，需走位与强化搭配。推荐首次游玩。',
    diff_normal_detail1: '全部数值为基准值',
    diff_normal_detail2: '6 种武器 · 3 个 Boss · 10 层关卡',
    diff_normal_detail3: '容错适中，考验操作与强化构筑',
    diff_nightmare_label: 'NIGHTMARE',
    diff_nightmare_desc: '敌人如潮、弹幕如雨、掉落吝啬。只有最强者才能生还。',
    diff_nightmare_detail1: '敌人血量 +45%（更耐打）',
    diff_nightmare_detail2: '玩家受伤 +40%（更脆弱）',
    diff_nightmare_detail3: '出怪间隔 -22%（更密集）',
    diff_nightmare_detail4: '敌弹频率 +35%（弹幕地狱）',
    diff_nightmare_detail5: '道具掉落 -20%（资源匮乏）',

    // 关卡名
    lv_1_name: '前哨突破',
    lv_2_name: '镜影迷阵',
    lv_3_name: '虚空回响',
    lv_4_name: '哨兵重生',
    lv_5_name: '双蝶再临',
    lv_6_name: '深渊凝视',
    lv_7_name: '钢铁洪流',
    lv_8_name: '蝶舞终章',
    lv_9_name: '虚空裂痕',
    lv_10_name: '终焉之眼',

    // Boss 名
    boss_sentinel_name: '哨兵',
    boss_twins_name: '双生蝶',
    boss_abyss_name: '深渊之眼',
    boss_vortex_name: '漩涡者',
    boss_phantom_name: '幻影',
    boss_barrage_name: '弹幕堡垒',
    boss_leviathan_name: '利维坦',

    // 层名
    substage_0_name: '前哨',
    substage_0_desc: '先遣守卫 · 层 Boss',
    substage_1_name: '突击',
    substage_1_desc: '精英阻截 · 层 Boss',
    substage_2_name: '决战',
    substage_2_desc: '关底统帅 · 终极 Boss',
  },
  en: {
    title: 'STARFALL · RIFT FIGHTER',
    subtitle: 'STARFALL · RIFT FIGHTER',

    bestScore: 'Best Score',
    bestTime: 'Best Survival',
    selectShip: 'SELECT SHIP',
    difficulty: 'DIFFICULTY',
    levelSelect: 'LEVEL SELECT',
    back: 'BACK',
    pause: 'PAUSED',
    resume: 'RESUME',
    quit: 'QUIT',
    retry: 'RETRY',
    mainMenu: 'MENU',
    continue: 'CONTINUE',
    quitToSelect: 'QUIT TO LEVEL SELECT',
    quitSaveHint: 'Progress saved. You can replay or challenge higher levels anytime.',

    pcControls: 'PC: WASD/Arrows Move · Mouse Drag · Space Ult · Shift Dash · P Pause',
    mobileControls: 'Mobile: Drag Move · Two-finger Ult · Three-finger Dash',
    tip: 'Tip: Auto-fire, focus on dodging; clear levels to unlock next',

    diffCasual: 'Casual',
    diffNormal: 'Normal',
    diffNightmare: 'Nightmare',

    difficultyDiff: 'DIFFICULTY DIFF',
    cleared: 'CLEARED',
    locked: 'LOCKED',
    ready: 'READY',
    stageClear: 'STAGE CLEAR',
    levelPassed: (lvId, lvName) => `Level ${lvId} "${lvName}" cleared · Progress saved`,
    nextLevel: (lvId, lvName) => `Next: Level ${lvId} "${lvName}"`,
    progress: (cleared, total) => `${cleared} / ${total} cleared · Clear to unlock next`,
    clearedLabel: 'CLEARED',
    bossSuffix: 'Boss',

    hp: 'HP',
    shield: 'SH',
    ult: 'ULT',
    ultReady: 'READY',
    time: 'TIME',
    dash: 'DASH',
    combo: 'COMBO',
    level: 'LEVEL',
    layer: 'Layer',
    bossWarning: '⚠ WARNING ⚠',
    stageClear2: 'STAGE CLEAR',
    layerInfo: '3 layers per level · Beat each boss to advance · Clear to unlock next',
    layerNum: (n, total) => `Layer ${n}/${total}`,
    layerBoss: (n, total, name) => `Layer ${n}/${total} · ${name} BOSS`,
    finalBoss: (n, total) => `Layer ${n}/${total} · FINAL BOSS`,
    layerName: (n, total, name) => `Layer ${n}/${total} · ${name}`,

    upgrade: 'UPGRADE',
    upgradeHint: 'Click card or press 1 / 2 / 3',

    victory: 'MISSION ACCOMPLISHED',
    gameOver: 'MISSION COMPLETE',
    fullClear: 'CLEAR · All 10 Levels',
    score: 'Score',
    survivalTime: 'Survival Time',
    kills: 'Kills',
    bossKills: 'Boss Kills',
    maxCombo: 'Max Combo',
    clearedLevels: 'Levels Cleared',
    ship: 'Ship',
    bestScore2: 'Best Score',

    gameOverTitle: 'MISSION COMPLETE',

    // ─── 游戏数据翻译 ───
    ship_breaker_name: 'Breaker',
    ship_breaker_title: 'Striker',
    ship_breaker_desc: 'High mobility · Dash +1',
    ship_star_name: 'Starfall',
    ship_star_title: 'Balanced',
    ship_star_desc: 'Balanced · Shield regen +50%',
    ship_void_name: 'Void',
    ship_void_title: 'Tank',
    ship_void_desc: 'Tank · Damage taken -30%',

    diff_casual_label: 'CASUAL',
    diff_casual_desc: 'Weak enemies, low damage, sparse spawns, slow bullets, generous drops. Relax and enjoy.',
    diff_casual_detail1: 'Enemy HP -30%',
    diff_casual_detail2: 'Player damage taken -40%',
    diff_casual_detail3: 'Spawn interval +25%',
    diff_casual_detail4: 'Enemy fire rate -25%',
    diff_casual_detail5: 'Item drop rate +30%',
    diff_normal_label: 'NORMAL',
    diff_normal_desc: 'Balanced challenge. Recommended for first play.',
    diff_normal_detail1: 'All values at baseline',
    diff_normal_detail2: '6 weapons · 3 Bosses · 10 levels',
    diff_normal_detail3: 'Fair challenge, skill & build required',
    diff_nightmare_label: 'NIGHTMARE',
    diff_nightmare_desc: 'Hordes of enemies, bullet hell, scarce drops. Only the strongest survive.',
    diff_nightmare_detail1: 'Enemy HP +45%',
    diff_nightmare_detail2: 'Player damage taken +40%',
    diff_nightmare_detail3: 'Spawn interval -22%',
    diff_nightmare_detail4: 'Enemy fire rate +35%',
    diff_nightmare_detail5: 'Item drop rate -20%',

    lv_1_name: 'Outpost Assault',
    lv_2_name: 'Mirror Maze',
    lv_3_name: 'Void Echo',
    lv_4_name: 'Sentinel Reborn',
    lv_5_name: 'Twin Butterflies',
    lv_6_name: 'Abyss Gaze',
    lv_7_name: 'Iron Tide',
    lv_8_name: 'Butterfly Finale',
    lv_9_name: 'Void Rift',
    lv_10_name: 'Eye of Apocalypse',

    boss_sentinel_name: 'Sentinel',
    boss_twins_name: 'Twin Butterfly',
    boss_abyss_name: 'Eye of Abyss',
    boss_vortex_name: 'Vortex',
    boss_phantom_name: 'Phantom',
    boss_barrage_name: 'Barrage Fortress',
    boss_leviathan_name: 'Leviathan',

    substage_0_name: 'Vanguard',
    substage_0_desc: 'Forward Guard · Layer Boss',
    substage_1_name: 'Assault',
    substage_1_desc: 'Elite Intercept · Layer Boss',
    substage_2_name: 'Final Stand',
    substage_2_desc: 'Overlord · Ultimate Boss',
  },
};

// 当前语言翻译缓存
function t(key, ...args) {
  const lang = T[_lang.current];
  if (!lang) return key;
  const val = lang[key];
  if (typeof val === 'function') return val(...args);
  return val !== undefined ? val : key;
}

export { t, setLang, getLang, LANGUAGES };