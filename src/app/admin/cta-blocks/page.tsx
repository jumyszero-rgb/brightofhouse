// @/src/app/admin/cta-blocks/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CtaBlock = {
  id?: string; name: string;
  bgType: string; bgColor1: string; bgColor2: string | null;
  borderColor: string; borderRadius: number; paddingY: number; paddingX: number;
  headingText: string | null; headingColor: string; headingSize: number; headingWeight: string;
  desc1Text: string | null; desc1Color: string; desc1Size: number; desc1Weight: string;
  linkText: string | null; linkUrl: string | null; linkColor: string; linkSize: number; linkWeight: string;
  desc2Text: string | null; desc2Color: string; desc2Size: number; desc2Weight: string;
  btn1Text: string | null; btn1Url: string | null; btn1BgColor: string; btn1TextColor: string;
  btn1Size: number; btn1Weight: string; btn1Radius: number; btn1PaddingY: number; btn1PaddingX: number;
  desc3Text: string | null; desc3Color: string; desc3Size: number; desc3Weight: string;
  btn2Text: string | null; btn2Url: string | null; btn2BgColor: string; btn2TextColor: string;
  btn2Size: number; btn2Weight: string;
  desc4Text: string | null; desc4Color: string; desc4Size: number; desc4Weight: string;
  telText: string | null; telNumber: string | null; telColor: string; telSize: number; telWeight: string;
};

const SIZES = [12,13,14,15,16,18,20,24,28,32,36];
const WEIGHTS: { v: string; l: string }[] = [
  { v: "400", l: "通常" }, { v: "500", l: "やや太" }, { v: "600", l: "太め" },
  { v: "700", l: "太字" }, { v: "800", l: "極太" }, { v: "900", l: "最太" },
];

const PRESETS: { label: string; value: Partial<CtaBlock> }[] = [
  { label: "ブルー定番", value: { bgType: "solid", bgColor1: "#eff6ff", borderColor: "#bfdbfe", headingColor: "#1e293b", desc1Color: "#475569", btn1BgColor: "#2563eb", btn1TextColor: "#ffffff", linkColor: "#2563eb", telColor: "#2563eb" } },
  { label: "グリーン", value: { bgType: "solid", bgColor1: "#f0fdf4", borderColor: "#bbf7d0", headingColor: "#14532d", desc1Color: "#166534", btn1BgColor: "#16a34a", btn1TextColor: "#ffffff", linkColor: "#16a34a", telColor: "#16a34a" } },
  { label: "オレンジ", value: { bgType: "solid", bgColor1: "#fff7ed", borderColor: "#fed7aa", headingColor: "#7c2d12", desc1Color: "#9a3412", btn1BgColor: "#ea580c", btn1TextColor: "#ffffff", linkColor: "#ea580c", telColor: "#ea580c" } },
  { label: "ダーク", value: { bgType: "solid", bgColor1: "#1e293b", borderColor: "#334155", headingColor: "#f8fafc", desc1Color: "#cbd5e1", btn1BgColor: "#f59e0b", btn1TextColor: "#1e293b", linkColor: "#fbbf24", telColor: "#fbbf24" } },
  { label: "グラデ（青紫）", value: { bgType: "gradient", bgColor1: "#3b82f6", bgColor2: "#8b5cf6", borderColor: "transparent", headingColor: "#ffffff", desc1Color: "#e0e7ff", btn1BgColor: "#ffffff", btn1TextColor: "#3b82f6", linkColor: "#fde68a", telColor: "#ffffff" } },
  { label: "グラデ（緑青）", value: { bgType: "gradient", bgColor1: "#059669", bgColor2: "#0891b2", borderColor: "transparent", headingColor: "#ffffff", desc1Color: "#d1fae5", btn1BgColor: "#ffffff", btn1TextColor: "#059669", linkColor: "#a7f3d0", telColor: "#ffffff" } },
];

const empty = (): CtaBlock => ({
  name: "",
  bgType: "solid", bgColor1: "#eff6ff", bgColor2: null,
  borderColor: "#bfdbfe", borderRadius: 16, paddingY: 32, paddingX: 32,
  headingText: "お困りごとはプロにご相談ください", headingColor: "#1e293b", headingSize: 20, headingWeight: "700",
  desc1Text: "お見積り無料で迅速に駆けつけます。", desc1Color: "#475569", desc1Size: 14, desc1Weight: "400",
  linkText: null, linkUrl: null, linkColor: "#2563eb", linkSize: 14, linkWeight: "700",
  desc2Text: null, desc2Color: "#475569", desc2Size: 14, desc2Weight: "400",
  btn1Text: "無料相談・お問い合わせ", btn1Url: "/contact", btn1BgColor: "#2563eb", btn1TextColor: "#ffffff",
  btn1Size: 16, btn1Weight: "700", btn1Radius: 9999, btn1PaddingY: 14, btn1PaddingX: 40,
  desc3Text: null, desc3Color: "#475569", desc3Size: 14, desc3Weight: "400",
  btn2Text: null, btn2Url: null, btn2BgColor: "#e2e8f0", btn2TextColor: "#334155", btn2Size: 14, btn2Weight: "700",
  desc4Text: null, desc4Color: "#475569", desc4Size: 14, desc4Weight: "400",
  telText: null, telNumber: null, telColor: "#2563eb", telSize: 20, telWeight: "700",
});

const bgStyle = (b: CtaBlock): React.CSSProperties => {
  if (b.bgType === "gradient" && b.bgColor2) return { background: `linear-gradient(135deg, ${b.bgColor1}, ${b.bgColor2})` };
  return { backgroundColor: b.bgColor1 };
};

function StyleRow({ label, text, setText, color, setColor, size, setSize, weight, setWeight, rows }: {
  label: string; text: string; setText: (v: string) => void;
  color: string; setColor: (v: string) => void;
  size: number; setSize: (v: number) => void;
  weight: string; setWeight: (v: string) => void;
  rows?: number;
}) {
  return (
    <fieldset className="border rounded-lg p-3 space-y-2">
      <legend className="text-xs font-bold text-slate-600 px-2">{label}</legend>
      {rows && rows > 1 ? (
        <textarea value={text} onChange={e => setText(e.target.value)} rows={rows} className="w-full p-2 border rounded text-sm" placeholder={`${label}（空欄で非表示）`} />
      ) : (
        <input value={text} onChange={e => setText(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder={`${label}（空欄で非表示）`} />
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
        <select value={size} onChange={e => setSize(+e.target.value)} className="p-1 border rounded text-xs">
          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        <select value={weight} onChange={e => setWeight(e.target.value)} className="p-1 border rounded text-xs">
          {WEIGHTS.map(w => <option key={w.v} value={w.v}>{w.l}</option>)}
        </select>
      </div>
    </fieldset>
  );
}

function BtnRow({ label, text, setText, url, setUrl, bgColor, setBgColor, textColor, setTextColor, size, setSize, weight, setWeight }: {
  label: string; text: string; setText: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  bgColor: string; setBgColor: (v: string) => void;
  textColor: string; setTextColor: (v: string) => void;
  size: number; setSize: (v: number) => void;
  weight: string; setWeight: (v: string) => void;
}) {
  return (
    <fieldset className="border rounded-lg p-3 space-y-2">
      <legend className="text-xs font-bold text-slate-600 px-2">{label}</legend>
      <input value={text} onChange={e => setText(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="ボタンテキスト（空欄で非表示）" />
      <input value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border rounded text-sm font-mono" placeholder="リンク先URL" />
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-[10px] text-slate-500">背景</label>
        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
        <label className="text-[10px] text-slate-500">文字</label>
        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
        <select value={size} onChange={e => setSize(+e.target.value)} className="p-1 border rounded text-xs">
          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        <select value={weight} onChange={e => setWeight(e.target.value)} className="p-1 border rounded text-xs">
          {WEIGHTS.map(w => <option key={w.v} value={w.v}>{w.l}</option>)}
        </select>
      </div>
    </fieldset>
  );
}

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

  const U = (key: keyof CtaBlock, val: any) => editing && setEditing({ ...editing, [key]: val });

  const renderPreview = (b: CtaBlock) => (
    <div style={{
      ...bgStyle(b),
      border: `1px solid ${b.borderColor}`,
      borderRadius: `${b.borderRadius}px`,
      padding: `${b.paddingY}px ${b.paddingX}px`,
      textAlign: "center" as const,
    }}>
      {b.headingText && <div style={{ color: b.headingColor, fontSize: `${b.headingSize}px`, fontWeight: b.headingWeight, marginBottom: "12px" }}>{b.headingText}</div>}
      {b.desc1Text && <div style={{ color: b.desc1Color, fontSize: `${b.desc1Size}px`, fontWeight: b.desc1Weight, marginBottom: "12px", whiteSpace: "pre-line" as const, lineHeight: "1.8" }}>{b.desc1Text}</div>}
      {b.linkText && <div style={{ marginBottom: "12px" }}><a href="#" onClick={e => e.preventDefault()} style={{ color: b.linkColor, fontSize: `${b.linkSize}px`, fontWeight: b.linkWeight, textDecoration: "underline" }}>{b.linkText}</a></div>}
      {b.desc2Text && <div style={{ color: b.desc2Color, fontSize: `${b.desc2Size}px`, fontWeight: b.desc2Weight, marginBottom: "12px", whiteSpace: "pre-line" as const, lineHeight: "1.8" }}>{b.desc2Text}</div>}
      {b.btn1Text && <div style={{ marginBottom: "12px" }}><span style={{ background: b.btn1BgColor, color: b.btn1TextColor, fontSize: `${b.btn1Size}px`, fontWeight: b.btn1Weight, padding: `${b.btn1PaddingY}px ${b.btn1PaddingX}px`, borderRadius: `${b.btn1Radius}px`, display: "inline-block", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>{b.btn1Text}</span></div>}
      {b.desc3Text && <div style={{ color: b.desc3Color, fontSize: `${b.desc3Size}px`, fontWeight: b.desc3Weight, marginBottom: "12px", whiteSpace: "pre-line" as const, lineHeight: "1.8" }}>{b.desc3Text}</div>}
      {b.btn2Text && <div style={{ marginBottom: "12px" }}><span style={{ background: b.btn2BgColor, color: b.btn2TextColor, fontSize: `${b.btn2Size}px`, fontWeight: b.btn2Weight, padding: `${b.btn1PaddingY}px ${b.btn1PaddingX}px`, borderRadius: `${b.btn1Radius}px`, display: "inline-block" }}>{b.btn2Text}</span></div>}
      {b.desc4Text && <div style={{ color: b.desc4Color, fontSize: `${b.desc4Size}px`, fontWeight: b.desc4Weight, marginBottom: "12px", whiteSpace: "pre-line" as const, lineHeight: "1.8" }}>{b.desc4Text}</div>}
      {b.telText && b.telNumber && <div><a href={`tel:${b.telNumber}`} onClick={e => e.preventDefault()} style={{ color: b.telColor, fontSize: `${b.telSize}px`, fontWeight: b.telWeight, textDecoration: "none" }}>📞 {b.telText}</a></div>}
    </div>
  );

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
              <div className="p-4">{renderPreview(block)}</div>
            </div>
          ))}
          {blocks.length === 0 && <p className="text-center text-slate-500 py-12">CTAブロックがまだありません</p>}
        </div>

        {/* 編集モーダル */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8" onClick={e => e.stopPropagation()}>
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
                      <button key={i} onClick={() => editing && setEditing({ ...editing, ...p.value })} className="px-3 py-1.5 text-xs font-bold rounded-full border hover:bg-slate-100">{p.label}</button>
                    ))}
                  </div>
                </div>

                {/* 管理名 */}
                <div>
                  <label className="text-xs font-bold text-slate-500">管理名</label>
                  <input value={editing.name} onChange={e => U("name", e.target.value)} className="w-full p-2 border rounded text-sm mt-1" placeholder="例：ブログ用CTA（青）" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左：設定 */}
                  <div className="space-y-4">
                    {/* 背景 */}
                    <fieldset className="border rounded-lg p-3 space-y-2">
                      <legend className="text-xs font-bold text-slate-600 px-2">🎨 背景</legend>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-xs"><input type="radio" checked={editing.bgType === "solid"} onChange={() => U("bgType", "solid")} /> 単色</label>
                        <label className="flex items-center gap-1 text-xs"><input type="radio" checked={editing.bgType === "gradient"} onChange={() => U("bgType", "gradient")} /> グラデ</label>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <label className="text-[10px] text-slate-500">色1</label>
                        <input type="color" value={editing.bgColor1} onChange={e => U("bgColor1", e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
                        {editing.bgType === "gradient" && <>
                          <label className="text-[10px] text-slate-500">色2</label>
                          <input type="color" value={editing.bgColor2 || "#8b5cf6"} onChange={e => U("bgColor2", e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
                        </>}
                        <label className="text-[10px] text-slate-500">枠線</label>
                        <input type="color" value={editing.borderColor} onChange={e => U("borderColor", e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
                        <label className="text-[10px] text-slate-500">角丸</label>
                        <input type="number" value={editing.borderRadius} onChange={e => U("borderRadius", +e.target.value)} className="w-14 p-1 border rounded text-xs" min={0} max={50} />
                      </div>
                    </fieldset>

                    <StyleRow label="📝 タイトル" text={editing.headingText || ""} setText={v => U("headingText", v)} color={editing.headingColor} setColor={v => U("headingColor", v)} size={editing.headingSize} setSize={v => U("headingSize", v)} weight={editing.headingWeight} setWeight={v => U("headingWeight", v)} />

                    <StyleRow label="📄 説明文①" text={editing.desc1Text || ""} setText={v => U("desc1Text", v)} color={editing.desc1Color} setColor={v => U("desc1Color", v)} size={editing.desc1Size} setSize={v => U("desc1Size", v)} weight={editing.desc1Weight} setWeight={v => U("desc1Weight", v)} rows={3} />

                    <fieldset className="border rounded-lg p-3 space-y-2">
                      <legend className="text-xs font-bold text-slate-600 px-2">🔗 リンク文字</legend>
                      <input value={editing.linkText || ""} onChange={e => U("linkText", e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="リンクテキスト（空欄で非表示）" />
                      <input value={editing.linkUrl || ""} onChange={e => U("linkUrl", e.target.value)} className="w-full p-2 border rounded text-sm font-mono" placeholder="/service" />
                      <div className="flex gap-2 items-center flex-wrap">
                        <input type="color" value={editing.linkColor} onChange={e => U("linkColor", e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
                        <select value={editing.linkSize} onChange={e => U("linkSize", +e.target.value)} className="p-1 border rounded text-xs">
                          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.linkWeight} onChange={e => U("linkWeight", e.target.value)} className="p-1 border rounded text-xs">
                          {WEIGHTS.map(w => <option key={w.v} value={w.v}>{w.l}</option>)}
                        </select>
                      </div>
                    </fieldset>

                    <StyleRow label="📄 説明文②" text={editing.desc2Text || ""} setText={v => U("desc2Text", v)} color={editing.desc2Color} setColor={v => U("desc2Color", v)} size={editing.desc2Size} setSize={v => U("desc2Size", v)} weight={editing.desc2Weight} setWeight={v => U("desc2Weight", v)} rows={2} />

                    <BtnRow label="🔘 ボタン①" text={editing.btn1Text || ""} setText={v => U("btn1Text", v)} url={editing.btn1Url || ""} setUrl={v => U("btn1Url", v)} bgColor={editing.btn1BgColor} setBgColor={v => U("btn1BgColor", v)} textColor={editing.btn1TextColor} setTextColor={v => U("btn1TextColor", v)} size={editing.btn1Size} setSize={v => U("btn1Size", v)} weight={editing.btn1Weight} setWeight={v => U("btn1Weight", v)} />

                    <fieldset className="border rounded-lg p-3 space-y-2">
                      <legend className="text-xs font-bold text-slate-600 px-2">ボタン共通設定</legend>
                      <div className="flex gap-3 items-center flex-wrap">
                        <label className="text-[10px] text-slate-500">角丸</label>
                        <input type="number" value={editing.btn1Radius} onChange={e => U("btn1Radius", +e.target.value)} className="w-16 p-1 border rounded text-xs" min={0} max={9999} />
                        <label className="text-[10px] text-slate-500">上下余白</label>
                        <input type="number" value={editing.btn1PaddingY} onChange={e => U("btn1PaddingY", +e.target.value)} className="w-14 p-1 border rounded text-xs" min={0} />
                        <label className="text-[10px] text-slate-500">左右余白</label>
                        <input type="number" value={editing.btn1PaddingX} onChange={e => U("btn1PaddingX", +e.target.value)} className="w-14 p-1 border rounded text-xs" min={0} />
                      </div>
                    </fieldset>

                    <StyleRow label="📄 説明文③" text={editing.desc3Text || ""} setText={v => U("desc3Text", v)} color={editing.desc3Color} setColor={v => U("desc3Color", v)} size={editing.desc3Size} setSize={v => U("desc3Size", v)} weight={editing.desc3Weight} setWeight={v => U("desc3Weight", v)} rows={2} />

                    <BtnRow label="🔘 ボタン②" text={editing.btn2Text || ""} setText={v => U("btn2Text", v)} url={editing.btn2Url || ""} setUrl={v => U("btn2Url", v)} bgColor={editing.btn2BgColor} setBgColor={v => U("btn2BgColor", v)} textColor={editing.btn2TextColor} setTextColor={v => U("btn2TextColor", v)} size={editing.btn2Size} setSize={v => U("btn2Size", v)} weight={editing.btn2Weight} setWeight={v => U("btn2Weight", v)} />

                    <StyleRow label="📄 説明文④" text={editing.desc4Text || ""} setText={v => U("desc4Text", v)} color={editing.desc4Color} setColor={v => U("desc4Color", v)} size={editing.desc4Size} setSize={v => U("desc4Size", v)} weight={editing.desc4Weight} setWeight={v => U("desc4Weight", v)} rows={2} />

                    <fieldset className="border rounded-lg p-3 space-y-2">
                      <legend className="text-xs font-bold text-slate-600 px-2">📞 TELリンク</legend>
                      <input value={editing.telText || ""} onChange={e => U("telText", e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="表示テキスト（例：0120-792-684）" />
                      <input value={editing.telNumber || ""} onChange={e => U("telNumber", e.target.value)} className="w-full p-2 border rounded text-sm font-mono" placeholder="電話番号（例：0120792684）" />
                      <div className="flex gap-2 items-center flex-wrap">
                        <input type="color" value={editing.telColor} onChange={e => U("telColor", e.target.value)} className="w-8 h-7 rounded cursor-pointer border" />
                        <select value={editing.telSize} onChange={e => U("telSize", +e.target.value)} className="p-1 border rounded text-xs">
                          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                        </select>
                        <select value={editing.telWeight} onChange={e => U("telWeight", e.target.value)} className="p-1 border rounded text-xs">
                          {WEIGHTS.map(w => <option key={w.v} value={w.v}>{w.l}</option>)}
                        </select>
                      </div>
                    </fieldset>
                  </div>

                  {/* 右：プレビュー */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">プレビュー</label>
                    <div className="sticky top-4">
                      {renderPreview(editing)}
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
