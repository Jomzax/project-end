'use client'

import { createContext, useContext, useCallback } from 'react'
import 'sweetalert2/dist/sweetalert2.min.css'

const AlertContext = createContext()

let swalPromise = null

const getSwal = async () => {
    if (!swalPromise) {
        swalPromise = import('sweetalert2').then((m) => m.default)
    }
    return swalPromise
}

const getDefaultTitle = (type) => {
    const titles = {
        success: 'สำเร็จ',
        error: 'เกิดข้อผิดพลาด',
        warning: 'คำเตือน',
        info: 'ข้อมูล',
        confirm: 'ยืนยัน'
    }
    return titles[type] || titles.info
}

const ALERT_THEME = {
    success: { icon: '#16a34a', background: '#ecfdf3', text: '#166534' },
    error: { icon: '#dc2626', background: '#fff5f5', text: '#7f1d1d' },
    warning: { icon: '#f59e0b', background: '#fffbeb', text: '#92400e' },
    info: { icon: '#2563eb', background: '#eff6ff', text: '#1e40af' },
    confirm: {
        icon: '#ff8800',
        background: '#ffffff',
        text: '#000000',
        confirmButton: '#b91c1c',
        cancelButton: '#94a3b8'
    }
}

const escapeHtml = (value = '') =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')

export function AlertProvider({ children }) {
    const showAlert = useCallback(async (message, type = 'info', title = null, onConfirm = null) => {
        const Swal = await getSwal()
        const resolvedTitle = title || getDefaultTitle(type)
        const safeMessage = escapeHtml(message)

        if (Swal.isVisible()) {
            Swal.close()
        }

        if (type === 'confirm') {
            const confirmTheme = ALERT_THEME.confirm
            const result = await Swal.fire({
                title: resolvedTitle,
                html: `
                    <div style="margin-top:10px;padding-top:12px;border-top:1px solid #edd3b0;line-height:1.55;text-align:center;">
                        ${safeMessage}
                    </div>
                `,
                icon: 'warning',
                iconColor: confirmTheme.icon,
                background: confirmTheme.background,
                color: confirmTheme.text,
                showCancelButton: true,
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: confirmTheme.confirmButton,
                cancelButtonColor: confirmTheme.cancelButton,
                reverseButtons: true,
                allowOutsideClick: false,
                focusCancel: true,
                animation: false,
                buttonsStyling: true,
                width: 520,
                customClass: {
                    title: 'app-swal-title',
                    htmlContainer: 'app-swal-body'
                }
            })

            if (result.isConfirmed && onConfirm) {
                await onConfirm()
            }
            return result
        }

        const icon = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info'
        const theme = ALERT_THEME[icon]
        const contentHtml = icon === 'error'
            ? `
                <div style="margin-top:6px;line-height:1.5;">
                    ${safeMessage}
                </div>
            `
            : `
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(15,23,42,.12);line-height:1.45;">
                    ${safeMessage}
                </div>
            `

        return Swal.fire({
            toast: true,
            position: 'top',
            timer: 2200,
            timerProgressBar: true,
            showConfirmButton: false,
            icon,
            iconColor: theme.icon,
            title: resolvedTitle,
            html: contentHtml,
            background: theme.background,
            color: theme.text,
            animation: false,
            didOpen: (toast) => {
                toast.style.borderLeft = `6px solid ${theme.icon}`
                toast.style.borderRadius = '12px'
                toast.style.boxShadow = '0 14px 30px rgba(15, 23, 42, 0.16)'
                toast.style.padding = '12px 14px'
                toast.style.maxWidth = '560px'

                const titleEl = toast.querySelector('.swal2-title')
                if (titleEl) {
                    titleEl.style.margin = '0'
                    titleEl.style.fontSize = '24px'
                    titleEl.style.fontWeight = '700'
                    titleEl.style.lineHeight = '1.25'
                }

                const htmlEl = toast.querySelector('.swal2-html-container')
                if (htmlEl) {
                    htmlEl.style.margin = '8px 0 0'
                    htmlEl.style.fontSize = '16px'
                    htmlEl.style.lineHeight = '1.5'
                }

                const iconEl = toast.querySelector('.swal2-icon')
                if (iconEl) {
                    iconEl.style.margin = '2px 10px 0 0'
                    iconEl.style.transform = 'scale(0.9)'
                }

                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        })
    }, [])

    const closeAlert = useCallback(async () => {
        const Swal = await getSwal()
        Swal.close()
    }, [])

    const confirmAlert = useCallback(async () => {
        const Swal = await getSwal()
        Swal.clickConfirm()
    }, [])

    return (
        <AlertContext.Provider value={{ alert: null, showAlert, closeAlert, confirmAlert }}>
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
