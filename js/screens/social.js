/* ===========================================
   SOCIAL.JS — PiggyQuest  (Figma full redesign)
   커뮤니티: 피드 | 그룹 | 랭킹
   =========================================== */
'use strict';

// MOCK_POSTS / MOCK_FRIENDS / MOCK_GROUPS / GROUP_ICONS / MOCK_CHATS / RANK_FRIEND_DATA
// 는 js/data/mock.js에 정의되어 있습니다 (프로토타입용 정적 데이터).

/* ══════════════════════════════════════════
   메인 커뮤니티 화면
   ══════════════════════════════════════════ */
function renderSocialScreen() {
  const s = AppState.getState();
  const screen = el('div', { class: 'screen comm-screen', id: 'screen-social' });

  let activeTab = 'feed';

  /* ── 헤더 ── */
  const header = el('div', { class: 'comm-header' });
  header.innerHTML = `
    <div class="comm-title">커뮤니티</div>
    <div class="comm-header-btns">
      <button class="comm-icon-btn" id="comm-addfriend-btn" title="친구 추가">+</button>
      <button class="comm-icon-btn" id="comm-notify-btn" title="알림">🔔</button>
    </div>
  `;
  screen.appendChild(header);

  /* ── 탭바 ── */
  const tabBar = el('div', { class: 'comm-tabs' });
  tabBar.innerHTML = `
    <button class="comm-tab active" data-tab="feed">피드</button>
    <button class="comm-tab"        data-tab="group">그룹</button>
    <button class="comm-tab"        data-tab="friend">친구</button>
  `;
  screen.appendChild(tabBar);

  /* ── 바디 ── */
  const body = el('div', { class: 'screen-body comm-body', id: 'comm-body' });
  screen.appendChild(body);

  /* ── FAB (피드 탭 전용) ── */
  const fab = el('button', { class: 'fab', id: 'comm-fab', onclick: () => showWritePostScreen(s) });
  fab.textContent = '+';
  screen.appendChild(fab);

  /* ── 알림 드롭다운 ── */
  const MOCK_NOTIFICATIONS = [
    { icon: '❤️', text: '도토리링님이 회원님의 게시물에 좋아요를 눌렀어요', time: '방금 전', read: false },
    { icon: '💬', text: '짠돌이킹님이 댓글을 달았어요: "화이팅!"',          time: '5분 전',  read: false },
    { icon: '🏆', text: '이번 달 절약 달성! 뱃지를 획득했어요',             time: '1시간 전', read: true  },
    { icon: '👥', text: '절약왕대장님이 팔로우 요청을 보냈어요',             time: '어제',    read: true  },
    { icon: '🎯', text: '오늘의 하루 예산을 지켰어요! 스트릭 +1',           time: '어제',    read: true  },
  ];

  const notifyDropdown = el('div', { class: 'comm-notify-dropdown hidden' });
  notifyDropdown.innerHTML = `
    <div class="comm-notify-header">
      <span class="comm-notify-title">알림</span>
      <button class="comm-notify-clear" id="notify-clear-btn">모두 읽음</button>
    </div>
    ${MOCK_NOTIFICATIONS.map(n => `
      <div class="comm-notify-item${n.read ? '' : ' unread'}">
        <span class="comm-notify-icon">${n.icon}</span>
        <div class="comm-notify-body">
          <div class="comm-notify-text">${n.text}</div>
          <div class="comm-notify-time">${n.time}</div>
        </div>
        ${!n.read ? '<span class="comm-notify-dot"></span>' : ''}
      </div>
    `).join('')}
  `;
  screen.appendChild(notifyDropdown);

  /* ── 하단 네비 ── */
  screen.appendChild(renderBottomNav('social'));

  /* ── 탭 전환 ── */
  function switchTab(tabId) {
    activeTab = tabId;
    tabBar.querySelectorAll('.comm-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tabId)
    );
    fab.style.display = tabId === 'feed' ? 'flex' : 'none';
    body.innerHTML = '';
    if (tabId === 'feed')   renderFeedTab(body, s);
    if (tabId === 'group')  renderGroupTab(body);
    if (tabId === 'friend') renderFriendTab(body, s);
  }

  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.comm-tab');
    if (btn) switchTab(btn.dataset.tab);
  });

  /* ── 친구 추가 버튼 ── */
  header.querySelector('#comm-addfriend-btn').addEventListener('click', () => {
    if (typeof showAddFriendModal === 'function') showAddFriendModal();
  });

  /* ── 알림 버튼 토글 ── */
  const notifyBtn = header.querySelector('#comm-notify-btn');
  let notifyOpen = false;

  notifyBtn.addEventListener('click', e => {
    e.stopPropagation();
    notifyOpen = !notifyOpen;
    notifyDropdown.classList.toggle('hidden', !notifyOpen);
    notifyBtn.classList.toggle('active', notifyOpen);
  });

  notifyDropdown.querySelector('#notify-clear-btn').addEventListener('click', () => {
    notifyDropdown.querySelectorAll('.comm-notify-item.unread').forEach(item => {
      item.classList.remove('unread');
      item.querySelector('.comm-notify-dot')?.remove();
    });
    notifyBtn.classList.remove('has-badge');
  });

  screen.addEventListener('click', e => {
    if (notifyOpen && !notifyDropdown.contains(e.target) && e.target !== notifyBtn) {
      notifyOpen = false;
      notifyDropdown.classList.add('hidden');
      notifyBtn.classList.remove('active');
    }
  });

  switchTab('feed');
  return screen;
}

/* ══════════════════════════════════════════
   피드 탭
   ══════════════════════════════════════════ */
function renderFeedTab(container, s) {
  let activeFilter = 'all';
  const filters = [
    { id:'all', label:'전체' },
    { id:'tip', label:'절약팁' },
    { id:'auth', label:'인증샷' },
    { id:'challenge', label:'챌린지' },
  ];

  const chipRow = el('div', { class: 'feed-chips' });
  filters.forEach(f => {
    const chip = el('button', { class: `feed-chip${f.id === 'all' ? ' active' : ''}` });
    chip.textContent = f.label;
    chip.dataset.filter = f.id;
    chipRow.appendChild(chip);
  });
  container.appendChild(chipRow);

  const postWrap = el('div', { class: 'post-list', id: 'post-list' });
  container.appendChild(postWrap);

  chipRow.addEventListener('click', e => {
    const chip = e.target.closest('.feed-chip');
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    chipRow.querySelectorAll('.feed-chip').forEach(c =>
      c.classList.toggle('active', c.dataset.filter === activeFilter)
    );
    renderPosts();
  });

  function renderPosts() {
    postWrap.innerHTML = '';
    const list = activeFilter === 'all' ? MOCK_POSTS : MOCK_POSTS.filter(p => p.filter === activeFilter);
    if (!list.length) {
      postWrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">게시글이 없어요</div></div>`;
      return;
    }
    list.forEach(post => postWrap.appendChild(buildPostCard(post)));
  }
  renderPosts();
}

const BADGE_COLORS = { gold:'#c2691f', green:'#6b8e3a', blue:'#4a7cbf', brown:'#d4a05b' };

function buildPostCard(post) {
  const badgeColor = BADGE_COLORS[post.badgeType] || 'var(--muted)';
  const charSrc = getFrameImageSrc(0, Math.max(1, Math.min(5, post.level || 1)), false);

  const card = el('div', { class: 'post-card' });
  card.innerHTML = `
    <div class="post-head">
      <img class="post-avatar" src="${charSrc}" alt="${escapeHTML(post.name)}"/>
      <div class="post-user">
        <span class="post-name">${escapeHTML(post.name)}</span>
        <span class="post-lv-badge">Lv.${post.level}</span>
        <span class="post-tag-badge" style="background:${badgeColor}">${post.badge}</span>
      </div>
      <span class="post-time">${post.time}</span>
    </div>
    <div class="post-content">${escapeHTML(post.content)}</div>
    ${post.hasImg ? `<div class="post-img-area"><span style="color:var(--muted);font-size:11px;letter-spacing:1px">이미지 첨부</span></div>` : ''}
    <div class="post-footer">
      <div class="post-stats">
        <span class="post-stat" id="plc-${post.id}">❤ ${post.likes}</span>
        <span class="post-stat">💬 ${post.comments}</span>
      </div>
      <div class="post-actions">
        <button class="post-action-btn like-btn${post.liked ? ' liked' : ''}" data-id="${post.id}">
          ${post.liked ? '❤️' : '🤍'} 좋아요
        </button>
        <button class="post-action-btn">💬 댓글</button>
      </div>
    </div>
  `;

  card.querySelector('.like-btn').addEventListener('click', e => {
    const btn = e.currentTarget;
    const p = MOCK_POSTS.find(x => x.id === post.id);
    if (!p) return;
    p.liked = !p.liked;
    p.likes += p.liked ? 1 : -1;
    btn.classList.toggle('liked', p.liked);
    btn.innerHTML = (p.liked ? '❤️' : '🤍') + ' 좋아요';
    const cnt = document.getElementById(`plc-${p.id}`);
    if (cnt) cnt.textContent = `❤ ${p.likes}`;
    animatePop(btn);
  });

  return card;
}

/* ══════════════════════════════════════════
   그룹 탭
   ══════════════════════════════════════════ */
function renderGroupTab(container) {
  const searchWrap = el('div', { class: 'group-search-wrap' });
  searchWrap.innerHTML = `<input class="group-search-input" placeholder="그룹 검색..." id="group-search-input"/>`;
  container.appendChild(searchWrap);

  const newBtn = el('button', { class: 'group-new-btn', html: '＋ 새 그룹 만들기',
    onclick: () => showCreateGroupScreen() });
  container.appendChild(newBtn);

  const listWrap = el('div', { id: 'group-list' });
  container.appendChild(listWrap);

  function renderGroups(query = '') {
    listWrap.innerHTML = '';
    const list = MOCK_GROUPS.filter(g => !query || g.name.includes(query));
    if (!list.length) {
      listWrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">그룹이 없어요</div></div>`;
      return;
    }
    list.forEach(g => listWrap.appendChild(buildGroupCard(g)));
  }

  searchWrap.querySelector('#group-search-input').addEventListener('input', e =>
    renderGroups(e.target.value.trim())
  );
  renderGroups();
}

function buildGroupCard(group) {
  const pct = Math.min(100, Math.round((group.savedAmt / group.targetAmt) * 100));
  const card = el('div', { class: 'group-card' });
  card.innerHTML = `
    <div class="group-card-icon">${group.icon}</div>
    <div class="group-card-info">
      <div class="group-card-top">
        <span class="group-card-name">${escapeHTML(group.name)}</span>
        <span class="group-card-lv">Lv.${group.level}</span>
        <span class="group-card-cat">${group.category}</span>
      </div>
      <div class="group-card-stats">${group.members}명 · ${group.months}개월 · 목표 ${formatKRW(group.targetAmt)}</div>
      <div class="gauge-wrap" style="height:8px;margin-top:6px">
        <div class="gauge-fill safe" style="width:${pct}%"></div>
      </div>
    </div>
    <button class="group-join-btn${group.joined ? ' joined' : ''}" data-id="${group.id}">
      ${group.joined ? '참여중' : '참여'}
    </button>
  `;

  card.querySelector('.group-card-info').addEventListener('click', () => showGroupDetailScreen(group));
  card.querySelector('.group-card-icon').addEventListener('click', () => showGroupDetailScreen(group));

  card.querySelector('.group-join-btn').addEventListener('click', e => {
    e.stopPropagation();
    const g = MOCK_GROUPS.find(x => x.id === group.id);
    if (!g) return;
    g.joined = !g.joined;
    g.members += g.joined ? 1 : -1;
    const btn = e.currentTarget;
    btn.textContent = g.joined ? '참여중' : '참여';
    btn.classList.toggle('joined', g.joined);
    showToast(g.joined ? `${g.name} 참여! 🎉` : '그룹 탈퇴', g.joined ? 'success' : 'info');
    animatePop(btn);
  });

  return card;
}

/* ══════════════════════════════════════════
   친구 탭
   ══════════════════════════════════════════ */
const FRIEND_BADGE_COLORS = { gold:'#c2691f', green:'#6b8e3a', blue:'#4a7cbf', brown:'#d4a05b' };

function renderFriendTab(container, s) {
  let activeSub = 'list';

  /* ── 서브탭 바 ── */
  const subBar = el('div', { class: 'friend-subtab-bar' });
  subBar.innerHTML = `
    <button class="friend-subtab active" data-sub="list">👥 친구 목록</button>
    <button class="friend-subtab"        data-sub="rank">🏆 랭킹</button>
  `;
  container.appendChild(subBar);

  const subContent = el('div', { class: 'friend-sub-content' });
  container.appendChild(subContent);

  function renderList() {
    subContent.innerHTML = '';
    MOCK_FRIENDS.forEach(f => {
      const bc = FRIEND_BADGE_COLORS[f.badgeType] || 'var(--muted)';
      const card = el('div', { class: 'myp-fc-card' });
      card.innerHTML = `
        <div class="myp-fc-head">
          <img class="myp-fc-avatar" src="${getFrameImageSrc(0, f.step, false)}" alt="${f.name}"/>
          <div class="myp-fc-info">
            <div class="myp-fc-name-row">
              <span class="myp-fc-name">${f.name}</span>
              <span class="myp-fc-badge-pill" style="background:${bc}">${f.badge}</span>
            </div>
            <div class="myp-fc-sub">LV.${f.step} · ${f.streak}일 연속 절약</div>
          </div>
        </div>
        <div class="myp-fc-goal-row">
          <div class="gauge-wrap" style="height:7px;flex:1">
            <div class="gauge-fill safe" style="width:${f.goalPct}%"></div>
          </div>
          <span class="myp-fc-pct">${f.goalPct}%</span>
        </div>
        <div class="myp-fc-date-row">
          <span class="myp-fc-date">${f.lastDate}</span>
          <span class="myp-fc-amt">${formatKRW(f.lastAmt)} 절약</span>
        </div>
      `;
      subContent.appendChild(card);
    });
  }

  function renderRank() {
    subContent.innerHTML = '';

    const todayStr = (s && s.todayDate) || getTodayStr();
    const [yr, mo] = todayStr.split('-');
    const moKr = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'][parseInt(mo,10)-1];

    const me     = RANK_FRIEND_DATA.find(x => x.isMe);
    const myRank = me ? me.rank : '-';
    const myAmt  = me ? me.amount : 0;

    const myCard = el('div', { class: 'rank-my-card' });
    myCard.innerHTML = `
      <div class="rank-my-label">MY RANK</div>
      <div class="rank-my-row">
        <div class="rank-my-num">${myRank}</div>
        <div class="rank-my-info">
          <div class="rank-my-name">${s?.user?.name || '나'} <span class="rank-na-tag2">（나）</span></div>
          <div class="rank-my-sub">친구 중 이번 달 절약 · ${myAmt}만원</div>
        </div>
        <div class="rank-my-right">
          <div class="rank-my-amount">${myAmt}</div>
          <div class="rank-my-unit">만원 절약</div>
        </div>
      </div>
    `;
    subContent.appendChild(myCard);

    const friendCount = RANK_FRIEND_DATA.filter(x => !x.isMe).length;
    const infoBar = el('div', { class: 'rank-friend-bar' });
    infoBar.innerHTML = `👥 친구 <strong>${friendCount}명</strong>과의 랭킹이에요. 이번 달 <strong>${myRank}위</strong>를 달리고 있어요!`;
    subContent.appendChild(infoBar);

    const secLabel = el('div', { class: 'rank-section-label' });
    secLabel.textContent = `▣ ${yr}년 ${moKr} · 친구 랭킹 TOP ${RANK_FRIEND_DATA.length}`;
    subContent.appendChild(secLabel);

    RANK_FRIEND_DATA.forEach(person => {
      const charStep = Math.max(1, Math.min(5, 6 - Math.min(person.rank, 5)));
      const row = el('div', {
        class: 'rank-item' + (person.rank === 1 ? ' rank-item-first' : '') + (person.isMe ? ' rank-item-me' : ''),
        style: 'cursor:pointer',
      });
      row.innerHTML = `
        <div class="rank-num-box${person.rank===1?' rank-num-first':''}">${person.rank}</div>
        <img class="rank-item-avatar" src="${getFrameImageSrc(0, charStep, false)}" alt="${person.name}"/>
        <div class="rank-item-info">
          <div class="rank-item-name">
            ${person.name}
            ${person.isMe ? '<span class="rank-na-tag">나</span>' : ''}
          </div>
          <div class="rank-item-sub">${person.sub}</div>
        </div>
        <div class="rank-item-right">
          <div class="rank-item-amount">${person.amount}</div>
          <div class="rank-item-unit">만원 절약</div>
        </div>
      `;
      if (!person.isMe) row.addEventListener('click', () => showRankProfileModal(person, charStep));
      subContent.appendChild(row);
    });
  }

  subBar.addEventListener('click', e => {
    const btn = e.target.closest('.friend-subtab');
    if (!btn) return;
    activeSub = btn.dataset.sub;
    subBar.querySelectorAll('.friend-subtab').forEach(b => b.classList.toggle('active', b === btn));
    activeSub === 'list' ? renderList() : renderRank();
  });

  renderList();
}

/* ══════════════════════════════════════════
   서브스크린 공통 헬퍼
   ══════════════════════════════════════════ */
function _openSub(subEl) {
  document.getElementById('app').appendChild(subEl);
  requestAnimationFrame(() => subEl.classList.add('visible'));
}
function _closeSub(subEl) {
  subEl.classList.remove('visible');
  setTimeout(() => subEl.remove(), 260);
}

/* ══════════════════════════════════════════
   글쓰기 서브스크린
   ══════════════════════════════════════════ */
function showWritePostScreen(s) {
  const state = s || AppState.getState();
  const sub = el('div', { class: 'sub-screen', id: 'write-screen' });
  sub.innerHTML = `
    <div class="sub-header">
      <button class="sub-close-btn" id="write-close">✕</button>
      <div class="sub-title">글쓰기</div>
      <button class="sub-action-btn" id="write-submit">게시하기</button>
    </div>
    <div class="write-tabs-bar">
      <button class="write-tab active" data-type="normal">일반</button>
      <button class="write-tab" data-type="auth">인증</button>
      <button class="write-tab" data-type="tip">팁</button>
    </div>
    <div class="write-body">
      <div class="write-user-row">
        <img class="write-avatar" src="${getFrameImageSrc(state.characterType||0, calcCharStep(state), isCharSad(state))}" alt="나"/>
        <div>
          <div class="write-user-name">${escapeHTML(state.user?.name) || '나'}</div>
          <div style="font-size:10px;color:var(--muted);letter-spacing:1px">LV.${calcCharStep(state)} ${CHARACTER_NAMES[calcCharStep(state)-1]}</div>
        </div>
      </div>
      <textarea class="write-textarea" id="write-textarea" placeholder="오늘의 절약 이야기를 나눠보세요..."></textarea>
      <div class="write-attach-row">
        <button class="write-attach-btn">📷 사진</button>
        <button class="write-attach-btn">🎬 동영상</button>
      </div>
      <div class="write-setting-row">
        <span class="write-setting-label">그룹에 올리기</span>
        <select class="input-field write-setting-select" id="write-group-select">
          <option value="">없음</option>
          ${MOCK_GROUPS.filter(g=>g.joined).map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
  _openSub(sub);

  sub.querySelector('#write-close').addEventListener('click', () => _closeSub(sub));
  sub.querySelector('.write-tabs-bar').addEventListener('click', e => {
    const btn = e.target.closest('.write-tab');
    if (!btn) return;
    sub.querySelectorAll('.write-tab').forEach(b => b.classList.toggle('active', b === btn));
  });
  sub.querySelector('#write-submit').addEventListener('click', () => {
    const text = sub.querySelector('#write-textarea').value.trim();
    if (!text) { showToast('내용을 입력해주세요', 'error'); return; }
    const tabType = sub.querySelector('.write-tab.active')?.dataset.type || 'normal';
    const filterMap = { normal:'all', auth:'auth', tip:'tip' };
    MOCK_POSTS.unshift({
      id: Date.now(), userId:'me', name: state.user?.name || '나',
      level: calcCharStep(state), charIdx: state.characterType || 0,
      badge:'절약왕', badgeType:'gold', time:'방금 전',
      filter: filterMap[tabType] || 'all', hasImg:false,
      content: text, likes:0, comments:0, liked:false,
    });
    showToast('게시글이 올라갔어요! 🎉', 'success');
    _closeSub(sub);
  });
}

/* ══════════════════════════════════════════
   그룹 상세 서브스크린
   ══════════════════════════════════════════ */
function showGroupDetailScreen(group) {
  const pct = Math.min(100, Math.round((group.savedAmt / group.targetAmt) * 100));
  const sub = el('div', { class: 'sub-screen', id: 'gd-screen' });
  sub.innerHTML = `
    <div class="sub-header">
      <button class="sub-close-btn" id="gd-close">✕</button>
      <div class="sub-title">그룹 정보</div>
      <div style="width:48px"></div>
    </div>
    <div class="gd-body">
      <div class="gd-hero">
        <div class="gd-icon">${group.icon}</div>
        <div class="gd-name">${escapeHTML(group.name)}</div>
        <div class="gd-cat-tag">${group.category}</div>
      </div>
      <div class="gd-stats-row">
        <div class="gd-stat"><div class="gd-stat-val">${group.days}</div><div class="gd-stat-label">일</div></div>
        <div class="gd-stat"><div class="gd-stat-val">${group.members}</div><div class="gd-stat-label">명</div></div>
        <div class="gd-stat"><div class="gd-stat-val">${group.months}</div><div class="gd-stat-label">개월</div></div>
      </div>
      <div class="card gd-desc-card">
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px;letter-spacing:1px">그룹 소개</div>
        <div style="font-size:13px;line-height:1.7;color:var(--ink)">${escapeHTML(group.desc)}</div>
      </div>
      <div class="card gd-progress-card">
        <div class="gd-progress-header">
          <span style="font-size:12px;color:var(--muted);letter-spacing:1px">절약 달성률</span>
          <span style="font-size:14px;font-weight:900;color:var(--accent)">${pct}%</span>
        </div>
        <div class="gauge-wrap" style="height:18px;margin:8px 0">
          <div class="gauge-fill safe" style="width:${pct}%"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);text-align:right;letter-spacing:0.5px">
          ${formatKRW(group.savedAmt)} / ${formatKRW(group.targetAmt)}
        </div>
      </div>
      <div class="gd-btn-row">
        <button class="gd-chat-btn" id="gd-chat-btn">채팅 참여하기</button>
        <button class="gd-friend-btn" id="gd-friend-btn">친구 추가</button>
      </div>
    </div>
  `;
  _openSub(sub);

  sub.querySelector('#gd-close').addEventListener('click', () => _closeSub(sub));
  sub.querySelector('#gd-chat-btn').addEventListener('click', () => showGroupChatScreen(group));
  sub.querySelector('#gd-friend-btn').addEventListener('click', () => showToast('친구 요청을 보냈어요! 🎉', 'success'));
}

/* ══════════════════════════════════════════
   그룹 채팅 서브스크린
   ══════════════════════════════════════════ */
function showGroupChatScreen(group) {
  const s = AppState.getState();
  const chats = (MOCK_CHATS[group.id] || []);
  const sub = el('div', { class: 'sub-screen chat-screen', id: 'chat-screen' });
  sub.innerHTML = `
    <div class="sub-header">
      <button class="sub-close-btn" id="chat-close">✕</button>
      <div class="sub-title" style="font-size:13px">${escapeHTML(group.name)}</div>
      <div style="width:48px"></div>
    </div>
    <div class="chat-body" id="chat-body">
      ${chats.map(c => `
        <div class="chat-msg">
          <img class="chat-avatar" src="${getFrameImageSrc(0, Math.max(1,Math.min(5,c.charIdx+1)), false)}" alt="${c.name}"/>
          <div class="chat-bubble-wrap">
            <div class="chat-bubble-name">${c.name}</div>
            <div class="chat-bubble">${c.msg}</div>
          </div>
          <div class="chat-time">${c.time}</div>
        </div>
      `).join('')}
    </div>
    <div class="chat-input-wrap">
      <input class="chat-input" id="chat-input" placeholder="메시지를 입력하세요..."/>
      <button class="chat-send-btn" id="chat-send">▶</button>
    </div>
  `;
  _openSub(sub);

  const chatBody = sub.querySelector('#chat-body');
  setTimeout(() => { chatBody.scrollTop = chatBody.scrollHeight; }, 50);

  sub.querySelector('#chat-close').addEventListener('click', () => _closeSub(sub));

  function sendMsg() {
    const input = sub.querySelector('#chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg chat-msg-me';
    msgEl.innerHTML = `
      <div class="chat-bubble-wrap" style="align-items:flex-end">
        <div class="chat-bubble chat-bubble-me">${escapeHTML(msg)}</div>
      </div>
      <img class="chat-avatar" src="${getFrameImageSrc(s.characterType||0, calcCharStep(s), isCharSad(s))}" alt="나"/>
    `;
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    animatePop(msgEl);
  }

  sub.querySelector('#chat-send').addEventListener('click', sendMsg);
  sub.querySelector('#chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
}

/* ══════════════════════════════════════════
   새 그룹 만들기 서브스크린
   ══════════════════════════════════════════ */
function showCreateGroupScreen() {
  let selectedIcon = '🎯';
  const sub = el('div', { class: 'sub-screen', id: 'cg-screen' });
  sub.innerHTML = `
    <div class="sub-header">
      <button class="sub-close-btn" id="cg-close">✕</button>
      <div class="sub-title">새 그룹 만들기</div>
      <button class="sub-action-btn" id="cg-header-create">만들기</button>
    </div>
    <div class="cg-body">
      <div class="input-label" style="margin-bottom:8px">그룹 아이콘</div>
      <div class="icon-grid" id="icon-grid">
        ${GROUP_ICONS.map(ico => `
          <button class="icon-grid-btn${ico === selectedIcon ? ' active' : ''}" data-icon="${ico}">${ico}</button>
        `).join('')}
      </div>
      <div class="input-group" style="margin:16px 0 12px">
        <label class="input-label">그룹 이름</label>
        <input class="input-field" id="cg-name" placeholder="예: 아이패드 살 사람들" maxlength="20"/>
      </div>
      <div class="input-group" style="margin-bottom:12px">
        <label class="input-label">그룹 소개</label>
        <textarea class="input-field" id="cg-desc" placeholder="그룹 소개를 입력하세요..." style="resize:none;height:76px"></textarea>
      </div>
      <div class="cg-selectors">
        <div>
          <div class="input-label">카테고리</div>
          <select class="input-field" id="cg-cat">
            <option>전자기기</option><option>저축</option><option>교통</option>
            <option>주거</option><option>여행</option><option>기타</option>
          </select>
        </div>
        <div>
          <div class="input-label">목표금액</div>
          <input class="input-field" id="cg-target" type="number" placeholder="0"/>
        </div>
        <div>
          <div class="input-label">기간</div>
          <select class="input-field" id="cg-period">
            <option value="3">3개월</option><option value="6">6개월</option>
            <option value="12">12개월</option><option value="24">24개월</option>
          </select>
        </div>
      </div>
      <button class="group-new-btn" style="margin-top:20px" id="cg-submit">• 그룹 만들기 •</button>
    </div>
  `;
  _openSub(sub);

  sub.querySelector('#cg-close').addEventListener('click', () => _closeSub(sub));

  sub.querySelector('#icon-grid').addEventListener('click', e => {
    const btn = e.target.closest('.icon-grid-btn');
    if (!btn) return;
    selectedIcon = btn.dataset.icon;
    sub.querySelectorAll('.icon-grid-btn').forEach(b => b.classList.toggle('active', b === btn));
  });

  function doCreate() {
    const name = sub.querySelector('#cg-name').value.trim();
    if (!name) { showToast('그룹 이름을 입력해주세요', 'error'); animateShake(sub.querySelector('#cg-name')); return; }
    const months = parseInt(sub.querySelector('#cg-period').value) || 6;
    MOCK_GROUPS.unshift({
      id: Date.now(), icon: selectedIcon, name,
      level:1, category: sub.querySelector('#cg-cat').value,
      members:1, months, days:0,
      targetAmt: parseInt(sub.querySelector('#cg-target').value || '1000000'),
      savedAmt:0,
      desc: sub.querySelector('#cg-desc').value.trim() || name,
      joined: true,
    });
    showToast(`${escapeHTML(name)} 그룹이 만들어졌어요! 🎉`, 'success');
    _closeSub(sub);
  }
  sub.querySelector('#cg-header-create').addEventListener('click', doCreate);
  sub.querySelector('#cg-submit').addEventListener('click', doCreate);
}

/* ══════════════════════════════════════════
   랭킹 캐릭터 프로필 모달
   ══════════════════════════════════════════ */
function showRankProfileModal(person, charStep) {
  const app = document.getElementById('app');

  const overlay = el('div', { class: 'rpm-overlay' });
  const modal   = el('div', { class: 'rpm-modal' });

  modal.innerHTML = `
    <div class="rpm-header">
      <div class="rpm-header-name">${person.name}</div>
      <button class="rpm-x" id="rpm-x">✕</button>
    </div>
    <div class="rpm-char-box">
      <img class="rpm-char-img"
        src="${getFrameImageSrc(0, charStep || 3, false)}"
        alt="${person.name}"/>
    </div>
    <div class="rpm-stats">
      <div class="rpm-stat-row">
        <span class="rpm-stat-lbl">지금 절약 달성</span>
        <span class="rpm-stat-val">${person.amount * 4}일</span>
      </div>
      <div class="rpm-stat-row">
        <span class="rpm-stat-lbl">다음 단계까지</span>
        <span class="rpm-stat-val">${formatKRW(Math.max(0, (5 - charStep) * 45000))}</span>
      </div>
      <div class="rpm-stat-row">
        <span class="rpm-stat-lbl">이번 달 절약</span>
        <span class="rpm-stat-val">${person.amount}만원</span>
      </div>
    </div>
    <div class="rpm-actions">
      <button class="rpm-btn-dark" id="rpm-close">닫기</button>
      <button class="rpm-btn-accent" id="rpm-add">친구 추가</button>
    </div>
  `;

  app.appendChild(overlay);
  app.appendChild(modal);

  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    modal.classList.add('visible');
  });

  function close() {
    overlay.classList.remove('visible');
    modal.classList.remove('visible');
    setTimeout(() => { overlay.remove(); modal.remove(); }, 250);
  }

  overlay.addEventListener('click', close);
  modal.querySelector('#rpm-x').addEventListener('click', close);
  modal.querySelector('#rpm-close').addEventListener('click', close);
  modal.querySelector('#rpm-add').addEventListener('click', () => {
    showToast(`${person.name}에게 친구 요청! 🎉`, 'success');
    close();
  });
}
