# Migration Action Plan – ChatGPT UI → Angular

> Файл-чек-лист для пошагового переноса прототипа (`chatgpt-ui-mvp.html`) в Angular-проект `apps/chatgpt-ui`.
> Отмечайте `✔`/`✖` по ходу работ.

---

## Фаза 0 — База проекта
- [ ] 0.1  Запустить `npm install` (если не выполнено генератором)
- [ ] 0.2  Запуск проверки `ng serve` — пустой проект открывается на http://localhost:4200

## Фаза 1 — Ассеты и глобальные стили
- [ ] 1.1  Скопировать `apps/web-app-prototype/assets/icons` → `src/assets/icons`
- [ ] 1.2  В `src/styles.scss` добавить CSS-переменные (тёмная тема)
- [ ] 1.3  Добавить глобальный reset/box-sizing и шрифт Inter (Google Fonts)

## Фаза 2 — Структура компонентов
CLI-команды (выполнять из `apps/chatgpt-ui`):
```bash
ng g module shared --flat
ng g module sidebar --routing=false
ng g component sidebar
ng g component sidebar/chat-list
ng g component sidebar/chat-item
ng g component sidebar/sidebar-footer

ng g module chat --routing=false
ng g component chat/chat-view
ng g component chat/welcome-screen
ng g component chat/messages-container
ng g component chat/message-bubble
ng g component chat/typing-indicator
ng g component chat/input-area

ng g directive shared/auto-resize-textarea
```
- [ ] 2.1  Выполнить генерацию модулей/компонентов
- [ ] 2.2  Зарегистрировать модули в `app.module.ts`

## Фаза 3 — Сервисы и модели
```bash
ng g service core/chat
ng g service core/ai
```
- [ ] 3.1  Создать интерфейсы `Message` и `Chat` в `core/models`
- [ ] 3.2  Реализовать `ChatService` (CRUD чатов, BehaviorSubject текущего чата)
- [ ] 3.3  Реализовать `AiService` (возврат demo-ответов)

## Фаза 4 — Лэйаут & роутинг *(если нужен)*
- [ ] 4.1  В `app.component.html` разместить `<app-sidebar>` и `<app-chat-view>` (flex-layout)
- [ ] 4.2  (Опц.) настроить `AppRoutingModule` с `/chat/:id`

## Фаза 5 — Перенос HTML/CSS
- [ ] 5.1  Sidebar → `sidebar.component.html/scss`
- [ ] 5.2  Welcome-screen → `welcome-screen.component.*`
- [ ] 5.3  MessagesContainer + MessageBubble
- [ ] 5.4  TypingIndicator
- [ ] 5.5  InputArea + AutoResizeTextareaDirective

## Фаза 6 — Логика взаимодействия
- [ ] 6.1  Подключить `ChatService` к Sidebar (создание/переключение чатов)
- [ ] 6.2  Подключить `MessagesContainer` к потоку сообщений
- [ ] 6.3  Реализовать отправку сообщения и ответ AI (через `AiService`)

## Фаза 7 — Анимации и UX
- [ ] 7.1  Добавить fade/slide анимацию появления сообщений (`@angular/animations`)
- [ ] 7.2  Анимация TypingIndicator (CSS keyframes)
- [ ] 7.3  Hover-transition для кнопок/листовых элементов

## Фаза 8 — Адаптивность (≤ 768 px)
- [ ] 8.1  Класс `.open` для Sidebar, `transform:translateX(-100%)`
- [ ] 8.2  Показ `mobile-header` c бургером
- [ ] 8.3  Изменение padding input-area на мобиле

## Фаза 9 — Финальные проверки
- [ ] 9.1  Pixel-perfect сверка с Figma (Overlay/Pixelsnap)
- [ ] 9.2  Линт + форматирование (`ng lint`, `npm run prettier`)
- [ ] 9.3  Build prod (`ng build --configuration production`) — ошибки отсутствуют

---
**Готово!** После выполнения всех пунктов шаблон будет полностью перенесён на Angular 16 с читаемой архитектурой и готовностью к расширению. 