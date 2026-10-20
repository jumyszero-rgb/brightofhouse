// @/src/lib/campaignNames.ts
// Google広告のキャンペーンID → 表示名（管理画面 /admin/lead-events で編集・SiteSettings.campaignNames）。サーバー専用。
import prisma from "@/lib/prisma";
import { toCampaignNames } from "@/lib/leadSource";

export async function getCampaignNames(): Promise<Record<string, string>> {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "main" }, select: { campaignNames: true } });
    return toCampaignNames(s?.campaignNames);
  } catch {
    return {};
  }
}

/** キャンペーンIDを「名前（ID）」にする。未登録ならIDのみ、IDが無ければ空 */
export async function resolveCampaignName(cid?: string | null): Promise<string> {
  if (!cid) return "";
  const names = await getCampaignNames();
  return names[cid] ? `${names[cid]}（${cid}）` : cid;
}

/** 広告グループ（検索）またはアセットグループ（P-MAX）を「名前（ID）」に */
export async function resolveAdGroupName(ag?: string | null, asg?: string | null): Promise<string> {
  const id = ag || asg;
  if (!id) return "";
  const name = await resolveCampaignName(id);
  return asg && !ag ? `${name}［アセットグループ］` : name;
}
