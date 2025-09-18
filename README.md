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

### Оценить фильм
POST /api/movies/{id}/rate
{
  "score": 1-10
}

### Добавить в список
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
