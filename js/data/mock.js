/* ===========================================
   DATA/MOCK.JS — 주머니(ZooMoney)
   ⚠️ 프로토타입 범위 표시용 목업 데이터
   커뮤니티(피드/그룹/랭킹/채팅)와 친구 목록은
   백엔드 없이 데모하기 위한 정적 데이터입니다.
   =========================================== */
'use strict';

/* ── 커뮤니티 피드 게시글 ── */
const MOCK_POSTS = [
  { id:1, userId:'me', name:'나', level:3, charIdx:2,
    badge:'절약왕', badgeType:'gold', time:'방금 전', filter:'all', hasImg:false,
    content:'드디어 아이패드 Pro 살 수 있게 됐어요! 6개월 동안 배달 한 번도 안 했어요. 진짜 참길 잘했다 🐷', likes:47, comments:18, liked:false },
  { id:2, userId:'u1', name:'도토리링', level:5, charIdx:4,
    badge:'절약왕', badgeType:'gold', time:'1시간 전', filter:'tip', hasImg:true,
    content:'점심 도시락 싸 다닌 지 한 달째! 한 달에 식비 10만원 이상 아꼈어요. 강추합니다 🥗', likes:94, comments:31, liked:false },
  { id:3, userId:'u2', name:'짠돌이킹', level:2, charIdx:1,
    badge:'절약중', badgeType:'green', time:'2시간 전', filter:'auth', hasImg:false,
    content:'배달 21일째 참고 있어요! 완전 뿌듯하고 통장이 살아나는 느낌 🎉', likes:32, comments:9, liked:false },
  { id:4, userId:'u3', name:'절약요정', level:4, charIdx:3,
    badge:'인증완료', badgeType:'blue', time:'3시간 전', filter:'auth', hasImg:true,
    content:'이번 달 카페 지출 0원 인증! 집에서 핸드드립 배워서 매일 마시고 있어요. 다들 화이팅 ☕', likes:56, comments:12, liked:false },
  { id:5, userId:'u4', name:'첫차준비중', level:1, charIdx:0,
    badge:'뉴비', badgeType:'brown', time:'4시간 전', filter:'tip', hasImg:false,
    content:'편의점 대신 마트 이용하기 시작한 지 2주째예요. 같은 돈으로 훨씬 많이 살 수 있어요 🛒', likes:34, comments:11, liked:false },
  { id:6, userId:'u5', name:'절약마스터', level:3, charIdx:2,
    badge:'절약왕', badgeType:'gold', time:'5시간 전', filter:'challenge', hasImg:false,
    content:'구독 서비스 정리하고 나만의 지출 정리법 잡았어요! 월 3만원 절약 중. 여러분도 해봐요 ❤', likes:47, comments:18, liked:false },
];

/* ── 친구 목록 (친구 탭 · 정적 데모 데이터, state.friends와는 별개) ── */
const MOCK_FRIENDS = [
  { name:'도토리링',   badge:'절약왕',   badgeType:'gold',  step:4, streak:21, goalPct:72, lastDate:'2026.05.19', lastAmt:8000  },
  { name:'짠돌이킹',   badge:'절약중',   badgeType:'green', step:2, streak:8,  goalPct:38, lastDate:'2026.05.18', lastAmt:12000 },
  { name:'미래부자',   badge:'인증완료', badgeType:'blue',  step:3, streak:14, goalPct:55, lastDate:'2026.05.17', lastAmt:5000  },
  { name:'절약왕대장', badge:'절약왕',   badgeType:'gold',  step:5, streak:47, goalPct:91, lastDate:'2026.05.19', lastAmt:3000  },
];

/* ── 커뮤니티 그룹 ── */
const MOCK_GROUPS = [
  { id:1, icon:'🎯', name:'아이패드 살 사람들', level:5, category:'전자기기',
    members:312, months:6, days:24, targetAmt:1500000, savedAmt:890000,
    desc:'아이패드를 목표로 열심히 절약하는 모임! 함께하면 더 강해져요.', joined:true },
  { id:2, icon:'💰', name:'1000만원 모우기', level:3, category:'저축',
    members:156, months:12, days:189, targetAmt:10000000, savedAmt:3200000,
    desc:'1000만원 모으기 장기 프로젝트! 꾸준히 함께해요.', joined:false },
  { id:3, icon:'🚗', name:'차량 구매 준비', level:2, category:'교통',
    members:89, months:24, days:15, targetAmt:20000000, savedAmt:5600000,
    desc:'차 살 돈 같이 모아봐요. 매달 꼭 정산!', joined:false },
  { id:4, icon:'🏠', name:'전세 독립 준비', level:4, category:'주거',
    members:241, months:36, days:29, targetAmt:50000000, savedAmt:12000000,
    desc:'독립하고 싶은 사람들 모여라! 같이 힘내봐요.', joined:false },
];

/* ── 그룹 생성 아이콘 선택지 ── */
const GROUP_ICONS = ['🎯','💰','🏠','🚗','✈️','📱','🎮','👗','📚','🍕','💊','🎁'];

/* ── 그룹 채팅 ── */
const MOCK_CHATS = {
  1: [
    { name:'도토리링', charIdx:4, msg:'아이패드 목표 다들 화이팅! 저도 열심히 하겠습니다 🐷', time:'10:20', me:false },
    { name:'절약요정', charIdx:3, msg:'이거 정말 어렵네요... 맛있는 거 참기가 젤 힘들어요 😅', time:'10:35', me:false },
    { name:'짠돌이킹', charIdx:1, msg:'저도 같이 화이팅!!', time:'11:00', me:false },
  ],
};

/* ── 친구 랭킹 (친구 탭 · 정적 데모 데이터) ── */
const RANK_FRIEND_DATA = [
  { name:'짠돌이전설',   sub:'저축 마스터',  amount:72, rank:1, isMe:false },
  { name:'절약요정',     sub:'절약 기사',    amount:58, rank:2, isMe:true  },
  { name:'미래부자',     sub:'절약 기사',    amount:51, rank:3, isMe:false },
  { name:'도토리킹',     sub:'저축 마스터',  amount:44, rank:4, isMe:false },
  { name:'첫차준비중',   sub:'소비 견습생',  amount:38, rank:5, isMe:false },
];
