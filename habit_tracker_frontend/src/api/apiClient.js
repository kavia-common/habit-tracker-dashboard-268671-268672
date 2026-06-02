import {getEnv} from '../config/env';
import {LocalStore} from '../data/localStore';
import {createHabitId, nowIsoDate, safeJsonParse} from '../utils/time';

/**
 * @fileoverview API client for the habit tracker backend with graceful fallback.
 *
 * Design:
 * - If the backend is reachable, we use it.
 * - If it is unreachable (network error, 5xx, or non-JSON), we fallback to local persistence.
 * - This keeps the app usable during early development or when the backend is down.
 */

const DEFAULT_TIMEOUT_MS = 6500;

/**
 * @param {string} path
 * @return {string}
 */
function buildUrl(path) {
    const {apiBase} = getEnv();

    if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
        return `${apiBase.replace(/\/+$/, '')}${path}`;
    }
    // Relative base (e.g., '/api') keeps same-origin behavior.
    return `${apiBase.replace(/\/+$/, '')}${path}`;
}

/**
 * @param {RequestInit} init
 * @return {RequestInit}
 */
function withJsonHeaders(init) {
    const headers = Object.assign(
        {'Content-Type': 'application/json'},
        init.headers || {}
    );
    return Object.assign({}, init, {headers});
}

/**
 * @param {string} url
 * @param {RequestInit} init
 * @return {Promise<{ok: boolean, status: number, data: (Object|null), rawText: (string|null)}>}
 */
async function fetchJson(url, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
        const res = await fetch(url, Object.assign({}, init, {signal: controller.signal}));
        const rawText = await res.text();

        const data = safeJsonParse(rawText);
        return {ok: res.ok, status: res.status, data, rawText};
    } catch (e) {
        return {ok: false, status: 0, data: null, rawText: null};
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   color: string,
 *   schedule: {daysOfWeek: number[], timeOfDay: string},
 *   createdAt: string,
 *   archived: boolean,
 * }} Habit
 */

/**
 * @typedef {{
 *   habitId: string,
 *   date: string,
 *   completed: boolean,
 *   note: string,
 *   updatedAt: string,
 * }} Checkin
 */

/**
 * @typedef {{
 *   mode: 'online'|'offline',
 *   reason: string,
 * }} Connectivity
 */

export class ApiClient {
    /**
     * @param {{store?: LocalStore}=} opts
     */
    constructor(opts = {}) {
        /** @private @const */
        this.store_ = opts.store || new LocalStore();
        /** @private */
        this.connectivity_ = {mode: 'offline', reason: 'not_checked'};
    }

    /**
     * PUBLIC_INTERFACE
     * @return {Connectivity}
     */
    getConnectivity() {
        return this.connectivity_;
    }

    /**
     * PUBLIC_INTERFACE
     * Probe the backend. This never throws.
     * @return {Promise<Connectivity>}
     */
    async probe() {
        const url = buildUrl('/health');
        const res = await fetchJson(url, {method: 'GET'});

        if (res.ok) {
            this.connectivity_ = {mode: 'online', reason: 'health_ok'};
            return this.connectivity_;
        }

        // Backend might not have /health; try a small GET to /habits.
        const res2 = await fetchJson(buildUrl('/habits'), {method: 'GET'});
        if (res2.ok || res2.status === 401 || res2.status === 403) {
            this.connectivity_ = {mode: 'online', reason: 'habits_reachable'};
            return this.connectivity_;
        }

        this.connectivity_ = {mode: 'offline', reason: 'unreachable'};
        return this.connectivity_;
    }

    /**
     * PUBLIC_INTERFACE
     * @return {Promise<{habits: Habit[], source: 'api'|'local'}>}
     */
    async listHabits() {
        const res = await fetchJson(buildUrl('/habits'), {method: 'GET'});
        if (res.ok && res.data && Array.isArray(res.data.habits || res.data)) {
            this.connectivity_ = {mode: 'online', reason: 'listHabits_ok'};
            const habits = Array.isArray(res.data) ? res.data : res.data.habits;
            return {habits, source: 'api'};
        }
        this.connectivity_ = {mode: 'offline', reason: 'listHabits_fallback'};
        return {habits: this.store_.listHabits(), source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @return {Promise<{habit: (Habit|null), source: 'api'|'local'}>}
     */
    async getHabit(habitId) {
        const res = await fetchJson(buildUrl(`/habits/${encodeURIComponent(habitId)}`), {method: 'GET'});
        if (res.ok && res.data) {
            this.connectivity_ = {mode: 'online', reason: 'getHabit_ok'};
            return {habit: res.data.habit || res.data, source: 'api'};
        }
        this.connectivity_ = {mode: 'offline', reason: 'getHabit_fallback'};
        return {habit: this.store_.getHabit(habitId), source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @param {Partial<Habit>} payload
     * @return {Promise<{habit: Habit, source: 'api'|'local'}>}
     */
    async createHabit(payload) {
        const res = await fetchJson(
            buildUrl('/habits'),
            withJsonHeaders({method: 'POST', body: JSON.stringify(payload)})
        );
        if (res.ok && res.data) {
            this.connectivity_ = {mode: 'online', reason: 'createHabit_ok'};
            return {habit: res.data.habit || res.data, source: 'api'};
        }

        this.connectivity_ = {mode: 'offline', reason: 'createHabit_fallback'};
        const habit = Object.assign(
            {
                id: createHabitId(),
                name: payload.name || 'Untitled Habit',
                description: payload.description || '',
                color: payload.color || '#3B82F6',
                schedule: payload.schedule || {daysOfWeek: [1, 2, 3, 4, 5], timeOfDay: '08:00'},
                createdAt: new Date().toISOString(),
                archived: false,
            },
            {}
        );
        this.store_.upsertHabit(habit);
        return {habit, source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @param {Partial<Habit>} payload
     * @return {Promise<{habit: Habit, source: 'api'|'local'}>}
     */
    async updateHabit(habitId, payload) {
        const res = await fetchJson(
            buildUrl(`/habits/${encodeURIComponent(habitId)}`),
            withJsonHeaders({method: 'PATCH', body: JSON.stringify(payload)})
        );
        if (res.ok && res.data) {
            this.connectivity_ = {mode: 'online', reason: 'updateHabit_ok'};
            return {habit: res.data.habit || res.data, source: 'api'};
        }

        this.connectivity_ = {mode: 'offline', reason: 'updateHabit_fallback'};
        const updated = this.store_.patchHabit(habitId, payload);
        if (!updated) {
            // If habit doesn't exist locally, create a local placeholder.
            const created = Object.assign(
                {
                    id: habitId,
                    name: payload.name || 'Untitled Habit',
                    description: payload.description || '',
                    color: payload.color || '#3B82F6',
                    schedule: payload.schedule || {daysOfWeek: [1, 2, 3, 4, 5], timeOfDay: '08:00'},
                    createdAt: new Date().toISOString(),
                    archived: false,
                },
                {}
            );
            this.store_.upsertHabit(created);
            return {habit: created, source: 'local'};
        }
        return {habit: updated, source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @return {Promise<{ok: boolean, source: 'api'|'local'}>}
     */
    async deleteHabit(habitId) {
        const res = await fetchJson(buildUrl(`/habits/${encodeURIComponent(habitId)}`), {method: 'DELETE'});
        if (res.ok) {
            this.connectivity_ = {mode: 'online', reason: 'deleteHabit_ok'};
            return {ok: true, source: 'api'};
        }

        this.connectivity_ = {mode: 'offline', reason: 'deleteHabit_fallback'};
        this.store_.deleteHabit(habitId);
        return {ok: true, source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @param {string} dateIso - YYYY-MM-DD
     * @param {{completed: boolean, note?: string}} payload
     * @return {Promise<{checkin: Checkin, source: 'api'|'local'}>}
     */
    async upsertCheckin(habitId, dateIso, payload) {
        const res = await fetchJson(
            buildUrl(`/habits/${encodeURIComponent(habitId)}/checkins/${encodeURIComponent(dateIso)}`),
            withJsonHeaders({method: 'PUT', body: JSON.stringify(payload)})
        );
        if (res.ok && res.data) {
            this.connectivity_ = {mode: 'online', reason: 'upsertCheckin_ok'};
            return {checkin: res.data.checkin || res.data, source: 'api'};
        }

        this.connectivity_ = {mode: 'offline', reason: 'upsertCheckin_fallback'};
        const checkin = {
            habitId,
            date: dateIso,
            completed: Boolean(payload.completed),
            note: payload.note || '',
            updatedAt: new Date().toISOString(),
        };
        this.store_.upsertCheckin(checkin);
        return {checkin, source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} dateIso - YYYY-MM-DD
     * @return {Promise<{checkins: Checkin[], source: 'api'|'local'}>}
     */
    async listCheckinsByDate(dateIso) {
        const res = await fetchJson(buildUrl(`/checkins?date=${encodeURIComponent(dateIso)}`), {method: 'GET'});
        if (res.ok && res.data && Array.isArray(res.data.checkins || res.data)) {
            this.connectivity_ = {mode: 'online', reason: 'listCheckins_ok'};
            const checkins = Array.isArray(res.data) ? res.data : res.data.checkins;
            return {checkins, source: 'api'};
        }

        this.connectivity_ = {mode: 'offline', reason: 'listCheckins_fallback'};
        return {checkins: this.store_.listCheckinsByDate(dateIso), source: 'local'};
    }

    /**
     * PUBLIC_INTERFACE
     * @return {Promise<{stats: Object, source: 'api'|'local'}>}
     */
    async getStats() {
        const res = await fetchJson(buildUrl('/stats'), {method: 'GET'});
        if (res.ok && res.data) {
            this.connectivity_ = {mode: 'online', reason: 'stats_ok'};
            return {stats: res.data.stats || res.data, source: 'api'};
        }
        this.connectivity_ = {mode: 'offline', reason: 'stats_fallback'};

        const today = nowIsoDate();
        const habits = this.store_.listHabits().filter((h) => !h.archived);
        const checkins = this.store_.listCheckins();

        // Local, best-effort stats computation.
        const byHabit = {};
        for (const habit of habits) {
            byHabit[habit.id] = {habitId: habit.id, totalCompleted: 0, currentStreak: 0, bestStreak: 0};
        }
        for (const c of checkins) {
            if (!byHabit[c.habitId]) continue;
            if (c.completed) byHabit[c.habitId].totalCompleted += 1;
        }

        // Streaks computed over recent days for each habit (simple model: daily streak).
        for (const habit of habits) {
            const days = [];
            for (let i = 0; i < 120; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const iso = d.toISOString().slice(0, 10);
                days.push(iso);
            }

            const completedSet = new Set(
                checkins
                    .filter((c) => c.habitId === habit.id && c.completed)
                    .map((c) => c.date)
            );

            let current = 0;
            for (const iso of days) {
                if (iso === today || iso < today) {
                    if (completedSet.has(iso)) {
                        current += 1;
                    } else {
                        // Break at first missing day from today backwards.
                        if (iso === today || current > 0) break;
                    }
                }
            }

            let best = 0;
            let run = 0;
            for (const iso of days.slice().reverse()) {
                if (completedSet.has(iso)) {
                    run += 1;
                    if (run > best) best = run;
                } else {
                    run = 0;
                }
            }

            byHabit[habit.id].currentStreak = current;
            byHabit[habit.id].bestStreak = best;
        }

        const overall = {
            habitsTotal: habits.length,
            checkinsTotal: checkins.length,
            completedTotal: checkins.filter((c) => c.completed).length,
        };

        return {stats: {overall, byHabit}, source: 'local'};
    }
}
