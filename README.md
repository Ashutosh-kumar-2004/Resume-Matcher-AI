# ResumeMatch AI

ResumeMatch AI is a full-stack web app that helps users evaluate resumes with AI-powered feedback, compare resumes against job descriptions, and manage chat-based analysis sessions in a clean dashboard experience.

This README includes product usage, setup, architecture overview, project structure, and API endpoint references.

## Table of Contents

- Overview
- Key Features
- Tech Stack
- Prerequisites
- Environment Configuration
- Local Setup
- Run the App
- How to Use
- Theming
- Limits and Behavior
- Architecture
- Project Structure
- API Documentation
- Troubleshooting
- Security Notes
- Contributing
- License

## Overview

ResumeMatch AI allows users to:

- Upload PDF resumes for analysis
- Optionally include job descriptions for targeted matching
- Receive structured AI feedback (strengths, weaknesses, improvements, readiness, next steps)
- Continue analysis in persistent chat sessions
- Manage profile and account settings

The app is designed for practical, iterative resume improvement workflows.

## Key Features

### Authentication and Session Flow

- Sign up and login experience
- Session-based authenticated routes
- Protected user areas for core app functionality

### AI Resume Analysis

- Resume-only and resume-plus-context analysis modes
- Structured response rendering with readable sections
- Improved prompt quality and response shaping for actionable results

### Chat Experience

- New chat creation and chat history navigation
- Rename and delete chat operations
- Message rendering for both user and assistant content
- Full user message visibility in chat bubbles

### File Handling

- PDF upload support
- File chips in chat messages
- Open/download flow for uploaded file content
- Per-chat file cap with clear UX messaging

### User Experience Enhancements

- Dark mode enabled by default
- Tooltip text on action buttons (attach/send)
- Outside-click behavior for sidebar/menu close interactions
- Dedicated custom 404 page
- Landing page at `/`

## Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT-based auth

### AI + Document Processing

- Groq SDK
- PDF parsing and generated PDF output handling

## Prerequisites

Install the following before running locally:

- Node.js 18+
- npm 9+
- MongoDB (local or remote instance)

## Environment Configuration

Create/update environment files as needed.

### Server `.env`

Required variables typically include:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `JWT_COOKIE_EXPIRE`
- `PORT`
- `NODE_ENV`
- `CLIENT_URL`
- `EMAIL_SERVICE`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `GROQ_API_KEY`
- `GROQ_MODEL`

Optional limits:

- `MAX_RESUME_FILE_SIZE_BYTES`
- `MAX_RESUME_TEXT_CHARS`
- `MAX_JOB_DESCRIPTION_CHARS`
- `MAX_CHAT_MESSAGE_CHARS`

## Local Setup

1. Clone the repository.
2. Install dependencies for both client and server.
3. Configure your environment variables.
4. Start backend and frontend servers.

### Install Dependencies

From project root:

```bash
cd server
npm install

cd ../client
npm install
```

## Run the App

Start backend:

```bash
cd server
npm run dev
```

Start frontend:

```bash
cd client
npm run dev
```

Default local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## How to Use

1. Open the landing page.
2. Sign up or log in.
3. Create a new chat.
4. Upload a resume PDF (optional with message/job text).
5. Review AI feedback sections.
6. Iterate with follow-up prompts in chat.
7. Manage profile/settings from sidebar user menu.

## Theming

- Dark theme is the default when no preference exists.
- Theme can be toggled from the user menu.
- Theme preference is stored in session storage.

## Limits and Behavior

- Chat history cap per user is enforced.
- File cap per chat is enforced.
- When a chat reaches the file limit, input is replaced with guidance to start a new chat.

## Architecture

ResumeMatch AI follows a client-server architecture.

### High-Level Components

- React frontend for UI, route handling, and user interaction.
- Express backend for authentication, profile management, chat, and analysis orchestration.
- MongoDB for persistence of users, chats, messages, and attached file metadata.
- Groq model integration for resume analysis generation.

### Request Flow (Typical Resume Analysis)

1. User authenticates and opens a protected page.
2. Frontend sends authenticated request with message and optional resume PDF.
3. Backend validates auth and file constraints.
4. Backend extracts PDF text and prepares model prompt.
5. Backend requests analysis from Groq model.
6. Backend stores user/assistant message history in chat context.
7. Frontend renders structured response sections in chat UI.

### Security and Session Notes

- Protected routes are enforced server-side with auth middleware.
- Frontend uses authenticated-only pages for dashboard/profile/settings/chat views.
- CORS is configured with credentials and explicit allowed methods.

## Project Structure

```text
resume-checker/
	README.md
	client/
		index.html
		package.json
		vite.config.js
		public/
		src/
			App.jsx
			App.css
			main.jsx
			appRoutes/
				AppRoutes.jsx
			assets/
			components/
				auth/
					LoginPage.jsx
					SignUpPage.jsx
				dashboard/
					Dashboard.jsx
				home/
					HomePage.jsx
				navbar/
					Navbar.jsx
				notFound/
					NotFoundPage.jsx
				popUpModal/
					PopUpModal.jsx
				profile/
					ProfilePage.jsx
				settings/
					SettingsPage.jsx
				sidebar/
					sidebar.jsx
			hooks/
				auth/
					useLogin.jsx
					useSignUp.jsx
				popUps/
					useModal.jsx
			layouts/
				MainLayout.jsx
			services/
				apiClient.jsx
	server/
		app.js
		constants.js
		index.js
		package.json
		config/
			db.js
		controllers/
			authController.js
			chatController.js
			passwordController.js
			profileController.js
			resumeController.js
		middleware/
			authMiddleware.js
		models/
			Chat.js
			Message.js
			User.js
		routes/
			authRoutes.js
			chatRoutes.js
			passwordRoutes.js
			profileRoutes.js
			resumeRoutes.js
		services/
			chatCleanupService.js
			emailService.js
```

## API Documentation

Base URL (local): `http://localhost:5000`

### Health

- `GET /api/health`
- Purpose: service health check.
- Auth required: No.

### Authentication

- `POST /api/auth/signup`
- Purpose: create a new user account.
- Auth required: No.

- `POST /api/auth/login`
- Purpose: authenticate existing user.
- Auth required: No.

- `POST /api/auth/logout`
- Purpose: terminate user session.
- Auth required: No (safe to call either way).

### Password

- `POST /api/password/forgot-password`
- Purpose: request password reset link/token flow.
- Auth required: No.

- `POST /api/password/reset-password/:token`
- Purpose: reset password using token.
- Auth required: No.

- `POST /api/password/validate-token/:token`
- Purpose: validate reset token before submission.
- Auth required: No.

- `POST /api/password/change-password`
- Purpose: change password for logged-in user.
- Auth required: Yes.

### Profile

- `GET /api/profile`
- Purpose: fetch current authenticated profile.
- Auth required: Yes.

- `PUT /api/profile/update`
- Purpose: update authenticated user profile details.
- Auth required: Yes.

- `DELETE /api/profile/delete`
- Purpose: delete authenticated user profile.
- Auth required: Yes.

- `GET /api/profile/:userId`
- Purpose: fetch public profile by user ID.
- Auth required: No.

### Chats

- `POST /api/chats`
- Purpose: create chat.
- Auth required: Yes.

- `GET /api/chats`
- Purpose: list current user chats.
- Auth required: Yes.

- `PATCH /api/chats/:chatId`
- Purpose: rename chat title.
- Auth required: Yes.

- `DELETE /api/chats/:chatId`
- Purpose: delete chat and related message history.
- Auth required: Yes.

- `GET /api/chats/:chatId/messages`
- Purpose: fetch chat messages.
- Auth required: Yes.

- `POST /api/chats/:chatId/messages`
- Purpose: create message in existing chat.
- Auth required: Yes.

- `DELETE /api/chats/:chatId/messages/:messageId/files/:fileIndex`
- Purpose: delete a file from message attachments.
- Auth required: Yes.

- `GET /api/chats/:chatId/messages/:messageId/files/:fileIndex/open`
- Purpose: open/download attachment content.
- Auth required: Yes.

- `GET /api/chats/:chatId/messages/:messageId/files/:fileIndex/content`
- Purpose: retrieve attachment content payload.
- Auth required: Yes.

### Resume Analysis

- `POST /api/resume/analyze`
- Purpose: run AI analysis on message + optional resume PDF.
- Auth required: Yes.
- Content type: `multipart/form-data` when uploading file.
- File constraints: PDF only, size controlled by `MAX_RESUME_FILE_SIZE_BYTES`.

### Common Response Shape

Most endpoints follow a JSON response style with `success` and `data` (or `message`) fields.

### Authentication Handling

- Backend expects authenticated requests on protected endpoints.
- Frontend sends credentials and token/session context via configured client.
- Ensure CORS `origin`, `credentials`, and methods are aligned with frontend origin.

## Troubleshooting

### App does not start

- Confirm MongoDB is running and reachable.
- Verify server `.env` values are present and valid.
- Ensure ports are not already in use.

### Authentication issues

- Check `JWT_SECRET` is set.
- Clear browser session storage and re-login.
- Confirm client URL matches server CORS/client config.

### AI analysis failures

- Verify `GROQ_API_KEY` is valid.
- Confirm selected `GROQ_MODEL` is available.
- Retry with smaller input if payload is too large.

### Email-related issues

- Validate SMTP host/port/user/password.
- Confirm provider-specific app password rules (if applicable).

## Security Notes

- Never commit real credentials to version control.
- Use strong, unique values for all secrets.
- Rotate keys immediately if any secret is exposed.
- Keep `.env` files local and out of public repositories.

## Contributing

1. Create a feature branch.
2. Make focused, tested changes.
3. Open a pull request with a clear summary.

## License

Add your preferred license text or a `LICENSE` file for open-source distribution.
