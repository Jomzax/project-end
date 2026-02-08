'use client'

import Header from '@/app/components/layout/Header'
import Sidebar from '@/app/components/layout/Sidebar'

export default function ForumLayout({ children }) {
  return (
    <>
      <Header />

      <main className="container-fluid px-3 px-md-4 mt-4">
        <div className="row g-4">
          <div className="col-lg-3 d-none d-lg-block">
            <Sidebar />
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
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  )
}
