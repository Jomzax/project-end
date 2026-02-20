'use client'

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react'
import * as Icons from 'lucide-react'
import iconNames from "@/app/lib/icon-names.json"
import { useAlert } from '@/app/lib/alert-context'
import '../styles/CategoriesTab.css'

// ==================== Constants ====================

const COMMON_ICONS = [
    'MessageSquare', 'Trophy', 'Film', 'Heart', 'Music', 'Video', 'Star', 'Settings',
    'User', 'Users', 'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'Search',
    'Home', 'Eye', 'Edit2', 'Trash2', 'Download', 'Upload', 'Share2', 'Copy',
    'Bookmark', 'Flag', 'Send', 'Package', 'Tool', 'Briefcase', 'Code', 'Zap',
    'AlertCircle', 'CheckCircle', 'XCircle', 'Info', 'HelpCircle', 'ArrowLeft',
    'ArrowRight', 'Plus', 'Minus', 'Menu', 'Filter', 'BarChart', 'TrendingUp',
    'Activity', 'Award', 'Bell', 'Book', 'Camera', 'Gamepad2', 'Headphones',
    'Smile', 'Coffee', 'Wifi', 'Battery', 'Moon', 'Sun', 'Cloud', 'Database'
]

const COLOR_PALETTE = [
    '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2',
    '#F97316', '#FB923C', '#FBBD23', '#FCD34D', '#FEF3C7',
    '#EAB308', '#FACC15', '#FDEF58', '#FEF08A', '#FEFCE8',
    '#22C55E', '#4ADE80', '#86EFAC', '#BBFB9A', '#DCFCE7',
    '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5',
    '#14B8A6', '#2DD4BF', '#67E8F9', '#A5F3FC', '#CFFAFE',
    '#06B6D4', '#22D3EE', '#0EA5E9', '#38BDF8', '#7DD3FC',
    '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'
]

// ==================== Memoized Components ====================

const DynamicIcon = memo(({ name, ...props }) => {
    const Icon = Icons[name] || Icons.MessageSquare
    return <Icon {...props} />
})

const IconButton = memo(({ iconName, isSelected, onSelect }) => (
    <button
        className={`icon-option ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
        title={iconName}
    >
        <DynamicIcon name={iconName} size={26} />
    </button>
))

const ColorOption = memo(({ color, isSelected, onSelect }) => (
    <button
        className={`color-option ${isSelected ? 'selected' : ''}`}
        style={{ backgroundColor: color }}
        onClick={onSelect}
        title={color}
    />
))

const ColorPicker = memo(({ initial, onCommit, debounceMs = 200 }) => {
    const [localColor, setLocalColor] = useState(initial || '#000000')
    const timer = useRef(null)

    useEffect(() => {
        setLocalColor(initial || '#000000')
    }, [initial])

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [])

    const scheduleCommit = (color) => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
            onCommit && onCommit(color)
            timer.current = null
        }, debounceMs)
    }

    const handleChange = (e) => {
        const c = e.target.value
        setLocalColor(c)
        scheduleCommit(c)
    }

    return (
        <div className="color-picker">
            <div className="color-swatch" style={{ backgroundColor: localColor }} />
            <input
                type="color"
                value={localColor}
                onChange={handleChange}
                className="color-input"
                title="เลือกสีที่กำหนดเอง"
            />
            <span className="color-value">{localColor}</span>
        </div>
    )
})

export default function CategoriesTab({ openCreate, setOpenCreate, globalSearch }) {
    // ==================== State Management ====================

    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [editingCategory, setEditingCategory] = useState(null)
    const [editingDraft, setEditingDraft] = useState(null)
    const [searchIcon, setSearchIcon] = useState('')
    const [debouncedSearchIcon, setDebouncedSearchIcon] = useState('')
    const [saving, setSaving] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        message: '',
        onConfirm: null,
        onCancel: null
    })
    const { showAlert } = useAlert()

    // ==================== Effects & Debouncing ====================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchIcon(searchIcon)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchIcon])

    // Fetch categories from server
    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(
                `http://localhost:5000/api/category/dropdown?page=${page}&limit=10`
            )
            const data = await response.json()
            setCategories(data.data || [])
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [page])

    // Load categories on mount and page change
    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    // Initialize create modal
    useEffect(() => {
        if (openCreate) {
            setEditingCategory(null)
            setEditingDraft({
                name: '',
                slug: '',
                icon: COMMON_ICONS[0] || 'MessageSquare',
                color: COLOR_PALETTE[0] || '#EF4444'
            })
            setSearchIcon('')
            setDebouncedSearchIcon('')
        }
    }, [openCreate])

    // ==================== API Handlers ====================

    // Show confirmation dialog
    const showConfirmDialog = (message, onConfirm) => {
        setConfirmDialog({
            isOpen: true,
            message,
            onConfirm,
            onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        })
    }

    // Delete category
    const handleDeleteCategory = useCallback(async (categoryId, categoryName) => {
        showConfirmDialog(`คุณแน่ใจหรือว่าต้องการลบหมวดหมู่ ${categoryName}?`, async () => {
            try {
                setSaving(true)
                const res = await fetch(`http://localhost:5000/api/category/${categoryId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                })
                if (!res.ok) {
                    const errText = await res.text().catch(() => '')
                    console.error('Delete failed', res.status, errText)
                    showAlert(`ลบไม่สำเร็จ (status ${res.status})`, 'error')
                    return
                }
                await fetchCategories()
                setEditingCategory(null)
                showAlert(`ลบ ${categoryName} เรียบร้อย`, 'success')
            } catch (error) {
                console.error('Delete error:', error)
                showAlert('เกิดข้อผิดพลาดขณะลบ', 'error')
            } finally {
                setSaving(false)
            }
        })
    }, [showAlert, fetchCategories])

    // ==================== Data Processing ====================

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!debouncedSearchIcon.trim()) {
            return COMMON_ICONS
        }
        const filtered = iconNames.filter(icon =>
            icon.toLowerCase().includes(debouncedSearchIcon.toLowerCase())
        )
        return filtered.slice(0, 80)
    }, [debouncedSearchIcon])

    const handleUpdate = async () => {
        if (!editingCategory) return

        const payload = editingDraft || editingCategory

        // Validate name and slug before sending
        const invalidName = !payload.name || /[\/\*\-\s]/.test(payload.name)
        const slugValid = payload.slug && /^[a-z0-9_]+$/.test(payload.slug)

        if (invalidName) {
            showAlert('ชื่อหมวดหมู่ไม่สามารถเว้นว่างหรือมีอักขระ / * - หรือช่องว่างได้', 'error')
            return
        }
        if (!slugValid) {
            showAlert('ช่องอังกฤษ (slug) ต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือ underscore เท่านั้น', 'error')
            return
        }

        try {
            setSaving(true)
            const res = await fetch(`http://localhost:5000/api/category/${payload.category_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errText = await res.text().catch(() => '')
                console.error('Update failed', res.status, errText)
                showAlert(`บันทึกไม่สำเร็จ (status ${res.status})`, 'error')
                return
            }

            // Refresh list and close modal
            await fetchCategories()
            setEditingCategory(null)
            setEditingDraft(null)
            setSearchIcon('')
            setDebouncedSearchIcon('')
            showAlert('บันทึกข้อมูลเรียบร้อย', 'success')

        } catch (error) {
            console.error('Update error:', error)
            showAlert('เกิดข้อผิดพลาดขณะบันทึก', 'error')
        } finally {
            setSaving(false)
        }
    }

    // ==================== Draft State Handlers ====================

    const updateDraft = useCallback((updates) => {
        setEditingDraft(prev => ({ ...prev, ...updates }))
    }, [])

    const handleSelectIcon = useCallback((iconName) => {
        updateDraft({ icon: iconName })
    }, [updateDraft])

    const handleSelectColor = useCallback((color) => {
        updateDraft({ color })
    }, [updateDraft])

    const handleChangeName = useCallback((name) => {
        updateDraft({ name })
    }, [updateDraft])

    const handleChangeSlug = useCallback((slug) => {
        updateDraft({ slug })
    }, [updateDraft])

    // Initialize create draft when parent opens create modal
    useEffect(() => {
        if (openCreate) {
            setEditingCategory(null)
            setEditingDraft({
                name: '',
                slug: '',
                icon: COMMON_ICONS[0] || 'MessageSquare',
                color: COLOR_PALETTE[0] || '#EF4444'
            })
            setSearchIcon('')
            setDebouncedSearchIcon('')
        }
    }, [openCreate])

    // Filter categories by search term
    const filteredCategories = useMemo(() => {
        if (!globalSearch.trim()) {
            return categories
        }
        const searchLower = globalSearch.toLowerCase()
        return categories.filter(cat =>
            (cat.name && cat.name.toLowerCase().includes(searchLower)) ||
            (cat.slug && cat.slug.toLowerCase().includes(searchLower))
        )
    }, [categories, globalSearch])

    // ==================== Render ====================

    return (
        <div className="categories-tab">
            <div className="content-area">
                {loading && <div className="categories-tab-loading">กำลังโหลด...</div>}
                {!loading && categories.length === 0 && <div className="categories-tab-empty">ไม่มีข้อมูล</div>}
                {!loading && filteredCategories.length === 0 && categories.length > 0 && <div className="categories-tab-empty">ไม่พบผลลัพธ์ที่ตรงกับการค้นหา</div>}
                {!loading && filteredCategories.length > 0 && (
                    <>
                        <div className="categories-wrapper">
                            <table className="categories-table">
                                <thead>
                                    <tr>
                                        <th>หมวดหมู่</th>
                                        <th>ไอคอน</th>
                                        <th>อังกฤษ</th>
                                        <th>สี</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCategories.map(category => (
                                        <tr key={category.category_id}>
                                            <td>
                                                <div className="name-cell">
                                                    {category.name}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="icon-cell">
                                                    <div
                                                        className="category-color-box"
                                                        style={{ backgroundColor: category.color || "#ccc" }}
                                                    >
                                                        <DynamicIcon
                                                            name={category.icon || "MessageSquare"}
                                                            size={18}
                                                            color="white"
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{category.slug}</td>

                                            <td>
                                                <div className="color-cell">
                                                    <div
                                                        className="color-box"
                                                        style={{ backgroundColor: category.color || "#ccc" }}
                                                    />
                                                    <span>{category.color}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="btn-edit"
                                                        title="แก้ไข"
                                                        onClick={() => {
                                                            setEditingCategory(category)
                                                            setEditingDraft(category)
                                                        }}
                                                    >
                                                        <DynamicIcon name="Edit2" size={18} />
                                                    </button>
                                                    <button 
                                                        className="btn-delete" 
                                                        title="ลบ"
                                                        onClick={() => handleDeleteCategory(category.category_id, category.name)}
                                                        disabled={saving}
                                                    >
                                                        <DynamicIcon name="Trash2" size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>

                        {/* Pagination placed inside content-area so it stays next to the table */}
                        <div className="admin-pagination">
                            <nav className="pagination-wrapper">
                                <ul className="pagination">
                                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(prev => prev - 1)}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </button>
                                    </li>

                                    <li className="page-item active">
                                        <span className="page-link">{page}</span>
                                    </li>

                                    <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(prev => prev + 1)}
                                            disabled={page >= totalPages}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </>
                )}

            </div>

            {
                (editingCategory || openCreate) && (
                    <div className="modal-overlay">
                        <div className="modal-content modal-lg">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}>{editingCategory ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}</h3>
                                <button
                                    onClick={() => {
                                        setEditingCategory(null)
                                        setEditingDraft(null)
                                        setSearchIcon('')
                                        setDebouncedSearchIcon('')
                                        if (setOpenCreate) setOpenCreate(false)
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        padding: '0',
                                        color: '#666',
                                        lineHeight: '1'
                                    }}
                                    title="ปิด"
                                >
                                    ✕
                                </button>
                            </div>

                            <label>ชื่อหมวดหมู่</label>
                            <input
                                type="text"
                                value={editingDraft?.name || ''}
                                onChange={(e) => handleChangeName(e.target.value)}
                                placeholder="ชื่อหมวดหมู่"
                                style={{ marginBottom: '12px' }}
                            />

                            <label>อังกฤษ (slug)</label>
                            <input
                                type="text"
                                value={editingDraft?.slug || ''}
                                onChange={(e) => handleChangeSlug(e.target.value)}
                                placeholder="ชื่ออังกฤษ(เช่น music, movies)..."
                                style={{ marginBottom: '20px' }}
                            />

                            <label>ไอคอน(~1400+ ไอคอนฟรี)</label>
                            <input
                                type="text"
                                className="icon-search-input"
                                value={searchIcon}
                                onChange={(e) => setSearchIcon(e.target.value)}
                                placeholder="ค้นหาไอคอน เช่น heart, star, home..."
                            />

                            <div className="icon-picker-grid">
                                {filteredIcons.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#999' }}>
                                        ไม่พบไอคอน
                                    </div>
                                ) : (
                                    filteredIcons.map(iconName => (
                                        <IconButton
                                            key={iconName}
                                            iconName={iconName}
                                            isSelected={editingDraft?.icon === iconName}
                                            onSelect={() => handleSelectIcon(iconName)}
                                        />
                                    ))

                                )}
                            </div>

                            {editingDraft?.icon && (
                                <div className="selected-icon-box">
                                    ไอคอนที่เลือก:
                                    <strong className="selected-icon-name">
                                        {editingDraft.icon}
                                    </strong>
                                </div>
                            )}

                            <label style={{ marginTop: '20px' }}>สี</label>
                            <div className="color-picker-grid">
                                {COLOR_PALETTE.map(color => (
                                    <ColorOption
                                        key={color}
                                        color={color}
                                        isSelected={editingDraft?.color === color}
                                        onSelect={() => handleSelectColor(color)}
                                    />
                                ))}
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                <label>หรือเลือกสีที่กำหนดเอง</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                    <ColorPicker initial={editingDraft?.color} onCommit={handleSelectColor} debounceMs={180} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button onClick={() => {
                                    setEditingCategory(null)
                                    setEditingDraft(null)
                                    setSearchIcon('')
                                    setDebouncedSearchIcon('')
                                    if (setOpenCreate) setOpenCreate(false)
                                }}>
                                    ยกเลิก
                                </button>

                                {editingCategory ? (
                                    <button onClick={handleUpdate} disabled={saving}>
                                        {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                                    </button>
                                ) : (
                                    <button onClick={async () => {
                                        // create
                                        if (!editingDraft) return

                                        // Validation before create
                                        const name = (editingDraft.name || '').trim()
                                        const slug = (editingDraft.slug || '').trim()
                                        const icon = editingDraft.icon
                                        const color = editingDraft.color

                                        if (!name || /[\/\*\-\s]/.test(name)) {
                                            showAlert('ชื่อหมวดหมู่ไม่สามารถเว้นว่างหรือมีอักขระ / * - หรือช่องว่างได้', 'error')
                                            return
                                        }

                                        if (!slug || !/^[a-z0-9_]+$/.test(slug)) {
                                            showAlert('ช่องอังกฤษ (slug) ต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือ underscore เท่านั้น (ห้ามเว้นว่างหรือมีช่องว่าง/อักขระพิเศษ)', 'error')
                                            return
                                        }

                                        if (!icon) {
                                            showAlert('กรุณาเลือกไอคอน', 'error')
                                            return
                                        }

                                        if (!color) {
                                            showAlert('กรุณาเลือกสี', 'error')
                                            return
                                        }
                                        try {
                                            setSaving(true)
                                            const res = await fetch('http://localhost:5000/api/category', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(editingDraft)
                                            })
                                            if (!res.ok) {
                                                const txt = await res.text().catch(() => '')
                                                console.error('Create failed', res.status, txt)
                                                showAlert(`สร้างไม่สำเร็จ (status ${res.status})`, 'error')
                                                return
                                            }
                                            await fetchCategories()
                                            setEditingDraft(null)
                                            if (setOpenCreate) setOpenCreate(false)
                                            showAlert('สร้างหมวดหมู่เรียบร้อย', 'success')
                                        } catch (err) {
                                            console.error('Create error', err)
                                            showAlert('เกิดข้อผิดพลาดขณะสร้าง', 'error')
                                        } finally {
                                            setSaving(false)
                                        }
                                    }} disabled={saving}>
                                        {saving ? 'กำลังสร้าง...' : 'สร้างหมวดหมู่'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Dialog Modal */}
            {confirmDialog.isOpen && (
                <div className="confirm-overlay">
                    <div className="confirm-modal">
                        <div className="confirm-header">
                            <h3>ยืนยัน</h3>
                        </div>
                        <div className="confirm-body">
                            <p>{confirmDialog.message}</p>
                        </div>
                        <div className="confirm-footer">
                            <button 
                                className="confirm-btn confirm-btn-cancel"
                                onClick={confirmDialog.onCancel}
                            >
                                ยกเลิก
                            </button>
                            <button 
                                className="confirm-btn confirm-btn-confirm"
                                onClick={() => {
                                    confirmDialog.onConfirm()
                                    confirmDialog.onCancel()
                                }}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}
