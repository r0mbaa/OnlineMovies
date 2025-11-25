import request from './client'

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
  getMovies: () => request('/api/movies'),
  getMovie: (id) => request(`/api/movies/${id}`),
  getRandomMovie: () => request('/api/movies/random')
}

export const recommendationsApi = {
  getMovieRecommendations: () => request('/api/recommendations/movies')
}

export const directoriesApi = {
  getStatuses: () => request('/api/statuses')
}

export const userMoviesApi = {
  getUserMovies: () => request('/api/user/movies'),
  addOrUpdate: (payload) => request('/api/user/movies', { method: 'POST', body: payload }),
  rate: (payload) => request('/api/user/movies/rate', { method: 'POST', body: payload }),
  remove: (movieId) => request(`/api/user/movies/${movieId}`, { method: 'DELETE' })
}



