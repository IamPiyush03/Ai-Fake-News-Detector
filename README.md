# 🔍 AI Fake News Detector

An intelligent news analysis system that leverages AI to detect fake news in real-time. Built with the MERN stack and powered by Hugging Face's NLP models.

# Demo 
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue)](https://ai-fake-news-detector.vercel.app/)  
[![Backend API](https://img.shields.io/badge/Backend-API-green)](https://ai-fake-news-detector-backend.onrender.com)

## ⚠️ Current Status

**Last Commit Notice**: The most recent update contains some unresolved errors. I'm actively working on:
- Fixing API endpoint inconsistencies
- Resolving dependency conflicts
- Addressing authentication flow issues

## ✨ Features

- 🤖 **Real-time AI-powered news analysis**: Automatically detects fake news using natural language processing (NLP) models.
- 🔗 **URL content scraping**: Enter a URL, and the system scrapes the content for analysis.
- 📊 **Interactive analytics dashboard**: View detailed insights and statistics of your analyzed news articles.
- 📱 **Responsive Material-UI design**: Optimized for all screen sizes.
- 🔐 **Secure user authentication**: JWT-based login to keep user data safe.
- 📜 **Analysis history tracking**: Save your analysis results for future reference and trends.

## 🛠️ Tech Stack

### Frontend
- **React.js**: A JavaScript library for building user interfaces.
- **Material-UI**: A React component library for faster and easier web development.
- **Chart.js**: A simple yet flexible JavaScript charting library for data visualization.
- **React Router**: A library for handling routing in a React application.
- **Axios**: Promise-based HTTP client for making requests to the backend API.

### Backend
- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for storing user data and analysis history.
- **JWT Authentication**: Secure authentication for user sessions.
- **Hugging Face API**: AI-powered NLP models for fake news detection.

## 🚀 Live Links

- **Frontend**: [https://ai-fake-news-detector.vercel.app/](https://ai-fake-news-detector.vercel.app/)
- **Backend**: [https://ai-fake-news-detector-backend.onrender.com](https://ai-fake-news-detector-backend.onrender.com)

## 💻 Local Development

### Prerequisites
- **Node.js** (v14+ recommended)
- **MongoDB** (Locally or via a cloud service like Atlas)
- **Hugging Face API key** (for NLP model access)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/iampiyush03/ai-fake-news-detector.git
cd ai-fake-news-detector
```

2. **Set up Environment Variables**

Create a `.env` file in the server directory with the following values:

```bash
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

3. **Install Dependencies**

Install server dependencies:

```bash
cd server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
```

4. **Run the Application**

Start the server (from the `server` directory):

```bash
npm start
```

Start the client (from the `client` directory):

```bash
npm run dev
```

## 📱 Usage

### Register/Login to your account

- Create an account or log in to start analyzing news articles.

### Enter a news article text or URL

- Paste an article's text or a link to an article for analysis.

### Click "Analyze" to get real-time results

- The system will detect whether the news is likely fake or real using AI models.

### View your analysis history in the dashboard

- Check past analysis results and see trends in fake news over time.

### Track statistics and trends over time

- The dashboard provides visual charts of fake news trends and the most frequently analyzed articles.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a pull request to fix bugs, improve features, or add new functionality. Make sure to follow the guidelines for submitting changes.

## 👨‍💻 Author

**Piyush**  
[GitHub: @Iampiyush03](https://github.com/Iampiyush03)  
