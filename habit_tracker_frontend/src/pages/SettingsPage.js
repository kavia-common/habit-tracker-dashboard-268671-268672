import React from 'react';
import {useAppState} from '../state/AppState';
import {
    getNotificationPermission,
    isNotificationsSupported,
    requestNotificationPermission,
    showNotification,
} from '../utils/notifications';

/**
 * @return {JSX.Element}
 */
export function SettingsPage() {
    const {settings, patchSettings} = useAppState();

    const [permission, setPermission] = React.useState(getNotificationPermission());

    /** @return {Promise<void>} */
    async function requestPerm() {
        const p = await requestNotificationPermission();
        setPermission(p);
        patchSettings({notificationsEnabled: p === 'granted'});
        if (p === 'granted') {
            showNotification('Habit Tracker', {body: 'Notifications enabled.'});
        }
    }

    return (
        <div className="stack">
            <div className="card">
                <div className="cardHeader">
                    <div>
                        <h2>Settings</h2>
                        <p>Customize reminders and preferences.</p>
                    </div>
                </div>

                <div className="grid2">
                    <div>
                        <div className="label">Timezone</div>
                        <input
                            className="input"
                            value={settings.timezone || ''}
                            onChange={(e) => patchSettings({timezone: e.target.value})}
                            placeholder="e.g., America/Los_Angeles"
                        />
                        <div className="miniHelp">
                            Default detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </div>
                    </div>

                    <div>
                        <div className="label">Reminder sound</div>
                        <select
                            className="input"
                            value={settings.reminderSound || 'chime'}
                            onChange={(e) => patchSettings({reminderSound: e.target.value})}
                        >
                            <option value="chime">Chime</option>
                            <option value="bell">Bell</option>
                            <option value="pop">Pop</option>
                            <option value="silent">Silent</option>
                        </select>
                        <div className="miniHelp">Sound is UI-only until backend / scheduling is wired.</div>
                    </div>
                </div>

                <div className="grid2" style={{marginTop: 10}}>
                    <div>
                        <div className="label">Snooze minutes</div>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            max="240"
                            value={settings.snoozeMinutes || 10}
                            onChange={(e) => patchSettings({snoozeMinutes: parseInt(e.target.value, 10) || 10})}
                        />
                        <div className="miniHelp">Used by reminders UX for “Snooze”.</div>
                    </div>

                    <div>
                        <div className="label">Notifications</div>
                        {!isNotificationsSupported() ? (
                            <div className="miniHelp">Notifications are not supported in this browser.</div>
                        ) : (
                            <div className="stack" style={{gap: 8}}>
                                <div className="row" style={{justifyContent: 'space-between'}}>
                                    <span className="pill">Permission: {permission}</span>
                                    <button className="btn btnSmall btnPrimary" onClick={requestPerm}>
                                        Request permission
                                    </button>
                                </div>
                                <div className="miniHelp">
                                    If granted, the app may show reminder notifications (future enhancement: schedule via backend/service worker).
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="cardHeader">
                    <div>
                        <h2>Reminder UX preview</h2>
                        <p>Simulate a reminder notification and snooze workflow.</p>
                    </div>
                </div>

                <div className="row" style={{flexWrap: 'wrap'}}>
                    <button
                        className="btn btnPrimary"
                        onClick={() => showNotification('Habit reminder', {body: 'Time for your habits.'})}
                    >
                        Send test notification
                    </button>
                    <button
                        className="btn"
                        onClick={() => {
                            const mins = settings.snoozeMinutes || 10;
                            window.alert(`Snoozed for ${mins} minutes (UI-only demo).`);
                        }}
                    >
                        Snooze
                    </button>
                </div>

                <div className="miniHelp" style={{marginTop: 10}}>
                    Real scheduling typically requires backend jobs and/or a service worker with Push API.
                </div>
            </div>
        </div>
    );
}
