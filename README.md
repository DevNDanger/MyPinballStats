# My Pinball Stats

A mobile-first personal pinball statistics dashboard that pulls data from IFPA (International Flipper Pinball Association), Match Play Events, and Stern Insider Connected APIs. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive layout
- 🎯 **Dual API Integration**: Combines data from IFPA and Match Play Events
- ⚡ **Server-Side Data Fetching**: Uses Next.js route handlers for secure API calls
- 💾 **Smart Caching**: In-memory cache with TTL to reduce API calls
- 🔒 **Rate Limiting**: Basic rate limiting to prevent API abuse
- 🔄 **Manual Refresh**: Bypass cache on demand
- 🎨 **Dark Mode Support**: Automatic dark/light theme based on system preferences

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: IFPA API, Match Play Events API
- **Deployment Ready**: Vercel, Netlify, or any Node.js host

## Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- IFPA API key
- Match Play API token

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MyPinballStats.git
cd MyPinballStats
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API credentials:

```env
# IFPA API Configuration
IFPA_API_KEY=your_actual_ifpa_api_key_here

# Match Play API Configuration
MATCHPLAY_API_TOKEN=your_actual_matchplay_token_here

# Default Player IDs (update with your IDs)
DEFAULT_IFPA_PLAYER_ID=67715
DEFAULT_MATCHPLAY_PLAYER_ID=37737
```

### 4. Get Your API Keys

#### IFPA API Key

1. Visit [IFPA API Documentation](https://www.ifpapinball.com/api/documentation/)
2. Register for an API key
3. Add to `.env.local` as `IFPA_API_KEY`

#### Match Play API Token

1. Visit [Match Play Events](https://matchplay.events/)
2. Log in to your account
3. Navigate to Settings > API Access
4. Generate an API token
5. Add to `.env.local` as `MATCHPLAY_API_TOKEN`

### 5. Find Your Player IDs

#### IFPA Player ID

1. Visit [IFPA Player Search](https://www.ifpapinball.com/player.php)
2. Search for your name
3. Your player ID is in the URL: `ifpapinball.com/player.php?p=YOUR_ID`

#### Match Play User ID

1. Visit your Match Play profile
2. Your user ID is in the URL: `matchplay.events/users/YOUR_ID`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
MyPinballStats/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── ifpa/me/           # IFPA player data endpoint
│   │   ├── matchplay/me/      # Match Play user data endpoint
│   │   ├── combined/me/       # Combined dashboard data
│   │   └── refresh/           # Cache management endpoint
│   ├── layout.tsx             # Root layout component
│   ├── page.tsx               # Main dashboard page
│   └── globals.css            # Global styles
├── lib/
│   ├── providers/
│   │   ├── ifpa.ts           # IFPA API provider
│   │   └── matchplay.ts      # Match Play API provider
│   ├── cache.ts              # In-memory caching system
│   ├── http.ts               # HTTP utilities & error handling
│   └── types.ts              # TypeScript type definitions
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI workflow
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.js            # Next.js configuration
├── CONTRIBUTING.md           # Contribution guidelines
├── SECURITY.md               # Security policy
└── README.md                 # This file
```

## API Endpoints

### `/api/combined/me`

Returns combined player data from both IFPA and Match Play.

**Query Parameters:**
- `ifpaId` (optional): Override default IFPA player ID
- `matchPlayId` (optional): Override default Match Play user ID
- `refresh=true` (optional): Bypass cache

**Response:**
```json
{
  "success": true,
  "data": {
    "identity": {
      "name": "Player Name",
      "location": "City, State",
      "ifpa_id": 67715,
      "matchplay_id": 37737
    },
    "ifpa": {
      "rank": 1234,
      "wppr": 45.67,
      "lastMonthRank": 1250,
      "lastYearRank": 1100
    },
    "matchplay": {
      "totalEvents": 25,
      "activeEvents": 3,
      "completedEvents": 22,
      "winRate": 0.35
    },
    "lastUpdated": "2026-02-09T12:00:00.000Z"
  },
  "cached": false,
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

### `/api/ifpa/me`

Returns IFPA player data only.

**Query Parameters:**
- `playerId` (optional): Override default IFPA player ID
- `refresh=true` (optional): Bypass cache

### `/api/matchplay/me`

Returns Match Play user data only.

**Query Parameters:**
- `userId` (optional): Override default Match Play user ID
- `refresh=true` (optional): Bypass cache

### `/api/refresh`

Cache management endpoint.

**Methods:**
- `GET`: Get cache statistics
- `POST`: Clear cache (optional `?pattern=` query param to clear specific entries)

## Caching Strategy

- **TTL**: 15 minutes default for player data
- **Rate Limiting**: 10 requests per minute per IP
- **Manual Refresh**: Use the "Refresh Data" button or add `?refresh=true` to API calls

## Known Limitations & TODOs

The API providers (`lib/providers/ifpa.ts` and `lib/providers/matchplay.ts`) contain TODO comments marking areas where endpoint structures may need adjustment based on actual API responses. These include:

- IFPA API endpoint paths and response structures
- Match Play API endpoint paths and authentication
- Field mappings between API responses and internal types

**These TODOs do not break compilation** - the code will compile and run, but you may need to adjust endpoints once you test with real API credentials.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Netlify

1. Push code to GitHub
2. Connect repository in Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables in Netlify settings

## Create GitHub Repository & Push

To initialize this project as a Git repository and push to GitHub:

```bash
# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: My Pinball Stats"

# Create a new repository on GitHub (via web interface)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/MyPinballStats.git
git branch -M main
git push -u origin main
```

**Alternative: Using GitHub CLI**

```bash
# Initialize and add files
git init
git add .
git commit -m "Initial commit: My Pinball Stats"

# Create GitHub repo and push (requires GitHub CLI)
gh repo create MyPinballStats --public --source=. --remote=origin
git push -u origin main
```

## CI/CD

This project includes a GitHub Actions workflow that runs on every push and pull request:

- ✅ Installs dependencies (`npm ci`)
- ✅ Runs ESLint (`npm run lint`)
- ✅ Type checks with TypeScript (`npm run typecheck`)
- ✅ Builds the application (`npm run build`)

The workflow tests against Node.js versions 18.x and 20.x.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Security

See [SECURITY.md](SECURITY.md) for security policy and reporting vulnerabilities.

## License

MIT License - feel free to use this project for personal or educational purposes.

## Acknowledgments

- [IFPA](https://www.ifpapinball.com/) - International Flipper Pinball Association
- [Match Play Events](https://matchplay.events/) - Tournament management platform
- Built with [Next.js](https://nextjs.org/)

---

**Note**: This is a personal project for tracking pinball statistics. API endpoints may require adjustment based on actual API documentation and responses. Check the TODO comments in provider files for areas that may need customization.
