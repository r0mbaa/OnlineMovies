import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { directoriesApi, moviesApi } from '../api'

const createEmptyForm = () => ({
  title: '',
  description: '',
  releaseYear: '',
  director: '',
  posterUrl: '',
  durationMinutes: '',
  genreIds: [],
  tagIds: [],
  countryIds: [],
  trailerUrls: ['']
})

const AdminMovieEditor = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => createEmptyForm())
  const [reference, setReference] = useState({ genres: [], tags: [], countries: [] })
  const [loadingMovie, setLoadingMovie] = useState(Boolean(id))
  const [loadingReference, setLoadingReference] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const isEditMode = Boolean(id)
  const canEdit = user?.role === 'admin'

  useEffect(() => {
    const loadReference = async () => {
      try {
        setLoadingReference(true)
        const [genres = [], tags = [], countries = []] = await Promise.all([
          directoriesApi.getGenres(),
          directoriesApi.getTags(),
          directoriesApi.getCountries()
        ])
        setReference({
          genres: [...genres].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
          tags: [...tags].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
          countries: [...countries].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        })
      } catch (err) {
        setError(err.message || 'Не удалось загрузить справочники.')
      } finally {
        setLoadingReference(false)
      }
    }

    loadReference()
  }, [])

  useEffect(() => {
    if (!isEditMode) {
      setLoadingMovie(false)
      return
    }

    let isMounted = true

    const loadMovie = async () => {
      try {
        setLoadingMovie(true)
        setError('')
        const movie = await moviesApi.getMovie(id)
        if (!isMounted) return
        const trailerUrls = (movie.trailers || []).map((trailer) => trailer.url).filter(Boolean)
        setForm({
          title: movie.title || '',
          description: movie.description || '',
          releaseYear: movie.releaseYear?.toString() || '',
          director: movie.director || '',
          posterUrl: movie.posterUrl || '',
          durationMinutes: movie.durationMinutes?.toString() || '',
          genreIds: (movie.genres || []).map((genre) => genre.id),
          tagIds: (movie.tags || []).map((tag) => tag.id),
          countryIds: (movie.countries || []).map((country) => country.id),
          trailerUrls: trailerUrls.length ? trailerUrls : ['']
        })
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Не удалось загрузить фильм.')
      } finally {
        if (isMounted) {
          setLoadingMovie(false)
        }
      }
    }

    loadMovie()
    return () => {
      isMounted = false
    }
  }, [id, isEditMode])

  const isLoading = loadingMovie || loadingReference

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleArrayValue = (field, value) => {
    const numericValue = Number(value)
    setForm((prev) => {
      const exists = prev[field].includes(numericValue)
      return {
        ...prev,
        [field]: exists ? prev[field].filter((idValue) => idValue !== numericValue) : [...prev[field], numericValue]
      }
    })
  }

  const handleTrailerChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.trailerUrls]
      next[index] = value
      return { ...prev, trailerUrls: next }
    })
  }

  const addTrailerField = () => {
    setForm((prev) => ({ ...prev, trailerUrls: [...prev.trailerUrls, ''] }))
  }

  const removeTrailerField = (index) => {
    setForm((prev) => ({
      ...prev,
      trailerUrls: prev.trailerUrls.filter((_, idx) => idx !== index)
    }))
  }

  const preparedPayload = useMemo(() => {
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
      director: form.director?.trim() || null,
      posterUrl: form.posterUrl?.trim() || null,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      genreIds: form.genreIds,
      tagIds: form.tagIds,
      countryIds: form.countryIds,
      trailerUrls: form.trailerUrls.map((url) => url.trim()).filter((url) => url)
    }

    return payload
  }, [form])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canEdit) {
      return
    }

    setSaving(true)
    setFeedback('')
    setError('')

    try {
      const savedMovie = isEditMode ? await moviesApi.updateMovie(id, preparedPayload) : await moviesApi.createMovie(preparedPayload)
      setFeedback(isEditMode ? 'Фильм обновлён' : 'Фильм создан')
      if (!isEditMode) {
        navigate(`/movies/${savedMovie.movieId}`)
      } else {
        const updatedTrailers = (savedMovie.trailers || []).map((trailer) => trailer.url).filter(Boolean)
        setForm((prev) => ({
          ...prev,
          trailerUrls: updatedTrailers.length ? updatedTrailers : prev.trailerUrls
        }))
      }
    } catch (err) {
      setError(err.message || 'Не удалось сохранить фильм.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) {
    return (
      <section className="movie-editor">
        <div className="detail-card">
          <h2>Недостаточно прав</h2>
          <p>Функция редактирования фильмов доступна только администраторам.</p>
          <button type="button" className="ghost-action" onClick={() => navigate(-1)}>
            Вернуться назад
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="movie-editor">
      <button type="button" className="ghost-action back-button" onClick={() => navigate(-1)}>
        ← Назад
      </button>
      <div className="detail-card editor-card">
        <div className="detail-content">
          <h1>{isEditMode ? 'Редактирование фильма' : 'Добавление нового фильма'}</h1>
          {isLoading ? (
            <p>Загружаем данные...</p>
          ) : (
            <form className="movie-editor-form" onSubmit={handleSubmit}>
              <div className="movie-editor-grid">
                <label>
                  <span>Название</span>
                  <input name="title" value={form.title} onChange={handleInputChange} required placeholder="Например, Матрица" />
                </label>
                <label>
                  <span>Год релиза</span>
                  <input type="number" name="releaseYear" value={form.releaseYear} onChange={handleInputChange} min="1888" max="2100" />
                </label>
                <label>
                  <span>Продолжительность (мин.)</span>
                  <input type="number" name="durationMinutes" value={form.durationMinutes} onChange={handleInputChange} min="1" />
                </label>
                <label>
                  <span>Режиссёр</span>
                  <input name="director" value={form.director} onChange={handleInputChange} placeholder="Имя режиссёра" />
                </label>
                <label>
                  <span>Ссылка на постер</span>
                  <input name="posterUrl" value={form.posterUrl} onChange={handleInputChange} placeholder="https://..." />
                </label>
              </div>

              <label className="movie-editor-description">
                <span>Описание</span>
                <textarea
                  name="description"
                  rows="5"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Краткое содержание фильма"
                />
              </label>

              <div className="movie-editor-groups">
                <EditorChipGroup
                  title="Жанры"
                  options={reference.genres}
                  selected={form.genreIds}
                  loading={loadingReference}
                  fieldKey="genreId"
                  onToggle={(value) => toggleArrayValue('genreIds', value)}
                />
                <EditorChipGroup
                  title="Теги"
                  options={reference.tags}
                  selected={form.tagIds}
                  loading={loadingReference}
                  fieldKey="tagId"
                  onToggle={(value) => toggleArrayValue('tagIds', value)}
                />
                <EditorChipGroup
                  title="Страны"
                  options={reference.countries}
                  selected={form.countryIds}
                  loading={loadingReference}
                  fieldKey="countryId"
                  onToggle={(value) => toggleArrayValue('countryIds', value)}
                />
              </div>

              <div className="movie-editor-trailers">
                <div className="movie-editor-trailers-header">
                  <span>Трейлеры</span>
                  <button type="button" className="chip-clear" onClick={addTrailerField}>
                    Добавить поле
                  </button>
                </div>
                {form.trailerUrls.length === 0 && <p className="filter-placeholder">Пока нет ссылок</p>}
                {form.trailerUrls.map((url, index) => (
                  <div key={index} className="trailers-row">
                    <input
                      type="url"
                      placeholder="https://youtu.be/..."
                      value={url}
                      onChange={(event) => handleTrailerChange(index, event.target.value)}
                    />
                    {form.trailerUrls.length > 1 && (
                      <button type="button" className="ghost-action" onClick={() => removeTrailerField(index)}>
                        Удалить
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="error-text">{error}</p>}
              {feedback && <p className="success-text">{feedback}</p>}

              <div className="detail-actions">
                <button type="submit" className="primary-action" disabled={saving}>
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                {isEditMode && (
                  <button type="button" className="ghost-action" onClick={() => navigate(`/movies/${id}`)}>
                    Открыть фильм
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

const EditorChipGroup = ({ title, options, selected, loading, fieldKey, onToggle }) => (
  <div className="movie-editor-chip-group">
    <div className="filter-label-row">
      <span>{title}</span>
      {selected.length > 0 && (
        <span className="movie-editor-chip-count">
          Выбрано: <strong>{selected.length}</strong>
        </span>
      )}
    </div>
    {loading ? (
      <p className="filter-placeholder">Загружаем...</p>
    ) : options.length === 0 ? (
      <p className="filter-placeholder">Недоступно</p>
    ) : (
      <div className="filter-chips">
        {options.map((option) => {
          const id = Number(option[fieldKey])
          const isActive = selected.includes(id)
          return (
            <button type="button" key={id} className={`filter-chip${isActive ? ' active' : ''}`} onClick={() => onToggle(id)}>
              {option.name}
            </button>
          )
        })}
      </div>
    )}
  </div>
)

export default AdminMovieEditor


