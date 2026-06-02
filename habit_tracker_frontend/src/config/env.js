/**
 * @fileoverview Environment configuration for the frontend.
 * React only exposes environment variables prefixed with REACT_APP_ at build time.
 */

/**
 * PUBLIC_INTERFACE
 * @return {{
 *   apiBase: string,
 *   backendUrl: string,
 *   frontendUrl: string,
 *   wsUrl: string,
 *   nodeEnv: string,
 * }}
 */
export function getEnv() {
    const nodeEnv = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development';

    // Prefer explicit API base; fallback to backend URL; finally fallback to same-origin '/api'.
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const apiBase = process.env.REACT_APP_API_BASE || backendUrl || '/api';

    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    const wsUrl = process.env.REACT_APP_WS_URL || '';

    return {
        apiBase,
        backendUrl,
        frontendUrl,
        wsUrl,
        nodeEnv,
    };
}
