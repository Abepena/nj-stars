#!/bin/bash

# NJ Stars Platform - Test Runner
# Runs all tests for backend and frontend with coverage

set -e  # Exit on error

echo "======================================"
echo "NJ Stars Platform - Running All Tests"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend Tests
echo -e "${BLUE}Running Backend Tests...${NC}"
echo "--------------------------------------"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

source venv/bin/activate || source venv/Scripts/activate

echo "Installing backend dependencies..."
pip install -q -r requirements.txt

echo ""
echo "Running pytest with coverage..."
pytest --cov=app --cov-report=term-missing --cov-report=html --cov-report=xml

BACKEND_EXIT=$?

if [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ Backend tests passed!${NC}"
else
    echo -e "${RED}✗ Backend tests failed!${NC}"
fi

cd ..
echo ""

# Frontend Tests
echo -e "${BLUE}Running Frontend Tests...${NC}"
echo "--------------------------------------"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "Running Jest with coverage..."
npm run test:coverage

FRONTEND_EXIT=$?

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend tests passed!${NC}"
else
    echo -e "${RED}✗ Frontend tests failed!${NC}"
fi

cd ..
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"

if [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "Backend:  ${GREEN}✓ PASSED${NC}"
else
    echo -e "Backend:  ${RED}✗ FAILED${NC}"
fi

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "Frontend: ${GREEN}✓ PASSED${NC}"
else
    echo -e "Frontend: ${RED}✗ FAILED${NC}"
fi

echo ""
echo "Coverage Reports:"
echo "  Backend:  backend/htmlcov/index.html"
echo "  Frontend: frontend/coverage/lcov-report/index.html"
echo ""

# Exit with failure if any tests failed
if [ $BACKEND_EXIT -ne 0 ] || [ $FRONTEND_EXIT -ne 0 ]; then
    exit 1
fi

echo -e "${GREEN}All tests passed! 🎉${NC}"
exit 0
