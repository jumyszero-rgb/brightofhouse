// @/src/lib/serviceItemToBookingData.ts
// bookingData が未設定の ServicePage 用に、連動する ServiceItem/ServiceOption から
// ServicePageBooking が読める BookingData 相当の構造を生成する（表示専用のフォールバック）。

type ServiceItemForBooking = {
  title: string;
  basePrice: number;
  estimatedMinutes: number;
  options: {
    id: string;
    title: string;
    price: number;
    additionalMinutes: number;
  }[];
};

export function serviceItemToBookingData(item: ServiceItemForBooking) {
  return {
    mains: [
      {
        title: item.title,
        price: item.basePrice,
        durationMin: item.estimatedMinutes,
        durationMax: item.estimatedMinutes,
        options: item.options.map((o) => ({
          id: o.id,
          title: o.title,
          price: o.price,
          durationMin: o.additionalMinutes,
          durationMax: o.additionalMinutes,
          maxQty: 1,
        })),
      },
    ],
  };
}
