/* ===========================================
   TESTS/SETUP.MJS — 주머니(ZooMoney)
   state.js는 ES 모듈이 아닌 전역 <script> 구조라서
   node:vm으로 브라우저 전역을 흉내 낸 샌드박스에
   순서대로 로드해서 AppState를 꺼내온다.
   =========================================== */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '..', 'js');

export function createSandbox() {
  let store = {};
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; },
  };

  const context = { localStorage, console, Math, Date, JSON, structuredClone };
  vm.createContext(context);

  // 로드 순서가 중요 (index.html의 <script> 순서와 동일해야 함)
  const files = ['characters.js', 'utils.js', 'state.js'];
  for (const f of files) {
    const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
    vm.runInContext(code, context, { filename: f });
  }

  // vm 컨텍스트에서 top-level const/class 선언(AppState, CHARACTERS 등)은
  // 컨텍스트 객체의 프로퍼티로 자동 노출되지 않으므로 명시적으로 붙여줌
  // (function 선언인 utils.js의 함수들은 이미 context.xxx로 접근 가능)
  vm.runInContext(
    'globalThis.AppState = AppState; globalThis.CHARACTERS = CHARACTERS; ' +
    'globalThis.CATEGORIES = CATEGORIES; globalThis.BADGES = BADGES;',
    context,
  );

  return { context, store: () => store };
}

export function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
