/* ===========================================
   ONBOARDING.JS — PiggyQuest
   Goal-based saving setup: Dify chat entry + 5 steps
   =========================================== */
'use strict';

/* ── Dify API 설정 (키는 js/config.js) ── */
const DIFY_BASE_URL         = 'https://api.dify.ai/v1';

async function callDifyAPI(message, conversationId, apiKey = DIFY_API_KEY) {
  // 응답이 안 오면 버튼이 영구 잠기지 않도록 30초 타임아웃
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: 'blocking',
        ...(conversationId ? { conversation_id: conversationId } : {}),
        user: 'piggyquest-user',
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Dify API ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ── 현대카드 소비 데이터 (hyundaicard_20260518.csv) ── */
const CARD_EXPENSES = [
  /* ── 5월 ── */
  { date: '05-26', merchant: '스타벅스',                  amount: 6500  },
  { date: '05-25', merchant: '배달의민족',                 amount: 24000 },
  { date: '05-24', merchant: 'GS25',                      amount: 3800  },
  { date: '05-23', merchant: '메가박스',                   amount: 14000 },
  { date: '05-22', merchant: '한국맥도날드',               amount: 9500  },
  { date: '05-21', merchant: '컴포즈커피',                 amount: 2500  },
  { date: '05-20', merchant: '배달의민족',                 amount: 19000 },
  { date: '05-19', merchant: '이디야커피',                 amount: 3800  },
  { date: '05-19', merchant: '한라면옥수원인계점',          amount: 18000 },
  { date: '05-18', merchant: '씨유CU',                    amount: 2800  },
  { date: '05-17', merchant: '올리브영',                   amount: 38500 },
  { date: '05-16', merchant: '스타벅스',                   amount: 5500  },
  { date: '05-15', merchant: '교촌치킨',                   amount: 21000 },
  { date: '05-15', merchant: 'CGV',                       amount: 13500 },
  { date: '05-14', merchant: '투썸플레이스',               amount: 8500  },
  { date: '05-13', merchant: '배달의민족',                 amount: 26000 },
  { date: '05-12', merchant: '네이버페이',                 amount: 44000 },
  { date: '05-11', merchant: '비에이치씨(BHC)',            amount: 19000 },
  { date: '05-10', merchant: '씨유CU',                    amount: 1900  },
  { date: '05-09', merchant: '스타벅스',                   amount: 7000  },
  { date: '05-08', merchant: '티머니(충전)',               amount: 10000 },
  { date: '05-07', merchant: '한국맥도날드',               amount: 8000  },
  { date: '05-06', merchant: '이마트24',                   amount: 3500  },
  { date: '05-05', merchant: '메가엠지씨커피',             amount: 2000  },
  { date: '05-04', merchant: '쌍용각',                     amount: 14000 },
  { date: '05-03', merchant: '롯데시네마',                  amount: 12000 },
  { date: '05-02', merchant: '카카오페이',                  amount: 32000 },
  { date: '05-01', merchant: '버거킹',                     amount: 8500  },
  /* ── 4월 ── */
  { date: '04-28', merchant: '스타벅스',                   amount: 6000  },
  { date: '04-27', merchant: '배달의민족',                  amount: 21500 },
  { date: '04-26', merchant: 'GS25',                      amount: 5200  },
  { date: '04-25', merchant: '홍대한우(회식)',              amount: 43000 },
  { date: '04-24', merchant: '컴포즈커피',                  amount: 2500  },
  { date: '04-23', merchant: '롯데시네마',                  amount: 13000 },
  { date: '04-22', merchant: '유니클로(에프알엘코리아)',     amount: 49000 },
  { date: '04-21', merchant: '이디야커피',                  amount: 4200  },
  { date: '04-20', merchant: '배달의민족',                  amount: 18500 },
  { date: '04-19', merchant: '티머니(충전)',                amount: 10000 },
  { date: '04-18', merchant: '투썸플레이스',                amount: 9000  },
  { date: '04-17', merchant: '씨유CU',                    amount: 3300  },
  { date: '04-16', merchant: '맥도날드',                    amount: 9200  },
  { date: '04-15', merchant: '무신사',                     amount: 67000 },
  { date: '04-14', merchant: '메가박스',                    amount: 14000 },
  { date: '04-13', merchant: '블루보틀',                    amount: 9800  },
  { date: '04-12', merchant: '배달의민족',                  amount: 27000 },
  { date: '04-11', merchant: '철도승차권(수원-서울)',       amount: 5800  },
  { date: '04-10', merchant: '다이소',                     amount: 12000 },
  { date: '04-09', merchant: '스타벅스',                    amount: 7500  },
  { date: '04-08', merchant: '이마트24',                    amount: 6200  },
  { date: '04-07', merchant: '교촌치킨',                    amount: 20000 },
  /* ── 3월 ── */
  { date: '03-30', merchant: '스타벅스',                    amount: 5500  },
  { date: '03-29', merchant: '씨유CU',                    amount: 2100  },
  { date: '03-28', merchant: '배달의민족',                  amount: 22000 },
  { date: '03-27', merchant: '한국맥도날드',                amount: 8800  },
  { date: '03-26', merchant: '컴포즈커피',                  amount: 2500  },
  { date: '03-25', merchant: 'GS25',                      amount: 4700  },
  { date: '03-24', merchant: 'CGV',                       amount: 13000 },
  { date: '03-22', merchant: '올리브영',                    amount: 41000 },
  { date: '03-21', merchant: '이디야커피',                  amount: 3800  },
  { date: '03-20', merchant: '한라면옥수원인계점',           amount: 16000 },
  { date: '03-19', merchant: 'KTX(서울-부산)',              amount: 59800 },
  { date: '03-18', merchant: '스타벅스',                    amount: 7500  },
  { date: '03-17', merchant: '네이버페이',                  amount: 33000 },
  { date: '03-16', merchant: '배달의민족',                  amount: 18500 },
  { date: '03-15', merchant: '이마트24',                    amount: 4800  },
  { date: '03-14', merchant: '쌍용각',                     amount: 13000 },
  { date: '03-13', merchant: '투썸플레이스',                amount: 8000  },
  { date: '03-12', merchant: '티머니(충전)',                amount: 10000 },
  { date: '03-11', merchant: '메가박스',                    amount: 13000 },
  { date: '03-10', merchant: '비에이치씨(BHC)',             amount: 20000 },
  { date: '03-09', merchant: '스타벅스',                    amount: 6500  },
  { date: '03-08', merchant: '다이소',                     amount: 8500  },
  { date: '03-07', merchant: '씨유CU',                    amount: 3200  },
];

function parseGoalFromResponse(text) {
  let jsonStr    = null;
  let beforeText = '';

  // 1순위: ``` 펜스 위치 기준으로 앞 텍스트 분리
  const fenceIdx = text.indexOf('```');
  if (fenceIdx !== -1) {
    beforeText = text.slice(0, fenceIdx)
      .split('\n')
      .filter(line => !/json|출력합니다|아래와\s*같이/i.test(line))
      .join('\n')
      .trim();
    const inner = text.slice(fenceIdx).match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (inner) jsonStr = inner[1];
  }

  // 2순위: 중괄호 매칭으로 직접 추출
  if (!jsonStr) {
    const braceIdx = text.indexOf('{');
    if (braceIdx !== -1) {
      let depth = 0, endIdx = -1;
      for (let i = braceIdx; i < text.length; i++) {
        if      (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
      }
      if (endIdx !== -1) {
        jsonStr = text.slice(braceIdx, endIdx + 1);
        if (!beforeText) beforeText = text.slice(0, braceIdx).trim();
      }
    }
  }

  if (!jsonStr) return { displayText: beforeText || text, goal: null };

  try {
    const goal = JSON.parse(jsonStr.trim());
    // 목표설정 에이전트: goalName / 트레이너챗봇 GOAL_CHANGE: name
    if (!goal.goalName && goal.name) goal.goalName = goal.name;
    if (!goal.goalName || !goal.targetAmount) throw new Error('missing fields');
    return { displayText: beforeText || `${goal.goalName} 목표를 설정했어요!`, goal };
  } catch {
    return { displayText: beforeText || text, goal: null };
  }
}

function isTravelGoal(text) {
  const TRAVEL_KEYWORDS = [
    '여행', '해외', '국내', '관광', '휴가', '배낭여행',
    '일본', '도쿄', '오사카', '교토', '후쿠오카', '삿포로', '나고야',
    '태국', '방콕', '파타야', '치앙마이',
    '베트남', '하노이', '호치민', '다낭',
    '유럽', '파리', '런던', '로마', '바르셀로나', '프라하', '암스테르담',
    '미국', '뉴욕', '엘에이', 'la', 'ny', '샌프란시스코', '라스베가스',
    '싱가포르', '홍콩', '대만', '타이페이',
    '호주', '시드니', '멜버른',
    '발리', '인도네시아',
    '필리핀', '세부', '보라카이',
    '제주', '부산', '강릉', '속초', '경주', '여수',
    '몰디브', '하와이', '괌', '사이판',
    '캐나다', '터키', '이스탄불', '스위스', '포르투갈', '리스본',
  ];
  const lower = text.toLowerCase();
  return TRAVEL_KEYWORDS.some(kw => lower.includes(kw));
}

function renderOnboardingScreen() {
  const screen = el('div', { class: 'screen ob-screen', id: 'screen-onboarding' });

  const TOTAL_STEPS = 5;
  let phase = 'goal'; // 'goal' | 'analysis' | 'steps'
  let step  = 1;

  let goalName        = '';
  let goalCategory    = '';
  let goalAiComment   = ''; // Dify가 반환한 한 줄 코멘트
  let analysisData    = null; // 소비 분석 결과
  let targetAmount    = 0;
  let monthlyExpenses = 0;
  let currentSavings  = 0;
  let timelineMonths  = 6;
  let selectedCharIdx = 0;
  let petName         = '';
  let userName        = '';


  const TARGET_PRESETS = {
    travel:   [500000, 1500000, 3000000, 5000000],
    vehicle:  [5000000, 10000000, 20000000, 30000000],
    housing:  [3000000, 10000000, 30000000, 50000000],
    shopping: [200000, 500000, 1500000, 3000000],
    other:    [500000, 1000000, 2500000, 5000000],
    default:  [300000, 800000, 2000000, 5000000],
  };

  const EXPENSE_PRESETS  = [500000, 800000, 1000000, 1200000, 1500000];
  const SAVINGS_PRESETS  = [
    { val: 0,       label: '없어요' },
    { val: 200000,  label: '20만원' },
    { val: 500000,  label: '50만원' },
    { val: 1000000, label: '100만원' },
  ];
  const TIMELINE_OPTIONS = [3, 6, 12, 18];

  /* 목표 채팅창 입력 요소 — showSavingsInput 등 외부 함수에서 접근 */
  let awaitingSavings   = false;
  let awaitingBudget    = false;
  let goalTextareaRef   = null;
  let goalSendBtnRef    = null;

  /* ─────── Dispatcher ─────── */
  function render() {
    screen.innerHTML = '';
    if      (phase === 'goal')        renderGoalPhase();
    else if (phase === 'card-connect') renderCardConnectPhase();
    else if (phase === 'analysis')    renderAnalysisPhase();
    else if (phase === 'timeline')    renderTimelinePhase();
    else if (phase === 'budget')      renderBudgetPhase();
    else if (phase === 'summary')     renderSummaryPhase();
    else if (phase === 'char-select') renderCharSelectPhase();
    else if (phase === 'char-name')   renderCharNamePhase();
    else if (phase === 'user-name')   renderUserNamePhase();
    else                              renderStepPhase(step);
  }

  /* ─────── Goal Phase — Dify AI 채팅 ─────── */
  function renderGoalPhase() {
    let conversationId    = '';
    let extractedGoal     = null;
    let isLoading         = false;
    let awaitingNights    = false;
    let pendingTravelText = '';

    /* Header */
    const header = el('div', { class: 'ob-chat-header' });
    header.innerHTML = '';
    screen.appendChild(header);

    /* Title */
    const titleWrap = el('div', { class: 'ob-chat-title-wrap' });
    titleWrap.innerHTML = `
      <div class="ob-step-label-small">STEP 1 : 목표 설정</div>
      <h2 class="ob-title">어떤 목표를<br>세울까요?</h2>
      <p class="ob-subtitle">자유롭게 알려주세요.<br>AI가 예산을 설계해드릴게요.</p>
    `;
    screen.appendChild(titleWrap);

    /* Chat body — 메시지 표시 영역 */
    const chatBody = el('div', { class: 'ob-chat-body', id: 'ob-chat-body' });
    appendChatMsg(chatBody, 'assistant', '안녕하세요! 어떤 걸 갖고 싶으신가요? 자유롭게 알려주세요!');
    screen.appendChild(chatBody);

    /* Input area */
    const inputWrap = el('div', { class: 'ob-chat-input-wrap' });
    inputWrap.innerHTML = `
      <div class="ob-chat-input-row">
        <textarea class="ob-chat-textarea" id="ob-goal-text" maxlength="116"
          placeholder="ex. 맥북 프로 사고 싶어요. 오사카 여행 가고 싶다..."></textarea>
        <button class="ob-chat-send-btn" id="ob-goal-send">→</button>
      </div>
      <div class="ob-chat-counter" id="ob-char-counter">0 / 116</div>
    `;
    screen.appendChild(inputWrap);


    /* ── Events ── */
    const textarea = screen.querySelector('#ob-goal-text');
    const counter  = screen.querySelector('#ob-char-counter');
    const sendBtn  = screen.querySelector('#ob-goal-send');
    goalTextareaRef = textarea;
    goalSendBtnRef  = sendBtn;

    textarea.addEventListener('input', () => {
      counter.textContent = `${textarea.value.length} / 116`;
    });

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    sendBtn.addEventListener('click', handleSend);

    async function sendToGoalDify(query) {
      const loadingEl = el('div', { class: 'ob-chat-loading' });
      loadingEl.innerHTML = '<span>·</span><span>·</span><span>·</span>';
      chatBody.appendChild(loadingEl);
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const data = await callDifyAPI(query, conversationId);
        conversationId = data.conversation_id || conversationId;
        loadingEl.remove();

        const parsed = parseGoalFromResponse(data.answer || '');
        appendChatMsg(chatBody, 'assistant', parsed.displayText);

        if (parsed.goal) {
          extractedGoal = parsed.goal;
          goalName      = parsed.goal.goalName;
          goalCategory  = 'other';
          goalAiComment = parsed.goal.aiComment || '';
          showPriceTierQuestion(chatBody, parsed.goal.targetAmount);
        }
      } catch (err) {
        loadingEl.remove();
        appendChatMsg(chatBody, 'assistant', '잠시 오류가 생겼어요. 다시 시도해주세요! 🙏');
        console.error('Dify error:', err);
      } finally {
        if (!extractedGoal) {
          textarea.disabled = false;
          sendBtn.disabled  = false;
        }
        isLoading = false;
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }

    function showNightsQuestion(body, originalText) {
      setTimeout(() => {
        appendChatMsg(body, 'assistant', '여행이군요! 몇 박 몇 일로 계획하고 있나요?');

        const group = el('div', { class: 'ob-analysis-btn-group' });

        function proceedWithTrip(label) {
          group.remove();
          appendChatMsg(body, 'user', label);
          sendToGoalDify(`${originalText} (${label} 기준)`);
        }

        ['1박 2일', '2박 3일', '3박 4일', '4박 5일'].forEach(label => {
          const btn = el('button', { class: 'ob-analysis-btn' });
          btn.textContent = label;
          btn.addEventListener('click', () => proceedWithTrip(label));
          group.appendChild(btn);
        });

        const customBtn = el('button', { class: 'ob-analysis-btn' });
        customBtn.textContent = '직접 입력';
        customBtn.addEventListener('click', () => {
          group.remove();
          pendingTravelText = originalText;
          awaitingNights = true;
          textarea.disabled = false;
          sendBtn.disabled  = false;
          textarea.placeholder = '예: 5박 7일';
          textarea.focus();
          body.scrollTop = body.scrollHeight;
        });
        group.appendChild(customBtn);

        body.appendChild(group);
        body.scrollTop = body.scrollHeight;
      }, 600);
    }

    async function handleSend() {
      const text = textarea.value.trim();
      if (!text || isLoading) {
        if (!text) { animateShake(textarea); showToast('목표를 입력해주세요!', 'warning'); }
        return;
      }

      if (awaitingSavings) {
        const val = parseInt(text.replace(/[^0-9]/g, ''));
        if (!val || val < 0) { showToast('금액을 숫자로 입력해주세요!', 'warning'); return; }
        awaitingSavings = false;
        textarea.value = '';
        textarea.placeholder = '';
        counter.textContent = '0 / 116';
        textarea.disabled = true;
        sendBtn.disabled  = true;
        currentSavings = val;
        timelineMonths = 6;
        appendChatMsg(chatBody, 'user', formatKRW(val));
        setTimeout(() => {
          appendChatMsg(chatBody, 'assistant', '반영했어요!');
          showMonthlyBudgetQuestion(chatBody);
        }, 400);
        return;
      }

      if (awaitingBudget) {
        const val = parseInt(text.replace(/[^0-9]/g, ''));
        if (!val || val < 0) { showToast('금액을 숫자로 입력해주세요!', 'warning'); return; }
        awaitingBudget = false;
        textarea.value = '';
        textarea.placeholder = '';
        counter.textContent = '0 / 116';
        textarea.disabled = true;
        sendBtn.disabled  = true;
        monthlyExpenses = val;
        appendChatMsg(chatBody, 'user', formatKRW(val));
        setTimeout(() => {
          appendChatMsg(chatBody, 'assistant', '좋아요! 이제 기간을 정해볼게요.');
          setTimeout(() => { phase = 'timeline'; render(); }, 1200);
        }, 400);
        return;
      }

      if (awaitingNights) {
        awaitingNights = false;
        textarea.value = '';
        textarea.placeholder = '';
        counter.textContent = '0 / 116';
        textarea.disabled = true;
        sendBtn.disabled  = true;
        isLoading = true;
        appendChatMsg(chatBody, 'user', text);
        await sendToGoalDify(`${pendingTravelText} (${text} 기준)`);
        return;
      }

      appendChatMsg(chatBody, 'user', text);
      textarea.value = '';
      textarea.placeholder = '';
      counter.textContent = '0 / 116';
      textarea.disabled = true;
      sendBtn.disabled  = true;
      isLoading = true;

      if (isTravelGoal(text) && !/\d+박/.test(text)) {
        isLoading = false;
        showNightsQuestion(chatBody, text);
        return;
      }

      await sendToGoalDify(text);
    }
  }

  function appendChatMsg(body, role, text) {
    const msg = el('div', { class: `ob-chat-msg ob-chat-msg-${role}` });
    const bubble = el('div', { class: 'ob-chat-bubble' });
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    if (role === 'assistant') {
      const icon = el('span', { class: 'ob-ai-icon', html: '' });
      msg.appendChild(icon);
    }
    msg.appendChild(bubble);
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }


  function showPriceTierQuestion(body, baseAmount) {
    const generousAmt = baseAmount;
    const midAmt      = Math.round(baseAmount * 0.86 / 10000) * 10000 || baseAmount;
    const cheapAmt    = Math.round(baseAmount * 0.72 / 10000) * 10000 || baseAmount;

    setTimeout(() => {
      appendChatMsg(body, 'assistant',
        `금액을 어떻게 설정할까요?\n\n여유롭게: ${formatKRW(generousAmt)}\n보통: ${formatKRW(midAmt)}\n최저가: ${formatKRW(cheapAmt)}`);

      const group = el('div', { class: 'ob-analysis-btn-group' });

      const tiers = [
        { label: `여유롭게 (${formatKRW(generousAmt)})`, val: generousAmt },
        { label: `보통 (${formatKRW(midAmt)})`,            val: midAmt      },
        { label: `최저가 (${formatKRW(cheapAmt)})`,       val: cheapAmt    },
      ];

      tiers.forEach(({ label, val }) => {
        const btn = el('button', { class: 'ob-analysis-btn' });
        btn.textContent = label;
        btn.addEventListener('click', () => {
          targetAmount = val;
          group.remove();
          appendChatMsg(body, 'user', label);
          showSavingsQuestion(body);
        });
        group.appendChild(btn);
      });

      body.appendChild(group);
      body.scrollTop = body.scrollHeight;
    }, 600);
  }

  function showSavingsQuestion(body) {
    setTimeout(() => {
      appendChatMsg(body, 'assistant', '혹시 이미 모아둔 돈이 있나요?');

      const group = el('div', { class: 'ob-analysis-btn-group' });

      const noBtn = el('button', { class: 'ob-analysis-btn' });
      noBtn.textContent = '없어요';
      noBtn.addEventListener('click', () => {
        currentSavings = 0;
        timelineMonths = 6;
        group.remove();
        appendChatMsg(body, 'user', '없어요');
        showMonthlyBudgetQuestion(body);
      });

      const yesBtn = el('button', { class: 'ob-analysis-btn' });
      yesBtn.textContent = '있어요';
      yesBtn.addEventListener('click', () => {
        group.remove();
        appendChatMsg(body, 'user', '있어요');
        showSavingsInput(body);
      });

      group.appendChild(noBtn);
      group.appendChild(yesBtn);
      body.appendChild(group);
      body.scrollTop = body.scrollHeight;
    }, 600);
  }

  function showSavingsInput(body) {
    setTimeout(() => {
      appendChatMsg(body, 'assistant', '얼마나 모아두셨나요?');

      const PRESETS = [
        { val: 100000,  label: '10만원' },
        { val: 300000,  label: '30만원' },
        { val: 500000,  label: '50만원' },
        { val: 1000000, label: '100만원' },
      ];

      const group = el('div', { class: 'ob-analysis-btn-group' });

      PRESETS.forEach(({ val, label }) => {
        const btn = el('button', { class: 'ob-analysis-btn' });
        btn.textContent = label;
        btn.addEventListener('click', () => {
          currentSavings = val;
          timelineMonths = 6;
          group.remove();
          appendChatMsg(body, 'user', label);
          setTimeout(() => {
            appendChatMsg(body, 'assistant', `${label} 반영했어요!`);
            showMonthlyBudgetQuestion(body);
          }, 400);
        });
        group.appendChild(btn);
      });

      const customBtn = el('button', { class: 'ob-analysis-btn' });
      customBtn.textContent = '직접 입력';
      customBtn.addEventListener('click', () => {
        group.remove();
        awaitingSavings = true;
        goalTextareaRef.disabled = false;
        goalSendBtnRef.disabled  = false;
        goalTextareaRef.placeholder = '금액 입력 (예: 150000)';
        goalTextareaRef.focus();
        body.scrollTop = body.scrollHeight;
      });
      group.appendChild(customBtn);
      body.appendChild(group);
      body.scrollTop = body.scrollHeight;
    }, 600);
  }

  function showMonthlyBudgetQuestion(body) {
    const PRESETS = [
      { val: 300000,  label: '30만원' },
      { val: 500000,  label: '50만원' },
      { val: 800000,  label: '80만원' },
      { val: 1000000, label: '100만원' },
      { val: 1500000, label: '150만원' },
    ];

    setTimeout(() => {
      appendChatMsg(body, 'assistant', '한 달 생활비가 얼마예요?');

      const group = el('div', { class: 'ob-analysis-btn-group' });

      function proceedWithBudget(val, label) {
        monthlyExpenses = val;
        group.remove();
        appendChatMsg(body, 'user', label);
        setTimeout(() => {
          appendChatMsg(body, 'assistant', '좋아요! 이제 기간을 정해볼게요.');
          setTimeout(() => { phase = 'timeline'; render(); }, 1200);
        }, 400);
      }

      PRESETS.forEach(({ val, label }) => {
        const btn = el('button', { class: 'ob-analysis-btn' });
        btn.textContent = label;
        btn.addEventListener('click', () => proceedWithBudget(val, label));
        group.appendChild(btn);
      });

      const customBtn = el('button', { class: 'ob-analysis-btn' });
      customBtn.textContent = '직접 입력';
      customBtn.addEventListener('click', () => {
        group.remove();
        awaitingBudget = true;
        goalTextareaRef.disabled = false;
        goalSendBtnRef.disabled  = false;
        goalTextareaRef.placeholder = '금액 입력 (예: 1200000)';
        goalTextareaRef.focus();
        body.scrollTop = body.scrollHeight;
      });
      group.appendChild(customBtn);

      body.appendChild(group);
      body.scrollTop = body.scrollHeight;
    }, 600);
  }

  /* ─────── Card Connect Phase — 카드 연동 ─────── */
  function renderCardConnectPhase() {
    const CARDS = [
      { id: 'hyundai', name: '현대카드',  color: '#1a1a1a', text: '#fff'    },
      { id: 'samsung', name: '삼성카드',  color: '#1254a1', text: '#fff'    },
      { id: 'kb',      name: 'KB국민카드', color: '#ffbc00', text: '#1a1a1a' },
      { id: 'shinhan', name: '신한카드',  color: '#0046ff', text: '#fff'    },
      { id: 'lotte',   name: '롯데카드',  color: '#e60012', text: '#fff'    },
      { id: 'woori',   name: '우리카드',  color: '#006bb4', text: '#fff'    },
      { id: 'hana',    name: '하나카드',  color: '#009e6c', text: '#fff'    },
      { id: 'nh',      name: 'NH농협카드', color: '#00843d', text: '#fff'    },
    ];

    let subPhase    = 'select'; // 'select' | 'auth' | 'loading' | 'preview'
    let selectedCard = null;
    let otpSent      = false;
    let timerRef     = null;

    const wrap = el('div', { class: 'ob-card-connect-wrap' });
    screen.appendChild(wrap);

    function renderSub() {
      wrap.innerHTML = '';

      /* ── 상단 스텝 인디케이터 ── */
      const steps = [
        { label: '카드사 선택', active: subPhase === 'select' },
        { label: '본인 인증',   active: subPhase === 'auth'   },
        { label: '데이터 연동', active: subPhase === 'loading' || subPhase === 'preview' },
      ];
      const stepBar = el('div', { class: 'ob-cc-stepbar' });
      steps.forEach((s, i) => {
        const step = el('div', { class: `ob-cc-step${s.active ? ' active' : (i < steps.findIndex(x=>x.active) ? ' done' : '')}` });
        step.innerHTML = `<span class="ob-cc-step-num">${i+1}</span><span class="ob-cc-step-label">${s.label}</span>`;
        stepBar.appendChild(step);
        if (i < steps.length - 1) {
          const sep = el('div', { class: 'ob-cc-step-sep' });
          stepBar.appendChild(sep);
        }
      });
      wrap.appendChild(stepBar);

      if (subPhase === 'select') renderSelect();
      else if (subPhase === 'auth') renderAuth();
      else if (subPhase === 'loading') renderLoading();
      else if (subPhase === 'preview') renderPreview();
    }

    function renderSelect() {
      const title = el('div', { class: 'ob-cc-title' });
      title.innerHTML = `<div class="ob-section-title">카드사를 선택해주세요</div>
        <div class="ob-section-hint">최근 3개월 거래내역을 불러올게요</div>`;
      wrap.appendChild(title);

      const grid = el('div', { class: 'ob-cc-card-grid' });
      CARDS.forEach(c => {
        const btn = el('button', { class: `ob-cc-card-btn${selectedCard?.id === c.id ? ' selected' : ''}` });
        btn.style.cssText = `background:${c.color};color:${c.text}`;
        btn.innerHTML = `<span class="ob-cc-card-name">${c.name}</span>`;
        btn.addEventListener('click', () => {
          selectedCard = c;
          renderSub();
        });
        grid.appendChild(btn);
      });
      wrap.appendChild(grid);

      const nextBtn = el('button', { class: 'ob-next-btn', style: `margin-top:16px;opacity:${selectedCard ? 1 : 0.4};pointer-events:${selectedCard ? 'auto' : 'none'}` });
      nextBtn.textContent = '▶ 다음 ◀';
      nextBtn.addEventListener('click', () => { subPhase = 'auth'; renderSub(); });
      wrap.appendChild(nextBtn);
    }

    function renderAuth() {
      const title = el('div', { class: 'ob-cc-title' });
      title.innerHTML = `<div class="ob-section-title">${selectedCard.name} 본인 인증</div>
        <div class="ob-section-hint">간편 인증으로 안전하게 연결해요</div>`;
      wrap.appendChild(title);

      const phoneWrap = el('div', { class: 'ob-cc-auth-box' });
      phoneWrap.innerHTML = `
        <label class="ob-cc-label">휴대폰 번호</label>
        <div class="ob-cc-input-row">
          <input class="ob-input" id="cc-phone" type="tel" placeholder="010-0000-0000" maxlength="13"/>
          <button class="ob-cc-send-btn" id="cc-send-btn">인증번호 받기</button>
        </div>
        <div id="cc-otp-wrap" style="display:none;margin-top:12px">
          <label class="ob-cc-label">인증번호 <span id="cc-timer" style="color:var(--red);margin-left:8px"></span></label>
          <input class="ob-input" id="cc-otp" type="number" placeholder="6자리 입력" maxlength="6"/>
        </div>
      `;
      wrap.appendChild(phoneWrap);

      const confirmBtn = el('button', { class: 'ob-next-btn', style: 'margin-top:16px;display:none', id: 'cc-confirm-btn' });
      confirmBtn.textContent = '▶ 확인 ◀';
      confirmBtn.addEventListener('click', () => { subPhase = 'loading'; renderSub(); });
      wrap.appendChild(confirmBtn);

      // 전화번호 자동 포맷
      const phoneInput = wrap.querySelector('#cc-phone');
      phoneInput.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g,'');
        if (v.length > 3 && v.length <= 7) v = v.slice(0,3)+'-'+v.slice(3);
        else if (v.length > 7) v = v.slice(0,3)+'-'+v.slice(3,7)+'-'+v.slice(7,11);
        e.target.value = v;
      });

      // 인증번호 받기
      wrap.querySelector('#cc-send-btn').addEventListener('click', () => {
        const phone = wrap.querySelector('#cc-phone').value.replace(/\D/g,'');
        if (phone.length < 10) { animateShake(wrap.querySelector('#cc-phone')); return; }
        otpSent = true;
        wrap.querySelector('#cc-otp-wrap').style.display = 'block';
        wrap.querySelector('#cc-confirm-btn').style.display = 'block';
        wrap.querySelector('#cc-send-btn').textContent = '재발송';
        wrap.querySelector('#cc-send-btn').disabled = true;
        // 30초 타이머
        let t = 30;
        const timerEl = wrap.querySelector('#cc-timer');
        timerEl.textContent = `(${t}초)`;
        if (timerRef) clearInterval(timerRef);
        timerRef = setInterval(() => {
          t--;
          if (t <= 0) {
            clearInterval(timerRef);
            timerEl.textContent = '';
            wrap.querySelector('#cc-send-btn').disabled = false;
          } else timerEl.textContent = `(${t}초)`;
        }, 1000);
      });
    }

    function renderLoading() {
      if (timerRef) clearInterval(timerRef);
      const cardName = selectedCard?.name || '카드사';

      const loadBox = el('div', { class: 'ob-cc-loading-box' });
      loadBox.innerHTML = `
        <div class="ob-cc-load-icon">🔗</div>
        <div class="ob-cc-load-title" id="cc-load-title">${cardName} 서버에 접속하고 있어요...</div>
        <div class="ob-cc-load-bar-bg"><div class="ob-cc-load-bar" id="cc-load-bar" style="width:0%"></div></div>
        <div class="ob-cc-load-sub" id="cc-load-sub">잠시만 기다려주세요</div>
      `;
      wrap.appendChild(loadBox);

      const steps = [
        { pct: 20, title: `${cardName} 서버에 접속하고 있어요...`,     sub: '보안 연결 중' },
        { pct: 45, title: '최근 3개월 거래내역 조회 중...',             sub: '데이터를 안전하게 가져오고 있어요' },
        { pct: 70, title: `${CARD_EXPENSES.length}건의 거래내역 발견!`, sub: '소비 패턴을 파악하고 있어요' },
        { pct: 90, title: 'AI 분석을 준비하고 있어요...',               sub: '거의 다 됐어요!' },
        { pct: 100, title: '연동 완료!',                                sub: '분석을 시작할게요 🎉' },
      ];

      let i = 0;
      const barEl   = wrap.querySelector('#cc-load-bar');
      const titleEl = wrap.querySelector('#cc-load-title');
      const subEl   = wrap.querySelector('#cc-load-sub');

      function nextStep() {
        if (i >= steps.length) {
          setTimeout(() => { subPhase = 'preview'; renderSub(); }, 600);
          return;
        }
        const s = steps[i++];
        barEl.style.width = s.pct + '%';
        titleEl.textContent = s.title;
        subEl.textContent   = s.sub;
        setTimeout(nextStep, 900);
      }
      setTimeout(nextStep, 400);
    }

    function renderPreview() {
      const title = el('div', { class: 'ob-cc-title' });
      title.innerHTML = `<div class="ob-section-title">거래내역을 불러왔어요!</div>
        <div class="ob-section-hint">총 ${CARD_EXPENSES.length}건 · 최근 3개월</div>`;
      wrap.appendChild(title);

      const previewList = el('div', { class: 'ob-cc-preview-list' });
      CARD_EXPENSES.slice(0, 6).forEach(e => {
        const row = el('div', { class: 'ob-cc-preview-row' });
        row.innerHTML = `
          <span class="ob-cc-preview-merchant">${e.merchant}</span>
          <span class="ob-cc-preview-date">${e.date}</span>
          <span class="ob-cc-preview-amount">${e.amount.toLocaleString()}원</span>
        `;
        previewList.appendChild(row);
      });
      const more = el('div', { class: 'ob-cc-preview-more' });
      more.textContent = `외 ${CARD_EXPENSES.length - 6}건 더보기`;
      previewList.appendChild(more);
      wrap.appendChild(previewList);

      const nextBtn = el('button', { class: 'ob-next-btn', style: 'margin-top:16px' });
      nextBtn.textContent = '▶ AI 분석 시작하기 ◀';
      nextBtn.addEventListener('click', () => { phase = 'analysis'; render(); });
      wrap.appendChild(nextBtn);
    }

    renderSub();
  }

  /* ─────── Analysis Phase — 소비 분석 ─────── */
  function renderAnalysisPhase() {
    let analysisConvId = '';
    let isAnalyzing    = false;
    let loadStep       = 0;

    /* Header */
    const header = el('div', { class: 'ob-chat-header' });
    header.innerHTML = '';
    screen.appendChild(header);

    /* Topbar with back button */
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'summary'; render(); });
    topBar.appendChild(backBtn);
    const skipBtn = el('button', { class: 'ob-back-btn', style: 'margin-left:auto;font-size:11px;opacity:0.4;' });
    skipBtn.textContent = '건너뛰기';
    skipBtn.addEventListener('click', () => { phase = 'char-select'; render(); });
    topBar.appendChild(skipBtn);
    screen.appendChild(topBar);

    /* Title */
    const titleWrap = el('div', { class: 'ob-chat-title-wrap' });
    titleWrap.innerHTML = `
      <div class="ob-step-label-small">STEP 2 : 소비 분석</div>
      <h2 class="ob-title">소비 데이터를<br>분석할게요</h2>
    `;
    screen.appendChild(titleWrap);

    /* 로딩 화면 */
    const loadingWrap = el('div', { class: 'ob-analysis-loading', id: 'ob-analysis-loading' });
    loadingWrap.innerHTML = `
      <div class="ob-analysis-loading-bar"><div class="ob-analysis-bar-fill" id="ob-bar-fill"></div></div>
      <div class="ob-analysis-steps" id="ob-analysis-steps">
        <div class="ob-analysis-step pending" id="aStep0">💳 금융 데이터 불러오는 중...</div>
        <div class="ob-analysis-step pending" id="aStep1">🗂️ 카테고리 분류 중...</div>
        <div class="ob-analysis-step pending" id="aStep2">🔍 이상치 감지 중...</div>
      </div>
    `;
    screen.appendChild(loadingWrap);

    /* Chat body (Q&A — 로딩 후 노출) */
    const chatBody = el('div', { class: 'ob-chat-body', id: 'ob-analysis-chat', style: 'display:none' });
    screen.appendChild(chatBody);


    /* ── 로딩 애니메이션 후 Dify 호출 ── */
    const LOAD_STEPS = ['aStep0', 'aStep1', 'aStep2'];
    const BAR_TARGETS = [33, 66, 90];

    function activateLoadStep(idx) {
      const el_ = document.getElementById(LOAD_STEPS[idx]);
      if (el_) el_.className = 'ob-analysis-step active';
      const bar = document.getElementById('ob-bar-fill');
      if (bar) bar.style.width = BAR_TARGETS[idx] + '%';
    }

    function completeLoadStep(idx) {
      const el_ = document.getElementById(LOAD_STEPS[idx]);
      if (el_) el_.className = 'ob-analysis-step done';
    }

    activateLoadStep(0);
    setTimeout(() => {
      completeLoadStep(0); activateLoadStep(1);
      setTimeout(() => {
        completeLoadStep(1); activateLoadStep(2);
        setTimeout(() => {
          completeLoadStep(2);
          const bar = document.getElementById('ob-bar-fill');
          if (bar) bar.style.width = '100%';
          /* 로딩 완료 → Dify 호출 */
          setTimeout(() => startAnalysis(), 600);
        }, 1200);
      }, 1200);
    }, 1200);

    async function startAnalysis() {
      const loadEl = document.getElementById('ob-analysis-loading');
      const chatEl = document.getElementById('ob-analysis-chat');
      if (loadEl) loadEl.style.display = 'none';
      if (chatEl) chatEl.style.display = 'block';

      const total       = CARD_EXPENSES.reduce((s, e) => s + e.amount, 0);
      const monthTarget = Math.ceil((targetAmount - currentSavings) / (timelineMonths || 12));
      const expList     = CARD_EXPENSES.map(e => `${e.date} | ${e.merchant} | ${e.amount.toLocaleString()}원`).join('\n');
      const avgAmount   = Math.round(total / CARD_EXPENSES.length);
      const firstMsg    = `[소비 분석 요청]
월별 저축 목표: ${monthTarget.toLocaleString()}원
총 카드 소비: ${total.toLocaleString()}원
건당 평균 소비: ${avgAmount.toLocaleString()}원

[이상치 판단 기준 — 아래 규칙을 반드시 따를 것]
질문 가능한 카테고리는 오직 두 가지뿐입니다:
1. 식비(음식점, 배달, 치킨, 한식, 일식 등): 단건 4만원 이상인 경우
2. 카페(스타벅스, 카페, 커피 등): 단건 3만원 이상인 경우

질문 금지 카테고리 (아래 항목은 금액과 무관하게 절대 질문하지 않음):
- 쇼핑/의류: 유니클로, 에프알엘코리아, 무신사, 지그재그, 올리브영, 다이소 등 모든 쇼핑 항목
- 교통: KTX, 버스, 지하철, 택시, 티머니, 철도승차권 등
- 문화/엔터: CGV, 메가박스, 롯데시네마 등 영화관
- 간편결제: 네이버페이, 카카오페이, 토스페이 등
- 기타 모든 카테고리

→ 질문 템플릿(식비·카페만): "{merchant}에서 {amount}원 결제가 있어요. 혼자 드셨나요, 여럿이서 함께 드셨나요?"
- 이상치 질문은 최대 2건, 반드시 식비·카페에서만 선택

소비 내역:
${expList}`;

      const loadingEl = el('div', { class: 'ob-chat-loading' });
      loadingEl.innerHTML = '<span>·</span><span>·</span><span>·</span>';
      chatBody.appendChild(loadingEl);

      try {
        const data     = await callDifyAPI(firstMsg, '', DIFY_ANALYSIS_API_KEY);
        analysisConvId = data.conversation_id || '';
        loadingEl.remove();

        const parsed = parseAnalysisFromResponse(data.answer || '');
        appendChatMsg(chatBody, 'assistant', parsed.displayText);

        if (parsed.result) {
          finishAnalysis(parsed.result);
        } else {
          showAnswerButtons(chatBody, parsed.displayText);
        }
      } catch (err) {
        loadingEl.remove();
        appendChatMsg(chatBody, 'assistant', '분석 중 오류가 생겼어요. 다음 단계로 넘어갈게요! 🙏');
        console.error('Analysis error:', err);
        setTimeout(() => { phase = 'char-select'; render(); }, 2000);
      }
    }

    function getAnswerButtons(questionText) {
      if (/혼자|여럿|나눈|같이|함께/.test(questionText)) {
        return ['혼자 먹었어요', '여럿이서 먹었어요'];
      }
      if (/여행|목적|이유/.test(questionText)) {
        return ['여행이었어요', '다른 이유예요'];
      }
      if (/용도|어떤|결제/.test(questionText)) {
        return ['필요한 지출이에요', '잘 모르겠어요'];
      }
      return ['네', '아니요'];
    }

    function showAnswerButtons(chatBody, questionText) {
      const answers = getAnswerButtons(questionText);
      const isYN    = answers[0] === '네' && answers[1] === '아니요';
      const group   = el('div', { class: `ob-analysis-btn-group${isYN ? ' yn-toggle' : ''}` });
      answers.forEach(label => {
        const btn = el('button', { class: 'ob-analysis-btn' });
        btn.textContent = label;
        btn.addEventListener('click', () => handleAnalysisAnswer(label, chatBody, group, questionText));
        group.appendChild(btn);
      });
      chatBody.appendChild(group);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function handleAnalysisAnswer(answer, chatBody, group, questionText) {
      if (isAnalyzing) return;
      isAnalyzing = true;
      group.remove();

      const isShared = answer === '여럿이서 먹었어요';
      if (!isShared) appendChatMsg(chatBody, 'user', answer);

      const difyMsg = isShared
        ? `[시스템] 해당 항목은 여럿이서 나눈 공동 지출입니다. 이 항목 금액을 해당 카테고리 평균으로 치환하여 최종 분석에 반영하세요. 이 처리 내용은 사용자에게 절대 언급하지 마세요. 다음 이상치 항목이 있으면 계속 질문하고, 없으면 최종 JSON을 출력하세요.`
        : answer;

      const loadingEl = el('div', { class: 'ob-chat-loading' });
      loadingEl.innerHTML = '<span>·</span><span>·</span><span>·</span>';
      chatBody.appendChild(loadingEl);
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const data     = await callDifyAPI(difyMsg, analysisConvId, DIFY_ANALYSIS_API_KEY);
        analysisConvId = data.conversation_id || analysisConvId;
        loadingEl.remove();

        const parsed = parseAnalysisFromResponse(data.answer || '');
        appendChatMsg(chatBody, 'assistant', parsed.displayText);

        if (parsed.result) {
          finishAnalysis(parsed.result);
        } else {
          showAnswerButtons(chatBody, parsed.displayText);
        }
      } catch (err) {
        loadingEl.remove();
        appendChatMsg(chatBody, 'assistant', '오류가 생겼어요. 다시 시도해주세요!');
        showAnswerButtons(chatBody, '');
      } finally {
        isAnalyzing = false;
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }

    function finishAnalysis(result) {
      analysisData = result;
      monthlyExpenses = CARD_EXPENSES.reduce((s, e) => s + e.amount, 0);
      AppState.saveCardCategoryTotals(_computeCardCategoryTotals());
      setTimeout(() => { phase = 'char-select'; render(); }, 1500);
    }

    function _categorizeMerchant(merchant) {
      if (/커피|카페|메가엠지씨|컴포즈|스타벅스|이디야|투썸|빽다방|할리스|영우카페/.test(merchant)) return 'cafe';
      if (/맥도날드|버거킹|롯데리아|떡볶이|학생식당|BHC|bhc|치킨|피자|배달의민족|쿠팡이츠|요기요|편의점|씨유|CU|GS25|회식|동아리/.test(merchant)) return 'food';
      if (/철도|기차|버스|지하철|택시|카카오T|T머니|KTX|에어비앤비/.test(merchant)) return 'transport';
      if (/CGV|cgv|롯데시네마|메가박스|넷플릭스|스팀|Steam|왓챠|카카오게임|인터파크|예스24|노래방|방탈출/.test(merchant)) return 'entertain';
      if (/무신사|유니클로|올리브영|다이소|쿠팡|이마트|쇼핑|H&M|ZARA|자라|에이블리|지그재그/.test(merchant)) return 'shopping';
      return 'etc';
    }

    function _computeCardCategoryTotals() {
      const raw = {};
      CARD_EXPENSES.forEach(({ merchant, amount }) => {
        const cat = _categorizeMerchant(merchant);
        raw[cat] = (raw[cat] || 0) + amount;
      });
      return { ...raw };
    }
  }

  function parseAnalysisFromResponse(text) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return { displayText: text, result: null };
    try {
      const result      = JSON.parse(match[1]);
      const displayText = text.replace(/```json[\s\S]*?```/, '').trim();
      return { displayText: displayText || '분석이 완료됐어요!', result };
    } catch {
      return { displayText: text, result: null };
    }
  }

  /* ─────── Step Shell ─────── */
  function renderStepPhase(s) {
    screen.innerHTML = '';

    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => {
      if      (s > 2)  { step--; }
      else if (s === 2) { phase = 'analysis'; }
      else              { phase = 'goal'; }
      render();
    });
    topBar.appendChild(backBtn);

    /* Pixel block progress bar — 10칸 */
    const BLOCKS = 10;
    const filled = Math.round((s / TOTAL_STEPS) * BLOCKS);
    const progressEl = el('div', { class: 'ob-px-progress' });
    for (let i = 0; i < BLOCKS; i++) {
      progressEl.appendChild(el('div', { class: `ob-px-block${i < filled ? ' filled' : ''}` }));
    }
    topBar.appendChild(progressEl);
    topBar.appendChild(el('div', { class: 'ob-step-label', html: `${s}/${TOTAL_STEPS}` }));
    screen.appendChild(topBar);

    const body   = el('div', { class: 'ob-body' });
    const footer = el('div', { class: 'ob-footer' });
    screen.appendChild(body);
    screen.appendChild(footer);

    if      (s === 1) renderStep1(body, footer);
    else if (s === 2) renderStep2(body, footer);
    else if (s === 3) renderStep3(body, footer);
    else if (s === 4) renderStep4(body, footer);
    else if (s === 5) renderStep5(body, footer);
  }

  /* ─────── Step 1 : AI 분석 + 목표 금액 선택 ─────── */
  function renderStep1(body, footer) {
    const cat     = goalCategory || 'other';
    const presets = TARGET_PRESETS[cat] || TARGET_PRESETS.default;
    const base    = targetAmount || presets[Math.floor(presets.length / 2)];

    const recDisc = Math.round(base * 0.88 / 10000) * 10000;
    const cheap   = Math.round(base * 0.72 / 10000) * 10000;
    const extra   = Math.round(base * 0.06 / 10000) * 10000;

    /* pill helper */
    function mkPill(text, green) {
      const bg = green ? 'var(--green)' : 'var(--accent)';
      return `<span style="display:inline-block;padding:2px 8px;background:${bg};color:var(--white);font-family:'DungGeunMo',monospace;font-size:13px;">${text}</span>`;
    }

    /* AI 버블 텍스트 — Dify aiComment 우선, 없으면 기본 텍스트
       goalName은 사용자 입력, goalAiComment는 Dify 응답이므로 둘 다 escape */
    const safeGoalName = escapeHTML(goalName);
    const defaultAiTexts = {
      other:    `${safeGoalName}은(는) 보통 ${mkPill(formatKRWShort(base))} 정도예요. 할인이나 리퍼 제품을 이용하면 ${mkPill(formatKRWShort(recDisc), true)}까지 줄일 수 있어요.`,
      travel:   `${safeGoalName} 여행은 보통 ${mkPill(formatKRWShort(base))} 정도 필요해요. 얼리버드 항공권을 미리 예약하면 ${mkPill(formatKRWShort(recDisc), true)}도 가능해요.`,
      vehicle:  `${safeGoalName} 구입은 보통 ${mkPill(formatKRWShort(base))} 정도예요. 인증 중고차라면 ${mkPill(formatKRWShort(recDisc), true)}까지 가능해요.`,
      housing:  `${safeGoalName}은(는) 지역마다 달라요. 평균 ${mkPill(formatKRWShort(base))} 정도이고, 공공임대 활용 시 ${mkPill(formatKRWShort(recDisc), true)}도 가능해요.`,
      shopping: `${safeGoalName}은(는) 보통 ${mkPill(formatKRWShort(base))} 정도예요. 세일 기간이나 중고를 활용하면 ${mkPill(formatKRWShort(recDisc), true)}도 가능해요.`,
    };
    const aiTexts = { [cat]: escapeHTML(goalAiComment) || defaultAiTexts[cat] || defaultAiTexts.other };

    /* BCard 라벨 */
    const cardLabels = {
      other:    ['예상 가격', '할인가', '중고/리퍼', '추가 비용'],
      travel:   ['항공+숙박', '얼리버드', '배낭여행', '현지 경비'],
      vehicle:  ['신차 가격', '인증 중고', '일반 중고', '취득세+보험'],
      housing:  ['평균 비용', '공공임대', '쉐어하우스', '이사 비용'],
      shopping: ['정가', '할인가', '중고가', '악세서리'],
    };
    const labels = cardLabels[cat] || cardLabels.other;
    const bcards = [
      { label: labels[0], amount: base,    hl: true  },
      { label: labels[1], amount: recDisc, hl: false },
      { label: labels[2], amount: cheap,   hl: false },
      { label: labels[3], amount: extra,   hl: false },
    ];

    /* 선택 옵션 */
    const options = [
      { amount: recDisc, tag: '추천' },
      { amount: base,    tag: '여유롭게' },
      { amount: cheap,   tag: '알뜰하게' },
    ];
    if (!options.map(o => o.amount).includes(targetAmount)) targetAmount = recDisc;

    body.innerHTML = `
      <div class="ob-ai-bubble">
        <div class="ob-ai-header">다람쥐 AI</div>
        <div class="ob-ai-body">${aiTexts[cat] || aiTexts.other}</div>
      </div>
      <div class="ob-bcard-grid">
        ${bcards.map(c => `
          <div class="ob-bcard ${c.hl ? 'ob-bcard-hl' : ''}">
            <div class="ob-bcard-label">${c.label}</div>
            <div class="ob-bcard-amount"><strong>${Math.round(c.amount / 10000)}</strong><span class="ob-bcard-unit"> 만원</span></div>
          </div>
        `).join('')}
      </div>
      <div class="ob-section-title">예산을 정해볼까요?</div>
      <div class="ob-section-hint">금액을 조정할 수 있어요</div>
      <div class="ob-option-list">
        ${options.map(opt => `
          <div class="ob-option-card ${targetAmount === opt.amount ? 'active' : ''}" data-val="${opt.amount}">
            <span class="ob-option-amount">${Math.round(opt.amount / 10000)}만원</span>
            <span class="ob-option-tag">${opt.tag}</span>
          </div>
        `).join('')}
      </div>
    `;

    body.querySelectorAll('.ob-option-card').forEach(card => {
      card.addEventListener('click', () => {
        targetAmount = parseInt(card.dataset.val);
        body.querySelectorAll('.ob-option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    const btn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => {
      if (!targetAmount) { showToast('예산을 선택해주세요!', 'warning'); return; }
      phase = 'analysis'; render();
    });
    footer.appendChild(btn);
  }

  /* ─────── Step 2 : Monthly expenses ─────── */
  function renderStep2(body, footer) {
    body.innerHTML = `
      <h1 class="ob-title">한 달 생활비가<br>얼마예요?</h1>
      <p class="ob-subtitle">식비, 교통비, 공과금 등<br>한 달에 쓰는 총 생활비를 알려주세요.</p>
      <div class="ob-budget-box">
        <div class="ob-budget-box-label">MONTHLY BUDGET</div>
        <div class="ob-budget-box-amount" id="ob-expense-display">${monthlyExpenses ? formatKRW(monthlyExpenses) : '0원'}</div>
      </div>
      <div class="ob-preset-grid">
        ${EXPENSE_PRESETS.map(p => `
          <button class="ob-preset-btn ${monthlyExpenses === p ? 'active' : ''}" data-val="${p}">${formatKRWShort(p)}</button>
        `).join('')}
        <button class="ob-preset-btn ob-custom-btn ${monthlyExpenses && !EXPENSE_PRESETS.includes(monthlyExpenses) ? 'active' : ''}">직접 입력</button>
      </div>
      <div id="ob-custom-wrap" style="display:${monthlyExpenses && !EXPENSE_PRESETS.includes(monthlyExpenses) ? 'block' : 'none'};margin-top:8px">
        <input class="ob-input" id="ob-expense-custom" type="number" placeholder="금액 직접 입력 (원)" step="10000" value="${monthlyExpenses && !EXPENSE_PRESETS.includes(monthlyExpenses) ? monthlyExpenses : ''}"/>
      </div>
    `;

    body.querySelectorAll('.ob-preset-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        monthlyExpenses = parseInt(btn.dataset.val);
        body.querySelectorAll('.ob-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        body.querySelector('#ob-expense-display').textContent = formatKRW(monthlyExpenses);
        body.querySelector('#ob-custom-wrap').style.display = 'none';
      });
    });

    body.querySelector('.ob-custom-btn').addEventListener('click', () => {
      body.querySelectorAll('.ob-preset-btn').forEach(b => b.classList.remove('active'));
      body.querySelector('.ob-custom-btn').classList.add('active');
      body.querySelector('#ob-custom-wrap').style.display = 'block';
      body.querySelector('#ob-expense-custom')?.focus();
    });

    body.querySelector('#ob-expense-custom')?.addEventListener('input', e => {
      monthlyExpenses = parseInt(e.target.value || '0');
      body.querySelector('#ob-expense-display').textContent = monthlyExpenses > 0 ? formatKRW(monthlyExpenses) : '0원';
    });

    const btn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => {
      if (!monthlyExpenses) { showToast('생활비를 선택해주세요!', 'warning'); return; }
      step = 3; render();
    });
    footer.appendChild(btn);
  }

  /* ─────── Step 3 : Current savings ─────── */
  function renderStep3(body, footer) {
    body.innerHTML = `
      <h1 class="ob-title">지금 모아둔<br>돈이 있나요?</h1>
      <p class="ob-subtitle">이미 모아둔 금액이 있다면<br>목표 달성이 더 빨라져요!</p>
      <div class="ob-savings-list">
        ${SAVINGS_PRESETS.map(p => {
          const delta   = p.val > 0 ? `<span class="ob-savings-delta">${p.val >= targetAmount ? '이미 목표를 달성했습니다!' : `${formatKRW(targetAmount)} → ${formatKRW(targetAmount - p.val)}`}</span>` : '';
          const isActive = currentSavings === p.val;
          return `
            <div class="ob-savings-item ${isActive ? 'active' : ''}" data-val="${p.val}">
              <span class="ob-savings-label">${p.label}</span>
              ${delta}
            </div>
          `;
        }).join('')}
        <div class="ob-savings-item" id="ob-savings-custom-row">
          <input id="ob-savings-custom" type="number" placeholder="직접 입력" step="10000" style="background:none;border:none;outline:none;font-family:inherit;font-size:inherit;color:inherit;flex:1;min-width:0;"/>
          <span class="ob-savings-delta" id="ob-savings-custom-delta"></span>
        </div>
      </div>
    `;

    body.querySelectorAll('.ob-savings-item[data-val]').forEach(item => {
      item.addEventListener('click', () => {
        currentSavings = parseInt(item.dataset.val);
        body.querySelectorAll('.ob-savings-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    const customInput = body.querySelector('#ob-savings-custom');
    const customRow   = body.querySelector('#ob-savings-custom-row');
    const customDelta = body.querySelector('#ob-savings-custom-delta');

    customInput.addEventListener('focus', () => {
      body.querySelectorAll('.ob-savings-item').forEach(i => i.classList.remove('active'));
      customRow.classList.add('active');
    });

    customInput.addEventListener('input', e => {
      const val = parseInt(e.target.value || '0');
      currentSavings = val;
      customDelta.textContent = val > 0 ? (val >= targetAmount ? '이미 목표를 달성했습니다!' : `${formatKRW(targetAmount)} → ${formatKRW(targetAmount - val)}`) : '';
    });

    const btn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => { step = 4; render(); });
    footer.appendChild(btn);
  }

  /* ─────── Timeline Phase (분석 후 기간 선택) ─────── */
  function renderTimelinePhase() {
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'analysis'; render(); });
    topBar.appendChild(backBtn);
    screen.appendChild(topBar);

    const body   = el('div', { class: 'ob-body' });
    const footer = el('div', { class: 'ob-footer' });
    screen.appendChild(body);
    screen.appendChild(footer);

    const remaining = Math.max(0, targetAmount - currentSavings);
    const cur = timelineMonths || 6;

    function monthLabel(m) {
      return m < 12 ? `${m}개월` : m === 12 ? '1년' : m === 24 ? '2년' : `1년 ${m - 12}개월`;
    }

    body.innerHTML = `
      <h1 class="ob-title">언제까지<br>모을 건가요?</h1>
      <p class="ob-subtitle">남은 금액 <strong>${formatKRW(remaining)}</strong>을<br>몇 개월 안에 모을까요?</p>
      <div class="ob-slider-display">
        <div class="ob-slider-period" id="ob-slider-period">${monthLabel(cur)}</div>
        <div class="ob-slider-monthly" id="ob-slider-monthly">월 ${formatKRW(Math.ceil(remaining / cur))} 저축</div>
      </div>
      <div class="ob-slider-wrap">
        <input type="range" class="ob-range" id="ob-timeline-range" min="1" max="24" value="${cur}" step="1">
        <div class="ob-slider-ticks">
          <span>1개월</span><span>6개월</span><span>12개월</span><span>18개월</span><span>24개월</span>
        </div>
      </div>
      <div id="ob-timeline-advice" class="ob-timeline-advice" style="display:none"></div>
    `;

    let adviceReqId = 0;
    let debounceTimer = null;

    async function fetchAdvice() {
      const reqId    = ++adviceReqId;
      const adviceEl = body.querySelector('#ob-timeline-advice');
      if (!adviceEl) return;
      adviceEl.style.display = 'block';
      adviceEl.innerHTML = '<span class="ob-advice-dots"><span>·</span><span>·</span><span>·</span></span>';
      const monthly = Math.ceil(remaining / timelineMonths);
      const label   = monthLabel(timelineMonths);
      const msg = `[타임라인 조언 요청]\n아래 정보를 바탕으로 사용자가 선택한 기간이 현실적인지 2문장 이내로 솔직하고 친근하게 조언해주세요. JSON 출력 금지. 이모지 1개 포함.\n\n목표 금액: ${formatKRW(targetAmount)}\n현재 보유: ${formatKRW(currentSavings)}\n월 생활비: ${formatKRW(monthlyExpenses)}\n선택 기간: ${label}\n월 필요 저축액: ${formatKRW(monthly)}`;
      try {
        const data = await callDifyAPI(msg, '', DIFY_ANALYSIS_API_KEY);
        if (reqId !== adviceReqId) return;
        adviceEl.textContent = data.answer || '';
      } catch {
        if (reqId !== adviceReqId) return;
        adviceEl.style.display = 'none';
      }
    }

    const range = body.querySelector('#ob-timeline-range');
    range.addEventListener('input', () => {
      timelineMonths = parseInt(range.value);
      body.querySelector('#ob-slider-period').textContent  = monthLabel(timelineMonths);
      body.querySelector('#ob-slider-monthly').textContent = `월 ${formatKRW(Math.ceil(remaining / timelineMonths))} 저축`;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchAdvice, 800);
    });

    fetchAdvice();

    const btn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => { phase = 'summary'; render(); });
    footer.appendChild(btn);
  }

  /* ─────── Budget Phase (한달 생활비 입력) ─────── */
  function renderBudgetPhase() {
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'timeline'; render(); });
    topBar.appendChild(backBtn);
    screen.appendChild(topBar);

    const body   = el('div', { class: 'ob-body' });
    const footer = el('div', { class: 'ob-footer' });
    screen.appendChild(body);
    screen.appendChild(footer);

    const PRESETS = [300000, 500000, 800000, 1000000, 1500000];

    body.innerHTML = `
      <h1 class="ob-title">한 달 생활비가<br>얼마예요?</h1>
      <p class="ob-subtitle">식비, 교통비, 공과금 등<br>한 달에 쓰는 총 생활비를 알려주세요.</p>
      <div class="ob-budget-box">
        <div class="ob-budget-box-label">MONTHLY BUDGET</div>
        <div class="ob-budget-box-amount" id="ob-expense-display">${monthlyExpenses ? formatKRW(monthlyExpenses) : '0원'}</div>
      </div>
      <div class="ob-preset-grid">
        ${PRESETS.map(p => `
          <button class="ob-preset-btn ${monthlyExpenses === p ? 'active' : ''}" data-val="${p}">${formatKRWShort(p)}</button>
        `).join('')}
        <button class="ob-preset-btn ob-custom-btn ${monthlyExpenses && !PRESETS.includes(monthlyExpenses) ? 'active' : ''}">직접 입력</button>
      </div>
      <div id="ob-custom-wrap" style="display:${monthlyExpenses && !PRESETS.includes(monthlyExpenses) ? 'block' : 'none'};margin-top:8px">
        <input class="ob-input" id="ob-expense-custom" type="number" placeholder="금액 직접 입력 (원)" step="10000" value="${monthlyExpenses && !PRESETS.includes(monthlyExpenses) ? monthlyExpenses : ''}"/>
      </div>
    `;

    body.querySelectorAll('.ob-preset-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        monthlyExpenses = parseInt(btn.dataset.val);
        body.querySelectorAll('.ob-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        body.querySelector('#ob-expense-display').textContent = formatKRW(monthlyExpenses);
        body.querySelector('#ob-custom-wrap').style.display = 'none';
      });
    });

    body.querySelector('.ob-custom-btn').addEventListener('click', () => {
      body.querySelectorAll('.ob-preset-btn').forEach(b => b.classList.remove('active'));
      body.querySelector('.ob-custom-btn').classList.add('active');
      body.querySelector('#ob-custom-wrap').style.display = 'block';
      body.querySelector('#ob-expense-custom')?.focus();
    });

    body.querySelector('#ob-expense-custom')?.addEventListener('input', e => {
      monthlyExpenses = parseInt(e.target.value || '0');
      body.querySelector('#ob-expense-display').textContent = monthlyExpenses > 0 ? formatKRW(monthlyExpenses) : '0원';
    });

    const nextBtn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    nextBtn.addEventListener('click', () => {
      if (!monthlyExpenses) { showToast('생활비를 선택해주세요!', 'warning'); return; }
      phase = 'summary'; render();
    });
    footer.appendChild(nextBtn);
  }

  /* ─────── Summary Phase (정리 페이지) ─────── */
  function renderSummaryPhase() {
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'timeline'; render(); });
    topBar.appendChild(backBtn);
    screen.appendChild(topBar);

    const body   = el('div', { class: 'ob-body' });
    const footer = el('div', { class: 'ob-footer' });
    screen.appendChild(body);
    screen.appendChild(footer);

    const remaining     = Math.max(0, targetAmount - currentSavings);
    const monthlyTarget = Math.ceil(remaining / timelineMonths);
    const dailyBudget   = Math.ceil(monthlyTarget / 30);
    const timelineLabel = timelineMonths < 12 ? `${timelineMonths}개월` : timelineMonths === 12 ? '1년' : timelineMonths === 24 ? '2년' : `1년 ${timelineMonths - 12}개월`;

    body.innerHTML = `
      <div class="ob-complete-inner">
        <h1 class="ob-title" style="text-align:center">목표 설정 완료!</h1>
        <p class="ob-subtitle" style="text-align:center">
          매일 <strong>${formatKRW(dailyBudget)}</strong>씩 저금해봐요!<br>
          ${timelineLabel} 후 목표 달성! 🎉
        </p>
      </div>
      <div class="ob-daily-result">
        <div class="ob-daily-result-label">하루 저금액</div>
        <div class="ob-daily-result-amount">${dailyBudget.toLocaleString('ko-KR')}<span class="ob-daily-result-unit">원 / 일</span></div>
      </div>
      <div class="ob-quest-summary">
        <div class="ob-quest-header">저축 목표 요약</div>
        <div class="ob-quest-row"><span class="ob-quest-key">목표 금액</span><span class="ob-quest-val">${formatKRW(targetAmount)}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">현재 보유</span><span class="ob-quest-val">${formatKRW(currentSavings)}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">월별 목표</span><span class="ob-quest-val ob-accent-text">${formatKRW(monthlyTarget)}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">기간</span><span class="ob-quest-val">${timelineLabel}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">하루 저금액</span><span class="ob-quest-val ob-accent-text">${formatKRW(dailyBudget)}</span></div>
      </div>
    `;

    const btn = el('button', { class: 'ob-next-btn ob-start-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => { phase = 'analysis'; render(); });
    footer.appendChild(btn);
  }

  /* ─────── Step 4 : Timeline ─────── */
  function renderStep4(body, footer) {
    const remaining = Math.max(0, targetAmount - currentSavings);
    const cur = timelineMonths || 6;

    function monthLabel(m) {
      return m < 12 ? `${m}개월` : m === 12 ? '1년' : m === 24 ? '2년' : `1년 ${m - 12}개월`;
    }

    body.innerHTML = `
      <h1 class="ob-title">언제까지<br>모을 건가요?</h1>
      <p class="ob-subtitle">남은 금액 <strong>${formatKRW(remaining)}</strong>을<br>몇 개월 안에 모을까요?</p>
      <div class="ob-slider-display">
        <div class="ob-slider-period" id="ob-slider-period">${monthLabel(cur)}</div>
        <div class="ob-slider-monthly" id="ob-slider-monthly">월 ${formatKRW(Math.ceil(remaining / cur))} 저축</div>
      </div>
      <div class="ob-slider-wrap">
        <input type="range" class="ob-range" id="ob-timeline-range" min="1" max="24" value="${cur}" step="1">
        <div class="ob-slider-ticks">
          <span>1개월</span><span>6개월</span><span>12개월</span><span>18개월</span><span>24개월</span>
        </div>
      </div>
      <div id="ob-timeline-advice" class="ob-timeline-advice" style="display:none"></div>
    `;

    let adviceReqId = 0;
    let debounceTimer = null;

    async function fetchAdvice() {
      const reqId    = ++adviceReqId;
      const adviceEl = body.querySelector('#ob-timeline-advice');
      if (!adviceEl) return;

      adviceEl.style.display = 'block';
      adviceEl.innerHTML = '<span class="ob-advice-dots"><span>·</span><span>·</span><span>·</span></span>';

      const monthly = Math.ceil(remaining / timelineMonths);
      const label   = monthLabel(timelineMonths);
      const msg = `[타임라인 조언 요청]\n아래 정보를 바탕으로 사용자가 선택한 기간이 현실적인지 2문장 이내로 솔직하고 친근하게 조언해주세요. JSON 출력 금지. 이모지 1개 포함.\n\n목표 금액: ${formatKRW(targetAmount)}\n현재 보유: ${formatKRW(currentSavings)}\n월 생활비: ${formatKRW(monthlyExpenses)}\n선택 기간: ${label}\n월 필요 저축액: ${formatKRW(monthly)}`;

      try {
        const data = await callDifyAPI(msg, '', DIFY_ANALYSIS_API_KEY);
        if (reqId !== adviceReqId) return;
        adviceEl.textContent = data.answer || '';
      } catch {
        if (reqId !== adviceReqId) return;
        adviceEl.style.display = 'none';
      }
    }

    const range = body.querySelector('#ob-timeline-range');
    range.addEventListener('input', () => {
      timelineMonths = parseInt(range.value);
      body.querySelector('#ob-slider-period').textContent  = monthLabel(timelineMonths);
      body.querySelector('#ob-slider-monthly').textContent = `월 ${formatKRW(Math.ceil(remaining / timelineMonths))} 저축`;

      /* 드래그 멈춘 후 800ms 뒤에 Dify 요청 */
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchAdvice, 800);
    });

    fetchAdvice();

    const btn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => { step = 5; render(); });
    footer.appendChild(btn);
  }

  /* ─────── Step 5 : Daily budget result ─────── */
  function renderStep5(body, footer) {
    const remaining     = Math.max(0, targetAmount - currentSavings);
    const monthlyTarget = Math.ceil(remaining / timelineMonths);
    const dailyBudget   = Math.ceil(monthlyTarget / 30);
    const timelineLabel = timelineMonths < 12 ? `${timelineMonths}개월` : timelineMonths === 12 ? '1년' : timelineMonths === 24 ? '2년' : `1년 ${timelineMonths - 12}개월`;
    const lvl           = AppState.getState().characterLevel;

    body.innerHTML = `
      <div class="ob-complete-inner">
        <h1 class="ob-title" style="text-align:center">목표 설정 완료!</h1>
        <p class="ob-subtitle" style="text-align:center">
          매일 <strong>${formatKRW(dailyBudget)}</strong>씩 저금해봐요!<br>
          ${timelineLabel} 후 목표 달성! 🎉
        </p>
      </div>
      <div class="ob-daily-result">
        <div class="ob-daily-result-label">하루 저금액</div>
        <div class="ob-daily-result-amount">${dailyBudget.toLocaleString('ko-KR')}<span class="ob-daily-result-unit">원 / 일</span></div>
      </div>
      <div class="ob-quest-summary">
        <div class="ob-quest-header">저축 목표 요약</div>
        <div class="ob-quest-row"><span class="ob-quest-key">목표 금액</span><span class="ob-quest-val">${formatKRW(targetAmount)}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">현재 보유</span><span class="ob-quest-val">${formatKRW(currentSavings)}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">월별 목표</span><span class="ob-quest-val ob-accent-text">${formatKRW(monthlyTarget)}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">기간</span><span class="ob-quest-val">${timelineLabel}</span></div>
        <div class="ob-quest-row"><span class="ob-quest-key">하루 저금액</span><span class="ob-quest-val ob-accent-text">${formatKRW(dailyBudget)}</span></div>
      </div>
    `;

    const btn = el('button', { class: 'ob-next-btn ob-start-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => {
      phase = 'char-select';
      render();
    });
    footer.appendChild(btn);
  }

  /* ─────── 캐릭터 선택하기 ─────── */
  function renderCharSelectPhase() {
    const TOTAL_CHARS = CHARACTERS.length;
    const VISIBLE     = 3;
    // 기본 선택: 가운데 캐릭터 (최초 진입 시에만 적용)
    if (selectedCharIdx === 0) selectedCharIdx = Math.floor((TOTAL_CHARS - 1) / 2);
    let thumbOffset = Math.max(0, Math.min(selectedCharIdx - 1, TOTAL_CHARS - VISIBLE));

    /* 상단 바 */
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'steps'; step = 5; render(); });
    topBar.appendChild(backBtn);
    screen.appendChild(topBar);

    /* 타이틀 */
    const titleWrap = el('div', { class: 'ob-char-title-wrap' });
    titleWrap.innerHTML = `
      <div class="ob-char-title-accent">캐릭터</div>
      <div class="ob-char-title-main">선택하기</div>
      <div class="ob-char-subtitle">키우고 싶은 캐릭터를 정해주세요</div>
    `;
    screen.appendChild(titleWrap);

    /* 프리뷰 + 화살표 래퍼 */
    const previewWrap = el('div', { class: 'ob-char-preview-wrap' });

    const prevArrow = el('button', { class: 'ob-char-arrow' });
    prevArrow.innerHTML = '&#9664;';

    const preview = el('div', { class: 'ob-char-preview' });
    const stepPreviewImg = el('img', {
      class: 'ob-char-step-preview',
      id: 'ob-char-step-preview',
      src: `images/animal/${CHAR_TYPES[selectedCharIdx].id}.png`,
      alt: 'step preview',
    });
    preview.appendChild(stepPreviewImg);

    const nextArrow = el('button', { class: 'ob-char-arrow' });
    nextArrow.innerHTML = '&#9654;';

    previewWrap.appendChild(prevArrow);
    previewWrap.appendChild(preview);
    previewWrap.appendChild(nextArrow);
    screen.appendChild(previewWrap);

    /* 캐릭터 이름 */
    const nameLabel = el('div', { class: 'ob-char-name-label', id: 'ob-char-name-label' });
    nameLabel.textContent = CHAR_TYPES[selectedCharIdx].name;
    screen.appendChild(nameLabel);

    /* 선택 변경 시 업데이트 */
    function updateDisplay() {
      const prevImg = document.getElementById('ob-char-step-preview');
      if (prevImg) { prevImg.src = `images/animal/${CHAR_TYPES[selectedCharIdx].id}.png`; }
      const nl = document.getElementById('ob-char-name-label');
      if (nl) nl.textContent = CHAR_TYPES[selectedCharIdx].name;
    }

    prevArrow.addEventListener('click', () => {
      selectedCharIdx = (selectedCharIdx - 1 + TOTAL_CHARS) % TOTAL_CHARS;
      updateDisplay();
    });

    nextArrow.addEventListener('click', () => {
      selectedCharIdx = (selectedCharIdx + 1) % TOTAL_CHARS;
      updateDisplay();
    });

    /* 푸터 */
    const footer = el('div', { class: 'ob-footer' });
    footer.style.marginTop = 'auto';
    const btn = el('button', { class: 'ob-next-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => { phase = 'char-name'; render(); });
    footer.appendChild(btn);
    screen.appendChild(footer);
  }

  /* ─────── 캐릭터 이름 정하기 ─────── */
  function renderCharNamePhase() {
    /* 상단 바 */
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'char-select'; render(); });
    topBar.appendChild(backBtn);
    screen.appendChild(topBar);

    /* 타이틀 */
    const titleWrap = el('div', { class: 'ob-char-title-wrap' });
    titleWrap.innerHTML = `
      <div class="ob-char-title-accent">캐릭터</div>
      <div class="ob-char-title-main">이름 정하기</div>
      <div class="ob-char-subtitle">키우고 싶은 캐릭터를 정해주세요</div>
    `;
    screen.appendChild(titleWrap);

    /* 큰 프리뷰 박스 — step1 이미지 */
    const preview    = el('div', { class: 'ob-char-preview ob-char-preview-name' });
    const previewImg = el('img', {
      class: 'ob-char-step-preview',
      src: getFrameImageSrc(selectedCharIdx, 1, false),
      alt: 'step1',
    });
    preview.appendChild(previewImg);
    screen.appendChild(preview);

    /* 이름 입력 */
    const nameWrap = el('div', { class: 'ob-char-name-wrap' });
    nameWrap.innerHTML = `
      <input class="ob-char-name-input" id="ob-pet-name"
        placeholder="이름을 지어주세요."
        maxlength="10"
        autocomplete="off"
        value="${escapeHTML(petName)}"/>
    `;
    screen.appendChild(nameWrap);

    nameWrap.querySelector('#ob-pet-name').addEventListener('input', e => {
      petName = e.target.value;
    });

    /* 푸터 */
    const footer = el('div', { class: 'ob-footer' });
    footer.style.borderTop = 'none';
    const btn    = el('button', { class: 'ob-next-btn ob-start-btn', html: '▶ 다음 ◀' });
    btn.addEventListener('click', () => {
      petName = petName.trim() || '도토리';
      phase = 'user-name';
      render();
    });
    footer.appendChild(btn);
    screen.appendChild(footer);
  }

  /* ─────── 닉네임 정하기 ─────── */
  function renderUserNamePhase() {
    /* 상단 바 */
    const topBar  = el('div', { class: 'ob-topbar' });
    const backBtn = el('button', { class: 'ob-back-btn' });
    backBtn.innerHTML = '&#9664;';
    backBtn.addEventListener('click', () => { phase = 'char-name'; render(); });
    topBar.appendChild(backBtn);
    screen.appendChild(topBar);

    /* 타이틀 */
    const titleWrap = el('div', { class: 'ob-char-title-wrap' });
    titleWrap.innerHTML = `
      <div class="ob-char-title-accent">나의</div>
      <div class="ob-char-title-main">닉네임 정하기</div>
      <div class="ob-char-subtitle">앱에서 사용할 닉네임을 입력해주세요</div>
    `;
    screen.appendChild(titleWrap);

    /* 이름 입력 */
    const nameWrap = el('div', { class: 'ob-char-name-wrap' });
    nameWrap.innerHTML = `
      <input class="ob-char-name-input" id="ob-user-name"
        placeholder="닉네임을 입력해주세요"
        maxlength="12"
        autocomplete="off"
        value="${userName}"/>
    `;
    screen.appendChild(nameWrap);

    nameWrap.querySelector('#ob-user-name').addEventListener('input', e => {
      userName = e.target.value;
    });

    /* 푸터 */
    const footer = el('div', { class: 'ob-footer' });
    footer.style.borderTop = 'none';
    footer.style.marginTop = 'auto';
    const btn = el('button', { class: 'ob-next-btn ob-start-btn', html: '▶ 시작하기 ◀' });
    btn.addEventListener('click', () => {
      const finalUserName = userName.trim() || '절약러';
      const finalPetName  = petName.trim() || '도토리';
      const st = AppState.getState();
      st.characterType  = selectedCharIdx;
      st.characterLevel = 1;
      AppState.completeOnboarding(
        { name: finalUserName, charName: finalPetName },
        { name: goalName, category: goalCategory, targetAmount, currentSavings, monthlyExpenses, timelineMonths }
      );
      launchConfetti(30);
    });
    footer.appendChild(btn);
    screen.appendChild(footer);
  }

  render();
  return screen;
}
