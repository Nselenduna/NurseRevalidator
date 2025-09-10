# Contributing to Nurse Revalidator

We're thrilled that you're interested in contributing to Nurse Revalidator! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js (v16 or later)
- npm or yarn
- Git
- Expo CLI
- A GitHub account
- Basic knowledge of React Native and TypeScript

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/NurseRevalidator.git
   cd NurseRevalidator
   ```
3. **Add the original repository** as upstream:
   ```bash
   git remote add upstream https://github.com/Nselenduna/NurseRevalidator.git
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```
5. **Start the development server:**
   ```bash
   npm start
   ```

## 📝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Device/platform information**
- **App version** and **environment details**

Use the bug report template when available.

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear description** of the feature
- **Use case** and **motivation**
- **Possible implementation** approach
- **Alternative solutions** considered

### Pull Requests

1. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** with descriptive messages:
   ```bash
   git commit -m "feat: add amazing feature for user registration"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots (for UI changes)
   - Testing instructions

## 🎯 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new files
- **Functional Components**: Prefer function components with hooks
- **Naming Conventions**:
  - Components: PascalCase (`UserProfile.tsx`)
  - Files: camelCase (`userService.ts`)
  - Variables/Functions: camelCase (`getUserData`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Component Structure

```typescript
// ComponentName.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface ComponentNameProps {
  title: string;
  onPress?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onPress,
}) => {
  return (
    <View className="p-4 bg-white rounded-lg">
      <Text className="text-lg font-semibold">{title}</Text>
    </View>
  );
};
```

### Styling Guidelines

- **Use NativeWind** for styling (TailwindCSS classes)
- **Follow design system** colors and spacing
- **Ensure accessibility** with proper semantics
- **Test on multiple screen sizes**

### Git Commit Messages

Follow the conventional commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting (no functional changes)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```bash
feat: add biometric authentication to login screen
fix: resolve navigation issue on Android devices
docs: update installation instructions
style: format code with prettier
refactor: extract user validation logic to service
test: add unit tests for registration form
chore: update dependencies to latest versions
```

### Testing

- **Write tests** for new features and bug fixes
- **Ensure existing tests pass**
- **Test on both iOS and Android**
- **Verify accessibility** features work correctly

### Documentation

- **Update README** if needed
- **Add JSDoc comments** for complex functions
- **Update type definitions**
- **Include inline comments** for complex logic

## 📂 Project Structure

When adding new files, follow the established structure:

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── dashboard/       # Dashboard-specific
│   ├── forms/           # Form components
│   └── ui/              # Base UI components
├── screens/             # Screen components
├── navigation/          # Navigation setup
├── services/            # Business logic
├── hooks/               # Custom hooks
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## 🔍 Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** on multiple devices/platforms
4. **Documentation review**
5. **Final approval** and merge

## 🎉 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation

## 💬 Communication

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Request Comments**: For code-specific discussions

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Expo Documentation](https://docs.expo.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [NativeWind Documentation](https://www.nativewind.dev/)

## ❓ Questions?

If you have questions about contributing, feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions
- Reach out to the maintainers

Thank you for contributing to Nurse Revalidator! 🩺✨