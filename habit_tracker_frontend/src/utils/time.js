/**
 * @fileoverview Utility helpers for dates, streak logic, and safe parsing.
 */

/**
 * PUBLIC_INTERFACE
 * @return {string} YYYY-MM-DD (local date)
 */
export function nowIsoDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * PUBLIC_INTERFACE
 * @param {string} isoDate YYYY-MM-DD
 * @return {string} Human-readable label
 */
export function formatIsoDate(isoDate) {
    const [y, m, d] = isoDate.split('-').map((x) => parseInt(x, 10));
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
}

/**
 * PUBLIC_INTERFACE
 * @param {number} year
 * @param {number} monthIndex 0-11
 * @return {string} YYYY-MM
 */
export function monthKey(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/**
 * PUBLIC_INTERFACE
 * @param {number} year
 * @param {number} monthIndex 0-11
 * @return {{days: Array<{iso: string, day: number, weekday: number}>, firstWeekday: number, daysInMonth: number}}
 */
export function getMonthDays(year, monthIndex) {
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const daysInMonth = last.getDate();
    const firstWeekday = first.getDay(); // 0-6

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIndex, day);
        const iso = date.toISOString().slice(0, 10);
        days.push({iso, day, weekday: date.getDay()});
    }
    return {days, firstWeekday, daysInMonth};
}

/**
 * PUBLIC_INTERFACE
 * @return {string}
 */
export function createHabitId() {
    // Non-crypto unique-enough for local usage.
    return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * PUBLIC_INTERFACE
 * @param {(string|null)} rawText
 * @return {(Object|null)}
 */
export function safeJsonParse(rawText) {
    if (rawText == null) return null;
    try {
        return JSON.parse(rawText);
    } catch (e) {
        return null;
    }
}
