# Personal Finance Tracker

## Overview

Personal Finance Tracker is a web application built using **Django (backend) and React (frontend)** with PostgreSQL as the database. It helps users manage their bills, set budgets, track transactions, and receive automatic reminders for pending bills.

## Features

- **User Authentication** (Register & Login)
- **Add Bills** and receive email reminders
- **Set Budget** with warnings when exceeded
- **Track Transactions** in real-time
- **Spending Analysis Chart** to visualize budget usage

## Tech Stack

### Backend:

- Django
- Django REST Framework
- PostgreSQL
- Celery & Redis (for email reminders)

### Frontend:

- React
- React Router
- Bootstrap & CSS

## Setup Instructions

### Backend Setup:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-tracker.git
   cd finance-tracker/backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install django
   pip install pyscopg2
   ```
4. Configure PostgreSQL database in `.env` file.
5. Apply migrations:
   ```bash
   python manage.py migrate
   ```
6. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup:

1. Navigate to the frontend directory:
   ```bash
   cd finance-tracker-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React app:
   ```bash
   npm start
   ```

##
