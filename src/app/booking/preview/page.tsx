import type { Metadata } from "next";
import BookingPreview from "@/components/preview3d/BookingPreview";

export const metadata: Metadata = {
  title: "Preview Kursi 3D — Cinema View",
  description: "Lihat studio dari kursi terpilih sebelum menyelesaikan pesanan.",
};

export default function PreviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Preview Kursi 3D</h1>
        <p className="text-sm text-muted">
          Tampilan overview studio. Mode first-person dari kursi terpilih menyusul.
        </p>
      </div>
      <BookingPreview />
    </div>
  );
}
