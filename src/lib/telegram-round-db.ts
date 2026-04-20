import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type WinnerInsert = {
  roundId: string;
  code: string;
  wallet: string;
  authType: "farcaster" | "minipay" | "web";
  participantId: string;
  fid: number | null;
  maxWinners: number;
};

export type RoundWinner = {
  roundId: string;
  code: string;
  wallet: string;
  participantId: string;
  authType: "farcaster" | "minipay" | "web";
  fid: number | null;
  submittedAtMs: number;
  winnerRank: number;
  prizeSent: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __telegramRoundDb: Database.Database | undefined;
}

function getDb() {
  if (globalThis.__telegramRoundDb) {
    return globalThis.__telegramRoundDb;
  }

  const dataDir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "telegram-rounds.sqlite");
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS round_winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id TEXT NOT NULL,
      code TEXT NOT NULL,
      wallet TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      auth_type TEXT NOT NULL,
      fid INTEGER,
      submitted_at_ms INTEGER NOT NULL,
      winner_rank INTEGER NOT NULL,
      prize_sent INTEGER NOT NULL DEFAULT 0,
      UNIQUE(round_id, wallet),
      UNIQUE(round_id, winner_rank)
    );
  `);

  const tableInfo = db
    .prepare("PRAGMA table_info(round_winners)")
    .all() as Array<{ name: string }>;
  const cols = new Set(tableInfo.map((c) => c.name));
  if (!cols.has("wallet")) db.exec("ALTER TABLE round_winners ADD COLUMN wallet TEXT");
  if (!cols.has("winner_rank"))
    db.exec("ALTER TABLE round_winners ADD COLUMN winner_rank INTEGER DEFAULT 0");
  if (!cols.has("prize_sent"))
    db.exec("ALTER TABLE round_winners ADD COLUMN prize_sent INTEGER NOT NULL DEFAULT 0");

  globalThis.__telegramRoundDb = db;
  return db;
}

export function insertUniqueWinner(input: WinnerInsert):
  | { status: "INSERTED"; winner: RoundWinner }
  | { status: "DUPLICATE_WALLET"; winner: RoundWinner }
  | { status: "ROUND_FULL"; winner: null } {
  const db = getDb();
  const now = Date.now();
  const wallet = input.wallet.toLowerCase();

  const existing = db
    .prepare(
      `
      SELECT round_id, code, wallet, participant_id, auth_type, fid, submitted_at_ms, winner_rank, prize_sent
      FROM round_winners
      WHERE round_id = ? AND wallet = ?
    `
    )
    .get(input.roundId, wallet) as
    | {
        round_id: string;
        code: string;
        wallet: string;
        participant_id: string;
        auth_type: "farcaster" | "minipay" | "web";
        fid: number | null;
        submitted_at_ms: number;
        winner_rank: number;
        prize_sent: number;
      }
    | undefined;

  if (existing) {
    return {
      status: "DUPLICATE_WALLET",
      winner: {
        roundId: existing.round_id,
        code: existing.code,
        wallet: existing.wallet,
        participantId: existing.participant_id,
        authType: existing.auth_type,
        fid: existing.fid,
        submittedAtMs: existing.submitted_at_ms,
        winnerRank: existing.winner_rank,
        prizeSent: Boolean(existing.prize_sent),
      },
    };
  }

  const countRow = db
    .prepare("SELECT COUNT(1) as c FROM round_winners WHERE round_id = ?")
    .get(input.roundId) as { c: number };

  if (countRow.c >= input.maxWinners) {
    return { status: "ROUND_FULL", winner: null };
  }

  const winnerRank = countRow.c + 1;
  db.prepare(
    `
      INSERT INTO round_winners
      (round_id, code, wallet, participant_id, auth_type, fid, submitted_at_ms, winner_rank, prize_sent)
      VALUES (@roundId, @code, @wallet, @participantId, @authType, @fid, @submittedAtMs, @winnerRank, 0)
    `
  ).run({
    roundId: input.roundId,
    code: input.code,
    wallet,
    participantId: input.participantId,
    authType: input.authType,
    fid: input.fid,
    submittedAtMs: now,
    winnerRank,
  });

  return {
    status: "INSERTED",
    winner: {
      roundId: input.roundId,
      code: input.code,
      wallet,
      participantId: input.participantId,
      authType: input.authType,
      fid: input.fid,
      submittedAtMs: now,
      winnerRank,
      prizeSent: false,
    },
  };
}
