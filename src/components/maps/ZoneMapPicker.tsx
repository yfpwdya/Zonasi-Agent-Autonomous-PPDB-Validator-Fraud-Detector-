"use client";
export function ZoneMapPicker({
  lat,
  lng,
  address,
}: {
  lat: number;
  lng: number;
  address: string;
}) {
  return (
    <span className="font-code-sm text-code-sm text-text-muted">
      {address} ({lat.toFixed(5)}, {lng.toFixed(5)})
    </span>
  );
}
