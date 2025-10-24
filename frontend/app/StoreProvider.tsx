'use client'
import { useMemo } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../store/lib/store'

export default function StoreProvider({
    children
}: {
    children: React.ReactNode
}) {
    // Initialize the store once per mount without accessing refs during render
    const store = useMemo(() => makeStore(), [])
    return <Provider store={store}>{children}</Provider>
}