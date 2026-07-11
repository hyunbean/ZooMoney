/* ===========================================
   TUTORIAL.JS — 주머니
   코치마크 기반 튜토리얼 (스크린샷 불필요)
   =========================================== */
'use strict';

const Tutorial = (() => {

  const STEPS = [
    { icon: '🏠', title: '홈 화면', desc: '오늘 쓸 수 있는 예산과 캐릭터 상태를 한눈에 확인해요.' },
    { icon: '💰', title: '저금통', desc: '예산을 아낄수록 저금통이 채워져요.' },
    { icon: '➕', title: '지출 기록', desc: '오른쪽 아래 + 버튼으로 오늘 쓴 돈을 바로 기록하세요.' },
    { icon: '🐾', title: '캐릭터 성장', desc: '꾸준히 저금하면 캐릭터가 성장하고 뱃지를 얻어요.' },
    { icon: '🎉', title: '시작해볼까요?', desc: '이제 준비가 끝났어요. 홈에서 시작해봐요!' },
  ];

  const STEPS_TODAY = [
    { icon: '📅', title: '오늘 탭', desc: '오늘 하루의 지출 내역을 시간순으로 볼 수 있어요.' },
    { icon: '📊', title: '카테고리별 합계', desc: '어디에 얼마를 썼는지 카테고리별로 정리돼요.' },
  ];

  const STEPS_SOCIAL = [
    { icon: '👥', title: '소셜 탭', desc: '친구들과 함께 저금 현황을 공유해요.' },
    { icon: '🏆', title: '랭킹', desc: '친구들과 저금 랭킹을 비교할 수 있어요.' },
    { icon: '💬', title: '응원 메시지', desc: '서로 응원 메시지를 주고받아요.' },
    { icon: '🎁', title: '초대 코드', desc: '초대 코드로 친구를 그룹에 초대해보세요.' },
    { icon: '✨', title: '함께 성장', desc: '함께할수록 저금이 더 즐거워져요!' },
  ];

  const STEPS_MYPAGE = [
    { icon: '👤', title: '마이페이지', desc: '내 정보와 설정을 관리할 수 있어요.' },
    { icon: '🏅', title: '뱃지 컬렉션', desc: '지금까지 모은 뱃지를 모아볼 수 있어요.' },
    { icon: '⚙️', title: '설정', desc: '닉네임, 캐릭터, 알림 등을 자유롭게 바꿔보세요.' },
  ];

  let overlayEl = null;

  /* ── 공개 API ── */
  function show()      { _runSteps(STEPS,       () => { AppState.navigate('home'); }); }
  function showToday() { _runSteps(STEPS_TODAY,  null); }
  function showTodayTips() { showToday(); }
  function showSocial()  { _runSteps(STEPS_SOCIAL,  null); }
  function showMypage()  { _runSteps(STEPS_MYPAGE,  null); }

  function _runSteps(steps, onFinish) {
    _removeOverlay();
    let current = 0;

    function render() {
      _removeOverlay();

      const isFirst = current === 0;
      const isLast  = current === steps.length - 1;
      const step    = steps[current];

      overlayEl = document.createElement('div');
      overlayEl.className = 'tut-slide-overlay';
      overlayEl.innerHTML = `
        <button class="tut-slide-skip" id="tut-skip">건너뛰기</button>
        <div class="tut-slide-img-wrap">
          <div class="tut-coach-icon">${step.icon}</div>
          <div class="tut-coach-title">${step.title}</div>
          <div class="tut-coach-desc">${step.desc}</div>
        </div>
        <div class="tut-slide-bottom">
          <div class="tut-slide-dots">
            ${steps.map((_, i) =>
              `<div class="tut-dot${i === current ? ' active' : ''}"></div>`
            ).join('')}
          </div>
          <div class="tut-slide-btns">
            <button class="tut-prev" id="tut-prev" ${isFirst ? 'disabled' : ''}>◀ 이전</button>
            <button class="tut-next" id="tut-next">${isLast ? '시작하기' : '다음 ▶'}</button>
          </div>
        </div>
      `;

      (document.getElementById('app') || document.body).appendChild(overlayEl);
      requestAnimationFrame(() => overlayEl.classList.add('visible'));

      overlayEl.querySelector('#tut-next').addEventListener('click', () => {
        if (isLast) {
          _removeOverlay();
          onFinish?.();
        } else {
          current++;
          render();
        }
      });

      overlayEl.querySelector('#tut-prev').addEventListener('click', () => {
        if (current > 0) { current--; render(); }
      });

      overlayEl.querySelector('#tut-skip').addEventListener('click', () => {
        _removeOverlay();
        onFinish?.();
      });
    }

    render();
  }

  function _removeOverlay() {
    if (!overlayEl) return;
    overlayEl.classList.remove('visible');
    const old = overlayEl;
    setTimeout(() => old.remove(), 230);
    overlayEl = null;
  }

  return { show, showToday, showTodayTips, showSocial, showMypage };
})();
