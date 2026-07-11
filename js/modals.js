/* ===========================================
   MODALS.JS — PiggyQuest
   Modal management and modal content
   =========================================== */
'use strict';

const ModalManager = (() => {
  let currentModal = null;
  let _locked = false;   // true → 오버레이 클릭으로 못 닫음

  function open(contentEl, extraClass = '', locked = false) {
    const overlay   = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    if (!container || !overlay) return;

    _locked = locked;
    container.innerHTML = '';
    container.className = `modal-container visible ${extraClass}`;
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    container.appendChild(contentEl);
    currentModal = contentEl;
  }

  function close() {
    const overlay   = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    if (!container || !overlay) return;
    _locked = false;
    container.classList.add('hidden');
    overlay.classList.add('hidden');
    container.innerHTML = '';
    currentModal = null;
  }

  function init() {
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (_locked) return;   // 🔒 정산 팝업 등은 버튼으로만 닫힘
      if (e.target === document.getElementById('modal-overlay')) close();
    });
  }

  return { open, close, init };
})();

/* ---- Daily Settlement Modal (locked) ---- */
function showDailySettleModal(data, onClose) {
  const s       = AppState.getState();
  const success = data.delta >= 0;

  function _showShieldUsed() {
    const c = el('div', { class: 'settle-modal' });
    c.innerHTML = `
      <div class="settle-emoji" id="settle-emoji">🛡️</div>
      <div class="settle-title">보호권 사용!</div>
      <div class="settle-sub">오늘 연속 기록이 <strong>보호</strong>됐어요.</div>
      <div class="settle-divider"></div>
      <div class="settle-row">
        <span class="settle-label">오늘 지출</span>
        <span class="settle-val" style="color:var(--red)">${formatKRW(data.prevSpent)}</span>
      </div>
      <div class="settle-row">
        <span class="settle-label">남은 보호권</span>
        <span class="settle-val">🛡️ × ${AppState.getShieldCount()}</span>
      </div>
      <div class="settle-divider"></div>
      <div class="settle-xp gain">🛡️ 보호 완료!</div>
      <button class="settle-ok-btn" id="settle-ok-btn">확인 ✓</button>
    `;
    ModalManager.open(c, '', true);
    setTimeout(() => animateBounce(c.querySelector('#settle-emoji')), 50);
    c.querySelector('#settle-ok-btn').addEventListener('click', () => {
      ModalManager.close();
      onClose?.();
    });
  }

  const shieldAvail = !success && (s.shieldCount || 0) > 0;

  const content = el('div', { class: 'settle-modal' });
  content.innerHTML = `
    <div class="settle-emoji" id="settle-emoji">${success ? '🎉' : '😢'}</div>
    <div class="settle-title">${success ? '절약 달성!' : '예산 초과...'}</div>
    <div class="settle-sub">
      ${success
        ? `오늘 <strong>${formatKRW(data.spendingDelta)}</strong> 절약했어요!`
        : `<strong>${formatKRW(Math.abs(data.spendingDelta))}</strong> 만큼 초과했어요.`}
    </div>
    <div class="settle-divider"></div>
    <div class="settle-row">
      <span class="settle-label">오늘 지출</span>
      <span class="settle-val" style="color:var(--red)">${formatKRW(data.prevSpent)}</span>
    </div>
    <div class="settle-row">
      <span class="settle-label">저금통 적립</span>
      <span class="settle-val" style="color:${data.delta >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${(data.delta >= 0 ? '+' : '') + formatKRW(data.delta)}
      </span>
    </div>
    <div class="settle-row">
      <span class="settle-label">저금통 잔액</span>
      <span class="settle-val" style="color:${data.delta >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${formatKRW(data.piggyBalance)}
      </span>
    </div>
    <div class="settle-divider"></div>
    ${success ? `<div class="settle-shield-earn">🪙 코인 +1 획득! (보유: ${typeof getShopCoins === 'function' ? getShopCoins() : 0}개)</div>` : ''}
    ${shieldAvail ? `<button class="settle-shield-btn" id="settle-shield-btn">🛡️ 보호권 사용 (보유 ${s.shieldCount}개)</button>` : ''}
    <div class="settle-ai-wrap" id="settle-ai-wrap">
      <div class="settle-ai-loading">
        <span class="tch-dot"></span><span class="tch-dot"></span><span class="tch-dot"></span>
      </div>
    </div>
    <button class="settle-ok-btn" id="settle-ok-btn">확인 ✓</button>
  `;

  ModalManager.open(content, '', true);

  if (success) {
    setTimeout(() => launchConfetti(30), 150);
    setTimeout(() => animateBounce(content.querySelector('#settle-emoji')), 50);
  } else {
    setTimeout(() => animateShake(content.querySelector('#settle-emoji')), 50);
  }

  if (shieldAvail) {
    content.querySelector('#settle-shield-btn')?.addEventListener('click', () => {
      if (AppState.useShield(data.settledDate)) {
        _showShieldUsed();
      }
    });
  }

  /* ── 트레이너 AI 코멘트 ── */
  const prompt = `오늘 지출 ${formatKRW(data.prevSpent)} / 예산 ${formatKRW(s.dailyBudget)} → `
    + (success
      ? `${formatKRW(data.delta)} 절약 성공!`
      : `${formatKRW(Math.abs(data.delta))} 초과.`)
    + ` 짧고 친근하게 피드백 한 마디만 해줘 (2문장 이내, 반말).`;

  callDifyAPI(prompt, null, DIFY_SUMMARY_API_KEY)
    .then(res => {
      const wrap = document.getElementById('settle-ai-wrap');
      if (!wrap) return;
      const txt = (res.answer || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      wrap.innerHTML = `
        <div class="settle-ai-bubble">
          <img class="settle-ai-avatar" src="images/trainer_chat.png?v=2" alt="트레이너"/>
          <div class="settle-ai-text">${txt}</div>
        </div>
      `;
    })
    .catch(() => {
      const wrap = document.getElementById('settle-ai-wrap');
      if (wrap) wrap.style.display = 'none';
    });

  content.querySelector('#settle-ok-btn').addEventListener('click', () => {
    ModalManager.close();
    onClose?.();
  });
}

/* ---- Level Up Modal ---- */
function showLevelUpModal(level, onClose) {
  const s      = AppState.getState();
  const name   = CHARACTER_NAMES[level - 1];
  const desc   = CHARACTER_DESCS[level - 1];
  const imgSrc = getFrameImageSrc(s.characterType || 0, level, false);

  const content = el('div', { class: 'levelup-bg' });
  content.innerHTML = `
    <div class="levelup-char">
      <img class="levelup-char-img" src="${imgSrc}" alt="${name}"/>
    </div>
    <div class="levelup-title">Level ${level} 달성!</div>
    <div class="levelup-sub">${name}(으)로 진화했어요!<br>${desc}</div>
    <button class="settle-ok-btn" id="lvlup-ok">멋져요 🌟</button>
  `;
  ModalManager.open(content, 'levelup-bg', true);   // locked
  launchConfetti(50);

  const flash = document.createElement('div');
  flash.className = 'anim-lvl-flash';
  document.body.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());

  content.querySelector('#lvlup-ok')?.addEventListener('click', () => {
    ModalManager.close();
    onClose?.();   // → 다음 팝업 (뱃지 등)
  });
}

/* ---- Level Down Modal ---- */
function showLevelDownModal(level, onClose) {
  const content = el('div', {});
  content.innerHTML = `
    <div class="result-emoji" id="lvldown-emoji" style="text-align:center;margin:16px 0">
      ${getCharacterHTML(level, '100px')}
    </div>
    <div class="result-title" style="color:var(--red)">레벨 하락...</div>
    <div class="result-sub" style="text-align:center;color:var(--muted);font-size:12px;margin:8px 0 16px">
      예산을 초과해서 레벨이 낮아졌어요.<br>다시 도전해봐요!
    </div>
    <div style="text-align:center;font-size:1.4rem;margin-bottom:16px">Lv.${level}</div>
    <button class="settle-ok-btn" id="lvldown-ok">다음엔 잘할게요 💪</button>
  `;
  ModalManager.open(content, '', true);   // locked
  animateShake(content.querySelector('#lvldown-emoji'));
  content.querySelector('#lvldown-ok')?.addEventListener('click', () => {
    ModalManager.close();
    onClose?.();
  });
}

/* ---- Badge Earned Modal ---- */
function showBadgeModal(badgeId, onClose) {
  const badge = getBadgeById(badgeId);
  if (!badge) { onClose?.(); return; }

  const iconHTML = badge.img
    ? `<img class="bdg-detail-img" src="${badge.img}" alt="${badge.name}"/>`
    : `<div class="bdg-detail-icon">${badge.icon}</div>`;

  const content = el('div', { class: 'bdg-detail' });
  content.innerHTML = `
    <div style="font-size:0.75rem;font-weight:800;color:var(--accent);letter-spacing:2px;margin-bottom:12px">🏅 NEW BADGE</div>
    <div class="bdg-detail-icon-box">${iconHTML}</div>
    <div class="bdg-detail-name">${badge.name}</div>
    <div class="bdg-detail-desc">${badge.desc}</div>
    <button class="settle-ok-btn" id="badge-ok">획득! 🎉</button>
  `;
  ModalManager.open(content, '', true);
  launchConfetti(20);
  content.querySelector('#badge-ok')?.addEventListener('click', () => {
    ModalManager.close();
    onClose?.();
  });
}

/* ---- Budget Edit Modal ---- */
function showBudgetEditModal() {
  const s = AppState.getState();
  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">예산 수정</div>
      <div class="modal-subtitle">하루 예산을 직접 입력하세요</div>
    </div>
    <div class="input-group" style="margin-bottom:var(--space-4)">
      <label class="input-label">하루 예산 (원)</label>
      <input class="input-field" id="budget-edit-input" type="number"
             value="${s.dailyBudget}" placeholder="0" style="font-size:1.5rem;font-weight:900"/>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="budget-edit-cancel">취소</button>
      <button class="btn btn-primary" id="budget-edit-save">저장</button>
    </div>
  `;
  ModalManager.open(content);
  content.querySelector('#budget-edit-cancel')?.addEventListener('click', () => ModalManager.close());
  content.querySelector('#budget-edit-save')?.addEventListener('click', () => {
    const val = parseInt(content.querySelector('#budget-edit-input').value || '0');
    if (val > 0) {
      AppState.updateDailyBudget(val);
      ModalManager.close();
      showToast(`하루 예산이 ${formatKRW(val)}로 변경됐어요!`, 'success');
    } else {
      animateShake(content.querySelector('#budget-edit-input'));
    }
  });
}

/* ---- Settings Modal ---- */
function showSettingsModal() {
  const s = AppState.getState();
  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">설정</div>
    </div>
    <div class="settings-section-label">프로필</div>
    <div class="settings-row" style="gap:8px">
      <button class="settings-action-btn" id="nickname-reset-btn" style="flex:1;margin:0">닉네임 변경</button>
    </div>
    <div class="settings-section-label">캐릭터</div>
    <div class="settings-row" style="gap:8px">
      <button class="settings-action-btn" id="name-reset-btn" style="flex:1;margin:0">캐릭터 이름 변경</button>
      <button class="settings-action-btn" id="char-change-btn" style="flex:1;margin:0">캐릭터 변경</button>
    </div>
    <div class="settings-section-label">튜토리얼</div>
    <div class="settings-row">
      <button class="settings-action-btn" id="tutorial-restart-btn" style="width:100%;margin:0">튜토리얼 다시 보기</button>
    </div>
    <div class="settings-section-label">친구추가코드</div>
    <div class="settings-row">
      <div class="settings-code">${s.inviteCode}</div>
      <button class="ob-next-btn" id="copy-code-btn" style="width:auto;padding:0 16px;margin-left:8px">복사하기</button>
    </div>
    <div class="settings-actions">
      <button class="settings-action-btn" id="logout-btn">로그아웃</button>
      <button class="settings-action-btn danger" id="delete-btn">회원탈퇴</button>
    </div>
  `;
  ModalManager.open(content);

  content.querySelector('#copy-code-btn').addEventListener('click', () => {
    navigator.clipboard?.writeText(s.inviteCode).catch(() => {});
    showToast(`코드 ${s.inviteCode} 복사됨!`, 'success');
  });

  content.querySelector('#nickname-reset-btn').addEventListener('click', () => {
    ModalManager.close();
    showNicknameResetModal();
  });

  content.querySelector('#name-reset-btn').addEventListener('click', () => {
    ModalManager.close();
    showNameResetModal();
  });

  content.querySelector('#char-change-btn').addEventListener('click', () => {
    ModalManager.close();
    showCharChangeModal();
  });

  content.querySelector('#tutorial-restart-btn').addEventListener('click', () => {
    // 화면별 튜토리얼 플래그 초기화
    localStorage.removeItem('pq_tut_today');
    localStorage.removeItem('pq_tut_social');
    localStorage.removeItem('pq_tut_mypage');
    ModalManager.close();
    if (typeof Tutorial !== 'undefined') Tutorial.show();
  });

  content.querySelector('#logout-btn').addEventListener('click', () => {
    ModalManager.close();
    showToast('로그아웃 됐어요.', 'info');
  });

  content.querySelector('#delete-btn').addEventListener('click', () => {
    if (confirm('정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.')) {
      localStorage.clear();
      location.reload();
    }
  });
}

/* ---- Nickname Reset Modal ---- */
function showNicknameResetModal() {
  const s = AppState.getState();
  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">닉네임 변경</div>
    </div>
    <div style="padding:0 4px 16px">
      <input class="ob-char-name-input" id="new-nickname-input"
        placeholder="새 닉네임을 입력해주세요"
        maxlength="12" autocomplete="off"
        value="${escapeHTML(s.user?.name)}"/>
    </div>
    <button class="ob-next-btn" id="nickname-confirm-btn" style="margin-top:0">▶ 확인 ◀</button>
  `;
  ModalManager.open(content);

  const input = content.querySelector('#new-nickname-input');
  input.focus();
  input.addEventListener('keydown', e => { if (e.key === 'Enter') content.querySelector('#nickname-confirm-btn').click(); });

  content.querySelector('#nickname-confirm-btn').addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) { showToast('닉네임을 입력해주세요!', 'warning'); return; }
    AppState.updateUserName(name);
    ModalManager.close();
    showToast(`닉네임이 "${escapeHTML(name)}"으로 변경됐어요!`, 'success');
  });
}

/* ---- Character Name Reset Modal ---- */
function showNameResetModal() {
  const s = AppState.getState();
  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">캐릭터 이름 변경</div>
    </div>
    <div style="padding:0 4px 16px">
      <input class="ob-char-name-input" id="new-name-input"
        placeholder="새 캐릭터 이름을 입력해주세요"
        maxlength="10" autocomplete="off"
        value="${escapeHTML(s.user?.charName || s.user?.name)}"/>
    </div>
    <button class="ob-next-btn" id="name-confirm-btn" style="margin-top:0">▶ 확인 ◀</button>
  `;
  ModalManager.open(content);

  const input = content.querySelector('#new-name-input');
  input.focus();
  input.addEventListener('keydown', e => { if (e.key === 'Enter') content.querySelector('#name-confirm-btn').click(); });

  content.querySelector('#name-confirm-btn').addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) { showToast('이름을 입력해주세요!', 'warning'); return; }
    AppState.updateCharName(name);
    ModalManager.close();
    showToast(`캐릭터 이름이 "${escapeHTML(name)}"으로 변경됐어요!`, 'success');
    if (typeof updateHomeCharCard === 'function') updateHomeCharCard();
  });
}

/* ---- Character Change Modal ---- */
function showCharChangeModal() {
  const s = AppState.getState();
  let selectedIdx = s.characterType || 0;
  const TOTAL = CHAR_TYPES.length;

  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">캐릭터 변경</div>
    </div>
    <div class="settings-char-wrap">
      <button class="ob-char-arrow" id="char-prev">&#9664;</button>
      <div class="settings-char-preview-box">
        <img id="settings-char-img" src="images/animal/${CHAR_TYPES[selectedIdx].id}.png" alt="preview"/>
      </div>
      <button class="ob-char-arrow" id="char-next">&#9654;</button>
    </div>
    <div class="ob-char-name-label" id="settings-char-name">${CHAR_TYPES[selectedIdx].name}</div>
    <button class="ob-next-btn" id="char-confirm-btn" style="margin-top:8px">▶ 선택 ◀</button>
  `;
  ModalManager.open(content);

  function update() {
    content.querySelector('#settings-char-img').src = `images/animal/${CHAR_TYPES[selectedIdx].id}.png`;
    content.querySelector('#settings-char-name').textContent = CHAR_TYPES[selectedIdx].name;
  }

  content.querySelector('#char-prev').addEventListener('click', () => {
    selectedIdx = (selectedIdx - 1 + TOTAL) % TOTAL;
    update();
  });
  content.querySelector('#char-next').addEventListener('click', () => {
    selectedIdx = (selectedIdx + 1) % TOTAL;
    update();
  });
  content.querySelector('#char-confirm-btn').addEventListener('click', () => {
    AppState.updateCharacterType(selectedIdx);
    ModalManager.close();
    showToast(`${CHAR_TYPES[selectedIdx].name}으로 변경됐어요!`, 'success');
    if (typeof updateHomeCharCard === 'function') updateHomeCharCard();
  });
}

/* ---- Day Popup ---- */
function showDayPopup(dateStr, year, month, day) {
  const s           = AppState.getState();
  const isToday     = dateStr === s.todayDate;
  const dayExpenses = s.expenses.filter(e => e.date === dateStr);
  const dayTotal    = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dayHistory  = s.piggyHistory.filter(h => h.date === dateStr);
  const isSettled   = dayHistory.length > 0;
  const piggyDelta  = isSettled ? dayHistory.reduce((sum, h) => sum + h.delta, 0) : 0;
  const piggyStr    = isSettled
    ? (piggyDelta >= 0 ? '+' : '') + formatKRW(piggyDelta)
    : '-';

  // 오늘이거나 정산된 날짜일 때만 수정 버튼 표시
  const canEdit = isToday || isSettled;

  const content = el('div', { class: 'day-popup-wrap' });
  content.innerHTML = `
    <div class="day-popup-top">
      <div class="day-popup-title">${month}월 ${day}일</div>
      <button class="day-popup-close" id="day-close-btn">×</button>
    </div>
    <div class="day-popup-divider"></div>
    <div class="day-popup-row">
      <span class="day-popup-label">지출:</span>
      <span class="day-popup-value">${dayTotal > 0 ? formatKRW(dayTotal) : '-'}</span>
    </div>
    <div class="day-popup-row">
      <span class="day-popup-label">저금통:</span>
      <span class="day-popup-value" id="day-piggy-value">${piggyStr}</span>
    </div>
    <div class="day-popup-divider"></div>
    ${canEdit ? `
      <button class="ob-next-btn ob-start-btn" id="day-edit-btn" style="margin-top:12px">• 지출 수정 •</button>
    ` : ''}
  `;
  ModalManager.open(content);

  content.querySelector('#day-close-btn').addEventListener('click', () => ModalManager.close());

  content.querySelector('#day-edit-btn')?.addEventListener('click', () => {
    ModalManager.close();
    if (isToday) {
      if (typeof toggleExpenseSheet === 'function') toggleExpenseSheet(true);
    } else {
      _showPastExpenseEditModal(dateStr, month, day);
    }
  });
}

/* ---- Past Expense Edit Modal (날짜별 지출 수정) ---- */
function _showPastExpenseEditModal(dateStr, month, day) {
  const content = el('div', {});
  let addMode = false;
  let selectedCat = null;

  function getData() {
    const s = AppState.getState();
    const dayExpenses = s.expenses.filter(e => e.date === dateStr);
    const dayTotal    = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const histEntry   = s.piggyHistory.find(h => h.date === dateStr);
    const delta       = histEntry ? histEntry.delta : (s.dailyBudget - dayTotal);
    return { dayExpenses, dayTotal, delta };
  }

  function render() {
    const { dayExpenses, dayTotal, delta } = getData();

    if (addMode) {
      content.innerHTML = `
        <div class="modal-header">
          <div class="modal-title">${month}월 ${day}일 지출 추가</div>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">금액 (원)</label>
          <input class="input-field" id="past-add-amount" type="number" placeholder="0" inputmode="numeric"/>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">카테고리</label>
          <div class="category-grid" id="past-cat-grid" style="margin-bottom:0"></div>
        </div>
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">메모 (선택)</label>
          <input class="input-field" id="past-add-memo" type="text" placeholder="메모"/>
        </div>
        <div class="modal-footer" style="margin-top:4px">
          <button class="btn btn-ghost" id="past-back-btn">← 뒤로</button>
          <button class="btn btn-primary" id="past-save-btn">저장</button>
        </div>
      `;

      const grid = content.querySelector('#past-cat-grid');
      CATEGORIES.forEach(cat => {
        const chip = el('div', { class: `category-chip${selectedCat === cat.id ? ' active' : ''}` });
        chip.innerHTML = `<span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span>`;
        chip.addEventListener('click', () => {
          selectedCat = cat.id;
          grid.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        });
        grid.appendChild(chip);
      });

      content.querySelector('#past-back-btn').addEventListener('click', () => {
        addMode = false; selectedCat = null; render();
      });
      content.querySelector('#past-save-btn').addEventListener('click', () => {
        const amount = parseInt(content.querySelector('#past-add-amount').value || '0');
        const memo   = (content.querySelector('#past-add-memo').value || '').trim();
        if (amount <= 0) { animateShake(content.querySelector('#past-add-amount')); return; }
        if (!selectedCat)  { showToast('카테고리를 선택해주세요', 'warning'); return; }
        AppState.addExpenseForDate(amount, selectedCat, memo, dateStr);
        addMode = false; selectedCat = null; render();
      });

    } else {
      content.innerHTML = `
        <div class="modal-header">
          <div class="modal-title">${month}월 ${day}일 지출 수정</div>
        </div>
        <div id="past-exp-list" style="max-height:180px;overflow-y:auto;margin-bottom:8px">
          ${dayExpenses.length === 0
            ? '<div style="text-align:center;color:var(--muted);padding:12px;font-size:13px">지출 내역이 없어요</div>'
            : dayExpenses.map(e => {
                const cat = CATEGORIES.find(c => c.id === e.category);
                return `
                  <div class="settle-row" style="align-items:center">
                    <span style="flex:1">${cat ? cat.icon : '📦'} ${cat ? cat.name : e.category} · ${formatKRW(e.amount)}</span>
                    <button class="past-del-btn" data-id="${e.id}"
                      style="background:none;border:none;color:var(--red);font-size:1.3rem;cursor:pointer;padding:0 4px;line-height:1">×</button>
                  </div>
                `;
              }).join('')
          }
        </div>
        <div class="settle-divider"></div>
        <div class="settle-row">
          <span class="settle-label">합계</span>
          <span class="settle-val" style="color:var(--red)">${dayTotal > 0 ? formatKRW(dayTotal) : '-'}</span>
        </div>
        <div class="settle-row">
          <span class="settle-label">저금통</span>
          <span class="settle-val" style="color:${delta >= 0 ? 'var(--green)' : 'var(--red)'}">
            ${(delta >= 0 ? '+' : '') + formatKRW(delta)}
          </span>
        </div>
        <div class="modal-footer" style="margin-top:12px">
          <button class="btn btn-ghost" id="past-close-btn">닫기</button>
          <button class="btn btn-primary" id="past-add-toggle">+ 지출 추가</button>
        </div>
      `;

      content.querySelectorAll('.past-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          AppState.removeExpense(Number(btn.dataset.id));
          render();
        });
      });
      content.querySelector('#past-close-btn').addEventListener('click', () => ModalManager.close());
      content.querySelector('#past-add-toggle').addEventListener('click', () => {
        addMode = true; render();
      });
    }
  }

  render();
  ModalManager.open(content);
}

/* ---- Month Summary Popup ---- */
function showMonthPopup(year, month) {
  const s        = AppState.getState();
  const goal     = s.goal;
  const monthBudget = s.dailyBudget * 30;
  const saved    = Math.max(0, s.piggyBalance || 0);
  const goalAmt  = goal && goal.targetAmount > 0 ? goal.targetAmount : 0;
  const months   = goal && goal.timelineMonths ? goal.timelineMonths : 0;

  const content = el('div', { class: 'month-popup-wrap' });
  content.innerHTML = `
    <div class="month-popup-close-row">
      <button class="day-popup-close" id="month-close-btn">×</button>
    </div>
    <div class="month-popup-row">
      <span class="month-popup-label">한 달 예산</span>
      <span class="month-popup-value">${formatKRW(monthBudget)}</span>
    </div>
    <div class="month-popup-divider"></div>
    <div class="month-popup-row">
      <span class="month-popup-label">목표달성</span>
      <span class="month-popup-value">${formatKRW(saved)}/${months}개월</span>
    </div>
    <div class="month-popup-divider"></div>
    <div class="month-popup-row">
      <span class="month-popup-label">하루 예산</span>
      <span class="month-popup-value">${formatKRW(s.dailyBudget)}</span>
    </div>
  `;
  ModalManager.open(content);
  content.querySelector('#month-close-btn').addEventListener('click', () => ModalManager.close());
}

/* ---- Goal Change Modal ---- */
function showGoalChangeModal() {
  const s = AppState.getState();
  const g = s.goal || {};

  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">목표 변경</div>
    </div>
    <div class="input-group" style="margin-bottom:12px">
      <label class="ob-field-label">목표</label>
      <input class="ob-input" id="goal-name-input" value="${escapeHTML(g.name)}" placeholder="목표 이름"/>
    </div>
    <div class="input-group" style="margin-bottom:12px">
      <label class="ob-field-label">금액</label>
      <input class="ob-input" id="goal-amount-input" type="number" value="${g.targetAmount || ''}" placeholder="00,000원"/>
    </div>
    <div class="input-group" style="margin-bottom:20px">
      <label class="ob-field-label">기간</label>
      <input class="ob-input" id="goal-months-input" type="number" value="${g.timelineMonths || 6}" min="1" max="60" placeholder="00개월"/>
    </div>
    <button class="ob-next-btn ob-start-btn" id="goal-save-btn">▶ 닫기 ◀</button>
  `;
  ModalManager.open(content);

  content.querySelector('#goal-save-btn').addEventListener('click', () => {
    const name   = content.querySelector('#goal-name-input').value.trim();
    const amount = parseInt(content.querySelector('#goal-amount-input').value || '0');
    const months = parseInt(content.querySelector('#goal-months-input').value || '6');

    if (!name || amount <= 0) {
      showToast('이름과 금액을 입력해주세요.', 'error');
      animateShake(content.querySelector(!name ? '#goal-name-input' : '#goal-amount-input'));
      return;
    }

    AppState.updateGoal({ name, targetAmount: amount, timelineMonths: months });
    ModalManager.close();
    showToast('목표가 변경됐어요! 🎯', 'success');
    AppState.navigate('mypage');
  });
}

/* ---- ETF Investment Modal (권유 팝업) ---- */
function showETFModal(surplus, onClose) {
  const content = el('div', { class: 'etf-modal' });
  content.innerHTML = `
    <div class="settle-emoji" id="etf-emoji">📈</div>
    <div class="settle-title">이번 달 목표 저축 달성!</div>
    <div class="settle-sub">이번 달 저축 목표를 넘었어요 🎉<br>초과 저축분 <strong>${formatKRW(surplus)}</strong>, ETF로 불려볼까요?</div>
    <div class="settle-divider"></div>
    <div class="etf-nudge-desc">ETF는 소액으로 시작할 수 있는<br>분산 투자 방법이에요.<br>종목별 장단점과 맞춤 추천을 확인해보세요!</div>
    <div class="settle-divider"></div>
    <button class="settle-ok-btn" id="etf-start-btn">📈 ETF 투자 알아보기</button>
    <button class="etf-later-btn" id="etf-later-btn">나중에 볼게요</button>
  `;
  ModalManager.open(content, '', true);
  setTimeout(() => launchConfetti(40), 100);
  setTimeout(() => animateBounce(content.querySelector('#etf-emoji')), 50);

  content.querySelector('#etf-start-btn').addEventListener('click', () => {
    ModalManager.close();
    onClose?.();
    AppState.navigate('etf');
  });
  content.querySelector('#etf-later-btn').addEventListener('click', () => {
    ModalManager.close();
    onClose?.();
  });
}

/* ---- Add Friend Modal ---- */
function showAddFriendModal() {
  const s = AppState.getState();
  const content = el('div', {});
  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">👥 친구 추가</div>
      <div class="modal-subtitle">친구 초대 코드를 입력하세요</div>
    </div>
    <div class="input-group" style="margin-bottom:var(--space-4)">
      <label class="input-label">내 초대 코드</label>
      <div class="invite-code">${s.inviteCode}</div>
    </div>
    <div class="input-group" style="margin-bottom:var(--space-4)">
      <label class="input-label">코드 입력</label>
      <input class="input-field" id="friend-code-input" placeholder="예: AB12CD"
             maxlength="6" style="text-transform:uppercase;font-weight:900;font-size:1.2rem;letter-spacing:4px"/>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="friend-cancel">취소</button>
      <button class="btn btn-secondary" id="friend-add">추가하기</button>
    </div>
  `;
  ModalManager.open(content);
  content.querySelector('#friend-code-input').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
  content.querySelector('#friend-cancel')?.addEventListener('click', () => ModalManager.close());
  content.querySelector('#friend-add')?.addEventListener('click', () => {
    const code = content.querySelector('#friend-code-input').value.trim();
    if (code.length < 4) { animateShake(content.querySelector('#friend-code-input')); return; }
    AppState.addFriend(`친구_${code}`);
    ModalManager.close();
    showToast('친구가 추가됐어요! 🎉', 'success');
  });
}
