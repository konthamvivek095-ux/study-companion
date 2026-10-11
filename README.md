# Study Companion

A MERN study assistant that turns PDF notes into searchable documents,
AI-generated practice quizzes, and personalized concept review.

[Live Demo](https://study-companion-9o1u.onrender.com) ·
[GitHub Repository](https://github.com/konthamvivek095-ux/study-companion)

## Overview

Study Companion helps students ask questions about their study material,
practice with quizzes, and identify concepts that need another look.

Answers and quiz explanations include supporting document passages
and page numbers so users can check the source material.

## Features

### Authentication
- Account registration and login.
- Password hashing using bcryptjs.
- Persistent sessions stored in MongoDB.
- Logout and authenticated API access.
- Ownership checks for documents and quizzes.

### Document Library
- Upload text-based PDFs.
- Extract text while preserving page numbers.
- Store document metadata and extracted text in MongoDB.
- View uploaded documents and extracted passages.

### Document Questions
- Prepare documents for semantic search.
- Create normalized, 768-dimensional Gemini embeddings.
- Retrieve relevant passages using cosine similarity.
- Generate answers grounded in retrieved passages.
- Display supporting passages and page numbers.
- Return a refusal response when the model determines that the
  retrieved passages cannot support an answer.

### Practice Quizzes
- Generate up to five multiple-choice questions from document passages.
- Provide four options per question.
- Keep the answer key on the server until submission.
- Grade answers on the server.
- Display scores, explanations, and supporting passages.
- Save quiz attempts for practice history.

### Misconception Detective
- Identify concepts associated with incorrect answers.
- Flag repeated mistakes across different questions.
- Use the latest submitted answer to each question.
- Update concept review after quiz submissions.

### Interface
- Responsive React interface.
- Minimal color palette.
- Loading, error, and empty states.
- Expandable source passages.
- Recent practice history.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | bcryptjs, express-session, connect-mongo |
| PDF Processing | Multer, pdf-parse |
| AI Generation | Gemini API, @google/genai |
| Semantic Retrieval | Gemini embeddings, cosine similarity |
| Deployment | Render |
| Version Control | Git, GitHub |

## Architecture

```text
React interface
      |
      | Session-authenticated API requests
      v
Express backend
      |
      +-- MongoDB Atlas
      |     Users, sessions, documents, embeddings,
      |     quizzes, and quiz attempts
      |
      +-- PDF extraction and passage creation
      |
      +-- Gemini API
            Document and question embeddings
            Answer generation
            Quiz generation
```

In local development, Vite forwards `/api` requests to Express.

In production, Express serves the React build and API from the same
origin.

## How Document Q&A Works

1. A user uploads a text-based PDF.
2. The backend extracts text and preserves page numbers.
3. Text is split into passages of up to 1,200 characters, with
   200-character overlap.
4. Clicking **Prepare search** creates document embeddings.
5. Embeddings are normalized and stored in MongoDB.
6. A question is embedded using the retrieval-query task.
7. The backend ranks passages from the selected document by cosine
   similarity.
8. The six highest-ranked passages are sent to Gemini.
9. The backend validates the response structure and citation IDs.
10. The frontend displays the answer and supporting passages.

Similarity ranking currently runs in Node.js. MongoDB stores the
embeddings; Atlas Vector Search is a future improvement.

The model is instructed to use only the supplied passages and to treat
document content as data rather than instructions. These measures
reduce unsupported answers but do not guarantee factual accuracy.
Users should inspect the citations.

## How Quiz Generation Works

1. The user selects an uploaded document.
2. The backend samples up to 12 passages spread across the document.
3. Gemini generates between one and five questions.
4. The backend validates question structure and source IDs.
5. Questions, answers, explanations, and citations are saved.
6. The browser receives questions and options without the answer key.
7. Submitted choices are graded against the stored answers.
8. Results and the attempt are saved.

Quiz submission does not require another Gemini generation request.

Because generation uses sampled passages, a quiz may not cover every
topic in a long document.

## How Misconception Detective Works

The tracker analyzes the latest 100 saved attempts.

For each question, only its latest submitted answer counts. Repeated
submissions of the same question do not count as different questions.

Concept labels are grouped within the same document after normalizing
capitalization, Unicode representation, and spacing.

A concept is flagged for repeated mistakes when at least two different
questions under that label have incorrect latest answers.

Correcting a question on a retry can remove its mistake from the review.

This feature is a rule-based signal to revisit a concept. It does not
diagnose a specific misunderstanding. Labels with different wording
remain separate.

## Project Structure

```text
study-companion/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AskNotes.jsx
│   │   │   ├── ConceptReview.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DocumentLibrary.jsx
│   │   │   ├── IndexDocumentButton.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── PracticeHistory.jsx
│   │   │   ├── QuizPractice.jsx
│   │   │   └── SignupForm.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── middleware/
│   │   └── requireAuth.js
│   ├── models/
│   │   ├── Chunk.js
│   │   ├── Document.js
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   ├── indexing.js
│   │   ├── questions.js
│   │   └── quizzes.js
│   ├── utils/
│   │   ├── buildConceptReview.js
│   │   ├── chunkPages.js
│   │   ├── createEmbeddings.js
│   │   └── semanticRetrieveChunks.js
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## Local Setup

### Requirements

- Node.js 24 and npm.
- A MongoDB Atlas database and database user.
- Your local IP allowed in the Atlas project IP access list.
- A Gemini API key with access to the configured models.

### 1. Clone the Repository

```bash
git clone https://github.com/konthamvivek095-ux/study-companion.git
cd study-companion
```

### 2. Install Dependencies

```bash
npm ci --prefix server
npm ci --prefix client --include=dev
```

### 3. Configure Environment Variables

Create `server/.env`:

```dotenv
PORT=5001
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_random_session_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Replace the placeholder credentials. Use model names available to your
Google project.

Generate a session secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `SESSION_SECRET`.

Never commit the populated `.env` file.

### 4. Start the Backend

From the project root:

```bash
npm run dev --prefix server
```

The default backend address is:

```text
http://localhost:5001
```

Health endpoint:

```text
http://localhost:5001/api/health
```

### 5. Start the Frontend

Open another terminal in the project root:

```bash
npm run dev --prefix client
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

## Using the App

1. Register an account and log in.
2. Upload a text-based PDF.
3. Click **Prepare search** for that document.
4. Select it in **Ask your notes** and enter a question.
5. Expand citations to inspect supporting passages.
6. Select a document in **Practice with your notes**.
7. Generate a quiz and answer every question.
8. Submit answers and review the explanations.
9. Check practice history and concepts to revisit.

After uploading a document, use **Refresh list** in the question or quiz
section if it does not appear immediately.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Backend and database status |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user |
| POST | `/api/auth/logout` | Log out |
| POST | `/api/documents` | Upload a PDF |
| GET | `/api/documents` | List the user's documents |
| GET | `/api/documents/:documentId/chunks` | Get document passages |
| POST | `/api/documents/:documentId/index` | Prepare semantic search |
| POST | `/api/questions` | Ask a document question |
| POST | `/api/quizzes` | Generate a quiz |
| POST | `/api/quizzes/:quizId/submit` | Submit and grade answers |
| GET | `/api/quizzes/attempts` | Get recent practice history |
| GET | `/api/quizzes/concept-review` | Get concepts to revisit |

Document, question, and quiz endpoints require authentication.
Protected resources are checked against the logged-in user's ownership.

## Checks and Validation

Run frontend linting:

```bash
npm run lint --prefix client
```

Build the frontend:

```bash
npm run build --prefix client
```

Manual checks performed during development include:

- Registration, login, session refresh, and logout.
- PDF upload and text extraction.
- Embedding creation and reuse during repeated indexing.
- Supported answers with citations.
- Refusal for questions unsupported by retrieved passages.
- Quiz generation, submission, and scoring.
- Practice history and concept review display.
- Another account receiving 404 for a user's document.
- Another account receiving 404 when submitting a user's quiz.
- Logged-out access to practice history receiving 401.

These manual checks do not replace an automated test suite or measure
overall AI accuracy.

## Deployment on Render

The app runs as one Node web service.

### Service Configuration

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | Leave empty |
| Runtime | Node |
| Health Check Path | `/api/health` |

Build command:

```bash
npm ci --prefix client --include=dev && npm ci --prefix server && npm run build --prefix client
```

Start command:

```bash
npm start --prefix server
```

### Environment Variables

Configure these in Render:

```text
NODE_ENV=production
NODE_VERSION=24.21.0
MONGODB_URI=<your MongoDB connection string>
SESSION_SECRET=<your production session secret>
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=<your supported generation model>
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Allow every outbound IP range listed for the Render service in the
MongoDB Atlas project IP access list.

## Limitations

- Uploads are limited to 5 MB and 100 pages.
- Scanned PDFs require OCR, which is not implemented.
- Search indexing supports at most 200 passages per document.
- Retrieval searches one selected document at a time.
- Gemini quotas can temporarily prevent answers and quiz generation.
- Quiz generation samples passages and may not cover every topic.
- AI-generated content can contain mistakes.
- Practice history displays the latest 20 attempts.
- Concept review analyzes the latest 100 attempts.
- Concept labels with different wording are not merged.
- Render's Free instance can delay the first request after inactivity.

## Future Improvements

- OCR for scanned study material.
- Semantic search across multiple documents.
- MongoDB Atlas Vector Search for larger collections.
- Consistent concept labels across generated quizzes.
- Targeted practice for flagged concepts.
- Automated API and authorization tests.
- Retrieval-quality and answer-grounding evaluation.
- Pagination for document and practice history lists.

## Author

**Kontham Vivek**

- [GitHub](https://github.com/konthamvivek095-ux)
- [Project Repository](https://github.com/konthamvivek095-ux/study-companion)
- [Live Demo](https://study-companion-9o1u.onrender.com)