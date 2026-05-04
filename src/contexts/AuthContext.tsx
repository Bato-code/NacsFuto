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
  signUp: (email: string, password: string, name: string, matricNumber: string, username?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // Read from `users` table first — no recursive RLS, never causes 500 errors.
      // Map role === 'admin' → is_admin so AdminRoute in App.tsx keeps working.
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, matric_number, role')
        .eq('id', userId)
        .maybeSingle()

      if (!userError && userData) {
        setProfile({
          id: userData.id,
          matric_number: userData.matric_number ?? '',
          name: userData.name,
          is_admin: userData.role === 'admin',
        })
        setLoading(false)
        return
      }

      // Fallback: try profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, matric_number, is_admin')
        .eq('id', userId)
        .maybeSingle()

      setProfile(profileData ?? null)
    } catch (err) {
      console.error('fetchProfile error:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    matricNumber: string,
    username?: string
  ) => {
    // The database trigger `handle_new_user` now automatically inserts into
    // both `profiles` and `users` tables when a new auth user is created.
    // No manual inserts needed here — removing them eliminates the 401 errors
    // that occurred because the anon role lacked INSERT permission on those tables.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          matric_number: matricNumber,
          username: username?.trim().toLowerCase() || null,
        }
      }
    })

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signOut,
      isAdmin: profile?.is_admin === true,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
