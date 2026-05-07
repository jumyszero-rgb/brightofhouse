// @/src/components/TopPriceAppeal.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TopPriceAppeal() {
  const items = await prisma.topPriceItem.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (items.length === 0) return null;

  return (
    <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }} className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div style={{ textAlign: "center" }} className="mb-8">
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>札幌最安水準の価格設定</p>
          <h2 style={{ color: "#1e293b", fontSize: "clamp(1.5rem, 4vw, 1.875rem)", fontWeight: 900 }}>単品料金のご案内</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} style={{ background: "#ff0000d2", border: "1px solid #ff0000cd", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff", marginBottom: "8px" }}>{item.title}</p>
              <p style={{ fontSize: "clamp(1.875rem, 5vw, 2.25rem)", fontWeight: 900, color: "#ffffff" }}>{item.price}</p>
              <p style={{ fontSize: "12px", color: "#ffffff", marginTop: "4px" }}>{item.unit}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link
            href="/service"
            style={{
              background: "#dc2626",
              color: "#ffffff",
              padding: "16px 40px",
              borderRadius: "9999px",
              fontWeight: 900,
              fontSize: "16px",
              display: "inline-block",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              textDecoration: "none",
            }}
          >
            すべての料金を見る ➝
          </Link>
        </div>
      </div>
    </section>
  );
}
