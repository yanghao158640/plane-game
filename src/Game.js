// Game.js — 游戏主类：画布、循环、状态机、存档
import { Input } from './core.js';
import { VIEW } from './data.js';
import { Sfx } from './render.js';
import { loadSave } from './storage.js';
import { MenuScene, GameScene, GameOverScene, LevelSelectScene } from './scenes.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas, VIEW.W, VIEW.H);
    this.save = loadSave();
    this.scene = null;
    this.running = false;
    this._last = 0;
    this.scaleX = 1; this.scaleY = 1;

    // 按 DPR 设置缓冲区，避免高 DPI 屏模糊
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));

    Sfx.setVol(this.save.settings.sfx);
  }

  /** 按设备像素比设置 canvas 缓冲区，保证高 DPI 屏清晰 */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3); // 限制 3 避免过大
    const rect = this.canvas.getBoundingClientRect();
    let cssW = rect.width, cssH = rect.height;
    if (cssW < 10 || cssH < 10) { cssW = VIEW.W; cssH = VIEW.H; } // 兜底
    this.canvas.width = Math.max(1, Math.round(cssW * dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * dpr));
    // 逻辑坐标 VIEW.W × VIEW.H 映射到整个缓冲区
    this.scaleX = this.canvas.width / VIEW.W;
    this.scaleY = this.canvas.height / VIEW.H;
  }

  start() {
    this.setScene(new MenuScene(this));
    // layout 就绪后再精确 resize 一次
    requestAnimationFrame(() => this.resize());
    if (!this.running) {
      this.running = true;
      this._last = performance.now();
      requestAnimationFrame(this._loop);
    }
  }

  setScene(scene) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = scene;
    if (scene.enter) scene.enter();
  }

  // 主循环：可变时间步长，clamp 防止切后台后大跳
  _loop = (now) => {
    if (!this.running) return;
    let dt = now - this._last;
    this._last = now;
    if (dt > 100) dt = 100;       // 最大 100ms
    const sec = dt / 1000;
    this.input.update();
    if (this.scene) {
      // 把逻辑坐标 (VIEW.W × VIEW.H) 映射到物理缓冲区
      this.ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
      this.scene.update(sec, this.input);
      this.scene.render(this.ctx);
    }
    requestAnimationFrame(this._loop);
  };

  // 便捷场景切换
  gotoMenu() { this.setScene(new MenuScene(this)); }
  gotoGame(opts) { this.setScene(new GameScene(this, opts)); }
  gotoLevelSelect(opts) { this.setScene(new LevelSelectScene(this, opts)); }
  gotoGameOver(stats) { this.setScene(new GameOverScene(this, stats)); }
}
