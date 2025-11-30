# PSB Learning Platform — Frontend

Веб-интерфейс образовательной платформы для хакатона **ПСБ Hack&Change 2025**.

**Трек:** ПРЕПОДАВАТЕЛЬ

## Команда

**Название:** Картофельные глазки

| Участник | Роль                                                       | Контакт |
|----------|------------------------------------------------------------|---------|
| Нуритдинова Аделина | UI/UX дизайнер                                             | [@ledaina](https://t.me/ledaina) |
| Дубинин Михаил | Backend-разработчик, Frontend-разработчик, Data Engineer, DevOps | [@mikh1999](https://t.me/mikh1999) |
| Ганеев Артур | Системный аналитик                                         | [@ArturGD](https://t.me/ArturGD) |

## Описание проекта

SPA-приложение для онлайн-обучения с фокусом на сценарии преподавателя:

- Просмотр и создание курсов
- Управление уроками (текст, видео, PDF)
- Создание и редактирование заданий
- Проверка работ студентов с комментариями
- Выставление и редактирование оценок
- Журнал успеваемости группы

## Стек технологий

- **React 19.2** — UI библиотека
- **TypeScript 5.9** — типизация
- **Vite 7.2** — сборщик
- **React Router 7.9** — маршрутизация
- **TailwindCSS 4.1** — стилизация
- **PostCSS + Autoprefixer** — обработка CSS

## Структура проекта

```
PSB_frontend/
├── src/
│   ├── api/                  # API клиент
│   │   ├── apiClient.ts          # Базовый клиент, обработка 401
│   │   ├── config.ts             # Конфигурация API
│   │   ├── auth.ts               # Авторизация
│   │   ├── courses.ts            # Курсы
│   │   ├── lessons.ts            # Уроки
│   │   ├── assignments.ts        # Задания
│   │   └── submissions.ts        # Ответы студентов
│   ├── components/           # React компоненты
│   │   ├── LandingPage.tsx       # Главная страница
│   │   ├── Dashboard.tsx         # Дашборд преподавателя
│   │   ├── LoginModal.tsx        # Модалка входа
│   │   ├── RegisterModal.tsx     # Модалка регистрации
│   │   ├── CreateCourseModal.tsx # Создание курса
│   │   ├── LessonModal.tsx       # Создание/редактирование урока
│   │   ├── AssignmentModal.tsx   # Создание/редактирование задания
│   │   └── Modal.tsx             # Базовый компонент модалки
│   ├── pages/                # Страницы
│   │   ├── CoursePage.tsx        # Страница курса с уроками
│   │   └── AssignmentsPage.tsx   # Страница проверки заданий
│   ├── App.tsx               # Корневой компонент с роутингом
│   ├── main.tsx              # Точка входа
│   └── index.css             # Глобальные стили
├── public/                   # Статические файлы
├── dist/                     # Собранное приложение
├── index.html                # HTML шаблон
├── vite.config.ts            # Конфигурация Vite
├── tsconfig.json             # Конфигурация TypeScript
├── postcss.config.js         # Конфигурация PostCSS
├── package.json              # Зависимости
├── Dockerfile                # Docker образ
└── docker-compose.yml        # Docker Compose
```

## Установка и запуск

### Требования

- Node.js 18+
- npm 9+

### Локальный запуск

1. **Клонировать репозиторий:**
```bash
git clone <repository-url>
cd PSB_frontend
```

2. **Установить зависимости:**
```bash
npm install
```

3. **Запустить dev-сервер:**
```bash
npm run dev
```

4. **Приложение доступно:** http://localhost:3000

### Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist/`.

### Docker

```bash
docker-compose up --build
```

## Конфигурация

### API Proxy

Vite проксирует запросы `/api/*` на бэкенд. Настройка в `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

### API Base URL

Конфигурация в `src/api/config.ts`:

```typescript
export const API_BASE = '/api/v1'
```

## Роли пользователей

- **student** — просмотр материалов, отправка ответов, просмотр оценок
- **teacher** — создание курсов, проверка работ, выставление оценок, комментирование

## Основные страницы

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | LandingPage | Главная страница с авторизацией |
| `/dashboard` | Dashboard | Дашборд преподавателя |
| `/courses/:id` | CoursePage | Страница курса с уроками |
| `/assignments` | AssignmentsPage | Проверка работ студентов |

## Скрипты

```bash
# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр собранного приложения
npm run preview
```

## Библиотеки и версии

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.6",
  "tailwindcss": "^4.1.17",
  "typescript": "^5.9.3",
  "vite": "^7.2.4",
  "@vitejs/plugin-react": "^5.1.1"
}
```

## Лицензия

MIT License
