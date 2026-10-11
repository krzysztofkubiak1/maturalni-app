/**
 * Etykiety terminów zajęć — muszą być zgodne z SCHEDULE_SLOTS w backend/app/schemas.py.
 */
export const scheduleLabels: Record<string, string> = {
  "wtorek-17-19": "Wtorek, 17:00–19:00",
  "wtorek-19-21": "Wtorek, 19:00–21:00",
  "czwartek-17-19": "Czwartek, 17:00–19:00",
  "czwartek-19-21": "Czwartek, 19:00–21:00",
};

export function formatScheduleLabel(value: string): string {
  return scheduleLabels[value] ?? value;
}
