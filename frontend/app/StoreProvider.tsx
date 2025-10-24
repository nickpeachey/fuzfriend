'use client'
import { useMemo } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../store/lib/store'
import { useEffect } from 'react'
import { readCartCookie, writeCartCookie } from '../store/lib/cookies'
import { setFromCookie } from '../store/cartSlice'

export default function StoreProvider({
    children
}: {
    children: React.ReactNode
}) {
    // Initialize the store once per mount without accessing refs during render
    const store = useMemo(() => makeStore(), [])
    // Hydrate cart from cookie on client mount
    useEffect(() => {
        const ids = readCartCookie();
        store.dispatch(setFromCookie(ids));
        // Subscribe to store changes to persist cart cookie
        const unsubscribe = store.subscribe(() => {
            try {
                const state: any = store.getState();
                const items: number[] = state.cart?.items ?? [];
                writeCartCookie(items);
            } catch {}
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <Provider store={store}>{children}</Provider>
}