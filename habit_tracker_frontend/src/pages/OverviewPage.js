import React from 'react';
import {Link} from 'react-router-dom';
import {useAppState} from '../state/AppState';
import {formatIsoDate, nowIsoDate} from '../utils/time';

/**
 * @return {JSX.Element}
 */
export function OverviewPage() {
    const {
        habits,
        selectedDate,
        setSelectedDate,
        checkinsByDate,
        loading,
        setCompletion,
    } = useAppState();

    const date = selectedDate || nowIsoDate();
    const activeHabits = habits.filter((h) => !h.archived);

    /** @param {string} habitId */
    function getCompletion(habitId) {
        return checkinsByDate.find((c) => c.habitId === habitId)?.completed || false;
    }

    return (
        <div className="stack">
            <div className="grid2">
                <div className="card">
                    <div className="cardHeader">
                        <div>
                            <h2>Today</h2>
                            <p>Quickly mark completion for your habits.</p>
                        </div>
                        <div className="row">
                            <input
                                className="input"
                                type="date"
                                value={date}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                aria-label="Select date"
                                style={{maxWidth: 180}}
                            />
                        </div>
                    </div>

                    <div className="miniHelp" style={{marginBottom: 10}}>
                        {formatIsoDate(date)} • {activeHabits.length} active habits
                    </div>

                    {loading.habits ? (
                        <div className="miniHelp">Loading habits…</div>
                    ) : activeHabits.length === 0 ? (
                        <div className="miniHelp">
                            No habits yet. <Link to="/habits">Create one</Link>.
                        </div>
                    ) : (
                        <div className="stack">
                            {activeHabits.map((h) => {
                                const done = getCompletion(h.id);
                                return (
                                    <div
                                        key={h.id}
                                        className="card"
                                        style={{padding: 12, borderRadius: 14}}
                                    >
                                        <div className="row" style={{justifyContent: 'space-between'}}>
                                            <div className="row">
                                                <span
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 999,
                                                        background: h.color || '#3B82F6',
                                                        display: 'inline-block',
                                                        border: '1px solid rgba(17,24,39,0.15)',
                                                    }}
                                                />
                                                <div className="stack" style={{gap: 2}}>
                                                    <strong style={{fontSize: 13}}>{h.name}</strong>
                                                    <span className="miniHelp">{h.description || '—'}</span>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <button
                                                    className={done ? 'btn btnSmall btnPrimary' : 'btn btnSmall'}
                                                    disabled={loading.checkins}
                                                    onClick={async () => {
                                                        await setCompletion(h.id, date, !done, '');
                                                    }}
                                                >
                                                    {done ? 'Done' : 'Mark'}
                                                </button>
                                                <Link className="btn btnSmall" to={`/habits/${h.id}`}>
                                                    Details
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="cardHeader">
                        <div>
                            <h2>At a glance</h2>
                            <p>See calendar and progress insights.</p>
                        </div>
                    </div>
                    <div className="stack">
                        <div className="card" style={{padding: 12}}>
                            <strong>Calendar heatmap</strong>
                            <div className="miniHelp">
                                View completion density across the month and jump to a date.
                            </div>
                            <div className="row" style={{marginTop: 10}}>
                                <Link className="btn btnSmall btnPrimary" to="/calendar">
                                    Open calendar
                                </Link>
                            </div>
                        </div>

                        <div className="card" style={{padding: 12}}>
                            <strong>Stats</strong>
                            <div className="miniHelp">Track streaks and weekly progress charts.</div>
                            <div className="row" style={{marginTop: 10}}>
                                <Link className="btn btnSmall btnPrimary" to="/stats">
                                    View stats
                                </Link>
                            </div>
                        </div>

                        <div className="card" style={{padding: 12}}>
                            <strong>Settings</strong>
                            <div className="miniHelp">Timezone, snooze, reminder sound, notifications.</div>
                            <div className="row" style={{marginTop: 10}}>
                                <Link className="btn btnSmall" to="/settings">
                                    Open settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
