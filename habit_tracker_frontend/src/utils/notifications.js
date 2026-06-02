/**
 * @fileoverview Browser notifications utilities.
 */

/**
 * PUBLIC_INTERFACE
 * @return {boolean}
 */
export function isNotificationsSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * PUBLIC_INTERFACE
 * @return {'granted'|'denied'|'default'|'unsupported'}
 */
export function getNotificationPermission() {
    if (!isNotificationsSupported()) return 'unsupported';
    return Notification.permission;
}

/**
 * PUBLIC_INTERFACE
 * @return {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestNotificationPermission() {
    if (!isNotificationsSupported()) return 'unsupported';
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (e) {
        return getNotificationPermission();
    }
}

/**
 * PUBLIC_INTERFACE
 * Show a best-effort notification (will no-op if not permitted).
 * @param {string} title
 * @param {{body?: string}=} opts
 * @return {void}
 */
export function showNotification(title, opts = {}) {
    if (!isNotificationsSupported()) return;
    if (Notification.permission !== 'granted') return;

    try {
        new Notification(title, {body: opts.body || ''});
    } catch (e) {
        // Ignore.
    }
}
