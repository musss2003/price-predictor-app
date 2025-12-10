# 📱 Price Predictor Mobile App (React Native + Expo)

A cross-platform mobile application built with **React Native and Expo** that connects to a **Machine Learning API** to predict real estate prices based on user input (city, square meters, floor, and year built).

This project is designed as a **mobile frontend** for an ML price-prediction system and works on:

- ✅ Web (browser preview)
- ✅ Android
- ✅ iOS

---

## 🚀 Features

- 📊 Property price prediction using ML backend
- 🏙️ City, square meters, floor, and build year input
- ⚡ Real-time API communication
- ⏳ Loading state & error handling
- 📱 Mobile-first UI design
- 🌐 Web preview for fast development
- 🔗 Ready for Android & iOS builds

---

## 🛠️ Tech Stack

**Frontend:**
- React Native
- Expo
- TypeScript
- Fetch API

**Backend (connected separately):**
- FastAPI / Flask / Node.js
- Machine Learning prediction model

---

## 📂 Project Structure

```

price-predictor-app/
├── app/
│   └── index.tsx      # Main mobile screen
├── assets/
├── package.json
└── app.json

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/price-predictor-app.git
cd price-predictor-app
````

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the Development Server

```bash
npm start
```

Then press:

```bash
w
```

to open the app in **web mode** on your laptop.

---

## 📡 Backend Connection

This app expects a running backend API at:

```
POST /predict
```

Example request body:

```json
{
  "city": "Sarajevo",
  "m2": 55,
  "floor": 2,
  "built": 2015
}
```

Example response:

```json
{
  "price": 137500
}
```

⚠️ Important:

* If testing from a real phone, you **must use your local IP**, not `localhost`.

---

## ✅ Example FastAPI Backend (Minimal)

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Property(BaseModel):
    city: str
    m2: float
    floor: int
    built: int

@app.post("/predict")
def predict_price(data: Property):
    price = data.m2 * 2500
    return { "price": price }
```

Run it using:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📱 Running on a Real Phone (Optional)

1. Install **Expo Go** from Play Store / App Store
2. Run:

```bash
npm start
```

3. Scan the QR code

✅ App opens instantly on your phone.

---

## 🎯 Future Features

* ✅ Prediction history
* ✅ User authentication
* ✅ Charts & price trends
* ✅ Google Maps location picker
* ✅ Cloud deployment
* ✅ Google Play Store release

---

## 👨‍💻 Author

**Mustafa Sinanović**
Software Engineering Student
Specialized in Full-Stack & Machine Learning Applications

GitHub: [https://github.com/musss2003](https://github.com/musss2003)

---

## 📄 License

This project is licensed under the **MIT License**.
