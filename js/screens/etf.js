/* ===========================================
   ETF.JS — PiggyQuest
   ETF 투자 안내 화면
   =========================================== */
'use strict';

const ETF_AGENT_KEY = 'app-DOQfLHv1HyhsyzP2ko0Bvdfy';

const ETF_PRODUCTS = [
  {
    name    : 'TIGER 미국S&P500',
    ticker  : '360750',
    type    : '해외',
    company : '미래에셋',
    fee     : '0.07%',
    target  : '미국 대형주 500개',
    pros    : ['전 세계에서 가장 검증된 지수', '보수율 최저 수준', '장기 우상향 이력'],
    cons    : ['환율 변동 영향 받음', '단기 수익 기대 어려움'],
    recommend: '장기 적립식 입문자에게 가장 적합',
  },
  {
    name    : 'KODEX 미국나스닥100TR',
    ticker  : '379800',
    type    : '해외',
    company : '삼성자산운용',
    fee     : '0.05%',
    target  : '미국 기술주 100개',
    pros    : ['엔비디아·애플·MS 등 빅테크 집중', '배당 자동 재투자로 복리 효과', '매우 낮은 보수'],
    cons    : ['기술주 쏠림 — 금리 인상 시 낙폭 큼', '분배금 없음'],
    recommend: 'AI·반도체 성장에 베팅하고 싶은 투자자',
  },
  {
    name    : 'TIGER KOSPI200',
    ticker  : '102110',
    type    : '국내',
    company : '미래에셋',
    fee     : '0.05%',
    target  : '국내 대형주 200개',
    pros    : ['국내 최저 보수', '삼성전자·SK하이닉스 등 분산', '환율 리스크 없음'],
    cons    : ['국내 시장만 투자 — 글로벌 성장 제한', '코스피 등락에 직접 노출'],
    recommend: '국내 시장에 친숙한 입문자',
  },
  {
    name    : 'TIGER 코스닥150',
    ticker  : '232080',
    type    : '국내',
    company : '미래에셋',
    fee     : '0.20%',
    target  : '국내 성장주 150개',
    pros    : ['바이오·IT·2차전지 성장주 노출', '소액으로 다양한 코스닥 종목 분산'],
    cons    : ['변동성이 가장 큼', '경기 침체 시 낙폭 크다'],
    recommend: '고위험·고수익을 원하는 투자자',
  },
];

function _calcSurplus() {
  const s    = AppState.getState();
  const goal = s.goal;
  if (!goal || goal.targetAmount <= 0) return 0;
  const saved = Math.max(0, (goal.currentSavings || 0) + (s.piggyBalance || 0));
  return Math.max(0, saved - goal.targetAmount);
}

function renderETFScreen() {
  const s       = AppState.getState();
  const surplus = _calcSurplus();
  const screen  = el('div', { class: 'screen etf-screen', id: 'screen-etf' });

  /* ── 헤더 ── */
  const hdr = el('div', { class: 'screen-header' });
  hdr.innerHTML = `
    <button class="screen-back-btn" id="etf-back">‹</button>
    <span class="hdr-title">📈 ETF 투자 안내</span>
  `;
  screen.appendChild(hdr);
  hdr.querySelector('#etf-back').addEventListener('click', () => AppState.navigate('today'));

  const body = el('div', { class: 'screen-body etf-body' });

  /* ── 초과 저축 0원: 안내 메시지 ── */
  if (surplus <= 0) {
    const notYet = el('div', { class: 'etf-not-yet' });
    notYet.innerHTML = `
      <div class="etf-not-yet-title">아직 조금 더 모아봐요!</div>
      <div class="etf-not-yet-desc">목표 금액을 달성하고 초과 저축이 생기면<br>딱 맞는 ETF를 추천해드릴게요.</div>
    `;
    body.appendChild(notYet);
    screen.appendChild(body);
    screen.appendChild(renderBottomNav('piggy'));
    return screen;
  }

  /* ── 초과 저축 카드 ── */
  const surplusCard = el('div', { class: 'etf-surplus-card' });
  surplusCard.innerHTML = `
    <div class="etf-surplus-label">목표 초과 저축액</div>
    <div class="etf-surplus-amount">${formatKRW(surplus)}</div>
    <div class="etf-surplus-sub">이 금액으로 ETF 투자를 시작할 수 있어요!</div>
  `;
  body.appendChild(surplusCard);

  /* ── ETF 기초 안내 ── */
  const guide = el('div', { class: 'etf-guide-card' });
  guide.innerHTML = `
    <div class="etf-guide-title">📚 ETF가 뭔가요?</div>
    <div class="etf-guide-text">ETF는 주식처럼 사고팔 수 있는 펀드예요.<br>한 번에 수백 개 종목에 분산 투자할 수 있어서<br>개별 주식보다 리스크가 낮아요.</div>
    <div class="etf-guide-tip">💡 <strong>적립식 투자</strong> — 매달 일정 금액을 꾸준히 사는 것이 가장 효과적이에요.</div>
  `;
  body.appendChild(guide);

  /* ── 종목 리스트 ── */
  const listLabel = el('div', { class: 'etf-section-label' });
  listLabel.textContent = '추천 ETF 종목';
  body.appendChild(listLabel);

  ETF_PRODUCTS.forEach(etf => {
    body.appendChild(_renderETFCard(etf));
  });

  /* ── AI 맞춤 추천 ── */
  const aiSection = el('div', { class: 'etf-ai-section' });
  aiSection.innerHTML = `
    <div class="etf-section-label">🤖 AI 맞춤 추천</div>
    <div class="etf-ai-wrap" id="etf-screen-ai-wrap">
      <div class="etf-ai-loading">
        <span class="tch-dot"></span><span class="tch-dot"></span><span class="tch-dot"></span>
      </div>
    </div>
  `;
  body.appendChild(aiSection);

  screen.appendChild(body);
  screen.appendChild(renderBottomNav('piggy'));

  /* ── Dify AI 추천 호출 ── */
  const prompt = `초과 저축액은 ${formatKRW(surplus)}이야. `
    + `이 금액으로 시작하기 좋은 ETF 1~2개를 추천하고 투자 비중도 알려줘. 반말로, 3문장 이내로. 축하 인사 없이 바로 추천해줘.`;

  callDifyAPI(prompt, null, ETF_AGENT_KEY)
    .then(res => {
      const wrap = document.getElementById('etf-screen-ai-wrap');
      if (!wrap) return;
      const txt = (res.answer || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      wrap.innerHTML = `
        <div class="settle-ai-bubble">
          <img class="settle-ai-avatar" src="images/trainer_chat.png?v=2" alt="트레이너"/>
          <div class="settle-ai-text">${txt}</div>
        </div>
      `;
    })
    .catch(() => {
      const wrap = document.getElementById('etf-screen-ai-wrap');
      if (wrap) wrap.style.display = 'none';
    });

  return screen;
}

function _renderETFCard(etf) {
  const card = el('div', { class: 'etf-card' });
  card.innerHTML = `
    <div class="etf-card-header">
      <span class="etf-badge ${etf.type === '해외' ? 'etf-badge-abroad' : 'etf-badge-domestic'}">${etf.type}</span>
      <div class="etf-card-name">${etf.name}</div>
      <div class="etf-card-meta">${etf.company} · 보수 ${etf.fee}</div>
      <div class="etf-card-toggle" id="toggle-${etf.ticker}">▼ 상세보기</div>
    </div>
    <div class="etf-card-target">${etf.target}</div>
    <div class="etf-card-detail hidden" id="detail-${etf.ticker}">
      <div class="etf-detail-section">
        <div class="etf-detail-label etf-pros-label">✅ 장점</div>
        ${etf.pros.map(p => `<div class="etf-detail-item">• ${p}</div>`).join('')}
      </div>
      <div class="etf-detail-section">
        <div class="etf-detail-label etf-cons-label">⚠️ 단점</div>
        ${etf.cons.map(c => `<div class="etf-detail-item">• ${c}</div>`).join('')}
      </div>
      <div class="etf-detail-recommend">👤 ${etf.recommend}</div>
    </div>
  `;

  card.querySelector(`#toggle-${etf.ticker}`).addEventListener('click', () => {
    const detail = card.querySelector(`#detail-${etf.ticker}`);
    const toggle = card.querySelector(`#toggle-${etf.ticker}`);
    const isOpen = !detail.classList.contains('hidden');
    detail.classList.toggle('hidden', isOpen);
    toggle.textContent = isOpen ? '▼ 상세보기' : '▲ 접기';
  });

  return card;
}
