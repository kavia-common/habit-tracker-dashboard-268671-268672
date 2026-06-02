import React from 'react';
import {ApiClient} from '../api/apiClient';
import {LocalStore} from '../data/localStore';
import {nowIsoDate} from '../utils/time';

/**
 * @fileoverview Global app state container.
 */

const AppStateContext = React.createContext(null);

/**
 * PUBLIC_INTERFACE
 * @return {Object}
 */
export function useAppState() {
    const ctx = React.useContext(AppStateContext);
    if (!ctx) {
        throw new Error('useAppState must be used within <AppStateProvider>.');
    }
    return ctx;
}

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @return {JSX.Element}
 */
export function AppStateProvider(props) {
    const store = React.useMemo(() => new LocalStore(), []);
    const api = React.useMemo(() => new ApiClient({store}), [store]);

    const [connectivity, setConnectivity] = React.useState(api.getConnectivity());
    const [habits, setHabits] = React.useState([]);
    const [checkinsByDate, setCheckinsByDate] = React.useState([]);
    const [settings, setSettings] = React.useState(store.getSettings());
    const [selectedDate, setSelectedDate] = React.useState(nowIsoDate());
    const [loading, setLoading] = React.useState({habits: true, checkins: true});
    const [error, setError] = React.useState(null);

    /** @return {Promise<void>} */
    async function refreshConnectivity() {
        const c = await api.probe();
        setConnectivity(c);
    }

    /** @return {Promise<void>} */
    async function refreshHabits() {
        setLoading((l) => Object.assign({}, l, {habits: true}));
        setError(null);
        const res = await api.listHabits();
        setConnectivity(api.getConnectivity());
        setHabits(res.habits);
        setLoading((l) => Object.assign({}, l, {habits: false}));
    }

    /**
     * @param {string} dateIso
     * @return {Promise<void>}
     */
    async function refreshCheckinsForDate(dateIso) {
        setLoading((l) => Object.assign({}, l, {checkins: true}));
        setError(null);
        const res = await api.listCheckinsByDate(dateIso);
        setConnectivity(api.getConnectivity());
        setCheckinsByDate(res.checkins);
        setLoading((l) => Object.assign({}, l, {checkins: false}));
    }

    React.useEffect(() => {
        // Initial load.
        (async () => {
            await refreshConnectivity();
            await refreshHabits();
            await refreshCheckinsForDate(selectedDate);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        refreshCheckinsForDate(selectedDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    /**
     * PUBLIC_INTERFACE
     * @param {Object} payload
     * @return {Promise<Object>}
     */
    async function createHabit(payload) {
        const res = await api.createHabit(payload);
        setConnectivity(api.getConnectivity());
        await refreshHabits();
        return res.habit;
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @param {Object} patch
     * @return {Promise<Object>}
     */
    async function updateHabit(habitId, patch) {
        const res = await api.updateHabit(habitId, patch);
        setConnectivity(api.getConnectivity());
        await refreshHabits();
        return res.habit;
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @return {Promise<void>}
     */
    async function deleteHabit(habitId) {
        await api.deleteHabit(habitId);
        setConnectivity(api.getConnectivity());
        await refreshHabits();
    }

    /**
     * PUBLIC_INTERFACE
     * @param {string} habitId
     * @param {string} dateIso
     * @param {boolean} completed
     * @param {string=} note
     * @return {Promise<void>}
     */
    async function setCompletion(habitId, dateIso, completed, note = '') {
        await api.upsertCheckin(habitId, dateIso, {completed, note});
        setConnectivity(api.getConnectivity());
        await refreshCheckinsForDate(dateIso);
    }

    /**
     * PUBLIC_INTERFACE
     * @param {Object} patch
     * @return {Object}
     */
    function patchSettings(patch) {
        const s = store.patchSettings(patch);
        setSettings(s);
        return s;
    }

    const value = {
        api,
        connectivity,
        habits,
        checkinsByDate,
        settings,
        selectedDate,
        loading,
        error,

        setError,

        refreshConnectivity,
        refreshHabits,
        refreshCheckinsForDate,
        setSelectedDate,

        createHabit,
        updateHabit,
        deleteHabit,
        setCompletion,
        patchSettings,
    };

    return <AppStateContext.Provider value={value}>{props.children}</AppStateContext.Provider>;
}
