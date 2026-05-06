import './styles.css';

const root = document.documentElement;
const canvas = document.querySelector('#noise-field');
const ctx = canvas.getContext('2d', { alpha: true });
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let width = 0;
let height = 0;
let dpr = 1;
let mouseX = 0.5;
let mouseY = 0.5;
let chaos = false;
let frozen = false;
let frame = 0;

const posters = [
  {
    meta: 'ROME / TBA / 23:59',
    title: 'NO SANTA',
    subtitle: 'ONLY PRESSURE',
    footer: 'HOUSE / TECH HOUSE / DISCO',
    ink: '#f8f7ed',
    paper: '#070707',
    accent: '#ff1d25',
  },
  {
    meta: 'BASEMENT / REDLINE / 03:12',
    title: 'BAD GIFT',
    subtitle: 'GOOD ROOM',
    footer: 'NO CHIMNEY / NO STATUS',
    ink: '#080808',
    paper: '#d8ff00',
    accent: '#ff1d25',
  },
  {
    meta: 'ROMA / WHITEOUT / 00:00',
    title: 'SANTA OUT',
    subtitle: 'DANCE IN',
    footer: 'DISCO DAMAGE / HARD SMILES',
    ink: '#050505',
    paper: '#f3f0e8',
    accent: '#18e7ff',
  },
  {
    meta: 'MADRID ECHO / TBA / LATE',
    title: 'RED LIST',
    subtitle: 'FULL ROOM',
    footer: 'TECH HOUSE VOLTAGE',
    ink: '#f3f0e8',
    paper: '#b40012',
    accent: '#d8ff00',
  },
];

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawNoise() {
  if (frozen) {
    requestAnimationFrame(drawNoise);
    return;
  }

  frame += 1;
  ctx.clearRect(0, 0, width, height);

  const density = chaos ? 220 : 90;
  const pulse = chaos ? Math.sin(frame * 0.09) * 24 : 0;

  for (let i = 0; i < density; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = chaos ? Math.random() * 5 + 1 : Math.random() * 2 + 0.5;
    const alpha = chaos ? Math.random() * 0.42 : Math.random() * 0.18;
    ctx.fillStyle = i % 8 === 0 ? `rgba(255,29,37,${alpha})` : `rgba(248,247,237,${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  ctx.save();
  ctx.globalAlpha = chaos ? 0.42 : 0.22;
  ctx.strokeStyle = chaos ? '#d8ff00' : '#ff1d25';
  ctx.lineWidth = chaos ? 3 : 1.5;
  for (let i = -3; i < 5; i += 1) {
    const offset = i * 180 + mouseX * 90 + pulse;
    ctx.beginPath();
    ctx.moveTo(offset, height + 80);
    ctx.lineTo(offset + width * 0.45, -80);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = chaos ? 0.32 : 0.14;
  ctx.fillStyle = '#18e7ff';
  const barY = (frame * (chaos ? 7 : 2) + mouseY * height) % height;
  ctx.fillRect(0, barY, width, chaos ? 10 : 4);
  ctx.restore();

  requestAnimationFrame(drawNoise);
}

function setPoster(poster) {
  const livePoster = document.querySelector('[data-live-poster]');
  livePoster.style.setProperty('--poster-ink', poster.ink);
  livePoster.style.setProperty('--poster-paper', poster.paper);
  livePoster.style.setProperty('--poster-accent', poster.accent);
  livePoster.querySelector('[data-poster-meta]').textContent = poster.meta;
  livePoster.querySelector('[data-poster-title]').textContent = poster.title;
  livePoster.querySelector('[data-poster-subtitle]').textContent = poster.subtitle;
  livePoster.querySelector('[data-poster-footer]').textContent = poster.footer;
}

function randomPoster() {
  const current = document.querySelector('[data-poster-title]').textContent;
  const nextPool = posters.filter((poster) => poster.title !== current);
  const next = nextPool[Math.floor(Math.random() * nextPool.length)];
  setPoster(next);
}

function showToast(message) {
  const toast = document.querySelector('[data-toast]');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2200);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    showToast(text);
  }
}

function setupReveal() {
  const revealItems = document.querySelectorAll('[data-reveal]');

  if (prefersReducedMotion.matches) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupTilt() {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (prefersReducedMotion.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', `${y * -7}deg`);
      card.style.setProperty('--tilt-y', `${x * 9}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointermove', (event) => {
  mouseX = event.clientX / Math.max(window.innerWidth, 1);
  mouseY = event.clientY / Math.max(window.innerHeight, 1);
  root.style.setProperty('--mouse-x', mouseX.toFixed(3));
  root.style.setProperty('--mouse-y', mouseY.toFixed(3));
});

document.querySelector('[data-chaos-toggle]').addEventListener('click', (event) => {
  chaos = !chaos;
  root.classList.toggle('chaos-mode', chaos);
  event.currentTarget.setAttribute('aria-pressed', String(chaos));
  showToast(chaos ? 'Mode X armed' : 'Mode X off');
});

document.querySelector('[data-poster-random]').addEventListener('click', randomPoster);

document.querySelector('[data-poster-invert]').addEventListener('click', () => {
  document.querySelector('[data-live-poster]').classList.toggle('is-inverted');
});

document.querySelector('[data-freeze-canvas]').addEventListener('click', (event) => {
  frozen = !frozen;
  event.currentTarget.textContent = frozen ? 'Run noise' : 'Freeze noise';
  showToast(frozen ? 'Noise frozen' : 'Noise running');
});

document.querySelector('[data-copy-invite]').addEventListener('click', () => {
  copyText('Anti Santa Club: https://www.instagram.com/antisantaclub/', 'Invite copied');
});

document.querySelector('[data-copy-handle]').addEventListener('click', () => {
  copyText('@antisantaclub', 'Handle copied');
});

resizeCanvas();
setPoster(posters[0]);
setupReveal();
setupTilt();

if (prefersReducedMotion.matches) {
  ctx.clearRect(0, 0, width, height);
} else {
  drawNoise();
}
