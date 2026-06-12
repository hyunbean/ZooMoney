/* ===========================================
   PIGGY.JS — PiggyQuest
   목표 화면: 남은금액 / 저금현황 / 진행바
   =========================================== */
'use strict';

/* ── 저축 계산 헬퍼 ──
   초기저축(온보딩) + 정산으로 쌓인 piggyBalance
   초과로 인해 음수가 돼도 0 이하로 내려가지 않음  */
function _calcSaved(s) {
  const initial = (s.goal && s.goal.currentSavings) || 0;
  const daily   = s.piggyBalance || 0;
  return Math.max(0, initial + daily);
}

/* ── 실제 남은 일수 계산 ──
   goal.startDate + timelineMonths*30일 = 마감일
   마감일 - state.todayDate = 남은 일수
   (시스템 날짜 아닌 앱 내부 날짜 기준 → 하루 정산 시 즉시 반영) */
function _calcDaysLeft(goal, todayStr) {
  const startStr = goal.startDate || todayStr || new Date().toISOString().slice(0, 10);
  const endDate  = new Date(startStr);
  endDate.setDate(endDate.getDate() + (goal.timelineMonths || 6) * 30);

  const today = new Date(todayStr || new Date().toISOString().slice(0, 10));
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
}

function renderPiggyScreen() {
  const s      = AppState.getState();
  const screen = el('div', { class: 'screen piggy-screen', id: 'screen-piggy' });

  /* ── Header ── */
  const header = el('div', { class: 'screen-header' });
  header.innerHTML = `
    <button class="screen-back-btn" id="piggy-back">‹</button>
  `;
  screen.appendChild(header);
  header.querySelector('#piggy-back').addEventListener('click', () => AppState.navigate('home'));

  /* ── Body ── */
  const body = el('div', { class: 'screen-body piggy-body', id: 'piggy-body' });

  const goal    = s.goal;
  const hasGoal = goal && goal.targetAmount > 0;

  if (hasGoal) {
    const saved     = _calcSaved(s);
    const remaining = Math.max(0, goal.targetAmount - saved);
    const pct       = Math.min(100, Math.round((saved / goal.targetAmount) * 100));
    const daysLeft  = _calcDaysLeft(goal, s.todayDate);  // 앱 내부 날짜 기준

    /* ── 목표 문장 (남은 금액 표시) ── */
    const goalText = el('div', { class: 'piggy-goal-text' });
    goalText.innerHTML = `
      내 목표인 <span class="piggy-goal-name">${goal.name || '목표'}</span> 까지<br>
      <span class="piggy-goal-amount" id="piggy-remaining">${formatKRW(remaining)}</span> 남았고,<br>
      <span class="piggy-goal-days">${daysLeft}일</span> 남았습니다.
    `;
    body.appendChild(goalText);

    /* ── 진행 바 (% 텍스트 안에) ── */
    const progressWrap = el('div', { class: 'piggy-progress-wrap' });
    progressWrap.innerHTML = `
      <div class="piggy-progress-bar-bg">
        <div class="piggy-progress-bar-fill" id="piggy-bar-fill" style="width:${pct}%"></div>
        <span class="piggy-progress-pct-label" id="piggy-bar-pct">${pct}%</span>
      </div>
    `;
    body.appendChild(progressWrap);

    /* ── 캐릭터 박스 ── */
    const charBox = el('div', { class: 'piggy-char-box' });
    const charImg = el('img', {
      class: 'piggy-char-main',
      id: 'piggy-char-sprite',
      src: getFrameImageSrc(s.characterType || 0, calcCharStep(s), isCharSad(s)),
      alt: '캐릭터',
    });
    const step = calcCharStep(s);
    const charName = el('div', { class: 'home-char-name2' });
    charName.innerHTML = `<span class="home-char-lv2">LV.${step}</span> ${getCharDisplayName(step, s.user?.charName)}`;
    charBox.appendChild(charImg);
    charBox.appendChild(charName);
    body.appendChild(charBox);


  } else {
    /* ── 목표 없음 ── */
    const noGoal = el('div', { class: 'piggy-no-goal' });
    noGoal.innerHTML = `
      <div class="piggy-no-goal-emoji">🐷</div>
      <div class="piggy-no-goal-title">아직 목표가 없어요!</div>
      <div class="piggy-no-goal-hint">온보딩에서 목표를 설정해주세요.</div>
    `;
    body.appendChild(noGoal);
  }

  screen.appendChild(body);
  screen.appendChild(renderBottomNav('piggy'));

  return screen;
}

/* ── Reactive: 정산 후 목표탭 즉시 반영 ── */
function updatePiggyProgress() {
  const s    = AppState.getState();
  const goal = s.goal;
  if (!goal || goal.targetAmount <= 0) return;

  const saved     = _calcSaved(s);
  const remaining = Math.max(0, goal.targetAmount - saved);
  const pct       = Math.min(100, Math.round((saved / goal.targetAmount) * 100));
  const daysLeft  = _calcDaysLeft(goal, s.todayDate);  // 앱 내부 날짜 기준

  const fillEl      = document.getElementById('piggy-bar-fill');
  const pctEl       = document.getElementById('piggy-bar-pct');
  const savedValEl  = document.getElementById('piggy-saved-val');
  const remainingEl = document.getElementById('piggy-remaining');
  const daysEl      = document.querySelector('.piggy-goal-days');

  if (fillEl)      fillEl.style.width     = pct + '%';
  if (pctEl)       pctEl.textContent      = pct + '%';
  if (savedValEl)  savedValEl.textContent  = formatKRW(saved);
  if (remainingEl) remainingEl.textContent = formatKRW(remaining);
  if (daysEl)      daysEl.textContent      = daysLeft + '일';
}
