# Study Companion

A MERN study assistant that turns PDF notes into searchable
documents, practice quizzes, and personalized concept review.

## Features

- Account registration and login with persistent sessions.
- PDF upload and page-aware text extraction.
- Semantic search using Gemini embeddings.
- Document-grounded AI answers with source passages and page numbers.
- AI-generated multiple-choice quizzes.
- Server-side scoring with explanations and citations.
- Saved practice history.
- Misconception Detective for identifying concepts to revisit.
- Responsive interface with a minimal design.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | bcryptjs, express-session, connect-mongo |
| PDF Processing | Multer, pdf-parse |
| AI | Gemini API, @google/genai |
| Search | Embeddings and cosine similarity |
| Hosting | Render |

## How It Works

### Document Questions

Uploaded PDFs are split into overlapping, page-aware passages.
The backend creates normalized 768-dimensional embeddings and
stores them in MongoDB.

When a user asks a question, the backend embeds the question and
ranks the document passages using cosine similarity in Node.js.
Gemini receives the six highest-ranked passages and is instructed
to answer using only their content.

Answers include supporting passages for the user to inspect.
AI answers can still contain mistakes.

### Practice Quizzes

Gemini generates up to five multiple-choice questions from
passages sampled across the selected document.

Correct answers remain on the server until submission.
The backend grades the answers and saves the attempt.

### Misconception Detective

The tracker reviews the latest 100 saved attempts and uses only
the latest answer to each question.

A concept is flagged for repeated mistakes when at least two
different questions with the same normalized concept label have
incorrect latest answers in the same document.

This is a rule-based signal to review a topic. Concept labels
with different wording remain separate.

## Run Locally

### Requirements

- Node.js 24 and npm.
- MongoDB Atlas connection string.
- Gemini API key.
- Your local IP allowed in MongoDB Atlas.

### Install

```bash
git clone https://github.com/konthamvivek095-ux/study-companion.git
cd study-companion
npm ci --prefix server
npm ci --prefix client --include=dev
```

### Environment Variables

Create `server/.env` and fill in these values:

```dotenv
PORT=5001
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_random_session_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Use models available to your Google project.

Generate a session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not commit your populated `.env` file.

### Start the App

From the project root, start the backend:

```bash
npm run dev --prefix server
```

In a second terminal, start the frontend:

```bash
npm run dev --prefix client
```

Open the frontend URL printed by Vite, usually
http://localhost:5173.

## Code Checks

```bash
npm run lint --prefix client
npm run build --prefix client
```

## Deployment

The app runs as one Render Node web service.
Express serves both the React production build and the API.

Leave Root Directory empty.

Build command:

```bash
npm ci --prefix client --include=dev && npm ci --prefix server && npm run build --prefix client
```

Start command:

```bash
npm start --prefix server
```

Configure the environment variables in Render, including
`NODE_ENV=production`, and allow the service's outbound IP
ranges in MongoDB Atlas.

## Limitations

- PDF uploads are limited to 5 MB and 100 pages.
- Scanned PDFs are not supported without OCR.
- Search indexing supports at most 200 passages per document.
- Search operates on one selected document at a time.
- AI features depend on available Gemini quota.
- Quizzes sample document passages and may not cover every topic.
- Practice history displays the latest 20 attempts.
- AI-generated answers and quizzes should be checked against sources.

## Future Improvements

- OCR for scanned PDFs.
- Search across multiple documents.
- Atlas Vector Search for larger document collections.
- Consistent concept labels across quizzes.
- Targeted quizzes for concepts with repeated mistakes.
- Automated API tests and retrieval-quality evaluation.

## Author

Kontham Vivek

GitHub: https://github.com/konthamvivek095-ux