# 프롬프트 변경 이력 (Prompt Changelog)

`dify/*.yml`(Dify Chatflow DSL export)에 담긴 프롬프트/분류 지침의 변경 이력을
`git log --follow`로 재구성한 기록입니다. 실제 커밋 히스토리에서 확인된 내용만 적었고,
커밋 메시지가 근거를 제공하지 않는 부분은 추측하지 않고 그대로 표시했습니다.

이 저장소의 Dify 프롬프트 히스토리는 총 3개 커밋(2026-07-11 ~ 2026-07-27)으로 짧습니다 —
대부분 파일명 정리·플러그인 버전 갱신이고, 실제 프롬프트/분류 지침 내용이 바뀐 것은 마지막
커밋 한 번뿐입니다.

## 2026-07-11 · `c7589f8` · Add Dify agent DSL exports and link them from the README

- **변경 파일**: `dify/목표설정.yml`, `dify/소비분석.yml`, `dify/예산분석.yml`,
  `dify/트레이너챗봇.yml`, `dify/소비요약.yml`, `dify/ETF_chatbot.yml` (당시 한글 파일명) 최초 추가.
- **무엇이 바뀌었나**: 6개 Dify 워크플로(트레이너챗봇 포함)의 DSL을 Dify 콘솔에서 export한
  그대로 저장소에 처음 커밋. 트레이너챗봇의 질문분류기(`question-classifier`) 노드는 이 시점에
  class-1~6 라벨과 `instruction: ''`(공란)으로 최초 정의됨.
- **왜**: README에서 각 에이전트의 DSL을 링크해 워크플로 구조·프롬프트·모델 설정을 확인할 수
  있게 하기 위함 (커밋 메시지 "Add Dify agent DSL exports and link them from the README" 그대로).

## 2026-07-16 · `8f88bf9` · chore: dify DSL 파일명 영문 통일·워크스페이스 ID 제거, README 정확도 수정

- **변경 파일**: 6개 `dify/*.yml` 전체 (한글 파일명 → 영문 파일명으로 rename: 목표설정→
  goal-setting, 소비분석→spending-analysis, 예산분석→budget-planning, 트레이너챗봇→
  trainer-chat, 소비요약→spending-summary, ETF_chatbot→etf-coach).
- **무엇이 바뀌었나**: 파일명 변경과 함께 `dataset_ids` 하드코딩을 `[]`로 제거 (원 Dify
  워크스페이스의 지식베이스 ID가 공개 저장소에 노출되어 있던 것을 삭제). 프롬프트 텍스트 자체나
  질문분류기의 라벨/instruction 내용은 이 커밋에서 바뀌지 않음 — diff상 `dify/trainer-chat.yml`은
  rename으로 인해 파일 전체가 "new file"로 표시되지만 내용 비교 결과 실질적 변경은
  `dataset_ids` 제거뿐.
- **왜**: 커밋 메시지에 "한글/영문 혼재 해소", "원 워크스페이스 지식베이스 ID가 공개 저장소에
  노출돼 있었음(tuit_hackathon_dify와 동일한 export 방식으로 통일)"이라고 명시됨. Co-authored
  with Claude Opus 4.8.

## 2026-07-27 · `5f84da3` · Remove ETF coach feature, redeploy gateway without it

- **변경 파일**: `dify/goal-setting.yml`, `dify/spending-analysis.yml`,
  `dify/budget-planning.yml`, `dify/trainer-chat.yml`, `dify/spending-summary.yml`
  (`dify/etf-coach.yml` 삭제).
- **무엇이 바뀌었나**:
  1. 5개 파일 전반에서 `langgenius/openai`·`langgenius/tavily` 마켓플레이스 플러그인 버전
     갱신(예: `openai:0.4.3` → `openai:1.0.1`), `app.description` 필드를 비움 — 이 부분은
     프롬프트 내용 변경이 아니라 Dify 재배포/재export 시 메타데이터 갱신으로 보임.
  2. **`dify/trainer-chat.yml`의 질문분류기 프롬프트 실질 변경** (재현되던 오분류 버그에 대한
     수정, 상세 근거는 [`docs/postmortems/trainer-chatbot-class6-misrejection.md`](docs/postmortems/trainer-chatbot-class6-misrejection.md) 참고):
     - class-2 라벨: `충동구매, 소비 자제, 쇼핑 유혹을 참는 방법` →
       `충동구매, 소비 자제, 쇼핑 유혹, 참다, 못 참겠다, 자제력, 절제, 유혹을 이겨내고 싶은 고민
       등 소비를 억제하려는 모든 상담` (트리거 표현 확장).
     - `instruction` 필드: 공란(`''`) →
       `질문이 여러 클래스와 애매하게 걸치거나 판단이 어려우면, class-6(무관)으로 보내지 말고
       가장 가까운 절약 관련 클래스(1~5)를 우선하라. 정상 질문을 거절하는 오류가 무관한 질문을
       처리하는 오류보다 사용자 피해가 훨씬 크다.` (분류 우선순위를 명시적으로 지시).
  3. `etf-coach.yml` 삭제 및 관련 기능 제거는 프롬프트 변경이 아니라 기능 제거.
- **왜**: 커밋 메시지 본문에 "Drops the ETF Dify app … adds an intent-classification eval
  script"라고만 적혀 있어, ETF 제거와 eval 스크립트 추가 이유는 커밋 메시지에서 확인 가능하다.
  그러나 **질문분류기 프롬프트 자체를 왜 이 시점에 함께 고쳤는지는 커밋 메시지에서 직접 근거를
  확인할 수 없다** — `eval/README.md`(2026-07-23 측정 기록)에 남은 "class-2의 트리거 표현이
  좁다"는 개선 방향과 diff 내용이 일치하므로 그 사후측정 결과에 대응한 수정으로 보이지만, 커밋
  메시지 자체는 이를 명시하지 않는다.

## 요약

| 날짜 | 커밋 | 실질적 프롬프트 내용 변경 | 근거 |
|---|---|---|---|
| 2026-07-11 | `c7589f8` | 최초 작성 (class-2 라벨 좁음, instruction 공란) | 커밋 메시지 |
| 2026-07-16 | `8f88bf9` | 없음 (파일명/메타데이터만) | 커밋 메시지 |
| 2026-07-27 | `5f84da3` | class-2 라벨 확장 + instruction 추가 (오분류 대응) | diff + `eval/README.md` 정황 (커밋 메시지 자체는 근거 불명) |

프롬프트 히스토리가 3개 커밋뿐이라 장기 추세를 보여주기엔 표본이 작습니다. 향후 프롬프트를
바꿀 때 커밋 메시지에 "왜"를 명시하면 이 문서의 재구성 정확도가 올라갑니다.
