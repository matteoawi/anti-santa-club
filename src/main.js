import './styles.css';

const root = document.documentElement;
const noiseCanvas = document.querySelector('#noise-field');
const trailCanvas = document.querySelector('#trail-field');
const noiseCtx = noiseCanvas.getContext('2d');
const trailCtx = trailCanvas.getContext('2d');
const cursorCore = document.querySelector('[data-cursor-core]');
const blastLayer = document.querySelector('[data-blast-layer]');
const toast = document.querySelector('[data-toast]');
const chaosToggle = document.querySelector('[data-chaos-toggle]');
const blastButton = document.querySelector('[data-blast-button]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

let width = 0;
let height = 0;
let dpr = 1;
let frame = 0;
let chaos = false;
let activeSlide = 0;
let dragStart = null;
let resizeTimer = null;
let noiseRunning = false;
let trailRunning = false;

const trail = [];
const sparks = [];
const slides = [...document.querySelectorAll('[data-slide]')];
const dots = [...document.querySelectorAll('[data-dot]')];
const blastWords = ['NO SANTA', 'CAVA', 'ROMA', 'BASS', 'ANTI', 'LATE', 'RAW'];

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.2 : 1.75);
  width = window.innerWidth;
  height = window.innerHeight;

  for (const canvas of [noiseCanvas, trailCanvas]) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  noiseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawNoise() {
  if (!width || !height || document.hidden || prefersReducedMotion.matches) {
    noiseRunning = false;
    return;
  }

  frame += 1;
  noiseCtx.clearRect(0, 0, width, height);

  const lineSpeed = chaos ? 5 : 1.4;
  const lineGap = coarsePointer.matches ? (chaos ? 92 : 146) : chaos ? 72 : 108;
  noiseCtx.save();
  noiseCtx.globalAlpha = chaos ? 0.58 : 0.28;
  noiseCtx.strokeStyle = chaos ? '#d8ff00' : '#ff1d25';
  noiseCtx.lineWidth = chaos ? 4 : 2;
  for (let x = -width; x < width * 2; x += lineGap) {
    const offset = (frame * lineSpeed + x) % (width + 260);
    noiseCtx.beginPath();
    noiseCtx.moveTo(offset - 260, height + 80);
    noiseCtx.lineTo(offset + 260, -80);
    noiseCtx.stroke();
  }
  noiseCtx.restore();

  noiseCtx.save();
  noiseCtx.globalAlpha = chaos ? 0.28 : 0.12;
  noiseCtx.fillStyle = '#18e7ff';
  noiseCtx.fillRect(0, (frame * (chaos ? 8 : 3)) % height, width, chaos ? 12 : 5);
  noiseCtx.restore();

  window.setTimeout(
    () => requestAnimationFrame(drawNoise),
    coarsePointer.matches ? 42 : 0,
  );
}

function drawTrail() {
  if (!width || !height || document.hidden || prefersReducedMotion.matches) {
    trailRunning = false;
    return;
  }

  const now = performance.now();
  trailCtx.clearRect(0, 0, width, height);

  const trailLife = coarsePointer.matches ? 760 : 980;
  while (trail.length && now - trail[0].time > trailLife) trail.shift();
  while (sparks.length && now - sparks[0].time > 820) sparks.shift();

  if (trail.length < 2 && sparks.length === 0) {
    trailRunning = false;
    return;
  }

  if (trail.length > 1) {
    trailCtx.save();
    trailCtx.lineCap = 'round';
    trailCtx.lineJoin = 'round';

    const layers = coarsePointer.matches ? 3 : 4;
    for (let layer = 0; layer < layers; layer += 1) {
      trailCtx.beginPath();
      trail.forEach((point, index) => {
        const wobble = Math.sin(index * 0.8 + frame * 0.1) * (chaos ? 12 : 5);
        if (index === 0) {
          trailCtx.moveTo(point.x + wobble, point.y);
        } else {
          const previous = trail[index - 1];
          trailCtx.quadraticCurveTo(
            previous.x - wobble,
            previous.y,
            (previous.x + point.x) / 2 + wobble,
            (previous.y + point.y) / 2,
          );
        }
      });
      trailCtx.globalAlpha = layer === 0 ? 0.92 : 0.34;
      trailCtx.strokeStyle = ['#d8ff00', '#18e7ff', '#ff1d25', '#f8f7ed'][layer];
      trailCtx.lineWidth = (chaos ? 42 : 30) - layer * 7;
      trailCtx.shadowBlur = 34;
      trailCtx.shadowColor = trailCtx.strokeStyle;
      trailCtx.stroke();
    }

    const head = trail[trail.length - 1];
    trailCtx.globalAlpha = 1;
    trailCtx.fillStyle = '#f8f7ed';
    trailCtx.shadowBlur = 30;
    trailCtx.shadowColor = '#d8ff00';
    trailCtx.beginPath();
    trailCtx.arc(head.x, head.y, chaos ? 9 : 6, 0, Math.PI * 2);
    trailCtx.fill();
    trailCtx.restore();
  }

  sparks.forEach((spark) => {
    const progress = Math.min((now - spark.time) / 820, 1);
    const radius = 18 + progress * (spark.touch ? 160 : 120);
    trailCtx.save();
    trailCtx.globalAlpha = 1 - progress;
    trailCtx.strokeStyle = spark.touch ? '#d8ff00' : '#18e7ff';
    trailCtx.lineWidth = 4;
    trailCtx.shadowBlur = 18;
    trailCtx.shadowColor = trailCtx.strokeStyle;
    trailCtx.beginPath();
    trailCtx.arc(spark.x, spark.y, radius, 0, Math.PI * 2);
    trailCtx.stroke();

    trailCtx.strokeStyle = '#ff1d25';
    const spokes = spark.touch || chaos ? 16 : 12;
    for (let i = 0; i < spokes; i += 1) {
      const angle = (i / spokes) * Math.PI * 2 + progress;
      trailCtx.beginPath();
      trailCtx.moveTo(spark.x + Math.cos(angle) * 10, spark.y + Math.sin(angle) * 10);
      trailCtx.lineTo(
        spark.x + Math.cos(angle) * (36 + progress * 88),
        spark.y + Math.sin(angle) * (36 + progress * 88),
      );
      trailCtx.stroke();
    }
    trailCtx.restore();
  });

  window.setTimeout(
    () => requestAnimationFrame(drawTrail),
    coarsePointer.matches ? 18 : 0,
  );
}

function ensureNoiseLoop() {
  if (noiseRunning || prefersReducedMotion.matches) return;
  noiseRunning = true;
  requestAnimationFrame(drawNoise);
}

function ensureTrailLoop() {
  if (trailRunning || prefersReducedMotion.matches) return;
  trailRunning = true;
  requestAnimationFrame(drawTrail);
}

function setSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    const offset = slideIndex - activeSlide;
    const wrapped =
      offset > slides.length / 2
        ? offset - slides.length
        : offset < -slides.length / 2
          ? offset + slides.length
          : offset;
    slide.style.setProperty('--offset', wrapped);
    slide.style.setProperty('--abs-offset', Math.abs(wrapped));
    slide.classList.toggle('is-active', wrapped === 0);
  });
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === activeSlide);
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function pushTrail(event) {
  root.classList.add('cursor-ready');
  const point = { x: event.clientX, y: event.clientY, time: performance.now() };
  trail.push(point);
  if (trail.length > (coarsePointer.matches ? 34 : 48)) trail.shift();
  cursorCore.style.setProperty('--x', `${point.x}px`);
  cursorCore.style.setProperty('--y', `${point.y}px`);
  ensureTrailLoop();
}

function spawnBlastLabels(x, y, count) {
  if (!blastLayer || prefersReducedMotion.matches) return;

  for (let index = 0; index < count; index += 1) {
    const label = document.createElement('span');
    const distance = 70 + Math.random() * (coarsePointer.matches ? 120 : 220);
    const angle = Math.random() * Math.PI * 2;
    label.className = 'blast-chip';
    label.textContent = blastWords[(index + frame) % blastWords.length];
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    label.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    label.style.setProperty('--rot', `${Math.random() * 70 - 35}deg`);
    label.style.setProperty('--delay', `${index * 18}ms`);
    blastLayer.append(label);
    window.setTimeout(() => label.remove(), 940);
  }
}

function blastAt(x, y, touch = false) {
  const now = performance.now();
  const syntheticPoints = touch ? 12 : 7;

  for (let index = syntheticPoints; index >= 0; index -= 1) {
    trail.push({
      x: x - index * (touch ? 11 : 8) + Math.sin(index * 1.8) * 18,
      y: y + Math.cos(index * 1.3) * (touch ? 26 : 16),
      time: now - index * 22,
    });
  }

  while (trail.length > (coarsePointer.matches ? 34 : 48)) trail.shift();

  sparks.push({ x, y, time: now, touch });
  if (chaos || touch) {
    sparks.push({ x: x - 26, y: y + 18, time: now + 32, touch });
    sparks.push({ x: x + 30, y: y - 12, time: now + 54, touch });
  }

  spawnBlastLabels(x, y, coarsePointer.matches ? 4 : 7);
  ensureTrailLoop();
}

function wireInteractions() {
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resizeCanvas, 120);
    },
    { passive: true },
  );
  window.addEventListener('pointermove', pushTrail, { passive: true });
  window.addEventListener('pointerdown', (event) => {
    pushTrail(event);
    blastAt(event.clientX, event.clientY, event.pointerType === 'touch');
    root.classList.add('is-pressing');
  }, { passive: true });
  window.addEventListener('pointerup', () => root.classList.remove('is-pressing'));
  window.addEventListener('pointercancel', () => root.classList.remove('is-pressing'));

  chaosToggle?.addEventListener('click', () => {
    chaos = !chaos;
    root.classList.toggle('chaos', chaos);
    blastAt(width / 2, height * 0.5, coarsePointer.matches);
    showToast(chaos ? 'Overdrive armed' : 'Overdrive off');
  });

  blastButton?.addEventListener('click', () => {
    chaos = true;
    root.classList.add('chaos');
    blastAt(width * 0.5, height * 0.54, true);
    showToast('Blackout armed');
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      ensureNoiseLoop();
      if (trail.length > 1 || sparks.length > 0) ensureTrailLoop();
    }
  });

  document.querySelector('[data-prev]').addEventListener('click', () => setSlide(activeSlide - 1));
  document.querySelector('[data-next]').addEventListener('click', () => setSlide(activeSlide + 1));
  dots.forEach((dot) => {
    dot.addEventListener('click', () => setSlide(Number(dot.dataset.dot)));
  });

  const carousel = document.querySelector('[data-carousel]');
  carousel.addEventListener('pointerdown', (event) => {
    dragStart = event.clientX;
    carousel.setPointerCapture(event.pointerId);
  });
  carousel.addEventListener('pointerup', (event) => {
    if (dragStart === null) return;
    const delta = event.clientX - dragStart;
    if (Math.abs(delta) > 40) setSlide(activeSlide + (delta < 0 ? 1 : -1));
    dragStart = null;
  });
  carousel.addEventListener('pointercancel', () => {
    dragStart = null;
  });

  document.querySelectorAll('a, button, .event-ticket, .poster-card').forEach((item) => {
    item.addEventListener('pointerenter', () => root.classList.add('cursor-hot'));
    item.addEventListener('pointerleave', () => root.classList.remove('cursor-hot'));
  });
}

resizeCanvas();
setSlide(0);
wireInteractions();

if (!prefersReducedMotion.matches) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(ensureNoiseLoop, { timeout: 700 });
  } else {
    window.setTimeout(ensureNoiseLoop, 160);
  }
}
