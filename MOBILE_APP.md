# Mobile App Extension Guide - NJ Stars Platform

Complete guide for extending the NJ Stars Basketball platform to mobile applications (iOS & Android).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Options](#technology-options)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Feature Parity](#feature-parity)
- [Implementation Guide](#implementation-guide)
- [Design Guidelines](#design-guidelines)
- [Best Practices](#best-practices)

---

## Overview

The NJ Stars platform is architected with **complete frontend/backend separation**, making mobile app development straightforward. The backend provides a comprehensive REST API that both web and mobile clients can consume.

### Key Benefits

✅ **Complete API Coverage** - All features accessible via REST API
✅ **JWT Authentication** - Standard token-based auth for mobile
✅ **Type-Safe Contracts** - Well-defined API schemas
✅ **Offline-First Ready** - API designed for caching and sync
✅ **Push Notification Ready** - User system supports device tokens

---

## Architecture

### Current Setup

```
┌─────────────────────────────────────┐
│         Web Frontend                │
│         (Next.js)                   │
└──────────────┬──────────────────────┘
               │
               │  HTTP/JSON + JWT
               │
┌──────────────▼──────────────────────┐
│      Backend REST API               │
│      (FastAPI)                      │
│                                     │
│  ✓ JWT Authentication               │
│  ✓ User Management                  │
│  ✓ Content Delivery                 │
│  ✓ Stripe Integration               │
│  ✓ Event Management                 │
└──────────────┬──────────────────────┘
               │
               │
        ┌──────▼───────┐
        │  PostgreSQL  │
        └──────────────┘
```

### With Mobile Apps

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Web Frontend │  │  iOS App     │  │ Android App  │
│  (Next.js)   │  │  (Swift/     │  │  (Kotlin/    │
│              │  │   RN/Flutter)│  │   RN/Flutter)│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                    HTTP/JSON + JWT
                         │
            ┌────────────▼────────────┐
            │   Backend REST API      │
            │   (FastAPI)             │
            │   /api/v1/*             │
            └────────────┬────────────┘
                         │
                  ┌──────▼───────┐
                  │  PostgreSQL  │
                  └──────────────┘
```

**Key Points:**
- All clients share the same backend API
- Authentication via JWT tokens
- No platform-specific backend code needed
- Consistent data model across platforms

---

## Technology Options

### Option 1: React Native (Recommended)

**Pros:**
- Share code between iOS and Android (90%+ code reuse)
- Leverage existing React knowledge from web app
- Large ecosystem and community
- Expo for rapid development
- Can reuse API client logic from web

**Cons:**
- Slightly lower performance than native
- Some native modules may be needed

**Best For:** Fast development, code sharing, teams with React experience

### Option 2: Flutter

**Pros:**
- Excellent performance
- Beautiful UI out of the box
- Single codebase for iOS and Android
- Growing ecosystem

**Cons:**
- Dart language (new learning curve)
- Can't share code with web frontend

**Best For:** High-performance apps, teams wanting best UI/UX

### Option 3: Native (Swift + Kotlin)

**Pros:**
- Best performance
- Full platform integration
- Latest OS features immediately

**Cons:**
- Two separate codebases
- Longer development time
- Higher maintenance cost

**Best For:** Large teams, platform-specific features needed

---

## API Integration

### API Client Reference

The web app includes a reference API client (`frontend/src/lib/api-client.ts`) that demonstrates:

- Token management
- Request/response handling
- Error handling
- Type-safe interfaces

**Mobile apps can follow the same pattern:**

```typescript
// Web Example (TypeScript)
import { apiClient } from '@/lib/api-client'

// Login
const tokens = await apiClient.login({
  email: 'user@example.com',
  password: 'password123'
})

// Get user info
const user = await apiClient.getCurrentUser()

// Get products
const products = await apiClient.getProducts()
```

### React Native Example

```javascript
// mobile/src/api/client.js
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL
    this.token = null
  }

  async setToken(token) {
    this.token = token
    await AsyncStorage.setItem('access_token', token)
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail)
    }

    return response.json()
  }

  async login(email, password) {
    const data = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    await this.setToken(data.access_token)
    return data
  }

  async getProducts() {
    return this.request('/api/v1/products')
  }

  // ... other methods
}

export const apiClient = new APIClient('https://api.njstars.com')
```

### Flutter Example

```dart
// mobile/lib/api/client.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class APIClient {
  final String baseURL;
  String? _token;

  APIClient(this.baseURL);

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
  }

  Future<Map<String, dynamic>> request(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final url = Uri.parse('$baseURL$endpoint');
    final headers = {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };

    http.Response response;
    if (method == 'POST') {
      response = await http.post(url, headers: headers, body: jsonEncode(body));
    } else {
      response = await http.get(url, headers: headers);
    }

    if (response.statusCode >= 400) {
      final error = jsonDecode(response.body);
      throw Exception(error['detail']);
    }

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await request(
      '/api/v1/auth/login',
      method: 'POST',
      body: {'email': email, 'password': password},
    );

    await setToken(data['access_token']);
    return data;
  }

  Future<List<dynamic>> getProducts() async {
    return await request('/api/v1/products');
  }
}

final apiClient = APIClient('https://api.njstars.com');
```

---

## Authentication

### Flow

1. **User enters credentials** → Mobile app UI
2. **POST /api/v1/auth/login** → Backend validates
3. **Receive JWT token** → Store securely
4. **Use token for all requests** → Include in `Authorization` header

### Token Storage

**React Native:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Save
await AsyncStorage.setItem('access_token', token)

// Retrieve
const token = await AsyncStorage.getItem('access_token')

// Delete
await AsyncStorage.removeItem('access_token')
```

**Flutter:**
```dart
import 'package:shared_preferences/shared_preferences.dart';

// Save
final prefs = await SharedPreferences.getInstance();
await prefs.setString('access_token', token);

// Retrieve
final token = prefs.getString('access_token');

// Delete
await prefs.remove('access_token');
```

### Secure Storage (Recommended)

For production apps, use secure storage:

**React Native:**
```javascript
import * as SecureStore from 'expo-secure-store'

await SecureStore.setItemAsync('access_token', token)
const token = await SecureStore.getItemAsync('access_token')
```

**Flutter:**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();
await storage.write(key: 'access_token', value: token);
final token = await storage.read(key: 'access_token');
```

### OAuth (Google Sign-In)

Mobile apps need platform-specific OAuth setup:

**React Native (Expo):**
```javascript
import * as Google from 'expo-auth-session/providers/google'

const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
})

// Use token from Google to authenticate with backend
const googleToken = response?.authentication?.accessToken
```

---

## Feature Parity

### Core Features (Must Have)

| Feature | Web | Mobile | API Endpoint | Notes |
|---------|-----|--------|--------------|-------|
| User Login | ✅ | 📱 | `POST /api/v1/auth/login` | JWT token auth |
| User Register | ✅ | 📱 | `POST /api/v1/auth/register` | Email + password |
| View News Feed | ✅ | 📱 | `GET /api/v1/blog/feed` | Blog + Instagram |
| View Events | ✅ | 📱 | `GET /api/v1/events` | Calendar display |
| View Products | ✅ | 📱 | `GET /api/v1/products` | Shop |
| Checkout | ✅ | 📱 | `POST /api/v1/stripe/checkout/create-session` | Stripe mobile SDK |
| User Profile | ✅ | 📱 | `GET /api/v1/auth/me` | View/edit profile |

### Mobile-Specific Features (Nice to Have)

| Feature | Implementation | Priority |
|---------|----------------|----------|
| Push Notifications | Firebase/APNs | High |
| Offline Mode | Local caching | Medium |
| Biometric Login | Face ID / Fingerprint | Medium |
| Calendar Integration | Export to device calendar | Low |
| Share Events | Native share sheet | Low |
| Deep Linking | Open specific content from notifications | Medium |

---

## Implementation Guide

### Phase 1: Setup & Authentication (Week 1)

**Goals:**
- Project setup
- API client implementation
- Login/Register screens
- Token management

**Tasks:**
1. Initialize React Native/Flutter project
2. Create API client class (see examples above)
3. Build Login screen
4. Build Register screen
5. Implement token storage
6. Test authentication flow

**Screens:**
- Splash screen
- Login
- Register
- Forgot password (optional)

### Phase 2: Core Content (Week 2-3)

**Goals:**
- News feed
- Events calendar
- Product catalog

**Tasks:**
1. Create navigation structure (bottom tabs)
2. Build News Feed screen
3. Build Events screen
4. Build Shop screen
5. Implement pull-to-refresh
6. Add loading states

**Screens:**
- Home (News Feed)
- Events
- Shop
- Profile

### Phase 3: E-Commerce (Week 4)

**Goals:**
- Product details
- Stripe integration
- Order flow

**Tasks:**
1. Build Product Detail screen
2. Integrate Stripe mobile SDK
3. Implement checkout flow
4. Add order confirmation
5. Test payment flow (test mode)

**Screens:**
- Product details
- Checkout
- Order success

### Phase 4: User Features (Week 5)

**Goals:**
- User profile
- Settings
- Logout

**Tasks:**
1. Build Profile screen
2. Build Settings screen
3. Implement logout
4. Add role-specific content (admin/parent/player)

**Screens:**
- Profile
- Settings
- Edit profile (optional)

### Phase 5: Polish & Launch (Week 6)

**Goals:**
- Polish UI/UX
- Add animations
- Testing
- Deployment

**Tasks:**
1. UI polish and animations
2. Error handling improvements
3. Comprehensive testing
4. App store assets (screenshots, descriptions)
5. Submit to App Store / Play Store

---

## Design Guidelines

### Principles

1. **Simplicity** - Clear navigation, minimal steps
2. **Familiarity** - Follow platform conventions (iOS/Android)
3. **Consistency** - Match web app branding
4. **Speed** - Fast load times, instant feedback
5. **Accessibility** - Support screen readers, large text

### Key Screens

#### Login Screen
```
┌─────────────────────────┐
│                         │
│    [NJ Stars Logo]      │
│                         │
│   ┌─────────────────┐   │
│   │ Email           │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │ Password        │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │   LOGIN         │   │
│   └─────────────────┘   │
│                         │
│   ─── or sign in with ──│
│                         │
│     [Google] [Apple]    │
│                         │
│  Don't have an account? │
│       Register          │
│                         │
└─────────────────────────┘
```

#### Home Screen (News Feed)
```
┌─────────────────────────┐
│  NJ Stars      [Profile]│
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │  [News Image]     │  │
│  │                   │  │
│  │  Title            │  │
│  │  Excerpt...       │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  [Instagram]      │  │
│  │                   │  │
│  │  Caption...       │  │
│  └───────────────────┘  │
│                         │
│  [Pull to refresh]      │
│                         │
├─────────────────────────┤
│  [Home] [Events] [Shop] │
│         [Profile]       │
└─────────────────────────┘
```

### Color Scheme

Use the web app's colors for consistency:

- **Primary:** Blue (#2563EB)
- **Secondary:** Gray (#64748B)
- **Accent:** Blue-800 (#1E40AF)
- **Success:** Green (#10B981)
- **Error:** Red (#EF4444)

### Typography

- **iOS:** San Francisco (system font)
- **Android:** Roboto (system font)
- **Headings:** Bold, 20-24pt
- **Body:** Regular, 16pt
- **Captions:** Regular, 14pt

---

## Best Practices

### Performance

1. **Image Optimization**
   - Lazy load images
   - Use appropriate sizes
   - Cache images locally

2. **API Calls**
   - Cache responses
   - Debounce search inputs
   - Use pagination

3. **Navigation**
   - Preload next screen
   - Smooth transitions
   - Back button support

### User Experience

1. **Loading States**
   - Show skeleton screens
   - Progress indicators
   - Pull-to-refresh

2. **Error Handling**
   - Clear error messages
   - Retry mechanisms
   - Offline indicators

3. **Feedback**
   - Haptic feedback (iOS)
   - Toast notifications
   - Success confirmations

### Security

1. **Token Management**
   - Use secure storage
   - Automatic token refresh
   - Clear on logout

2. **Data Protection**
   - Encrypt sensitive data
   - Secure API communication (HTTPS)
   - Validate user input

3. **Privacy**
   - Request minimal permissions
   - Clear privacy policy
   - GDPR compliance

### Testing

1. **Unit Tests**
   - API client
   - Business logic
   - Utilities

2. **Integration Tests**
   - Authentication flow
   - Data fetching
   - Payment flow

3. **E2E Tests**
   - Critical user journeys
   - Purchase flow
   - Registration/login

---

## Quick Start (React Native)

### 1. Create New Project

```bash
# Using Expo (recommended)
npx create-expo-app nj-stars-mobile
cd nj-stars-mobile

# Install dependencies
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
npm install expo-secure-store
npm install @stripe/stripe-react-native
```

### 2. Copy API Client

```bash
# Copy the API client from web app
cp ../frontend/src/lib/api-client.ts ./src/api/client.ts

# Adapt for React Native (change localStorage to AsyncStorage)
```

### 3. Create Basic Structure

```
nj-stars-mobile/
├── src/
│   ├── api/
│   │   └── client.ts        # API client (adapted from web)
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── EventsScreen.tsx
│   │   ├── ShopScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── NewsCard.tsx
│   │   ├── EventCard.tsx
│   │   └── ProductCard.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── utils/
│       └── auth.ts
├── App.tsx
└── package.json
```

### 4. Start Development

```bash
npm start

# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

---

## API Endpoint Reference

Complete API documentation is available at:
- **Local:** http://localhost:8000/docs
- **Production:** https://api.njstars.com/docs

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (returns JWT)
- `GET /api/v1/auth/me` - Get current user info
- `GET /api/v1/auth/verify` - Verify token validity

### Content

- `GET /api/v1/blog/feed` - Unified news feed (blog + Instagram)
- `GET /api/v1/blog/posts` - Blog posts only
- `GET /api/v1/events` - Events calendar
- `GET /api/v1/products` - Product catalog

### E-Commerce

- `POST /api/v1/stripe/checkout/create-session` - Create checkout session
- (Webhook handled server-side)

---

## Resources

### React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

### Flutter
- [Flutter Docs](https://flutter.dev/docs)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)

### Design
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [Figma](https://www.figma.com/) - Design mockups
- [TestFlight](https://developer.apple.com/testflight/) - iOS beta testing
- [Google Play Console](https://play.google.com/console) - Android distribution

---

## Support

For questions about mobile app development:
- Review the API client: `frontend/src/lib/api-client.ts`
- Check API docs: `http://localhost:8000/docs`
- Contact: admin@njstarsbasketball.com

---

**Ready to build! 📱🏀**
