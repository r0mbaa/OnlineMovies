import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('Проверяем данные...')
    setError('')
    try {
      await onLogin?.(form)
      setStatus('Добро пожаловать!')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Не удалось войти. Попробуйте снова.')
      setStatus('')
    } finally {
      setIsSubmitting(false)
    }
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
            Имя пользователя
            <input
              required
              name="username"
              placeholder="Ваш никнейм"
              value={form.username}
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
          {status && <span className="auth-feedback">{status}</span>}
          {error && <span className="auth-error">{error}</span>}
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

