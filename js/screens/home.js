/* ===========================================
   HOME.JS — PiggyQuest  v8
   홈화면: 헤더 + 연속일+게이지 + 캐릭터 (스프라이트)
   =========================================== */
'use strict';

/* ── 헬퍼: 연속 절약 일수 (shielded 포함) ── */
function _calcStreak(s) {
  const hist = (s.piggyHistory || []).slice().reverse();
  let streak = 0;
  for (const h of hist) {
    if (h.delta >= 0 || h.shielded) streak++;
    else break;
  }
  return streak;
}

/* ── 헬퍼: 어제 지출액 ── */
function _getYesterdaySpent(s) {
  const hist = s.piggyHistory || [];
  if (hist.length === 0) return 0;
  const last = hist[hist.length - 1];
  // delta = dailyBudget - spent  →  spent = dailyBudget - delta
  return Math.max(0, (s.dailyBudget || 0) - last.delta);
}

/* ── 헬퍼: 날짜 포맷 "N월 N일 (요일) HH:MM AM/PM" ── */
const _DAY_KR = ['일', '월', '화', '수', '목', '금', '토'];
function _fmtDateTime() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const dow   = _DAY_KR[now.getDay()];
  const h24   = now.getHours();
  const min   = String(now.getMinutes()).padStart(2, '0');
  const ampm  = h24 < 12 ? 'AM' : 'PM';
  const h12   = h24 % 12 || 12;
  const hStr  = String(h12).padStart(2, '0');
  return `${month}월 ${day}일 (${dow}) ${hStr}:${min} ${ampm}`;
}

/* ══════════════════════════════════════════
   메인 렌더
   ══════════════════════════════════════════ */
function renderHomeScreen() {
  const s         = AppState.getState();
  const spent     = s.todaySpent  || 0;
  const budget    = s.dailyBudget || 0;
  const remaining = budget - spent;
  const saveW      = budget > 0 ? Math.max(0, Math.round((remaining / budget) * 100)) : 0;
  const gaugeClass = remaining < 0 ? 'danger' : remaining < budget * 0.2 ? 'warn' : 'safe';
  const streak    = _calcStreak(s);
  const ySpent    = _getYesterdaySpent(s);
  const diff      = spent - ySpent;

  function _compareText(d) {
    if (d > 0) return `어제보다 ${formatKRW(Math.abs(d))} 더 씀`;
    if (d < 0) return `어제보다 ${formatKRW(Math.abs(d))} 덜 씀`;
    return '어제와 같은 지출이에요';
  }

  const screen = el('div', { class: 'screen home-screen', id: 'screen-home' });

  /* ─── 헤더 ─── */
  const hdr = el('div', { class: 'home-hdr' });
  hdr.innerHTML = `
    <div class="home-hdr-left">
      <span class="home-hdr-date" id="home-hdr-date">${_fmtDateTime()}</span>
    </div>
    <div class="home-hdr-right">
      <button class="home-hdr-demo" id="home-hdr-demo">🎲</button>
      <button class="home-hdr-gear" id="home-hdr-gear">⚙</button>
    </div>
  `;
  screen.appendChild(hdr);

  /* ─── 실시간 날짜/시간 갱신 (분 단위) ─── */
  const _dateTimer = setInterval(() => {
    const dateEl = document.getElementById('home-hdr-date');
    if (!dateEl) { clearInterval(_dateTimer); return; }
    dateEl.textContent = _fmtDateTime();
  }, 60000);

  /* ─── 연속일 + 게이지 행 (클릭 → 지출 드로어) ─── */
  const streakRow = el('div', { class: 'home-streak-row', id: 'home-streak-row' });
  streakRow.innerHTML = `
    <div class="home-streak-badge">
      <span class="home-streak-label">연속</span>
      <span class="home-streak-num" id="home-streak-num">${streak}</span>
      <span class="home-streak-unit">일</span>
    </div>
    <div class="home-gauge-area" id="home-gauge-area">
      <div class="home-gauge-label-row">
        <span class="home-gauge-label">오늘 예산</span>
        <span class="home-gauge-text" id="home-gauge-text" style="color:${remaining >= 0 ? 'var(--accent)' : 'var(--red)'}">
          ${remaining >= 0 ? '+' : ''}${formatKRW(remaining)}
        </span>
      </div>
      <div class="home-gauge-bar-wrap">
        <div class="home-gauge-bar">
          <div class="home-gauge-fill ${gaugeClass}" id="home-gauge" style="width:${saveW}%"></div>
        </div>
      </div>
    </div>
  `;
  screen.appendChild(streakRow);

  /* ─── 스크롤 바디 ─── */
  const body = el('div', { class: 'screen-body home-body2', id: 'home-body' });

  /* 캐릭터 박스 */
  const charBox = el('div', { class: 'home-char-box2', id: 'home-char-box' });
  const infoBtn = el('button', { class: 'home-char-info-btn' });
  infoBtn.textContent = 'ⓘ';
  infoBtn.addEventListener('click', () => AppState.navigate('budget'));
  charBox.appendChild(infoBtn);

  const charDiv = el('img', {
    class: 'home-char-main2',
    id: 'home-char-img',
    src: getFrameImageSrc(s.characterType || 0, calcCharStep(s), isCharSad(s)),
    alt: '캐릭터',
  });
  // 상점에서 구매한 스킨 적용
  const _equippedSkin = localStorage.getItem('pq_skin');
  if (_equippedSkin && _equippedSkin !== 'none') {
    const _SKIN_FILTERS = {
      skin_pink:  'hue-rotate(310deg) saturate(1.4) brightness(1.05)',
      skin_blue:  'hue-rotate(195deg) saturate(1.3) brightness(1.05)',
      skin_green: 'hue-rotate(100deg) saturate(1.3) brightness(1.05)',
      skin_gold:  'sepia(0.6) saturate(2.5) hue-rotate(5deg) brightness(1.2)',
    };
    if (_SKIN_FILTERS[_equippedSkin]) charDiv.style.filter = _SKIN_FILTERS[_equippedSkin];
  }
  charBox.appendChild(charDiv);

  const step = calcCharStep(s);
  const charName = el('div', { class: 'home-char-name2' });
  charName.innerHTML = `<span class="home-char-lv2">LV.${step}</span> ${getCharDisplayName(step, s.user?.charName)}`;
  charBox.appendChild(charName);
  body.appendChild(charBox);

  screen.appendChild(body);

  /* ─── 하루 정산 버튼 (nav 위 고정) ─── */
  const settleWrap = el('div', { class: 'home-settle-wrap' });
  settleWrap.innerHTML = `<button class="home-settle-btn2" id="home-settle-btn">▶ 하루 정산 ◀</button>`;
  screen.appendChild(settleWrap);

  /* ─── 트레이너 버튼 (왼쪽 아래 고정) ─── */
  const trainerBtn = el('button', { class: 'home-trainer-btn', id: 'home-trainer-btn' });
  trainerBtn.innerHTML = `<img src="images/trainer_chat.png?v=2" alt="트레이너"/><span>조언 구하기</span>`;
  trainerBtn.addEventListener('click', () => AppState.navigate('trainer_chat'));
  screen.appendChild(trainerBtn);

  /* ─── 돼지저금통 버튼 (오른쪽 아래 고정) ─── */
  const piggyBtn = el('button', { class: 'home-piggy-btn', id: 'home-piggy-btn' });
  piggyBtn.innerHTML = `<img src="images/images_pig.png" alt="저금통"/><span>돼지저금통</span>`;
  piggyBtn.addEventListener('click', () => AppState.navigate('today'));
  screen.appendChild(piggyBtn);

  /* ─── 소비 불러오기 버튼 ─── */
  const loadBtn = el('button', { class: 'home-load-btn', id: 'home-load-btn' });
  loadBtn.innerHTML = '📋 소비 불러오기';
  loadBtn.addEventListener('click', _loadCardExpenses);
  screen.appendChild(loadBtn);


  /* ─── 지출 내역 드로어 (게이지 클릭 시 올라옴) ─── */
  const expOverlay = el('div', { class: 'home-exp-overlay', id: 'home-exp-overlay' });
  const expDrawer  = el('div', { class: 'home-exp-drawer',  id: 'home-exp-drawer' });
  expDrawer.innerHTML = `
    <div class="home-exp-drawer-handle" id="exp-drawer-handle"></div>
    <div class="home-exp-drawer-header">
      <span class="home-exp-drawer-title">오늘의 지출 내역</span>
      <div class="home-exp-header-btns" id="home-exp-header-btns"></div>
    </div>
    <div id="expense-list-wrap" class="home-exp-drawer-list"></div>
  `;
  screen.appendChild(expOverlay);
  screen.appendChild(expDrawer);

  let selectionMode = false;
  let selectedIds   = new Set();

  function _showDeleteConfirm() {
    const modal = el('div', { class: 'confirm-modal' });
    const count = selectedIds.size;
    modal.innerHTML = `
      <p class="confirm-modal-msg">${count}개 항목을 삭제할까요?</p>
      <div class="confirm-modal-btns">
        <button class="confirm-modal-cancel">취소</button>
        <button class="confirm-modal-ok">삭제</button>
      </div>
    `;
    modal.querySelector('.confirm-modal-cancel').addEventListener('click', () => ModalManager.close());
    modal.querySelector('.confirm-modal-ok').addEventListener('click', () => {
      const ids = [...selectedIds];
      selectedIds.clear();
      selectionMode = false;
      ModalManager.close();
      ids.forEach(id => AppState.removeExpense(id));
      _renderExpList();
      updateHomeBudget();
    });
    ModalManager.open(modal);
  }

  function _renderHeader() {
    const btnWrap = document.getElementById('home-exp-header-btns');
    if (!btnWrap) return;
    if (selectionMode) {
      const n = selectedIds.size;
      const allSelected = AppState.getToday().length > 0 && AppState.getToday().every(e => selectedIds.has(e.id));
      btnWrap.innerHTML = `
        <span class="home-exp-drawer-clear" id="home-cancel-btn">취소</span>
        <span class="home-exp-drawer-clear" id="home-select-all-btn">${allSelected ? '전체 선택 취소' : '전체 선택'}</span>
        <span class="home-exp-drawer-clear home-exp-delete-btn${n > 0 ? ' active' : ''}" id="home-delete-btn">삭제${n > 0 ? `(${n})` : ''}</span>
      `;
      btnWrap.querySelector('#home-cancel-btn').addEventListener('click', () => {
        selectionMode = false; selectedIds.clear(); _renderExpList();
      });
      btnWrap.querySelector('#home-select-all-btn').addEventListener('click', () => {
        const all = AppState.getToday();
        const allSelected = all.every(e => selectedIds.has(e.id));
        if (allSelected) selectedIds.clear();
        else all.forEach(e => selectedIds.add(e.id));
        _renderExpList();
      });
      btnWrap.querySelector('#home-delete-btn').addEventListener('click', () => {
        if (selectedIds.size === 0) { showToast('삭제할 항목을 선택해주세요', 'warning'); return; }
        _showDeleteConfirm();
      });
    } else {
      btnWrap.innerHTML = `
        <span class="home-exp-drawer-clear" id="home-select-btn">선택</span>
      `;
      btnWrap.querySelector('#home-select-btn').addEventListener('click', () => {
        if (AppState.getToday().length === 0) return;
        selectionMode = true; selectedIds.clear(); _renderExpList();
      });
    }
  }

  function _renderExpList() {
    _renderHeader();
    const wrap     = document.getElementById('expense-list-wrap');
    if (!wrap) return;
    const todayExp = AppState.getToday();
    if (todayExp.length === 0) {
      selectionMode = false; selectedIds.clear();
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-text">오늘 지출이 없어요!</div></div>`;
      updateHomeBudget();
      return;
    }
    if (!selectionMode) {
      wrap.innerHTML = '';
      wrap.appendChild(renderExpenseList(todayExp, Infinity));
      updateHomeBudget();
      return;
    }
    // 선택 모드
    wrap.innerHTML = '';
    const list = el('div', { class: 'expense-list' });
    todayExp.forEach(exp => {
      const cat = getCategoryById(exp.category);
      const isSelected = selectedIds.has(exp.id);
      const item = el('div', { class: `expense-item exp-selectable${isSelected ? ' exp-selected' : ''}` });
      item.innerHTML = `
        <div class="exp-check-box">${isSelected ? '✓' : ''}</div>
        <div class="expense-cat-icon">${cat.icon}</div>
        <div class="expense-info">
          <div class="expense-memo">${escapeHTML(exp.memo || cat.name)}</div>
          <div class="expense-cat">${cat.name} · <span class="expense-time">${exp.time}</span></div>
        </div>
        <div class="expense-amount">-${formatKRW(exp.amount)}</div>
      `;
      item.addEventListener('click', () => {
        if (selectedIds.has(exp.id)) selectedIds.delete(exp.id);
        else selectedIds.add(exp.id);
        _renderExpList();
      });
      list.appendChild(item);
    });
    wrap.appendChild(list);
  }
  _renderExpList();

  function _openDrawer()  {
    selectionMode = false; selectedIds.clear();
    _renderExpList();
    expDrawer.classList.add('open');
    expOverlay.classList.add('visible');
  }
  function _closeDrawer() {
    selectionMode = false; selectedIds.clear();
    expDrawer.classList.remove('open');
    expOverlay.classList.remove('visible');
  }

  expOverlay.addEventListener('click', _closeDrawer);
  expDrawer.querySelector('#exp-drawer-handle').addEventListener('click', _closeDrawer);

  /* ─── 바텀 네비 ─── */
  screen.appendChild(renderBottomNav('home'));

  /* ─── 이벤트 연결 ─── */
  // 게이지 클릭 → 지출 드로어
  streakRow.querySelector('#home-gauge-area').addEventListener('click', _openDrawer);

  // 하루 정산
  settleWrap.querySelector('#home-settle-btn').addEventListener('click', () => {
    AppState.settleDay();
  });

  // 헤더 버튼
  hdr.querySelector('#home-hdr-demo').addEventListener('click', _demoDayExpenses);
  hdr.querySelector('#home-hdr-gear').addEventListener('click', () => {
    if (typeof showSettingsModal === 'function') showSettingsModal();
  });

  return screen;
}

/* ══════════════════════════════════════════
   CARD_EXPENSES 불러오기
   ══════════════════════════════════════════ */
function _categorizeMerchantHome(merchant) {
  if (/커피|카페|메가엠지씨|컴포즈|스타벅스|이디야|영우카페/.test(merchant))                          return 'cafe';
  if (/맥도날드|버거킹|롯데리아|면옥|쌍용각|한라|콩게미|BHC|bhc|치킨|피자|타코|앤티앤|배달의민족/.test(merchant)) return 'food';
  if (/주유소|철도|기차|버스|지하철|택시/.test(merchant))                                             return 'transport';
  if (/메가박스|롯데시네마|CGV|cgv|디트릭스/.test(merchant))                                         return 'entertain';
  if (/무신사|유니클로|무지|MUJI|다이소|이마트|GS25|씨유|CU|플로맨틱/.test(merchant))               return 'shopping';
  return 'etc';
}

function _loadCardExpenses() {
  if (typeof CARD_EXPENSES === 'undefined' || !CARD_EXPENSES.length) {
    showToast('불러올 소비 데이터가 없어요.', 'warning');
    return;
  }

  const s         = AppState.getState();
  const todayStr  = s.todayDate || getTodayStr();
  const todayMMDD = todayStr.slice(5, 10).replace('-', '-'); // MM-DD

  let entries = CARD_EXPENSES.filter(e => e.date === todayMMDD);
  let dateLabel = `오늘(${todayMMDD})`;

  if (!entries.length) {
    const latestDate = CARD_EXPENSES[0].date;
    entries = CARD_EXPENSES.filter(e => e.date === latestDate);
    dateLabel = latestDate;
  }

  if (!entries.length) {
    showToast('불러올 소비 내역이 없어요.', 'warning');
    return;
  }

  /* 확인 모달 */
  const modal = el('div', { class: 'confirm-modal' });
  modal.innerHTML = `
    <p class="confirm-modal-msg" style="font-size:13px;line-height:1.6">
      <strong>${dateLabel}</strong> 소비 내역<br>
      ${entries.length}건 · 합계 ${formatKRW(entries.reduce((s, e) => s + e.amount, 0))}<br><br>
      불러올까요?
    </p>
    <div class="confirm-modal-btns">
      <button class="confirm-modal-cancel">취소</button>
      <button class="confirm-modal-ok">불러오기</button>
    </div>
  `;
  modal.querySelector('.confirm-modal-cancel').addEventListener('click', () => ModalManager.close());
  modal.querySelector('.confirm-modal-ok').addEventListener('click', () => {
    ModalManager.close();
    entries.forEach(e => {
      AppState.addExpense(e.amount, _categorizeMerchantHome(e.merchant), e.merchant);
    });
    showToast(`${entries.length}건 소비 내역을 불러왔어요!`, 'success', 3000);
  });
  ModalManager.open(modal);
}

/* ── 데모: 하루 소비 자동 입력 ── */
function _demoDayExpenses() {
  const s      = AppState.getState();
  const budget = s.dailyBudget || 30000;

  /* 3가지 시나리오 랜덤 선택 */
  const r = (ratio) => Math.round(budget * ratio / 1000) * 1000;

  const scenarios = [
    /* 무지출 */
    { label: '무지출의 날 💪',  items: [] },
    /* 절약 성공 (예산 50-80% 사용) */
    { label: '절약 성공 🎉', items: [
      { merchant: '편의점CU',   amount: r(0.08) },
      { merchant: '맥도날드',   amount: r(0.25) },
      { merchant: '컴포즈커피', amount: r(0.07) },
    ]},
    { label: '절약 성공 🎉', items: [
      { merchant: '스타벅스',   amount: r(0.2)  },
      { merchant: '한식뷔페',   amount: r(0.35) },
    ]},
    /* 예산 초과 */
    { label: '예산 초과 😅', items: [
      { merchant: '배달의민족', amount: r(0.5)  },
      { merchant: '올리브영',   amount: r(0.45) },
      { merchant: 'GS25',      amount: r(0.12) },
      { merchant: '메가박스',   amount: r(0.4)  },
    ]},
    { label: '예산 초과 😅', items: [
      { merchant: '교촌치킨',   amount: r(0.6)  },
      { merchant: '스타벅스',   amount: r(0.2)  },
      { merchant: '편의점CU',   amount: r(0.06) },
      { merchant: '롯데시네마', amount: r(0.45) },
    ]},
  ];

  const sc    = scenarios[Math.floor(Math.random() * scenarios.length)];
  const total = sc.items.reduce((s, e) => s + e.amount, 0);

  if (sc.items.length === 0) {
    showToast(`${sc.label} — 오늘 지출 없음!`, 'success');
    return;
  }

  const modal = el('div', { class: 'confirm-modal' });
  modal.innerHTML = `
    <p class="confirm-modal-msg" style="font-size:13px;line-height:1.8">
      <strong>${sc.label}</strong><br>
      ${sc.items.map(e => `${e.merchant} ${formatKRW(e.amount)}`).join('<br>')}
      <br><br>합계 <strong>${formatKRW(total)}</strong> (예산 ${formatKRW(budget)})
    </p>
    <div class="confirm-modal-btns">
      <button class="confirm-modal-cancel">취소</button>
      <button class="confirm-modal-ok" style="background:var(--accent)">입력하기</button>
    </div>
  `;
  modal.querySelector('.confirm-modal-cancel').addEventListener('click', () => ModalManager.close());
  modal.querySelector('.confirm-modal-ok').addEventListener('click', () => {
    ModalManager.close();
    sc.items.forEach(e => AppState.addExpense(e.amount, _categorizeMerchantHome(e.merchant), e.merchant));
    showToast(`${sc.items.length}건 입력 완료!`, 'success');
  });
  ModalManager.open(modal);
}

/* ══════════════════════════════════════════
   Reactive Updates
   ══════════════════════════════════════════ */
function updateHomeBudget() {
  const s        = AppState.getState();
  const spent    = s.todaySpent  || 0;
  const budget   = s.dailyBudget || 0;
  const remaining = budget - spent;
  const saveW    = budget > 0 ? Math.max(0, Math.round((remaining / budget) * 100)) : 0;
  const gaugeClass = remaining < 0 ? 'danger' : remaining < budget * 0.2 ? 'warn' : 'safe';
  const ySpent   = _getYesterdaySpent(s);
  const diff     = spent - ySpent;
  const streak   = _calcStreak(s);

  const gaugeEl = document.getElementById('home-gauge');
  if (gaugeEl) { gaugeEl.style.width = saveW + '%'; gaugeEl.className = `home-gauge-fill ${gaugeClass}`; }

  const textEl = document.getElementById('home-gauge-text');
  if (textEl) {
    textEl.textContent = `${remaining >= 0 ? '+' : ''}${formatKRW(remaining)}`;
    textEl.style.color = remaining >= 0 ? 'var(--accent)' : 'var(--red)';
  }

  const streakEl = document.getElementById('home-streak-num');
  if (streakEl) streakEl.textContent = streak;

  const dateEl = document.getElementById('home-hdr-date');
  if (dateEl) dateEl.textContent = _fmtDateTime();
}

function updateHomeExpenseList() {
  const wrap     = document.getElementById('expense-list-wrap');
  if (!wrap) return;
  const todayExp = AppState.getToday();
  if (todayExp.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-text">오늘 지출이 없어요!</div></div>`;
  } else {
    wrap.innerHTML = '';
    wrap.appendChild(renderExpenseList(todayExp, Infinity));
  }
  updateHomeBudget();
}

function updateHomePiggyCard()  { updateHomeBudget(); }
function updateHomeCharCard()   {
  const s    = AppState.getState();
  const step = calcCharStep(s);
  const img  = document.getElementById('home-char-img');
  const name = document.querySelector('.home-char-name2');
  if (img)  img.src       = getFrameImageSrc(s.characterType || 0, step, isCharSad(s));
  if (name) name.innerHTML = `<span class="home-char-lv2">LV.${step}</span> ${getCharDisplayName(step, s.user?.charName)}`;
}
