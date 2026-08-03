# AI 게이트웨이 배포 (Cloudflare Worker)

> README `## 실행 방법`에서 이어지는 배포 가이드입니다.

라이브 데모처럼 키를 배포에 포함할 수 없는 환경에서는 Cloudflare Worker 게이트웨이를 사용합니다.

```
프론트(에이전트 이름만 전송) → Worker(/chat) → Dify API (키는 Worker secret)
```

- **키 은닉** — Dify 키 6종은 `wrangler secret`으로만 등록, 코드·배포 산출물에 미포함
- **남용 방지** — IP당 하루 40회 한도 (Workers KV 카운터, 초과 시 429)
- **관측성** — 요청별 에이전트·지연시간·토큰 사용량·비용을 구조화 로그로 기록 (`wrangler tail`)
- **폴백** — 게이트웨이 미배포/실패 시 AI 카드만 비활성화, 앱 로직은 정상 동작

배포 절차는 [`gateway/wrangler.toml`](gateway/wrangler.toml) 주석에 정리되어 있고, 배포 후 발급된
Worker URL을 [`js/config.public.js`](js/config.public.js)의 `DIFY_GATEWAY_URL`에 넣으면
라이브 데모에서도 AI 기능이 활성화됩니다.
