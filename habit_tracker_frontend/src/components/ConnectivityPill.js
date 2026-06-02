import React from 'react';

/**
 * @param {{mode: 'online'|'offline', reason: string}} props
 * @return {JSX.Element}
 */
export function ConnectivityPill(props) {
    if (props.mode === 'online') {
        return <span className="badgeOk">Online</span>;
    }
    return <span className="badgeWarn" title={props.reason}>Offline</span>;
}
