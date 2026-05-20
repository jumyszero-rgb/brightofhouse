// @/src/app/admin/cta-blocks/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CtaBlock = {
  id?: string;
  name: string;
  bgType: string; bgColor1: string; bgColor2: string | null;
  borderColor: string; borderRadius: number; paddingY: number; paddingX: number;
  headingText: string | null; headingColor: string; headingSize: number; headingWeight: string;
  descText: string | null; descColor: string; descSize: number; descWeight: string;
  linkText: string | null; linkUrl: string | null; linkColor: string; linkSize: number; linkWeight: string;
  btnText: string | null; btnUrl: string | null; btnBgColor: string; btnTextColor: string;
  btnSize: number; btnWeight: string; btnRadius: number; btnPaddingY: number; btnPaddingX: number;
  btn2Text: string | null; btn2Url: string | null; btn2BgColor: string | null; btn2TextColor: string | null;
  btn2Size: number; btn2Weight: string;
};

const PRESETS: { label: string; value: Partial<CtaBlock> }[] = [
  { label: "ブルー定番", value: { bgType: "solid", bgColor1: "#eff6ff", borderColor: "#bfdbfe", headingColor: "#1e293b", descColor: "#475569", btnBgColor: "#2563eb", btnTextColor: "#ffffff", linkColor: "#2563eb" } },
  { label: "グリーン", value: { bgType: "solid", bgColor1: "#f0fdf4", borderColor: "#bbf7d0", headingColor: "#14532d", descColor: "#166534", btnBgColor: "#16a34a", btnTextColor: "#ffffff", linkColor: "#16a34a" } },
  { label: "オレンジ", value: { bgType: "solid", bgColor1: "#fff7ed", borderColor: "#fed7aa", headingColor: "#7c2d12", descColor: "#9a3412", btnBgColor: "#ea580c", btnTextColor: "#ffffff", linkColor: "#ea580c" } },
  { label: "ダーク", value: { bgType: "solid", bgColor1: "#1e293b", borderColor: "#334155", headingColor: "#f8fafc", descColor: "#cbd5e1", btnBgColor: "#f59e0b", btnTextColor: "#1e293b", linkColor: "#fbbf24" } },
  { label: "グラデーション（青紫）", value: { bgType: "gradient", bgColor1: "#3b82f6", bgColor2: "#8b5cf6", borderColor: "transparent", headingColor: "#ffffff", descColor: "#e0e7ff", btnBgColor: "#ffffff", btnTextColor: "#3b82f6", linkColor: "#fde68a" } },
  { label: "グラデーション（緑青）", value: { bgType: "gradient", bgColor1: "#059669", bgColor2: "#0891b2", borderColor: "transparent", headingColor: "#ffffff", descColor: "#d1fae5", btnBgColor: "#ffffff", btnTextColor: "#059669", linkColor: "#a7f3d0" } },
];

const empty = (): CtaBlock => ({
  name: "",
  bgType: "solid", bgColor1: "#eff6ff", bgColor2: null,
  borderColor: "#bfdbfe", borderRadius: 16, paddingY: 32, paddingX: 32,
  headingText: "お困りごとはプロにご相談ください", headingColor: "#1e293b", headingSize: 20, headingWeight: "700",
  descText: "お見積り無料で迅速に駆けつけます。\nお気軽にお問い合わせください。", descColor: "#475569", descSize: 14, descWeight: "400",
  linkText: null, linkUrl: null, linkColor: "#2563eb", linkSize: 14, linkWeight: "700",
  btnText: "無料相談・お問い合わせ", btnUrl: "/contact", btnBgColor: "#2563eb", btnTextColor: "#ffffff",
  btnSize: 16, btnWeight: "700", btnRadius: 9999, btnPaddingY: 14, btnPaddingX: 40,
  btn2Text: null, btn2Url: null, btn2BgColor: null, btn2TextColor: null, btn2Size: 14, btn2Weight: "700",
});

const weightLabel = (w: string) => {
  const m: Record<string, string> = { "400": "通常", "500": "やや太", "600": "太め", "700": "太字", "800": "極太", "900": "最太" };
  return m[w] || w;
};

const bgStyle = (b: CtaBlock) => {
  if (b.bgType === "gradient" && b.bgColor2) return { background: `linear-gradient(135deg, ${b.bgColor1}, ${b.bgColor2})` };
  return { backgroundColor: b.bgColor1 };
};

export default function CtaBlocksPage() {
  const [blocks, setBlocks] = useState<(CtaBlock & { id: string })[]>([]);
  const [editing, setEditing] = useState<CtaBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBlocks = async () => {
    const res = await fetch("/api/cta-blocks");
    if (res.ok) setBlocks(await res.json());
  };
  useEffect(() => { fetchBlocks(); }, []);

  const handleSave = async () => {
    if (!editing?.name) return alert("管理名は必須です");
    setLoading(true);
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch("/api/cta-blocks", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setMessage("保存しました");
      setEditing(null);
      await fetchBlocks();
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/cta-blocks?id=${id}`, { method: "DELETE" });
    await fetchBlocks();
  };

  const applyPreset = (preset: Partial<CtaBlock>) => {
    if (!editing) return;
    setEditing({ ...editing, ...preset });
  };

  const U = (key: keyof CtaBlock, val: any) => editing && setEditing({ ...editing, [key]: val });

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔥 CTA ブロック管理</h1>
          <div className="flex gap-3">
            <button onClick={() => setEditing(empty())} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700">＋ 新規作成</button>
            <Link href="/admin" className="text-blue-600 hover:underline self-center">← 管理画面</Link>
          </div>
        </div>

        {message && <div className="bg-green-100 text-green-800 p-3 rounded-xl text-center font-bold">{message}</div>}

        {/* 一覧＋プレビュー */}
        <div className="grid gap-6">
          {blocks.map(block => (
            <div key={block.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                <span className="font-bold">{block.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...block })} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold">編集</button>
                  <button onClick={() => handleDelete(block.id)} className="bg-red-500 text-white px-4 py-1.5 rounded text-xs font-bold">削除</button>
                </div>
              </div>
              <div style={{ ...bgStyle(block), border: `1px solid ${block.borderColor}`, borderRadius: `${block.borderRadius}px`, padding: `${block.paddingY}px ${block.paddingX}px`, textAlign: "center" as const, margin: "16px" }}>
                {block.headingText && <div style={{ color: block.headingColor, fontSize: `${block.headingSize}px`, fontWeight: block.headingWeight, marginBottom: "12px" }}>{block.headingText}</div>}
                {block.descText && <div style={{ color: block.descColor, fontSize: `${block.descSize}px`, fontWeight: block.descWeight, marginBottom: "16px", whiteSpace: "pre-line" as const, lineHeight: "1.8" }}>{block.descText}</div>}
                {block.linkText && <div style={{ marginBottom: "16px" }}><a href="#" style={{ color: block.linkColor, fontSize: `${block.linkSize}px`, fontWeight: block.linkWeight, textDecoration: "underline" }}>{block.linkText}</a></div>}
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" as const }}>
                  {block.btnText && <span style={{ background: block.btnBgColor, color: block.btnTextColor, fontSize: `${block.btnSize}px`, fontWeight: block.btnWeight, padding: `${block.btnPaddingY}px ${block.btnPaddingX}px`, borderRadius: `${block.btnRadius}px`, display: "inline-block" }}>{block.btnText}</span>}
                  {block.btn2Text && <span style={{ background: block.btn2BgColor || "#e2e8f0", color: block.btn2TextColor || "#334155", fontSize: `${block.btn2Size}px`, fontWeight: block.btn2Weight, padding: `${block.btnPaddingY}px ${block.btnPaddingX}px`, borderRadius: `${block.btnRadius}px`, display: "inline-block" }}>{block.btn2Text}</span>}
                </div>
              </div>
            </div>
          ))}
          {blocks.length === 0 && <p className="text-center text-slate-500 py-12">CTAブロックがまだありません</p>}
        </div>

        {/* 編集モーダル */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">{editing.id ? "CTA編集" : "CTA新規作成"}</h2>
                <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* プリセット */}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">プリセット</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p, i) => (
                      <button key={i} onClick={() => applyPreset(p.value)} className="px-3 py-1.5 text-xs font-bold rounded-full border hover:bg-slate-100">{p.label}</button>
                    ))}
                  </div>
                </div>

                {/* 管理名 */}
                <div>
                  <label className="text-xs font-bold text-slate-500">管理名</label>
                  <input value={editing.name} onChange={e => U("name", e.target.value)} className="w-full p-2 border rounded text-sm mt-1" placeholder="例：ブログ用CTA（青）" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 左：設定 */}
                  <div className="space-y-5">
                    {/* 背景 */}
                    <fieldset className="border rounded-lg p-4 space-y-3">
                      <legend className="text-xs font-bold text-slate-600 px-2">🎨 背景</legend>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-xs"><input type="radio" checked={editing.bgType === "solid"} onChange={() => U("bgType", "solid")} /> 単色</label>
                        <label className="flex items-center gap-1 text-xs"><input type="radio" checked={editing.bgType === "gradient"} onChange={() => U("bgType", "gradient")} /> グラデ</label>
                      </div>
                      <div className="flex gap-3 items-center">
                        <label className="text-xs text-slate-500">色1</label>
                        <input type="color" value={editing.bgColor1} onChange={e => U("bgColor1", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        {editing.bgType === "gradient" && <>
                          <label className="text-xs text-slate-500">色2</label>
                          <input type="color" value={editing.bgColor2 || "#8b5cf6"} onChange={e => U("bgColor2", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        </>}
                      </div>
                      <div className="flex gap-3 items-center">
                        <label className="text-xs text-slate-500">枠線色</label>
                        <input type="color" value={editing.borderColor} onChange={e => U("borderColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <label className="text-xs text-slate-500">角丸</label>
                        <input type="number" value={editing.borderRadius} onChange={e => U("borderRadius", +e.target.value)} className="w-16 p-1 border rounded text-xs" min={0} max={50} />
                      </div>
                    </fieldset>

                    {/* 見出し */}
                    <fieldset className="border rounded-lg p-4 space-y-3">
                      <legend className="text-xs font-bold text-slate-600 px-2">📝 見出しテキスト</legend>
                      <input value={editing.headingText || ""} onChange={e => U("headingText", e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="見出し" />
                      <div className="flex gap-3 items-center flex-wrap">
                        <input type="color" value={editing.headingColor} onChange={e => U("headingColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <select value={editing.headingSize} onChange={e => U("headingSize", +e.target.value)} className="p-1 border rounded text-xs">
                          {[14,16,18,20,24,28,32].map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.headingWeight} onChange={e => U("headingWeight", e.target.value)} className="p-1 border rounded text-xs">
                          {["400","500","600","700","800","900"].map(w => <option key={w} value={w}>{weightLabel(w)}</option>)}
                        </select>
                      </div>
                    </fieldset>

                    {/* 説明文 */}
                    <fieldset className="border rounded-lg p-4 space-y-3">
                      <legend className="text-xs font-bold text-slate-600 px-2">📄 説明文</legend>
                      <textarea value={editing.descText || ""} onChange={e => U("descText", e.target.value)} rows={3} className="w-full p-2 border rounded text-sm" placeholder="説明文（改行OK）" />
                      <div className="flex gap-3 items-center flex-wrap">
                        <input type="color" value={editing.descColor} onChange={e => U("descColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <select value={editing.descSize} onChange={e => U("descSize", +e.target.value)} className="p-1 border rounded text-xs">
                          {[12,13,14,15,16,18].map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.descWeight} onChange={e => U("descWeight", e.target.value)} className="p-1 border rounded text-xs">
                          {["400","500","600","700"].map(w => <option key={w} value={w}>{weightLabel(w)}</option>)}
                        </select>
                      </div>
                    </fieldset>

                    {/* リンク */}
                    <fieldset className="border rounded-lg p-4 space-y-3">
                      <legend className="text-xs font-bold text-slate-600 px-2">🔗 テキストリンク（任意）</legend>
                      <input value={editing.linkText || ""} onChange={e => U("linkText", e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="リンクテキスト（空欄で非表示）" />
                      <input value={editing.linkUrl || ""} onChange={e => U("linkUrl", e.target.value)} className="w-full p-2 border rounded text-sm font-mono" placeholder="/service" />
                      <div className="flex gap-3 items-center flex-wrap">
                        <input type="color" value={editing.linkColor} onChange={e => U("linkColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <select value={editing.linkSize} onChange={e => U("linkSize", +e.target.value)} className="p-1 border rounded text-xs">
                          {[12,13,14,15,16,18].map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.linkWeight} onChange={e => U("linkWeight", e.target.value)} className="p-1 border rounded text-xs">
                          {["400","500","600","700","800"].map(w => <option key={w} value={w}>{weightLabel(w)}</option>)}
                        </select>
                      </div>
                    </fieldset>

                    {/* ボタン1 */}
                    <fieldset className="border rounded-lg p-4 space-y-3">
                      <legend className="text-xs font-bold text-slate-600 px-2">🔘 ボタン1（メイン）</legend>
                      <input value={editing.btnText || ""} onChange={e => U("btnText", e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="ボタンテキスト" />
                      <input value={editing.btnUrl || ""} onChange={e => U("btnUrl", e.target.value)} className="w-full p-2 border rounded text-sm font-mono" placeholder="/contact" />
                      <div className="flex gap-3 items-center flex-wrap">
                        <label className="text-xs text-slate-500">背景</label>
                        <input type="color" value={editing.btnBgColor} onChange={e => U("btnBgColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <label className="text-xs text-slate-500">文字</label>
                        <input type="color" value={editing.btnTextColor} onChange={e => U("btnTextColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                      </div>
                      <div className="flex gap-3 items-center flex-wrap">
                        <select value={editing.btnSize} onChange={e => U("btnSize", +e.target.value)} className="p-1 border rounded text-xs">
                          {[13,14,15,16,18,20].map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.btnWeight} onChange={e => U("btnWeight", e.target.value)} className="p-1 border rounded text-xs">
                          {["400","500","600","700","800","900"].map(w => <option key={w} value={w}>{weightLabel(w)}</option>)}
                        </select>
                        <label className="text-xs text-slate-500">角丸</label>
                        <input type="number" value={editing.btnRadius} onChange={e => U("btnRadius", +e.target.value)} className="w-16 p-1 border rounded text-xs" min={0} max={9999} />
                      </div>
                    </fieldset>

                    {/* ボタン2 */}
                    <fieldset className="border rounded-lg p-4 space-y-3">
                      <legend className="text-xs font-bold text-slate-600 px-2">🔘 ボタン2（サブ・任意）</legend>
                      <input value={editing.btn2Text || ""} onChange={e => U("btn2Text", e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="空欄で非表示" />
                      <input value={editing.btn2Url || ""} onChange={e => U("btn2Url", e.target.value)} className="w-full p-2 border rounded text-sm font-mono" placeholder="/service" />
                      {editing.btn2Text && <div className="flex gap-3 items-center flex-wrap">
                        <label className="text-xs text-slate-500">背景</label>
                        <input type="color" value={editing.btn2BgColor || "#e2e8f0"} onChange={e => U("btn2BgColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <label className="text-xs text-slate-500">文字</label>
                        <input type="color" value={editing.btn2TextColor || "#334155"} onChange={e => U("btn2TextColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                        <select value={editing.btn2Size} onChange={e => U("btn2Size", +e.target.value)} className="p-1 border rounded text-xs">
                          {[13,14,15,16,18].map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.btn2Weight} onChange={e => U("btn2Weight", e.target.value)} className="p-1 border rounded text-xs">
                          {["400","500","600","700","800"].map(w => <option key={w} value={w}>{weightLabel(w)}</option>)}
                        </select>
                      </div>}
                    </fieldset>
                  </div>

                  {/* 右：リアルタイムプレビュー */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 block">プレビュー</label>
                    <div className="sticky top-4">
                      <div style={{
                        ...bgStyle(editing),
                        border: `1px solid ${editing.borderColor}`,
                        borderRadius: `${editing.borderRadius}px`,
                        padding: `${editing.paddingY}px ${editing.paddingX}px`,
                        textAlign: "center" as const,
                      }}>
                        {editing.headingText && (
                          <div style={{ color: editing.headingColor, fontSize: `${editing.headingSize}px`, fontWeight: editing.headingWeight, marginBottom: "12px" }}>
                            {editing.headingText}
                          </div>
                        )}
                        {editing.descText && (
                          <div style={{ color: editing.descColor, fontSize: `${editing.descSize}px`, fontWeight: editing.descWeight, marginBottom: "16px", whiteSpace: "pre-line" as const, lineHeight: "1.8" }}>
                            {editing.descText}
                          </div>
                        )}
                        {editing.linkText && (
                          <div style={{ marginBottom: "16px" }}>
                            <a href="#" onClick={e => e.preventDefault()} style={{ color: editing.linkColor, fontSize: `${editing.linkSize}px`, fontWeight: editing.linkWeight, textDecoration: "underline" }}>
                              {editing.linkText}
                            </a>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" as const }}>
                          {editing.btnText && (
                            <span style={{
                              background: editing.btnBgColor, color: editing.btnTextColor,
                              fontSize: `${editing.btnSize}px`, fontWeight: editing.btnWeight,
                              padding: `${editing.btnPaddingY}px ${editing.btnPaddingX}px`,
                              borderRadius: `${editing.btnRadius}px`, display: "inline-block",
                              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                            }}>
                              {editing.btnText}
                            </span>
                          )}
                          {editing.btn2Text && (
                            <span style={{
                              background: editing.btn2BgColor || "#e2e8f0", color: editing.btn2TextColor || "#334155",
                              fontSize: `${editing.btn2Size}px`, fontWeight: editing.btn2Weight,
                              padding: `${editing.btnPaddingY}px ${editing.btnPaddingX}px`,
                              borderRadius: `${editing.btnRadius}px`, display: "inline-block",
                            }}>
                              {editing.btn2Text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3">
                <button onClick={handleSave} disabled={loading} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-400">
                  {loading ? "保存中..." : "保存"}
                </button>
                <button onClick={() => setEditing(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300">
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
