"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminContextType {
    isAdmin: boolean;
    authorName: string;
    showPinModal: boolean;
    openPinModal: () => void;
    closePinModal: () => void;
    verifyPin: (pin: string) => boolean;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_PIN = "230898";
const STORAGE_KEY = "our-memories-admin";

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // Sync admin state from sessionStorage after hydration
    // eslint-disable-next-line react-compiler/react-compiler
    useEffect(() => {
        if (sessionStorage.getItem(STORAGE_KEY) === "true") setIsAdmin(true);
    }, []);

    const verifyPin = (pin: string): boolean => {
        if (pin === ADMIN_PIN) {
            setIsAdmin(true);
            sessionStorage.setItem(STORAGE_KEY, "true");
            setShowPinModal(false);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        sessionStorage.removeItem(STORAGE_KEY);
    };

    const authorName = isAdmin ? "Ezi" : "Ratih";

    const openPinModal = () => setShowPinModal(true);
    const closePinModal = () => setShowPinModal(false);

    return (
        <AdminContext.Provider value={{ isAdmin, authorName, showPinModal, openPinModal, closePinModal, verifyPin, logout }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) throw new Error("useAdmin must be used within AdminProvider");
    return context;
}
