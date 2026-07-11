/* ===========================================
   COMPONENTS.JS — PiggyQuest
   Shared renderable components
   =========================================== */
'use strict';

/* ---- Bottom Navigation ---- */
function renderBottomNav(activeScreen) {
  const NAV_IMGS = {
    home:   'images/nav/nav_home.png',
    shop:   'images/nav/nav_shop.png',
    social: 'images/nav/nav_social.png',
    mypage: 'images/nav/nav_mypage.png',
  };

  const tabs = [
    { id: 'home',   img: NAV_IMGS.home,   label: '홈' },
    { id: 'shop',   img: NAV_IMGS.shop,   label: '상점' },
    { id: 'social', img: NAV_IMGS.social, label: '커뮤니티' },
    { id: 'mypage', img: NAV_IMGS.mypage, label: '마이페이지' },
  ];

  const nav = el('nav', { class: 'bottom-nav', id: 'bottom-nav' });
  tabs.forEach(tab => {
    const isActive = activeScreen === tab.id;

    const item = el('div', {
      class: `nav-item ${isActive ? 'active' : ''}`,
      id: `nav-${tab.id}`,
      onclick: () => {
        AppState.navigate(tab.id);
      },
    });
    item.innerHTML = `
      <img class="nav-icon-png" src="${tab.img}" alt="${tab.label}"/>
      <span class="nav-label">${tab.label}</span>
    `;
    nav.appendChild(item);
  });
  return nav;
}

/* ---- Budget Gauge ---- */
function renderGauge(percent, id = 'budget-gauge') {
  const wrap = el('div', { class: 'gauge-wrap' });
  const fill = el('div', { class: 'gauge-fill safe', id });
  wrap.appendChild(fill);
  // Set fill after paint
  requestAnimationFrame(() => setGaugeWidth(fill, percent, true));
  return wrap;
}

/* ---- XP Bar ---- */
function renderXPBar(percent) {
  const wrap = el('div', { class: 'xp-bar-wrap' });
  const fill = el('div', { class: 'xp-bar-fill', id: 'xp-bar-fill' });
  fill.style.width = '0';
  wrap.appendChild(fill);
  requestAnimationFrame(() => {
    fill.style.width = Math.min(100, percent) + '%';
  });
  return wrap;
}

/* ---- Piggy Card (mini, for home) ---- */
function renderPiggyCard(balance) {
  const happy = balance >= 0;
  const state = AppState.getState();
  const history = state.piggyHistory;
  const lastDelta = history.length ? history[history.length - 1].delta : 0;

  const card = el('div', { class: `piggy-card ${happy ? 'happy' : 'sad'}`, id: 'piggy-card' });
  card.innerHTML = `
    <div class="piggy-icon" id="piggy-icon" title="저금통 두드리기!">${happy ? '🐷' : '😢'}</div>
    <div class="piggy-info">
      <div class="piggy-label">🏦 돼지 저금통</div>
      <div class="piggy-amount" id="piggy-amount">${formatKRW(balance)}</div>
      <div class="piggy-trend ${lastDelta >= 0 ? 'up' : 'down'}">
        ${lastDelta >= 0 ? '▲' : '▼'} ${formatKRW(Math.abs(lastDelta))} ${lastDelta >= 0 ? '절약됨' : '초과됨'}
      </div>
    </div>
  `;

  // Click wobble interaction
  const icon = card.querySelector('#piggy-icon');
  icon.addEventListener('click', () => {
    animateBounce(icon);
    const rect = icon.getBoundingClientRect();
    const coins = happy ? ['💰', '✨', '⭐'] : ['😭', '💸'];
    coins.forEach((c, i) => setTimeout(() => spawnParticle(c, rect.left + 20, rect.top), i * 100));
  });

  return card;
}

/* ---- Character Sprite HTML Helper ---- */
function getCharacterHTML(level, size = '3rem') {
  // 현재 저장된 state에서 sprite 스타일 계산
  const s     = AppState.getState();
  const style = currentCharDivStyle(s);
  return `<div class="char-sprite-div" style="${style}width:${size};height:${size};"></div>`;
}

/* ---- Character Card (mini, for home) ---- */
function renderCharCard() {
  const s = AppState.getState();
  const lvl = s.characterLevel;
  const charName = getCharStepName(s.characterType || 0, lvl);
  const xpPct = AppState.getXPPercent();

  const card = el('div', { class: 'card', id: 'char-card' });
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-3)">
      <div class="char-display char-idle" id="char-emoji" style="position:relative">
        ${getCharacterHTML(lvl, '64px')}
        <span class="char-level-badge">Lv.${lvl}</span>
      </div>
      <div style="flex:1">
        <div style="font-weight:var(--font-black);font-size:var(--font-sm)">${charName}</div>
        <div style="font-size:0.65rem;color:var(--color-text-muted);margin-bottom:6px">
          ${CHARACTER_DESCS[lvl - 1]}
        </div>
        <div style="font-size:0.65rem;color:var(--color-xp);margin-bottom:4px">
          XP ${s.characterXP} / ${AppState.XP_PER_LEVEL}
        </div>
        ${renderXPBar(xpPct).outerHTML}
      </div>
    </div>
  `;
  return card;
}

/* ---- Expense List ---- */
function renderExpenseList(expenses, maxItems = 5) {
  if (!expenses.length) {
    return el('div', { id: 'expense-list' });
  }

  const list = el('div', { class: 'expense-list', id: 'expense-list' });
  expenses.slice(0, maxItems).forEach(exp => {
    const cat = getCategoryById(exp.category);
    const item = el('div', { class: 'expense-item', id: `exp-${exp.id}` });
    item.innerHTML = `
      <div class="expense-cat-icon">${cat.icon}</div>
      <div class="expense-info">
        <div class="expense-memo">${escapeHTML(exp.memo || cat.name)}</div>
        <div class="expense-cat">${cat.name} · <span class="expense-time">${exp.time}</span></div>
      </div>
      <div class="expense-amount">-${formatKRW(exp.amount)}</div>
    `;
    // Swipe or click to remove shown as secondary action
    item.addEventListener('click', () => {
      item.style.opacity = '0.4';
      setTimeout(() => {
        AppState.removeExpense(exp.id);
      }, 150);
    });
    list.appendChild(item);
  });
  return list;
}

/* ---- Expense Input Sheet ---- */
let expenseSheetOpen = false;
let selectedCategory = 'food';
let inputAmount = '';

function renderExpenseSheet() {
  const sheet = el('div', { class: 'expense-sheet', id: 'expense-sheet' });
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">💸 지출 입력</div>
    <div class="amount-display-wrap">
      <div class="amount-display zero" id="exp-amount-display">0원</div>
    </div>
    <div class="input-group" style="margin-bottom:var(--space-3)">
      <label class="input-label">메모 (선택)</label>
      <input class="input-field" id="exp-memo-input" placeholder="예: 점심 식사" maxlength="20" autocomplete="off"/>
    </div>
    <label class="input-label" style="margin-bottom:8px">카테고리</label>
    <div class="category-grid" id="cat-grid" style="margin-bottom:var(--space-4)"></div>
    <div class="numpad" id="numpad"></div>
    <button class="btn btn-primary btn-lg btn-full" id="add-expense-btn" disabled>지출 추가하기 ✓</button>
  `;

  // Category chips
  const grid = sheet.querySelector('#cat-grid');
  CATEGORIES.forEach(cat => {
    const chip = el('div', {
      class: `category-chip ${cat.id === selectedCategory ? 'active' : ''}`,
      id: `cat-${cat.id}`,
      onclick: () => {
        selectedCategory = cat.id;
        grid.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        animateBounce(chip);
      },
    });
    chip.innerHTML = `<span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span>`;
    grid.appendChild(chip);
  });

  // Numpad
  const numpad = sheet.querySelector('#numpad');
  const keys = ['1','2','3','4','5','6','7','8','9','000','0','⌫'];
  keys.forEach(k => {
    const key = el('button', {
      class: `numpad-key ${k === '⌫' ? 'del' : ''}`,
      onclick: () => handleNumpadKey(k, sheet),
    });
    key.textContent = k;
    numpad.appendChild(key);
  });

  // Submit
  sheet.querySelector('#add-expense-btn').addEventListener('click', () => submitExpense(sheet));

  return sheet;
}

function handleNumpadKey(key, sheet) {
  const display = sheet.querySelector('#exp-amount-display');
  const btn = sheet.querySelector('#add-expense-btn');

  if (key === '⌫') {
    inputAmount = inputAmount.slice(0, -1);
  } else if (key === '000') {
    if (inputAmount !== '' && inputAmount.length <= 6) {
      inputAmount += '000';
    }
  } else {
    if (inputAmount.length >= 9) return;
    inputAmount += key;
  }
  
  // Remove leading zeros
  inputAmount = inputAmount.replace(/^0+/, '') || '';

  const num = parseInt(inputAmount || '0');
  if (display) {
    display.textContent = num > 0 ? formatKRW(num) : '0원';
    display.classList.toggle('zero', num === 0);
    animatePop(display);
  }

  if (btn) {
    btn.disabled = num <= 0;
  }
}

function submitExpense(sheet) {
  const amount = parseInt(inputAmount || '0');
  if (amount <= 0) return;
  const memoInput = sheet.querySelector('#exp-memo-input');
  const memo = memoInput ? memoInput.value.trim() : '';

  // 먼저 닫기 (addExpense 이벤트 핸들러 오류와 무관하게 항상 닫힘)
  toggleExpenseSheet(false);
  if (memoInput) memoInput.value = '';

  AppState.addExpense(amount, selectedCategory, memo || getCategoryById(selectedCategory).name);
  showToast(`${formatKRW(amount)} 지출 추가됨!`, 'success');
}

function toggleExpenseSheet(open) {
  const sheet = document.getElementById('expense-sheet');
  const fab   = document.getElementById('fab-add');
  
  // Update global state
  expenseSheetOpen = open;

  if (open) {
    // Create or get overlay
    let expOverlay = document.getElementById('expense-overlay');
    if (!expOverlay) {
      expOverlay = document.createElement('div');
      expOverlay.id = 'expense-overlay';
      expOverlay.className = 'expense-overlay';
      expOverlay.addEventListener('click', () => toggleExpenseSheet(false));
      document.body.appendChild(expOverlay);
    }
    
    // Reset amount when opening
    inputAmount = '';
    const display = sheet?.querySelector('#exp-amount-display');
    const btn = sheet?.querySelector('#add-expense-btn');
    if (display) {
      display.textContent = '0원';
      display.classList.add('zero');
    }
    if (btn) btn.disabled = true;

    expOverlay.classList.add('visible');
    sheet?.classList.add('open');
    fab?.classList.add('open');
    
    // Focus memo input after animation if desired, but maybe better for mobile to stay on numpad
  } else {
    const expOverlay = document.getElementById('expense-overlay');
    if (expOverlay) expOverlay.classList.remove('visible');
    sheet?.classList.remove('open');
    fab?.classList.remove('open');
    
    // Reset inputs
    inputAmount = '';
  }
}
