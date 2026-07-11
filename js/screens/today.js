/* ===========================================
   TODAY.JS — PiggyQuest
   저금통 화면 (Figma: 캐릭터 + 잔액 + 절약/초과 + 달력)
   =========================================== */
'use strict';

function renderTodayScreen() {
  const s     = AppState.getState();
  const today = s.todayDate || getTodayStr();

  const screen = el('div', { class: 'screen jgt-screen', id: 'screen-today' });

  let calYear  = parseInt(today.slice(0, 4));
  let calMonth = parseInt(today.slice(5, 7)) - 1; // 0-indexed

  /* ── 헤더 ── */
  const hdr = el('div', { class: 'screen-header' });
  hdr.innerHTML = `
    <button class="screen-back-btn" id="today-back">‹</button>
    <span class="hdr-title">돼지저금통</span>
  `;
  hdr.querySelector('#today-back').addEventListener('click', () => AppState.navigate('home'));
  screen.appendChild(hdr);

  /* ── 돼지저금통 이미지 (centered) ── */
  const charSection = el('div', { class: 'jgt-char-section' });
  const charCenter = el('div', { class: 'jgt-char-center' });
  const piggyImg = el('img', { class: 'jgt-char-img jgt-piggy-img', src: 'images/images_pig.png', alt: '돼지저금통' });
  charCenter.appendChild(piggyImg);
  charSection.appendChild(charCenter);
  screen.appendChild(charSection);

  /* ── 저금통 잔액 (이미지 아래) ── */
  const amountEl = el('div', { class: 'jgt-big-amount', id: 'jgt-big-amount' });
  amountEl.textContent = formatKRW(s.piggyBalance || 0);
  screen.appendChild(amountEl);

  /* ── 달력 body ── */
  const body = el('div', { class: 'screen-body jgt-body', id: 'jgt-body' });
  screen.appendChild(body);

  /* ── Bottom Nav + Expense Sheet ── */
  screen.appendChild(renderBottomNav('today'));
  screen.appendChild(renderExpenseSheet());

  /* ── 달력 렌더링 (전용 컨테이너) ── */
  const calContainer = el('div', { class: 'jgt-cal-container', id: 'jgt-cal-container' });
  body.appendChild(calContainer);
  renderCalendar(calContainer);

  /* ── ETF 투자 상시 박스 (달력 아래 스크롤 영역) ── */
  const etfBox = el('div', { class: 'piggy-etf-box jgt-etf-box' });
  etfBox.innerHTML = `
    <div class="piggy-etf-box-left">
      <div class="piggy-etf-box-title">📈 ETF 투자</div>
      <div class="piggy-etf-box-desc">모인 돈을 더 불려보세요.<br>종목별 장단점과 AI 추천을 확인해요!</div>
    </div>
    <button class="piggy-etf-box-btn" id="today-etf-btn">알아보기</button>
  `;
  etfBox.querySelector('#today-etf-btn').addEventListener('click', () => AppState.navigate('etf'));
  body.appendChild(etfBox);


  return screen;

  /* ─────────────────────────────────────── */
  function renderCalendar(container) {
    container.innerHTML = '';
    const cs = AppState.getState();
    const calCard = el('div', { class: 'jgt-cal-card' });

    /* 헤더: ‹ 5월 › */
    const calHeader = el('div', { class: 'jgt-cal-header' });
    calHeader.innerHTML = `
      <button class="jgt-cal-nav" id="jgt-cal-prev">‹</button>
      <span class="jgt-cal-month" id="jgt-cal-month-label">${calMonth + 1}월</span>
      <button class="jgt-cal-nav" id="jgt-cal-next">›</button>
    `;
    calCard.appendChild(calHeader);

    /* 월 라벨 클릭 → 월 요약 팝업 */
    calHeader.querySelector('#jgt-cal-month-label').addEventListener('click', () => {
      showMonthPopup(calYear, calMonth);
    });

    /* DOW — 월화수목금토일 */
    const dowRow = el('div', { class: 'jgt-cal-dow' });
    ['월','화','수','목','금','토','일'].forEach(d => {
      dowRow.appendChild(el('div', { class: 'jgt-cal-dow-cell', html: d }));
    });
    calCard.appendChild(dowRow);

    /* 날짜 그리드 */
    const grid = el('div', { class: 'jgt-cal-grid' });
    const firstDowJS  = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const offset      = (firstDowJS - 1 + 7) % 7;               // Monday-first
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const piggyMap = {};
    cs.piggyHistory.forEach(h => { piggyMap[h.date] = h.delta; });

    /* 빈 셀 (앞 여백) */
    for (let i = 0; i < offset; i++) {
      grid.appendChild(el('div', { class: 'jgt-cal-cell empty' }));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const ds      = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday  = ds === today;
      const isFuture = ds > today;
      const delta    = piggyMap[ds];
      const isFail   = delta !== undefined && delta < 0;
      const isDone   = delta !== undefined && delta >= 0;

      let cls = 'jgt-cal-cell';
      if      (isToday)  cls += ' cal-today';
      else if (isFail)   cls += ' cal-fail';
      else if (isDone)   cls += ' cal-done';
      else if (isFuture) cls += ' cal-future';

      const cell = el('div', { class: cls });
      cell.innerHTML = `<span class="jgt-cal-date">${d}</span>`;
      cell.addEventListener('click', () => showDayPopup(ds, calYear, calMonth + 1, d));
      grid.appendChild(cell);
    }
    calCard.appendChild(grid);
    container.appendChild(calCard);

    /* 월 이동 */
    calHeader.querySelector('#jgt-cal-prev').addEventListener('click', e => {
      e.stopPropagation();
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar(container);
    });
    calHeader.querySelector('#jgt-cal-next').addEventListener('click', e => {
      e.stopPropagation();
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar(container);
    });
  }
}

/* ── Reactive stubs ── */
function updateTodayExpenseList() {
  const amtEl = document.getElementById('jgt-big-amount');
  if (amtEl) amtEl.textContent = formatKRW(AppState.getState().piggyBalance || 0);
}
