#!/bin/bash

# Docker Deployment Script for judge.ca
echo "🚀 Starting Docker deployment for judge.ca..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker images...${NC}"

# Build the main application
docker build -t judge-ca:latest .

# Build the WebSocket server
docker build -f Dockerfile.websocket -t judge-ca-websocket:latest .

echo -e "${GREEN}✅ Docker images built successfully!${NC}"

# Check if we should run with docker-compose
read -p "Do you want to start the services with docker-compose? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Starting services with docker-compose...${NC}"
    docker-compose up -d
    
    # Wait for services to be healthy
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Check service status
    docker-compose ps
    
    echo -e "${GREEN}✅ Services are running!${NC}"
    echo -e "${GREEN}📝 Access the application at: http://localhost:3000${NC}"
    echo -e "${GREEN}📊 Database is available at: localhost:5432${NC}"
    echo -e "${GREEN}💾 Redis is available at: localhost:6379${NC}"
    echo -e "${GREEN}🔌 WebSocket server is available at: http://localhost:3001${NC}"
else
    echo -e "${YELLOW}ℹ️  Docker images are ready. Run 'docker-compose up' to start services.${NC}"
fi

# Option to push to Docker Hub
read -p "Do you want to push images to Docker Hub? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Docker Hub username: " DOCKER_USER
    
    # Tag images
    docker tag judge-ca:latest $DOCKER_USER/judge-ca:latest
    docker tag judge-ca-websocket:latest $DOCKER_USER/judge-ca-websocket:latest
    
    # Push to Docker Hub
    echo -e "${YELLOW}📤 Pushing images to Docker Hub...${NC}"
    docker push $DOCKER_USER/judge-ca:latest
    docker push $DOCKER_USER/judge-ca-websocket:latest
    
    echo -e "${GREEN}✅ Images pushed to Docker Hub successfully!${NC}"
fi

echo -e "${GREEN}🎉 Docker deployment complete!${NC}"