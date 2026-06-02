import React from 'react';

/**
 * @fileoverview Accessible modal component.
 */

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.children
 * @param {() => void} props.onClose
 * @param {React.ReactNode=} props.footer
 * @return {JSX.Element}
 */
export function Modal(props) {
    React.useEffect(() => {
        /** @param {KeyboardEvent} e */
        function onKeyDown(e) {
            if (e.key === 'Escape') props.onClose();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [props]);

    return (
        <div
            className="modalOverlay"
            role="dialog"
            aria-modal="true"
            aria-label={props.title}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) props.onClose();
            }}
        >
            <div className="modal">
                <div className="modalHeader">
                    <h2>{props.title}</h2>
                    <button className="btn btnSmall" onClick={props.onClose} aria-label="Close dialog">
                        Close
                    </button>
                </div>
                <div>{props.children}</div>
                {props.footer ? (
                    <>
                        <div className="hr" />
                        <div className="row" style={{justifyContent: 'flex-end'}}>
                            {props.footer}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
