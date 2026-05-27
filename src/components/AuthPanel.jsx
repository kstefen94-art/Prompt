import { useState } from 'react'

export default function AuthPanel({ auth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!auth.enabled) {
    return (
      <p className="hint">
        로그인 기능을 쓰려면 Supabase 환경변수(<code>VITE_SUPABASE_URL</code>,{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>)를 설정하세요.
      </p>
    )
  }

  if (auth.user) {
    return (
      <div className="auth-box">
        <p className="profile-bio">
          <strong>{auth.user.email}</strong> 으로 로그인됨
          <br />
          이제 갤러리에서 작품을 추가/삭제할 수 있어요.
        </p>
        <button className="builder-btn" onClick={() => auth.signOut()}>
          로그아웃
        </button>
      </div>
    )
  }

  async function run(kind) {
    setBusy(true)
    setMsg('')
    const fn = kind === 'in' ? auth.signIn : auth.signUp
    const { error } = await fn(email, password)
    if (error) setMsg(error.message)
    else if (kind === 'up') setMsg('가입 완료! 이메일 인증이 필요할 수 있어요. 그 후 로그인하세요.')
    setBusy(false)
  }

  return (
    <div className="auth-box">
      <div className="field">
        <label>이메일</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" />
      </div>
      <div className="field">
        <label>비밀번호</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="••••••••"
        />
      </div>
      {msg && <p className="error-text">{msg}</p>}
      <div className="gen-actions" style={{ display: 'flex', gap: 10 }}>
        <button className="builder-btn" style={{ flex: 1 }} disabled={busy} onClick={() => run('in')}>
          로그인
        </button>
        <button className="example-toggle" disabled={busy} onClick={() => run('up')}>
          회원가입
        </button>
      </div>
    </div>
  )
}
