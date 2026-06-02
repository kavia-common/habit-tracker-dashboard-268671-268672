import React from 'react';
import {NavLink, Outlet, useLocation} from 'react-router-dom';
import {ConnectivityPill} from '../components/ConnectivityPill';
import {useAppState} from '../state/AppState';

/**
 * @fileoverview Dashboard shell with sidebar navigation and a topbar.
 */

/**
 * @return {string}
 */
function getPageTitleFromPath() {
    const path = window.location.pathname;
    if (path.startsWith('/habits')) return 'Habits';
    if (path.startsWith('/calendar')) return 'Calendar';
    if (path.startsWith('/stats')) return 'Stats';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Overview';
}

/**
 * @param {Object} props
 * @return {JSX.Element}
 */
export function DashboardShell(props) {
    const {connectivity, settings} = useAppState();
    const location = useLocation();
    const title = React.useMemo(() => getPageTitleFromPath(), [location]);

    return (
        <div className="layoutRoot">
            <aside className="sidebar">
                <div className="sidebarBrand">
                    <div className="brandMark">H</div>
                    <div className="brandTitle">
                        <strong>Habit Tracker</strong>
                        <span>{settings.timezone}</span>
                    </div>
                </div>

                <div className="navGroupLabel">Dashboard</div>

                <NavLink
                    to="/"
                    end
                    className={({isActive}) => (isActive ? 'navItem navItemActive' : 'navItem')}
                >
                    <span>Overview</span>
                </NavLink>

                <NavLink
                    to="/habits"
                    className={({isActive}) => (isActive ? 'navItem navItemActive' : 'navItem')}
                >
                    <span>Habits</span>
                </NavLink>

                <NavLink
                    to="/calendar"
                    className={({isActive}) => (isActive ? 'navItem navItemActive' : 'navItem')}
                >
                    <span>Calendar</span>
                </NavLink>

                <NavLink
                    to="/stats"
                    className={({isActive}) => (isActive ? 'navItem navItemActive' : 'navItem')}
                >
                    <span>Stats</span>
                </NavLink>

                <div className="navGroupLabel">Preferences</div>

                <NavLink
                    to="/settings"
                    className={({isActive}) => (isActive ? 'navItem navItemActive' : 'navItem')}
                >
                    <span>Settings</span>
                </NavLink>

                <div style={{marginTop: 16}}>
                    <div className="miniHelp">
                        Tip: Press <span className="kbd">Esc</span> to close dialogs.
                    </div>
                </div>
            </aside>

            <div className="mainCol">
                <header className="topbar">
                    <div className="topbarTitle">
                        <h1>{title}</h1>
                        <span className="sub">Light dashboard • minimal</span>
                    </div>
                    <div className="topbarActions">
                        <ConnectivityPill mode={connectivity.mode} reason={connectivity.reason} />
                        {props.children}
                    </div>
                </header>

                <main className="page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
