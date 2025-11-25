import request from './client'

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, item)
        }
      })
      return
    }

    if (value === '') {
      return
    }

    searchParams.append(key, value)
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const authApi = {
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  checkAuth: () => request('/api/auth/check-auth')
}

export const profileApi = {
  getProfile: () => request('/api/user/profile'),
  updateDescription: (payload) => request('/api/user/profile/description', { method: 'PUT', body: payload }),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return request('/api/user/profile/avatar', { method: 'POST', body: formData })
  }
}

export const moviesApi = {
  getMovies: (params) => request(`/api/movies${buildQueryString(params)}`),
  getMovie: (id) => request(`/api/movies/${id}`),
  getRandomMovie: () => request('/api/movies/random')
}

export const recommendationsApi = {
  getMovieRecommendations: () => request('/api/recommendations/movies')
}

export const directoriesApi = {
  getStatuses: () => request('/api/statuses'),
  getGenres: () => request('/api/genres'),
  getTags: () => request('/api/tags'),
  getCountries: () => request('/api/countries')
}

export const userMoviesApi = {
  getUserMovies: () => request('/api/user/movies'),
  addOrUpdate: (payload) => request('/api/user/movies', { method: 'POST', body: payload }),
  rate: (payload) => request('/api/user/movies/rate', { method: 'POST', body: payload }),
  remove: (movieId) => request(`/api/user/movies/${movieId}`, { method: 'DELETE' })
}



