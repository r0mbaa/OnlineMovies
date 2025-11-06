import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MovieDetails from './pages/MovieDetails'
import Profile from './pages/Profile'
import './App.css'

const createEmptyLists = () => ({
  watched: [],
  watchLater: [],
  rated: []
})

const mockLists = {
  watched: [1, 3, 5],
  watchLater: [2, 4],
  rated: [6]
}

const listKeys = Object.keys(mockLists)

function App() {
  const [user, setUser] = useState(null)
  const [userLists, setUserLists] = useState(createEmptyLists)
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

  const cloneMockLists = () => ({
    watched: [...mockLists.watched],
    watchLater: [...mockLists.watchLater],
    rated: [...mockLists.rated]
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme
    }
  }, [theme])

  const handleLogin = (authData) => {
    console.log('[Auth] Login successful, synchronizing profile data', authData)
    setUser(authData)
    setUserLists(cloneMockLists())
  }

  const handleRegister = (newUser) => {
    console.log('[Auth] Registration completed, initializing profile', newUser)
    setUser(newUser)
    setUserLists(cloneMockLists())
  }

  const handleLogout = () => {
    console.log('[Auth] Logout request to /api/logout')
    setUser(null)
    setUserLists(createEmptyLists())
  }

  const handleUpdateUser = (updates) => {
    console.log('[Profile] Sending profile update to /api/profile', updates)
    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  const handleAddToList = (listKey, movieId) => {
    if (!listKeys.includes(listKey)) {
      console.warn('[Lists] Unknown list key, skipping add', { listKey, movieId })
      return
    }
    console.log('[Lists] Adding movie to list', { endpoint: `/api/lists/${listKey}`, movieId })
    setUserLists((prev) => {
      if (!prev[listKey]?.includes(movieId)) {
        return {
          ...prev,
          [listKey]: [...(prev[listKey] || []), movieId]
        }
      }
      return prev
    })
  }

  const handleRemoveFromList = (listKey, movieId) => {
    if (!listKeys.includes(listKey)) {
      console.warn('[Lists] Unknown list key, skipping removal', { listKey, movieId })
      return
    }
    console.log('[Lists] Removing movie from list', { endpoint: `/api/lists/${listKey}/${movieId}`, movieId })
    setUserLists((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] || []).filter((id) => id !== movieId)
    }))
  }

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      console.log('[UI] Theme toggle requested', { from: prev, to: next })
      return next
    })
  }

  return (
    <BrowserRouter>
      <div className="app-background">
        <Routes>
          <Route
            element={
              <AppLayout user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
            }
          >
            <Route index element={<Home user={user} />} />
            <Route path="login" element={<Login onLogin={handleLogin} />} />
            <Route path="register" element={<Register onRegister={handleRegister} />} />
            <Route
              path="movies/:id"
              element={
                <MovieDetails
                  user={user}
                  userLists={userLists}
                  onAddToList={handleAddToList}
                  onRemoveFromList={handleRemoveFromList}
                />
              }
            />
            <Route
              path="profile"
              element={
                <Profile
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  userLists={userLists}
                  onAddToList={handleAddToList}
                  onRemoveFromList={handleRemoveFromList}
                />
              }
            />
            <Route path="*" element={<Home user={user} />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
