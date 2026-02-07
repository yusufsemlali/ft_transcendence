"use client";

import React, { useEffect, useState, useCallback } from "react";

// --- Types ---

type ToastType = "success" | "error" | "info" | "warning" | "loading";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    description?: string;
    duration?: number;
}

type ToastOptions = {
    description?: string;
    duration?: number;
};

// --- Event System ---

type ToastSubscriber = (toast: Toast) => void;
const subscribers = new Set<ToastSubscriber>();

const notify = (message: string, type: ToastType, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
        id,
        message,
        type,
        ...options,
    };
    subscribers.forEach((callback) => callback(toast));
    return id;
};

export const toast = {
    success: (message: string, options?: ToastOptions) => notify(message, "success", options),
    error: (message: string, options?: ToastOptions) => notify(message, "error", options),
    info: (message: string, options?: ToastOptions) => notify(message, "info", options),
    warning: (message: string, options?: ToastOptions) => notify(message, "warning", options),
    loading: (message: string, options?: ToastOptions) => notify(message, "loading", options),
};

// --- Icons ---

const Icons = {
    success: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    error: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    info: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    warning: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    loading: (
        <svg viewBox="0 0 24 24" className="size-5 animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" fill="none" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
        </svg>
    ),
};

// --- Styles ---

const toastStyles = `
    .sonner-wrapper {
        position: fixed;
        top: 2rem;
        right: 2rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        pointer-events: none;
    }

    .toast-item {
        pointer-events: auto;
        min-width: 320px;
        max-width: 450px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        color: var(--text-primary);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transition: all 0.3s ease;
        position: relative;
    }

    .toast-item.exit {
        animation: toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .toast-success { border-left: 4px solid var(--accent-success); }
    .toast-error { border-left: 4px solid var(--accent-error); }
    .toast-warning { border-left: 4px solid var(--accent-primary); }
    .toast-info { border-left: 4px solid var(--accent-info); }

    .toast-icon {
        flex-shrink: 0;
        margin-top: 2px;
    }

    .toast-success .toast-icon { color: var(--accent-success); }
    .toast-error .toast-icon { color: var(--accent-error); }
    .toast-warning .toast-icon { color: var(--accent-primary); }
    .toast-info .toast-icon { color: var(--accent-info); }
    .toast-loading .toast-icon { color: var(--text-muted); }

    .toast-content {
        flex: 1;
    }

    .toast-message {
        font-size: 0.85rem;
        font-weight: 500;
        line-height: 1.25rem;
    }

    .toast-description {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: 0.15rem;
        line-height: 1rem;
    }

    .toast-close {
        flex-shrink: 0;
        cursor: pointer;
        color: var(--text-muted);
        transition: color 0.1s;
        background: none;
        border: none;
        padding: 4px;
        margin-top: -2px;
        margin-right: -4px;
    }

    .toast-close:hover {
        color: var(--text-primary);
    }

    @keyframes toast-in {
        from { opacity: 0; transform: translateX(100%) scale(0.9); }
        to { opacity: 1; transform: translateX(0) scale(1); }
    }

    @keyframes toast-out {
        from { opacity: 1; transform: translateX(0) scale(1); }
        to { opacity: 0; transform: translateX(20%) scale(0.95); }
    }
`;

// --- Components ---

export const Toaster = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        const element = document.getElementById(`toast-${id}`);
        if (element) {
            element.classList.add("exit");
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 300);
        } else {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }
    }, []);

    useEffect(() => {
        const handleToast = (newToast: Toast) => {
            setToasts((prev) => [newToast, ...prev]);

            const duration = newToast.duration || 4000;
            if (duration !== Infinity) {
                setTimeout(() => {
                    removeToast(newToast.id);
                }, duration);
            }
        };

        subscribers.add(handleToast);
        return () => {
            subscribers.delete(handleToast);
        };
    }, [removeToast]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: toastStyles }} />
            <div className="sonner-wrapper">
                {toasts.map((t) => (
                    <div
                        id={`toast-${t.id}`}
                        key={t.id}
                        className={`toast-item toast-${t.type}`}
                        role="alert"
                    >
                        <div className="toast-icon">
                            {Icons[t.type]}
                        </div>
                        <div className="toast-content">
                            <div className="toast-message">{t.message}</div>
                            {t.description && (
                                <div className="toast-description">{t.description}</div>
                            )}
                        </div>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(t.id)}
                            aria-label="Close"
                        >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
};
