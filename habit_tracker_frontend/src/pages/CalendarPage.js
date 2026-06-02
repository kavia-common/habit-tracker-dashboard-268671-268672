import React from 'react';
import {useAppState} from '../state/AppState';
import {getMonthDays, monthKey, nowIsoDate} from '../utils/time';

/**
 * @return {JSX.Element}
 */
export function CalendarPage() {
    const {api, setSelectedDate, selectedDate} = useAppState();
    const [heat, setHeat] = React.useState({});
    const [cursor, setCursor] = React.useState(() => {
        const d = new Date();
        return {year: d.getFullYear(), monthIndex: d.getMonth()};
    });

    React.useEffect(() => {
        (async () => {
            // Use stats endpoint if present; otherwise compute from local.
            const res = await api.getStats();
            const byDate = res.stats?.byDate || null;
            if (byDate && typeof byDate === 'object') {
                setHeat(byDate);
                return;
            }

            // Fallback: infer density from local store checkins.
            const storeCheckins = api.store_?.listCheckins ? api.store_.listCheckins() : [];
            const map = {};
            for (const c of storeCheckins) {
                if (!c.completed) continue;
                map[c.date] = (map[c.date] || 0) + 1;
            }
            setHeat(map);
        })();
    }, [api]);

    const {days, firstWeekday, daysInMonth} = getMonthDays(cursor.year, cursor.monthIndex);
    const title = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, '0')}`;

    /** @param {number} n */
    function intensityClass(n) {
        if (n <= 0) return 'cell0';
        if (n === 1) return 'cell1';
        if (n === 2) return 'cell2';
        if (n === 3) return 'cell3';
        return 'cell4';
    }

    const today = nowIsoDate();
    const selected = selectedDate || today;

    return (
        <div className="stack">
            <div className="card">
                <div className="cardHeader">
                    <div>
                        <h2>Calendar heatmap</h2>
                        <p>Completion density per day (counts across habits).</p>
                    </div>
                    <div className="row">
                        <button
                            className="btn btnSmall"
                            onClick={() => {
                                const d = new Date(cursor.year, cursor.monthIndex, 1);
                                d.setMonth(d.getMonth() - 1);
                                setCursor({year: d.getFullYear(), monthIndex: d.getMonth()});
                            }}
                        >
                            Prev
                        </button>
                        <span className="pill" title={monthKey(cursor.year, cursor.monthIndex)}>
                            {title}
                        </span>
                        <button
                            className="btn btnSmall"
                            onClick={() => {
                                const d = new Date(cursor.year, cursor.monthIndex, 1);
                                d.setMonth(d.getMonth() + 1);
                                setCursor({year: d.getFullYear(), monthIndex: d.getMonth()});
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>

                <CalendarGrid
                    days={days}
                    firstWeekday={firstWeekday}
                    daysInMonth={daysInMonth}
                    heat={heat}
                    selected={selected}
                    onSelect={(iso) => setSelectedDate(iso)}
                    intensityClass={intensityClass}
                />

                <div className="miniHelp" style={{marginTop: 10}}>
                    Legend: <span style={{display: 'inline-flex', gap: 6, verticalAlign: 'middle'}}>
                        <LegendSwatch classNameName="cell0" />
                        <LegendSwatch classNameName="cell1" />
                        <LegendSwatch classNameName="cell2" />
                        <LegendSwatch classNameName="cell3" />
                        <LegendSwatch classNameName="cell4" />
                    </span>
                </div>
            </div>

            <style>{`
                .calGrid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                    padding: 10px 2px 2px;
                }
                .calCell {
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    padding: 10px 10px;
                    min-height: 54px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .cell0 { background: #fff; }
                .cell1 { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.22); }
                .cell2 { background: rgba(16, 185, 129, 0.20); border-color: rgba(16, 185, 129, 0.30); }
                .cell3 { background: rgba(16, 185, 129, 0.28); border-color: rgba(16, 185, 129, 0.38); }
                .cell4 { background: rgba(16, 185, 129, 0.36); border-color: rgba(16, 185, 129, 0.46); }
                .calCellSelected { outline: 2px solid rgba(59, 130, 246, 0.6); }
                .calCellToday { box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.45); }
                .calHead {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                    color: var(--color-muted);
                    font-size: 12px;
                    padding: 0 2px;
                }
                .calHead div { padding: 0 10px; }
            `}</style>
        </div>
    );
}

/**
 * @param {{classNameName: string}} props
 * @return {JSX.Element}
 */
function LegendSwatch(props) {
    return <span className={`calCell ${props.classNameName}`} style={{minHeight: 22, padding: 0, width: 22}} />;
}

/**
 * @param {Object} props
 * @return {JSX.Element}
 */
function CalendarGrid(props) {
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const blanks = [];
    for (let i = 0; i < props.firstWeekday; i++) blanks.push(i);

    return (
        <div>
            <div className="calHead">
                {weekday.map((w) => (
                    <div key={w}>{w}</div>
                ))}
            </div>
            <div className="calGrid" role="grid" aria-label="Month calendar">
                {blanks.map((i) => (
                    <div key={`b_${i}`} />
                ))}
                {props.days.map((d) => {
                    const n = props.heat[d.iso] || 0;
                    const cls = props.intensityClass(n);
                    const selected = d.iso === props.selected;
                    const today = d.iso === nowIsoDate();

                    return (
                        <div
                            key={d.iso}
                            role="gridcell"
                            className={[
                                'calCell',
                                cls,
                                selected ? 'calCellSelected' : '',
                                today ? 'calCellToday' : '',
                            ].join(' ')}
                            onClick={() => props.onSelect(d.iso)}
                            title={`${d.iso} • ${n} completions`}
                        >
                            <div className="row" style={{justifyContent: 'space-between'}}>
                                <strong style={{fontSize: 13}}>{d.day}</strong>
                                <span className="pill" style={{fontSize: 11}}>
                                    {n}
                                </span>
                            </div>
                            <div className="miniHelp">click to select</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
