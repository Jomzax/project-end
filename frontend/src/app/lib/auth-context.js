'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

const SESSION_KEY = 'auth_session'
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

export function AuthProvider({ children }) {

  // undefined = ยังโหลด
  // null = guest
  // object = login
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY)

    if (!raw) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const session = JSON.parse(raw)

      if (Date.now() > session.expireAt) {
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
      } else {
        setUser(session.user)
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
      setUser(null)
    }

    setLoading(false)
  }, [])

  const login = (userData) => {
    const session = {
      user: userData,
      expireAt: Date.now() + THIRTY_DAYS,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
