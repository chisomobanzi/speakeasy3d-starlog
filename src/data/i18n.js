/**
 * Bilingual UI strings — English / 繁體中文
 * All player-facing text shown in both languages for LAB events.
 */

export const t = {
  // ─── Game title ───
  spellDuel: 'Spell Duel 咒語對決',
  joinBattle: 'Join the battle 加入戰鬥',

  // ─── Join screen ───
  sessionCode: 'Session Code 遊戲代碼',
  connect: 'Connect 連線',
  enterCode: 'Enter a 4-character code 請輸入4位代碼',
  reconnecting: 'Reconnecting... 重新連線中...',
  connectionFailed: 'Connection failed 連線失敗',
  cannotConnect: 'Cannot connect 無法連線',

  // ─── Profile screen ───
  whoAreYou: 'Who are you? 你是誰？',
  yourName: 'Your Name 你的名字',
  enterName: 'Enter name 輸入名字',
  imPracticing: "I'm Practicing 我在練習",
  joinGame: 'Join Game 加入遊戲',
  nameAndLang: 'Enter name & pick language 請輸入名字並選語言',

  // ─── Lobby ───
  ready: 'Ready! 準備好了！',
  waitingForGame: 'Waiting for game... 等待遊戲開始...',
  changeSession: 'Change session 更換遊戲',
  waitingForPlayers: 'Waiting for players... 等待玩家...',
  offline: 'offline 離線',

  // ─── Gameplay ───
  spellsCast: 'spells cast 施了咒',
  cast: 'CAST! 施咒！',
  skip: 'Skip 跳過 →',
  sayOrTap: 'Say the word — or tap to skip 說出來或點擊跳過',

  // ─── Round end ───
  victory: 'Victory! 勝利！',
  tie: 'Tie! 平手！',
  defeated: 'Defeated 落敗',
  complete: 'Complete 完成',
  waitingNextRound: 'Waiting for next round... 等待下一回合...',

  // ─── Bridge view ───
  scanToJoin: 'Scan to Join 掃碼加入',
  enginesOnline: 'Engines Online 引擎啟動',
  awaitingCrew: 'Awaiting Crew 等待船員',
  speakToPower: 'Speak to power the ship 說話來驅動飛船',

  // ─── Ship status ───
  vessel: 'Vessel 飛船',
  destination: 'Destination 目的地',
  joinCode: 'Join Code 加入代碼',
  crew: 'Crew 船員',
  localMicActive: 'Local mic active 本地麥克風',
  noSensor: 'No sensor 無感應器',
  sessionActive: 'Session active 遊戲進行中',

  // ─── Arena ───
  round: 'Round 回合',
  live: 'LIVE 即時',
  castWord: 'cast 施咒',
  castYourSpells: 'Cast your spells! 施展你的咒語！',

  // ─── Results ───
  wins: 'Wins! 勝出！',
  total: 'Total 總計',

  // ─── Teacher controls ───
  teacherControls: 'Teacher 教師控制台',
  bridge: 'Bridge 艦橋',
  starMap: 'Map 星圖',
  scene: 'Scene 場景',
  game: 'Game 遊戲',
  startRound: 'Start Round 開始回合',
  inProgress: 'in progress 進行中',
  lobby: 'Lobby 大廳',
  endGame: 'End Game 結束遊戲',
  endSession: 'End Session 結束',
  startSession: 'Start Session 開始',
  next: 'Next 下一步',
  boost: 'Boost 加速',
  unmute: 'Unmute 取消靜音',
  mute: 'Mute 靜音',
  fuel: 'Fuel 燃料',

  // ─── Teams ───
  redDragons: 'Red Dragons 紅龍隊',
  bluePhoenix: 'Blue Phoenix 藍鳳隊',
  vs: 'VS 對決',

  // ─── Countdown ───
  go: 'GO! 開始！',
};

/**
 * Helper: format "N player(s) connected" bilingually.
 */
export function playersConnected(n) {
  return `${n} player${n !== 1 ? 's' : ''} connected ${n}位玩家已連線`;
}

export function echosConnected(n) {
  return `${n} echo${n !== 1 ? 's' : ''} connected ${n}台已連線`;
}

export function nPlayers(n) {
  return `${n} players ${n}位玩家`;
}

export function roundN(n) {
  return `${t.round} ${n}`;
}

export function spellsAndPts(spells, pts) {
  return `${spells} spells 咒語 · ${pts} pts 分`;
}

export function ptsLabel(n) {
  return `${n} pts 分`;
}

export function fuelPct(n) {
  return `${t.fuel}: ${Math.round(n)}%`;
}
