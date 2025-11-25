import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MovieDetails from './pages/MovieDetails'
import Profile from './pages/Profile'
import { authApi, directoriesApi, profileApi, userMoviesApi } from './api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userMovies, setUserMovies] = useState([])
  const [statuses, setStatuses] = useState([])
  const [appReady, setAppReady] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      const existing = document.documentElement.dataset.theme
      if (existing === 'dark' || existing === 'light') {
        return existing
      }
      document.documentElement.dataset.theme = 'dark'
    }
    return 'dark'
  })

  const applyTheme = useCallback(
    (nextTheme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = nextTheme
      }
    },
    []
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const loadStatuses = useCallback(async () => {
    try {
      const list = await directoriesApi.getStatuses()
      setStatuses(list || [])
    } catch (error) {
      console.warn('Не удалось загрузить статусы', error)
    }
  }, [])

  const loadUserMovies = useCallback(async () => {
    try {
      const items = await userMoviesApi.getUserMovies()
      setUserMovies(items || [])
    } catch (error) {
      if (error.status === 401) {
        setUserMovies([])
      } else {
        console.warn('Не удалось получить списки пользователя', error)
      }
    }
  }, [])

  const loadProfile = useCallback(async () => {
    try {
      const profile = await profileApi.getProfile()
      setUser(profile)
      await loadUserMovies()
    } catch (error) {
      if (error.status === 401) {
        setUser(null)
        setUserMovies([])
      } else {
        console.warn('Не удалось загрузить профиль', error)
      }
    }
  }, [loadUserMovies])

  useEffect(() => {
    const bootstrap = async () => {
      await loadStatuses()
      await loadProfile()
      setAppReady(true)
    }
    bootstrap()
  }, [loadProfile, loadStatuses])

  const handleLogin = async (credentials) => {
    await authApi.login(credentials)
    await loadProfile()
  }

  const handleRegister = async (payload) => {
    await authApi.register(payload)
    await loadProfile()
  }

  const handleLogout = async () => {
    await authApi.logout()
    setUser(null)
    setUserMovies([])
  }

  const handleUpdateDescription = async (payload) => {
    const updated = await profileApi.updateDescription(payload)
    setUser(updated)
  }

  const handleAvatarUpload = async (file) => {
    const updated = await profileApi.uploadAvatar(file)
    setUser(updated)
  }

  const handleAddToList = async ({ movieId, statusId, comment }) => {
    await userMoviesApi.addOrUpdate({ movieId, statusId, comment })
    await loadUserMovies()
  }

  const handleRemoveFromList = async (movieId) => {
    await userMoviesApi.remove(movieId)
    await loadUserMovies()
  }

  const handleRateMovie = async ({ movieId, score, comment }) => {
    await userMoviesApi.rate({ movieId, score, comment })
    await loadUserMovies()
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <BrowserRouter>
      <div className="app-background">
        {!appReady ? (
          <div className="app-loading">Загрузка приложения...</div>
        ) : (
          <Routes>
            <Route
            element={<AppLayout user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />}
            >
              <Route index element={<Home user={user} />} />
              <Route path="login" element={<Login onLogin={handleLogin} />} />
              <Route path="register" element={<Register onRegister={handleRegister} />} />
              <Route
                path="movies/:id"
                element={
                  <MovieDetails
                    user={user}
                    statuses={statuses}
                    userMovies={userMovies}
                    onAddToList={handleAddToList}
                    onRemoveFromList={handleRemoveFromList}
                    onRateMovie={handleRateMovie}
                  />
                }
              />
              <Route
                path="profile"
                element={
                  <Profile
                    user={user}
                    statuses={statuses}
                    userMovies={userMovies}
                    onUpdateDescription={handleUpdateDescription}
                    onUploadAvatar={handleAvatarUpload}
                    onAddToList={handleAddToList}
                    onRemoveFromList={handleRemoveFromList}
                    onRateMovie={handleRateMovie}
                  />
                }
              />
              <Route path="*" element={<Home user={user} />} />
            </Route>
          </Routes>
        )}
      </div>
    </BrowserRouter>
  )
}

export default App
