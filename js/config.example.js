/* ===========================================
   CONFIG.EXAMPLE.JS — 주머니(ZooMoney)

   사용법:
   1. 이 파일을 js/config.js 로 복사
   2. 아래 값을 Dify(dify.ai) 콘솔 → 각 앱 → API 액세스에서
      발급받은 실제 키로 교체 (remove.bg는 remove.bg 대시보드)
   3. js/config.js 는 .gitignore에 등록되어 있어 커밋되지 않습니다
   =========================================== */
const DIFY_API_KEY          = 'app-xxxxxxxxxxxxxxxxxxxxxxxx'; // 목표 설정
const DIFY_ANALYSIS_API_KEY = 'app-xxxxxxxxxxxxxxxxxxxxxxxx'; // 소비 분석
const DIFY_BUDGET_API_KEY   = 'app-xxxxxxxxxxxxxxxxxxxxxxxx'; // 예산 플래닝
const DIFY_TRAINER_API_KEY  = 'app-xxxxxxxxxxxxxxxxxxxxxxxx'; // 트레이너 챗봇
const DIFY_SUMMARY_API_KEY  = 'app-xxxxxxxxxxxxxxxxxxxxxxxx'; // 소비요약 / 정산 코멘트
const ETF_AGENT_KEY         = 'app-xxxxxxxxxxxxxxxxxxxxxxxx'; // ETF 코치
const REMOVEBG_API_KEY      = '';                              // remove.bg (선택, 비우면 배경 제거 기능만 비활성화)
