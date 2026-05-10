import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  matric_number: string
  name: string
  is_admin: boolean | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string, matricNumber: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] fetchProfile error:', error.message, error.code)
        setProfile(null)
      } else {
        console.log('[AuthContext] profile loaded:', data)
        setProfile(data)
      }
    } catch (err) {
      console.error('[AuthContext] fetchProfile exception:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      console.log('[AuthContext] auth state change:', _event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true) // reset loading while we fetch the new profile
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, name: string, matricNumber: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, matric_number: matricNumber } }
    })
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        matric_number: matricNumber,
        name,
        is_admin: false
      })
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        matric_number: matricNumber,
        role: 'student'
      })
    }
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  console.log('[AuthContext] render — loading:', loading, '| user:', user?.id, '| is_admin:', profile?.is_admin)

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signOut,
      isAdmin: profile?.is_admin === true
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
