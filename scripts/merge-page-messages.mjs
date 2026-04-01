/**
 * One-off merge: adds page i18n namespaces to all src/messages/*.json from en template.
 * Run: node scripts/merge-page-messages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "../src/messages");

const extraEn = {
  common: {
    back: "Back",
    legalFullEnglish: "Full legal text is provided in English below.",
  },
  leaderboard: {
    fetchError: "Failed to load leaderboard",
    title: "Leaderboard",
    titleDaily: "Daily Leaderboard",
    titleWeekly: "Weekly Leaderboard",
    titleMonthly: "Monthly Leaderboard",
    tabDaily: "Daily",
    tabWeekly: "Weekly",
    tabOverall: "Overall",
    tabMonthly: "🏆 Monthly",
    dailyProfit: "Daily Profit",
    weeklyProfit: "Weekly Profit",
    monthlyProfit: "Monthly Profit",
    totalProfit: "Total Profit",
    monthlyTournament: "Monthly Tournament",
    monthlyTournamentDesc:
      "The monthly tournament starts on April 1st and runs until May 1st",
    monthlyTournamentSub: "Top players earn real cash rewards every month",
    rankPlace1: "1st Place",
    rankPlace2: "2nd Place",
    rankPlace3: "3rd Place",
    top100Extra: "🎁 Top 100 players share additional prize pool rewards",
    colRank: "Rank",
    colUsername: "Username",
    colUser: "User",
    colProfit: "Profit",
    colStatus: "Status",
    you: "YOU",
    pool: "🎁 Pool",
    noData: "No leaderboard data available yet",
    yourRank: "Your Rank",
    rankSuffix: "Rank",
  },
  profile: {
    loading: "Loading Profile...",
    walletConnected: "Wallet Connected",
    totalGames: "Total Games",
    streakDays: "Streak Days",
    totalProfit: "Total Profit",
    totalPnL: "Total PnL",
    invitationKeyLabel: "Your Invitation Key",
    copyKeyTitle: "Copy invitation key",
    supportTitle: "Support & Tickets",
    supportSubtitle: "Report issues or get help via Telegram",
    latestTrades: "Latest Trades",
    profit: "Profit",
    pnl: "PnL",
    noTrades: "No trades yet",
    noTradesHint: "Start playing to build your history!",
  },
  airdrop: {
    title: "Rewards",
    tabHold: "Hold TPOINTs",
    tabAirdrop: "Airdrop",
    holdTitle: "Hold TPOINTs for Payout",
    comingSoon: "COMING SOON",
    holdIntro:
      "Hold your TPOINTs to unlock payouts and reach exclusive services!",
    periodicalPrizes: "Periodical Prizes",
    periodicalPrizesDesc:
      "Stay in the top players on the Leaderboard and receive prizes directly into your MiniPay wallet periodically.",
    maximizeScore: "Maximize Your Score",
    maximizeScoreDesc:
      "Make score as much as possible for each game. Challenge yourself and push your limits every round!",
    leaveProfit: "Leave with Profit",
    leaveProfitDesc:
      "You can leave with profit — even more than 🪙10,000+. The sky is the limit for skilled traders.",
    leaderboardBanner:
      "🏆 Top Leaderboard players receive periodical prizes sent directly to their MiniPay wallets. Keep playing and keep earning!",
    airdropHeading: "Airdrop",
    airdropBlurb:
      "Stay tuned for exciting rewards! Our airdrop program will reward loyal Tradcast players with exclusive tokens.",
  },
  tradearea: {
    authFailedTitle: "Authentication Failed",
    gameBusyTitle: "Game is Too Busy",
    gameBusyDesc:
      "The game server is experiencing high traffic. Please try again later.",
    fundsReturned: "💰 Your funds and transaction fee will be returned.",
    tryAgain: "Try Again",
    activePositionTitle: "⚠️ Active Position!",
    activePositionDesc: "You must close your position before exiting the game.",
    liquidatedTitle: "Liquidated!",
    liquidatedDesc: "Your balance reached 🪙0. Better luck next time!",
    gameOverTitle: "Game Over",
    gameOverDesc: "Your game session has ended.",
    finalBalance: "Final Balance:",
    claimExit: "Claim & Exit",
    exit: "Exit",
    exiting: "Exiting...",
    claiming: "Claiming...",
    brand: "Tradcast",
    leverage: "Leverage",
    totalPnL: "Total P&L",
    balance: "Balance",
    freeBalance: "Free Balance",
    min100: "Min 🪙100",
    inPosition: "In Position",
    long: "Long",
    short: "Short",
    close: "Close",
    chartLoading: "Loading chart...",
    authenticatingChart: "Authenticating...",
    statusInitializing: "Initializing...",
    statusAuthenticating: "Authenticating...",
    statusAuthFailed: "Authentication Failed",
    statusConnected: "Connected",
    statusConnectionError: "Connection Error",
    statusDisconnected: "Disconnected",
    statusConnectionFailed: "Connection Failed",
    statusGameEnded: "Game ended! Redirecting...",
    statusWaitingMint: "Waiting for TPOINT mint...",
    statusTxRejected: "Transaction rejected - you can still exit",
    statusInsufficientGas: "Insufficient CELO for gas fees",
    statusEnding: "Ending game session...",
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: February 2026",
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "Last updated: February 2026",
  },
  about: {
    titlePrefix: "What is",
    titleSuffix: "?",
    mainP1:
      "Tradcast is a real-life volatile trading simulation game. All price data is 100% real market data aggregated across multiple tokens and timeframes.",
    mainP2:
      "Practice your trading skills with real volatility, zero financial risk. Master the art of reading charts, timing entries, and managing positions.",
    howToPlay: "How to Play",
    tradingButtons: "Trading Buttons",
    btnLong: "LONG",
    btnShort: "SHORT",
    btnClose: "CLOSE",
    longExpl:
      "LONG: Opens a long position or adds 🪙100 to an existing long position. Profit when price goes UP.",
    shortExpl:
      "SHORT: Opens a short position or adds 🪙100 to an existing short position. Profit when price goes DOWN.",
    closeExpl:
      "CLOSE: Closes your current position and realizes your profit or loss.",
    importantRules: "Important Rules",
    rule1: "You cannot open LONG and SHORT positions at the same time",
    rule2: "There is no hedge in this game",
    rule3: "To switch direction, close your position first",
    rule4: "Each position uses 20× leverage",
    gameFlow: "Game Flow",
    flow1: "Start the game and watch the real-time chart",
    flow2: "Open positions using LONG or SHORT buttons",
    flow3: "Close your position when ready to take profit or cut loss",
    flow4: 'Click "Claim & Exit" to claim your TPOINT tokens',
    flow5: "Return to home page with your earned rewards!",
    feat1Title: "Real Market Data",
    feat1Desc:
      "Trade with authentic price movements from real crypto markets.",
    feat2Title: "20× Leverage",
    feat2Desc:
      "All positions use 20× leverage for amplified gains (and losses!).",
    feat3Title: "Earn TPOINT Tokens",
    feat3Desc: "Profit from your trades and earn TPOINT tokens as rewards.",
    feat4Title: "Compete & Rank",
    feat4Desc: "Climb the leaderboard and prove your trading skills.",
    celoNotice: "You need 0.01$ to play this game",
    footerNote:
      "Start practicing now and build your trading skills for when it matters most!",
    supportBtn: "Support & Tickets",
    supportHint: "Having issues? Send us a ticket via Telegram",
    emailBtn: "Email Support",
    linkTerms: "Terms of Service",
    linkPrivacy: "Privacy Policy",
  },
};

const extraSw = {
  common: {
    back: "Rudi",
    legalFullEnglish: "Maandishi kamili ya kisheria yamo kwa Kiingereza hapa chini.",
  },
  leaderboard: {
    fetchError: "Imeshindwa kupakia washindi",
    title: "Washindi",
    titleDaily: "Washindi wa Kila Siku",
    titleWeekly: "Washindi wa Kila Wiki",
    titleMonthly: "Washindi wa Kila Mwezi",
    tabDaily: "Kila siku",
    tabWeekly: "Kila wiki",
    tabOverall: "Jumla",
    tabMonthly: "🏆 Kila mwezi",
    dailyProfit: "Faida ya siku",
    weeklyProfit: "Faida ya wiki",
    monthlyProfit: "Faida ya mwezi",
    totalProfit: "Jumla ya faida",
    monthlyTournament: "Mashindano ya Kila Mwezi",
    monthlyTournamentDesc:
      "Mashindano ya kila mwezi yanaanza Aprili 1 na yanaisha Mei 1",
    monthlyTournamentSub:
      "Wachezaji bora hupata tuzo halisi za pesa kila mwezi",
    rankPlace1: "Nafasi ya 1",
    rankPlace2: "Nafasi ya 2",
    rankPlace3: "Nafasi ya 3",
    top100Extra:
      "🎁 Washiriki 100 bora wanashiriki tuzo za ziada za prize pool",
    colRank: "Nafasi",
    colUsername: "Jina",
    colUser: "Mtumiaji",
    colProfit: "Faida",
    colStatus: "Hali",
    you: "WEWE",
    pool: "🎁 Pooli",
    noData: "Hakuna data ya washindi bado",
    yourRank: "Nafasi yako",
    rankSuffix: "Nafasi",
  },
  profile: {
    loading: "Inapakia wasifu...",
    walletConnected: "Pochi imeunganishwa",
    totalGames: "Michezo jumla",
    streakDays: "Siku za mfululizo",
    totalProfit: "Jumla ya faida",
    totalPnL: "Jumla ya PnL",
    invitationKeyLabel: "Ufunguo wako wa mwaliko",
    copyKeyTitle: "Nakili ufunguo wa mwaliko",
    supportTitle: "Msaada na tiketi",
    supportSubtitle: "Ripoti matatizo au pata msaada kupitia Telegram",
    latestTrades: "Biashara za hivi karibuni",
    profit: "Faida",
    pnl: "PnL",
    noTrades: "Hakuna biashara bado",
    noTradesHint: "Anza kucheza kuunda historia yako!",
  },
  airdrop: {
    title: "Tuzo",
    tabHold: "Shikilia TPOINT",
    tabAirdrop: "Airdrop",
    holdTitle: "Shikilia TPOINT kwa malipo",
    comingSoon: "INAKUJA HIVI KARIBUNI",
    holdIntro:
      "Shikilia TPOINT zako kufungua malipo na kufikia huduma maalum!",
    periodicalPrizes: "Tuzo za kila kipindi",
    periodicalPrizesDesc:
      "Endelea kuwa miongoni mwa wachezaji bora kwenye Leaderboard na upokee tuzo moja kwa moja kwenye pochi yako ya MiniPay.",
    maximizeScore: "Ongeza alama zako",
    maximizeScoreDesc:
      "Pata alama nyingi iwezekanavyo kwa kila mchezo. Jaribu mipaka yako kila raundi!",
    leaveProfit: "Toka na faida",
    leaveProfitDesc:
      "Unaweza kutoka na faida — hata zaidi ya 🪙10,000+. Huna kikomo ukiwa mzoefu.",
    leaderboardBanner:
      "🏆 Wachezaji bora wa Leaderboard hupokea tuzo za kila kipindi moja kwa moja kwenye pochi zao za MiniPay. Endelea kucheza!",
    airdropHeading: "Airdrop",
    airdropBlurb:
      "Subiri tuzo zisizo na mfano! Programu yetu ya airdrop itawatuzawadia wachezaji wa Tradcast kwa tokeni maalum.",
  },
  tradearea: {
    authFailedTitle: "Uthibitishaji Umefeli",
    gameBusyTitle: "Mchezo Una Msongamano",
    gameBusyDesc:
      "Seva ya mchezo ina watumiaji wengi. Jaribu tena baadaye.",
    fundsReturned: "💰 Pesa zako na ada ya muamala zitarudishwa.",
    tryAgain: "Jaribu tena",
    activePositionTitle: "⚠️ Nafasi hai!",
    activePositionDesc: "Lazima ufunge nafasi kabla ya kutoka kwenye mchezo.",
    liquidatedTitle: "Umefutwa!",
    liquidatedDesc: "Salio lako lilifika 🪙0. Bahati nzuri wakati mwingine!",
    gameOverTitle: "Mchezo umeisha",
    gameOverDesc: "Kipindi chako cha mchezo kimeisha.",
    finalBalance: "Salio la mwisho:",
    claimExit: "Dai na toka",
    exit: "Toka",
    exiting: "Inatoka...",
    claiming: "Inadai...",
    brand: "Tradcast",
    leverage: "Leverage",
    totalPnL: "Jumla P&L",
    balance: "Salio",
    freeBalance: "Salio la bure",
    min100: "Chini 🪙100",
    inPosition: "Ndani ya nafasi",
    long: "Long",
    short: "Short",
    close: "Funga",
    chartLoading: "Inapakia chati...",
    authenticatingChart: "Inathibitisha...",
    statusInitializing: "Inaanza...",
    statusAuthenticating: "Inathibitisha...",
    statusAuthFailed: "Uthibitishaji umeshindwa",
    statusConnected: "Imeunganishwa",
    statusConnectionError: "Hitilafu ya muunganisho",
    statusDisconnected: "Imetenganishwa",
    statusConnectionFailed: "Muunganisho umeshindwa",
    statusGameEnded: "Mchezo umeisha! Inaelekeza...",
    statusWaitingMint: "Inasubiri mint ya TPOINT...",
    statusTxRejected: "Muamala uliidhinishwa - bado unaweza kutoka",
    statusInsufficientGas: "CELO haitoshi kwa ada ya gas",
    statusEnding: "Inamaliza kipindi cha mchezo...",
  },
  privacy: {
    title: "Sera ya Faragha",
    lastUpdated: "Ilisasishwa: Februari 2026",
  },
  terms: {
    title: "Masharti ya Huduma",
    lastUpdated: "Ilisasishwa: Februari 2026",
  },
  about: {
    titlePrefix: "Tradcast ni nini",
    titleSuffix: "?",
    mainP1:
      "Tradcast ni mchezo wa mfano wa biashara yenye utulivu wa bei halisi. Data zote za bei ni data halisi 100% kutoka masoko ya crypto na muda mbalimbali.",
    mainP2:
      "Jifunze uzoefu wa biashara kwa hatari ya bei halisi, bila hatari ya fedha. Jifunze kusoma chati, muda wa kuingia, na kusimamia nafasi.",
    howToPlay: "Jinsi ya kucheza",
    tradingButtons: "Vitufe vya biashara",
    btnLong: "LONG",
    btnShort: "SHORT",
    btnClose: "FUNGA",
    longExpl:
      "LONG: Hufungua nafasi ya long au kuongeza 🪙100 kwenye nafasi ya long. Faida bei inapopanda.",
    shortExpl:
      "SHORT: Hufungua nafasi ya short au kuongeza 🪙100 kwenye nafasi ya short. Faida bei inaposhuka.",
    closeExpl:
      "FUNGA: Hufunga nafasi yako sasa na kufanya faida au hasara iwe halisi.",
    importantRules: "Sheria muhimu",
    rule1: "Huwezi kufungua LONG na SHORT kwa pamoja",
    rule2: "Hakuna hedge katika mchezo huu",
    rule3: "Kubadili mwelekeo, funga nafasi kwanza",
    rule4: "Kila nafasi inatumia leverage ya 20×",
    gameFlow: "Mtiririko wa mchezo",
    flow1: "Anza mchezo na uangalie chati ya muda halisi",
    flow2: "Fungua nafasi kwa vitufe LONG au SHORT",
    flow3: "Funga nafasi unapopenda kuchukua faida au kupunguza hasara",
    flow4: 'Bonyeza "Dai na toka" kudai tokeni zako za TPOINT',
    flow5: "Rudi nyumbani na tuzo ulizopata!",
    feat1Title: "Data halisi ya soko",
    feat1Desc: "Biashara kwa mienendo halisi ya bei kutoka masoko ya crypto.",
    feat2Title: "Leverage 20×",
    feat2Desc: "Nafasi zote hutumia leverage 20× kwa faida (na hasara) kubwa.",
    feat3Title: "Pata tokeni za TPOINT",
    feat3Desc: "Faida kutoka biashara yako na upate tokeni za TPOINT kama tuzo.",
    feat4Title: "Shindana na nafasi",
    feat4Desc: "Panda leaderboard na uonyeshe ujuzi wako wa biashara.",
    celoNotice: "Unahitaji $0.01 kucheza mchezo huu",
    footerNote:
      "Anza kufanya mazoezi sasa ujenge ujuzi wako wa biashara!",
    supportBtn: "Msaada na tiketi",
    supportHint: "Matatizo? Tutumie tiketi kupitia Telegram",
    emailBtn: "Msaada kwa barua pepe",
    linkTerms: "Masharti ya Huduma",
    linkPrivacy: "Sera ya Faragha",
  },
};

function deepMerge(base, extra) {
  const out = { ...base };
  for (const k of Object.keys(extra)) {
    if (
      extra[k] &&
      typeof extra[k] === "object" &&
      !Array.isArray(extra[k]) &&
      typeof base[k] === "object" &&
      base[k] &&
      !Array.isArray(base[k])
    ) {
      out[k] = deepMerge(base[k], extra[k]);
    } else {
      out[k] = extra[k];
    }
  }
  return out;
}

const localeFiles = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"));

for (const file of localeFiles) {
  const p = path.join(messagesDir, file);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const isSw = file === "sw.json";
  const merged = deepMerge(raw, isSw ? extraSw : extraEn);
  fs.writeFileSync(p, JSON.stringify(merged, null, 2) + "\n");
}

console.log("Merged page messages into", localeFiles.length, "files.");
