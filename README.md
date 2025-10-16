# MERN-FINAL-PROJECT
MERN final project for PLP
■ Project Overview
This project is a **web application** that lets users:
1. **Create or upload questionnaires** (like a survey).
2. **Generate a shareable link** to send to respondents.
3. **Collect responses** online.
4. **Export responses to Excel** automatically.
5. **Run AI-powered analysis** on the collected responses.
Think of it like Google Forms + AI insights.
---

■ Tech Stack
We are using a **modern full-stack approach**:
Frontend
• **React.js** (HTML, CSS, JavaScript)
• Handles the questionnaire builder, dashboard, and response form.
• Styled with **Tailwind CSS** (easy, modern CSS).
Backend
We use **two backends** for different jobs:
1. **Node.js (Express.js)** → Handles authentication (login/register), storing questionnaires, and
collecting responses.
2. **FastAPI (Python)** → Handles AI analysis, Excel export, and data processing.
Database & Storage
• **PostgreSQL** or **MongoDB Atlas** for storing data (questions, answers, users).
• **AWS S3 (or similar)** for storing files like Excel reports.
---

■ Project Structure

project-root/
■
■■■ frontend/ # React.js app (form builder + dashboard)
■■■ backend-node/ # Node.js Express server (auth, forms, responses)
■■■ backend-fastapi/ # FastAPI service (AI, Excel export)
■■■ README.md # Documentation

---

■ How It Works (Workflow)
1. A **creator** signs up and builds a questionnaire in the React app.
2. The **system generates a link** that can be shared with others.
3. **Respondents** open the link and submit answers.
4. Node.js saves responses in the database.
5. When requested, Node.js sends responses to FastAPI.
6. FastAPI processes data → creates Excel file + AI summary.
7. The **creator downloads the report** or views AI insights in the dashboard.
---

■ Steps to Run (Beginner-Friendly)

1. Clone the Repos

git clone
git clone
git clone

2. Setup Frontend (React.js)

cd frontend
npm install
npm run dev

Now open `http://localhost:5173` (or the link shown).
3. Setup Node.js Backend

cd backend-node
npm install
npm start
Runs at `http://localhost:5000`.
4. Setup FastAPI Backend

cd backend-fastapi
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Runs at `http://localhost:8000`.
---

■ Example Workflow
• Login → Create a “Customer Feedback Form” → Share link → Collect 20 responses → Click
“Analyze” → Get Excel file + AI summary (e.g., most customers like the product but want faster
delivery).
---

■ Security Notes (Simple)
• Always use **strong passwords**.
• Don’t hardcode API keys.
• Use HTTPS when deploying online.
---

■ Deployment Plan (Simple)
• **Frontend** → Deploy to **Vercel**.
• **Node.js Backend** → Deploy to **Render/Heroku/AWS**.
• **FastAPI Backend** → Deploy to **Railway/Render/AWS**.

• **Database** → Use **MongoDB Atlas** or **PostgreSQL cloud hosting**.
---

■ Roadmap (Beginner Milestones)
1. ■ Build React frontend and Node.js backend (basic form + response saving).
2. ■ Add FastAPI for Excel export.
3. ■ Add simple AI analysis (sentiment, keyword summary).
4. ■ Add fancy dashboard and charts.
5. ■ Add notifications (email when report is ready).
