import { useState } from 'react'
import { loginUser, registerUser } from '../../services/api'

export function LoginPage({ onLogin }) {
  const [mode, setMode]       = useState('login')      // 'login' or 'register'
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let user
      if (isRegister) {
        user = await registerUser({ name, email, password })
      } else {
        user = await loginUser({ email, password })
      }
      localStorage.setItem('wqm_user', JSON.stringify(user))
      onLogin(user)
    } catch (err) {
      const msg = err?.response?.data
      setError(typeof msg === 'string' ? msg : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-[#0f0e17] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all'

  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="text-5xl">💧</span>
          <h1 className="text-white font-bold text-xl">WaterQM</h1>
          <p className="text-slate-400 text-sm">Water Quality Monitor</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1830]/80 border border-indigo-900/30 rounded-2xl shadow-2xl p-8">

          {/* Title */}
          <h2 className="text-white font-semibold text-lg mb-1">
            {isRegister ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isRegister ? 'Register to access the dashboard' : 'Sign in to your account'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username — only for register */}
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                <input
                  type="text"
                  placeholder="e.g. john_doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={isRegister}
                  className={inputCls}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors mt-2"
            >
              {loading
                ? (isRegister ? 'Creating account…' : 'Signing in…')
                : (isRegister ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          {/* Toggle login / register */}
          <p className="text-center text-slate-500 text-sm mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              onClick={() => { setMode(isRegister ? 'login' : 'register'); setError('') }}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
