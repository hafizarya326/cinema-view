import CheckoutClient from "@/components/booking/CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted">
          Periksa kembali pesananmu, lalu konfirmasi untuk mendapatkan kode booking.
        </p>
      </div>
      <CheckoutClient />
    </div>
  );
}
