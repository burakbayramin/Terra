export const BUILDING_AGES = [
  { label: "0-5 yıl", value: 1 },
  { label: "6-10 yıl", value: 2 },
  { label: "11-20 yıl", value: 3 },
  { label: "21-30 yıl", value: 4 },
  { label: "31+ yıl", value: 5 },
] as const;

export const BUILDING_TYPES = [
  { label: "Müstakil Ev", value: 1 },
  { label: "Apartman", value: 2 },
  { label: "Rezidans", value: 3 },
  { label: "Villa", value: 4 },
  { label: "Diğer", value: 5 },
] as const;

// Type safety için
export type BuildingAge = (typeof BUILDING_AGES)[number];
export type BuildingType = (typeof BUILDING_TYPES)[number];
