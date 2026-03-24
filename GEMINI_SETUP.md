# Gemini Code Review Setup

This repository includes automated code reviews using Google Gemini AI for all pull requests.

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: Paste your Gemini API key
6. Click **Add secret**

### 3. How It Works

The Gemini code reviewer will:

- ✅ Automatically review all pull requests
- 🔍 Analyze JavaScript, TypeScript, JSON, and YAML files
- 🛡️ Check for security vulnerabilities
- 📈 Identify performance issues
- 🧹 Suggest code quality improvements
- 🐛 Spot potential bugs

### 4. Review Categories

**CRITICAL**: Security vulnerabilities, data leaks
**HIGH**: Performance issues, logic errors
**MEDIUM**: Code quality, maintainability
**LOW**: Style, minor improvements

### 5. Customization

Edit `.github/workflows/gemini-code-review.yml` to:
- Change file types to review
- Modify review criteria
- Adjust the Gemini model (currently using `gemini-1.5-flash`)

### 6. Rate Limits

The workflow includes automatic delays to respect API rate limits. For high-traffic repositories, consider:
- Using a paid Gemini API plan
- Limiting reviews to specific file types
- Adding additional delays between requests