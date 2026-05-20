# Expense Tracker — AI-Powered Finance Manager

A modern full-stack personal finance application with **AI receipt scanning**, income/expense tracking, budgets, savings analytics, and a beautiful responsive dashboard.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, Recharts, Axios
- **Backend:** Node.js, Express.js, Multer
- **Database:** MongoDB
- **Auth:** JWT
- **OCR / AI:** Tesseract.js (default, free) · optional Google Cloud Vision API
- **Charts:** Recharts

## Features

### Core Finance
- Secure JWT authentication (Register, Login, Logout, Protected Routes)
- Income & expense tracking with categories
- Dashboard: balance, income, expenses, savings
- Reports: monthly spending, category charts, income vs expense
- Budget planning with overrun warnings
- Transaction history with search & filters
- Dark / light mode · fully responsive UI

### AI Receipt Scanner
- Upload from **device storage**, **camera**, **drag & drop**, or **gallery**
- OCR extracts: **amount**, **date**, **merchant**, **category**, **tax**, **payment method**, **line items**
- **Auto-fills** the expense form — edit before saving
- **Automatic categorization** from merchant/receipt keywords
- Receipt images stored and linked to transactions

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas

## Getting Started

### 1. Install dependencies

```bash
cd "d:\Expense tracker"
npm install
```

### 2. Environment variables

**Backend** — `backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/expense-tracker
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
OCR_ENGINE=tesseract
# Optional: GOOGLE_VISION_API_KEY=your_key
# Optional: OCR_ENGINE=google
```

**Frontend** — `frontend/.env`:

```
DANGEROUSLY_DISABLE_HOST_CHECK=true
HOST=localhost
REACT_APP_API_URL=/api
REACT_APP_SERVER_URL=http://localhost:5000
```

### 3. Start MongoDB

Windows: Services → **MongoDB Server** → Start

### 4. Run the app

```bash
npm start
```

- **App UI:** http://localhost:3000  
- **API:** http://localhost:5000  

### 5. Use AI Scanner

1. Sign up / log in  
2. Go to **AI Scanner** in the sidebar  
3. Upload or photograph a receipt  
4. Click **Scan & Extract Data**  
5. Review auto-filled fields → **Save Transaction**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/transactions` | List / create |
| PUT/DELETE | `/api/transactions/:id` | Update / delete |
| **POST** | **`/api/receipts/scan`** | **OCR receipt scan (multipart)** |
| GET | `/api/dashboard` | Analytics |
| GET/POST | `/api/budget` | Budget |

## Project Structure

```
expense-tracker/
├── backend/
│   ├── controllers/     # auth, transactions, receipts
│   ├── services/        # ocrService, receiptParser
│   ├── middleware/      # auth, upload (multer)
│   ├── models/
│   ├── routes/
│   └── uploads/receipts/
└── frontend/
    └── src/
        ├── components/  # ReceiptScanner, TransactionForm, ...
        └── pages/       # ScanReceipt, Dashboard, ...
```

## Troubleshooting

### App not opening
Run `npm start` from project root. Open **http://localhost:3000** (not port 5000).

### Connection failed
Ensure MongoDB is running and both server + `Compiled successfully!` appear in the terminal.

### OCR slow or inaccurate
- Use a clear, well-lit photo  
- Crop to the receipt area  
- For better accuracy, set `GOOGLE_VISION_API_KEY` and `OCR_ENGINE=google` in `backend/.env`

## License

MIT
