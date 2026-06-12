/* ===========================================
   STATE.JS — PiggyQuest Global State Manager
   =========================================== */
'use strict';

const AppState = (() => {
  /* ---------- Default / Initial ---------- */
  const DEFAULT_STATE = {
    // Auth / Onboarding
    user: null,           // { name }
    onboarded: false,

    // Saving Goal
    goal: {
      name: '',           // goal product name
      category: '',       // category id
      targetAmount: 0,    // total target price
      currentSavings: 0,  // already saved (도토리)
      monthlyExpenses: 0, // monthly living expenses
      timelineMonths: 6,  // months to achieve
      monthlyTarget: 0,       // monthly saving amount (computed)
      cardCategoryTotals: null, // {food,cafe,transport,shopping,entertain,etc} 월평균 (온보딩 분석 후 저장)
      categoryBudgets: null,    // [{id,icon,name,current,suggested,tip}] Dify 예산 제안
    },

    // Budget (daily tracking)
    monthlyBudget: 0,     // kept for compatibility
    dailyBudget: 0,       // computed from goal
    todaySpent: 0,
    todayDate: '',        // 'YYYY-MM-DD'

    // Expenses
    expenses: [],         // [{ id, amount, category, memo, time, date }]

    // Piggy bank
    piggyBalance: 0,      // accumulated ₩
    piggyHistory: [],     // [{ date, delta, reason }]

    // Character
    characterLevel: 1,    // 1-5 (XP 레벨, 경험치용)
    characterType: 0,     // 0-based index into CHAR_TYPES (선택한 캐릭터 종류)
    characterXP: 0,       // 0–9 per level
    characterItems: [],   // unlocked cosmetic ids
    characterHat: null,
    characterGlasses: null,

    // Badges
    badges: [],           // earned badge ids

    // Shield (보호권)
    shieldCount: 0,       // max 3

    // Social
    friends: [],          // [{ id, name, level, rate, char }]
    pendingRequests: [],  // [{ id, name }]
    inviteCode: '',

    // Misc
    currentScreen: 'home',
    notifications: [],
  };

  /* ---------- State & subscribers ---------- */
  let state = {};
  const subscribers = {};

  /* ---------- Persistence ---------- */
  const STORAGE_KEY = 'piggyquest_state_v1';

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state = Object.assign({}, DEFAULT_STATE, saved);
        return true;
      }
    } catch(e) {}
    return false;
  }

  /* ---------- Day rollover check ---------- */
  function checkDayRollover() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.todayDate && state.todayDate < today) {
      // Auto-settle previous day without showing modal (silent)
      _settleDaySilent();
      state.todayDate = today;
      persist();
    }
  }

  function _settleDaySilent() {
    const delta = state.dailyBudget - state.todaySpent;
    state.piggyBalance += delta;
    state.piggyHistory.push({
      date: state.todayDate,
      delta,
      reason: delta >= 0 ? '예산 절약' : '예산 초과',
    });
    // XP change
    if (delta >= 0) {
      _addXP(1);
    } else {
      _subtractXP(1);
    }
    // Reset daily
    state.todaySpent = 0;
    state.expenses = state.expenses; // keep history
  }

  /* ---------- Streak helper ---------- */
  function _calcStreakLen(history) {
    const hist = [...history].reverse();
    let n = 0;
    for (const h of hist) {
      if (h.delta >= 0 || h.shielded) n++;
      else break;
    }
    return n;
  }

  /* ---------- XP (streak 등 용도 유지, 레벨업과 분리) ---------- */
  const XP_PER_LEVEL = 10;   // 0–9 per level (10단계마다 레벨업)
  const MAX_LEVEL = 5;

  function _addXP(amount) {
    state.characterXP = Math.max(0, state.characterXP + amount);
    // XP_PER_LEVEL 초과 시 0으로 wrap (레벨업은 goal 달성률 기반으로 별도 처리)
    if (state.characterXP >= XP_PER_LEVEL) {
      state.characterXP = state.characterXP % XP_PER_LEVEL;
    }
  }

  function _subtractXP(amount) {
    state.characterXP = Math.max(0, state.characterXP - amount);
  }

  /* ---------- 목표 달성률 기반 스텝 (20% 단위) ---------- */
  function _calcGoalStep(s) {
    const goal = s.goal;
    if (!goal || goal.targetAmount <= 0) return 1;
    const saved = Math.max(0, (goal.currentSavings || 0) + (s.piggyBalance || 0));
    const ratio = saved / goal.targetAmount;
    if (ratio >= 0.8) return 5;
    if (ratio >= 0.6) return 4;
    if (ratio >= 0.4) return 3;
    if (ratio >= 0.2) return 2;
    return 1;
  }

  /* ---------- Pub/Sub ---------- */
  function on(event, callback) {
    if (!subscribers[event]) subscribers[event] = [];
    subscribers[event].push(callback);
  }
  function off(event, callback) {
    if (!subscribers[event]) return;
    subscribers[event] = subscribers[event].filter(cb => cb !== callback);
  }
  function emit(event, data) {
    if (subscribers[event]) {
      subscribers[event].forEach(cb => cb(data));
    }
    // Also emit wildcard
    if (subscribers['*']) {
      subscribers['*'].forEach(cb => cb(event, data));
    }
  }

  /* ---------- Actions ---------- */
  const actions = {

    init() {
      const loaded = loadFromStorage();
      if (!loaded) {
        state = Object.assign({}, DEFAULT_STATE);
        state.inviteCode = _generateCode();
        state.friends = _mockFriends();
        persist();
      }
      // 기존 저장 데이터에 startDate 없으면 오늘로 보정
      if (state.goal && state.goal.targetAmount > 0 && !state.goal.startDate) {
        state.goal.startDate = new Date().toISOString().slice(0, 10);
        persist();
      }
      checkDayRollover();
      return state.onboarded;
    },

    completeOnboarding(userData, goalData) {
      // goalData: { name, category, targetAmount, currentSavings, monthlyExpenses, timelineMonths }
      const remaining = Math.max(0, goalData.targetAmount - goalData.currentSavings);
      const monthlyTarget = Math.ceil(remaining / goalData.timelineMonths);
      const dailyBudget = Math.max(1000, Math.floor((goalData.monthlyExpenses - monthlyTarget) / 30));

      state.user = userData;
      const prevTotals = state.goal ? state.goal.cardCategoryTotals : null;
      state.goal = {
        name: goalData.name,
        category: goalData.category,
        targetAmount: goalData.targetAmount,
        currentSavings: goalData.currentSavings,
        monthlyExpenses: goalData.monthlyExpenses,
        timelineMonths: goalData.timelineMonths,
        monthlyTarget,
        startDate: new Date().toISOString().slice(0, 10),
        cardCategoryTotals: prevTotals,
        categoryBudgets: null,
      };
      state.monthlyBudget = goalData.monthlyExpenses;
      state.dailyBudget = dailyBudget;
      state.onboarded = true;
      state.todayDate = new Date().toISOString().slice(0, 10);
      persist();
      emit('ONBOARDING_COMPLETE', { dailyBudget });
    },

    saveCardCategoryTotals(totals) {
      if (!state.goal) return;
      state.goal.cardCategoryTotals = totals;
      persist();
    },

    saveCategoryBudgets(budgets) {
      if (!state.goal) return;
      state.goal.categoryBudgets = budgets;
      persist();
    },

    addExpense(amount, category, memo) {
      const expense = {
        id: Date.now(),
        amount: Number(amount),
        category,
        memo: memo || category,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        date: state.todayDate,
      };
      state.expenses.unshift(expense);
      state.todaySpent += expense.amount;
      persist();
      emit('EXPENSE_ADDED', { expense, todaySpent: state.todaySpent });
      _checkBudgetWarnings();
    },

    removeExpense(id) {
      const idx = state.expenses.findIndex(e => e.id === id);
      if (idx === -1) return;
      const expense = state.expenses[idx];
      state.expenses.splice(idx, 1);

      // 오늘 날짜 지출이면 todaySpent에서 차감
      if (expense.date === state.todayDate) {
        state.todaySpent = Math.max(0, state.todaySpent - expense.amount);
      } else {
        // 이미 정산된 날짜의 지출 삭제 → 해당 날짜 piggyHistory delta 재계산
        const histIdx = state.piggyHistory.findIndex(h => h.date === expense.date);
        if (histIdx !== -1) {
          const remainingSpent = state.expenses
            .filter(e => e.date === expense.date)
            .reduce((sum, e) => sum + e.amount, 0);
          const newDelta = state.dailyBudget - remainingSpent;
          state.piggyHistory[histIdx].delta = newDelta;
          state.piggyHistory[histIdx].reason = newDelta >= 0 ? '예산 절약' : '예산 초과';
          _recalculatePiggyBalance();
          persist();
          emit('EXPENSE_REMOVED', { id, todaySpent: state.todaySpent });
          emit('PIGGY_HISTORY_UPDATED', { dateStr: expense.date, newDelta, piggyBalance: state.piggyBalance });
          return;
        }
      }

      persist();
      emit('EXPENSE_REMOVED', { id, todaySpent: state.todaySpent });
    },

    settleDay() {
      const spendingDelta = state.dailyBudget - state.todaySpent;
      const dailySavings  = Math.ceil((state.goal?.monthlyTarget || 0) / 30);
      const delta         = dailySavings + spendingDelta;
      const success       = spendingDelta >= 0;
      const settledDate   = state.todayDate;

      // 정산 전 목표 스텝 기록
      const stepBefore = _calcGoalStep(state);

      // Piggy bank
      state.piggyBalance += delta;
      state.piggyHistory.push({
        date: settledDate,
        delta,
        reason: success ? '예산 절약' : '예산 초과',
      });

      // XP (streak 등 용도)
      const xpBefore = state.characterXP;
      const levelBefore = state.characterLevel;
      if (success) _addXP(1);
      else         _subtractXP(1);

      // 보호권은 상점에서 코인 30개로 구매 (자동 지급 없음)
      const shieldEarned = false;

      // 목표 달성 20% 단위 레벨업 체크
      const stepAfter = _calcGoalStep(state);
      if (stepAfter > stepBefore) {
        state.characterLevel = stepAfter;
        emit('LEVEL_UP', { level: stepAfter });
      }

      // Reset
      const prevSpent = state.todaySpent;
      state.todaySpent = 0;
      const nextDate = new Date(settledDate || new Date());
      nextDate.setDate(nextDate.getDate() + 1);
      state.todayDate = nextDate.toISOString().slice(0, 10);

      persist();
      emit('DAY_SETTLED', {
        success,
        delta,
        spendingDelta,
        prevSpent,
        settledDate,
        shieldEarned,
        shieldCount: state.shieldCount,
        xpBefore,
        levelBefore,
        newXP: state.characterXP,
        newLevel: state.characterLevel,
        piggyBalance: state.piggyBalance,
      });

      // Check badges
      _checkBadges();
    },

    useShield(dateStr) {
      if ((state.shieldCount || 0) <= 0) return false;
      const idx = state.piggyHistory.findIndex(h => h.date === dateStr);
      if (idx === -1) return false;
      state.piggyHistory[idx].shielded = true;
      state.shieldCount = Math.max(0, state.shieldCount - 1);
      persist();
      emit('SHIELD_USED', { dateStr, shieldCount: state.shieldCount });
      return true;
    },

    getShieldCount() {
      return state.shieldCount || 0;
    },

    addShield(n = 1) {
      state.shieldCount = Math.min(3, (state.shieldCount || 0) + n);
      persist();
      emit('SHIELD_UPDATED', { shieldCount: state.shieldCount });
    },

    updatePiggyHistoryEntry(dateStr, newDelta) {
      // 해당 날짜의 모든 기록을 제거하고 단일 기록으로 교체 (중복 누적 방지)
      const hasEntry = state.piggyHistory.some(h => h.date === dateStr);
      if (!hasEntry) return;
      state.piggyHistory = state.piggyHistory.filter(h => h.date !== dateStr);
      state.piggyHistory.push({ date: dateStr, delta: newDelta, reason: newDelta >= 0 ? '예산 절약' : '예산 초과' });
      state.piggyHistory.sort((a, b) => a.date.localeCompare(b.date));
      _recalculatePiggyBalance();
      persist();
      emit('PIGGY_HISTORY_UPDATED', { dateStr, newDelta, piggyBalance: state.piggyBalance });
    },

    addExpenseForDate(amount, category, memo, dateStr) {
      const expense = {
        id: Date.now(),
        amount: Number(amount),
        category,
        memo: memo || category,
        time: '00:00',
        date: dateStr,
      };
      state.expenses.unshift(expense);
      // 해당 날짜 piggyHistory delta 재계산
      const totalSpent = state.expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      const newDelta = state.dailyBudget - totalSpent;
      const histIdx = state.piggyHistory.findIndex(h => h.date === dateStr);
      if (histIdx !== -1) {
        state.piggyHistory[histIdx].delta = newDelta;
        state.piggyHistory[histIdx].reason = newDelta >= 0 ? '예산 절약' : '예산 초과';
        _recalculatePiggyBalance();
      }
      persist();
      emit('PIGGY_HISTORY_UPDATED', { dateStr, newDelta: newDelta, piggyBalance: state.piggyBalance });
      return expense;
    },

    removePiggyHistoryEntry(dateStr) {
      const histIdx = state.piggyHistory.findIndex(h => h.date === dateStr);
      if (histIdx === -1) return;
      state.piggyHistory.splice(histIdx, 1);
      _recalculatePiggyBalance();
      persist();
      emit('PIGGY_HISTORY_UPDATED', { dateStr, newDelta: null, piggyBalance: state.piggyBalance });
    },

    updateDailyBudget(amount) {
      state.dailyBudget = Math.max(0, Number(amount));
      persist();
      emit('BUDGET_UPDATED', { dailyBudget: state.dailyBudget });
    },

    updateGoal(changes) {
      Object.assign(state.goal, changes);
      // 기간이 바뀌면 시작일 리셋 (새 타임라인으로 카운트다운 재시작)
      if (changes.timelineMonths !== undefined) {
        state.goal.startDate = new Date().toISOString().slice(0, 10);
      }
      // startDate 없으면 지금 설정
      if (!state.goal.startDate) {
        state.goal.startDate = new Date().toISOString().slice(0, 10);
      }
      // Recompute derived fields if financials changed
      if (changes.targetAmount !== undefined || changes.timelineMonths !== undefined ||
          changes.currentSavings !== undefined || changes.monthlyExpenses !== undefined) {
        const remaining = Math.max(0, state.goal.targetAmount - state.goal.currentSavings);
        const monthlyTarget = Math.ceil(remaining / (state.goal.timelineMonths || 1));
        const dailyBudget = Math.max(1000, Math.floor(((state.goal.monthlyExpenses || state.dailyBudget * 30) - monthlyTarget) / 30));
        state.goal.monthlyTarget = monthlyTarget;
        state.dailyBudget = dailyBudget;
      }
      persist();
      emit('GOAL_UPDATED', { goal: state.goal });
    },

    unlockItem(itemId) {
      if (!state.characterItems.includes(itemId)) {
        state.characterItems.push(itemId);
        persist();
        emit('ITEM_UNLOCKED', { itemId });
      }
    },

    equipItem(slot, itemId) {
      state['character' + slot.charAt(0).toUpperCase() + slot.slice(1)] = itemId;
      persist();
    },

    updateUserName(name) {
      if (!state.user) state.user = {};
      state.user.name = name;
      persist();
    },

    updateCharName(charName) {
      if (!state.user) state.user = {};
      state.user.charName = charName;
      persist();
      emit('CHAR_UPDATED', {});
    },

    updateCharacterType(typeIdx) {
      state.characterType = typeIdx;
      persist();
      emit('CHAR_UPDATED', {});
    },

    addFriend(name) {
      const friend = {
        id: Date.now(),
        name,
        level: Math.ceil(Math.random() * 4) + 1,
        rate: Math.floor(Math.random() * 40 + 60),
        char: _randomChar(),
      };
      state.friends.push(friend);
      persist();
      emit('FRIEND_ADDED', { friend });
    },

    acceptRequest(id) {
      const req = state.pendingRequests.find(r => r.id === id);
      if (!req) return;
      state.pendingRequests = state.pendingRequests.filter(r => r.id !== id);
      state.friends.push({ id: req.id, name: req.name, level: req.level, rate: req.rate, char: req.char });
      persist();
      emit('REQUEST_ACCEPTED', { id });
    },

    declineRequest(id) {
      state.pendingRequests = state.pendingRequests.filter(r => r.id !== id);
      persist();
    },

    navigate(screen) {
      state.currentScreen = screen;
      emit('NAVIGATE', { screen });
    },

    getState() { return state; },
    getToday() { return state.expenses.filter(e => e.date === state.todayDate); },
    getRemainingBudget() { return state.dailyBudget - state.todaySpent; },
    getGaugePercent() {
      if (state.dailyBudget <= 0) return 0;
      return Math.min(100, (state.todaySpent / state.dailyBudget) * 100);
    },
    getXPPercent() {
      const goal = state.goal;
      if (!goal || goal.targetAmount <= 0) return 0;
      const saved    = Math.max(0, (goal.currentSavings || 0) + state.piggyBalance);
      const ratio    = Math.min(1, saved / goal.targetAmount);   // 0~1
      const segSize  = 0.2;                                       // 20% 구간
      // 현재 구간의 시작점 (0, 0.2, 0.4, 0.6, 0.8 중 하나)
      const segStart = Math.min(0.8, Math.floor(ratio / segSize) * segSize);
      // 현재 구간 내 진행률 → 0~100%
      return Math.min(100, Math.max(0, ((ratio - segStart) / segSize) * 100));
    },
    getMonthExpenses() {
      const m = new Date().toISOString().slice(0, 7);
      return state.expenses.filter(e => e.date && e.date.startsWith(m));
    },
    getSocialRanking() {
      const me = {
        id: 'me',
        name: state.user ? state.user.name : '나',
        level: state.characterLevel,
        rate: state.dailyBudget > 0 ? Math.round((1 - state.todaySpent / state.dailyBudget) * 100) : 100,
        char: CHARACTERS[state.characterLevel - 1],
        isMe: true,
      };
      const all = [me, ...state.friends.map(f => ({ ...f, isMe: false }))];
      return all.sort((a, b) => b.rate - a.rate);
    },
  };

  /* ---------- Private helpers ---------- */
  function _recalculatePiggyBalance() {
    state.piggyBalance = state.piggyHistory.reduce((sum, h) => sum + h.delta, 0);
  }

  function _checkBudgetWarnings() {
    const pct = actions.getGaugePercent();
    if (pct >= 100) emit('BUDGET_EXCEEDED');
    else if (pct >= 80) emit('BUDGET_WARNING');
  }

  function _checkBadges() {
    const s = state;
    const add = (id) => {
      if (!s.badges.includes(id)) {
        s.badges.push(id);
        emit('BADGE_EARNED', { badgeId: id });
      }
    };
    // First settlement
    if (s.piggyHistory.length >= 1) add('first_settle');
    // 3 days streak success
    const lastThree = s.piggyHistory.slice(-3);
    if (lastThree.length === 3 && lastThree.every(h => h.delta >= 0)) add('streak_3');
    // Level 3+
    if (s.characterLevel >= 3) add('level_3');
    // Level 5
    if (s.characterLevel >= 5) add('level_5');
    // Piggy saved 50k
    if (s.piggyBalance >= 50000) add('piggy_50k');
    persist();
  }

  function _generateCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  function _randomChar() {
    return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }

  function _mockFriends() {
    const names = ['지수', '민준', '서연', '예준', '지아'];
    return names.map((name, i) => ({
      id: i + 1,
      name,
      level: (i % 4) + 1,
      rate: Math.floor(Math.random() * 40 + 55),
      char: CHARACTERS[i % 5],
    }));
  }

  return { ...actions, on, off, emit, XP_PER_LEVEL, MAX_LEVEL };
})();

/* ---- Character definitions → characters.js 로 이동 ---- */
/* CHARACTERS, CHARACTER_NAMES, CHARACTER_DESCS, CHAR_TYPES 는
   characters.js 에서 정의됩니다.                           */

/* ---- Category definitions ---- */
const CATEGORIES = [
  { id: 'food',      icon: '🍽️', name: '식비' },
  { id: 'cafe',      icon: '☕', name: '카페' },
  { id: 'transport', icon: '🚌', name: '교통' },
  { id: 'shopping',  icon: '🛍️', name: '쇼핑' },
  { id: 'entertain', icon: '🎮', name: '엔터' },
  { id: 'health',    icon: '💊', name: '건강' },
  { id: 'beauty',    icon: '💄', name: '미용' },
  { id: 'etc',       icon: '📦', name: '기타' },
];

/* ---- Badge definitions ---- */
const BADGES = [
  { id: 'first_settle',  icon: '🎉', name: '첫 정산',          desc: '첫 번째 하루 정산 완료' },
  { id: 'streak_3',      icon: '🔥', name: '3일 연속',         desc: '3일 연속 예산 달성' },
  { id: 'level_3',       icon: '🌟', name: 'Lv.3 달성',        desc: '캐릭터 레벨 3 달성' },
  { id: 'level_5',       icon: '👑', name: '마스터',            desc: '캐릭터 최고 레벨 달성' },
  { id: 'social_1',      icon: '🤝', name: '친구 추가',        desc: '첫 친구 추가' },
  { id: 'rank_1',        icon: '🥇', name: '랭킹 1위',         desc: '그룹 랭킹 1위' },
  { id: 'week_goal',     icon: '🎯', name: '주간 목표',        desc: '주간 목표 달성' },
  { id: 'attend_7',      icon: '🔶', name: '7일 연속 출석!!',  desc: '7일 동안 매일 출석체크하기',     img: 'images/badges/7일연속출석.png' },
  { id: 'attend_30',     icon: '🔵', name: '한 달의 약속',     desc: '30일 연속 출석 도전하기',         img: 'images/badges/한 닿의 약속.png' },
  { id: 'zero_day',      icon: '🛡',  name: '예산 수호자',      desc: '오늘 하루 한 푼도 쓰지 않기',     img: 'images/badges/예산 수호자.png' },
  { id: 'piggy_50k',     icon: '🐷', name: '5만원 저금',       desc: '저금통 5만원 달성',               img: 'images/badges/저금통 5만원 달성.png' },
  { id: 'no_deliver',    icon: '🚫',  name: '배달앱 STOP',      desc: '7일 동안 배달 주문 안 하기',       img: 'images/badges/배달앱 STOP.png' },
  { id: 'lunchbox',      icon: '🥗',  name: '도시락 DAY',       desc: '한 끼는 도시락으로 먹기',          img: 'images/badges/도시락 DAY.png' },
  { id: 'receipt',       icon: '🧾', name: '영수증 인증',      desc: '가게부에 영수증 사진을 올려 지출 인증', img: 'images/badges/영수증 인증.png' },
  { id: 'duo',           icon: '👫', name: '단짝 듀오',        desc: '친구와 함께 챌린지 시작하기',      img: 'images/badges/단짝 듀오.png' },
  { id: 'no_cafe',       icon: '🚫', name: '카페 거절왕',      desc: '일주일 동안 카페 이용 안 하기',    img: 'images/badges/카페 거절왕.png' },
  { id: 'shopping_pro',  icon: '🛒', name: '장보기 고수',      desc: '장 볼 때 만원 이하로 끝내기',      img: 'images/badges/장보기 고수.png' },
  { id: 'cash_only',     icon: '💵', name: '현금파 입문',      desc: '일주일 카드 없이 현금만 쓰기',     img: 'images/badges/현금파 입문.png' },
  { id: 'first_step',    icon: '🌱', name: '첫 걸음',          desc: '절약 여정의 첫 시작',              img: 'images/badges/첫 걸음.png' },
  { id: 'year_promise',  icon: '🏆', name: '1년의 약속',       desc: '365일 연속 출석하기',              img: 'images/badges/1년의 약속.png' },
];
