'use client'
import { useAuth } from '@/app/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CreatePostPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/')
  }, [user])

  if (!user) return null

  return <div>ฟอร์มสร้างกระทู้</div>
}
