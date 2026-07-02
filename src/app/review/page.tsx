// @/src/app/review/page.tsx
import type { Metadata } from "next";
import ReviewClient from "@/components/ReviewClient";

export const metadata: Metadata = {
  title: "アンケート",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return <ReviewClient />;
}
