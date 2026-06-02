import React from 'react';
import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {useAppState} from '../state/AppState';
import {nowIsoDate} from '../utils/time';

/**
 * @return {JSX.Element}
 */
export function StatsPage() {
    const {api} = useAppState();
    const [stats, setStats] = React.useState(null);
    const [source, setSource] = React.useState('local');
    const [weekly, setWeekly] = React.useState([]);
    const [monthly, setMonthly] = React.useState([]);

    React.useEffect(() => {
        (async () => {
            const res = await api.getStats();
            setStats(res.stats);
            setSource(res.source || 'local');

            // If backend returns time series, use it; else compute basic from local checkins.
            const ts = res.stats?.timeSeries || null;
            if (ts && Array.isArray(ts.weekly) && Array.isArray(ts.monthly)) {
                setWeekly(ts.weekly);
                setMonthly(ts.monthly);
                return;
            }

            const storeCheckins = api.store_?.listCheckins ? api.store_.listCheckins() : [];
            setWeekly(computeWeekly(storeCheckins));
            setMonthly(computeMonthly(storeCheckins));
        })();
    }, [api]);

    const overall = stats?.overall || {habitsTotal: 0, checkinsTotal: 0, completedTotal: 0};

    return (
        <div className="stack">
            <div className="grid3">
                <div className="card">
                    <div className="label">Habits</div>
                    <strong style={{fontSize: 24}}>{overall.habitsTotal}</strong>
                    <div className="miniHelp">active habits tracked</div>
                </div>
                <div className="card">
                    <div className="label">Check-ins</div>
                    <strong style={{fontSize: 24}}>{overall.checkinsTotal}</strong>
                    <div className="miniHelp">all-time check-ins</div>
                </div>
                <div className="card">
                    <div className="label">Completed</div>
                    <strong style={{fontSize: 24}}>{overall.completedTotal}</strong>
                    <div className="miniHelp">all-time completed</div>
                </div>
            </div>

            <div className="card">
                <div className="cardHeader">
                    <div>
                        <h2>Weekly progress</h2>
                        <p>Completions per week (source: {source}).</p>
                    </div>
                </div>
                <div style={{width: '100%', height: 280}}>
                    <ResponsiveContainer>
                        <BarChart data={weekly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="completed" fill="#10B981" name="Completed" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <div className="cardHeader">
                    <div>
                        <h2>Monthly progress</h2>
                        <p>Completions per month.</p>
                    </div>
                </div>
                <div style={{width: '100%', height: 280}}>
                    <ResponsiveContainer>
                        <BarChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="completed" fill="#3B82F6" name="Completed" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="miniHelp">
                Note: When offline, charts are computed from locally stored check-ins.
            </div>
        </div>
    );
}

/**
 * @param {!Array<{date: string, completed: boolean}>} checkins
 * @return {!Array<{label: string, completed: number}>}
 */
function computeWeekly(checkins) {
    const map = new Map();

    for (const c of checkins) {
        if (!c.completed) continue;
        const d = new Date(c.date + 'T00:00:00');
        // ISO week-ish bucket: use Monday-based, but for simplicity bucket by Sunday start.
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        const key = start.toISOString().slice(0, 10);
        map.set(key, (map.get(key) || 0) + 1);
    }

    const keys = Array.from(map.keys()).sort();
    const last = nowIsoDate();
    if (!keys.includes(last)) {
        // Ensure some buckets show even if none completed.
        const t = new Date();
        for (let i = 0; i < 6; i++) {
            const start = new Date(t);
            start.setDate(t.getDate() - t.getDay() - i * 7);
            const key = start.toISOString().slice(0, 10);
            if (!map.has(key)) map.set(key, 0);
        }
    }

    return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-10)
        .map(([k, v]) => ({label: k.slice(5), completed: v}));
}

/**
 * @param {!Array<{date: string, completed: boolean}>} checkins
 * @return {!Array<{label: string, completed: number}>}
 */
function computeMonthly(checkins) {
    const map = new Map();
    for (const c of checkins) {
        if (!c.completed) continue;
        const month = c.date.slice(0, 7);
        map.set(month, (map.get(month) || 0) + 1);
    }

    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.toISOString().slice(0, 7);
        if (!map.has(m)) map.set(m, 0);
    }

    return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([k, v]) => ({label: k, completed: v}));
}
