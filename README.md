# Фильмовый сервис — API

## Аутентификация

### Регистрация

POST /api/auth/register
{
"username": "string",
"email": "string",
"password": "string"
}

### Вход

POST /api/auth/login
{
"email": "string",
"password": "string"
}

## Фильмы

### Случайный фильм

GET /api/movies/random

### Рекомендованный фильм

GET /api/movies/recommended

### Список числом рекомендованных фильмов

GET /api/movies/recommended/{число}

### Оценить фильм

POST /api/movies/{id}/rate
{
"score": 1-10
}

### Добавить в личный список

POST /api/movies/{id}/add-to-list
{
"listType": "Watched/ToWatch/Watching/NotInterested"
}

### Все фильмы

GET /api/movies

### Поиск по названию

GET /api/movies/search?title={название}

## Мои списки

### Просмотренные фильмы

GET /api/user/lists/Watched

### Буду смотреть

GET /api/user/lists/ToWatch

### Смотрю сейчас

GET /api/user/lists/Watching

### Не хочу смотреть

GET /api/user/lists/NotInterested

## Администратор

### Создать фильм

POST /api/admin/movies
{
"title": "string",
"description": "string",
"releaseYear": 0

- тут должны быть векторы-характеристики для рекомендаций
  }

### Обновить фильм

PUT /api/admin/movies/{id}
{
"title": "string",
"description": "string",
"releaseYear": 0

- тут должны быть векторы-характеристики для рекомендаций
  }

### Удалить фильм

DELETE /api/admin/movies/{id}

### Получить всех пользователей

GET /api/admin/users

### Получить пользователя по ID

GET /api/admin/users/{id}

### Обновить пользователя

PUT /api/admin/users/{id}
{
"username": "string",
"email": "string",
"role": "User/Admin"
}

### Удалить пользователя

DELETE /api/admin/users/{id}
