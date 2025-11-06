import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Register = ({ onRegister }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.password !== form.confirm) {
      setError('Пароли не совпадают')
      return
    }
    setIsSubmitting(true)
    console.log('[Auth] Sending registration request', {
      endpoint: '/api/register',
      payload: { name: form.name, email: form.email }
    })

    setTimeout(() => {
      setIsSubmitting(false)
      const newProfile = {
        name: form.name.trim() || 'Киноман',
        email: form.email
      }
      console.log('[Auth] Registration response received', { endpoint: '/api/register', profile: newProfile })
      onRegister?.(newProfile)
      navigate('/')
    }, 1000)
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Регистрация</h2>
          <p>Создайте аккаунт, чтобы сохранять подборки, получать рекомендации и смотреть без рекламы.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Имя
            <input
              required
              name="name"
              placeholder="Как к вам обращаться?"
              value={form.name}
              onChange={handleChange}
            />
          </label>
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
              placeholder="Не менее 6 символов"
              value={form.password}
              onChange={handleChange}
              minLength={6}
            />
          </label>
          <label>
            Повторите пароль
            <input
              required
              type="password"
              name="confirm"
              placeholder="Повторите пароль"
              value={form.confirm}
              onChange={handleChange}
              minLength={6}
            />
          </label>
          {error && <span className="auth-error">{error}</span>}
          <button type="submit" className="primary-action" disabled={isSubmitting}>
            {isSubmitting ? 'Создаем профиль...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="auth-footer">
          <span>Уже с нами?</span>
          <Link to="/login">Войти</Link>
        </div>
      </div>
      <div className="auth-visual" aria-hidden>
        <div className="auth-visual-glow" />
        <p>
          Получайте персональные рекомендации и коллекции.
          <br />
          <span>Настройте коллекции фильмов под себя.</span>
        </p>
      </div>
    </section>
  )
}

export default Register

