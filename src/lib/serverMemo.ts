// @/src/lib/serverMemo.ts
// サーバー内の「作り置き」キャッシュ（DBの読み込み結果を少しの間メモリに置いておく）。
//
// 【目的】広告LPは表示のたびに DB（Supabase）へ何回も問い合わせていて、ページを返すまでに約1秒かかっていた。
//   → 同じ内容は一定時間メモリから返し、DBへの往復をなくす。
//
// 【仕組み】
//  - 取得から FRESH_MS（60秒）以内 … そのまま返す
//  - それを過ぎて STALE_MS（10分）以内 … 手元の内容をすぐ返しつつ、裏で最新を取り直す（お客さんを待たせない）
//  - それ以上古い／無い … その場でDBから取得
//  - admin で LP・予約マスター・ショートコード・サイト設定を保存したら bustServerMemo() で全部捨てる（すぐ反映）
//  - プレビュー表示（?preview=true）は常に最新をDBから読む（fresh: true）
//  - 返す値は毎回コピー（structuredClone）するので、描画側で書き換えても他のお客さんに影響しない
// ※ サーバーは1台（Docker 1コンテナ）なので、メモリのキャッシュで整合が取れる。

const FRESH_MS = 60 * 1000;
const STALE_MS = 10 * 60 * 1000;

type Entry = { at: number; value?: unknown; has: boolean; pending?: Promise<unknown> };

const g = globalThis as unknown as { __bhServerMemo?: Map<string, Entry>; __bhServerMemoGen?: number };
const store: Map<string, Entry> = g.__bhServerMemo ?? (g.__bhServerMemo = new Map());
if (g.__bhServerMemoGen === undefined) g.__bhServerMemoGen = 0;

function clone<T>(v: T): T {
  if (v === null || v === undefined || typeof v !== "object") return v;
  try {
    return structuredClone(v);
  } catch {
    return v;
  }
}

function load<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const gen = g.__bhServerMemoGen;
  const p = fn().then(
    (value) => {
      // 取得中に bust された場合は、古い世代の結果を保存しない
      if (gen === g.__bhServerMemoGen) store.set(key, { at: Date.now(), value, has: true });
      return value;
    },
    (err) => {
      const e = store.get(key);
      if (e) e.pending = undefined;
      throw err;
    }
  );
  const e = store.get(key);
  if (e) e.pending = p;
  else store.set(key, { at: 0, has: false, pending: p });
  return p;
}

/**
 * opts.fresh   … 作り置きを使わず常にDBから（プレビュー用）
 * opts.persist … 時間で古くしない。admin で保存したとき（bustServerMemo）だけ入れ替える。
 *                予約マスターの価格（ショートコード用）のように「admin以外では変わらない」データ向け。
 */
export async function memo<T>(key: string, fn: () => Promise<T>, opts?: { fresh?: boolean; persist?: boolean }): Promise<T> {
  if (opts?.fresh) return fn();
  const e = store.get(key);
  const now = Date.now();
  if (e?.has && opts?.persist) return clone(e.value as T);
  if (e?.has) {
    const age = now - e.at;
    if (age < FRESH_MS) return clone(e.value as T);
    if (age < STALE_MS) {
      if (!e.pending) load(key, fn).catch(() => {}); // 裏で取り直し（失敗しても今の内容を返し続ける）
      return clone(e.value as T);
    }
  }
  if (e?.pending) return clone((await e.pending) as T);
  return clone(await load(key, fn));
}

/** 作り置きを全部捨てる（admin で保存した時に呼ぶ） */
export function bustServerMemo(): void {
  const clear = () => {
    g.__bhServerMemoGen = (g.__bhServerMemoGen ?? 0) + 1;
    store.clear();
  };
  clear();
  // 保存処理（DB書き込み）が終わる前に誰かが古い内容を作り置きし直す可能性があるので、少し後にもう一度捨てる
  setTimeout(clear, 3000);
  setTimeout(clear, 15000);
}
