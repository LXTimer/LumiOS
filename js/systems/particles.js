"use strict";

// ─────────────────────────────────────────────
//  Particle System
// ─────────────────────────────────────────────
const PARTICLE_COUNT = 100;
let particles = [];
let particleRaf = null;
let particleCanvas = null;
let particleCtx = null;

function initParticles() {
  particleCanvas = document.getElementById('particle-canvas');
  if (!particleCanvas) return;
  particleCtx = particleCanvas.getContext('2d');

  sizeParticleCanvas();
  window.addEventListener('resize', sizeParticleCanvas);

  spawnParticles();
  tickParticles();
}

function sizeParticleCanvas() {
  if (!particleCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  particleCanvas.width  = window.innerWidth  * dpr;
  particleCanvas.height = window.innerHeight * dpr;
  if (particleCtx) particleCtx.scale(dpr, dpr);
}

function spawnParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(makeParticle(true));
  }
}

function makeParticle(randomY = false) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return {
    x:       Math.random() * W,
    y:       randomY ? Math.random() * H : H + 4,
    r:       0.8 + Math.random() * 2.2,
    opacity: 0.1 + Math.random() * 0.45,
    speed:   0.12 + Math.random() * 0.28,
    drift:   (Math.random() - 0.5) * 0.08,
    wobble:  Math.random() * Math.PI * 2,
  };
}

function tickParticles() {
  if (document.getElementById('os').classList.contains('no-animations')) {
    if (particleCanvas) particleCanvas.style.opacity = '0';
    particleRaf = requestAnimationFrame(tickParticles);
    return;
  }

  if (particleCanvas) particleCanvas.style.opacity = '1';
  const ctx = particleCtx;
  const W = window.innerWidth;
  const H = window.innerHeight;

  ctx.clearRect(0, 0, W, H);

  const time = performance.now() * 0.0006;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.y -= p.speed;
    p.x += p.drift + Math.sin(time + p.wobble) * 0.06;
    if (p.y < -4) particles[i] = makeParticle(false);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    ctx.fill();
  }

  particleRaf = requestAnimationFrame(tickParticles);
}

function applyParticles(on) {
  if (particleCanvas) particleCanvas.style.opacity = on ? '1' : '0';
  notify(on ? 'Particles enabled' : 'Particles disabled');
}