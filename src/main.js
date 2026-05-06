import './styles.css';

const root = document.documentElement;
const noiseCanvas = document.querySelector('#noise-field');
const trailCanvas = document.querySelector('#trail-field');
const noiseCtx = noiseCanvas.getContext('2d');
const trailCtx = trailCanvas.getContext('2d');
const cursorCore = document.querySelector('[data-cursor-core]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let width = 0;
let height = 0;
let dpr = 1;
let frame = 0;
let chaos = false;
let activeSlide = 0;
let dragStart = null;

const trail = [];
const sparks = [];
const slides = [...document.querySelectorAll('[data-slide]')];
const dots = [...document.querySelectorAll('[data-dot]')];

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  frame += 1;
  noiseCtx.clearRect(0, 0, width, height);

  const lineSpeed = chaos ? 5 : 1.4;
  noiseCtx.save();
  noiseCtx.globalAlpha = chaos ? 0.58 : 0.28;
  noiseCtx.strokeStyle = chaos ? '#d8ff00' : '#ff1d25';
  noiseCtx.lineWidth = chaos ? 4 : 2;
  for (let x = -width; x < width * 2; x += chaos ? 72 : 108) {
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

  if (!prefersReducedMotion.matches) {
    requestAnimationFrame(drawNoise);
  }
}

function drawTrail() {
  const now = performance.now();
  trailCtx.clearRect(0, 0, width, height);

  while (trail.length && now - trail[0].time > 900) trail.shift();
  while (sparks.length && now - sparks[0].time > 780) sparks.shift();

  if (trail.length > 1) {
    trailCtx.save();
    trailCtx.lineCap = 'round';
    trailCtx.lineJoin = 'round';

    for (let layer = 0; layer < 4; layer += 1) {
      trailCtx.beginPath();
      trail.forEach((point, index) => {
        const wobble = Math.sin(index * 0.8 + frame * 0.1) * (chaos ? 10 : 4);
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
      trailCtx.globalAlpha = layer === 0 ? 0.84 : 0.28;
      trailCtx.strokeStyle = ['#d8ff00', '#18e7ff', '#ff1d25', '#f8f7ed'][layer];
      trailCtx.lineWidth = (chaos ? 32 : 22) - layer * 6;
      trailCtx.shadowBlur = 24;
      trailCtx.shadowColor = trailCtx.strokeStyle;
      trailCtx.stroke();
    }

    const head = trail[trail.length - 1];
    trailCtx.globalAlpha = 1;
    trailCtx.fillStyle = '#f8f7ed';
    trailCtx.shadowBlur = 24;
    trailCtx.shadowColor = '#d8ff00';
    trailCtx.beginPath();
    trailCtx.arc(head.x, head.y, chaos ? 9 : 6, 0, Math.PI * 2);
    trailCtx.fill();
    trailCtx.restore();
  }

  sparks.forEach((spark) => {
    const progress = Math.min((now - spark.time) / 780, 1);
    const radius = 16 + progress * 120;
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
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2 + progress;
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

  if (!prefersReducedMotion.matches) {
    requestAnimationFrame(drawTrail);
  }
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
  const toast = document.querySelector('[data-toast]');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function pushTrail(event) {
  root.classList.add('cursor-ready');
  const point = { x: event.clientX, y: event.clientY, time: performance.now() };
  trail.push(point);
  if (trail.length > 42) trail.shift();
  cursorCore.style.setProperty('--x', `${point.x}px`);
  cursorCore.style.setProperty('--y', `${point.y}px`);
}

function wireInteractions() {
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', pushTrail);
  window.addEventListener('pointerdown', (event) => {
    pushTrail(event);
    sparks.push({
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      touch: event.pointerType === 'touch',
    });
    root.classList.add('is-pressing');
  });
  window.addEventListener('pointerup', () => root.classList.remove('is-pressing'));
  window.addEventListener('pointercancel', () => root.classList.remove('is-pressing'));

  document.querySelector('[data-chaos-toggle]').addEventListener('click', () => {
    chaos = !chaos;
    root.classList.toggle('chaos', chaos);
    showToast(chaos ? 'Overdrive armed' : 'Overdrive off');
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
  drawNoise();
  drawTrail();
}
