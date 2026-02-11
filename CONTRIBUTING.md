# Contributing to Pinball Stats Dashboard

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/PinballStats.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit with clear messages: `git commit -m "Add: feature description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Code Standards

- **TypeScript**: All code must be properly typed
- **ESLint**: Run `npm run lint` before committing
- **Formatting**: Use consistent formatting (2 spaces, semicolons)
- **Testing**: Ensure the build passes with `npm run build`

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include a clear description of changes
- Update documentation if needed
- Ensure CI checks pass (lint, typecheck, build)
- Reference any related issues

## Code Review Process

1. Maintainers will review PRs within a few days
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Reporting Issues

- Use GitHub Issues to report bugs
- Include steps to reproduce the issue
- Provide environment details (OS, Node version, etc.)
- Check for existing issues before creating new ones

## Questions?

Feel free to open an issue for questions or discussions.

Thank you for contributing! 🎉
