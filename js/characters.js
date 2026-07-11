/* ===========================================
   CHARACTERS.JS — PiggyQuest
   8종 동물 캐릭터 시스템
   파일 규칙: images/animal/[id]_step[1-5]_[good|sad].png
   =========================================== */
'use strict';

/* ── 캐릭터 타입 정의 (8종) ── */
const CHAR_TYPES = [
  { id: 'dog',      name: '강아지' },
  { id: 'elephant', name: '코끼리' },
  { id: 'fox',      name: '사막여우' },
  { id: 'gorila',   name: '고릴라' },
  { id: 'mulgae',   name: '물개'   },
  { id: 'panda',    name: '판다'   },
  { id: 'penguin',  name: '펭귄'   },
  { id: 'weasel',   name: '미어캣' },
];

/* ── 하위 호환용 (onboarding 썸네일) ── */
const CHARACTERS = CHAR_TYPES.map(c => `images/animal/${c.id}_step1_good.png`);

/* ── step 접두사 ── */
const _STEP_PREFIXES = ['새싹', '성장', '단단', '강인', '전설'];

/* ── 스텝별 이름 반환 ── */
function getCharStepName(typeIdx, step) {
  const type   = CHAR_TYPES[Math.max(0, Math.min(typeIdx, CHAR_TYPES.length - 1))];
  const prefix = _STEP_PREFIXES[(step - 1)] || '새싹';
  return `${prefix} ${type.name}`;
}

/* ── 커스텀 캐릭터 이름으로 표시 (petName 지정 시) ──
   charName은 사용자 입력이므로 innerHTML에 들어가기 전 escape */
function getCharDisplayName(step, charName) {
  const prefix = _STEP_PREFIXES[(step - 1)] || '새싹';
  return `${prefix} ${escapeHTML(charName) || '도토리'}`;
}

/* ── 하위 호환: CHARACTER_NAMES[step-1] 패턴 유지 ──
   실제 동물 이름은 getCharStepName 사용 권장        */
const CHARACTER_NAMES = _STEP_PREFIXES;

/* ── 스텝별 설명 ── */
const CHARACTER_DESCS = [
  '이제 막 절약을 시작했어요.',
  '조금씩 성장 중이에요!',
  '절약이 습관이 되고 있어요.',
  '강인한 절약러로 성장했어요!',
  '전설의 절약러! 최고예요! 👑',
];

/* ── 저축 진행률로 현재 STEP 계산 (1~5) ── */
function calcCharStep(s) {
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

/* ── 전날 예산 초과 여부 → sad 표시 ── */
function isCharSad(s) {
  const hist = s.piggyHistory || [];
  if (hist.length === 0) return false;
  return hist[hist.length - 1].delta < 0;
}

/* ── 개별 프레임 이미지 경로 반환 ── */
function getFrameImageSrc(typeIdx, step, sad) {
  const type = CHAR_TYPES[Math.max(0, Math.min(typeIdx, CHAR_TYPES.length - 1))];
  const mood = sad ? 'sad' : 'good';
  return `images/animal/${type.id}_step${step}_${mood}.png`;
}

/* ── 스프라이트 div 인라인 스타일 (개별 이미지 방식) ── */
function charDivStyle(typeIdx, step, sad) {
  const url = getFrameImageSrc(typeIdx, step, sad);
  return `background-image:url('${url}');background-size:contain;background-position:center;background-repeat:no-repeat;`;
}

/* ── 현재 앱 상태에 맞는 스타일 계산 ── */
function currentCharDivStyle(s) {
  const typeIdx = s.characterType || 0;
  const step    = calcCharStep(s);
  const sad     = isCharSad(s);
  return charDivStyle(typeIdx, step, sad);
}
