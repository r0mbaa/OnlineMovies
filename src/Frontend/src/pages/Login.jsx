import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('Проверяем данные...')
    console.log('[Auth] Sending login request', { endpoint: '/api/login', payload: form })

    setTimeout(() => {
      setIsSubmitting(false)
      const authProfile = {
        name: form.email.split('@')[0] || 'Пользователь',
        email: form.email
      }
      console.log('[Auth] Login response received', { endpoint: '/api/login', profile: authProfile })
      onLogin?.(authProfile)
      setFeedback('Добро пожаловать обратно!')
      navigate('/')
    }, 900)
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Войти</h2>
          <p>Возвращайтесь к вашим спискам избранного и смотрите без ограничений.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Электронная почта
            <input
              required
              type="email"
              name="email"
              placeholder="example@mail.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Пароль
            <input
              required
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              minLength={6}
            />
          </label>
          <button type="submit" className="primary-action" disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
          {feedback && <span className="auth-feedback">{feedback}</span>}
        </form>
        <div className="auth-footer">
          <span>Нет аккаунта?</span>
          <Link to="/register">Создать</Link>
        </div>
      </div>
      <div className="auth-visual" aria-hidden>
        <div className="auth-visual-glow" />
        <p>
          «Кино — это мечта, в которую можно войти».<br />
          <span>— Кристофер Нолан</span>
        </p>
      </div>
    </section>
  )
}

export default Login

