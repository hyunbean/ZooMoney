/* ===========================================
   BUDGET.JS — PiggyQuest
   카테고리별 예산 게이지 화면 (Dify 기반)
   =========================================== */
'use strict';

// DIFY_BUDGET_API_KEY는 js/config.js에서 로드됩니다.

const BUDGET_CATS = [
  { id: 'food',      icon: '🍽️', name: '식비' },
  { id: 'cafe',      icon: '☕',  name: '카페' },
  { id: 'transport', icon: '🚌', name: '교통' },
  { id: 'shopping',  icon: '🛍️', name: '쇼핑' },
  { id: 'entertain', icon: '🎬', name: '문화' },
  { id: 'etc',       icon: '📦', name: '기타' },
];

function renderBudgetScreen() {
  const s      = AppState.getState();
  const screen = el('div', { class: 'screen bdg-screen' });

  /* ── 헤더 ── */
  const hdr = el('div', { class: 'bdg-header' });
  hdr.innerHTML = `
    <button class="bdg-back" id="bdg-back">‹</button>
    <div class="bdg-title">예산 계획</div>
  `;
  hdr.querySelector('#bdg-back').addEventListener('click', () => AppState.navigate('home'));
  screen.appendChild(hdr);

  const body = el('div', { class: 'bdg-body' });
  screen.appendChild(body);

  /* ── 목표 요약 ── */
  const goal = s.goal || {};
  const summaryCard = el('div', { class: 'bdg-summary' });
  summaryCard.innerHTML = `
    <div class="bdg-summary-row">
      <span class="bdg-summary-label">월 저축 목표</span>
      <span class="bdg-summary-val accent">${formatKRW(goal.monthlyTarget || 0)}</span>
    </div>
    <div class="bdg-summary-row">
      <span class="bdg-summary-label">현재 월 생활비</span>
      <span class="bdg-summary-val">${formatKRW(goal.monthlyExpenses || 0)}</span>
    </div>
  `;
  body.appendChild(summaryCard);

  /* ── 게이지 로드 ── */
  const budgets = goal.categoryBudgets;
  if (budgets && budgets.length > 0) {
    _bdgRenderGauges(body, s, budgets);
  } else {
    const loadWrap = el('div', { class: 'bdg-loading' });
    loadWrap.innerHTML = `
      <div class="bdg-loading-text">AI가 카테고리별 예산을 분석하고 있어요</div>
      <div class="bdg-loading-dots"><span>·</span><span>·</span><span>·</span></div>
    `;
    body.appendChild(loadWrap);
    _bdgFetchSuggestions(s, body, loadWrap);
  }

  return screen;
}

async function _bdgFetchSuggestions(s, body, loadWrap) {
  const totals = s.goal && s.goal.cardCategoryTotals;
  if (!totals) {
    loadWrap.innerHTML = `<div class="bdg-error">카드 소비 분석 데이터가 없어요.<br>온보딩을 먼저 완료해주세요.</div>`;
    return;
  }

  const monthly = s.goal.monthlyTarget || 0;
  const lines   = BUDGET_CATS.map(c => `- ${c.name}: ${formatKRW(totals[c.id] || 0)}`).join('\n');

  const msg = `카테고리별 월 평균 지출과 목표 저축액을 알려드릴게요. 각 카테고리에서 얼마씩 줄이면 현실적으로 달성 가능한지 구체적으로 제안해주세요. 아래 JSON 형식으로만 출력하세요.

월 저축 목표: ${formatKRW(monthly)}
카테고리별 월 평균 지출:
${lines}

\`\`\`json
[
  {"id":"food","current":숫자,"suggested":숫자,"tip":"한 줄 팁"},
  {"id":"cafe","current":숫자,"suggested":숫자,"tip":"한 줄 팁"},
  {"id":"transport","current":숫자,"suggested":숫자,"tip":"한 줄 팁"},
  {"id":"shopping","current":숫자,"suggested":숫자,"tip":"한 줄 팁"},
  {"id":"entertain","current":숫자,"suggested":숫자,"tip":"한 줄 팁"},
  {"id":"etc","current":숫자,"suggested":숫자,"tip":"한 줄 팁"}
]
\`\`\``;

  try {
    const data   = await callDifyAPI(msg, null, DIFY_BUDGET_API_KEY);
    const match  = (data.answer || '').match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) throw new Error('no json');

    const raw     = JSON.parse(match[1]);
    const budgets = BUDGET_CATS.map(c => {
      const b = raw.find(x => x.id === c.id) || {};
      return {
        id:        c.id,
        icon:      c.icon,
        name:      c.name,
        current:   b.current   != null ? b.current   : (totals[c.id] || 0),
        suggested: b.suggested != null ? b.suggested : (totals[c.id] || 0),
        tip:       b.tip || '',
      };
    });

    AppState.saveCategoryBudgets(budgets);
    loadWrap.remove();
    _bdgRenderGauges(body, AppState.getState(), budgets);

  } catch {
    loadWrap.innerHTML = `
      <div class="bdg-error">분석 중 오류가 발생했어요.</div>
      <button class="bdg-retry" id="bdg-retry">다시 시도</button>
    `;
    document.getElementById('bdg-retry')?.addEventListener('click', () => {
      loadWrap.innerHTML = `<div class="bdg-loading-text">다시 분석 중...</div><div class="bdg-loading-dots"><span>·</span><span>·</span><span>·</span></div>`;
      _bdgFetchSuggestions(s, body, loadWrap);
    });
  }
}

function _bdgRenderGauges(body, s, budgets) {
  /* ── 이번 달 실제 지출 계산 ── */
  const month    = (s.todayDate || '').slice(0, 7);
  const catSpent = {};
  (s.expenses || []).forEach(e => {
    if (e.date && e.date.startsWith(month)) {
      catSpent[e.category] = (catSpent[e.category] || 0) + e.amount;
    }
  });

  /* ── 총 절감 목표 ── */
  const totalCur  = budgets.reduce((a, b) => a + (b.current   || 0), 0);
  const totalSug  = budgets.reduce((a, b) => a + (b.suggested || 0), 0);
  const reduction = Math.max(0, totalCur - totalSug);

  const totRow = el('div', { class: 'bdg-total-row' });
  totRow.innerHTML = `
    <span class="bdg-total-label">절감 목표 합계</span>
    <span class="bdg-total-val">${formatKRW(reduction)}</span>
  `;
  body.appendChild(totRow);

  /* ── 게이지 카드 목록 ── */
  const list = el('div', { class: 'bdg-list' });
  budgets.forEach(b => {
    const catDef    = BUDGET_CATS.find(c => c.id === b.id) || {};
    const icon      = b.icon || catDef.icon || '📦';
    const name      = b.name || catDef.name || b.id;
    const actual    = catSpent[b.id] || 0;
    const suggested = b.suggested || 0;
    const pct       = suggested > 0 ? Math.min(100, Math.round((actual / suggested) * 100)) : 0;
    const over      = actual > suggested;
    const diff      = suggested - actual;

    const card = el('div', { class: `bdg-card${over ? ' bdg-over' : ''}` });
    card.innerHTML = `
      <div class="bdg-card-top">
        <span class="bdg-cat-icon">${icon}</span>
        <span class="bdg-cat-name">${name}</span>
        <span class="bdg-cat-nums">${formatKRW(actual)}<span class="bdg-slash"> / </span>${formatKRW(suggested)}</span>
      </div>
      <div class="bdg-gauge-bg">
        <div class="bdg-gauge-fill${over ? ' over' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="bdg-card-bot">
        <span class="bdg-status ${over ? 'over' : 'ok'}">${over ? `▲ ${formatKRW(-diff)} 초과` : `▼ ${formatKRW(diff)} 남음`}</span>
        </div>
    `;
    list.appendChild(card);
  });
  body.appendChild(list);

}
