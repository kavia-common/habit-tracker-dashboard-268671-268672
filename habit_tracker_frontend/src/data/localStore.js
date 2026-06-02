import {createHabitId, nowIsoDate} from '../utils/time';

/**
 * @fileoverview Local store for offline-first fallback.
 */

const LS_KEY = 'habit_tracker__v1';

/**
 * @typedef {{
 *   habits: !Array<Object>,
 *   checkins: !Array<Object>,
 *   settings: Object,
 * }} LocalDb
 */

/**
 * @return {LocalDb}
 */
function defaultDb() {
    const today = nowIsoDate();
    const sampleHabit = {
        id: createHabitId(),
        name: 'Drink water',
        description: 'Stay hydrated (8 cups).',
        color: '#3B82F6',
        schedule: {daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeOfDay: '09:00'},
        createdAt: new Date().toISOString(),
        archived: false,
    };

    return {
        habits: [sampleHabit],
        checkins: [
            {
                habitId: sampleHabit.id,
                date: today,
                completed: false,
                note: '',
                updatedAt: new Date().toISOString(),
            },
        ],
        settings: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            reminderSound: 'chime',
            snoozeMinutes: 10,
            notificationsEnabled: false,
        },
    };
}

/**
 * @return {LocalDb}
 */
function loadDb() {
    try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return defaultDb();
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return defaultDb();

        return {
            habits: Array.isArray(parsed.habits) ? parsed.habits : [],
            checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
            settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : defaultDb().settings,
        };
    } catch (e) {
        return defaultDb();
    }
}

/**
 * @param {LocalDb} db
 * @return {void}
 */
function saveDb(db) {
    window.localStorage.setItem(LS_KEY, JSON.stringify(db));
}

export class LocalStore {
    constructor() {
        /** @private */
        this.db_ = loadDb();
    }

    /**
     * PUBLIC_INTERFACE
     * @return {Object}
     */
    getSettings() {
        return Object.assign({}, this.db_.settings);
    }

    /**
     * PUBLIC_INTERFACE
     * @param {Object} patch
     * @return {Object}
     */
    patchSettings(patch) {
        this.db_.settings = Object.assign({}, this.db_.settings, patch);
        saveDb(this.db_);
        return this.getSettings();
    }

    /**
     * PUBLIC_INTERFACE
     * @return {!Array<Object>}
     */
    listHabits() {
        return this.db_.habits.slice();
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @return {(Object|null)}
     */
    getHabit(habitId) {
        return this.db_.habits.find((h) => h.id === habitId) || null;
    }

    /**
     * PUBLIC_INTERFACE
     * @param {Object} habit
     * @return {Object}
     */
    upsertHabit(habit) {
        const idx = this.db_.habits.findIndex((h) => h.id === habit.id);
        if (idx >= 0) {
            this.db_.habits[idx] = Object.assign({}, this.db_.habits[idx], habit);
        } else {
            this.db_.habits.unshift(habit);
        }
        saveDb(this.db_);
        return habit;
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @param {Object} patch
     * @return {(Object|null)}
     */
    patchHabit(habitId, patch) {
        const idx = this.db_.habits.findIndex((h) => h.id === habitId);
        if (idx < 0) return null;
        this.db_.habits[idx] = Object.assign({}, this.db_.habits[idx], patch);
        saveDb(this.db_);
        return this.db_.habits[idx];
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @return {void}
     */
    deleteHabit(habitId) {
        this.db_.habits = this.db_.habits.filter((h) => h.id !== habitId);
        this.db_.checkins = this.db_.checkins.filter((c) => c.habitId !== habitId);
        saveDb(this.db_);
    }

    /**
     * PUBLIC_INTERFACE
     * @return {!Array<Object>}
     */
    listCheckins() {
        return this.db_.checkins.slice();
    }

    /**
     * PUBLIC_INTERFACE
     * @param {Object} checkin
     * @return {Object}
     */
    upsertCheckin(checkin) {
        const idx = this.db_.checkins.findIndex(
            (c) => c.habitId === checkin.habitId && c.date === checkin.date
        );
        if (idx >= 0) {
            this.db_.checkins[idx] = Object.assign({}, this.db_.checkins[idx], checkin);
        } else {
            this.db_.checkins.unshift(checkin);
        }
        saveDb(this.db_);
        return checkin;
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} dateIso
     * @return {!Array<Object>}
     */
    listCheckinsByDate(dateIso) {
        return this.db_.checkins.filter((c) => c.date === dateIso);
    }
}
