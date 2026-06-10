// Indian fashion occasion calendar
export interface Occasion {
  key: string;
  name: string;
  emoji: string;
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  categories: string[];
  tone: string;
}

export const OCCASIONS: Occasion[] = [
  { key: "festive", name: "Festive Season", emoji: "🪔", startMonth: 10, startDay: 1, endMonth: 11, endDay: 30, categories: ["ethnic", "accessories"], tone: "celebratory, gifting" },
  { key: "wedding", name: "Wedding Season", emoji: "💍", startMonth: 11, startDay: 1, endMonth: 2, endDay: 28, categories: ["ethnic", "accessories"], tone: "opulent, occasion-led" },
  { key: "summer", name: "Summer Drop", emoji: "☀️", startMonth: 3, startDay: 1, endMonth: 5, endDay: 31, categories: ["coords", "western"], tone: "breezy, editorial" },
  { key: "eoss", name: "End of Season Sale", emoji: "🏷️", startMonth: 7, startDay: 15, endMonth: 7, endDay: 31, categories: ["denim", "western", "coords"], tone: "discount-first, urgent" },
  { key: "valentine", name: "Valentine's Edit", emoji: "🌹", startMonth: 2, startDay: 7, endMonth: 2, endDay: 14, categories: ["coords", "accessories"], tone: "romantic, gifting, couples" },
  { key: "college", name: "Back to College", emoji: "🎒", startMonth: 6, startDay: 1, endMonth: 7, endDay: 31, categories: ["denim", "western"], tone: "fresh, youthful" },
];

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function upcomingOccasions(today: Date = new Date()) {
  const year = today.getFullYear();
  return OCCASIONS.map((o) => {
    let start = new Date(year, o.startMonth - 1, o.startDay);
    if (start < today) start = new Date(year + 1, o.startMonth - 1, o.startDay);
    return { ...o, daysAway: daysBetween(today, start), startDate: start };
  }).sort((a, b) => a.daysAway - b.daysAway);
}
