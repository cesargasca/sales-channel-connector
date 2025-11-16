#!/bin/bash

# Setup script for Sales Channel Connector
# This script automates the initial project setup

set -e

echo "🚀 Setting up Sales Channel Connector..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Warning: Docker is not running. You'll need to start Docker and run 'docker-compose up -d' to start PostgreSQL."
else
    echo "🐳 Starting PostgreSQL with Docker..."
    docker-compose up -d
    echo "✅ PostgreSQL started"

    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
if npm run db:generate; then
    echo "✅ Prisma Client generated"
else
    echo "⚠️  Warning: Prisma Client generation failed. You may need to run 'npm run db:generate' manually."
fi

# Run migrations
echo "🗄️  Running database migrations..."
if npm run db:push; then
    echo "✅ Database migrations complete"
else
    echo "⚠️  Warning: Database migrations failed. Make sure PostgreSQL is running."
    echo "   You can start it with: docker-compose up -d"
    exit 1
fi

# Seed database
echo "🌱 Seeding database with sample data..."
if npm run db:seed; then
    echo "✅ Database seeded successfully"
else
    echo "⚠️  Warning: Database seeding failed."
    exit 1
fi

echo ""
echo "✨ Setup complete! You can now run:"
echo "   npm run dev"
echo ""
echo "Then visit http://localhost:3000"
