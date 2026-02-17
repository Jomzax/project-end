'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const AlertContext = createContext()

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null)

    const showAlert = useCallback((message, type = 'info', title = null, onConfirm = null) => {
        setAlert({
            message,
            type, // 'info', 'success', 'warning', 'error', 'confirm'
            title: title || getDefaultTitle(type),
            onConfirm
        })
    }, [])

    const closeAlert = useCallback(() => {
        setAlert(null)
    }, [])

    const confirmAlert = useCallback(() => {
        if (alert?.onConfirm) {
            alert.onConfirm()
        }
        closeAlert()
    }, [alert, closeAlert])

    const getDefaultTitle = (type) => {
        const titles = {
            'success': '✅ สำเร็จ',
            'error': '❌ ข้อผิดพลาด',
            'warning': '⚠️ คำเตือน',
            'info': 'ℹ️ ข้อมูล',
            'confirm': '❓ ยืนยัน'
        }
        return titles[type] || titles['info']
    }

    return (
        <AlertContext.Provider value={{ alert, showAlert, closeAlert, confirmAlert }}>
            {children}
        </AlertContext.Provider>
    )
}

export function useAlert() {
    const context = useContext(AlertContext)
    if (!context) {
        throw new Error('useAlert must be used within AlertProvider')
    }
    return context
}
