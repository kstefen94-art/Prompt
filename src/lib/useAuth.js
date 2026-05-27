import { useEffect, useState } from 'react'
import { supabase, supabaseEnabled } from './supabase.js'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!supabaseEnabled)

  useEffect(() => {
    if (!supabaseEnabled) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return {
    enabled: supabaseEnabled,
    ready,
    session,
    user: session?.user || null,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }
}
