// storage.js — 存档读写（独立模块，避免场景与 Game 之间循环依赖）
const SAVE_KEY = 'dazhan_save_v1';

export function defaultSave() {
  return {
    version: 1,
    bestScore: 0,
    bestTime: 0,
    maxLevel: 0,
    progress: {
      casual: { cleared: 0 },
      normal: { cleared: 0 },
      nightmare: { cleared: 0 },
    },
    unlockedShips: ['breaker', 'star', 'void'],
    bossesKilled: 0,
    totalKills: 0,
    settings: { sfx: 0.6, screenShake: true },
  };
}

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    const save = Object.assign(defaultSave(), s);
    // 确保三难度进度都存在（兼容旧存档）
    save.progress = save.progress || {};
    for (const d of ['casual', 'normal', 'nightmare']) {
      save.progress[d] = save.progress[d] || { cleared: 0 };
    }
    return save;
  } catch {
    return defaultSave();
  }
}

export function saveSave(s) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {}
}
