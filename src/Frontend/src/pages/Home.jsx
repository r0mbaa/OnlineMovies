import movies from '../data/movies.json'
import MovieCard from '../components/MovieCard'

const Home = ({ user }) => {
  return (
    <div className="home">
      <section className="hero" id="hero">
        <div className="hero-content">
          <p className="hero-kicker">Подборка специально для вас</p>
          <h1>
            Мир кино онлайн <span>24/7</span>
          </h1>
          <p className="hero-subtitle">
            {user ? `${user.name},` : 'Гость,'} найдите фильмы для идеального вечера. Мы собрали лучшую коллекцию
            премиум-рейтинга, которую можно посмотреть за пару кликов.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-action">
              Начать просмотр
            </button>
            <button type="button" className="ghost-action">
              Смотреть трейлеры
            </button>
          </div>
        </div>
        <div className="hero-stat-block">
          <div>
            <strong>4500+</strong>
            <span>фильмов и сериалов</span>
          </div>
          <div>
            <strong>Ultra HD</strong>
            <span>качество потока</span>
          </div>
          <div>
            <strong>0,01 c</strong>
            <span>до старта воспроизведения</span>
          </div>
        </div>
        <div className="hero-glow" aria-hidden />
      </section>

      <section className="movie-grid" id="trending">
        <div className="section-header">
          <h2>Сейчас в тренде</h2>
          <p>Выберите настроение: триллеры, романтика или героические саги — все уже ждут вас.</p>
        </div>
        <div className="movie-grid-content">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

