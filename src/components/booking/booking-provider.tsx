"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { produce } from 'immer';
import type { DateRange } from "react-day-picker";

import { WizardBookingDraft } from '@/lib/types';
import { useDebounce } from 'use-debounce';


const LOCAL_STORAGE_KEY = 'zapgo.book.draft';

type BookingState = WizardBookingDraft;

const initialState: BookingState = {
    dates: undefined,
    city: undefined,
    vehicle: undefined,
    planId:undefined,
    planName: undefined,
    joiningFee: undefined,
    deposit: undefined,
    holdId: undefined,
    holdExpiresAt: undefined,
    contact: undefined,
    kyc: undefined,
    termsAccepted: false,
};

type BookingAction =
    | { type: 'SET_DRAFT'; payload: Partial<BookingState> }
    | { type: 'RESET_DRAFT' }
    | { type: 'HYDRATE_DRAFT'; payload: BookingState };

const bookingReducer = produce((draft: BookingState, action: BookingAction) => {
    switch (action.type) {
        case 'HYDRATE_DRAFT':
            return { ...initialState, ...action.payload };
        case 'SET_DRAFT':
            return { ...draft, ...action.payload };
        case 'RESET_DRAFT':
            return initialState;
        default:
            return draft;
    }
});


interface BookingContextType {
    draft: BookingState;
    setDraft: (payload: Partial<BookingState>) => void;
    resetDraft: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
    const [draft, dispatch] = useReducer(bookingReducer, initialState);
    const [debouncedDraft] = useDebounce(draft, 500);

    // Hydrate from localStorage
    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                // Basic validation
                if (parsed.city || parsed.vehicle) {
                    if (parsed.dates?.from) parsed.dates.from = new Date(parsed.dates.from);
                    if (parsed.dates?.to) parsed.dates.to = new Date(parsed.dates.to);
                    dispatch({ type: 'HYDRATE_DRAFT', payload: parsed });
                }
                if (parsed?.vehicle) {
                    const vid = parsed.vehicle.vehicleId ?? parsed.vehicle.id ?? parsed.vehicle.VehicleId;
                    if (vid && !parsed.vehicle.vehicleId) parsed.vehicle.vehicleId = Number(vid);
                    if (parsed.vehicle.RentPerDay && !parsed.vehicle.rentPerDay) {
                        parsed.vehicle.rentPerDay = Number(parsed.vehicle.RentPerDay);
                    }
                    if (!parsed.vehicle.model && parsed.vehicle.Model) parsed.vehicle.model = parsed.vehicle.Model;
                }
            }
        } catch (error) {
            console.error("Failed to load booking draft from localStorage", error);
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(debouncedDraft));
        } catch (error) {
            console.error("Failed to save booking draft to localStorage", error);
        }
    }, [debouncedDraft]);

    const setDraft = useCallback((payload: Partial<BookingState>) => {
        dispatch({ type: 'SET_DRAFT', payload });
    }, []);

    const resetDraft = useCallback(() => {
        dispatch({ type: 'RESET_DRAFT' });
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear draft from localStorage", error);
        }
    }, []);


    return (
        <BookingContext.Provider value={{ draft, setDraft, resetDraft }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBookingWizard = () => {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBookingWizard must be used within a BookingProvider');
    }
    return context;
};
