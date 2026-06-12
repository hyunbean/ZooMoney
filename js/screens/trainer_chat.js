/* ===========================================
   TRAINER_CHAT.JS — PiggyQuest
   트레이너과의 AI 채팅 화면
   =========================================== */
'use strict';

const DIFY_TRAINER_API_KEY = 'app-QDyYTj2EmA1sUM3J1qRroIVm';

/* 목표 변경 플로우 상태 (renderTrainerChatScreen 재진입 시 리셋) */
let _tchGoalChangeStep        = null;
let _tchPendingGoalData       = null;
let _tchPendingSelectedAmount = 0;

function renderTrainerChatScreen() {
  const s = AppState.getState();
  const screen = el('div', { class: 'screen tch-screen', id: 'screen-trainer-chat' });

  let convId = null;

  /* 목표 변경 플로우 상태 리셋 (화면 재진입 시) */
  _tchGoalChangeStep        = null;
  _tchPendingGoalData       = null;
  _tchPendingSelectedAmount = 0;

  /* ── 헤더 ── */
  const hdr = el('div', { class: 'tch-header' });
  hdr.innerHTML = `
    <button class="tch-back" id="tch-back">‹</button>
    <img class="tch-header-avatar" src="images/trainer_chat.png?v=2" alt="트레이너"/>
    <div class="tch-title-wrap">
      <div class="tch-name">트레이너</div>
      <div class="tch-status">절약 코치 · 온라인</div>
    </div>
  `;
  screen.appendChild(hdr);

  /* ── 채팅 바디 ── */
  const body = el('div', { class: 'chat-body tch-body', id: 'tch-body' });
  screen.appendChild(body);

  /* ── 입력창 ── */
  const inputWrap = el('div', { class: 'chat-input-wrap' });
  inputWrap.innerHTML = `
    <input class="chat-input" id="tch-input" placeholder="트레이너에게 물어보세요..." maxlength="200"/>
    <button class="chat-send-btn" id="tch-send">▶</button>
  `;
  screen.appendChild(inputWrap);

  /* ── 첫 인사 (상태 기반) ── */
  const goal = s.goal;
  let greeting;
  if (goal && goal.targetAmount > 0) {
    const daysLeft = _tchDaysLeft(goal, s.todayDate);
    greeting = `안녕! 나는 트레이너이야! 🗺️\n[${goal.name}] 목표까지 ${daysLeft}일 남았어.\n절약이나 예산에 대해 궁금한 점이 있으면 뭐든지 물어봐!`;
  } else {
    greeting = '안녕! 나는 트레이너이야! 🗺️\n소비 습관이나 절약 방법이 궁금하면 언제든 물어봐!';
  }
  _tchTrainer(body, greeting);


  /* ── 퀵메뉴 ── */
  const quickWrap = el('div', { class: 'tch-quick-wrap' });
  ['목표를 변경하고 싶어.', '절약 팁을 알려줘'].forEach(label => {
    const btn = el('button', { class: 'tch-quick-btn' });
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (label === '목표를 변경하고 싶어.') {
        quickWrap.remove();
        _tchUser(body, label);
        _tchGoalChangeStep = 'ask_goal';
        _tchTrainer(body, '어떤 목표로 바꾸고 싶어?\n갖고 싶은 것, 가고 싶은 여행지를 알려줘!');
        _tchScroll(body);
      } else if (label === '최저가를 알고싶어.') {
        quickWrap.remove();
        _tchUser(body, label);
        _tchGoalChangeStep = 'ask_price';
        _tchTrainer(body, '어떤 상품의 최저가가 궁금해? 상품명을 알려줘! 🔍\n(예: 맥북, 에어팟, 닌텐도 스위치)');
        _tchScroll(body);
      } else {
        send(label);
      }
    });
    quickWrap.appendChild(btn);
  });
  body.appendChild(quickWrap);

  /* ── 이벤트 ── */
  hdr.querySelector('#tch-back').addEventListener('click', () => AppState.navigate('home'));

  const input   = inputWrap.querySelector('#tch-input');
  const sendBtn = inputWrap.querySelector('#tch-send');

  async function send(textArg) {
    const text = (textArg !== undefined ? textArg : input.value).trim();
    if (!text || sendBtn.disabled) return;
    input.value = '';
    sendBtn.disabled = true;
    quickWrap.remove();

    _tchUser(body, text);
    _tchScroll(body);

    /* ── 목표 변경 플로우 분기 ── */
    if (_tchGoalChangeStep === 'ask_goal') {
      sendBtn.disabled = false;
      const typing = _tchTyping(body);
      _tchScroll(body);
      try {
        const data = await callDifyAPI(text, null, DIFY_API_KEY); // 목표설정: 가격검색+JSON
        typing.remove();
        const { displayText, goal } = parseGoalFromResponse(data.answer);
        if (goal) {
          _tchPendingGoalData = goal;
          _tchTrainer(body, `${displayText}\n\n어떤 가격대로 목표를 잡을까?`);
          _tchPriceBtns(body, goal.targetAmount);
          _tchGoalChangeStep = 'pick_price';
        } else {
          _tchTrainer(body, `${displayText}\n\n다시 한 번 알려줘!`);
        }
      } catch {
        _tchTypingRemove(body);
        _tchTrainer(body, '검색 중 오류가 났어. 다시 말해줘!');
      }
      _tchScroll(body);
      return;
    }

    /* ── 최저가 조회 플로우 (실제 가격검색 에이전트 사용) ── */
    if (_tchGoalChangeStep === 'ask_price') {
      _tchGoalChangeStep = null;
      const typing = _tchTyping(body);
      _tchScroll(body);
      try {
        const data = await callDifyAPI(text, null, DIFY_API_KEY);
        typing.remove();
        const { goal } = parseGoalFromResponse(data.answer);
        if (goal && goal.targetAmount > 0) {
          const amt = goal.targetAmount;
          const low = Math.round(amt * 0.72 / 1000) * 1000;
          _tchTrainer(body, `${goal.goalName} 가격을 찾아봤어! 🔍\n💰 보통 ${amt.toLocaleString()}원 정도\n🏷️ 최저가로는 ${low.toLocaleString()}원까지도 가능해!\n\n또 다른 상품이 궁금하면 "최저가를 알고싶어"를 다시 눌러줘.`);
        } else {
          _tchTrainer(body, '음, 그 상품 가격을 못 찾았어 😅\n상품명을 좀 더 구체적으로 알려줄래?');
          _tchGoalChangeStep = 'ask_price';
        }
      } catch {
        typing.remove();
        _tchTrainer(body, '검색 중 신호가 안 좋았어. 다시 한 번 말해줘!');
        _tchGoalChangeStep = 'ask_price';
      } finally {
        sendBtn.disabled = false;
        _tchScroll(body);
        input.focus();
      }
      return;
    }

    const typing = _tchTyping(body);
    _tchScroll(body);

    try {
      const data = await callDifyAPI(text, convId, DIFY_TRAINER_API_KEY);
      convId = data.conversation_id;
      typing.remove();
      const action = _tchParseGoalAction(data.answer);
      if (action) {
        AppState.updateGoal({
          name: action.name,
          targetAmount: action.targetAmount,
          timelineMonths: action.timelineMonths,
        });
        const updated = AppState.getState().goal;
        const timelineLabel = action.timelineMonths < 12 ? `${action.timelineMonths}개월` : action.timelineMonths === 12 ? '1년' : `${action.timelineMonths}개월`;
        _tchTrainer(body, `목표를 변경했어! 🎯\n📌 ${action.name}\n💰 ${action.targetAmount.toLocaleString()}원 / ${timelineLabel}\n📅 월 ${(updated.monthlyTarget || 0).toLocaleString()}원씩 저금하면 돼!\n\n카테고리별 예산도 다시 계산할게...`);
        _tchScroll(body);
        await _tchRefreshBudget(body, updated);
      } else {
        _tchTrainer(body, data.answer);
        if (_tchIsConversationEnd(data.answer)) {
          setTimeout(() => {
            convId = null;
            _tchShowReset(body, send);
            _tchScroll(body);
          }, 2000);
        }
      }
    } catch {
      typing.remove();
      _tchTrainer(body, '신호가 좋지 않아... 잠깐 후에 다시 말해줘! 😅');
    } finally {
      sendBtn.disabled = false;
      _tchScroll(body);
      input.focus();
    }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) send();
  });

  return screen;
}

/* ── 남은 일수 ── */
function _tchDaysLeft(goal, todayStr) {
  const start = new Date(goal.startDate || todayStr || new Date().toISOString().slice(0, 10));
  start.setDate(start.getDate() + (goal.timelineMonths || 6) * 30);
  const today = new Date(todayStr || new Date().toISOString().slice(0, 10));
  start.setHours(0,0,0,0); today.setHours(0,0,0,0);
  return Math.max(0, Math.ceil((start - today) / 86400000));
}

/* ── 트레이너 말풍선 ── */
function _tchTrainer(container, text) {
  const msg = el('div', { class: 'chat-msg' });
  msg.innerHTML = `
    <img class="chat-avatar tch-chat-avatar" src="images/trainer_chat.png?v=2" alt="트레이너"/>
    <div class="chat-bubble-wrap">
      <div class="chat-bubble-name">트레이너</div>
      <div class="chat-bubble tch-bubble">${_tchEsc(text)}</div>
    </div>
  `;
  container.appendChild(msg);
  return msg;
}

/* ── 유저 말풍선 ── */
function _tchUser(container, text) {
  const msg = el('div', { class: 'chat-msg chat-msg-me' });
  msg.innerHTML = `
    <div class="chat-bubble-wrap">
      <div class="chat-bubble chat-bubble-me">${_tchEsc(text)}</div>
    </div>
  `;
  container.appendChild(msg);
  return msg;
}

/* ── 타이핑 인디케이터 ── */
function _tchTyping(container) {
  const msg = el('div', { class: 'chat-msg' });
  msg.innerHTML = `
    <img class="chat-avatar tch-chat-avatar" src="images/trainer_chat.png?v=2" alt="트레이너"/>
    <div class="chat-bubble-wrap">
      <div class="chat-bubble tch-bubble tch-typing">
        <span class="tch-dot"></span>
        <span class="tch-dot"></span>
        <span class="tch-dot"></span>
      </div>
    </div>
  `;
  container.appendChild(msg);
  return msg;
}

function _tchScroll(el) {
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}

/* ── 가격 선택 버튼 ── */
function _tchPriceBtns(body, baseAmount) {
  const tiers = [
    { label: '여유롭게', mult: 1.0 },
    { label: '보통',     mult: 0.86 },
    { label: '최저가',   mult: 0.72 },
  ];
  const wrap = el('div', { class: 'tch-btn-group' });
  tiers.forEach(({ label, mult }) => {
    const amt = Math.round(baseAmount * mult / 1000) * 1000;
    const btn = el('button', { class: 'tch-choice-btn' });
    btn.innerHTML = `${label}<br><span class="tch-choice-amt">${amt.toLocaleString()}원</span>`;
    btn.addEventListener('click', () => {
      wrap.remove();
      _tchPendingSelectedAmount = amt;
      const s = AppState.getState();
      const saved = s.piggyBalance || 0;
      const remaining = Math.max(0, amt - saved);
      _tchUser(body, label);
      _tchTrainer(body, `${label} 기준 ${amt.toLocaleString()}원!\n지금까지 모은 돈: ${saved.toLocaleString()}원\n앞으로 ${remaining.toLocaleString()}원 더 모으면 돼.\n\n몇 개월 안에 달성하고 싶어?`);
      _tchMonthBtns(body, remaining);
      _tchGoalChangeStep = 'pick_months';
      _tchScroll(body);
    });
    wrap.appendChild(btn);
  });
  body.appendChild(wrap);
}

/* ── 개월수 선택 버튼 ── */
function _tchMonthBtns(body, remaining) {
  const months = [3, 6, 12, 18, 24];
  const wrap = el('div', { class: 'tch-btn-group' });
  months.forEach(m => {
    const monthly = Math.ceil(remaining / m);
    const label = m < 12 ? `${m}개월` : m === 12 ? '1년' : m === 24 ? '2년' : `${m}개월`;
    const btn = el('button', { class: 'tch-choice-btn' });
    btn.innerHTML = `${label}<br><span class="tch-choice-amt">월 ${monthly.toLocaleString()}원</span>`;
    btn.addEventListener('click', async () => {
      wrap.remove();
      _tchUser(body, label);
      _tchGoalChangeStep = null;
      AppState.updateGoal({
        name: _tchPendingGoalData.goalName,
        targetAmount: _tchPendingSelectedAmount,
        currentSavings: AppState.getState().piggyBalance || 0,
        timelineMonths: m,
      });
      const updated = AppState.getState().goal;
      _tchTrainer(body, `목표 변경 완료! 🎯\n📌 ${_tchPendingGoalData.goalName}\n💰 ${_tchPendingSelectedAmount.toLocaleString()}원 / ${label}\n📅 월 ${(updated.monthlyTarget || 0).toLocaleString()}원씩 저금!\n\n카테고리별 예산도 다시 계산할게...`);
      _tchScroll(body);
      await _tchRefreshBudget(body, updated);
    });
    wrap.appendChild(btn);
  });
  body.appendChild(wrap);
}

/* ── 목표 변경 후 카테고리 예산 재계산 ── */
async function _tchRefreshBudget(body, goal) {
  const totals = goal.cardCategoryTotals;
  if (!totals) {
    _tchTrainer(body, '카드 소비 데이터가 없어서 예산 재계산은 건너뛸게. 예산 탭에서 직접 확인해봐!');
    return;
  }

  const CATS = [
    { id: 'food', name: '식비' }, { id: 'cafe', name: '카페' },
    { id: 'transport', name: '교통' }, { id: 'shopping', name: '쇼핑' },
    { id: 'entertain', name: '문화' }, { id: 'etc', name: '기타' },
  ];
  const lines = CATS.map(c => `- ${c.name}: ${(totals[c.id] || 0).toLocaleString()}원`).join('\n');
  const monthly = goal.monthlyTarget || 0;

  const msg = `카테고리별 월 평균 지출과 목표 저축액을 알려드릴게요. 각 카테고리에서 얼마씩 줄이면 현실적으로 달성 가능한지 구체적으로 제안해주세요. 아래 JSON 형식으로만 출력하세요.

월 저축 목표: ${monthly.toLocaleString()}원
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
    const data  = await callDifyAPI(msg, null, DIFY_BUDGET_API_KEY);
    const match = (data.answer || '').match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) throw new Error('no json');
    const budgets = JSON.parse(match[1]);
    AppState.updateGoal({ categoryBudgets: budgets });
    const tips = budgets.map(b => `• ${CATS.find(c => c.id === b.id)?.name || b.id}: ${b.suggested.toLocaleString()}원`).join('\n');
    _tchTrainer(body, `카테고리별 예산 업데이트 완료! 📊\n\n${tips}\n\n예산 탭에서 자세히 확인해봐!`);
  } catch {
    _tchTrainer(body, '예산 재계산 중 오류가 났어. 예산 탭을 열면 자동으로 다시 계산돼!');
  }
  _tchScroll(body);
}

function _tchParseGoalAction(text) {
  try {
    const match = text.match(/\{[^{}]*"action"\s*:\s*"update_goal"[^{}]*\}/);
    if (!match) return null;
    const obj = JSON.parse(match[0]);
    if (obj.action === 'update_goal' && obj.name && obj.targetAmount > 0 && obj.timelineMonths > 0) {
      return obj;
    }
  } catch (e) {}
  return null;
}

/* ── 대화 종결 감지 ── */
function _tchIsConversationEnd(text) {
  const END_KEYWORDS = [
    '언제든지', '또 궁금', '다음에', '도움이 됐', '도움됐', '힘내',
    '응원할게', '화이팅', '잘 될 거야', '잘 해낼', '언제든 물어',
    '궁금한 게 있으면', '필요하면 말해', '도움이 필요하면',
  ];
  return END_KEYWORDS.some(kw => text.includes(kw));
}

/* ── 대화 리셋 (구분선 + 퀵메뉴 재표시) ── */
function _tchShowReset(body, send) {
  const divider = el('div', { class: 'tch-divider' });
  divider.textContent = '새 대화';
  body.appendChild(divider);

  const s = AppState.getState();
  const goal = s.goal;
  let greeting;
  if (goal && goal.targetAmount > 0) {
    const daysLeft = _tchDaysLeft(goal, s.todayDate);
    greeting = `다른 궁금한 점이 있으면 언제든 물어봐!\n[${goal.name}] 목표까지 ${daysLeft}일 남았어.`;
  } else {
    greeting = '또 궁금한 게 있으면 언제든 물어봐!';
  }
  _tchTrainer(body, greeting);

  const quickWrap = el('div', { class: 'tch-quick-wrap' });
  ['목표를 변경하고 싶어.', '절약 팁을 알려줘'].forEach(label => {
    const btn = el('button', { class: 'tch-quick-btn' });
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (label === '목표를 변경하고 싶어.') {
        quickWrap.remove();
        _tchUser(body, label);
        _tchGoalChangeStep = 'ask_goal';
        _tchTrainer(body, '어떤 목표로 바꾸고 싶어?\n갖고 싶은 것, 가고 싶은 여행지를 알려줘!');
      } else if (label === '최저가를 알고싶어.') {
        quickWrap.remove();
        _tchUser(body, label);
        _tchGoalChangeStep = 'ask_price';
        _tchTrainer(body, '어떤 상품의 최저가가 궁금해? 상품명을 알려줘! 🔍\n(예: 맥북, 에어팟, 닌텐도 스위치)');
      } else {
        quickWrap.remove();
        send(label);
      }
    });
    quickWrap.appendChild(btn);
  });
  body.appendChild(quickWrap);
}

function _tchEsc(str) {
  return str
    .replace(/🌰|🍂|🐿️/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
