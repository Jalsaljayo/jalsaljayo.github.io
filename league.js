// ============================================================================
// 메이드보카 (MadeVoca) 주간 리그 & 10등급 엠블럼 & Top 3 하이라이트 외장 모듈 (league.js)
// ============================================================================
(function () {
  'use strict';

  const LEAGUE_TIERS = [
    { id: 0, name: '루키',       short: '루키',     group: 'ROOKIE',  count: 1, accent: '#4D7C0F', bg: '#F7FEE7', border: '#BEF264' },
    { id: 1, name: '브론즈 2',   short: '브론즈2',  group: 'BRONZE',  count: 1, accent: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    { id: 2, name: '브론즈 1',   short: '브론즈1',  group: 'BRONZE',  count: 2, accent: '#9A3412', bg: '#FFF7ED', border: '#FDBA74' },
    { id: 3, name: '실버 2',     short: '실버2',    group: 'SILVER',  count: 1, accent: '#475569', bg: '#F8FAFC', border: '#CBD5E1' },
    { id: 4, name: '실버 1',     short: '실버1',    group: 'SILVER',  count: 2, accent: '#334155', bg: '#F1F5F9', border: '#94A3B8' },
    { id: 5, name: '골드 2',     short: '골드2',    group: 'GOLD',    count: 1, accent: '#B45309', bg: '#FEFCE8', border: '#FDE047' },
    { id: 6, name: '골드 1',     short: '골드1',    group: 'GOLD',    count: 2, accent: '#A16207', bg: '#FEF9C3', border: '#FACC15' },
    { id: 7, name: '다이아몬드 2', short: '다이아2', group: 'DIAMOND', count: 1, accent: '#0369A1', bg: '#F0F9FF', border: '#7DD3FC' },
    { id: 8, name: '다이아몬드 1', short: '다이아1', group: 'DIAMOND', count: 2, accent: '#0284C7', bg: '#E0F2FE', border: '#38BDF8' },
    { id: 9, name: '마스터',     short: '마스터',   group: 'MASTER',  count: 1, accent: '#6D28D9', bg: '#F5F3FF', border: '#C4B5FD' }
  ];

  let leagueCache = null;
  let countdownTimerId = null;
  let remainSecondsSnapshot = 0;
  let snapshotTimestampMs = 0;
  let ceremonyTimers = [];
  let activeCeremonyTeamId = null;
  let activeCeremonyIsPreview = false;
  let checkedAutoCeremonyUser = '';

  function safeEsc(str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTierMeta(tierIdx) {
    const idx = Math.max(0, Math.min(9, Number(tierIdx) || 0));
    return LEAGUE_TIERS[idx];
  }

  // -------------------------------------------------------------------------
  // 1. 공통 SVG 그라디언트 & 스타일 및 모달 DOM 1회 주입
  // -------------------------------------------------------------------------
  function injectLeagueAssetsOnce() {
    if (document.getElementById('madevocaLeagueStyle')) return;

    const svgDefs = document.createElement('div');
    svgDefs.id = 'madevocaLeagueSvgDefs';
    svgDefs.style.cssText = 'position:absolute; width:0; height:0; overflow:hidden; pointer-events:none;';
    svgDefs.innerHTML = `
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient id="mvLgRookieRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#A16207"/>
            <stop offset="50%" stop-color="#CA8A04"/>
            <stop offset="100%" stop-color="#713F12"/>
          </linearGradient>
          <linearGradient id="mvLgRookieLeaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#A3E635"/>
            <stop offset="100%" stop-color="#4D7C0F"/>
          </linearGradient>
          <linearGradient id="mvLgBronze" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FDBA74"/>
            <stop offset="48%" stop-color="#CD7F32"/>
            <stop offset="100%" stop-color="#7C2D12"/>
          </linearGradient>
          <linearGradient id="mvLgSilver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="48%" stop-color="#CBD5E1"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
          <linearGradient id="mvLgGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FEF08A"/>
            <stop offset="45%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#B45309"/>
          </linearGradient>
          <linearGradient id="mvLgDiamond" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#E0F2FE"/>
            <stop offset="45%" stop-color="#38BDF8"/>
            <stop offset="100%" stop-color="#0369A1"/>
          </linearGradient>
          <linearGradient id="mvLgMasterShield" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#67E8F9"/>
            <stop offset="50%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="#EC4899"/>
          </linearGradient>
        </defs>
      </svg>
    `;
    document.body.appendChild(svgDefs);

    const styleEl = document.createElement('style');
    styleEl.id = 'madevocaLeagueStyle';
    styleEl.textContent = `
      .league-hero-card {
        background: var(--surface); border: 1.5px solid var(--border);
        border-radius: 18px; padding: 16px 15px; margin-bottom: 12px;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      }
      .league-hero-top {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
      }
      .league-tier-title {
        font-size: 19px; font-weight: 800; color: var(--text-main); letter-spacing: -0.3px;
        display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      }
      .league-team-pill {
        display: inline-block; font-size: 11px; font-weight: 800;
        padding: 3px 8px; border-radius: 99px;
        background: var(--primary-soft); color: var(--primary-dark); border: 1px solid #C5DDEC;
      }
      .league-timer-bar {
        margin-top: 12px; padding: 9px 12px; border-radius: 11px;
        background: var(--bg-app); border: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center; gap: 8px;
        font-size: 11.5px; font-weight: 700; color: var(--text-sub);
      }
      .league-rule-chips {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 9px;
      }
      .league-rule-chip {
        padding: 7px 4px; border-radius: 9px; text-align: center;
        font-size: 11px; font-weight: 800; border: 1px solid var(--border); background: var(--bg-app);
      }
      .league-rule-chip.up { background: #ECFDF5; border-color: #A7F3D0; color: #065F46; }
      .league-rule-chip.stay { background: #F8FAFC; border-color: #E2E8F0; color: #475569; }
      .league-rule-chip.down { background: #FFF5F5; border-color: #FECACA; color: #B91C1C; }

      .btn-ceremony-replay {
        width: 100%; margin-top: 10px; padding: 11px 12px; border-radius: 11px;
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        color: #FDE68A; border: 1px solid #475569;
        font-size: 12.5px; font-weight: 800; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 7px;
      }
      .btn-ceremony-replay:active { opacity: 0.88; }

      .league-zone-divider {
        margin: 10px 0; padding: 7px 12px; border-radius: 10px;
        font-size: 11.5px; font-weight: 800; text-align: center;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .league-zone-divider.promote {
        background: #ECFDF5; border: 1px dashed #34D399; color: #065F46;
      }
      .league-zone-divider.stay {
        background: #F1F5F9; border: 1px dashed #94A3B8; color: #334155;
      }
      .league-zone-divider.demote {
        background: #FFF5F5; border: 1px dashed #F87171; color: #B91C1C;
      }

      .league-member-card {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 14px; padding: 12px 14px; margin-bottom: 7px;
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
      }
      .league-member-card.me {
        border: 1.8px solid var(--primary); background: var(--primary-soft);
      }
      .league-member-card.demote-risk:not(.me) {
        background: #FFFBFB; border-color: #FEE2E2;
      }
      .league-rank-badge {
        width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 800; color: var(--text-sub); background: var(--bg-app);
      }
      .league-rank-badge.r1 { background: #FEF08A; color: #854D0E; border: 1px solid #FACC15; }
      .league-rank-badge.r2 { background: #E2E8F0; color: #334155; border: 1px solid #CBD5E1; }
      .league-rank-badge.r3 { background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; }

      /* 10등급 안내 사다리 리스트 */
      .tier-ladder-row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 9px 12px; border-radius: 12px; border: 1px solid var(--border);
        background: var(--surface); margin-bottom: 6px;
      }
      .tier-ladder-row.current {
        border: 1.8px solid var(--primary); background: var(--primary-soft);
      }

      /* 주간 등급업 & 팀 Top 3 스포트라이트 하이라이트 전체 화면 애니메이션 */
      .ceremony-overlay {
        position: fixed; inset: 0; z-index: 600;
        background: radial-gradient(circle at 50% 18%, #1E293B 0%, #090D16 78%);
        display: none; align-items: center; justify-content: center;
        padding: calc(16px + env(safe-area-inset-top, 0px)) 16px calc(20px + var(--safe-bottom));
        color: #F8FAFC; overflow-y: auto;
      }
      .ceremony-overlay.open { display: flex; animation: fadeIn 0.28s ease-out; }
      .ceremony-stage-box {
        width: 100%; max-width: 430px; background: rgba(15, 23, 42, 0.86);
        border: 1.5px solid rgba(250, 204, 21, 0.45); border-radius: 24px;
        padding: 20px 16px 18px; position: relative; overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65); text-align: center;
      }
      .ceremony-ribbon {
        display: inline-block; background: linear-gradient(90deg, #B45309, #F59E0B, #B45309);
        color: #FFFBEB; font-size: 11.5px; font-weight: 800;
        padding: 4px 14px; border-radius: 99px; letter-spacing: 0.3px;
        box-shadow: 0 3px 10px rgba(245, 158, 11, 0.35);
      }
      .podium-arena {
        position: relative; height: 228px; margin: 16px 0 14px;
        display: grid; grid-template-columns: 1fr 1.12fr 1fr; align-items: end; gap: 8px;
        padding: 0 6px;
      }
      .podium-col {
        position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
        opacity: 0; transform: translateY(36px) scale(0.92);
        transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .podium-col.reveal {
        opacity: 1; transform: translateY(0) scale(1);
      }
      .podium-spotlight {
        position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
        width: 120%; height: 220px; pointer-events: none; z-index: 0;
        background: linear-gradient(180deg, rgba(253, 224, 71, 0.24) 0%, rgba(253, 224, 71, 0.02) 85%, transparent 100%);
        clip-path: polygon(32% 0%, 68% 0%, 100% 100%, 0% 100%);
      }
      .podium-col.p2 .podium-spotlight {
        background: linear-gradient(180deg, rgba(226, 232, 240, 0.22) 0%, rgba(226, 232, 240, 0.02) 85%, transparent 100%);
      }
      .podium-col.p3 .podium-spotlight {
        background: linear-gradient(180deg, rgba(253, 186, 116, 0.20) 0%, rgba(253, 186, 116, 0.02) 85%, transparent 100%);
      }
      .podium-avatar {
        position: relative; z-index: 2; width: 48px; height: 48px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; font-weight: 900; margin-bottom: 6px;
        box-shadow: 0 6px 14px rgba(0,0,0,0.4);
      }
      .podium-col.p1 .podium-avatar {
        width: 56px; height: 56px; font-size: 21px;
        background: linear-gradient(135deg, #FEF08A, #F59E0B); color: #78350F; border: 2.5px solid #FFFFFF;
      }
      .podium-col.p2 .podium-avatar {
        background: linear-gradient(135deg, #F8FAFC, #94A3B8); color: #1E293B; border: 2px solid #E2E8F0;
      }
      .podium-col.p3 .podium-avatar {
        background: linear-gradient(135deg, #FFEDD5, #CD7F32); color: #431407; border: 2px solid #FDBA74;
      }
      .podium-crown {
        font-size: 20px; line-height: 1; margin-bottom: 2px; z-index: 2;
        animation: crownFloat 1.6s ease-in-out infinite alternate;
      }
      @keyframes crownFloat { from { transform: translateY(0); } to { transform: translateY(-4px); } }
      .podium-user-name {
        position: relative; z-index: 2; font-size: 13px; font-weight: 800; color: #FFFFFF;
        max-width: 105px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .podium-user-xp {
        position: relative; z-index: 2; font-size: 11px; font-weight: 700; color: #FDE68A; margin: 2px 0 6px;
      }
      .podium-pillar {
        position: relative; z-index: 2; width: 100%; border-radius: 12px 12px 6px 6px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-weight: 900; color: #FFFFFF; box-shadow: inset 0 2px 6px rgba(255,255,255,0.35);
      }
      .podium-col.p1 .podium-pillar {
        height: 96px; background: linear-gradient(180deg, #F59E0B 0%, #92400E 100%);
        border: 1.5px solid #FDE047; font-size: 19px;
      }
      .podium-col.p2 .podium-pillar {
        height: 74px; background: linear-gradient(180deg, #94A3B8 0%, #334155 100%);
        border: 1.5px solid #E2E8F0; font-size: 16px;
      }
      .podium-col.p3 .podium-pillar {
        height: 58px; background: linear-gradient(180deg, #CD7F32 0%, #7C2D12 100%);
        border: 1.5px solid #FDBA74; font-size: 15px;
      }
      .ceremony-my-result {
        background: rgba(30, 41, 59, 0.92); border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 16px; padding: 13px 14px; margin-bottom: 12px;
        opacity: 0; transform: translateY(14px);
        transition: opacity 0.45s ease, transform 0.45s ease;
      }
      .ceremony-my-result.reveal { opacity: 1; transform: translateY(0); }
      .ceremony-share-pill {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 11px; font-weight: 700; color: #BAE6FD;
        background: rgba(2, 132, 199, 0.22); border: 1px solid rgba(56, 189, 248, 0.4);
        padding: 5px 12px; border-radius: 99px; margin-bottom: 12px;
      }
    `;
    document.head.appendChild(styleEl);

    // 10등급 안내 모달 DOM 생성
    const guideModal = document.createElement('div');
    guideModal.className = 'modal-overlay';
    guideModal.id = 'leagueTierGuideModal';
    guideModal.onclick = function (e) { if (e.target === guideModal) closeLeagueTierGuide(); };
    guideModal.innerHTML = `
      <div class="bottom-sheet">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:17px; font-weight:800;">주간 리그 10등급 & 승강 규칙</div>
          <button type="button" onclick="closeLeagueTierGuide()" style="background:none; border:none; font-size:20px; color:var(--text-sub); cursor:pointer;">✕</button>
        </div>
        <div style="font-size:12px; color:var(--text-sub); background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:11px 12px; margin-bottom:12px; line-height:1.55;">
          • 매주 월요일 00:00(KST) 같은 등급 학습자 <strong>최대 20명씩 랜덤 팀</strong>이 편성됩니다.<br>
          • 이번 주 획득 XP 순으로 <strong>상위 12명 등급업 ▲</strong> / <strong>5명 현재 등급 유지 ━</strong> / <strong>3명 아래 등급 하락 ▼</strong> (단, 맨 아랫등급 <strong>루키</strong>는 하락 없이 유지)<br>
          • XP 기준: 1·2단계 <strong>+10</strong> / 3단계 <strong>+10</strong> / 4단계 <strong>+20</strong> / 퀴즈 <strong>+10</strong> (+콤보·목표 보너스)
        </div>
        <div id="leagueTierLadderBody" style="max-height:52dvh; overflow-y:auto;"></div>
        <button type="button" class="action-btn btn-primary" style="margin-top:10px;" onclick="closeLeagueTierGuide()">확인</button>
      </div>
    `;
    document.body.appendChild(guideModal);

    // 주간 Top 3 스포트라이트 하이라이트 오버레이 DOM 생성
    const cerOverlay = document.createElement('div');
    cerOverlay.className = 'ceremony-overlay';
    cerOverlay.id = 'weeklyCeremonyOverlay';
    cerOverlay.innerHTML = `
      <div class="ceremony-stage-box">
        <div class="ceremony-ribbon" id="cerRibbonText">주간 리그 하이라이트</div>
        <div id="cerTitleText" style="font-size:19px; font-weight:900; margin-top:8px; letter-spacing:-0.4px;">우리 팀 TOP 3 발표!</div>
        <div id="cerSubText" style="font-size:12px; color:#CBD5E1; margin-top:3px;">팀원 모두에게 공유되는 주간 영광의 주인공입니다</div>

        <div class="podium-arena">
          <!-- 왼쪽: 2등 -->
          <div class="podium-col p2" id="cerPodium2">
            <div class="podium-spotlight"></div>
            <div class="podium-avatar" id="cerAvatar2">2</div>
            <div class="podium-user-name" id="cerName2">-</div>
            <div class="podium-user-xp" id="cerXp2">0 XP</div>
            <div class="podium-pillar">2등</div>
          </div>

          <!-- 중앙: 1등 -->
          <div class="podium-col p1" id="cerPodium1">
            <div class="podium-spotlight"></div>
            <div class="podium-crown">👑</div>
            <div class="podium-avatar" id="cerAvatar1">1</div>
            <div class="podium-user-name" id="cerName1">-</div>
            <div class="podium-user-xp" id="cerXp1">0 XP</div>
            <div class="podium-pillar">1등</div>
          </div>

          <!-- 오른쪽: 3등 -->
          <div class="podium-col p3" id="cerPodium3">
            <div class="podium-spotlight"></div>
            <div class="podium-avatar" id="cerAvatar3">3</div>
            <div class="podium-user-name" id="cerName3">-</div>
            <div class="podium-user-xp" id="cerXp3">0 XP</div>
            <div class="podium-pillar">3등</div>
          </div>
        </div>

        <div class="ceremony-share-pill" id="cerSharePill">
          <span>▶</span>
          <span>같은 팀원들에게 Top 3 하이라이트 공유 완료!</span>
        </div>

        <div class="ceremony-my-result" id="cerMyResultBox"></div>

        <button type="button" id="btnCloseCeremony" class="action-btn" style="background:linear-gradient(90deg,#F59E0B,#D97706); color:#0F172A; font-weight:900; font-size:14.5px;" onclick="finishWeeklyCeremonyModal()">
          확인하고 이번 주 리그 시작하기
        </button>
      </div>
    `;
    document.body.appendChild(cerOverlay);
  }

  // -------------------------------------------------------------------------
  // 2. 10종 등급 커스텀 벡터 로고 생성기 (브론즈2=1개, 브론즈1=2개 등 완벽 구현)
  // -------------------------------------------------------------------------
  function buildSingleHexShieldSvg(gradId, strokeCol, numText, textCol, cx) {
    return `
      <g transform="translate(${cx - 20}, 4)">
        <polygon points="20,2 36,10 36,28 20,38 4,28 4,10" fill="url(#${gradId})" stroke="${strokeCol}" stroke-width="2.2" stroke-linejoin="round"/>
        <polygon points="20,6 32,12.5 32,25.5 20,33.5 8,25.5 8,12.5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"/>
        <text x="20" y="25.5" text-anchor="middle" font-size="15" font-weight="900" fill="${textCol}" style="font-family:'Pretendard',sans-serif;">${numText}</text>
      </g>
    `;
  }

  function buildSingleDiamondGemSvg(cx) {
    return `
      <g transform="translate(${cx - 20}, 5)">
        <polygon points="20,2 36,16 20,36 4,16" fill="url(#mvLgDiamond)" stroke="#0284C7" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="20,2 28,16 20,36 12,16" fill="rgba(255,255,255,0.34)"/>
        <line x1="4" y1="16" x2="36" y2="16" stroke="rgba(255,255,255,0.75)" stroke-width="1.3"/>
      </g>
    `;
  }

  function getLeagueTierLogoSvg(tierIdx, heightPx) {
    const h = Number(heightPx) || 38;
    const meta = getTierMeta(tierIdx);

    // 0: 루키 (새싹 원형 메달)
    if (meta.id === 0) {
      const w = Math.round(h * 1.05);
      return `
        <svg width="${w}" height="${h}" viewBox="0 0 46 44" class="star-svg" aria-label="루키">
          <circle cx="23" cy="22" r="18.5" fill="#FEFCE8" stroke="url(#mvLgRookieRim)" stroke-width="3.4"/>
          <path d="M23 31V18" stroke="#3F6212" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M23 23C16 23 13 17 14 13C19 13 23 16.5 23 23Z" fill="url(#mvLgRookieLeaf)" stroke="#3F6212" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M23 20C29.5 20 32.5 14.5 31.5 11C26.5 11 23 14.5 23 20Z" fill="url(#mvLgRookieLeaf)" stroke="#3F6212" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
      `;
    }

    // 1~6: 브론즈2(1개)/브론즈1(2개), 실버2(1개)/실버1(2개), 골드2(1개)/골드1(2개)
    if (meta.id >= 1 && meta.id <= 6) {
      const gradMap = { BRONZE: 'mvLgBronze', SILVER: 'mvLgSilver', GOLD: 'mvLgGold' };
      const strokeMap = { BRONZE: '#7C2D12', SILVER: '#475569', GOLD: '#92400E' };
      const textMap = { BRONZE: '#FFF7ED', SILVER: '#0F172A', GOLD: '#451A03' };
      const gId = gradMap[meta.group];
      const stCol = strokeMap[meta.group];
      const txCol = textMap[meta.group];

      if (meta.count === 1) {
        const w = Math.round(h * 1.05);
        return `<svg width="${w}" height="${h}" viewBox="0 0 46 44" class="star-svg" aria-label="${meta.name}">${buildSingleHexShieldSvg(gId, stCol, '1', txCol, 23)}</svg>`;
      } else {
        const w = Math.round(h * 1.62);
        return `<svg width="${w}" height="${h}" viewBox="0 0 72 44" class="star-svg" aria-label="${meta.name}">${buildSingleHexShieldSvg(gId, stCol, '2', txCol, 21)}${buildSingleHexShieldSvg(gId, stCol, '2', txCol, 51)}</svg>`;
      }
    }

    // 7~8: 다이아몬드2(1개) / 다이아몬드1(2개)
    if (meta.id === 7 || meta.id === 8) {
      if (meta.count === 1) {
        const w = Math.round(h * 1.08);
        return `<svg width="${w}" height="${h}" viewBox="0 0 46 44" class="star-svg" aria-label="${meta.name}">${buildSingleDiamondGemSvg(23)}</svg>`;
      } else {
        const w = Math.round(h * 1.62);
        return `<svg width="${w}" height="${h}" viewBox="0 0 72 44" class="star-svg" aria-label="${meta.name}">${buildSingleDiamondGemSvg(21)}${buildSingleDiamondGemSvg(51)}</svg>`;
      }
    }

    // 9: 마스터 (왕관 + 오로라 크리스탈 방패)
    const w = Math.round(h * 1.18);
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 52 46" class="star-svg" aria-label="마스터">
        <path d="M15 12L19 5L26 10L33 5L37 12Z" fill="url(#mvLgGold)" stroke="#92400E" stroke-width="1.5" stroke-linejoin="round"/>
        <polygon points="26,11 43,18 39,35 26,44 13,35 9,18" fill="url(#mvLgGold)" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="26,15 38,20.5 35,33 26,39.5 17,33 14,20.5" fill="url(#mvLgMasterShield)" stroke="#FFFFFF" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="26,19 31,26 26,34 21,26" fill="rgba(255,255,255,0.68)"/>
      </svg>
    `;
  }

  window.getLeagueTierLogoSvg = getLeagueTierLogoSvg;

  // -------------------------------------------------------------------------
  // 3. 실시간 주간 카운트다운 포매터
  // -------------------------------------------------------------------------
  function formatRemainingTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return days > 0 ? `${days}일 ${hh}:${mm}:${ss} 남음` : `${hh}:${mm}:${ss} 남음`;
  }

  function startLeagueCountdown(initialSeconds) {
    remainSecondsSnapshot = Math.max(0, Number(initialSeconds) || 0);
    snapshotTimestampMs = Date.now();
    if (countdownTimerId) clearInterval(countdownTimerId);

    const tick = function () {
      const el = document.getElementById('leagueCountdownText');
      if (!el) return;
      const elapsed = Math.floor((Date.now() - snapshotTimestampMs) / 1000);
      const curLeft = Math.max(0, remainSecondsSnapshot - elapsed);
      el.innerText = formatRemainingTime(curLeft);
    };
    tick();
    countdownTimerId = setInterval(tick, 1000);
  }

  // -------------------------------------------------------------------------
  // 4. 10등급 안내 모달 열기 / 닫기
  // -------------------------------------------------------------------------
  window.openLeagueTierGuide = function () {
    injectLeagueAssetsOnce();
    const myTier = leagueCache ? (Number(leagueCache.myTier) || 0) : 0;
    const bodyEl = document.getElementById('leagueTierLadderBody');
    if (bodyEl) {
      const reversed = [...LEAGUE_TIERS].reverse();
      bodyEl.innerHTML = reversed.map(t => {
        const isCur = (t.id === myTier);
        const subRule = t.id === 0
          ? '상위 12명 승급 · 하위 하락 없음(보호)'
          : (t.id === 9 ? '최고 등급 · 하위 3명만 강등' : '상위 12명 승급 · 5명 유지 · 3명 하락');
        return `
          <div class="tier-ladder-row ${isCur ? 'current' : ''}">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="min-width:54px; display:flex; justify-content:center;">${getLeagueTierLogoSvg(t.id, 32)}</div>
              <div>
                <div style="font-size:14px; font-weight:800; color:var(--text-main);">
                  ${safeEsc(t.name)}
                  ${isCur ? '<span style="font-size:11px; color:var(--primary); margin-left:5px;">(내 등급)</span>' : ''}
                </div>
                <div style="font-size:11px; color:var(--text-sub); margin-top:1px;">${subRule}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    const modal = document.getElementById('leagueTierGuideModal');
    if (modal) modal.classList.add('open');
  };

  window.closeLeagueTierGuide = function () {
    const modal = document.getElementById('leagueTierGuideModal');
    if (modal) modal.classList.remove('open');
  };

  // -------------------------------------------------------------------------
  // 5. 매주 팀 상위 3·2·1등 스포트라이트 애니메이션 하이라이트 재생기
  // -------------------------------------------------------------------------
  function playCeremonyChord(step) {
    if (typeof soundEnabled !== 'undefined' && !soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const map = {
        3: [440, 554.37],
        2: [523.25, 659.25],
        1: [523.25, 659.25, 783.99, 1046.5]
      };
      const freqs = map[step] || [523.25];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.16, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.34);
      });
    } catch (e) {}
  }

  function clearCeremonyTimers() {
    ceremonyTimers.forEach(t => clearTimeout(t));
    ceremonyTimers = [];
  }

  window.openWeeklyCeremonyModal = function (ceremonyObj, isPreview) {
    injectLeagueAssetsOnce();
    if (!ceremonyObj) return;
    clearCeremonyTimers();

    activeCeremonyIsPreview = Boolean(isPreview);
    activeCeremonyTeamId = ceremonyObj.teamId || null;

    const oldMeta = getTierMeta(ceremonyObj.oldTier);
    const newMeta = getTierMeta(ceremonyObj.newTier);
    const podium = Array.isArray(ceremonyObj.podium) ? ceremonyObj.podium : [];

    const p1 = podium.find(p => Number(p.rank) === 1) || podium[0] || { userName: '주인공 대기 중', weeklyXp: 0 };
    const p2 = podium.find(p => Number(p.rank) === 2) || podium[1] || { userName: '-', weeklyXp: 0 };
    const p3 = podium.find(p => Number(p.rank) === 3) || podium[2] || { userName: '-', weeklyXp: 0 };

    document.getElementById('cerRibbonText').innerText = isPreview
      ? `${oldMeta.name} · ${ceremonyObj.teamNo || 1}팀 실시간 하이라이트 미리보기`
      : `${ceremonyObj.weekStart || '지난주'} · ${oldMeta.name} ${ceremonyObj.teamNo || 1}팀 최종 정산`;

    document.getElementById('cerTitleText').innerText = isPreview
      ? '이번 주 우리 팀 TOP 3 중간 발표!'
      : '매주 등급업 하이라이트 · 우리 팀 TOP 3!';

    document.getElementById('cerSubText').innerText = isPreview
      ? '월요일 00:00 정산 시 아래 연출이 팀원 20명 전원에게 공유됩니다'
      : '한 주 동안 함께 달린 팀원들에게 공유된 영광의 3·2·1등입니다!';

    document.getElementById('cerSharePill').innerHTML = isPreview
      ? '<span>▶</span><span>현재 팀 순위 기준 미리보기 연출 중</span>'
      : '<span>▶</span><span>같은 주 팀원 전원에게 하이라이트 공유 완료!</span>';

    const setSlot = (num, data) => {
      const nameStr = String(data.userName || '-');
      document.getElementById('cerAvatar' + num).innerText = nameStr && nameStr !== '-' ? nameStr.slice(0, 1) : String(num);
      document.getElementById('cerName' + num).innerText = nameStr !== '-' ? `'${nameStr}'` : '대기 중';
      document.getElementById('cerXp' + num).innerText = `${Number(data.weeklyXp) || 0} XP`;
      document.getElementById('cerPodium' + num).classList.remove('reveal');
    };
    setSlot(1, p1);
    setSlot(2, p2);
    setSlot(3, p3);

    // 나의 등급 결과 박스 구성
    const resBox = document.getElementById('cerMyResultBox');
    resBox.classList.remove('reveal');
    let outcomeHeadline = '';
    if (isPreview) {
      outcomeHeadline = `현재 내 순위 <strong>${ceremonyObj.myFinalRank || '-'}위 (${ceremonyObj.myWeeklyXp || 0} XP)</strong> · ${
        ceremonyObj.outcome === 'PROMOTE' ? `<span style="color:#4ADE80;">[${newMeta.name}] 승급 안정권 ▲</span>` :
        ceremonyObj.outcome === 'DEMOTE' ? `<span style="color:#F87171;">[${newMeta.name}] 하락 주의 ▼</span>` :
        `<span style="color:#E2E8F0;">[${oldMeta.name}] 유지권 ━</span>`
      }`;
    } else if (ceremonyObj.outcome === 'PROMOTE' && newMeta.id > oldMeta.id) {
      outcomeHeadline = `🎉 축하합니다! 최종 <strong>${ceremonyObj.myFinalRank}위</strong>로 <strong style="color:#FDE047;">[${newMeta.name}] 등급업 ▲</strong> 성공!`;
    } else if (ceremonyObj.outcome === 'DEMOTE' && newMeta.id < oldMeta.id) {
      outcomeHeadline = `최종 <strong>${ceremonyObj.myFinalRank}위</strong> · 이번 주는 <strong>[${newMeta.name}]</strong>에서 재도전합니다!`;
    } else {
      outcomeHeadline = `최종 <strong>${ceremonyObj.myFinalRank}위</strong> · <strong>[${newMeta.name}]</strong> 등급을 든든하게 지켰습니다!`;
    }

    resBox.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:6px;">
        <div style="text-align:center;">
          ${getLeagueTierLogoSvg(oldMeta.id, 34)}
          <div style="font-size:10.5px; color:#94A3B8; margin-top:2px;">${safeEsc(oldMeta.name)}</div>
        </div>
        <div style="font-size:16px; font-weight:900; color:#FACC15;">➔</div>
        <div style="text-align:center;">
          ${getLeagueTierLogoSvg(newMeta.id, 40)}
          <div style="font-size:11px; font-weight:800; color:#FDE047; margin-top:2px;">${safeEsc(newMeta.name)}</div>
        </div>
      </div>
      <div style="font-size:12.5px; line-height:1.45; color:#F8FAFC;">${outcomeHeadline}</div>
    `;

    document.getElementById('btnCloseCeremony').innerText = isPreview
      ? '미리보기 닫기'
      : '확인하고 이번 주 리그 시작하기';

    const overlay = document.getElementById('weeklyCeremonyOverlay');
    overlay.classList.add('open');

    // 순차 스포트라이트 애니메이션: 3등(0.4s) -> 2등(1.4s) -> 1등 + 폭죽(2.5s) -> 내 승급 카드(3.4s)
    ceremonyTimers.push(setTimeout(() => {
      document.getElementById('cerPodium3').classList.add('reveal');
      playCeremonyChord(3);
    }, 380));

    ceremonyTimers.push(setTimeout(() => {
      document.getElementById('cerPodium2').classList.add('reveal');
      playCeremonyChord(2);
    }, 1350));

    ceremonyTimers.push(setTimeout(() => {
      document.getElementById('cerPodium1').classList.add('reveal');
      playCeremonyChord(1);
      if (typeof window.fireConfetti === 'function') window.fireConfetti(true);
    }, 2400));

    ceremonyTimers.push(setTimeout(() => {
      resBox.classList.add('reveal');
    }, 3200));
  };

  window.finishWeeklyCeremonyModal = async function () {
    clearCeremonyTimers();
    const overlay = document.getElementById('weeklyCeremonyOverlay');
    if (overlay) overlay.classList.remove('open');

    if (!activeCeremonyIsPreview && activeCeremonyTeamId && typeof sb !== 'undefined') {
      if (leagueCache && leagueCache.lastCeremony) {
        leagueCache.lastCeremony.seen = true;
      }
      try {
        await sb.rpc('ack_weekly_league_ceremony', { p_team_id: Number(activeCeremonyTeamId) });
      } catch (e) {}
    }
  };

  window.replayLastOrPreviewCeremony = function () {
    if (!leagueCache) return;
    if (leagueCache.lastCeremony && Array.isArray(leagueCache.lastCeremony.podium) && leagueCache.lastCeremony.podium.length > 0) {
      window.openWeeklyCeremonyModal(leagueCache.lastCeremony, false);
      return;
    }
    const members = Array.isArray(leagueCache.members) ? leagueCache.members : [];
    const me = members.find(m => m.isMe) || { rank: 1, weeklyXp: 0, zone: 'PROMOTE' };
    const myTier = Number(leagueCache.myTier) || 0;
    const nextTier = me.zone === 'PROMOTE' ? Math.min(9, myTier + 1) : (me.zone === 'DEMOTE' ? Math.max(0, myTier - 1) : myTier);

    window.openWeeklyCeremonyModal({
      teamId: leagueCache.teamId,
      teamNo: leagueCache.teamNo || 1,
      oldTier: myTier,
      newTier: nextTier,
      myFinalRank: me.rank || 1,
      myWeeklyXp: me.weeklyXp || 0,
      outcome: me.zone || 'STAY',
      podium: members.slice(0, 3)
    }, true);
  };

  // -------------------------------------------------------------------------
  // 6. 명예의 전당 탭 헤더 교정 및 주간 리그 보드 렌더링 (전체 랭킹 완전 대체)
  // -------------------------------------------------------------------------
  function upgradeRankTabHeader() {
    const rankPane = document.getElementById('tab-rank');
    if (!rankPane || rankPane.dataset.weeklyUpgraded === '1') return;
    rankPane.dataset.weeklyUpgraded = '1';

    const headerRow = rankPane.firstElementChild;
    if (headerRow) {
      headerRow.innerHTML = `
        <div style="font-size:15px; font-weight:800; display:flex; align-items:center; gap:6px;">
          <span>주간 리그</span>
          <span style="font-size:10.5px; font-weight:800; color:var(--primary); background:var(--primary-soft); padding:2px 7px; border-radius:99px;">20인 팀 승강전</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" onclick="openLeagueTierGuide()" style="background:var(--surface); color:var(--text-main); border:1px solid var(--border); padding:6px 9px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer;">10등급 안내</button>
          <button type="button" onclick="loadRanking()" style="background:var(--primary-soft); color:var(--primary); border:none; padding:6px 10px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer;">새로고침</button>
        </div>
      `;
    }
    const navRankBtn = document.getElementById('navBtnRank');
    if (navRankBtn) {
      const lbl = navRankBtn.querySelector('span:last-child');
      if (lbl) lbl.innerText = '주간리그';
    }
  }

  function renderWeeklyLeagueBoard(data) {
    const box = document.getElementById('rankingContainer');
    if (!box) return;

    const myTier = Number(data.myTier) || 0;
    const tierMeta = getTierMeta(myTier);
    const members = Array.isArray(data.members) ? data.members : [];
    const meRow = members.find(m => m.isMe);
    const myRank = meRow ? Number(meRow.rank) : '-';
    const myWeeklyXp = meRow ? Number(meRow.weeklyXp) : 0;
    const hasLastCeremony = Boolean(data.lastCeremony && Array.isArray(data.lastCeremony.podium) && data.lastCeremony.podium.length > 0);

    let zoneStatusBadge = '';
    if (meRow) {
      if (meRow.zone === 'PROMOTE') {
        zoneStatusBadge = myTier >= 9
          ? '<span style="color:#6D28D9; font-weight:800;">👑 마스터 왕좌 유지권</span>'
          : `<span style="color:#059669; font-weight:800;">▲ ${getTierMeta(myTier + 1).name} 승급권</span>`;
      } else if (meRow.zone === 'DEMOTE') {
        zoneStatusBadge = `<span style="color:#B91C1C; font-weight:800;">▼ ${getTierMeta(myTier - 1).name} 하락 위험</span>`;
      } else {
        zoneStatusBadge = `<span style="color:#475569; font-weight:800;">━ ${tierMeta.name} 유지권</span>`;
      }
    }

    let listHtml = '';
    members.forEach((m) => {
      const r = Number(m.rank) || 1;
      const isMe = Boolean(m.isMe);
      const isDemote = (m.zone === 'DEMOTE');
      const schoolTag = m.schoolInfo ? ` · ${safeEsc(m.schoolInfo)}` : '';
      const rClass = r === 1 ? 'r1' : (r === 2 ? 'r2' : (r === 3 ? 'r3' : ''));

      listHtml += `
        <div class="league-member-card ${isMe ? 'me' : ''} ${isDemote ? 'demote-risk' : ''}">
          <div style="display:flex; align-items:center; gap:10px; min-width:0;">
            <div class="league-rank-badge ${rClass}">${r}</div>
            <div style="min-width:0;">
              <div style="font-size:14px; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${safeEsc(m.userName || '익명')}<span style="font-size:11px; color:var(--text-sub); font-weight:500;">${schoolTag}</span>
                ${isMe ? '<span style="color:var(--primary); font-size:11px; font-weight:800;"> (나)</span>' : ''}
              </div>
              <div style="font-size:11px; color:var(--text-sub); font-weight:600; margin-top:2px; display:flex; align-items:center; gap:5px;">
                <span>🔥 ${Number(m.streak) || 1}일 연속</span>
                <span>·</span>
                <span>이번 주 4단계 ${Number(m.weeklyGold) || 0}개</span>
              </div>
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="font-size:14.5px; font-weight:800; color:var(--primary);">${Number(m.weeklyXp) || 0} XP</div>
            <div style="font-size:10px; font-weight:700; color:${m.zone === 'PROMOTE' ? '#059669' : (m.zone === 'DEMOTE' ? '#B91C1C' : '#64748B')};">
              ${m.zone === 'PROMOTE' ? (myTier >= 9 ? '마스터 수성' : '▲ 승급권') : (m.zone === 'DEMOTE' ? '▼ 하락권' : '━ 유지권')}
            </div>
          </div>
        </div>
      `;

      if (r === 12) {
        listHtml += `
          <div class="league-zone-divider promote">
            <span>▲ 여기까지 상위 등급 승급 구역 (1위 ~ 12위 · 12명)</span>
          </div>
        `;
      } else if (r === 17) {
        if (myTier <= 0) {
          listHtml += `
            <div class="league-zone-divider stay">
              <span>🛡️ 루키 보호 구역 (맨 아랫등급은 18~20위도 하락 없이 유지)</span>
            </div>
          `;
        } else {
          listHtml += `
            <div class="league-zone-divider demote">
              <span>▼ 아래 18위 ~ 20위는 하위 등급 하락 구역 (3명)</span>
            </div>
          `;
        }
      }
    });

    if (members.length > 0 && members.length < 12) {
      listHtml += `
        <div class="league-zone-divider promote">
          <span>▲ 12위 이내 상위 등급 승급 구역 (현재 팀 인원 ${members.length}/20명 · 신규 학습자 랜덤 합류 중)</span>
        </div>
      `;
    }

    box.innerHTML = `
      <div class="league-hero-card" style="background:linear-gradient(180deg, ${tierMeta.bg} 0%, #FFFFFF 68%); border-color:${tierMeta.border};">
        <div class="league-hero-top">
          <div>
            <div class="league-tier-title">
              <span>${safeEsc(tierMeta.name)} 리그</span>
              <span class="league-team-pill">${Number(data.teamNo) || 1}팀 (${members.length}/20명)</span>
            </div>
            <div style="font-size:12px; color:var(--text-sub); margin-top:5px; line-height:1.45;">
              내 주간 순위: <strong style="color:var(--text-main);">${myRank}위 (${myWeeklyXp} XP)</strong> · ${zoneStatusBadge}
            </div>
          </div>
          <div onclick="openLeagueTierGuide()" style="cursor:pointer; flex-shrink:0;" title="전체 10등급 보기">
            ${getLeagueTierLogoSvg(myTier, 52)}
          </div>
        </div>

        <div class="league-timer-bar">
          <span>⏰ 이번 주 승강 정산까지</span>
          <strong id="leagueCountdownText" style="color:var(--primary-dark);">계산 중...</strong>
        </div>

        <div class="league-rule-chips">
          <div class="league-rule-chip up">▲ 상위 12명 승급</div>
          <div class="league-rule-chip stay">━ 5명 등급 유지</div>
          <div class="league-rule-chip ${myTier === 0 ? 'stay' : 'down'}">${myTier === 0 ? '🛡️ 루키 하락 없음' : '▼ 하위 3명 하락'}</div>
        </div>

        <button type="button" class="btn-ceremony-replay" onclick="replayLastOrPreviewCeremony()">
          <span>🎬</span>
          <span>${hasLastCeremony ? '지난주 우리 팀 3·2·1등 하이라이트 보기' : '우리 팀 Top 3 스포트라이트 하이라이트 미리보기'}</span>
        </button>
      </div>

      ${listHtml || '<div style="text-align:center; padding:30px 0; color:var(--text-sub); font-size:13px;">팀원을 배정하는 중입니다...</div>'}
    `;

    startLeagueCountdown(data.secondsLeft);
  }

  window.loadRanking = async function () {
    injectLeagueAssetsOnce();
    upgradeRankTabHeader();
    const box = document.getElementById('rankingContainer');
    if (box) {
      box.innerHTML = '<div style="text-align:center; padding:34px 0; color:var(--text-sub); font-size:13px;">이번 주 20인 랜덤 팀 순위를 불러오는 중...</div>';
    }

    try {
      const { data, error } = await sb.rpc('get_my_weekly_league_dashboard');
      if (error) throw error;
      leagueCache = data;
      renderWeeklyLeagueBoard(data);

      // 미시청 지난주 정산 하이라이트가 있으면 즉시 자동 오픈!
      if (data && data.lastCeremony && data.lastCeremony.seen === false) {
        setTimeout(() => {
          const openingOv = document.getElementById('openingVideoOverlay');
          if (!openingOv || !openingOv.classList.contains('open')) {
            window.openWeeklyCeremonyModal(data.lastCeremony, false);
          }
        }, 350);
      }
    } catch (err) {
      if (box) {
        box.innerHTML = `
          <div style="text-align:center; padding:26px 14px; background:var(--surface); border:1px solid #FECACA; border-radius:14px; color:#B91C1C; font-size:12.5px; line-height:1.6;">
            <strong>주간 리그 서버 패치 대기 중</strong><br>
            수파베이스 SQL Editor에서 <code>4A단계_수파베이스_주간리그_SQL패치.sql</code>(또는 통합 SQL 파일)을 실행해 주세요.<br>
            <span style="font-size:11px; color:var(--text-sub);">(${safeEsc(err.message || err)})</span>
          </div>
        `;
      }
    }
  };

  // 로그인 직후에도 백그라운드에서 지난주 정산 하이라이트 여부를 자동 점검하여 공유 애니메이션 실행
  function hookPostLoginCeremonyCheck() {
    if (typeof window.setupUserView === 'function' && !window.setupUserView.__leagueWrapped) {
      const origSetup = window.setupUserView;
      const wrapped = function () {
        const res = origSetup.apply(this, arguments);
        injectLeagueAssetsOnce();
        upgradeRankTabHeader();

        const uid = (typeof myUser !== 'undefined' && myUser && myUser.userId) ? myUser.userId : '';
        if (uid && checkedAutoCeremonyUser !== uid && typeof sb !== 'undefined') {
          checkedAutoCeremonyUser = uid;
          sb.rpc('get_my_weekly_league_dashboard').then(({ data, error }) => {
            if (!error && data) {
              leagueCache = data;
              if (data.lastCeremony && data.lastCeremony.seen === false) {
                const waitOpening = setInterval(() => {
                  const ov = document.getElementById('openingVideoOverlay');
                  if (!ov || !ov.classList.contains('open')) {
                    clearInterval(waitOpening);
                    window.openWeeklyCeremonyModal(data.lastCeremony, false);
                  }
                }, 500);
              }
            }
          }).catch(() => {});
        }
        return res;
      };
      wrapped.__leagueWrapped = true;
      window.setupUserView = wrapped;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectLeagueAssetsOnce();
      upgradeRankTabHeader();
      hookPostLoginCeremonyCheck();
    });
  } else {
    injectLeagueAssetsOnce();
    upgradeRankTabHeader();
    hookPostLoginCeremonyCheck();
  }
})();
