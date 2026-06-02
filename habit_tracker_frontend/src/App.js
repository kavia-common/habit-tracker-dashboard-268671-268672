import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {AppStateProvider} from './state/AppState';
import {DashboardShell} from './layout/DashboardShell';
import {OverviewPage} from './pages/OverviewPage';
import {HabitsPage} from './pages/HabitsPage';
import {HabitDetailPage} from './pages/HabitDetailPage';
import {CalendarPage} from './pages/CalendarPage';
import {StatsPage} from './pages/StatsPage';
import {SettingsPage} from './pages/SettingsPage';

/**
 * @fileoverview Application root: state provider + routing.
 */

/**
 * @return {JSX.Element}
 */
export default function App() {
    return (
        <div className="containerApp">
            <AppStateProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<DashboardShell />}>
                            <Route index element={<OverviewPage />} />
                            <Route path="habits" element={<HabitsPage />} />
                            <Route path="habits/:habitId" element={<HabitDetailPage />} />
                            <Route path="calendar" element={<CalendarPage />} />
                            <Route path="stats" element={<StatsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AppStateProvider>
        </div>
    );
}

/**
 * @return {JSX.Element}
 */
function NotFound() {
    return (
        <div className="card">
            <div className="stack">
                <strong>Page not found</strong>
                <div className="miniHelp">Use the sidebar to navigate.</div>
            </div>
        </div>
    );
}
