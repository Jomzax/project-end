'use client'
import { useAuth } from '@/app/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CreatePostPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [loading, user])

  if (loading) return <div>Loading...</div>
  if (!user) return null


  return <div>ฟอร์มสร้างกระทู้</div>
}
