/* ===========================================
   GAME.JS — PiggyQuest
   절약왕 달리기 v2: 다중 레인 + 오리기 + 배경제거
   =========================================== */
'use strict';

let _gameRaf = null;
function _stopGameLoop() {
  if (_gameRaf) { cancelAnimationFrame(_gameRaf); _gameRaf = null; }
}

// REMOVEBG_API_KEY는 js/config.js에서 로드됩니다.

/* ── remove.bg로 배경 제거 후 Image 반환 (localStorage 캐시) ── */
async function _removeBgAPI(imgSrc) {
  // 캐시 확인
  const cacheKey = 'pq_nobg_' + imgSrc.replace(/[^a-z0-9]/gi, '_');
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const img = new Image();
    img.src = cached;
    await new Promise(r => { img.onload = r; img.onerror = r; });
    return img;
  }

  if (!REMOVEBG_API_KEY) return null;

  try {
    // 로컬 이미지를 blob으로 읽어 API에 전송
    const imgResp = await fetch(imgSrc);
    const imgBlob = await imgResp.blob();

    const form = new FormData();
    form.append('image_file', imgBlob, 'char.png');
    form.append('size', 'auto');

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': REMOVEBG_API_KEY },
      body: form,
    });

    if (!res.ok) { console.warn('remove.bg 오류:', res.status); return null; }

    const blob = await res.blob();
    const dataUrl = await new Promise(r => {
      const reader = new FileReader();
      reader.onload = () => r(reader.result);
      reader.readAsDataURL(blob);
    });

    localStorage.setItem(cacheKey, dataUrl);

    const result = new Image();
    result.src = dataUrl;
    await new Promise(r => { result.onload = r; result.onerror = r; });
    return result;
  } catch (e) {
    console.warn('remove.bg 실패:', e);
    return null;
  }
}

/* ════════════════════════════════════════════
   화면 렌더
   ════════════════════════════════════════════ */
function renderGameScreen() {
  _stopGameLoop();
  const screen = el('div', { class: 'screen no-nav game-screen', id: 'screen-game' });

  const hdr = el('div', { class: 'screen-header' });
  const best = parseInt(localStorage.getItem('pq_game_best') || '0');
  hdr.innerHTML = `
    <button class="hdr-back-btn" id="game-back">◀</button>
    <span class="hdr-title">절약왕 달리기</span>
    <span class="game-hdr-best" id="game-hdr-best">🏆 ${best}</span>
  `;
  screen.appendChild(hdr);

  const wrap = el('div', { class: 'game-canvas-wrap', id: 'game-canvas-wrap' });
  const canvas = el('canvas', { id: 'game-canvas' });
  wrap.appendChild(canvas);
  screen.appendChild(wrap);

  hdr.querySelector('#game-back').addEventListener('click', () => {
    _stopGameLoop();
    AppState.navigate('home');
  });

  requestAnimationFrame(() => _initGame(canvas));
  return screen;
}

/* ════════════════════════════════════════════
   게임 엔진
   ════════════════════════════════════════════ */
function _initGame(canvas) {
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth  || 360;
  const H = wrap.clientHeight || 520;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  /* ── 상수 ── */
  const GROUND_Y = Math.floor(H * 0.76);
  const CHAR_W   = 58, CHAR_H = 58;
  const CHAR_X   = 68;
  const GRAVITY  = 0.6;
  const JUMP_V   = -14.5;
  const BASE_SPD = 5;

  // 공중 장애물 Y: 서있으면 충돌, 오리면 통과하도록 수학적으로 설정
  // FLOAT_Y + floaterH < GROUND_Y - 22 (덕 히트박스 위)  →  floaterH ≤ CHAR_H - 12 - 1
  const FLOAT_Y  = GROUND_Y - CHAR_H - 10;  // 장애물 top
  const FLOAT_H  = 26;                       // 높이 (CHAR_H-12=46 미만, 오리면 통과)

  /* ── 캐릭터 이미지 & 배경 제거 ── */
  const st       = AppState.getState();
  const _imgSrc  = getFrameImageSrc(st.characterType || 0, calcCharStep(st), false);
  const charImg  = new Image();
  let   charSrc  = null; // 배경제거 완료 이미지 (없으면 null → 원본 폴백)
  charImg.onload = () => { charSrc = charSrc || charImg; }; // API 결과 없으면 원본
  charImg.src    = _imgSrc;

  // remove.bg API 비동기 호출 (캐시 있으면 즉시 반환)
  _removeBgAPI(_imgSrc).then(result => {
    if (result) charSrc = result;
  });

  /* ── 배경 건물 (고정 레이아웃) ── */
  const BLDS = [];
  const BLD_COLS = ['#c8a878','#b8946a','#a0825c','#d4b48a','#c0a070'];
  for (let i = 0; i < 12; i++) {
    BLDS.push({ x: i * 82, w: 42 + (i%4)*12, h: 32 + (i%5)*20, col: BLD_COLS[i%5] });
  }

  /* ── 장애물 정의 ── */
  const GND_OBS = [ // 지면 장애물: 점프해야 함
    { emoji: '🧋', w: 30, h: 40 },
    { emoji: '🍕', w: 34, h: 32 },
    { emoji: '💳', w: 44, h: 26 },
    { emoji: '🚕', w: 50, h: 30 },
    { emoji: '🛍️', w: 34, h: 44 },
    { emoji: '🧃', w: 26, h: 36 },
    { emoji: '🍔', w: 34, h: 32 },
  ];
  const AIR_OBS = [ // 공중 장애물: 오리기해야 함
    { emoji: '🚁', w: 44, h: FLOAT_H },
    { emoji: '🎈', w: 30, h: FLOAT_H },
    { emoji: '🦅', w: 44, h: FLOAT_H },
    { emoji: '🪁', w: 36, h: FLOAT_H },
    { emoji: '✈️', w: 50, h: FLOAT_H },
  ];

  function rg() { return GND_OBS[Math.floor(Math.random() * GND_OBS.length)]; }
  function ra() { return AIR_OBS[Math.floor(Math.random() * AIR_OBS.length)]; }
  function mkG(t, dx = 0) { return { ...t, kind: 'ground', x: W + 20 + dx, y: GROUND_Y - t.h }; }
  function mkA(t, dx = 0) { return { ...t, kind: 'air',    x: W + 20 + dx, y: FLOAT_Y }; }

  /* ── 스폰 패턴 (난이도 순) ── */
  const PATTERNS = [
    () => [mkG(rg())],                                      // 0: 단독 지면
    () => [mkG(rg())],                                      // 1: 단독 지면 (가중치)
    () => [mkA(ra())],                                      // 2: 단독 공중 (오리기)
    () => [mkG(rg()), mkG(rg(), 65)],                      // 3: 더블 지면
    () => [mkG(rg()), mkA(ra(), 110)],                     // 4: 지면→공중 콤보
    () => [mkA(ra()), mkG(rg(), 105)],                     // 5: 공중→지면 콤보
    () => [mkG(rg()), mkG(rg(), 58), mkG(rg(), 116)],     // 6: 트리플 지면
    () => [mkA(ra()), mkA(ra(), 80)],                      // 7: 더블 공중
    () => [mkG(rg()), mkA(ra(), 70), mkG(rg(), 150)],     // 8: 지면+공중+지면
  ];

  /* ── 게임 상태 ── */
  const G = {
    started: false, over: false,
    score: 0, coins: 0, lives: 3,
    speed: BASE_SPD, frame: 0, bgOff: 0,
    charY: GROUND_Y - CHAR_H, charVY: 0,
    onGround: true, jumpsLeft: 2,
    ducking: 0,     // 남은 오리기 프레임
    invincible: 0,
    obstacles: [], pickups: [], particles: [],
    multiplier: 1,
    duckHint: 0,    // 공중 장애물 진입 시 힌트 표시 프레임
  };

  /* ── 파티클 ── */
  function addPtc(x, y, emoji) {
    G.particles.push({ x, y, emoji, vy: -3 - Math.random() * 2, life: 40 });
  }

  /* ── 아이템 스폰 ── */
  function spawnPickup() {
    const isStar = Math.random() < 0.10;
    G.pickups.push({
      emoji: isStar ? '⭐' : '🪙',
      type:  isStar ? 'star' : 'coin',
      x: W + 20,
      y: GROUND_Y - CHAR_H - 20 - Math.random() * 55,
      w: 30, h: 30,
    });
  }

  /* ── AABB 충돌 ── */
  function hits(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  /* ── 히트박스 ── */
  function hb() {
    if (G.ducking > 0) {
      // 오리기: 하단 22px만 (공중 장애물은 이 위에 있으므로 통과)
      return { x: CHAR_X + 5, y: GROUND_Y - 22, w: CHAR_W - 10, h: 22 };
    }
    return { x: CHAR_X + 8, y: G.charY + 8, w: CHAR_W - 16, h: CHAR_H - 12 };
  }

  /* ── 재시작 ── */
  function restart() {
    Object.assign(G, {
      started: true, over: false,
      score: 0, coins: 0, lives: 3,
      speed: BASE_SPD, frame: 0, bgOff: 0,
      charY: GROUND_Y - CHAR_H, charVY: 0,
      onGround: true, jumpsLeft: 2,
      ducking: 0, invincible: 0,
      obstacles: [], pickups: [], particles: [],
      multiplier: 1, duckHint: 0,
    });
  }

  /* ── 입력 ── */
  function doJump() {
    if (G.over) { restart(); return; }
    if (!G.started) { G.started = true; return; }
    if (G.ducking > 0) { G.ducking = 0; return; } // 오리기 해제
    if (G.jumpsLeft > 0) {
      G.charVY    = JUMP_V;
      G.onGround  = false;
      G.jumpsLeft--;
    }
  }
  function doDuck() {
    if (!G.started || G.over || !G.onGround) return;
    G.ducking = 46;
  }

  /* ── 이벤트 바인딩 ── */
  let _tsy = 0;
  canvas.addEventListener('touchstart', e => { e.preventDefault(); _tsy = e.touches[0].clientY; }, { passive: false });
  canvas.addEventListener('touchend',   e => {
    e.preventDefault();
    const dy = e.changedTouches[0].clientY - _tsy;
    if (dy > 28) doDuck(); else doJump();
  }, { passive: false });
  canvas.addEventListener('click', doJump);
  const _kh = e => {
    if (e.code === 'Space' || e.code === 'ArrowUp')   { e.preventDefault(); doJump(); }
    if (e.code === 'ArrowDown' || e.code === 'KeyS')  { e.preventDefault(); doDuck(); }
  };
  document.addEventListener('keydown', _kh);
  canvas._cleanup = () => document.removeEventListener('keydown', _kh);

  /* ════════════════════════════════════════
     UPDATE
  ════════════════════════════════════════ */
  function update() {
    if (!G.started || G.over) return;

    G.frame++;
    G.multiplier = 1 + Math.floor(G.score / 500);
    G.score     += G.multiplier;
    G.bgOff     += G.speed * 0.4;
    G.speed      = Math.min(BASE_SPD + Math.floor(G.score / 250) * 0.55, 16);

    /* 중력 / 점프 */
    G.charVY += GRAVITY;
    G.charY  += G.charVY;
    if (G.charY >= GROUND_Y - CHAR_H) {
      G.charY     = GROUND_Y - CHAR_H;
      G.charVY    = 0;
      G.onGround  = true;
      G.jumpsLeft = 2;
    }

    /* 오리기 타이머 (지면 고정) */
    if (G.ducking > 0) { G.ducking--; G.charY = GROUND_Y - CHAR_H; }
    if (G.invincible > 0) G.invincible--;
    if (G.duckHint  > 0) G.duckHint--;

    /* 스폰: 점수 증가할수록 간격 줄고 패턴 다양해짐 */
    const obsRate = Math.max(48, 108 - Math.floor(G.score / 220) * 7);
    if (G.frame % obsRate === 0) {
      const maxPat = Math.min(PATTERNS.length, 2 + Math.floor(G.score / 350));
      G.obstacles.push(...PATTERNS[Math.floor(Math.random() * maxPat)]());
    }
    if (G.frame % 78 === 40) spawnPickup();

    /* 장애물 이동 + 충돌 */
    const box = hb();
    G.obstacles = G.obstacles.filter(o => {
      o.x -= G.speed;
      // 화면에 처음 들어오는 공중 장애물 → 힌트 트리거
      if (o.kind === 'air' && o.x < W - 40 && o.x > W - 80) G.duckHint = 60;

      if (G.invincible === 0 && hits(box.x, box.y, box.w, box.h, o.x + 4, o.y + 4, o.w - 8, o.h - 8)) {
        G.lives -= 1;
        G.invincible = 90;
        addPtc(o.x + o.w / 2, o.y + o.h / 2, '💥');
        if (G.lives <= 0) _gameOver();
        return false;
      }
      return o.x > -70;
    });

    /* 아이템 이동 + 수집 */
    G.pickups = G.pickups.filter(p => {
      p.x -= G.speed;
      if (hits(box.x, box.y, box.w, box.h, p.x, p.y, p.w, p.h)) {
        if (p.type === 'coin') { G.score += 20; addPtc(p.x + 15, p.y, '+20'); }
        else { G.invincible = 200; G.score += 120; addPtc(p.x + 15, p.y, '✨'); }
        return false;
      }
      return p.x > -60;
    });

    /* 파티클 */
    G.particles = G.particles.filter(p => { p.y += p.vy; p.vy += 0.15; p.life--; return p.life > 0; });
  }

  function _gameOver() {
    G.lives = 0; G.over = true;
    const prev = parseInt(localStorage.getItem('pq_game_best') || '0');
    if (G.score > prev) {
      localStorage.setItem('pq_game_best', G.score);
      const el2 = document.getElementById('game-hdr-best');
      if (el2) el2.textContent = `🏆 ${G.score}`;
    }
    // 점수 → 상점 코인 환산 (100점당 1코인)
    const earned = Math.floor(G.score / 100);
    if (earned > 0) {
      const prevCoins = parseInt(localStorage.getItem('pq_shop_coins') || '0');
      localStorage.setItem('pq_shop_coins', prevCoins + earned);
    }
    G.earnedCoins = earned;
  }

  /* ════════════════════════════════════════
     DRAW
  ════════════════════════════════════════ */
  function drawBg() {
    /* 하늘 */
    ctx.fillStyle = '#fce8b2';
    ctx.fillRect(0, 0, W, GROUND_Y);

    /* 구름 */
    [[60,28],[185,46],[315,22],[440,38]].forEach(([bx, by]) => {
      const cx2 = ((bx - G.bgOff * 0.12) % (W + 90) + W + 90) % (W + 90) - 45;
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath();
      ctx.arc(cx2,     by,    16, 0, Math.PI * 2);
      ctx.arc(cx2+17,  by-6,  12, 0, Math.PI * 2);
      ctx.arc(cx2+32,  by,    14, 0, Math.PI * 2);
      ctx.fill();
    });

    /* 건물 (패럴랙스) */
    BLDS.forEach(b => {
      const bx = ((b.x - G.bgOff * 0.26) % (W + 130) + W + 130) % (W + 130) - 130;
      ctx.fillStyle = b.col;
      ctx.fillRect(bx, GROUND_Y - b.h, b.w, b.h);
      ctx.fillStyle = '#3d2817';
      for (let wy = GROUND_Y - b.h + 6; wy < GROUND_Y - 5; wy += 13) {
        for (let wx = bx + 5; wx < bx + b.w - 5; wx += 11) {
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    });

    /* 지면 */
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#6b4f10';
    ctx.fillRect(0, GROUND_Y, W, 5);
    ctx.fillStyle = '#a07820';
    const dashOff = G.bgOff % 44;
    for (let dx = -dashOff; dx < W; dx += 44) ctx.fillRect(dx, GROUND_Y + 11, 22, 4);
  }

  function drawChar() {
    const blink = G.invincible > 0 && Math.floor(G.frame / 5) % 2 === 1;
    if (blink) return;
    if (!charSrc) {
      ctx.font = '42px serif';
      ctx.fillText('🐷', CHAR_X, GROUND_Y - 8);
      return;
    }
    ctx.save();
    if (G.ducking > 0) {
      // 오리기: Y축 50% 압축, 지면에 붙여서 그림
      ctx.translate(CHAR_X, GROUND_Y);
      ctx.scale(1, 0.5);
      ctx.drawImage(charSrc, 0, -CHAR_H, CHAR_W, CHAR_H);
    } else {
      ctx.drawImage(charSrc, CHAR_X, G.charY, CHAR_W, CHAR_H);
    }
    ctx.restore();
  }

  function drawEmoji(emoji, x, y, size) {
    ctx.font = `${size}px serif`;
    ctx.fillText(emoji, x, y + size * 0.88);
  }

  function drawObstacles() {
    G.obstacles.forEach(o => {
      // 공중 장애물: 배경에 반투명 빨간 하이라이트
      if (o.kind === 'air') {
        ctx.fillStyle = 'rgba(231,76,60,0.15)';
        ctx.fillRect(o.x - 4, o.y, o.w + 8, o.h);
      }
      drawEmoji(o.emoji, o.x, o.y, o.w);
    });
  }

  function drawParticles() {
    G.particles.forEach(p => {
      ctx.globalAlpha = p.life / 40;
      ctx.font = '20px serif';
      ctx.fillText(p.emoji, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(253,243,212,0.86)';
    ctx.fillRect(0, 0, W, 50);

    ctx.fillStyle = '#3d2817';
    ctx.textAlign = 'left';
    ctx.font      = 'bold 15px DungGeunMo, monospace';
    ctx.fillText(`SCORE  ${G.score}`, 10, 22);

    if (G.multiplier > 1) {
      ctx.fillStyle = '#f5a623';
      ctx.font      = '11px DungGeunMo, monospace';
      ctx.fillText(`x${G.multiplier}`, 10, 40);
    }

    // 획득 예정 코인 (100점당 1코인)
    ctx.fillStyle = '#8b6914';
    ctx.font      = '11px DungGeunMo, monospace';
    ctx.fillText(`+${Math.floor(G.score / 100)}coin`, 110, 22);

    /* 속도계 */
    ctx.textAlign = 'center';
    ctx.font      = '10px DungGeunMo, monospace';
    ctx.fillText(`SPD ${G.speed.toFixed(1)}`, W / 2, 18);

    /* 오리기 힌트 */
    if (G.duckHint > 0 && G.ducking === 0) {
      ctx.fillStyle = 'rgba(231,76,60,0.85)';
      ctx.font      = 'bold 12px DungGeunMo, monospace';
      ctx.fillText('↓ 오리기!', W / 2, 38);
    }
    if (G.ducking > 0) {
      ctx.fillStyle = '#2980b9';
      ctx.font      = 'bold 12px DungGeunMo, monospace';
      ctx.fillText('↓ DUCK', W / 2, 38);
    }
    if (G.invincible > 0 && G.ducking === 0 && G.duckHint === 0) {
      ctx.fillStyle = '#f5a623';
      ctx.font      = 'bold 12px DungGeunMo, monospace';
      ctx.fillText('⭐ 무적!', W / 2, 38);
    }

    /* 하트 */
    ctx.textAlign = 'right';
    for (let i = 2; i >= 0; i--) {
      ctx.font = '18px serif';
      ctx.fillText(i < G.lives ? '❤️' : '🖤', W - 10 - (2 - i) * 24, 30);
    }
    ctx.textAlign = 'left';
  }

  function drawStart() {
    ctx.fillStyle = 'rgba(61,40,23,0.78)';
    ctx.fillRect(W / 2 - 135, H / 2 - 60, 270, 100);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fce8b2';
    ctx.font      = 'bold 18px DungGeunMo, monospace';
    ctx.fillText('절약왕 달리기', W / 2, H / 2 - 30);
    ctx.font      = '12px DungGeunMo, monospace';
    ctx.fillText('탭 / ↑ = 점프 (더블점프 가능)', W / 2, H / 2 - 8);
    ctx.fillText('↓ 스와이프 / 아래↓ = 오리기', W / 2, H / 2 + 12);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('빨간 장애물은 오리기로 통과!', W / 2, H / 2 + 30);
    ctx.fillStyle = '#f5a623';
    ctx.font      = 'bold 14px DungGeunMo, monospace';
    ctx.fillText('탭해서 시작!', W / 2, H / 2 + 52);
    ctx.textAlign = 'left';
  }

  function drawOver() {
    ctx.fillStyle = 'rgba(61,40,23,0.9)';
    ctx.fillRect(0, 0, W, H);
    const prev  = parseInt(localStorage.getItem('pq_game_best') || '0');
    const isNew = G.score > 0 && G.score >= prev;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fce8b2';
    ctx.font      = 'bold 26px DungGeunMo, monospace';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 85);
    if (isNew) {
      ctx.fillStyle = '#f5a623';
      ctx.font      = 'bold 15px DungGeunMo, monospace';
      ctx.fillText('🎉 신기록!', W / 2, H / 2 - 54);
    }
    ctx.fillStyle = '#fce8b2';
    ctx.font      = '18px DungGeunMo, monospace';
    ctx.fillText(`점수  ${G.score}`, W / 2, H / 2 - 14);
    ctx.fillStyle = '#8b6914';
    ctx.fillText(`획득 코인  +${G.earnedCoins || 0}`, W / 2, H / 2 + 18);
    ctx.fillStyle = '#fce8b2';
    ctx.fillText(`최고  ${Math.max(G.score, prev)}`, W / 2, H / 2 + 52);
    ctx.font      = '13px DungGeunMo, monospace';
    ctx.fillStyle = '#c8a878';
    ctx.fillText('탭해서 다시 시작', W / 2, H / 2 + 90);
    ctx.textAlign = 'left';
  }

  /* ── 메인 루프 ── */
  function loop() {
    update();
    ctx.clearRect(0, 0, W, H);
    drawBg();
    G.obstacles.forEach(o => {
      if (o.kind === 'air') {
        ctx.fillStyle = 'rgba(231,76,60,0.15)';
        ctx.fillRect(o.x - 4, o.y, o.w + 8, o.h);
      }
      drawEmoji(o.emoji, o.x, o.y, o.w);
    });
    G.pickups.forEach(p   => drawEmoji(p.emoji, p.x, p.y, p.w));
    drawChar();
    drawParticles();
    drawHUD();
    if (!G.started) drawStart();
    if (G.over)     drawOver();
    _gameRaf = requestAnimationFrame(loop);
  }
  loop();
}
