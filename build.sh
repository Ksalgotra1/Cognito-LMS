#!/usr/bin/env bash
# Render Build Script — runs during every deploy
set -o errexit

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📁 Collecting static files..."
cd backend
python manage.py collectstatic --noinput

echo "🗃️ Running database migrations..."
python manage.py migrate --noinput

echo "🌱 Seeding demo courses..."
python manage.py seed_courses

echo "✅ Build complete!"
