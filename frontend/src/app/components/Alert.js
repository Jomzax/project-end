'use client'

import { useAlert } from '@/app/lib/alert-context'
import './Alert.css'

export default function Alert() {
    const { alert, closeAlert, confirmAlert } = useAlert()

    if (!alert) return null

    const getAlertColor = (type) => {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6',
            'confirm': '#f59e0b'
        }
        return colors[type] || colors['info']
    }

    const getAlertBg = (type) => {
        const bgs = {
            'success': '#ecfdf5',
            'error': '#fef2f2',
            'warning': '#fffbeb',
            'info': '#eff6ff',
            'confirm': '#fffbeb'
        }
        return bgs[type] || bgs['info']
    }

    const isConfirm = alert.type === 'confirm'

    return (
        <div className="alert-overlay" onClick={closeAlert}>
            <div
                className={`alert-container alert-${alert.type}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="alert-header">
                    <h6 className="alert-title">{alert.title}</h6>
                    <button className="alert-close" onClick={closeAlert}>✕</button>
                </div>

                <div className="alert-body">
                    <p className="alert-message">{alert.message}</p>
                </div>

                <div className="alert-footer">
                    {isConfirm ? (
                        <>
                            <button
                                className="alert-btn alert-btn-cancel"
                                onClick={closeAlert}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="alert-btn-ok"
                                style={{ backgroundColor: getAlertColor(alert.type) }}
                                onClick={confirmAlert}
                            >
                                ยืนยัน
                            </button>
                        </>
                    ) : (
                        <button
                            className="alert-btn-ok"
                            style={{ backgroundColor: getAlertColor(alert.type) }}
                            onClick={closeAlert}
                        >
                            ตกลง
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
