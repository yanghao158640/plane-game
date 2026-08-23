// main.js — 入口：创建 Game 并启动
import { Game } from './Game.js';
import { Sfx } from './render.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();

// 浏览器策略：音频需要用户首次交互后才能恢复
const resumeAudio = () => {
  Sfx.init();
  Sfx.resume();
};
window.addEventListener('pointerdown', resumeAudio, { once: true });
window.addEventListener('keydown', resumeAudio, { once: true });

// 防止移动端双击缩放
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 暴露到 window 便于调试
window.__game = game;
