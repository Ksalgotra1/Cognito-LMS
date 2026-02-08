// Toast event emitter for use outside React components (e.g., axios interceptors)
// This allows axios to trigger toast notifications without being inside the React tree

const listeners = new Set();

export const toastEvents = {
    subscribe: (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    },

    emit: (message, type = 'error') => {
        listeners.forEach(callback => callback(message, type));
    }
};
