import React from 'react';

/**
 * @param {{title: string, message: string, action?: React.ReactNode}} props
 * @return {JSX.Element}
 */
export function EmptyState(props) {
    return (
        <div className="card">
            <div className="stack">
                <div>
                    <strong>{props.title}</strong>
                    <div className="miniHelp">{props.message}</div>
                </div>
                {props.action ? <div className="row">{props.action}</div> : null}
            </div>
        </div>
    );
}
