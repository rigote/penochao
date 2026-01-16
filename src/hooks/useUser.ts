import useSWR from 'swr'
import { useSession } from 'next-auth/react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface User {
  id: string
  name: string
  email: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export function useUser() {
  const { data: session } = useSession()
  const { data, error, isLoading } = useSWR<User>(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher
  )

  return {
    user: data,
    isLoading,
    isError: error,
  }
}
