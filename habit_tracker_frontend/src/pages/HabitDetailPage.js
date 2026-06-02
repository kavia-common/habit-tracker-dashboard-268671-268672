import React from 'react';
import {Link, useParams} from 'react-router-dom';
import {useAppState} from '../state/AppState';
import {formatIsoDate, nowIsoDate} from '../utils/time';

/**
 * @return {JSX.Element}
 */
export function HabitDetailPage() {
    const {habitId} = useParams();
    const {
        habits,
        selectedDate,
        setSelectedDate,
        checkinsByDate,
        loading,
        setCompletion,
    } = useAppState();

    const habit = habits.find((h) => h.id === habitId) || null;

    const today = nowIsoDate();
    const date = selectedDate || today;

    const existing = checkinsByDate.find((c) => c.habitId === habitId) || null;
    const completed = Boolean(existing && existing.completed);

    if (!habit) {
        return (
            <div className="card">
                <div className="stack">
                    <strong>Habit not found</strong>
                    <div className="miniHelp">It may have been deleted.</div>
                    <div className="row">
                        <Link className="btn" to="/habits">
                            Back to habits
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="stack">
            <div className="card">
                <div className="cardHeader">
                    <div className="row" style={{gap: 12}}>
                        <span
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                background: habit.color || '#3B82F6',
                                display: 'inline-block',
                                border: '1px solid rgba(17,24,39,0.15)',
                            }}
                        />
                        <div>
                            <h2 style={{marginBottom: 4}}>{habit.name}</h2>
                            <p>{habit.description || '—'}</p>
                        </div>
                    </div>
                    <div className="row">
                        <Link className="btn btnSmall" to="/habits">
                            Back
                        </Link>
                    </div>
                </div>

                <div className="grid2">
                    <div className="card" style={{padding: 12}}>
                        <div className="label">Selected day</div>
                        <div className="row" style={{justifyContent: 'space-between'}}>
                            <input
                                className="input"
                                type="date"
                                value={date}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                aria-label="Select date"
                            />
                            <div className="miniHelp">{formatIsoDate(date)}</div>
                        </div>

                        <div className="hr" />

                        <div className="row" style={{justifyContent: 'space-between'}}>
                            <div>
                                <strong>Completed?</strong>
                                <div className="miniHelp">
                                    Mark your daily check-in. This drives streaks and stats.
                                </div>
                            </div>
                            <button
                                className={completed ? 'btn btnPrimary' : 'btn'}
                                disabled={loading.checkins}
                                onClick={async () => {
                                    await setCompletion(habit.id, date, !completed, existing?.note || '');
                                }}
                            >
                                {completed ? 'Completed' : 'Mark complete'}
                            </button>
                        </div>

                        <div style={{marginTop: 10}}>
                            <div className="label">Note</div>
                            <input
                                className="input"
                                value={existing?.note || ''}
                                onChange={async (e) => {
                                    await setCompletion(habit.id, date, completed, e.target.value);
                                }}
                                placeholder="Optional note…"
                                disabled={loading.checkins}
                            />
                        </div>
                    </div>

                    <StreakCard habitId={habit.id} />
                </div>
            </div>
        </div>
    );
}

/**
 * @param {{habitId: string}} props
 * @return {JSX.Element}
 */
function StreakCard(props) {
    const {api} = useAppState();
    const [stats, setStats] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            const res = await api.getStats();
            setStats(res.stats);
        })();
    }, [api, props.habitId]);

    const row = stats?.byHabit?.[props.habitId] || null;

    return (
        <div className="card" style={{padding: 12}}>
            <div className="cardHeader">
                <div>
                    <h2>Streak</h2>
                    <p>Local best-effort calculation when offline.</p>
                </div>
            </div>

            {row ? (
                <div className="grid3">
                    <div className="card" style={{padding: 12}}>
                        <div className="label">Current</div>
                        <strong style={{fontSize: 22}}>{row.currentStreak}</strong>
                        <div className="miniHelp">days</div>
                    </div>
                    <div className="card" style={{padding: 12}}>
                        <div className="label">Best</div>
                        <strong style={{fontSize: 22}}>{row.bestStreak}</strong>
                        <div className="miniHelp">days</div>
                    </div>
                    <div className="card" style={{padding: 12}}>
                        <div className="label">Total completed</div>
                        <strong style={{fontSize: 22}}>{row.totalCompleted}</strong>
                        <div className="miniHelp">check-ins</div>
                    </div>
                </div>
            ) : (
                <div className="miniHelp">Loading…</div>
            )}
        </div>
    );
}
