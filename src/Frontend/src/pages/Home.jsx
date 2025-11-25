import { useCallback, useEffect, useState } from 'react'
import MovieCard from '../components/MovieCard'
import { directoriesApi, moviesApi, recommendationsApi } from '../api'

const createDefaultFilters = () => ({
  title: '',
  genreIds: [],
  tagIds: [],
  countryIds: [],
  releaseYearFrom: '',
  releaseYearTo: '',
  durationFrom: '',
  durationTo: '',
  sortBy: 'title',
  sortDirection: 'asc'
})

const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'releaseYear', label: 'По году выхода' },
  { value: 'duration', label: 'По длительности' }
]

const directionOptions = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' }
]

const Home = ({ user }) => {
  const [filters, setFilters] = useState(() => createDefaultFilters())
  const [movies, setMovies] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [referenceError, setReferenceError] = useState('')
  const [referenceData, setReferenceData] = useState({ genres: [], tags: [], countries: [] })
  const [recommendations, setRecommendations] = useState([])
  const [recommendationsError, setRecommendationsError] = useState('')

  const loadReferenceData = useCallback(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setReferenceLoading(true)
        setReferenceError('')
        const [genres = [], tags = [], countries = []] = await Promise.all([
          directoriesApi.getGenres(),
          directoriesApi.getTags(),
          directoriesApi.getCountries()
        ])

        if (!isMounted) {
          return
        }

        setReferenceData({
          genres: [...genres].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
          tags: [...tags].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
          countries: [...countries].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        })
      } catch (err) {
        if (isMounted) {
          setReferenceError(err.message || 'Не удалось получить фильтры')
          setReferenceData({ genres: [], tags: [], countries: [] })
        }
      } finally {
        if (isMounted) {
          setReferenceLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const cleanup = loadReferenceData()
    return () => {
      cleanup?.()
    }
  }, [loadReferenceData])

  const buildSearchPayload = useCallback((state) => {
    const payload = {}
    const title = state.title.trim()
    if (title) {
      payload.Title = title
    }

    if (state.genreIds.length) {
      payload.GenreIds = state.genreIds
    }

    if (state.tagIds.length) {
      payload.TagIds = state.tagIds
    }

    if (state.countryIds.length) {
      payload.CountryIds = state.countryIds
    }

    const toNullableNumber = (value) => {
      if (value === '' || value === null || value === undefined) {
        return null
      }
      const parsed = Number(value)
      return Number.isNaN(parsed) ? null : parsed
    }

    const releaseYearFrom = toNullableNumber(state.releaseYearFrom)
    const releaseYearTo = toNullableNumber(state.releaseYearTo)
    const durationFrom = toNullableNumber(state.durationFrom)
    const durationTo = toNullableNumber(state.durationTo)

    if (releaseYearFrom !== null) {
      payload.ReleaseYearFrom = releaseYearFrom
    }

    if (releaseYearTo !== null) {
      payload.ReleaseYearTo = releaseYearTo
    }

    if (durationFrom !== null) {
      payload.DurationFrom = durationFrom
    }

    if (durationTo !== null) {
      payload.DurationTo = durationTo
    }

    payload.SortBy = state.sortBy
    payload.SortDirection = state.sortDirection

    return payload
  }, [])

  const runSearch = useCallback(
    async (state) => {
      try {
        setSearchLoading(true)
        setSearchError('')
        const payload = buildSearchPayload(state)
        const list = await moviesApi.getMovies(payload)
        setMovies(list || [])
      } catch (err) {
        setMovies([])
        setSearchError(err.message || 'Не удалось выполнить поиск')
      } finally {
        setSearchLoading(false)
      }
    },
    [buildSearchPayload]
  )

  useEffect(() => {
    runSearch(createDefaultFilters())
  }, [runSearch])
  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleChipToggle = (field, value) => {
    const numericValue = Number(value)
    setFilters((prev) => {
      const exists = prev[field].includes(numericValue)
      return {
        ...prev,
        [field]: exists ? prev[field].filter((id) => id !== numericValue) : [...prev[field], numericValue]
      }
    })
  }

  const handleChipClear = (field) => {
    setFilters((prev) => ({ ...prev, [field]: [] }))
  }

  const handleSearch = (event) => {
    event?.preventDefault()
    runSearch(filters)
  }

  const handleReset = () => {
    const reset = createDefaultFilters()
    setFilters(reset)
    runSearch(reset)
  }

  useEffect(() => {
    if (!user) {
      setRecommendations([])
      setRecommendationsError('')
      return
    }

    let isMounted = true

    const loadRecommendations = async () => {
      try {
        setRecommendationsError('')
        const data = await recommendationsApi.getMovieRecommendations()
        if (isMounted) {
          setRecommendations(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setRecommendations([])
          setRecommendationsError(err.message || 'Не удалось получить рекомендации')
        }
      }
    }

    loadRecommendations()
    return () => {
      isMounted = false
    }
  }, [user])

  const ChipGroup = ({ label, options, field, idKey }) => (
    <div className="filter-group">
      <div className="filter-label-row">
        <span>{label}</span>
        {filters[field].length > 0 && (
          <button type="button" className="chip-clear" onClick={() => handleChipClear(field)}>
            Очистить
          </button>
        )}
      </div>
      {referenceLoading ? (
        <p className="filter-placeholder">Загружаем...</p>
      ) : options.length === 0 ? (
        <p className="filter-placeholder">Недоступно</p>
      ) : (
        <div className="filter-chips">
          {options.map((option) => {
            const id = Number(option[idKey])
            const isActive = filters[field].includes(id)
            return (
              <button
                type="button"
                key={id}
                className={`filter-chip${isActive ? ' active' : ''}`}
                onClick={() => handleChipToggle(field, id)}
              >
                {option.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="home-page">
      <section className="search-section">
        <div className="search-panel">
          <div className="search-header">
            <p className="search-kicker">Расширенный поиск</p>
            <h1>Соберите идеальный список фильмов</h1>
            <p>Комбинируйте фильтры по названию, странам, жанрам, тегам и длительности, а сортировка поможет выстроить выдачу.</p>
          </div>
          {referenceError && <p className="error-text">{referenceError}</p>}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-grid">
              <label className="filter-group">
                <span>Название</span>
                <input type="text" name="title" placeholder="Например, Интерстеллар" value={filters.title} onChange={handleInputChange} />
              </label>
              <label className="filter-group">
                <span>Год релиза</span>
                <div className="range-inputs">
                  <input type="number" name="releaseYearFrom" placeholder="От" value={filters.releaseYearFrom} onChange={handleInputChange} />
                  <input type="number" name="releaseYearTo" placeholder="До" value={filters.releaseYearTo} onChange={handleInputChange} />
                </div>
              </label>
              <label className="filter-group">
                <span>Длительность (мин.)</span>
                <div className="range-inputs">
                  <input type="number" name="durationFrom" placeholder="От" value={filters.durationFrom} onChange={handleInputChange} />
                  <input type="number" name="durationTo" placeholder="До" value={filters.durationTo} onChange={handleInputChange} />
                </div>
              </label>
              <label className="filter-group">
                <span>Сортировка</span>
                <select name="sortBy" value={filters.sortBy} onChange={handleInputChange}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-group">
                <span>Направление</span>
                <select name="sortDirection" value={filters.sortDirection} onChange={handleInputChange}>
                  {directionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ChipGroup label="Жанры" options={referenceData.genres} field="genreIds" idKey="genreId" />
            <ChipGroup label="Теги" options={referenceData.tags} field="tagIds" idKey="tagId" />
            <ChipGroup label="Страны" options={referenceData.countries} field="countryIds" idKey="countryId" />
            <div className="filter-actions">
              <button type="submit" className="primary-action" disabled={searchLoading}>
                {searchLoading ? 'Ищем...' : 'Применить фильтры'}
              </button>
              <button type="button" className="ghost-action" onClick={handleReset} disabled={searchLoading}>
                Сбросить
              </button>
              {searchError && <p className="error-text">{searchError}</p>}
            </div>
          </form>
        </div>
      </section>

      <section className="movies-section">
        <div className="section-header">
          <h2>Результаты поиска</h2>
          {movies.length > 0 && !searchLoading && <p>Найдено фильмов: {movies.length}</p>}
        </div>
        {searchLoading ? (
          <p>Загрузка фильмов...</p>
        ) : searchError ? (
          <p className="error-text">{searchError}</p>
        ) : movies.length === 0 ? (
          <p>По заданным условиям ничего не нашлось. Попробуйте смягчить фильтры.</p>
        ) : (
          <div className="movie-row">
            <div className="movie-row-content">
              {movies.map((movie) => (
                <MovieCard key={movie.movieId} movie={movie} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="recommendations" className="movies-section">
        <div className="section-header">
          <h2>Персональные рекомендации</h2>
          {user ? <p>Сформированы на основе весов жанров и личного списка.</p> : <p>Войдите, чтобы получать персональные рекомендации.</p>}
        </div>
        {!user ? (
          <p>Авторизуйтесь, и мы начнём формировать подборки.</p>
        ) : recommendationsError ? (
          <p className="error-text">{recommendationsError}</p>
        ) : recommendations.length === 0 ? (
          <p>Пока ничего не подобрали. Добавьте жанровые предпочтения в профиле.</p>
        ) : (
          <div className="movie-row">
            <div className="movie-row-content">
              {recommendations.map((item) => (
                <MovieCard key={item.movie.movieId} movie={{ ...item.movie, score: item.score }} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Home


