/* ===========================================
   CONFIG.PUBLIC.JS — 게이트웨이 모드 공개 기본값

   js/config.js(로컬 개인 키, gitignore)가 없을 때만 활성화된다.
   - GitHub Pages 라이브 데모가 이 경로를 탄다.
   - 키 대신 "에이전트 이름"만 넣고, 실제 Dify 키는
     Cloudflare Worker(gateway/) secret에만 존재한다.
   - DIFY_GATEWAY_URL이 null이면 지금처럼 AI 기능이 조용히 꺼진다
     (게이트웨이 배포 후 URL을 채우면 라이브 데모에서 AI 활성화).
   =========================================== */
if (typeof DIFY_API_KEY === 'undefined') {
  // 게이트웨이 배포 후 https://zoomoney-gateway.<서브도메인>.workers.dev 로 교체
  window.DIFY_GATEWAY_URL     = null;

  window.DIFY_API_KEY          = 'goal';     // 목표 설정
  window.DIFY_ANALYSIS_API_KEY = 'analysis'; // 소비 분석
  window.DIFY_BUDGET_API_KEY   = 'budget';   // 예산 플래닝
  window.DIFY_TRAINER_API_KEY  = 'trainer';  // 트레이너 챗봇
  window.DIFY_SUMMARY_API_KEY  = 'summary';  // 소비요약 / 정산 코멘트
  window.ETF_AGENT_KEY         = 'etf';      // ETF 코치
  window.REMOVEBG_API_KEY      = '';
}
