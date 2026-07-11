/* ===========================================
   APP.JS — PiggyQuest
   Main entry point: boot, routing, event wiring
   =========================================== */
'use strict';

/* ── 반응형 스케일: 480px 디자인을 화면 너비에 맞춰 축소(데스크톱은 1.3 유지) ── */
(function fitToScreen() {
  var DESIGN_W = 480;
  function apply() {
    var z = Math.min(1.3, window.innerWidth / DESIGN_W);
    var b = document.body;
    if (!b) return;
    b.style.zoom = z;
    b.style.width = DESIGN_W + 'px';
    b.style.height = (window.innerHeight / z) + 'px';
  }
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  if (document.body) apply();
  else document.addEventListener('DOMContentLoaded', apply);
})();

/* ── PopupQueue: 팝업을 순서대로 하나씩 표시 ── */
const PopupQueue = (() => {
  const queue = [];
  let running = false;

  function next() {
    if (queue.length === 0) { running = false; return; }
    running = true;
    const showFn = queue.shift();
    showFn(next);   // next를 onClose 콜백으로 전달
  }

  function push(showFn) {
    queue.push(showFn);
    if (!running) next();   // 아무것도 안 보이는 중이면 바로 시작
  }

  function clear() { queue.length = 0; running = false; }

  return { push, clear };
})();

const App = (() => {
  let currentScreen = null;

  /* ---------- Boot ---------- */
  function init() {
    ModalManager.init();
    const onboarded = AppState.init();

    // Subscribe to state events
    subscribeEvents();

    // Simulate loading
    const loadBar = document.getElementById('loading-bar');
    if (loadBar) {
      loadBar.style.width = '100%';
    }

    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.transition = 'opacity 0.5s ease';
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.remove();
          // Navigate to first screen
          if (onboarded) {
            navigateTo('home');
          } else {
            navigateTo('onboarding');
          }
        }, 500);
      }
    }, 1800);
  }

  /* ---------- Navigation ---------- */
  function navigateTo(screenId) {
    const app = document.getElementById('app');
    if (!app) return;

    // Close any open sheets
    if (typeof toggleExpenseSheet === 'function') toggleExpenseSheet(false);
    ModalManager.close();

    // Remove existing screen (but keep loading screen)
    const existingScreen = app.querySelector('.screen:not(.loading-screen)');
    const delay = existingScreen ? 220 : 0;
    if (existingScreen) {
      existingScreen.style.animation = 'fadeOut 0.2s ease both';
      setTimeout(() => existingScreen.remove(), 200);
    }

    // Build new screen after old one fades
    setTimeout(() => {
      let screen;
      switch (screenId) {
        case 'onboarding':
          screen = renderOnboardingScreen();
          break;
        case 'home':
          screen = renderHomeScreen();
          break;
        case 'mypage':
          screen = renderMypageScreen();
          break;
        case 'social':
          screen = renderSocialScreen();
          break;
        case 'piggy':
          screen = renderPiggyScreen();
          break;
        case 'today':
          screen = renderTodayScreen();
          break;
        case 'trainer_chat':
          screen = renderTrainerChatScreen();
          break;
        case 'budget':
          screen = renderBudgetScreen();
          break;
        case 'shop':
          screen = renderShopScreen();
          break;
        case 'etf':
          screen = renderETFScreen();
          break;
        default:
          screen = renderHomeScreen();
      }

      if (screen) {
        app.appendChild(screen);
        currentScreen = screenId;
        if (screenId === 'home') _checkMonthlyReport();
        // [튜토리얼 임시 비활성화]
        // if (screenId === 'today' && typeof Tutorial !== 'undefined') { ... }
        // if (screenId === 'social' && typeof Tutorial !== 'undefined') { ... }
        // if (screenId === 'mypage' && typeof Tutorial !== 'undefined') { ... }
      }
    }, delay);
  }

  /* ---------- Event Subscriptions ---------- */
  function subscribeEvents() {
    // Navigation
    AppState.on('NAVIGATE', ({ screen }) => {
      if (screen !== currentScreen) {
        navigateTo(screen);
      }
    });

    // Onboarding complete → tutorial → home
    AppState.on('ONBOARDING_COMPLETE', ({ dailyBudget }) => {
      setTimeout(() => {
        launchConfetti(30);
        // 튜토리얼이 정의돼 있으면 튜토리얼 시작, 없으면 바로 홈으로
        if (false && typeof Tutorial !== 'undefined') { // [튜토리얼 임시 비활성화]
          Tutorial.show();
        } else {
          navigateTo('home');
          showToast(`하루 예산 ${formatKRW(dailyBudget)}로 시작!`, 'success', 4000);
        }
      }, 400);
    });

    // Expense added → update home UI reactively
    AppState.on('EXPENSE_ADDED', ({ expense }) => {
      if (currentScreen === 'home' || currentScreen === 'today') {
        if (typeof updateHomeBudget === 'function') updateHomeBudget();
        if (typeof updateHomeExpenseList === 'function') updateHomeExpenseList();
        if (typeof updateTodayExpenseList === 'function') updateTodayExpenseList();

        // Spawn coin particles from FAB
        const fab = document.getElementById('fab-add');
        if (fab) {
          const rect = fab.getBoundingClientRect();
          burstParticles('💸', 4, rect.left, rect.top);
        }
      }
    });

    // Expense removed → refresh home
    AppState.on('EXPENSE_REMOVED', () => {
      if (currentScreen === 'home' || currentScreen === 'today') {
        if (typeof updateHomeBudget === 'function') updateHomeBudget();
        if (typeof updateHomeExpenseList === 'function') updateHomeExpenseList();
        if (typeof updateTodayExpenseList === 'function') updateTodayExpenseList();
        if (typeof updateHomePiggyCard === 'function') updateHomePiggyCard();
      }
      if (currentScreen === 'piggy') {
        if (typeof updatePiggyProgress === 'function') updatePiggyProgress();
      }
    });

    // Budget warning
    AppState.on('BUDGET_WARNING', () => {
      showToast('⚠️ 예산의 80%를 사용했어요! 조심하세요!', 'warning');
    });

    // Budget exceeded
    AppState.on('BUDGET_EXCEEDED', () => {
      showToast('🚨 예산을 초과했어요!', 'error');
      const dashboard = document.querySelector('.budget-dashboard');
      if (dashboard) animateShake(dashboard);
    });

    // 오늘 정산을 이미 마쳐서 재클릭이 차단된 경우
    AppState.on('SETTLE_BLOCKED', () => {
      showToast('오늘 정산은 이미 끝났어요! 내일 다시 만나요 🙌', 'info');
    });

    // Day settled → 정산 팝업을 큐에 먼저 넣음
    // (LEVEL_UP / BADGE_EARNED 이벤트는 settleDay() 내부에서 동기로 발생하므로
    //  이 핸들러 직후에 큐에 추가됨 → 자동으로 정산 → 레벨업 → 뱃지 순서 보장)
    AppState.on('DAY_SETTLED', (data) => {
      // 화면별 reactive UI 업데이트
      setTimeout(() => {
        if (currentScreen === 'home') {
          updateHomeBudget();
          updateHomeExpenseList();
          updateHomePiggyCard();
          updateHomeCharCard();
        }
        // 목표탭이 열려있으면 진행률 즉시 반영
        if (currentScreen === 'piggy') {
          if (typeof updatePiggyProgress === 'function') updatePiggyProgress();
        }
      }, 300);

      // 절약 성공 시 코인 +1
      if (data.delta >= 0 && typeof addShopCoins === 'function') addShopCoins(1);

      // 팝업 큐에 정산 결과 추가 (첫 번째)
      PopupQueue.push((onClose) => showDailySettleModal(data, onClose));
      _checkETFSuggestion();
    });

    // Level up → 큐에 두 번째로 추가
    AppState.on('LEVEL_UP', ({ level }) => {
      // 코스메틱 아이템 잠금 해제
      if (typeof COSMETIC_ITEMS !== 'undefined') {
        COSMETIC_ITEMS.forEach(item => {
          if (item.minLevel <= level) AppState.unlockItem(item.id);
        });
      }
      PopupQueue.push((onClose) => showLevelUpModal(level, onClose));
    });

    // Level down → 큐에 추가
    AppState.on('LEVEL_DOWN', ({ level }) => {
      PopupQueue.push((onClose) => showLevelDownModal(level, onClose));
    });

    // Badge earned → 팝업 없이 조용히 획득 (마이페이지 배지탭에서 확인)
    AppState.on('BADGE_EARNED', ({ badgeId }) => {
      showToast('🏅 새 배지 획득! 마이페이지에서 확인해봐', 'success', 3000);
    });

    // Shield used → 홈 연속 일수 즉시 갱신
    AppState.on('SHIELD_USED', () => {
      if (currentScreen === 'home') {
        if (typeof updateHomeCharCard === 'function') updateHomeCharCard();
        if (typeof updateHomeStreakRow === 'function') updateHomeStreakRow();
      }
    });

    // Piggy history edited → refresh calendar + piggy progress
    // 모달이 열려있을 경우 닫힌 후에 화면 갱신 (모달 내부 편집 도중 닫히지 않도록)
    AppState.on('PIGGY_HISTORY_UPDATED', () => {
      const modalOpen = !document.getElementById('modal-container')?.classList.contains('hidden');
      if (currentScreen === 'today') {
        if (modalOpen) {
          // 모달 닫힐 때까지 대기 후 갱신
          const checkClose = setInterval(() => {
            if (document.getElementById('modal-container')?.classList.contains('hidden')) {
              clearInterval(checkClose);
              navigateTo('today');
            }
          }, 100);
        } else {
          navigateTo('today');
        }
      }
      if (currentScreen === 'piggy') {
        if (typeof updatePiggyProgress === 'function') updatePiggyProgress();
      }
      if (currentScreen === 'home') {
        if (typeof updateHomePiggyCard === 'function') updateHomePiggyCard();
      }
    });

    // Budget updated (from modal)
    AppState.on('BUDGET_UPDATED', () => {
      if (currentScreen === 'home') {
        updateHomeBudget();
      }
    });

    // Friend added
    AppState.on('FRIEND_ADDED', () => {
      if (currentScreen === 'social') {
        navigateTo('social');
      }
    });
  }

  /* ── ETF 투자 유도 체크 (이번 달 저축분 >= 월 저축 목표 시, 월 1회) ── */
  function _checkETFSuggestion() {
    const s = AppState.getState();
    if (!s.goal || !s.goal.monthlyTarget) return;

    const todayYM = (s.todayDate || getTodayStr()).slice(0, 7);
    if (localStorage.getItem('pq_etfMonth') === todayYM) return;

    const monthlySaved = (s.piggyHistory || [])
      .filter(h => h.date && h.date.slice(0, 7) === todayYM && h.delta > 0)
      .reduce((sum, h) => sum + h.delta, 0);

    if (monthlySaved < s.goal.monthlyTarget) return;

    localStorage.setItem('pq_etfMonth', todayYM);
    const surplus = monthlySaved - s.goal.monthlyTarget;
    PopupQueue.push((onClose) => showETFModal(surplus, onClose));
  }

  /* ── 월간 리포트 체크 ── */
  function _checkMonthlyReport() {
    const s = AppState.getState();
    const todayYM = (s.todayDate || getTodayStr()).slice(0, 7);
    const prevMonths = (s.piggyHistory || [])
      .filter(h => h.date && h.date.slice(0, 7) < todayYM)
      .map(h => h.date.slice(0, 7));
    if (!prevMonths.length) return;
    const completedMonth = prevMonths.sort().reverse()[0];
    const lastShown = localStorage.getItem('pq_lastReportMonth');
    if (completedMonth !== lastShown) {
      localStorage.setItem('pq_lastReportMonth', completedMonth);
      setTimeout(() => {
        PopupQueue.push((onClose) => _showMonthlyReport(s, onClose));
      }, 800);
    }
  }

  return { init };
})();

/* ---- Boot on DOM ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash-screen');
  const loading = document.getElementById('loading-screen');

  splash.addEventListener('click', () => {
    splash.classList.add('splash-out');
    setTimeout(() => {
      splash.remove();
      loading.style.display = '';
      App.init();
    }, 600);
  }, { once: true });
});
