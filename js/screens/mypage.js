/* ===========================================
   MYPAGE.JS — PiggyQuest  v5
   마이페이지: 헤더 + 히어로 + 배지/친구 탭
   =========================================== */
'use strict';

/* ── 뱃지 색상 ── */
const MYP_BADGE_COLORS = { gold:'#c2691f', green:'#6b8e3a', blue:'#4a7cbf', brown:'#d4a05b' };

/* ── 배지 카테고리 ── */
const BADGE_CATEGORIES = [
  { label: '저축 · 목표',    ids: ['first_step','first_settle','week_goal','zero_day','piggy_50k','year_promise'] },
  { label: '연속 · 출석',    ids: ['streak_3','attend_7','attend_30'] },
  { label: '생활 · 절약',    ids: ['lunchbox','no_deliver','no_cafe','shopping_pro','cash_only','receipt'] },
  { label: '커뮤니티',       ids: ['duo','social_1','rank_1','level_3','level_5'] },
];

/* ── 미션 데이터 ── */
const MISSIONS_DATA = [
  /* 진행중 챌린지 */
  { id: 'attend_7',   group: 'challenge', icon: '🔶', color: '#e8820c', name: '7일 연속 출석!!',   desc: '일주일 동안 매일 출석체크하기',    current: 3,     total: 7,      unit: '일',  badgeId: 'attend_7' },
  { id: 'attend_30',  group: 'challenge', icon: '🔵', color: '#4a7cbf', name: '한 달의 약속',       desc: '30일 연속 출석 도전하기',           current: 3,     total: 30,     unit: '일',  badgeId: 'attend_30' },
  { id: 'zero_day',   group: 'challenge', icon: '🛡',  color: '#c2a020', name: '예산 수호자',        desc: '오늘 하루 한 푼도 쓰지 않기',       current: 0,     total: 1,      unit: '회',  badgeId: 'zero_day' },
  { id: 'piggy_5',    group: 'challenge', icon: '💰', color: '#c0607a', name: '저금통 5만원 달성',  desc: '목표 금액까지 가보자!!',             current: 15000, total: 50000,  unit: '원',  badgeId: 'piggy_50k' },
  /* 개인 미션 */
  { id: 'lunchbox',   group: 'personal',  icon: '🥗',  color: '#5a8a3a', name: '도시락 DAY',         desc: '오늘 한 끼는 도시락으로 먹어보자~', current: 0,     total: 0,      unit: '',    badgeId: 'lunchbox' },
  { id: 'no_deliver', group: 'personal',  icon: '🚫',  color: '#666',    name: '배달앱 stop',        desc: '7일 동안 배달 주문 안 하기',         current: 0,     total: 0,      unit: '',    badgeId: 'no_deliver' },
  { id: 'duo',        group: 'personal',  icon: '👫', color: '#7b5ea7', name: '단짝 듀오',           desc: '친구와 함께 챌린지 시작하기',        current: 0,     total: 0,      unit: '',    badgeId: 'duo' },
  { id: 'no_cafe',    group: 'personal',  icon: '☕', color: '#8b5e3c', name: '카페 거절왕',         desc: '일주일 동안 카페 이용 안 하기',      current: 4,     total: 7,      unit: '일',  badgeId: 'no_cafe' },
  { id: 'shop_pro',   group: 'personal',  icon: '🛒',  color: '#3a7a5a', name: '장보기 고수',         desc: '장 볼 때 만원 이하로 끝내기',        current: 0,     total: 0,      unit: '',    badgeId: 'shopping_pro' },
  { id: 'cash',       group: 'personal',  icon: '💵', color: '#5a8a3a', name: '현금파 입문',         desc: '일주일 카드 없이 현금만 쓰기',       current: 2,     total: 7,      unit: '일',  badgeId: 'cash_only' },
  { id: 'receipt',    group: 'personal',  icon: '🧾',  color: '#c2691f', name: '영수증 인증',         desc: '가게부에 영수증 사진을 올려 지출 인증', current: 0, total: 1,      unit: '회',  badgeId: 'receipt' },
];


/* ══════════════════════════════════════════
   메인 렌더
   ══════════════════════════════════════════ */
function renderMypageScreen() {
  const s     = AppState.getState();
  const step  = calcCharStep(s);
  const xpPct = AppState.getXPPercent();

  const screen = el('div', { class: 'screen myp-screen', id: 'screen-mypage' });

  /* ══ 헤더 ══ */
  const hdr = el('div', { class: 'myp-hdr' });
  hdr.innerHTML = `
    <div class="myp-hdr-title">마이페이지</div>
    <div class="myp-hdr-btns">
      <button class="myp-hdr-btn" id="myp-settings-btn">⚙</button>
    </div>
  `;
  screen.appendChild(hdr);

  /* ══ 히어로 ══ */
  const hero = el('div', { class: 'myp-hero' });
  hero.innerHTML = `
    <div class="myp-hero-char-col">
      <div class="myp-hero-char-box">
        <img class="myp-hero-char-img"
          src="${getFrameImageSrc(s.characterType || 0, step, isCharSad(s))}"
          alt="캐릭터"/>
      </div>
      <div class="myp-hero-badge">LV.${step} ${CHARACTER_NAMES[step - 1]}</div>
    </div>
    <div class="myp-hero-info">
      <div class="myp-hero-name">${escapeHTML(s.user?.name) || '도토리인간'}님</div>
      <div class="myp-xp-section">
        <div class="myp-xp-label">
          <span>경험치</span>
          <span>${xpPct.toFixed(0)}%</span>
        </div>
        <div class="myp-xp-track">
          <div class="myp-xp-fill" style="width:${xpPct}%"></div>
        </div>
      </div>
    </div>
  `;
  screen.appendChild(hero);

  /* ══ 탭 바디 ══ */
  const body = el('div', { class: 'screen-body myp-body', id: 'myp-body' });

  /* 탭바: 목표 | 배지 */
  let activeTab = 0;
  const tabBar = el('div', { class: 'myp-tab-bar' });
  ['목표', '배지'].forEach((label, i) => {
    const btn = el('button', { class: `myp-tab${i === 0 ? ' active' : ''}` });
    btn.textContent = label;
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.myp-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = i;
      contentArea.innerHTML = '';
      if (i === 0) _tabGoal();
      else _tabBadge();
    });
    tabBar.appendChild(btn);
  });
  body.appendChild(tabBar);

  const contentArea = el('div', { class: 'myp-content', id: 'myp-content' });
  body.appendChild(contentArea);

  /* ── 목표 탭 ── */
  function _tabGoal() {
    const goal    = s.goal;
    const hasGoal = goal && goal.targetAmount > 0;

    if (!hasGoal) {
      contentArea.innerHTML = `
        <div class="myp-no-goal">
          <div style="font-size:3rem;margin-bottom:12px">🐷</div>
          <div style="font-size:14px;font-weight:900;color:var(--ink);margin-bottom:8px">아직 목표가 없어요!</div>
          <div style="font-size:12px;color:var(--muted)">온보딩에서 목표를 설정해주세요.</div>
        </div>`;
      return;
    }

    const initial   = (goal.currentSavings) || 0;
    const saved     = Math.max(0, initial + (s.piggyBalance || 0));
    const remaining = Math.max(0, goal.targetAmount - saved);
    const pct       = Math.min(100, Math.round((saved / goal.targetAmount) * 100));
    const daysLeft  = typeof _calcDaysLeft === 'function'
      ? _calcDaysLeft(goal, s.todayDate)
      : 0;

    /* 목표 카드 */
    const goalCard = el('div', { class: 'myp-goal-card' });
    goalCard.innerHTML = `
      <div class="myp-goal-name-row">
        <span class="myp-goal-name">${escapeHTML(goal.name) || '목표'}</span>
        <span class="myp-goal-dday">D-${daysLeft}</span>
      </div>
      <div class="myp-goal-amounts">
        <span class="myp-goal-saved">${formatKRW(saved)}</span>
        <span class="myp-goal-sep"> / </span>
        <span class="myp-goal-total">${formatKRW(goal.targetAmount)}</span>
      </div>
      <div class="myp-goal-bar-bg">
        <div class="myp-goal-bar-fill" style="width:${pct}%"></div>
        <span class="myp-goal-pct">${pct}%</span>
      </div>
      <div class="myp-goal-remaining">남은 금액 <strong>${formatKRW(remaining)}</strong> · <span class="myp-goal-days-txt">${daysLeft}일 남음</span></div>
    `;
    contentArea.appendChild(goalCard);

  }

  /* ── 배지 탭 ── */
  function _tabBadge(defaultSubTab = 0) {
    let repBadgeId = localStorage.getItem('pq_rep_badge') || null;

    /* 서브탭 바 */
    const subBar     = el('div', { class: 'bdg-sub-bar' });
    const subContent = el('div', { class: 'bdg-sub-content' });

    const subTabs = [['🏆', '미션'], ['🎖', '메달 도감']];
    subTabs.forEach(([icon, name], i) => {
      const btn = el('button', { class: `bdg-sub-tab${i === defaultSubTab ? ' active' : ''}` });
      btn.innerHTML = `<span class="bdg-sub-icon">${icon}</span><span>${name}</span>`;
      btn.addEventListener('click', () => {
        subBar.querySelectorAll('.bdg-sub-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSub(i);
      });
      subBar.appendChild(btn);
    });
    contentArea.appendChild(subBar);
    contentArea.appendChild(subContent);

    /* ── 미션 탭 ── */
    function _renderMissions() {
      ['challenge', 'personal'].forEach(group => {
        const sec = el('div', { class: 'bdg-section-title' });
        sec.textContent = group === 'challenge' ? '진행중' : '개인 미션';
        subContent.appendChild(sec);

        MISSIONS_DATA.filter(m => m.group === group).forEach(m => {
          const hasProgress = m.total > 0;
          const pct = hasProgress ? Math.min(100, Math.round(m.current / m.total * 100)) : 0;
          const done = hasProgress && m.current >= m.total;

          const card = el('div', { class: `bdg-mission-card${done ? ' done' : ''}` });

          let progressHTML = '';
          if (hasProgress) {
            const displayVal = m.unit === '원'
              ? `${(m.current / 10000).toFixed(1)}만/${(m.total / 10000).toFixed(0)}만`
              : `${m.current}/${m.total}${m.unit}`;
            progressHTML = `
              <div class="bdg-mission-progress">
                <div class="bdg-mission-bar-wrap">
                  <div class="bdg-mission-bar" style="width:${pct}%;background:${m.color}"></div>
                </div>
                <span class="bdg-mission-progress-txt">${displayVal}</span>
              </div>
            `;
          }

          const badgeDef = m.badgeId ? BADGES.find(b => b.id === m.badgeId) : null;
          const iconHTML = badgeDef?.img
            ? `<img class="bdg-mission-badge-img" src="${badgeDef.img}" alt="${badgeDef.name}"/>`
            : `<span class="bdg-mission-icon">${m.icon}</span>`;

          card.innerHTML = `
            <div class="bdg-mission-icon-box">
              ${iconHTML}
            </div>
            <div class="bdg-mission-info">
              <div class="bdg-mission-name">${m.name}</div>
              <div class="bdg-mission-desc">${m.desc}</div>
              ${progressHTML}
            </div>
            ${done ? '<div class="bdg-mission-done-badge">완료</div>' : ''}
          `;
          subContent.appendChild(card);
        });
      });
    }

    /* ── 메달 도감 탭 ── */
    function _renderMedalBook() {
      const earnedIds  = s.badges || [];
      const repBadge   = repBadgeId ? BADGES.find(b => b.id === repBadgeId) : null;
      const imgBadges  = BADGES.filter(b => b.img); // 이미지 있는 배지만
      let activeFilter = 'all';

      /* 대표 배지 프레임 */
      const repWrap = el('div', { class: 'bdg-rep-wrap' });
      const repBox  = el('div', { class: `bdg-rep-box${repBadge ? ' has-badge' : ''}` });
      if (repBadge?.img) repBox.innerHTML = `<img class="bdg-rep-img" src="${repBadge.img}" alt="${repBadge.name}"/>`;
      repWrap.appendChild(repBox);
      const hint = el('div', { class: 'bdg-rep-hint' });
      hint.textContent = '마음에 드는 뱃지를 선택해\n대표 뱃지로 설정하세요!';
      repWrap.appendChild(hint);
      subContent.appendChild(repWrap);

      /* 메달 컬렉션 헤더 */
      const medalHdr = el('div', { class: 'bdg-medal-header' });
      const earnedImgCount = imgBadges.filter(b => earnedIds.includes(b.id)).length;
      medalHdr.innerHTML = `
        <span class="bdg-medal-label">메달 컬렉션</span>
        <span class="bdg-medal-count-badge">${earnedImgCount}/${imgBadges.length}개 획득</span>
      `;
      subContent.appendChild(medalHdr);

      /* 필터 버튼 */
      const filterBar = el('div', { class: 'bdg-filter-bar' });
      subContent.appendChild(filterBar);

      /* 카테고리별 그리드 컨테이너 */
      const gridWrap = el('div', { class: 'bdg-medal-grid-wrap' });
      subContent.appendChild(gridWrap);

      function renderGrid() {
        gridWrap.innerHTML = '';
        BADGE_CATEGORIES.forEach(cat => {
          const catBadges = imgBadges.filter(b => {
            if (!cat.ids.includes(b.id)) return false;
            if (activeFilter === 'earned') return earnedIds.includes(b.id);
            if (activeFilter === 'locked') return !earnedIds.includes(b.id);
            return true;
          });
          if (catBadges.length === 0) return;

          const catLabel = el('div', { class: 'bdg-category-label' });
          catLabel.textContent = `• ${cat.label}`;
          gridWrap.appendChild(catLabel);

          const grid = el('div', { class: 'bdg-medal-grid' });
          catBadges.forEach(b => {
            const isEarned = earnedIds.includes(b.id);
            const item = el('div', { class: `bdg-medal-item${isEarned ? ' earned' : ' locked'}` });
            item.innerHTML = `<img class="bdg-medal-img${isEarned ? '' : ' locked-img'}" src="${b.img}" alt="${b.name}"/>`;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => isEarned ? _showDetail(b) : _showLocked(b));
            grid.appendChild(item);
          });
          gridWrap.appendChild(grid);
        });
      }

      [['all','전체'], ['earned','획득'], ['locked','미획득']].forEach(([key, label]) => {
        const btn = el('button', { class: `bdg-filter-btn${key === 'all' ? ' active' : ''}` });
        btn.textContent = label;
        btn.addEventListener('click', () => {
          filterBar.querySelectorAll('.bdg-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeFilter = key;
          renderGrid();
        });
        filterBar.appendChild(btn);
      });

      renderGrid();
    }

    /* ── 미획득 배지 조건 팝업 ── */
    function _showLocked(badge) {
      const mission = MISSIONS_DATA.find(m => m.badgeId === badge.id);
      const conditionText = mission ? mission.desc : badge.desc;

      const iconHTML = badge.img
        ? `<img class="bdg-detail-img locked-img" src="${badge.img}" alt="${badge.name}"/>`
        : `<div class="bdg-detail-icon" style="opacity:0.3">${badge.icon}</div>`;

      const content = el('div', { class: 'bdg-detail' });
      content.innerHTML = `
        <button class="bdg-detail-close" id="bdg-close-btn">✕</button>
        <div class="bdg-detail-icon-box">${iconHTML}</div>
        <div class="bdg-detail-name" style="opacity:0.5">${badge.name}</div>
        <div class="bdg-locked-label">🔒 미획득</div>
        <div class="bdg-locked-cond">${conditionText}</div>
      `;
      ModalManager.open(content, '', true);
      content.querySelector('#bdg-close-btn').addEventListener('click', () => ModalManager.close());
    }

    /* ── 배지 상세 팝업 ── */
    function _showDetail(badge) {
      const dates   = JSON.parse(localStorage.getItem('pq_badge_dates') || '{}');
      const dateStr = dates[badge.id]
        ? new Date(dates[badge.id]).toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })
        : new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });

      const iconHTML = badge.img
        ? `<img class="bdg-detail-img" src="${badge.img}" alt="${badge.name}"/>`
        : `<div class="bdg-detail-icon">${badge.icon}</div>`;

      const content = el('div', { class: 'bdg-detail' });
      content.innerHTML = `
        <button class="bdg-detail-close" id="bdg-close-btn">✕</button>
        <div class="bdg-detail-icon-box">${iconHTML}</div>
        <div class="bdg-detail-name">${badge.name}</div>
        <div class="bdg-detail-desc">${badge.desc}</div>
        <div class="bdg-detail-date">${dateStr}</div>
        <button class="bdg-detail-rep-btn" id="bdg-rep-btn">대표 뱃지로 설정</button>
      `;
      ModalManager.open(content, '', true);
      content.querySelector('#bdg-close-btn').addEventListener('click', () => ModalManager.close());
      content.querySelector('#bdg-rep-btn').addEventListener('click', () => {
        repBadgeId = badge.id;
        localStorage.setItem('pq_rep_badge', badge.id);
        ModalManager.close();
        contentArea.innerHTML = '';
        _tabBadge(1);
      });
    }

    function renderSub(i) {
      subContent.innerHTML = '';
      if (i === 0) _renderMissions();
      else _renderMedalBook();
    }

    renderSub(defaultSubTab);
  }

  _tabGoal();

  hdr.querySelector('#myp-settings-btn').addEventListener('click', () => {
    if (typeof showSettingsModal === 'function') showSettingsModal();
  });

  screen.appendChild(body);
  screen.appendChild(renderBottomNav('mypage'));
  return screen;
}

/* ── 내부 헬퍼 ── */
function _mpStreak(s) {
  const hist = (s.piggyHistory || []).slice().reverse();
  let n = 0;
  for (const h of hist) { if (h.delta >= 0 || h.shielded) n++; else break; }
  return n;
}
function _mpSaved(s) {
  return Math.max(0, ((s.goal && s.goal.currentSavings) || 0) + (s.piggyBalance || 0));
}

/* ── 이전 달 기록 여부 확인 ── */
function _hasMonthPassed(s) {
  const todayYM = (s.todayDate || getTodayStr()).slice(0, 7);
  return (s.piggyHistory || []).some(h => h.date && h.date.slice(0, 7) < todayYM);
}

/* ── 월간 리포트 모달 ── */
async function _showMonthlyReport(s, onClose) {
  const content = el('div', { class: 'report-modal' });
  content.innerHTML = `
    <div class="report-modal-title">📋 이달의 리포트</div>
    <div class="report-loading" id="report-loading">
      <div class="settle-ai-loading">
        <span class="tch-dot"></span><span class="tch-dot"></span><span class="tch-dot"></span>
      </div>
      <div class="report-loading-txt">AI가 분석 중...</div>
    </div>
    <div class="report-body" id="report-body"></div>
    <button class="settle-ok-btn" id="report-ok">닫기</button>
  `;
  ModalManager.open(content, '', false);
  content.querySelector('#report-ok').addEventListener('click', () => {
    ModalManager.close();
    if (typeof onClose === 'function') onClose();
  });

  const monthExp   = AppState.getMonthExpenses();
  const totalSpent = monthExp.reduce((acc, e) => acc + e.amount, 0);
  const catMap     = {};
  monthExp.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const catText = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${getCategoryById(k).name} ${formatKRW(v)}`)
    .join(', ') || '없음';
  const successes = s.piggyHistory.filter(h => h.delta >= 0).length;
  const streak    = _mpStreak(s);
  const goal      = s.goal;
  const goalName  = goal ? goal.name : '없음';

  const prompt = `이번 달 지출 분석:\n`
    + `목표: ${goalName}\n`
    + `총 지출: ${formatKRW(totalSpent)}\n`
    + `카테고리별: ${catText}\n`
    + `절약 달성일: ${successes}일, 연속 ${streak}일\n\n`
    + `이 데이터로 소비 패턴과 다음 달 개선 포인트를 친근한 반말로 3-4문장으로 알려줘.`;

  try {
    const res = await callDifyAPI(prompt, null, DIFY_SUMMARY_API_KEY);
    const loadEl = document.getElementById('report-loading');
    const bodyEl = document.getElementById('report-body');
    if (loadEl) loadEl.style.display = 'none';
    if (bodyEl) {
      bodyEl.innerHTML = (res.answer || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\n/g,'<br>');
    }
  } catch {
    const loadEl = document.getElementById('report-loading');
    if (loadEl) loadEl.innerHTML = '<div class="report-loading-txt">연결이 불안정해요 😅<br>잠시 후 다시 시도해줘!</div>';
  }
}

/* ── 꾸미기 아이템 ── */
const COSMETIC_ITEMS = [
  { id:'hat_crown',   icon:'👑', name:'왕관',     slot:'hat',     minLevel:5 },
  { id:'hat_santa',   icon:'🎅', name:'산타 모자', slot:'hat',     minLevel:3 },
  { id:'hat_party',   icon:'🎉', name:'파티 모자', slot:'hat',     minLevel:2 },
  { id:'hat_cowboy',  icon:'🤠', name:'카우보이',  slot:'hat',     minLevel:2 },
  { id:'glass_cool',  icon:'😎', name:'선글라스',  slot:'glasses', minLevel:1 },
  { id:'glass_nerd',  icon:'🤓', name:'안경',      slot:'glasses', minLevel:1 },
  { id:'glass_heart', icon:'🥰', name:'하트 안경', slot:'glasses', minLevel:3 },
  { id:'glass_star',  icon:'🤩', name:'스타 눈',   slot:'glasses', minLevel:4 },
];
