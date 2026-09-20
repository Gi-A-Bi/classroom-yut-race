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
  teamNames: [...defaultNames],
  teamOrder: TOKEN_META.map((_, index) => index),
};

let game = null;
let history = [];
let groupSequence = 0;
let toastTimer = null;
let audioContext = null;

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
    arrivedGroupId: null,
    winner: null,
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
    <main class="screen game-screen theme-${settings.theme}" style="--active-team-color:${activeTeam.color}">
      <header class="game-topbar">
        <div class="game-title"><span class="material-symbols-rounded">toys_and_games</span> 교실 윷 레이스</div>
        <div class="team-score-strip" style="--team-count:${game.teams.length}">
          ${game.teams.map((team, index) => renderScoreCard(team, index)).join("")}
        </div>
      </header>

      <div class="game-layout">
        <section class="board-stage" aria-label="윷놀이판">
          <div class="board-shell">
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

function renderScoreCard(team, index) {
  const waiting = team.groups.filter((group) => group.status === "start").reduce((sum, group) => sum + group.count, 0);
  return `
    <div class="team-score ${index === game.turnIndex ? "active" : ""}" style="--team-color:${team.color}">
      <span class="mini-token" style="${tokenStyle(team.tokenIndex)}" aria-hidden="true"></span>
      <div class="score-copy">
        <strong>${escapeHtml(team.name)}</strong>
        <span>도착 ${team.finished}/${settings.pieceCount} · 대기 ${waiting}</span>
      </div>
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
      .map((group) => renderPiece(team, group, eligibleIds.has(group.id))),
  );
  const targets = game.targets.map((target, index) => renderDestination(target, index)).join("");
  const effect = game.effect ? renderEffect(game.effect) : "";
  return `${boardSvg()}${pieces.join("")}${targets}${effect}`;
}

function renderPiece(team, group, eligible) {
  const point = POS[group.node];
  const visibleLayers = Math.min(group.count, 3);
  const layers = Array.from({ length: visibleLayers }, (_, index) => {
    const offset = (visibleLayers - index - 1) * 7;
    return `<span class="token-layer" style="${tokenStyle(team.tokenIndex)} transform:translateY(${offset}px);z-index:${index + 1}"></span>`;
  }).join("");
  return `
    <div class="piece-wrapper ${eligible ? "eligible" : ""} ${game.arrivedGroupId === group.id ? "arrived" : ""}"
      style="left:${toPercent(point.x)};top:${toPercent(point.y)}" aria-label="${escapeHtml(team.name)} 말 ${group.count}개">
      ${layers}
      ${group.count > 1 ? `<span class="stack-badge">×${group.count}</span>` : ""}
    </div>
  `;
}

function renderDestination(target, index) {
  const point = POS[target.node];
  const label = target.finish ? "도착" : target.options.some((option) => option.route !== "outer") ? "지름길" : "이동";
  return `
    <button class="destination-button" type="button" data-target-index="${index}"
      style="left:${toPercent(point.x)};top:${toPercent(point.y)}" aria-label="${label} 칸으로 이동">
      ${target.finish ? "도착" : `<span>${label}</span><small>선택</small>`}
    </button>
  `;
}

function renderEffect(effect) {
  const point = POS[effect.node] || POS.home;
  return `<div class="effect-sprite ${effect.type}" style="left:${toPercent(point.x)};top:${toPercent(point.y)}" aria-hidden="true"></div>`;
}

function toPercent(value) {
  return `${(value / 760) * 100}%`;
}

function renderControlPanel(activeTeam) {
  const instruction = game.pendingResult
    ? "윷판에서 반짝이는 칸을 골라 눌러 주세요."
    : "실제 윷을 던진 뒤 나온 결과를 눌러 주세요.";
  return `
    <aside class="control-panel" aria-label="경기 조작">
      <div class="turn-card">
        <span class="token-portrait" style="${tokenStyle(activeTeam.tokenIndex)}" aria-hidden="true"></span>
        <div class="turn-copy">
          <span>지금은</span>
          <strong>${escapeHtml(activeTeam.name)} 차례</strong>
        </div>
      </div>

      <div class="instruction-box">${instruction}</div>

      <div class="result-grid" aria-label="윷 결과 선택">
        ${RESULT_META.map((result) => `
          <button class="result-button ${result.bonus ? "bonus" : ""} ${result.backdo ? "backdo" : ""}"
            type="button" data-result="${result.value}" ${game.pendingResult || game.winner ? "disabled" : ""}>
            ${result.label} <small>${result.hint}</small>
          </button>
        `).join("")}
      </div>

      ${game.pendingResult ? `
        <div class="selected-result">
          <strong>${game.pendingResult.label} · ${game.pendingResult.hint}</strong>
          <span>
            <button class="text-button" type="button" data-action="cancel-result">다시 선택</button>
            ${game.noMove ? `<button class="pass-button" type="button" data-action="pass-turn">차례 넘기기</button>` : ""}
          </span>
        </div>
      ` : ""}

      <div class="turn-message">
        ${escapeHtml(game.message)}
        ${game.bonusQueue > 0 ? `<span class="extra-pill"><span class="material-symbols-rounded">replay</span> 남은 추가 던지기 ${game.bonusQueue}회</span>` : ""}
      </div>

      <div class="panel-actions">
        ${actionButton("undo", "undo", "되돌리기", history.length === 0)}
        ${actionButton("help", "help", "도움말")}
        ${actionButton("sound", game.sound ? "volume_up" : "volume_off", "소리")}
        ${actionButton("fullscreen", "fullscreen", "전체 화면")}
        ${actionButton("new", "home", "새 경기")}
      </div>
    </aside>
  `;
}

function actionButton(action, icon, label, disabled = false) {
  return `
    <button class="icon-button" type="button" data-action="${action}" aria-label="${label}" title="${label}" ${disabled ? "disabled" : ""}>
      <span class="material-symbols-rounded">${icon}</span>
    </button>
  `;
}

function renderModal() {
  if (!game) return "";
  if (game.winner) {
    const winner = game.teams.find((team) => team.id === game.winner);
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="victory-title">
        <div class="modal victory-modal">
          <div class="victory-trophy" aria-hidden="true"></div>
          <h2 id="victory-title">${escapeHtml(winner.name)} 우승!</h2>
          <p>모든 말이 먼저 도착했어요. 멋진 경기였어요!</p>
          <div class="modal-actions" style="justify-content:center">
            <button class="modal-button secondary" type="button" data-modal-action="setup">설정으로</button>
            <button class="modal-button" type="button" data-modal-action="replay">같은 설정으로 다시</button>
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
            <li>같은 팀 말을 만나면 업고, 다른 팀 말을 만나면 잡아요.</li>
            <li>윷·모 또는 잡기에 성공하면 한 번 더 던져요.</li>
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

  app.querySelectorAll("[data-option-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = game.modal.options[Number(button.dataset.optionIndex)];
      game.modal = null;
      executeMove(option);
    });
  });
}

function chooseResult(value) {
  if (!game || game.pendingResult || game.winner) return;
  const result = RESULT_META.find((item) => item.value === value);
  if (!result) return;
  const activeTeam = game.teams[game.turnIndex];
  const options = getMoveOptions(activeTeam, value);

  playSound(value < 0 ? "back" : value >= 4 ? "bonus" : "select");

  if (options.length === 0) {
    game.pendingResult = result;
    game.targets = [];
    game.noMove = true;
    game.message = `${result.label}: 움직일 수 있는 말이 없어요. 결과를 고치거나 차례를 넘겨 주세요.`;
    renderGame();
    return;
  }

  game.pendingResult = result;
  game.noMove = false;
  game.targets = groupOptionsByDestination(options);
  game.message = `${result.label}이 나왔어요. 반짝이는 ${game.targets.length}곳 중 갈 곳을 골라 주세요.`;
  renderGame();
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

function makeBackwardOption(group) {
  const destinationIndex = group.index - 1;
  if (destinationIndex < 0) {
    return {
      sourceId: group.id,
      sourceNode: group.node,
      route: "outer",
      index: -1,
      node: "start",
      finish: false,
      returnToStart: true,
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
    const key = option.returnToStart ? "start" : option.finish ? "finish" : option.node;
    if (!targetMap.has(key)) {
      targetMap.set(key, {
        node: option.returnToStart ? "start" : option.node,
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

  if (option.returnToStart) {
    movingGroup.status = "start";
    movingGroup.route = "outer";
    movingGroup.index = -1;
    movingGroup.node = null;
    game.arrivedGroupId = null;
  } else if (option.finish) {
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
  }

  if (effectType) {
    game.effect = { type: effectType, node: effectNode };
  }

  game.pendingResult = null;
  game.targets = [];
  game.noMove = false;
  game.modal = null;

  if (movingTeam.finished >= settings.pieceCount) {
    game.winner = movingTeam.id;
    game.message = `${movingTeam.name}의 모든 말이 도착했어요!`;
    playSound("win");
    renderGame();
    return;
  }

  const earned = (result.value === 4 || result.value === 5 ? 1 : 0) + (capturedCount > 0 ? 1 : 0);
  game.bonusQueue += earned;

  const eventParts = [];
  if (option.finish) eventParts.push(`${movingGroup.count}개의 말이 도착했어요!`);
  else if (option.returnToStart) eventParts.push("말이 출발점으로 한 칸 돌아갔어요.");
  else eventParts.push(`${result.label}만큼 이동했어요.`);
  if (stackedCount > 0) eventParts.push(`같은 팀 말 ${stackedCount}개를 업었어요!`);
  if (capturedCount > 0) eventParts.push(`상대 말 ${capturedCount}개를 잡았어요!`);

  if (game.bonusQueue > 0) {
    game.bonusQueue -= 1;
    eventParts.push("한 번 더 던집니다.");
  } else {
    game.turnIndex = (game.turnIndex + 1) % game.teams.length;
  }

  game.message = eventParts.join(" ");
  playSound(capturedCount > 0 ? "capture" : stackedCount > 0 ? "stack" : option.finish ? "finish" : "move");
  renderGame();

  if (game.effect) {
    window.setTimeout(() => {
      if (!game) return;
      game.effect = null;
      game.arrivedGroupId = null;
      renderGame();
    }, 820);
  }
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
  game.targets = [];
  game.noMove = false;
  if (game.bonusQueue > 0) {
    game.bonusQueue -= 1;
  } else {
    game.turnIndex = (game.turnIndex + 1) % game.teams.length;
  }
  renderGame();
}

function handleAction(action) {
  if (!game) return;
  if (action === "cancel-result") {
    game.pendingResult = null;
    game.targets = [];
    game.noMove = false;
    game.message = "결과를 다시 선택해 주세요.";
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
  } else if (action === "new") {
    game.modal = "new";
    renderGame();
  }
}

function handleModalAction(action) {
  if (action === "close") {
    game.modal = null;
    renderGame();
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
        currentTeam: game ? game.teams[game.turnIndex].name : null,
        pendingResult: game?.pendingResult?.label ?? null,
        destinationCount: game?.targets?.length ?? 0,
        winner: game?.winner ?? null,
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
      startGame();
      return { started: true, theme: settings.theme, teamCount: settings.teamCount, pieceCount: settings.pieceCount };
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
