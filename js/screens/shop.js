/* ===========================================
   SHOP.JS — PiggyQuest
   절약 상점: 게임 코인으로 아이템 구매
   =========================================== */
'use strict';

/* ── 상점 코인 유틸 ── */
function getShopCoins() { return parseInt(localStorage.getItem('pq_shop_coins') || '0'); }
function addShopCoins(n) { localStorage.setItem('pq_shop_coins', getShopCoins() + n); }
function spendShopCoins(n) {
  const cur = getShopCoins();
  if (cur < n) return false;
  localStorage.setItem('pq_shop_coins', cur - n);
  return true;
}

/* ── 장착 스킨 유틸 ── */
function getEquippedSkin() { return localStorage.getItem('pq_skin') || 'none'; }
function setEquippedSkin(id) { localStorage.setItem('pq_skin', id); }

/* ── 소유 아이템 유틸 ── */
function getOwnedItems() {
  try { return JSON.parse(localStorage.getItem('pq_shop_owned') || '{}'); }
  catch { return {}; }
}
function setOwnedItems(obj) { localStorage.setItem('pq_shop_owned', JSON.stringify(obj)); }
function isOwned(id) { return !!getOwnedItems()[id]; }
function markOwned(id) { const o = getOwnedItems(); o[id] = true; setOwnedItems(o); }

/* ── 아이템 정의 ── */
const SHOP_ITEMS = [
  {
    id: 'shield_1', section: '아이템',
    name: '🛡️ 보호권',
    desc: '연속 저금 기록을 1번 보호해줘요\n절약 성공 1일 = 코인 1개',
    price: 30,
    onBuy() {
      AppState.addShield(1);
      showToast('🛡️ 보호권 +1 획득!', 'success');
    },
    canBuy() { return AppState.getShieldCount() < 3; },
    status() { return `보유 ${AppState.getShieldCount()}/3`; },
  },
];

/* ── 스킨 즉시 적용 (홈 캐릭터 이미지) ── */
function _applySkinNow(filter) {
  const img = document.getElementById('home-char-img');
  if (img) img.style.filter = filter;
}

/* ════════════════════════════════════════════
   상점 화면 렌더
   ════════════════════════════════════════════ */
function renderShopScreen() {
  const screen = el('div', { class: 'screen shop-screen', id: 'screen-shop' });

  /* ─── 헤더 ─── */
  const hdr = el('div', { class: 'screen-header' });
  const _coins = getShopCoins();
  hdr.innerHTML = `
    <span class="hdr-title">절약 상점</span>
    <span class="shop-hdr-coin" id="shop-hdr-coin" style="color:${_coins < 30 ? 'var(--red)' : 'var(--ink)'}">🪙 ${_coins}</span>
  `;
  screen.appendChild(hdr);

  /* ─── 코인 안내 배너 ─── */
  const banner = el('div', { class: 'shop-banner' });
  banner.innerHTML = `
    <span class="shop-banner-text">💰 절약 성공 1일 = 코인 1개 적립</span>
  `;
  screen.appendChild(banner);

  /* ─── 아이템 목록 ─── */
  const body = el('div', { class: 'screen-body shop-body', id: 'shop-body' });

  let currentSection = '';
  SHOP_ITEMS.forEach(item => {
    if (item.section !== currentSection) {
      currentSection = item.section;
      const sectionLabel = el('div', { class: 'shop-section-label' });
      sectionLabel.textContent = item.section;
      body.appendChild(sectionLabel);
    }

    body.appendChild(_renderShopItem(item, screen));
  });

  screen.appendChild(body);
  screen.appendChild(renderBottomNav('shop'));
  return screen;
}

function _renderShopItem(item, screen) {
  const card = el('div', { class: 'shop-item-card', id: `shop-item-${item.id}` });
  _refreshShopCard(card, item);
  return card;
}

function _refreshShopCard(card, item) {
  const coins   = getShopCoins();
  const owned   = !item.canBuy();
  const afford  = coins >= item.price;
  const statusTxt = item.status ? item.status() : '';
  const isFree  = item.price === 0;

  card.innerHTML = `
    <div class="shop-item-info">
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-desc">${item.desc}</div>
      ${statusTxt ? `<div class="shop-item-status">${statusTxt}</div>` : ''}
    </div>
    <div class="shop-item-right">
      <div class="shop-item-price">${isFree ? '무료' : `🪙 ${item.price}`}</div>
      <button class="shop-buy-btn ${owned && !isFree ? 'owned' : ''} ${!afford && !owned ? 'no-coin' : ''}"
              id="buy-btn-${item.id}"
              ${(owned && !isFree) ? 'disabled' : ''}>
        ${owned && !isFree ? '구매완료' : isFree ? '적용' : '구매'}
      </button>
    </div>
  `;

  const btn = card.querySelector(`#buy-btn-${item.id}`);
  if (btn && !(owned && !isFree)) {
    btn.addEventListener('click', () => {
      if (!isFree && !afford) {
        showToast(`코인이 부족해요! (필요: 🪙 ${item.price})`, 'error');
        return;
      }
      if (!isFree && !spendShopCoins(item.price)) {
        showToast('코인이 부족해요!', 'error');
        return;
      }
      item.onBuy();
      // 잔액 갱신
      const coinEl = document.getElementById('shop-hdr-coin');
      if (coinEl) {
        const _c = getShopCoins();
        coinEl.textContent = `🪙 ${_c}`;
        coinEl.style.color = _c < 30 ? 'var(--red)' : 'var(--ink)';
      }
      // 카드 갱신
      _refreshShopCard(card, item);
    });
  }

  return card;
}
