'use client'

import { useState, useEffect } from 'react'
import Header from '@/app/components/layout/Header'
import Sidebar from '@/app/components/layout/Sidebar'

export default function ForumLayout({ children }) {

  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)

  // 🔥 ดึงหมวดหมู่จาก backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/category/dropdown")
        const json = await res.json()

        if (json.success) {
          setCategories(json.data)
        }
      } catch (err) {
        console.error("โหลดหมวดหมู่ไม่สำเร็จ", err)
      }
    }

    fetchCategories()
  }, [])

  return (
    <>
      <Header />

      <main className="container-fluid px-3 px-md-4 mt-4">
        <div className="row g-4">
          <div className="col-lg-3 d-none d-lg-block">
            <Sidebar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>

          <div className="col-12 col-lg-9">
            {children}
          </div>
        </div>
      </main>


      {/* ===== Mobile Offcanvas Sidebar ===== */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileSidebarLabel">
            หมวดหมู่
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>

        <div className="offcanvas-body p-0">
          <div className="p-3">
            <Sidebar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        </div>
      </div>
    </>
  )
}
