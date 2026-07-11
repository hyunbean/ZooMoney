/* ===========================================
   UTILS.JS — PiggyQuest
   Helper functions
   =========================================== */
'use strict';

/* ---- Number formatting ---- */
function formatKRW(amount) {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('ko-KR');
  return (amount < 0 ? '-' : '') + formatted + '원';
}

function formatKRWShort(amount) {
  const abs = Math.abs(amount);
  if (abs >= 100000000) return (amount / 100000000).toFixed(1) + '억';
  if (abs >= 10000)     return (amount / 10000).toFixed(1) + '만';
  return formatKRW(amount);
}

/* ---- Date ----
   toISOString()은 UTC 기준이라 한국(UTC+9)에서는 오전 9시 이전에
   날짜가 하루 일찍 바뀌는 버그가 있었음 → 로컬 타임존 기준으로 계산 */
function getTodayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ---- XSS 방지 ----
   사용자 입력(목표명, 닉네임, 메모, 친구명 등)을 innerHTML에 넣기 전
   반드시 이 함수를 통과시킬 것 */
function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
function getKoreanDay(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const now = dateStr ? new Date(dateStr) : new Date();
  return days[now.getDay()];
}
function getDaysLeftInMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1;
}
function getCurrentDateTime(dateStr) {
  const now = dateStr ? new Date(dateStr) : new Date();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const day = getKoreanDay(dateStr);
  return `${m}월 ${d}일 (${day})`;
}

/* ---- DOM helpers ---- */
function $(selector, parent) {
  return (parent || document).querySelector(selector);
}
function $$(selector, parent) {
  return Array.from((parent || document).querySelectorAll(selector));
}
function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class')       elem.className = v;
    else if (k === 'id')     elem.id = v;
    else if (k === 'html')   elem.innerHTML = v;
    else if (k.startsWith('on')) elem.addEventListener(k.slice(2), v);
    else elem.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') elem.appendChild(document.createTextNode(c));
    else if (c instanceof Node) elem.appendChild(c);
  });
  return elem;
}

/* ---- Animations ---- */
function animatePop(element) {
  element.classList.remove('anim-pop');
  void element.offsetWidth;
  element.classList.add('anim-pop');
  element.addEventListener('animationend', () => element.classList.remove('anim-pop'), { once: true });
}
function animateBounce(element) {
  element.classList.remove('anim-bounce-in');
  void element.offsetWidth;
  element.classList.add('anim-bounce-in');
  element.addEventListener('animationend', () => element.classList.remove('anim-bounce-in'), { once: true });
}
function animateShake(element) {
  element.classList.remove('anim-shake');
  void element.offsetWidth;
  element.classList.add('anim-shake');
  element.addEventListener('animationend', () => element.classList.remove('anim-shake'), { once: true });
}

/* ---- Particles ---- */
function spawnParticle(emoji, x, y) {
  const container = document.getElementById('particle-container');
  if (!container) return;
  const p = document.createElement('div');
  p.className = 'particle';
  p.textContent = emoji;
  p.style.left = x + 'px';
  p.style.top  = y + 'px';
  container.appendChild(p);
  p.addEventListener('animationend', () => p.remove());
}
function burstParticles(emoji, count, cx, cy) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const ox = (Math.random() - 0.5) * 80;
      const oy = (Math.random() - 0.5) * 40;
      spawnParticle(emoji, cx + ox, cy + oy);
    }, i * 60);
  }
}

/* ---- Confetti ---- */
function launchConfetti(count = 40) {
  const emojis = ['🎉', '⭐', '✨', '🌟', '💫', '🎊'];
  const container = document.getElementById('particle-container');
  if (!container) return;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p   = document.createElement('div');
      p.style.cssText = `
        position:absolute;
        left:${Math.random() * 100}vw;
        top:-20px;
        font-size:${1 + Math.random()}rem;
        pointer-events:none;
        animation: confettiFall ${1 + Math.random() * 1.5}s ease ${Math.random() * 0.5}s both;
      `;
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      container.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }, i * 30);
  }
}

/* ---- Toast ---- */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️', xp: '⚡' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease both';
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ---- Number Counter Animation ---- */
function animateCounter(element, from, to, duration = 600, formatter = formatKRW) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const value = from + (to - from) * ease;
    element.textContent = formatter(Math.round(value));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---- Gauge helper ---- */
function setGaugeWidth(element, percent, animate) {
  const clamped = Math.max(0, Math.min(100, percent));
  if (animate) {
    element.style.transition = 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }
  element.style.width = clamped + '%';
  // Update color class
  element.classList.remove('safe', 'warn', 'danger');
  if (clamped >= 90)       element.classList.add('danger');
  else if (clamped >= 70)  element.classList.add('warn');
  else                     element.classList.add('safe');
}

/* ---- Debounce ---- */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ---- Category lookup ---- */
function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

/* ---- Badge lookup ---- */
function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}
