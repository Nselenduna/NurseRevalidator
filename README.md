# 🩺 Nurse Revalidator

> **Empowering nurses and midwives to deliver exceptional care through streamlined professional registration and development tracking.**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-blue.svg)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.22-black.svg)](https://expo.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4.svg)](https://tailwindcss.com/)

## 🎯 About

Nurse Revalidator is a comprehensive mobile application designed specifically for nursing and midwifery professionals to maintain their registration status, track continuing professional development (CPD), and stay compliant with professional standards. The app provides an intuitive, secure, and efficient platform for healthcare professionals to manage their career development requirements.

## ✨ Key Features

### 📋 **Professional Registration Management**
- Real-time registration status tracking
- Renewal date reminders and notifications
- Document storage for registration evidence
- Integration with professional regulatory bodies

### 📚 **Continuing Professional Development (CPD)**
- Activity logging with categorization
- Progress tracking towards CPD requirements
- Evidence upload and management
- Automated hour calculations and reporting

### 🔐 **Security & Compliance**
- Secure local data storage with encryption
- Biometric authentication support
- GDPR compliant data handling
- Offline-first architecture with sync capabilities

### 📱 **User Experience**
- Modern, accessible UI design
- Dark/light theme support
- Haptic feedback integration
- Smooth animations and transitions
- Multi-language support ready

### 🔔 **Smart Notifications**
- Intelligent reminder system
- Customizable notification preferences
- Background task processing
- Calendar integration

## 🛠️ Technology Stack

### **Frontend Framework**
- **React Native 0.79.5** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Expo SDK ~53.0** - Development platform and services

### **Styling & UI**
- **NativeWind 3.0** - TailwindCSS for React Native
- **React Native Reanimated** - High-performance animations
- **React Native SVG** - Vector graphics support
- **Expo Vector Icons** - Comprehensive icon library

### **Navigation & State**
- **React Navigation 7.x** - Type-safe navigation
- **React Navigation Stack** - Stack-based navigation
- **Context API** - State management

### **Storage & Security**
- **AsyncStorage** - Local data persistence
- **Expo Secure Store** - Encrypted sensitive data storage
- **Expo Local Authentication** - Biometric authentication
- **React Native NetInfo** - Network status monitoring

### **Development Tools**
- **Expo CLI** - Development workflow
- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Getting Started

### **Prerequisites**

Ensure you have the following installed:
- **Node.js** (v16 or later)
- **npm** or **yarn**
- **Git**
- **Expo CLI**: `npm install -g @expo/cli`
- **Expo Go** app on your mobile device (for testing)

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nselenduna/NurseRevalidator.git
   cd NurseRevalidator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on your preferred platform:**
   - **Android**: Press `a` or scan QR code with Expo Go
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Web**: Press `w` for web development

### **Development Workflow**

```bash
# Start development server
npm start

# Start with clear cache
npm start -- --clear

# Run TypeScript checks
npx tsc --noEmit

# Run on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

## 📁 Project Architecture

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (buttons, inputs, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── forms/           # Form-related components
│   └── ui/              # Base UI components
├── screens/             # Application screens
│   ├── dashboard/       # Dashboard screens
│   ├── onboarding/      # Onboarding flow
│   └── registration/    # Registration screens
├── navigation/          # Navigation configuration
├── services/            # API and business logic
│   ├── dashboard/       # Dashboard services
│   ├── storage/         # Local storage services
│   └── validation/      # Form validation logic
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions and constants
    └── constants/       # App constants (colors, routes, etc.)
```

### **Component Organization**

- **`/components/common`**: Reusable components used across multiple screens
- **`/components/dashboard`**: Dashboard-specific UI components
- **`/components/forms`**: Form inputs, validation, and related components
- **`/screens`**: Full-screen components with navigation integration
- **`/services`**: Business logic, API calls, and data management
- **`/hooks`**: Custom React hooks for shared logic
- **`/types`**: TypeScript interfaces and type definitions

## 🎨 Design System

### **Color Palette**
- **Primary**: `#6B46C1` (Purple)
- **Secondary**: `#10B981` (Emerald)
- **Accent**: `#F59E0B` (Amber)
- **Success**: `#059669`
- **Warning**: `#D97706`
- **Error**: `#DC2626`

### **Typography**
- **Display**: System font stack
- **Body**: Optimized for readability
- **Monospace**: Code and data display

### **Spacing System**
Following TailwindCSS spacing scale (4px base unit)

## 📱 Features Overview

### **Dashboard Screen**
- Registration status overview
- CPD progress visualization
- Quick action buttons
- Upcoming reminders
- Statistics and insights

### **Registration Management**
- Professional details form
- Document upload interface
- Status tracking
- Renewal workflows

### **CPD Tracking**
- Activity logging
- Category management
- Evidence attachment
- Progress reports

### **Security Features**
- Biometric login
- Secure data storage
- Privacy controls
- Data export options

## 🔧 Configuration

### **Environment Setup**
Create necessary configuration files for different environments:

```bash
# Development environment
expo start --dev-client

# Production build
expo build --platform all
```

### **Customization**
- **Colors**: Update `src/utils/constants/colors.ts`
- **Routes**: Modify `src/utils/constants/routes.ts`
- **Themes**: Extend TailwindCSS configuration in `tailwind.config.js`

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

### **Development Guidelines**
1. Follow TypeScript best practices
2. Use conventional commit messages
3. Ensure all tests pass
4. Update documentation as needed
5. Follow the established code style

### **Code Style**
- Use TypeScript for all new files
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error boundaries
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

For support, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/Nselenduna/NurseRevalidator/issues)
- **Discussions**: [Join the discussion](https://github.com/Nselenduna/NurseRevalidator/discussions)

---

**Built with ❤️ for healthcare professionals by the Nurse Revalidator team**
