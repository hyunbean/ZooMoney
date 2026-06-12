/* ===========================================
   TUTORIAL.JS — 주머니
   스크린샷 기반 슬라이드쇼 튜토리얼
   =========================================== */
'use strict';

const Tutorial = (() => {

  const STEPS = [
    { img: 'images/tutorial/home_1.png' },
    { img: 'images/tutorial/home_2.png' },
    { img: 'images/tutorial/home_3.png' },
    { img: 'images/tutorial/home_4.png' },
    { img: 'images/tutorial/home_5.png' },
  ];

  const STEPS_TODAY = [
    { img: 'images/tutorial/today_1.png' },
    { img: 'images/tutorial/today_2.png' },
  ];

  const STEPS_SOCIAL = [
    { img: 'images/tutorial/social_1.png' },
    { img: 'images/tutorial/social_2.png' },
    { img: 'images/tutorial/social_3.png' },
    { img: 'images/tutorial/social_4.png' },
    { img: 'images/tutorial/social_5.png' },
  ];

  const STEPS_MYPAGE = [
    { img: 'images/tutorial/mypage_1.png' },
    { img: 'images/tutorial/mypage_2.png' },
    { img: 'images/tutorial/mypage_3.png' },
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
          <img class="tut-slide-img" src="${step.img}" alt="튜토리얼"/>
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
