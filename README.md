# OnlineMovies API

REST API для онлайн-кинотеки. Большинство маршрутов требует авторизации по JWT (токен выдаётся и хранится в cookie `jwt-token-online-movies`). Ниже перечислены все контроллеры и их эндпоинты.

## Навигация
- [Аутентификация](#аутентификация)
- [Фильмы](#фильмы)
- [Рекомендации](#рекомендации)
- [Жанровые предпочтения](#жанровые-предпочтения)
- [Личный список и оценки](#личный-список-и-оценки)
- [Профиль пользователя](#профиль-пользователя)
- [Справочники: жанры, теги, страны](#справочники)
- [Управление пользователями (админ)](#админ-пользователи)

---

## Аутентификация
| Метод | URI | Описание | Тело запроса |
|-------|-----|----------|--------------|
| `POST` | `/api/auth/register` | Регистрация нового пользователя | `{ "username": "", "email": "", "password": "" }` |
| `POST` | `/api/auth/login` | Вход по логину и паролю | `{ "username": "", "password": "" }` |
| `POST` | `/api/auth/change-password` *(auth)* | Смена пароля. Требует `oldPassword` и `newPassword` | `{ "oldPassword": "", "newPassword": "" }` |
| `GET` | `/api/auth/check-auth` *(auth)* | Проверить валидность токена, вернуть id/username/role | — |
| `POST` | `/api/auth/logout` *(auth)* | Очистить cookie с токеном | — |

---

## Фильмы
| Метод | URI | Описание | Тело/параметры |
|-------|-----|----------|----------------|
| `GET` | `/api/movies` | Список фильмов. Поддерживает query `title`, `genreIds`, `tagIds`, `countryIds` | Query |
| `GET` | `/api/movies/{id}` | Получить фильм по id | — |
| `GET` | `/api/movies/by-title/{title}` | Найти фильм по точному названию | — |
| `GET` | `/api/movies/random` | Вернуть случайный фильм | — |
| `POST` | `/api/movies` *(admin)* | Создать фильм | `MovieCreateUpdateDto` |
| `PUT` | `/api/movies/{id}` *(admin)* | Обновить фильм | `MovieCreateUpdateDto` |
| `DELETE` | `/api/movies/{id}` *(admin)* | Удалить фильм | — |

`MovieCreateUpdateDto` содержит поля: `title`, `description`, `releaseYear`, `director`, `posterUrl`, `durationMinutes`, `genreIds`, `tagIds`, `countryIds`, `trailerUrls`.

---

## Рекомендации
| Метод | URI | Описание |
|-------|-----|----------|
| `GET` | `/api/recommendations/movies` *(auth)* | Топ рекомендаций пользователя по жанровым весам. Исключает фильмы из личного списка. Если предпочтений нет — возвращает случайный фильм. |

---

## Жанровые предпочтения
| Метод | URI | Описание |
|-------|-----|----------|
| `GET` | `/api/user/genre-interests` *(auth)* | Получить сохранённые веса жанров |
| `PUT` | `/api/user/genre-interests` *(auth)* | Обновить список предпочтений. Тело: `{ "interests": [ { "genreId": 1, "weight": 0.5 }, ... ] }` |

Веса находятся в диапазоне `(0; 1]`. Пустой список очищает предпочтения.

---

## Личный список и оценки
| Метод | URI | Описание |
|-------|-----|----------|
| `POST` | `/api/user/movies` *(auth)* | Добавить/обновить фильм в личном списке. Тело: `{ "movieId": 1, "statusId": 2, "comment": "..." }` |
| `POST` | `/api/user/movies/rate` *(auth)* | Выставить оценку (1–10). Тело: `{ "movieId": 1, "score": 8, "comment": "..." }`. Фильм автоматически получает статус «Оценен». |
| `DELETE` | `/api/user/movies/{movieId}` *(auth)* | Удалить фильм из списка целиком |

Таблица `statuses` должна содержать варианты из seed-скрипта: «Буду смотреть», «Просмотрено», «Брошено», «Не буду смотреть», «Оценен».

---

## Профиль пользователя
| Метод | URI | Описание |
|-------|-----|----------|
| `GET` | `/api/user/profile` *(auth)* | Получить профиль (username, email, роль, описание, avatarUrl) |
| `PUT` | `/api/user/profile/description` *(auth)* | Обновить описание. Тело: `{ "profileDescription": "..." }` |
| `POST` | `/api/user/profile/avatar` *(auth)* | Загрузить аватар (`multipart/form-data`, поле `avatar`). Допустимые форматы: jpg/jpeg/png/webp, размер ≤ 4 МБ. |

Файлы сохраняются в `wwwroot/avatars`, доступны по URL `/avatars/{file}`.

---

## Справочники
Для жанров, тегов и стран доступны одинаковые REST-операции.

| Контроллер | База URI | Публичные методы | Админ-методы |
|------------|----------|------------------|--------------|
| GenresController | `/api/genres` | `GET /`, `GET /{id}` | `POST /`, `PUT /{id}`, `DELETE /{id}` |
| TagsController | `/api/tags` | `GET /`, `GET /{id}` | `POST /`, `PUT /{id}`, `DELETE /{id}` |
| CountriesController | `/api/countries` | `GET /`, `GET /{id}` | `POST /`, `PUT /{id}`, `DELETE /{id}` |

Все операции изменения защищены `[Authorize(Roles = "admin")]`.

---

## Админ: пользователи
| Метод | URI | Описание |
|-------|-----|----------|
| `GET` | `/api/users` *(auth)* | Список пользователей (доступен всем авторизованным) |
| `GET` | `/api/users/{id}` *(auth)* | Получить пользователя по id |
| `GET` | `/api/users/by-username/{username}` *(auth)* | Найти по username |
| `PUT` | `/api/users/{id}` *(admin)* | Обновить пользователя: `{ "username": "", "email": "", "role": "admin/user" }` |
| `DELETE` | `/api/users/{id}` *(admin)* | Удалить пользователя |

---

## Примечания по БД
- `users` содержит поля `avatar_url` и `profile_description`.
- `user_genre_interests` задаёт веса жанров (от 0 до 1).
- `user_movies` хранит статус, оценку (1–10) и комментарий к фильму пользователя.
- После развёртывания выполните скрипт из ТЗ для заполнения таблиц `statuses` и `genres` начальными значениями.

## Localhost URLs
По умолчанию API запускается командой `dotnet run` из `src/OnlineMovies`. Ссылки на аватары доступны по `http://localhost:<порт>/avatars/{fileName}`.
