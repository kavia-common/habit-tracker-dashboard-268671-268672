import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {EmptyState} from '../components/EmptyState';
import {Modal} from '../components/Modal';
import {useAppState} from '../state/AppState';

/**
 * @return {JSX.Element}
 */
export function HabitsPage() {
    const navigate = useNavigate();
    const {habits, loading, createHabit, updateHabit, deleteHabit} = useAppState();

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingHabit, setEditingHabit] = React.useState(null);

    /** @return {void} */
    function openCreate() {
        setEditingHabit(null);
        setIsModalOpen(true);
    }

    /**
     * @param {Object} habit
     * @return {void}
     */
    function openEdit(habit) {
        setEditingHabit(habit);
        setIsModalOpen(true);
    }

    if (loading.habits) {
        return <div className="card">Loading habits…</div>;
    }

    const activeHabits = habits.filter((h) => !h.archived);

    return (
        <div className="stack">
            <div className="card">
                <div className="cardHeader">
                    <div>
                        <h2>Your habits</h2>
                        <p>Create, schedule, and track daily completion.</p>
                    </div>
                    <div className="row">
                        <button className="btn btnPrimary" onClick={openCreate}>
                            + New habit
                        </button>
                    </div>
                </div>

                {activeHabits.length === 0 ? (
                    <EmptyState
                        title="No habits yet"
                        message="Create your first habit to start tracking streaks and progress."
                        action={
                            <button className="btn btnPrimary" onClick={openCreate}>
                                Create a habit
                            </button>
                        }
                    />
                ) : (
                    <table className="table" aria-label="Habits table">
                        <thead>
                            <tr>
                                <th>Habit</th>
                                <th>Schedule</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeHabits.map((h) => (
                                <tr key={h.id}>
                                    <td>
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
                                    </td>
                                    <td>
                                        <span className="miniHelp">
                                            {Array.isArray(h.schedule?.daysOfWeek)
                                                ? `${h.schedule.daysOfWeek.length} days/week`
                                                : 'Custom'}
                                            {' • '}
                                            {h.schedule?.timeOfDay || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row" style={{justifyContent: 'flex-end'}}>
                                            <Link className="btn btnSmall" to={`/habits/${h.id}`}>
                                                View
                                            </Link>
                                            <button className="btn btnSmall" onClick={() => openEdit(h)}>
                                                Edit
                                            </button>
                                            <button
                                                className="btn btnSmall btnDanger"
                                                onClick={async () => {
                                                    await deleteHabit(h.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen ? (
                <HabitEditorModal
                    habit={editingHabit}
                    onClose={() => setIsModalOpen(false)}
                    onSave={async (payload) => {
                        if (editingHabit) {
                            await updateHabit(editingHabit.id, payload);
                            setIsModalOpen(false);
                            return;
                        }
                        const created = await createHabit(payload);
                        setIsModalOpen(false);
                        navigate(`/habits/${created.id}`);
                    }}
                />
            ) : null}
        </div>
    );
}

/**
 * @param {Object} props
 * @param {(Object|null)} props.habit
 * @param {() => void} props.onClose
 * @param {(payload: Object) => Promise<void>} props.onSave
 * @return {JSX.Element}
 */
function HabitEditorModal(props) {
    const habit = props.habit;

    const [name, setName] = React.useState(habit?.name || '');
    const [description, setDescription] = React.useState(habit?.description || '');
    const [color, setColor] = React.useState(habit?.color || '#3B82F6');
    const [timeOfDay, setTimeOfDay] = React.useState(habit?.schedule?.timeOfDay || '08:00');
    const [daysOfWeek, setDaysOfWeek] = React.useState(
        Array.isArray(habit?.schedule?.daysOfWeek) ? habit.schedule.daysOfWeek : [1, 2, 3, 4, 5]
    );

    /** @param {number} day */
    function toggleDay(day) {
        setDaysOfWeek((prev) => {
            const set = new Set(prev);
            if (set.has(day)) set.delete(day);
            else set.add(day);
            return Array.from(set).sort((a, b) => a - b);
        });
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Modal
            title={habit ? 'Edit habit' : 'Create habit'}
            onClose={props.onClose}
            footer={
                <>
                    <button className="btn" onClick={props.onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btnPrimary"
                        onClick={async () => {
                            await props.onSave({
                                name: name.trim() || 'Untitled Habit',
                                description: description.trim(),
                                color,
                                schedule: {daysOfWeek, timeOfDay},
                            });
                        }}
                    >
                        Save
                    </button>
                </>
            }
        >
            <div className="grid2">
                <div>
                    <div className="label">Name</div>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <div className="label">Color</div>
                    <input
                        className="input"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        aria-label="Habit color"
                        style={{height: 40, padding: 6}}
                    />
                </div>
            </div>

            <div style={{marginTop: 10}}>
                <div className="label">Description</div>
                <input
                    className="input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                />
            </div>

            <div className="grid2" style={{marginTop: 10}}>
                <div>
                    <div className="label">Time of day</div>
                    <input
                        className="input"
                        type="time"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                    />
                </div>
                <div>
                    <div className="label">Days</div>
                    <div className="row" style={{flexWrap: 'wrap'}}>
                        {dayLabels.map((label, idx) => {
                            const active = daysOfWeek.includes(idx);
                            return (
                                <button
                                    key={label}
                                    className={active ? 'btn btnSmall btnPrimary' : 'btn btnSmall'}
                                    onClick={() => toggleDay(idx)}
                                    type="button"
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="miniHelp" style={{marginTop: 10}}>
                Schedule is used for reminders UX; check-ins are tracked daily.
            </div>
        </Modal>
    );
}
