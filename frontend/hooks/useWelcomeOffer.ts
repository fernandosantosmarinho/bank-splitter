import { useState, useEffect } from 'react';

export interface WelcomeOfferState {
    isActive: boolean;
    expiresAtMs: number;
    remainingMs: number;
    remainingLabel: string; // "HH:MM:SS"
}

/**
 * Centralized hook for Welcome Offer state
 * 
 * RULES:
 * - Offer is active if: !welcomeOfferUsed && now < accountCreatedAt + 48h
 * - Timer is ALWAYS based on accountCreatedAt (persisted), never on mount time
 * - Returns consistent state for both Banner and Modal
 * 
 * @param accountCreatedAtIso - ISO timestamp from backend (e.g. "2024-01-01T00:00:00Z")
 * @param welcomeOfferUsed - Boolean flag if user already claimed the offer
 */
export function useWelcomeOffer(
    accountCreatedAtIso: string | null | undefined,
    welcomeOfferUsed: boolean | null | undefined
): WelcomeOfferState {
    const [remainingMs, setRemainingMs] = useState<number>(0);

    // Calculate expiration time (48 hours from account creation)
    const expiresAtMs = (() => {
        if (!accountCreatedAtIso) return 0;

        const createdAtMs = Date.parse(accountCreatedAtIso);

        // Safety: Invalid date parsing
        if (Number.isNaN(createdAtMs)) {
            console.warn('[useWelcomeOffer] Invalid accountCreatedAtIso:', accountCreatedAtIso);
            return 0;
        }

        // Add 48 hours in milliseconds
        return createdAtMs + (48 * 60 * 60 * 1000);
    })();

    // Update remaining time every second
    useEffect(() => {
        if (expiresAtMs === 0) {
            setRemainingMs(0);
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = expiresAtMs - now;
            setRemainingMs(Math.max(0, diff));
        };

        // Initial calculation
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAtMs]);

    // Determine if offer is active
    const isActive = remainingMs > 0 && !welcomeOfferUsed;

    // Format remaining time as HH:MM:SS
    const remainingLabel = (() => {
        if (remainingMs <= 0) return '00:00:00';

        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    })();

    return {
        isActive,
        expiresAtMs,
        remainingMs,
        remainingLabel
    };
}
