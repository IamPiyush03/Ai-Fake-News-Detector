

# AI Fake News Detector

AI-powered news analysis system built with the MERN stack and Cohere API to detect fake news in real-time.

---

## Tech Stack
- **Frontend**: React.js, Material-UI
- **Backend**: Node.js, Express.js, MongoDB
- **AI**: Cohere API

---

## Features
- Real-time news analysis
- URL content scraping
- User authentication
- Analysis history tracking
- Interactive user dashboard

---

## Quick Start

### Step 1: Install Dependencies
```bash
# Navigate to the server folder and install dependencies
cd server && npm install

# Navigate to the client folder and install dependencies
cd client && npm install
```

### Step 2: Set Up Environment Variables
Create a `.env` file in the **server** directory with the following:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
COHERE_API_KEY=your_cohere_api_key
```

### Step 3: Run the Application
- **Terminal 1**: Start the server
  ```bash
  cd server && npm start
  ```
- **Terminal 2**: Start the client
  ```bash
  cd client && npm run dev
  ```

---

## License
This project is licensed under the MIT License. See the LICENSE file for details. 

---

Feel free to add sections like "Contributing" or "API Documentation" as needed! Let me know if you'd like help expanding this.
