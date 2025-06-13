# ChatGPT UI Clone

A modern, responsive ChatGPT interface clone built with Angular 16. This project replicates the core functionality and design of ChatGPT's web interface, featuring real-time chat interactions, persistent conversation history, and a clean, intuitive user experience.

## Live Demo

**Production URL:** [https://drozhzhin-n-e.github.io/chatgpt-ui/](https://drozhzhin-n-e.github.io/chatgpt-ui/)

## Features

### Core Functionality
- **Multi-Chat System**: Create, manage, and switch between multiple conversation threads
- **Real-time Messaging**: Send messages via button click or Enter key with instant responses
- **Persistent Storage**: All conversations are automatically saved to localStorage and persist across browser sessions
- **Smart Chat Titles**: Automatic title generation from the first message (truncated to 30 characters)
- **Chat Management**: Rename and delete conversations with confirmation dialogs

### User Interface
- **Welcome Screen**: Interactive landing page with clickable example prompts
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI Components**: Clean, ChatGPT-inspired design with smooth animations
- **Sidebar Navigation**: Collapsible chat list with intuitive controls
- **Message Bubbles**: Distinct styling for user and AI messages

### AI Simulation
- **Demo Responses**: Simulated AI responses with keyword-based logic
- **Special Keywords**: Custom responses for specific terms (e.g., "квантов" triggers quantum physics response)
- **Response Timing**: Natural 800ms delay to simulate processing time

## Technical Architecture

### Framework & Dependencies
- **Angular 16.2.0**: Modern TypeScript framework with latest features
- **RxJS 7.8.0**: Reactive programming for state management
- **SCSS**: Advanced styling with component-scoped styles
- **TypeScript 5.1.3**: Type-safe development with strict configuration

### Project Structure
```
src/
├── app/
│   ├── chat/                    # Chat functionality module
│   │   ├── chat.service.ts      # Core business logic
│   │   ├── chat-view/           # Main chat display component
│   │   ├── welcome-screen/      # Landing page component
│   │   ├── message-bubble/      # Individual message component
│   │   ├── messages-container/  # Message list container
│   │   └── input-area/          # Message input component
│   ├── sidebar/                 # Navigation sidebar module
│   │   ├── sidebar.component.*  # Main sidebar container
│   │   ├── chat-list/           # Chat list component
│   │   ├── chat-item/           # Individual chat item
│   │   └── sidebar-footer/      # Settings and actions
│   └── shared/                  # Shared utilities and components
├── assets/                      # Static assets and images
└── styles.scss                  # Global styles
```

### State Management
The application uses a reactive state management pattern with RxJS:

```typescript
// Core service architecture
@Injectable({ providedIn: 'root' })
export class ChatService {
  private _chats = new BehaviorSubject<Chat[]>(this.loadChats());
  private _currentId = new BehaviorSubject<string | null>(this.loadCurrentId());
  
  readonly chats$ = this._chats.asObservable();
  readonly currentId$ = this._currentId.asObservable();
  readonly messages$ = combineLatest([this.chats$, this.currentId$]).pipe(
    map(([chats, id]) => chats.find(c => c.id === id)?.messages ?? [])
  );
}
```

### Data Models
```typescript
interface Message {
  id: string;
  author: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}
```

### Local Storage Integration
- **Automatic Persistence**: All chat data is automatically saved to localStorage
- **Version Control**: Storage keys include version suffixes for data migration
- **Error Handling**: Graceful fallbacks for storage failures or quota exceeded
- **Data Recovery**: Automatic loading of previous sessions on application start

## Implementation Details

### Chat Service Logic
The `ChatService` is the core of the application, managing all chat-related operations:

- **State Management**: Uses BehaviorSubjects for reactive state updates
- **Auto-Save**: Automatically persists data to localStorage on every change
- **ID Generation**: Creates unique IDs using timestamp and random strings
- **Title Generation**: Automatically creates chat titles from first message
- **Response Simulation**: Implements keyword-based AI response logic

### Component Architecture
- **Modular Design**: Each feature is encapsulated in its own module
- **Reactive Components**: All components use OnPush change detection for performance
- **SCSS Styling**: Component-scoped styles with global theme variables
- **Accessibility**: Proper ARIA labels and keyboard navigation support

### Testing Coverage
Comprehensive end-to-end testing with Playwright covering:
- Chat creation and management
- Message sending and receiving
- UI interactions and animations
- LocalStorage persistence
- Error handling and edge cases

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- Angular CLI 16+

### Installation
```bash
# Install dependencies
npm install

# Start development server
ng serve

# Build for production
ng build --configuration production
```

### Development Commands
```bash
# Development server (http://localhost:4200)
ng serve

# Production build
ng build --prod

# Run tests
ng test

# Deploy to GitHub Pages
ng deploy --base-href=/chatgpt-ui/
```

## Deployment

The application is deployed to GitHub Pages using the `angular-cli-ghpages` package:

```bash
# Build and deploy in one command
ng deploy --base-href=/chatgpt-ui/
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Features

- **Lazy Loading**: Components loaded on demand
- **OnPush Change Detection**: Optimized Angular change detection
- **Bundle Optimization**: Tree-shaking and code splitting
- **Efficient State Management**: Minimal re-renders with reactive patterns

## Key Features Tested

Based on comprehensive Playwright testing, the following features are verified:

### Chat System (9/10 tests passing)
- ✅ Chat creation via button and message sending
- ✅ Automatic title generation from first message
- ✅ Chat switching with history preservation
- ✅ Chat renaming with inline editing
- ✅ Chat deletion with confirmation dialogs
- ✅ Message sending via button and Enter key
- ✅ Special AI responses for keywords
- ✅ Clickable example prompts
- ❌ Clear conversations function (not implemented)

### Technical Implementation
- **Reactive Architecture**: RxJS-based state management
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Graceful fallbacks for all operations
- **Data Persistence**: Reliable localStorage integration

## License

This project is licensed under the MIT License.

## Acknowledgments

- Design inspired by OpenAI's ChatGPT interface
- Built with Angular and modern web technologies
- Comprehensive testing with Playwright automation 