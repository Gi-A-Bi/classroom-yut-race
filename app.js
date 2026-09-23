const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const TOKEN_META = [
  { animal: "호랑이", color: "#ef4444", position: "0% 0%" },
  { animal: "토끼", color: "#2563eb", position: "33.333% 0%" },
  { animal: "거북이", color: "#16a34a", position: "66.667% 0%" },
  { animal: "여우", color: "#eab308", position: "100% 0%" },
  { animal: "곰", color: "#9333ea", position: "0% 100%" },
  { animal: "까치", color: "#0891b2", position: "33.333% 100%" },
  { animal: "사슴", color: "#ec4899", position: "66.667% 100%" },
  { animal: "너구리", color: "#f97316", position: "100% 100%" },
];

const RESULT_META = [
  { label: "도", value: 1, hint: "1칸" },
  { label: "개", value: 2, hint: "2칸" },
  { label: "걸", value: 3, hint: "3칸" },
  { label: "윷", value: 4, hint: "4칸", bonus: true },
  { label: "모", value: 5, hint: "5칸", bonus: true },
  { label: "빽도", value: -1, hint: "뒤로 1칸", backdo: true },
];

const POS = {
  home: { x: 680, y: 680 },
  start: { x: 720, y: 720 },
  p1: { x: 680, y: 560 },
  p2: { x: 680, y: 440 },
  p3: { x: 680, y: 320 },
  p4: { x: 680, y: 200 },
  p5: { x: 680, y: 80 },
  p6: { x: 560, y: 80 },
  p7: { x: 440, y: 80 },
  p8: { x: 320, y: 80 },
  p9: { x: 200, y: 80 },
  p10: { x: 80, y: 80 },
  p11: { x: 80, y: 200 },
  p12: { x: 80, y: 320 },
  p13: { x: 80, y: 440 },
  p14: { x: 80, y: 560 },
  p15: { x: 80, y: 680 },
  p16: { x: 200, y: 680 },
  p17: { x: 320, y: 680 },
  p18: { x: 440, y: 680 },
  p19: { x: 560, y: 680 },
  a1: { x: 560, y: 200 },
  a2: { x: 470, y: 290 },
  c: { x: 380, y: 380 },
  a4: { x: 290, y: 470 },
  a5: { x: 200, y: 560 },
  b1: { x: 200, y: 200 },
  b2: { x: 290, y: 290 },
  b4: { x: 470, y: 470 },
  b5: { x: 560, y: 560 },
};

const ROUTES = {
  outer: [
    "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10",
    "p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "home",
  ],
  a: ["p5", "a1", "a2", "c", "a4", "a5", "p15", "p16", "p17", "p18", "p19", "home"],
  b: ["p10", "b1", "b2", "c", "b4", "b5", "home"],
};

const defaultNames = TOKEN_META.map((token) => `${token.animal}팀`);

let settings = {
  theme: "village",
  teamCount: 5,
  pieceCount: 2,
  showMoveHints: true,
  teamNames: [...defaultNames],
  teamOrder: TOKEN_META.map((_, index) => index),
};

let game = null;
let history = [];
let groupSequence = 0;
let toastTimer = null;
let audioContext = null;
let resultFlashTimer = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tokenStyle(tokenIndex) {
  return `background-position:${TOKEN_META[tokenIndex].position};`;
}

function renderSetup() {
  game = null;
  history = [];
  window.clearTimeout(resultFlashTimer);
  resultFlashTimer = null;
  document.body.dataset.theme = settings.theme;
  app.innerHTML = `
    <main class="screen setup-screen">
      <section class="brand-panel" aria-labelledby="game-title">
        <p class="brand-kicker"><span class="material-symbols-rounded">celebration</span> 실제 윷으로 함께 즐겨요</p>
        <h1 class="brand-title" id="game-title">우당탕!<span>교실 윷 레이스</span></h1>
        <img class="yut-hero" src="./yut-sticks-hero.webp" alt="공중으로 힘차게 던져진 네 개의 윷가락" />
      </section>

      <section class="setup-card" aria-label="게임 설정">
        <div class="setup-heading">
          <div>
            <h2>경기 준비</h2>
            <p>우리 반에 맞게 팀과 말을 정해요.</p>
          </div>
          <span class="material-symbols-rounded" aria-hidden="true" style="font-size:42px;color:#4f46e5">tune</span>
        </div>

        <h3 class="section-label"><span class="material-symbols-rounded">palette</span> 배경 선택</h3>
        <div class="theme-grid">
          ${renderThemeCard("village", "동물 마을 모험", "./theme-animal-village.webp", "park")}
          ${renderThemeCard("space", "우주 세계 레이스", "./theme-space-world.webp", "rocket_launch")}
        </div>

        <div class="settings-row">
          ${renderStepper("team", "팀 수", "기본 5팀", settings.teamCount, 2, 8)}
          ${renderStepper("piece", "팀별 말 수", "빠른 경기는 2개", settings.pieceCount, 1, 6)}
        </div>

        <div class="setting-box move-hint-setting">
          <div>
            <span class="setting-name">이동 가능 칸 표시</span>
            <span class="setting-hint">끄면 갈 수 있는 칸을 직접 찾아 눌러요.</span>
          </div>
          <button class="material-switch ${settings.showMoveHints ? "on" : ""}" type="button"
            role="switch" aria-checked="${settings.showMoveHints}" data-action="toggle-move-hints"
            aria-label="이동 가능 칸 표시 ${settings.showMoveHints ? "끄기" : "켜기"}">
            <span class="switch-track"><i></i></span>
            <strong><span class="material-symbols-rounded">${settings.showMoveHints ? "visibility" : "visibility_off"}</span>${settings.showMoveHints ? "표시" : "숨김"}</strong>
          </button>
        </div>

        <h3 class="section-label team-order-label"><span class="material-symbols-rounded">format_list_numbered</span> 팀 이름과 경기 순서</h3>
        <div class="team-editor" aria-label="팀 이름과 경기 순서">
          ${Array.from({ length: settings.teamCount }, (_, slot) => renderTeamInput(slot)).join("")}
        </div>

        <button class="start-button" type="button" data-action="start-game">
          <span class="material-symbols-rounded">play_arrow</span>
          경기 시작하기
        </button>
      </section>
    </main>
  `;

  bindSetupEvents();
}

function renderThemeCard(value, label, image, icon) {
  const selected = settings.theme === value;
  return `
    <button class="theme-card ${selected ? "selected" : ""}" type="button" data-theme-choice="${value}" aria-pressed="${selected}">
      <img src="${image}" alt="" />
      <span class="theme-name"><span>${label}</span><span class="material-symbols-rounded">${selected ? "check_circle" : icon}</span></span>
    </button>
  `;
}

function renderStepper(key, name, hint, value, min, max) {
  return `
    <div class="setting-box">
      <div>
        <span class="setting-name">${name}</span>
        <span class="setting-hint">${hint}</span>
      </div>
      <div class="stepper" aria-label="${name} 조정">
        <button type="button" data-stepper="${key}" data-delta="-1" aria-label="${name} 줄이기" ${value <= min ? "disabled" : ""}>
          <span class="material-symbols-rounded">remove</span>
        </button>
        <strong aria-live="polite">${value}</strong>
        <button type="button" data-stepper="${key}" data-delta="1" aria-label="${name} 늘리기" ${value >= max ? "disabled" : ""}>
          <span class="material-symbols-rounded">add</span>
        </button>
      </div>
    </div>
  `;
}

function renderTeamInput(slot) {
  const tokenIndex = settings.teamOrder[slot];
  const token = TOKEN_META[tokenIndex];
  return `
    <div class="team-input" style="--team-color:${token.color}">
      <span class="order-number" aria-label="${slot + 1}번째">${slot + 1}</span>
      <span class="token-portrait" style="${tokenStyle(tokenIndex)}" aria-hidden="true"></span>
      <input type="text" maxlength="12" value="${escapeHtml(settings.teamNames[tokenIndex])}" data-team-name="${tokenIndex}" aria-label="${slot + 1}번째 팀 이름" />
      <span class="order-controls" aria-label="${escapeHtml(settings.teamNames[tokenIndex])} 순서 변경">
        <button class="order-button" type="button" data-order-slot="${slot}" data-order-delta="-1" aria-label="${escapeHtml(settings.teamNames[tokenIndex])} 순서를 위로" ${slot === 0 ? "disabled" : ""}>
          <span class="material-symbols-rounded">keyboard_arrow_up</span>
        </button>
        <button class="order-button" type="button" data-order-slot="${slot}" data-order-delta="1" aria-label="${escapeHtml(settings.teamNames[tokenIndex])} 순서를 아래로" ${slot === settings.teamCount - 1 ? "disabled" : ""}>
          <span class="material-symbols-rounded">keyboard_arrow_down</span>
        </button>
      </span>
    </div>
  `;
}

function bindSetupEvents() {
  app.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.theme = button.dataset.themeChoice;
      renderSetup();
    });
  });

  app.querySelectorAll("[data-stepper]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.stepper;
      const delta = Number(button.dataset.delta);
      if (key === "team") {
        settings.teamCount = Math.max(2, Math.min(8, settings.teamCount + delta));
      } else {
        settings.pieceCount = Math.max(1, Math.min(6, settings.pieceCount + delta));
      }
      renderSetup();
    });
  });

  app.querySelectorAll("[data-team-name]").forEach((input) => {
    input.addEventListener("input", () => {
      settings.teamNames[Number(input.dataset.teamName)] = input.value;
    });
  });

  app.querySelectorAll("[data-order-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      const from = Number(button.dataset.orderSlot);
      const to = from + Number(button.dataset.orderDelta);
      moveTeamOrder(from, to);
    });
  });

  app.querySelector("[data-action='toggle-move-hints']").addEventListener("click", () => {
    settings.showMoveHints = !settings.showMoveHints;
    renderSetup();
  });

  app.querySelector("[data-action='start-game']").addEventListener("click", startGame);
}

function moveTeamOrder(from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= settings.teamCount || to >= settings.teamCount) {
    return false;
  }
  [settings.teamOrder[from], settings.teamOrder[to]] = [settings.teamOrder[to], settings.teamOrder[from]];
  renderSetup();
  return true;
}

function createGroup(teamId) {
  groupSequence += 1;
  return {
    id: `g-${teamId}-${groupSequence}`,
    count: 1,
    status: "start",
    route: "outer",
    index: -1,
    node: null,
  };
}

function startGame() {
  groupSequence = 0;
  const teams = Array.from({ length: settings.teamCount }, (_, index) => ({
    tokenIndex: settings.teamOrder[index],
    id: `team-${index}`,
    name: settings.teamNames[settings.teamOrder[index]].trim() || defaultNames[settings.teamOrder[index]],
    color: TOKEN_META[settings.teamOrder[index]].color,
    finished: 0,
    groups: Array.from({ length: settings.pieceCount }, () => createGroup(index)),
  }));

  game = {
    teams,
    turnIndex: 0,
    pendingResult: null,
    targets: [],
    noMove: false,
    bonusQueue: 0,
    message: "실제 윷을 던진 뒤 나온 결과를 눌러 주세요.",
    effect: null,
    resultFlash: null,
    hintsRevealed: settings.showMoveHints,
    arrivedGroupId: null,
    rankings: [],
    over: false,
    pieceEdit: null,
    sound: true,
    modal: null,
  };
  history = [];
  renderGame();
}

function renderGame() {
  if (!game) return renderSetup();
  const activeTeam = game.teams[game.turnIndex];
  document.body.dataset.theme = settings.theme;
  app.innerHTML = `
    <main class="screen game-screen theme-${settings.theme} ${game.effect ? `fx-${game.effect.type}` : ""} ${game.resultFlash?.kind ? `result-${game.resultFlash.kind}` : ""}" style="--active-team-color:${activeTeam.color}">
      ${renderAmbientFx()}
      ${renderResultFlash()}
      ${renderSpecialEvent()}
      <header class="game-topbar">
        <div class="game-title"><span class="material-symbols-rounded">toys_and_games</span> 교실 윷 레이스</div>
        <div class="team-score-strip" style="--team-count:${game.teams.length}">
          ${game.teams.map((team, index) => renderScoreCard(team, index)).join("")}
        </div>
      </header>

      <div class="game-layout">
        <section class="board-stage" aria-label="윷놀이판">
          <div class="board-shell ${game.pendingResult && game.hintsRevealed ? "choosing-destination" : ""} ${game.pendingResult && !game.hintsRevealed ? "challenge-mode" : ""} ${game.pieceEdit ? "editing-pieces" : ""}">
            ${renderBoard()}
          </div>
        </section>
        ${renderControlPanel(activeTeam)}
      </div>
    </main>
    ${renderModal()}
  `;
  bindGameEvents();
}

function renderAmbientFx() {
  const particles = Array.from({ length: 16 }, (_, index) => {
    const x = (index * 37 + 9) % 96;
    const y = (index * 61 + 7) % 92;
    const size = 5 + (index % 5) * 3;
    return `<span style="--x:${x}%;--y:${y}%;--size:${size}px;--delay:${(index % 8) * -0.7}s;--duration:${5 + (index % 6)}s"></span>`;
  }).join("");
  return `<div class="ambient-fx" aria-hidden="true">${particles}</div><div class="screen-vignette" aria-hidden="true"></div>`;
}

function renderResultFlash() {
  if (!game.resultFlash) return "";
  const classes = [game.resultFlash.bonus ? "bonus" : "", game.resultFlash.backdo ? "backdo" : "", game.resultFlash.kind || ""].filter(Boolean).join(" ");
  const specialCopy = game.resultFlash.kind === "yut" ? "한 번 더!" : game.resultFlash.kind === "mo" ? "최고 이동!" : "";
  const ornaments = game.resultFlash.kind === "yut"
    ? `<span class="yut-stick stick-one"></span><span class="yut-stick stick-two"></span><span class="yut-stick stick-three"></span><span class="yut-stick stick-four"></span>`
    : game.resultFlash.kind === "mo"
      ? `<span class="mo-orbit orbit-one"></span><span class="mo-orbit orbit-two"></span><span class="mo-star">★</span>`
      : "";
  return `
    <div class="result-flash ${classes}" aria-hidden="true">
      <span class="result-flash-kicker">윷 결과</span>
      <strong>${escapeHtml(game.resultFlash.label)}</strong>
      <small>${escapeHtml(game.resultFlash.hint)}</small>
      ${specialCopy ? `<em>${specialCopy}</em>` : ""}
      ${ornaments}
      <i></i><i></i><i></i><i></i>
    </div>
  `;
}

function renderSpecialEvent() {
  if (game.effect?.type !== "capture") return "";
  const shards = Array.from({ length: 12 }, (_, index) => `<i style="--angle:${index * 30}deg;--delay:${index * 14}ms"></i>`).join("");
  return `
    <div class="capture-flash" aria-hidden="true">
      <span>상대 말을</span>
      <strong>잡았다!</strong>
      <small>${game.effect.count || 1}개 말 출발점으로!</small>
      <div class="capture-shards">${shards}</div>
    </div>
  `;
}

function getTeamRank(team) {
  const position = game.rankings.indexOf(team.id);
  return position === -1 ? null : position + 1;
}

function renderScoreCard(team, index) {
  const waiting = team.groups.filter((group) => group.status === "start").reduce((sum, group) => sum + group.count, 0);
  const rank = getTeamRank(team);
  const isActive = !game.over && index === game.turnIndex && rank === null;
  return `
    <div class="team-score ${isActive ? "active" : ""} ${rank ? `ranked rank-${rank}` : ""}" style="--team-color:${team.color}">
      <span class="mini-token" style="${tokenStyle(team.tokenIndex)}" aria-hidden="true"></span>
      <div class="score-copy">
        <strong>${escapeHtml(team.name)}</strong>
        <span>${rank ? `${rank}위 확정 · 도착 ${team.finished}/${settings.pieceCount}` : `도착 ${team.finished}/${settings.pieceCount} · 대기 ${waiting}`}</span>
      </div>
      ${rank ? `<span class="rank-badge" aria-label="${rank}위">${rank}위</span>` : ""}
    </div>
  `;
}

function boardSvg() {
  const outer = ["home", ...ROUTES.outer];
  const diagonalA = ["p5", "a1", "a2", "c", "a4", "a5", "p15"];
  const diagonalB = ["p10", "b1", "b2", "c", "b4", "b5", "home"];
  const pointList = (ids) => ids.map((id) => `${POS[id].x},${POS[id].y}`).join(" ");
  const visibleNodes = [...new Set(["home", ...ROUTES.outer.slice(0, -1), ...diagonalA, ...diagonalB])];
  return `
    <svg class="yut-board" viewBox="0 0 760 760" role="img" aria-label="네 모서리와 가운데 지름길이 있는 윷판">
      <polyline class="board-path" points="${pointList(outer)}" />
      <polyline class="board-path" points="${pointList(diagonalA)}" />
      <polyline class="board-path" points="${pointList(diagonalB)}" />
      ${visibleNodes.map((id) => {
        const point = POS[id];
        const important = ["home", "p5", "p10", "p15", "c"].includes(id);
        const className = id === "home" ? "home" : id === "c" ? "center" : important ? "corner" : "";
        const radius = id === "home" ? 43 : important ? 34 : 24;
        return `<circle class="board-node ${className}" cx="${point.x}" cy="${point.y}" r="${radius}" />`;
      }).join("")}
      <text class="home-mark" x="680" y="688">도착</text>
    </svg>
  `;
}

function renderBoard() {
  const eligibleIds = new Set(
    game.targets.flatMap((target) => target.options.map((option) => option.sourceId)),
  );
  const pieces = game.teams.flatMap((team) =>
    team.groups
      .filter((group) => group.status === "board")
      .map((group) => renderPiece(team, group, eligibleIds.has(group.id) && game.hintsRevealed)),
  );
  const targets = game.targets.map((target, index) => renderDestination(target, index)).join("");
  const effect = game.effect ? renderEffect(game.effect) : "";
  const editNodes = game.pieceEdit ? renderEditNodes() : "";
  return `${boardSvg()}${editNodes}${pieces.join("")}${targets}${effect}`;
}

const BOARD_NODE_IDS = Object.keys(POS).filter((id) => id !== "start");

function renderEditNodes() {
  if (!game.pieceEdit?.selected) return "";
  return BOARD_NODE_IDS.map((id) => {
    const point = POS[id];
    return `<button class="edit-node" type="button" data-edit-node="${id}" aria-label="${id === "home" ? "출발점" : "칸"}에 놓기"
      style="left:${toPercent(point.x)};top:${toPercent(point.y)}"></button>`;
  }).join("");
}

function renderPiece(team, group, eligible) {
  const point = POS[group.node];
  const visibleLayers = Math.min(group.count, 3);
  const layers = Array.from({ length: visibleLayers }, (_, index) => {
    const offset = (visibleLayers - index - 1) * 7;
    return `<span class="token-layer" style="${tokenStyle(team.tokenIndex)} transform:translateY(${offset}px);z-index:${index + 1}"></span>`;
  }).join("");
  const editing = Boolean(game.pieceEdit);
  const selected = game.pieceEdit?.selected?.groupId === group.id;
  return `
    <div class="piece-wrapper ${eligible ? "eligible" : ""} ${game.arrivedGroupId === group.id ? "arrived" : ""} ${editing ? "editable" : ""} ${selected ? "selected" : ""}"
      ${editing ? `data-edit-piece="${group.id}" role="button" tabindex="0"` : ""}
      style="left:${toPercent(point.x)};top:${toPercent(point.y)}" aria-label="${escapeHtml(team.name)} 말 ${group.count}개">
      ${layers}
      ${group.count > 1 ? `<span class="stack-badge">×${group.count}</span>` : ""}
    </div>
  `;
}

function renderDestination(target, index) {
  const point = POS[target.node];
  const label = target.finish ? "도착" : target.node === "home" ? "출발점" : target.options.some((option) => option.route !== "outer") ? "지름길" : "이동";
  return `
    <button class="destination-button ${game.hintsRevealed ? "" : "hidden-hint"}" type="button" data-target-index="${index}"
      data-target-label="${label}" style="--target-index:${index};left:${toPercent(point.x)};top:${toPercent(point.y)}" aria-label="${label} 칸으로 이동">
      ${target.finish ? "도착" : `<span>${label}</span><small>선택</small>`}
    </button>
  `;
}

function renderEffect(effect) {
  const point = POS[effect.node] || POS.home;
  const sparks = Array.from({ length: 10 }, (_, index) => `<span class="effect-spark" style="--angle:${index * 36}deg;--delay:${index * 18}ms"></span>`).join("");
  return `
    <div class="effect-sprite ${effect.type}" style="left:${toPercent(point.x)};top:${toPercent(point.y)}" aria-hidden="true">
      <span class="effect-ring ring-one"></span>
      <span class="effect-ring ring-two"></span>
      ${sparks}
    </div>
  `;
}

function toPercent(value) {
  return `${(value / 760) * 100}%`;
}

function renderControlPanel(activeTeam) {
  const instruction = game.over
    ? "모든 순위가 정해졌어요. 새 경기를 시작하거나 같은 설정으로 다시 해 보세요."
    : game.pendingResult
      ? game.hintsRevealed
        ? "윷판에서 반짝이는 칸을 골라 눌러 주세요."
        : "도전 모드! 갈 수 있는 칸을 직접 찾아 눌러 주세요."
      : "실제 윷을 던진 뒤 나온 결과를 눌러 주세요.";
  return `
    <aside class="control-panel" aria-label="경기 조작">
      <div class="turn-card">
        <span class="token-portrait" style="${tokenStyle(activeTeam.tokenIndex)}" aria-hidden="true"></span>
        <div class="turn-copy">
          <span>${game.over ? "경기 종료" : "지금은"}</span>
          <strong>${game.over ? "순위가 모두 정해졌어요" : `${escapeHtml(activeTeam.name)} 차례`}</strong>
        </div>
      </div>

      ${game.pieceEdit ? renderPieceEditPanel() : `
      <div class="instruction-box">${instruction}</div>

      <div class="result-grid" aria-label="윷 결과 선택">
        ${RESULT_META.map((result) => `
          <button class="result-button ${result.bonus ? "bonus" : ""} ${result.backdo ? "backdo" : ""}"
            type="button" data-result="${result.value}" ${game.pendingResult || game.over ? "disabled" : ""}>
            ${result.label} <small>${result.hint}</small>
          </button>
        `).join("")}
      </div>

      ${game.pendingResult ? `
        <div class="selected-result">
          <strong>${game.pendingResult.label} · ${game.pendingResult.hint}</strong>
          <span>
            <button class="text-button" type="button" data-action="cancel-result">다시 선택</button>
            ${!game.hintsRevealed && !game.noMove ? `<button class="hint-button" type="button" data-action="show-hints"><span class="material-symbols-rounded">lightbulb</span> 힌트 보기</button>` : ""}
            ${game.noMove ? `<button class="pass-button" type="button" data-action="pass-turn">차례 넘기기</button>` : ""}
          </span>
        </div>
      ` : ""}

      `}

      <div class="turn-message">
        ${escapeHtml(game.message)}
        ${game.bonusQueue > 0 ? `<span class="extra-pill"><span class="material-symbols-rounded">replay</span> 남은 추가 던지기 ${game.bonusQueue}회</span>` : ""}
      </div>

      <div class="panel-actions">
        ${actionButton("undo", "undo", "되돌리기", history.length === 0)}
        ${actionButton("adjust", "tune", "경기 조정")}
        ${actionButton("help", "help", "도움말")}
        ${actionButton("sound", game.sound ? "volume_up" : "volume_off", "소리")}
        ${actionButton("fullscreen", "fullscreen", "전체 화면")}
        ${actionButton("new", "home", "새 경기")}
      </div>
    </aside>
  `;
}

function findGroup(groupId) {
  for (const team of game.teams) {
    const group = team.groups.find((item) => item.id === groupId);
    if (group) return { team, group };
  }
  return null;
}

function renderPieceEditPanel() {
  const selected = game.pieceEdit.selected ? findGroup(game.pieceEdit.selected.groupId) : null;
  const selectedCount = selected ? (game.pieceEdit.selected.single ? 1 : selected.group.count) : 0;
  const teamRows = game.teams.map((team) => {
    const waiting = team.groups.filter((group) => group.status === "start").length;
    const onBoard = team.groups.filter((group) => group.status === "board").reduce((sum, group) => sum + group.count, 0);
    const waitingSelected = selected && selected.team.id === team.id && selected.group.status === "start";
    return `
      <li class="edit-team-row" style="--team-color:${team.color}">
        <span class="mini-token" style="${tokenStyle(team.tokenIndex)}" aria-hidden="true"></span>
        <div class="edit-team-copy">
          <strong>${escapeHtml(team.name)}</strong>
          <span>판 위 ${onBoard} · 대기 ${waiting} · 도착 ${team.finished}</span>
        </div>
        <button class="edit-pick ${waitingSelected ? "on" : ""}" type="button" data-edit-waiting="${team.id}" ${waiting === 0 ? "disabled" : ""}>대기 말</button>
        <button class="edit-pick" type="button" data-edit-finished="${team.id}" ${team.finished === 0 ? "disabled" : ""}>도착 말</button>
      </li>
    `;
  }).join("");
  const selectionText = !selected
    ? "옮길 말을 골라 주세요. 윷판의 말을 누르거나 아래에서 대기 말·도착 말을 고를 수 있어요."
    : selected.group.status === "start"
      ? `${selected.team.name}의 대기 말 1개를 골랐어요. 윷판에서 놓을 칸을 누르세요.`
      : selected.group.status === "finished"
        ? `${selected.team.name}의 도착 말 1개를 골랐어요. 윷판에서 놓을 칸을 누르거나 대기로 보내세요.`
        : `${selected.team.name} 말 ${selectedCount}개를 골랐어요. 윷판에서 놓을 칸을 누르세요.`;
  return `
    <div class="edit-panel">
      <div class="edit-heading">
        <span class="material-symbols-rounded">open_with</span>
        <strong>말 옮기기</strong>
      </div>
      <div class="instruction-box">${selectionText}</div>
      ${selected && selected.group.status === "board" && selected.group.count > 1 ? `
        <div class="edit-count-toggle" role="group" aria-label="옮길 개수">
          <button class="${game.pieceEdit.selected.single ? "" : "on"}" type="button" data-edit-single="0">묶음 전체 (${selected.group.count}개)</button>
          <button class="${game.pieceEdit.selected.single ? "on" : ""}" type="button" data-edit-single="1">1개만</button>
        </div>
      ` : ""}
      <div class="edit-actions">
        <button class="edit-action" type="button" data-edit-place="waiting" ${!selected || selected.group.status === "start" ? "disabled" : ""}><span class="material-symbols-rounded">undo</span> 대기로 보내기</button>
        <button class="edit-action" type="button" data-edit-place="finish" ${!selected || selected.group.status === "finished" ? "disabled" : ""}><span class="material-symbols-rounded">flag</span> 도착 처리</button>
        <button class="edit-action subtle" type="button" data-edit-place="clear" ${!selected ? "disabled" : ""}>선택 취소</button>
      </div>
      <ul class="edit-team-list" aria-label="팀별 말">${teamRows}</ul>
      <button class="edit-done" type="button" data-action="finish-piece-edit"><span class="material-symbols-rounded">check</span> 옮기기 끝내기</button>
    </div>
  `;
}

function actionButton(action, icon, label, disabled = false) {
  return `
    <button class="icon-button" type="button" data-action="${action}" aria-label="${label}" title="${label}" ${disabled ? "disabled" : ""}>
      <span class="material-symbols-rounded">${icon}</span>
    </button>
  `;
}

function renderConfetti() {
  return Array.from({ length: 28 }, (_, index) => {
    const x = (index * 43 + 5) % 100;
    const drift = (index % 2 === 0 ? 1 : -1) * (30 + (index % 5) * 14);
    return `<i style="--x:${x}%;--delay:${(index % 10) * -0.12}s;--hue:${(index * 47) % 360};--drift:${drift}px"></i>`;
  }).join("");
}

function renderRankingList() {
  return `
    <ol class="ranking-list" aria-label="최종 순위">
      ${game.rankings.map((teamId, index) => {
        const team = game.teams.find((item) => item.id === teamId);
        return `
          <li class="ranking-row rank-${index + 1}" style="--team-color:${team.color}">
            <span class="rank-badge">${index + 1}위</span>
            <span class="mini-token" style="${tokenStyle(team.tokenIndex)}" aria-hidden="true"></span>
            <strong>${escapeHtml(team.name)}</strong>
          </li>
        `;
      }).join("")}
    </ol>
  `;
}

function renderAdjustModal() {
  const currentTeam = game.teams[game.turnIndex];
  const rows = game.teams.map((team, index) => {
    const rank = getTeamRank(team);
    const onBoard = team.groups.filter((group) => group.status === "board").reduce((sum, group) => sum + group.count, 0);
    const waiting = team.groups.filter((group) => group.status === "start").reduce((sum, group) => sum + group.count, 0);
    const isCurrent = !game.over && index === game.turnIndex;
    return `
      <li class="adjust-row ${isCurrent ? "current" : ""} ${rank ? `ranked rank-${rank}` : ""}" style="--team-color:${team.color}">
        <div class="adjust-order">
          <button type="button" data-adjust="order" data-team="${team.id}" data-delta="-1" aria-label="${escapeHtml(team.name)} 순서 앞으로" ${index === 0 ? "disabled" : ""}><span class="material-symbols-rounded">keyboard_arrow_up</span></button>
          <button type="button" data-adjust="order" data-team="${team.id}" data-delta="1" aria-label="${escapeHtml(team.name)} 순서 뒤로" ${index === game.teams.length - 1 ? "disabled" : ""}><span class="material-symbols-rounded">keyboard_arrow_down</span></button>
        </div>
        <span class="mini-token" style="${tokenStyle(team.tokenIndex)}" aria-hidden="true"></span>
        <div class="adjust-copy">
          <strong>${escapeHtml(team.name)} ${rank ? `<span class="rank-badge">${rank}위</span>` : ""}</strong>
          <span>판 위 ${onBoard} · 대기 ${waiting}</span>
        </div>
        <button class="turn-pick ${isCurrent ? "on" : ""}" type="button" data-adjust="turn" data-team="${team.id}" ${rank ? "disabled" : ""}>
          <span class="material-symbols-rounded">${isCurrent ? "check_circle" : "radio_button_unchecked"}</span>${isCurrent ? "지금 차례" : "차례로"}
        </button>
        <div class="adjust-stepper" aria-label="${escapeHtml(team.name)} 도착한 말 수">
          <button type="button" data-adjust="finished" data-team="${team.id}" data-delta="-1" aria-label="도착 말 줄이기" ${team.finished <= 0 ? "disabled" : ""}><span class="material-symbols-rounded">remove</span></button>
          <strong>도착 ${team.finished}/${settings.pieceCount}</strong>
          <button type="button" data-adjust="finished" data-team="${team.id}" data-delta="1" aria-label="도착 말 늘리기" ${team.finished >= settings.pieceCount ? "disabled" : ""}><span class="material-symbols-rounded">add</span></button>
        </div>
      </li>
    `;
  }).join("");
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="adjust-title">
      <div class="modal adjust-modal">
        <h2 id="adjust-title"><span class="material-symbols-rounded">tune</span> 경기 조정</h2>
        <p>교실 상황에 맞게 차례, 팀 순서, 추가 던지기, 도착한 말 수를 바로 고칠 수 있어요. 고친 내용은 되돌리기로 되돌릴 수 있어요.</p>

        <div class="adjust-bonus">
          <div>
            <strong>추가 던지기</strong>
            <span>${game.over ? "경기가 끝나 있어요." : `${escapeHtml(currentTeam.name)}에게 남은 추가 던지기`}</span>
          </div>
          <div class="adjust-stepper">
            <button type="button" data-adjust="bonus" data-delta="-1" aria-label="추가 던지기 줄이기" ${game.bonusQueue <= 0 || game.over ? "disabled" : ""}><span class="material-symbols-rounded">remove</span></button>
            <strong>${game.bonusQueue}회</strong>
            <button type="button" data-adjust="bonus" data-delta="1" aria-label="추가 던지기 늘리기" ${game.over ? "disabled" : ""}><span class="material-symbols-rounded">add</span></button>
          </div>
        </div>

        <ul class="adjust-list" aria-label="팀별 조정">${rows}</ul>

        <div class="modal-actions">
          <button class="modal-button secondary" type="button" data-modal-action="piece-edit"><span class="material-symbols-rounded">open_with</span> 말 위치 직접 옮기기</button>
          <button class="modal-button" type="button" data-modal-action="close">닫기</button>
        </div>
      </div>
    </div>
  `;
}

function renderModal() {
  if (!game) return "";
  if (game.modal === "adjust") return renderAdjustModal();
  if (game.over) {
    const winner = game.teams.find((team) => team.id === game.rankings[0]);
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="victory-title">
        <div class="victory-confetti" aria-hidden="true">${renderConfetti()}</div>
        <div class="modal victory-modal">
          <div class="victory-trophy" aria-hidden="true"></div>
          <h2 id="victory-title">${escapeHtml(winner.name)} 우승!</h2>
          <p>모든 팀의 순위가 정해졌어요. 멋진 경기였어요!</p>
          ${renderRankingList()}
          <div class="modal-actions" style="justify-content:center">
            <button class="modal-button secondary" type="button" data-modal-action="adjust">경기 조정</button>
            <button class="modal-button secondary" type="button" data-modal-action="setup">설정으로</button>
            <button class="modal-button" type="button" data-modal-action="replay">같은 설정으로 다시</button>
          </div>
        </div>
      </div>
    `;
  }

  if (game.modal?.type === "rank") {
    const team = game.teams.find((item) => item.id === game.modal.teamId);
    const rank = game.modal.rank;
    const remaining = game.teams.length - game.rankings.length;
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rank-title">
        ${rank === 1 ? `<div class="victory-confetti" aria-hidden="true">${renderConfetti()}</div>` : ""}
        <div class="modal victory-modal rank-modal rank-${rank}">
          ${rank === 1 ? `<div class="victory-trophy" aria-hidden="true"></div>` : `<div class="rank-medal" aria-hidden="true">${rank}</div>`}
          <h2 id="rank-title">${escapeHtml(team.name)} ${rank === 1 ? "우승!" : `${rank}위!`}</h2>
          <p>${rank === 1 ? "모든 말이 가장 먼저 도착했어요!" : "모든 말이 도착했어요!"} 남은 ${remaining}팀은 순위가 모두 정해질 때까지 계속 경기해요.</p>
          <div class="modal-actions" style="justify-content:center">
            <button class="modal-button" type="button" data-modal-action="close">경기 계속하기</button>
          </div>
        </div>
      </div>
    `;
  }

  if (game.modal === "help") {
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div class="modal">
          <h2 id="help-title">경기 방법</h2>
          <ol>
            <li>실제 윷을 던져요.</li>
            <li>나온 결과를 오른쪽에서 눌러요.</li>
            <li>윷판에 표시된 이동 가능 칸 중 하나를 눌러요.</li>
            <li>설정에서 표시를 끄면 갈 수 있는 칸을 직접 찾는 도전 모드가 돼요.</li>
            <li>같은 팀 말을 만나면 업고, 다른 팀 말을 만나면 잡아요.</li>
            <li>가운데에 멈춘 말은 다음 차례에 도착점 쪽 가장 짧은 길로 갈 수 있어요.</li>
            <li>윷·모 또는 잡기에 성공하면 한 번 더 던져요.</li>
            <li>첫 칸에서 빽도가 나오면 말이 출발점에 머물고, 다음에 도 이상이 나오면 바로 도착해요.</li>
            <li>경기 조정 버튼으로 차례, 팀 순서, 추가 던지기, 도착한 말 수를 언제든 고칠 수 있어요.</li>
            <li>경기 조정의 "말 위치 직접 옮기기"로 잘못 놓인 말을 아무 칸으로나 옮기거나 대기·도착으로 보낼 수 있어요.</li>
            <li>모든 말이 도착한 팀은 순위가 정해지고, 남은 팀들은 순위가 모두 정해질 때까지 계속 경기해요.</li>
          </ol>
          <div class="modal-actions">
            <button class="modal-button" type="button" data-modal-action="close">확인</button>
          </div>
        </div>
      </div>
    `;
  }

  if (game.modal === "new") {
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-title">
        <div class="modal">
          <h2 id="new-title">새 경기를 시작할까요?</h2>
          <p>현재 경기 내용은 사라지고 팀 설정 화면으로 돌아가요.</p>
          <div class="modal-actions">
            <button class="modal-button secondary" type="button" data-modal-action="close">계속하기</button>
            <button class="modal-button" type="button" data-modal-action="setup">새 경기</button>
          </div>
        </div>
      </div>
    `;
  }

  if (game.modal?.type === "choose-piece") {
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="piece-title">
        <div class="modal">
          <h2 id="piece-title">어느 말을 움직일까요?</h2>
          <p>같은 칸으로 갈 수 있는 말이 여러 개예요.</p>
          <div class="modal-actions">
            <button class="modal-button secondary" type="button" data-modal-action="close">취소</button>
            ${game.modal.options.map((option, index) => `
              <button class="modal-button" type="button" data-option-index="${index}">${escapeHtml(describeSource(option))}</button>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function bindGameEvents() {
  app.querySelectorAll("[data-result]").forEach((button) => {
    button.addEventListener("click", () => chooseResult(Number(button.dataset.result)));
  });

  app.querySelectorAll("[data-target-index]").forEach((button) => {
    button.addEventListener("click", () => chooseTarget(Number(button.dataset.targetIndex)));
  });

  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });

  app.querySelectorAll("[data-modal-action]").forEach((button) => {
    button.addEventListener("click", () => handleModalAction(button.dataset.modalAction));
  });

  app.querySelectorAll("[data-adjust]").forEach((button) => {
    button.addEventListener("click", () => handleAdjust(button.dataset.adjust, button.dataset.team, Number(button.dataset.delta || 0)));
  });

  app.querySelectorAll("[data-edit-piece]").forEach((element) => {
    const select = () => selectEditPiece(element.dataset.editPiece);
    element.addEventListener("click", select);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
  });
  app.querySelectorAll("[data-edit-waiting]").forEach((button) => {
    button.addEventListener("click", () => selectWaitingPiece(button.dataset.editWaiting));
  });
  app.querySelectorAll("[data-edit-finished]").forEach((button) => {
    button.addEventListener("click", () => selectFinishedPiece(button.dataset.editFinished));
  });
  app.querySelectorAll("[data-edit-single]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!game.pieceEdit?.selected) return;
      game.pieceEdit.selected.single = button.dataset.editSingle === "1";
      renderGame();
    });
  });
  app.querySelectorAll("[data-edit-node]").forEach((button) => {
    button.addEventListener("click", () => placeSelectedPiece(button.dataset.editNode));
  });
  app.querySelectorAll("[data-edit-place]").forEach((button) => {
    button.addEventListener("click", () => {
      const where = button.dataset.editPlace;
      if (where === "clear") {
        discardFinishedSelection();
        game.pieceEdit.selected = null;
        renderGame();
      } else {
        placeSelectedPiece(where);
      }
    });
  });

  app.querySelectorAll("[data-option-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = game.modal.options[Number(button.dataset.optionIndex)];
      game.modal = null;
      executeMove(option);
    });
  });
}

function chooseResult(value) {
  if (!game || game.pendingResult || game.over) return;
  const result = RESULT_META.find((item) => item.value === value);
  if (!result) return;
  const activeTeam = game.teams[game.turnIndex];
  const options = getMoveOptions(activeTeam, value);

  game.resultFlash = {
    label: result.label,
    hint: result.hint,
    bonus: Boolean(result.bonus),
    backdo: Boolean(result.backdo),
    kind: value === 4 ? "yut" : value === 5 ? "mo" : value < 0 ? "backdo" : "normal",
  };
  game.hintsRevealed = settings.showMoveHints;

  playSound(value < 0 ? "back" : value === 4 ? "yut" : value === 5 ? "mo" : "select");

  if (options.length === 0) {
    game.pendingResult = result;
    game.targets = [];
    game.noMove = true;
    game.message = `${result.label}: 움직일 수 있는 말이 없어요. 결과를 고치거나 차례를 넘겨 주세요.`;
    renderGame();
    scheduleResultFlashClear();
    return;
  }

  game.pendingResult = result;
  game.noMove = false;
  game.targets = groupOptionsByDestination(options);
  game.message = settings.showMoveHints
    ? `${result.label}이 나왔어요. 반짝이는 ${game.targets.length}곳 중 갈 곳을 골라 주세요.`
    : `${result.label}이 나왔어요. 갈 수 있는 칸을 직접 찾아 눌러 주세요.`;
  renderGame();
  scheduleResultFlashClear();
}

function scheduleResultFlashClear() {
  window.clearTimeout(resultFlashTimer);
  const duration = game?.resultFlash?.bonus ? 1680 : 880;
  resultFlashTimer = window.setTimeout(() => {
    if (!game?.resultFlash) return;
    game.resultFlash = null;
    renderGame();
  }, duration);
}

function getMoveOptions(team, value) {
  const options = [];
  for (const group of team.groups) {
    if (group.status === "start") {
      if (value > 0) options.push(makeForwardOption(group, "outer", -1, value));
      continue;
    }
    if (group.status !== "board") continue;

    if (value < 0) {
      options.push(makeBackwardOption(group));
      continue;
    }

    if (group.route === "outer" && group.node === "p5") {
      options.push(makeForwardOption(group, "outer", group.index, value));
      options.push(makeForwardOption(group, "a", 0, value));
    } else if (group.route === "outer" && group.node === "p10") {
      options.push(makeForwardOption(group, "outer", group.index, value));
      options.push(makeForwardOption(group, "b", 0, value));
    } else if (group.node === "c" && group.route === "a") {
      // 가운데(방)에 멈춘 말은 원래 길로 계속 가거나 도착점 쪽 지름길로 갈 수 있어요.
      options.push(makeForwardOption(group, "a", group.index, value));
      options.push(makeForwardOption(group, "b", ROUTES.b.indexOf("c"), value));
    } else {
      options.push(makeForwardOption(group, group.route, group.index, value));
    }
  }
  return options.filter(Boolean);
}

function makeForwardOption(group, route, index, steps) {
  const routeNodes = ROUTES[route];
  const destinationIndex = index + steps;
  const finishIndex = routeNodes.length - 1;
  if (destinationIndex >= finishIndex) {
    return {
      sourceId: group.id,
      sourceNode: group.node,
      route,
      index: finishIndex,
      node: "home",
      finish: true,
    };
  }
  return {
    sourceId: group.id,
    sourceNode: group.node,
    route,
    index: destinationIndex,
    node: routeNodes[destinationIndex],
    finish: false,
  };
}

const HOME_INDEX = ROUTES.outer.length - 1;

function isWaitingAtHome(group) {
  return group.status === "board" && group.node === "home";
}

function makeBackwardOption(group) {
  // 출발점(도착점)에 서 있는 말은 빽도로 더 물러날 수 없어요.
  if (isWaitingAtHome(group)) return null;
  const destinationIndex = group.index - 1;
  if (destinationIndex < 0) {
    // 첫 칸에서 빽도: 출발점에 머물다가 도 이상이 나오면 도착해요.
    return {
      sourceId: group.id,
      sourceNode: group.node,
      route: "outer",
      index: HOME_INDEX,
      node: "home",
      finish: false,
      toHome: true,
    };
  }
  return {
    sourceId: group.id,
    sourceNode: group.node,
    route: group.route,
    index: destinationIndex,
    node: ROUTES[group.route][destinationIndex],
    finish: false,
  };
}

function groupOptionsByDestination(options) {
  const targetMap = new Map();
  for (const option of options) {
    const key = option.finish ? "finish" : option.node;
    if (!targetMap.has(key)) {
      targetMap.set(key, {
        node: option.node,
        finish: option.finish,
        options: [],
      });
    }
    targetMap.get(key).options.push(option);
  }
  return [...targetMap.values()];
}

function chooseTarget(index) {
  const target = game.targets[index];
  if (!target) return;
  const options = target.options;

  if (options.length === 1) {
    executeMove(options[0]);
    return;
  }

  const activeTeam = game.teams[game.turnIndex];
  const sourceGroups = options.map((option) => activeTeam.groups.find((group) => group.id === option.sourceId));
  if (sourceGroups.every((group) => group?.status === "start")) {
    executeMove(options[0]);
    return;
  }

  game.modal = { type: "choose-piece", options };
  renderGame();
}

function describeSource(option) {
  if (!option.sourceNode) return "출발 전 말";
  if (option.sourceNode === "home") return "출발점에 있는 말";
  if (option.sourceNode === "c") return "가운데에 있는 말";
  if (option.route === "a" || option.route === "b") return "지름길에 있는 말";
  return "바깥길에 있는 말";
}

function executeMove(option) {
  const movingTeam = game.teams[game.turnIndex];
  const movingGroup = movingTeam.groups.find((group) => group.id === option.sourceId);
  if (!movingGroup || !game.pendingResult) return;

  history.push(structuredClone(game));
  if (history.length > 30) history.shift();

  const result = game.pendingResult;
  let capturedCount = 0;
  let stackedCount = 0;
  let effectType = null;
  let effectNode = option.node;

  if (option.finish) {
    movingTeam.finished += movingGroup.count;
    movingTeam.groups = movingTeam.groups.filter((group) => group.id !== movingGroup.id);
    effectType = "finish";
    effectNode = "home";
    game.arrivedGroupId = null;
  } else {
    movingGroup.status = "board";
    movingGroup.route = option.route;
    movingGroup.index = option.index;
    movingGroup.node = option.node;

    capturedCount = captureOpponents(movingTeam.id, option.node);
    stackedCount = stackFriendlyGroups(movingTeam, movingGroup);
    game.arrivedGroupId = movingGroup.id;

    if (capturedCount > 0) effectType = "capture";
    else if (stackedCount > 0) effectType = "stack";
    else effectType = "move";
  }

  if (effectType) {
    game.effect = { type: effectType, node: effectNode, count: capturedCount || stackedCount || movingGroup.count };
  }

  game.pendingResult = null;
  game.resultFlash = null;
  game.targets = [];
  game.noMove = false;
  game.modal = null;

  if (movingTeam.finished >= settings.pieceCount && !game.rankings.includes(movingTeam.id)) {
    game.rankings.push(movingTeam.id);
    const rank = game.rankings.length;
    game.bonusQueue = 0;
    game.hintsRevealed = settings.showMoveHints;
    const remaining = game.teams.filter((team) => !game.rankings.includes(team.id));

    if (remaining.length <= 1) {
      remaining.forEach((team) => game.rankings.push(team.id));
      game.over = true;
      game.message = `${movingTeam.name} ${rank}위! 모든 순위가 정해졌어요.`;
      playSound("win");
      renderGame();
      return;
    }

    game.turnIndex = nextTurnIndex();
    game.modal = { type: "rank", teamId: movingTeam.id, rank };
    game.message = `${movingTeam.name} ${rank}위 확정! 남은 ${remaining.length}팀이 계속 경기해요.`;
    playSound(rank === 1 ? "win" : "finish");
    renderGame();
    scheduleEffectClear();
    return;
  }

  const earned = (result.value === 4 || result.value === 5 ? 1 : 0) + (capturedCount > 0 ? 1 : 0);
  game.bonusQueue += earned;

  const eventParts = [];
  if (option.finish) eventParts.push(`${movingGroup.count}개의 말이 도착했어요!`);
  else if (option.toHome) eventParts.push("말이 출발점으로 돌아왔어요. 도 이상이 나오면 바로 도착해요.");
  else eventParts.push(`${result.label}만큼 이동했어요.`);
  if (stackedCount > 0) eventParts.push(`같은 팀 말 ${stackedCount}개를 업었어요!`);
  if (capturedCount > 0) eventParts.push(`상대 말 ${capturedCount}개를 잡았어요!`);

  if (game.bonusQueue > 0) {
    game.bonusQueue -= 1;
    eventParts.push("한 번 더 던집니다.");
  } else {
    game.turnIndex = nextTurnIndex();
  }

  game.message = eventParts.join(" ");
  playSound(capturedCount > 0 ? "capture" : stackedCount > 0 ? "stack" : option.finish ? "finish" : "move");
  renderGame();
  scheduleEffectClear();
}

function scheduleEffectClear() {
  if (!game.effect) return;
  window.setTimeout(() => {
    if (!game) return;
    game.effect = null;
    game.arrivedGroupId = null;
    renderGame();
  }, game.effect.type === "capture" ? 1720 : 1050);
}

function nextTurnIndex(from = game.turnIndex) {
  const total = game.teams.length;
  for (let step = 1; step <= total; step += 1) {
    const index = (from + step) % total;
    if (!game.rankings.includes(game.teams[index].id)) return index;
  }
  return from;
}

function captureOpponents(movingTeamId, node) {
  let captured = 0;
  for (const team of game.teams) {
    if (team.id === movingTeamId) continue;
    const capturedGroups = team.groups.filter((group) => group.status === "board" && group.node === node);
    for (const group of capturedGroups) {
      captured += group.count;
      team.groups = team.groups.filter((item) => item.id !== group.id);
      for (let i = 0; i < group.count; i += 1) {
        team.groups.push(createGroup(team.id));
      }
    }
  }
  return captured;
}

function stackFriendlyGroups(team, movingGroup) {
  const friendly = team.groups.filter(
    (group) => group.id !== movingGroup.id && group.status === "board" && group.node === movingGroup.node,
  );
  const count = friendly.reduce((sum, group) => sum + group.count, 0);
  if (count > 0) {
    movingGroup.count += count;
    const mergedIds = new Set(friendly.map((group) => group.id));
    team.groups = team.groups.filter((group) => !mergedIds.has(group.id));
  }
  return count;
}

function advanceTurnWithoutMove() {
  game.pendingResult = null;
  game.resultFlash = null;
  game.targets = [];
  game.noMove = false;
  game.hintsRevealed = settings.showMoveHints;
  if (game.bonusQueue > 0) {
    game.bonusQueue -= 1;
  } else {
    game.turnIndex = nextTurnIndex();
  }
  renderGame();
}

function snapshotForUndo() {
  const snapshot = structuredClone(game);
  snapshot.modal = null;
  if (snapshot.pieceEdit) snapshot.pieceEdit = { selected: null };
  snapshot.effect = null;
  snapshot.resultFlash = null;
  history.push(snapshot);
  if (history.length > 30) history.shift();
}

function clearPendingSelection() {
  window.clearTimeout(resultFlashTimer);
  resultFlashTimer = null;
  game.pendingResult = null;
  game.resultFlash = null;
  game.targets = [];
  game.noMove = false;
  game.hintsRevealed = settings.showMoveHints;
}

function syncRankings() {
  const isDone = (team) => team.finished >= settings.pieceCount;
  game.rankings = game.rankings.filter((teamId) => isDone(game.teams.find((team) => team.id === teamId)));
  game.teams.forEach((team) => {
    if (isDone(team) && !game.rankings.includes(team.id)) game.rankings.push(team.id);
  });
  const remaining = game.teams.filter((team) => !game.rankings.includes(team.id));
  if (game.rankings.length > 0 && remaining.length <= 1) {
    remaining.forEach((team) => game.rankings.push(team.id));
    game.over = true;
  } else {
    game.over = false;
  }
  if (!game.over && game.rankings.includes(game.teams[game.turnIndex].id)) {
    game.turnIndex = nextTurnIndex();
    game.bonusQueue = 0;
  }
}

function startPieceEdit() {
  clearPendingSelection();
  game.modal = null;
  game.effect = null;
  game.arrivedGroupId = null;
  game.pieceEdit = { selected: null };
  game.message = "말 옮기기 모드예요. 옮길 말을 고른 뒤 윷판의 칸을 누르세요.";
  renderGame();
}

function discardFinishedSelection() {
  const selection = game.pieceEdit?.selected;
  if (!selection?.fromFinished) return;
  const found = findGroup(selection.groupId);
  if (found) found.team.groups = found.team.groups.filter((item) => item !== found.group);
}

function selectEditPiece(groupId) {
  if (!game.pieceEdit) return;
  const found = findGroup(groupId);
  if (!found) return;
  discardFinishedSelection();
  game.pieceEdit.selected = { groupId, teamId: found.team.id, single: false };
  renderGame();
}

function selectWaitingPiece(teamId) {
  if (!game.pieceEdit) return;
  const team = game.teams.find((item) => item.id === teamId);
  const group = team?.groups.find((item) => item.status === "start");
  if (!group) return;
  discardFinishedSelection();
  game.pieceEdit.selected = { groupId: group.id, teamId, single: true };
  renderGame();
}

function selectFinishedPiece(teamId) {
  if (!game.pieceEdit) return;
  const team = game.teams.find((item) => item.id === teamId);
  if (!team || team.finished <= 0) return;
  discardFinishedSelection();
  // 도착한 말 1개를 임시 그룹으로 꺼내 선택해요. 놓기 전까지는 도착 수가 그대로예요.
  const group = createGroup(team.id);
  group.status = "finished";
  game.pieceEdit.selected = { groupId: group.id, teamId, single: true, fromFinished: true };
  team.groups.push(group);
  renderGame();
}

function boardPositionFor(nodeId) {
  if (nodeId === "home") return { route: "outer", index: HOME_INDEX };
  if (nodeId === "c" || nodeId.startsWith("a")) return { route: "a", index: ROUTES.a.indexOf(nodeId) };
  if (nodeId.startsWith("b")) return { route: "b", index: ROUTES.b.indexOf(nodeId) };
  return { route: "outer", index: ROUTES.outer.indexOf(nodeId) };
}

function placeSelectedPiece(destination) {
  const selection = game.pieceEdit?.selected;
  if (!selection) return;
  const found = findGroup(selection.groupId);
  if (!found) return;
  const { team, group } = found;

  // 도착 말을 꺼낸 임시 그룹은 스냅샷 전에 정리해 되돌리기 상태를 깨끗하게 유지해요.
  if (selection.fromFinished) team.groups = team.groups.filter((item) => item !== group);
  game.pieceEdit.selected = null;
  snapshotForUndo();

  let moving = group;
  if (selection.fromFinished) {
    team.finished -= 1;
    moving = createGroup(team.id);
    team.groups.push(moving);
  } else if (selection.single && group.count > 1) {
    group.count -= 1;
    moving = createGroup(team.id);
    team.groups.push(moving);
  }

  let placedText = "";
  if (destination === "waiting") {
    const extra = moving.count - 1;
    moving.count = 1;
    moving.status = "start";
    moving.route = "outer";
    moving.index = -1;
    moving.node = null;
    for (let i = 0; i < extra; i += 1) team.groups.push(createGroup(team.id));
    placedText = "대기로 보냈어요";
  } else if (destination === "finish") {
    team.finished += moving.count;
    team.groups = team.groups.filter((item) => item !== moving);
    placedText = "도착 처리했어요";
  } else {
    const position = boardPositionFor(destination);
    if (position.index < 0) return;
    moving.status = "board";
    moving.route = position.route;
    moving.index = position.index;
    moving.node = destination;
    const stacked = stackFriendlyGroups(team, moving);
    placedText = destination === "home" ? "출발점에 놓았어요" : stacked > 0 ? `옮겨서 같은 팀 말 ${stacked}개를 업었어요` : "옮겼어요";
  }

  syncRankings();
  game.message = `${team.name} 말 ${moving.count || 1}개를 ${placedText}.`;
  playSound("select");
  renderGame();
}

function handleAdjust(kind, teamId, delta) {
  if (!game) return;
  const team = game.teams.find((item) => item.id === teamId);
  const teamIndex = game.teams.indexOf(team);
  discardFinishedSelection();
  if (game.pieceEdit) game.pieceEdit.selected = null;
  snapshotForUndo();
  clearPendingSelection();

  if (kind === "turn") {
    if (!team || game.rankings.includes(team.id)) return;
    game.turnIndex = teamIndex;
    game.bonusQueue = 0;
    game.message = `${team.name} 차례로 바꿨어요.`;
  } else if (kind === "bonus") {
    game.bonusQueue = Math.max(0, game.bonusQueue + delta);
    const current = game.teams[game.turnIndex];
    game.message = game.bonusQueue > 0
      ? `${current.name}에게 추가 던지기 ${game.bonusQueue}회를 줬어요.`
      : `${current.name}의 추가 던지기를 없앴어요.`;
  } else if (kind === "order") {
    const target = teamIndex + delta;
    if (!team || target < 0 || target >= game.teams.length) return;
    const currentTeamId = game.teams[game.turnIndex].id;
    [game.teams[teamIndex], game.teams[target]] = [game.teams[target], game.teams[teamIndex]];
    game.turnIndex = game.teams.findIndex((item) => item.id === currentTeamId);
    game.message = `${team.name}의 순서를 ${delta < 0 ? "앞" : "뒤"}로 옮겼어요.`;
  } else if (kind === "finished") {
    if (!team) return;
    if (delta > 0) {
      if (team.finished >= settings.pieceCount) return;
      const waiting = team.groups.find((group) => group.status === "start");
      const board = team.groups.find((group) => group.status === "board");
      if (waiting) {
        team.groups = team.groups.filter((group) => group !== waiting);
      } else if (board && board.count > 1) {
        board.count -= 1;
      } else if (board) {
        team.groups = team.groups.filter((group) => group !== board);
      } else {
        return;
      }
      team.finished += 1;
    } else {
      if (team.finished <= 0) return;
      team.finished -= 1;
      team.groups.push(createGroup(team.id));
    }
    game.message = `${team.name}의 도착한 말을 ${team.finished}개로 고쳤어요.`;
    syncRankings();
    if (game.over) {
      game.modal = null;
      game.message = "모든 순위가 정해졌어요.";
    }
  }

  playSound("select");
  renderGame();
}

function handleAction(action) {
  if (!game) return;
  if (action === "cancel-result") {
    game.pendingResult = null;
    game.targets = [];
    game.noMove = false;
    game.hintsRevealed = settings.showMoveHints;
    game.message = "결과를 다시 선택해 주세요.";
    renderGame();
  } else if (action === "show-hints") {
    game.hintsRevealed = true;
    game.message = `힌트를 켰어요. 반짝이는 ${game.targets.length}곳 중 갈 곳을 골라 주세요.`;
    playSound("select");
    renderGame();
  } else if (action === "pass-turn") {
    advanceTurnWithoutMove();
  } else if (action === "undo") {
    const previous = history.pop();
    if (previous) {
      game = previous;
      game.effect = null;
      game.arrivedGroupId = null;
      showToast("직전 이동을 되돌렸어요.");
      renderGame();
    }
  } else if (action === "sound") {
    game.sound = !game.sound;
    showToast(game.sound ? "소리를 켰어요." : "소리를 껐어요.");
    renderGame();
  } else if (action === "fullscreen") {
    toggleFullscreen();
  } else if (action === "help") {
    game.modal = "help";
    renderGame();
  } else if (action === "adjust") {
    game.modal = "adjust";
    renderGame();
  } else if (action === "finish-piece-edit") {
    discardFinishedSelection();
    game.pieceEdit = null;
    game.message = "말 옮기기를 끝냈어요. 경기를 이어서 진행해요.";
    renderGame();
  } else if (action === "new") {
    game.modal = "new";
    renderGame();
  }
}

function handleModalAction(action) {
  if (action === "close") {
    game.modal = null;
    renderGame();
  } else if (action === "adjust") {
    game.modal = "adjust";
    renderGame();
  } else if (action === "piece-edit") {
    startPieceEdit();
  } else if (action === "setup") {
    renderSetup();
  } else if (action === "replay") {
    startGame();
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => showToast("전체 화면을 열 수 없어요."));
  } else {
    document.exitFullscreen?.();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function playSound(type) {
  if (!game?.sound) return;
  try {
    audioContext ||= new AudioContext();
    const now = audioContext.currentTime;
    const patterns = {
      select: [440],
      back: [250, 190],
      move: [420, 520],
      bonus: [520, 690, 840],
      yut: [392, 523, 659, 880],
      mo: [330, 495, 660, 825, 990],
      stack: [440, 560, 660],
      capture: [620, 330, 740],
      finish: [520, 660, 790],
      win: [392, 523, 659, 784],
    };
    (patterns[type] || patterns.select).forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type === "capture" ? "square" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now + index * 0.09);
      oscillator.stop(now + index * 0.09 + 0.18);
    });
  } catch {
    // Sound is an enhancement; gameplay continues if audio is blocked.
  }
}

window.yutGameApi = {
  start: () => startGame(),
  moveTeam: (from, to) => moveTeamOrder(Number(from), Number(to)),
  setResult: (value) => chooseResult(Number(value)),
  chooseDestination: (index) => chooseTarget(Number(index)),
  getState: () => structuredClone({ settings, game }),
};

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const register = (tool) => {
    try {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
    } catch {
      // WebMCP is optional and must not interrupt classroom play.
    }
  };

  register({
    name: "read_yut_game_state",
    title: "윷놀이 경기 상태 확인",
    description: "현재 설정, 차례, 선택된 윷 결과와 이동 가능한 목적지 수를 확인합니다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      return {
        screen: game ? "game" : "setup",
        theme: settings.theme,
        teamCount: settings.teamCount,
        pieceCount: settings.pieceCount,
        showMoveHints: settings.showMoveHints,
        currentTeam: game ? game.teams[game.turnIndex].name : null,
        pendingResult: game?.pendingResult?.label ?? null,
        destinationCount: game?.targets?.length ?? 0,
        winner: game?.rankings?.[0] ? game.teams.find((team) => team.id === game.rankings[0]).name : null,
        rankings: game ? game.rankings.map((teamId) => game.teams.find((team) => team.id === teamId).name) : [],
        gameOver: game?.over ?? false,
      };
    },
  });

  register({
    name: "configure_and_start_yut_game",
    title: "윷놀이 설정 후 시작",
    description: "배경, 팀 수, 팀별 말 수를 적용하고 새 교실 윷놀이 경기를 시작합니다.",
    inputSchema: {
      type: "object",
      properties: {
        theme: { type: "string", enum: ["village", "space"] },
        teamCount: { type: "integer", minimum: 2, maximum: 8 },
        pieceCount: { type: "integer", minimum: 1, maximum: 6 },
        showMoveHints: { type: "boolean" },
      },
      required: ["theme", "teamCount", "pieceCount"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || !["village", "space"].includes(input.theme)) throw new Error("올바른 배경을 선택하세요.");
      if (!Number.isInteger(input.teamCount) || input.teamCount < 2 || input.teamCount > 8) throw new Error("팀 수는 2~8이어야 합니다.");
      if (!Number.isInteger(input.pieceCount) || input.pieceCount < 1 || input.pieceCount > 6) throw new Error("말 수는 1~6이어야 합니다.");
      settings.theme = input.theme;
      settings.teamCount = input.teamCount;
      settings.pieceCount = input.pieceCount;
      if (typeof input.showMoveHints === "boolean") settings.showMoveHints = input.showMoveHints;
      startGame();
      return {
        started: true,
        theme: settings.theme,
        teamCount: settings.teamCount,
        pieceCount: settings.pieceCount,
        showMoveHints: settings.showMoveHints,
      };
    },
  });

  register({
    name: "record_yut_result",
    title: "윷 결과 기록",
    description: "실제로 던진 윷의 결과를 기록하고 윷판에 이동 가능한 칸을 표시합니다.",
    inputSchema: {
      type: "object",
      properties: { value: { type: "integer", enum: [-1, 1, 2, 3, 4, 5] } },
      required: ["value"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!game) throw new Error("경기를 먼저 시작하세요.");
      if (![-1, 1, 2, 3, 4, 5].includes(input?.value)) throw new Error("올바른 윷 결과가 아닙니다.");
      chooseResult(input.value);
      return { recorded: true, currentTeam: game.teams[game.turnIndex].name, destinationCount: game.targets.length };
    },
  });

  register({
    name: "choose_yut_destination",
    title: "이동할 칸 선택",
    description: "현재 표시된 이동 가능 칸 중 하나를 선택해 말을 움직입니다. 목적지 번호는 0부터 시작합니다.",
    inputSchema: {
      type: "object",
      properties: { destinationIndex: { type: "integer", minimum: 0 } },
      required: ["destinationIndex"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!game?.pendingResult) throw new Error("먼저 윷 결과를 기록하세요.");
      if (!Number.isInteger(input?.destinationIndex) || !game.targets[input.destinationIndex]) throw new Error("선택할 수 없는 목적지입니다.");
      chooseTarget(input.destinationIndex);
      return { selected: true, currentTeam: game.teams[game.turnIndex].name };
    },
  });
}

registerWebMcpTools();

renderSetup();
