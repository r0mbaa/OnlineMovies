-- Создание таблицы для хранения статусов фильмов в списках пользователей
CREATE TABLE statuses (
    status_id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Создание таблицы для хранения жанров
CREATE TABLE genres (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Создание таблицы для хранения тегов
CREATE TABLE tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Создание таблицы для хранения стран
CREATE TABLE countries (
    country_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Создание таблицы для хранения информации о фильмах
CREATE TABLE movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    release_year INT,
    director VARCHAR(255),
    poster_url VARCHAR(255),
    duration_minutes INT CHECK (duration_minutes > 0)
);

-- Создание таблицы для трейлеров (один фильм может иметь несколько трейлеров)
CREATE TABLE trailers (
    trailer_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    trailer_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
);

-- --- Связующие таблицы для фильмов ---

-- Связь фильмов и жанров (многие ко многим)
CREATE TABLE movie_genres (
    movie_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
);

-- Связь фильмов и тегов (многие ко многим)
CREATE TABLE movie_tags (
    movie_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (movie_id, tag_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Связь фильмов и стран производства (многие ко многим)
CREATE TABLE movie_countries (
    movie_id INT NOT NULL,
    country_id INT NOT NULL,
    PRIMARY KEY (movie_id, country_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(country_id) ON DELETE CASCADE
);

-- --- Таблицы, связанные с пользователями ---

-- Создание таблицы пользователей
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'user', -- 'role' - зарезервированное слово, используем кавычки
    avatar_url VARCHAR(255),
    profile_description TEXT
);

-- Предпочтения пользователей по жанрам с весом для рекомендаций
CREATE TABLE user_genre_interests (
    user_id INT NOT NULL,
    genre_id INT NOT NULL,
    weight FLOAT NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),
    PRIMARY KEY (user_id, genre_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
);

-- Таблица для списков фильмов пользователя (статусы, оценки, комментарии)
CREATE TABLE user_movies (
    user_movie_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    status_id INT,
    score INT CHECK (score >= 1 AND score <= 10),
    comment TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UNIQUE (user_id, movie_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES statuses(status_id) ON DELETE SET NULL
);


-- --- Наполнение справочников начальными данными ---

-- Добавление возможных статусов
INSERT INTO statuses (name) VALUES
('Буду смотреть'),
('Просмотрено'),
('Брошено'),
('Не буду смотреть'),
('Оценен');

-- Добавление 20 популярных жанров
INSERT INTO genres (name) VALUES
('Боевик'), ('Комедия'), ('Драма'), ('Фантастика'),
('Триллер'), ('Ужасы'), ('Детектив'), ('Фэнтези'),
('Мелодрама'), ('Анимация'), ('Приключения'), ('Исторический'),
('Биографический'), ('Мюзикл'), ('Документальный'), ('Военный'),
('Вестерн'), ('Семейный'), ('Криминал'), ('Мистика');

INSERT INTO countries (name) VALUES
('США'),
('Россия'),
('Канада'),
('Великобритания'),
('Франция'),
('Германия'),
('Испания'),
('Италия'),
('Австралия'),
('Япония'),
('Южная Корея'),
('Китай'),
('Индия'),
('Мексика'),
('Бразилия'),
('Аргентина'),
('Швеция'),
('Норвегия'),
('Дания'),
('Финляндия'),
('Польша'),
('Чехия'),
('Нидерланды'),
('Бельгия'),
('Швейцария'),
('Исландия');

INSERT INTO tags (name) VALUES
('Культовый'),
('Основано на реальных событиях'),
('Снято по книге'),
('Артхаус'),
('Фильм-нуар'),
('Киберпанк'),
('Постапокалипсис'),
('Супергерои'),
('Самураи'),
('Вампиры'),
('Зомби'),
('Путешествия во времени'),
('Космос'),
('Психологический'),
('Философский'),
('Тяжелый сюжет'),
('Легкий сюжет'),
('Семейный просмотр'),
('Темное фэнтези'),
('Роуд-муви'),
('Магия'),
('Оккультизм'),
('Антиутопия'),
('Музыка'),
('Криминальная драма');

