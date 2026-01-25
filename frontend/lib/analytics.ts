export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // In a real app, this would send data to PostHog, Mixpanel, Google Analytics, etc.
    if (typeof window !== 'undefined') {
        console.log(`[Analytics] ${eventName}`, properties);
        // Dispatch a custom event for local listeners if needed
        window.dispatchEvent(new CustomEvent('analytics_event', { detail: { eventName, properties } }));
    }
};
