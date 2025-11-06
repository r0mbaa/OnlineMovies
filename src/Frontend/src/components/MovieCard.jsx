import { Link, useNavigate } from 'react-router-dom'

const MovieCard = ({ movie }) => {
  const { poster, title, description, rating, duration, genre, year, tags = [] } = movie
  const navigate = useNavigate()

  const openDetails = () => {
    console.log('[Movies] Opening movie details view', { endpoint: `/movies/${movie.id}` })
    navigate(`/movies/${movie.id}`)
  }

  return (
    <article className="movie-card">
      <Link
        className="movie-poster"
        to={`/movies/${movie.id}`}
        onClick={() => console.log('[Movies] Poster clicked', { endpoint: `/movies/${movie.id}` })}
      >
        <img src={poster} alt={title} loading="lazy" />
        <span className="movie-rating">
          <span aria-hidden>★</span>
          {rating.toFixed(1)}
        </span>
      </Link>
      <div className="movie-content">
        <div className="movie-meta">
          <span>{genre}</span>
          <span>
            {year} · {duration} мин
          </span>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="movie-tags">
          {tags.map((tag) => (
            <span key={tag} className="movie-tag">
              {tag}
            </span>
          ))}
        </div>
        <button type="button" className="movie-cta" onClick={openDetails}>
          Смотреть сейчас
        </button>
      </div>
    </article>
  )
}

export default MovieCard

