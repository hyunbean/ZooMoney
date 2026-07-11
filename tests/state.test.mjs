/* ===========================================
   STATE.TEST.MJS — 주머니(ZooMoney)
   실행: node --test tests/
   =========================================== */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, todayStr } from './setup.mjs';

function onboard(AppState, overrides = {}) {
  AppState.completeOnboarding(
    { name: '테스터' },
    Object.assign({
      name: '맥북', category: 'other', targetAmount: 2200000,
      currentSavings: 0, monthlyExpenses: 800000, timelineMonths: 6,
    }, overrides),
  );
}

/* ─── 초기화 ─── */
test('init: 신규 사용자는 온보딩 미완료 + 목업 친구 5명 + 초대코드 발급', () => {
  const { context } = createSandbox();
  const onboarded = context.AppState.init();
  const s = context.AppState.getState();
  assert.equal(onboarded, false);
  assert.equal(s.friends.length, 5);
  assert.match(s.inviteCode, /^[A-Z0-9]{6}$/);
});

test('structuredClone 버그 수정: 같은 인스턴스에서 재초기화해도 이전 목표가 새지 않음', () => {
  const { context } = createSandbox();
  context.AppState.init();
  context.AppState.updateGoal({
    targetAmount: 555555, timelineMonths: 3,
    currentSavings: 0, monthlyExpenses: 500000,
  });
  assert.equal(context.AppState.getState().goal.targetAmount, 555555);

  // 회원탈퇴 등으로 로컬스토리지를 비우고 같은 모듈 인스턴스에서 재-init
  // (Object.assign({}, DEFAULT_STATE)였다면 DEFAULT_STATE.goal이 오염되어
  //  여기서도 555555가 남아있었음)
  context.localStorage.clear();
  context.AppState.init();
  assert.equal(context.AppState.getState().goal.targetAmount, 0);
});

/* ─── 온보딩 예산 계산 ─── */
test('completeOnboarding: 월 저축목표/하루예산 계산', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  const s = context.AppState.getState();
  assert.equal(s.goal.monthlyTarget, 366667);  // ceil(2200000/6)
  assert.equal(s.dailyBudget, 14444);          // floor((800000-366667)/30)
  assert.equal(s.onboarded, true);
  assert.equal(s.todayDate, todayStr());
});

test('completeOnboarding: 저축 목표가 커도 하루 예산 최소 1,000원 보장', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState, { targetAmount: 10000000, monthlyExpenses: 500000, timelineMonths: 3 });
  assert.equal(context.AppState.getState().dailyBudget, 1000);
});

/* ─── 지출 ─── */
test('addExpense/removeExpense: todaySpent 증감', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.addExpense(5000, 'food', '점심');
  context.AppState.addExpense(3000, 'cafe', '커피');
  let s = context.AppState.getState();
  assert.equal(s.todaySpent, 8000);
  assert.equal(s.expenses.length, 2);
  assert.equal(s.expenses[0].memo, '커피'); // 최신이 앞

  context.AppState.removeExpense(s.expenses[0].id);
  s = context.AppState.getState();
  assert.equal(s.todaySpent, 5000);
});

test('getGaugePercent: 100%를 넘지 않음', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.addExpense(999999, 'etc', '');
  assert.equal(context.AppState.getGaugePercent(), 100);
});

/* ─── 하루 정산 ─── */
test('settleDay 성공: dailySavings+spendingDelta만큼 저금통 적립, 날짜 하루 전진', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.addExpense(3000, 'food', '');
  const ok = context.AppState.settleDay();
  const s = context.AppState.getState();
  const dailySavings = Math.ceil(366667 / 30); // 12223
  assert.equal(ok, true);
  assert.equal(s.piggyBalance, dailySavings + (14444 - 3000));
  assert.equal(s.piggyHistory.length, 1);
  assert.equal(s.todayDate, todayStr(1));
  assert.equal(s.todaySpent, 0);
});

test('settleDay 중복 차단: 같은 날 두 번 정산 불가', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  assert.equal(context.AppState.settleDay(), true);
  assert.equal(context.AppState.settleDay(), false);   // 차단
  assert.equal(context.AppState.getState().piggyHistory.length, 1);
});

test('settleDay 실패(예산 초과): reason이 "예산 초과"로 기록됨', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.addExpense(50000, 'shopping', '');
  context.AppState.settleDay();
  const s = context.AppState.getState();
  assert.equal(s.piggyHistory[0].reason, '예산 초과');
});

/* ─── 뱃지 (원래 정의만 있고 부여 로직이 없던 3종) ─── */
test('first_settle: 첫 정산 시 획득', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.settleDay();
  assert.ok(context.AppState.getState().badges.includes('first_settle'));
});

test('rank_1: 정산 직후(todaySpent=0)에는 항상 랭킹 1위 → 뱃지 획득', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.settleDay();
  // 정산 후 todaySpent=0 → 내 절약률 100% → 목업 친구(최대 94%)보다 항상 높음
  assert.ok(context.AppState.getState().badges.includes('rank_1'));
});

test('social_1: 첫 친구 추가 시 획득', () => {
  const { context } = createSandbox();
  context.AppState.init();
  context.AppState.addFriend('새친구');
  assert.ok(context.AppState.getState().badges.includes('social_1'));
});

test('week_goal: 7일 연속 성공 시 획득 (streak_3도 함께)', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  const s = context.AppState.getState();
  // 과거 6일 연속 성공 이력을 미리 주입 (오늘 정산까지 합쳐 7일)
  for (let i = 7; i >= 2; i--) {
    s.piggyHistory.push({ date: todayStr(-i), delta: 1000, reason: '예산 절약' });
  }
  context.AppState.settleDay();
  const badges = context.AppState.getState().badges;
  assert.ok(badges.includes('streak_3'), 'streak_3 획득');
  assert.ok(badges.includes('week_goal'), 'week_goal(7일 연속) 획득');
});

/* ─── 목표 변경 ─── */
test('updateGoal: 금액 변경 시 하루 예산 재계산', () => {
  const { context } = createSandbox();
  context.AppState.init();
  onboard(context.AppState);
  context.AppState.updateGoal({ targetAmount: 1100000 });
  const s = context.AppState.getState();
  assert.equal(s.goal.monthlyTarget, 183334); // ceil(1100000/6)
  assert.equal(s.dailyBudget, Math.floor((800000 - 183334) / 30));
});

/* ─── 유틸 ─── */
test('escapeHTML: 스크립트 삽입 문자를 무해화', () => {
  const { context } = createSandbox();
  assert.equal(
    context.escapeHTML(`<img src=x onerror="alert('x')">`),
    '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;',
  );
  assert.equal(context.escapeHTML(null), '');
  assert.equal(context.escapeHTML(undefined), '');
});

test('getTodayStr: UTC가 아닌 로컬 날짜 필드(getFullYear/Month/Date) 기준', () => {
  const { context } = createSandbox();
  const d = new Date(2026, 0, 5, 23, 30, 0); // 로컬 2026-01-05 23:30
  assert.equal(context.getTodayStr(d), '2026-01-05');
});
