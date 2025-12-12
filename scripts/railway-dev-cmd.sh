#!/bin/bash
# Run Django management commands against Railway's development database
# Usage: ./scripts/railway-dev-cmd.sh "python manage.py <command>"
#
# Prerequisites:
#   - Railway CLI installed and logged in
#   - Project linked: railway link -p <project-id> -e development
#   - Docker container running: docker ps | grep njstars-backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No command provided${NC}"
    echo "Usage: ./scripts/railway-dev-cmd.sh \"python manage.py <command>\""
    echo ""
    echo "Examples:"
    echo "  ./scripts/railway-dev-cmd.sh \"python manage.py migrate\""
    echo "  ./scripts/railway-dev-cmd.sh \"python manage.py createsuperuser\""
    echo "  ./scripts/railway-dev-cmd.sh \"python manage.py shell\""
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI not installed${NC}"
    echo "Install with: brew install railway"
    exit 1
fi

# Check if Docker container is running
if ! docker ps | grep -q njstars-backend; then
    echo -e "${RED}Error: njstars-backend container not running${NC}"
    echo "Start with: make up"
    exit 1
fi

echo -e "${YELLOW}Fetching Railway development database URL...${NC}"

# Get the DATABASE_PUBLIC_URL from Railway
DB_URL=$(railway variables -s Postgres --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('DATABASE_PUBLIC_URL', ''))" 2>/dev/null)

if [ -z "$DB_URL" ]; then
    echo -e "${RED}Error: Could not fetch DATABASE_PUBLIC_URL from Railway${NC}"
    echo ""
    echo "Make sure you've linked to the Railway project:"
    echo "  railway link -p <project-id> -e development"
    exit 1
fi

echo -e "${GREEN}Connected to Railway development database${NC}"
echo -e "${YELLOW}Running: $1${NC}"
echo ""

# Run the command in Docker with the Railway DATABASE_URL
docker exec -e DATABASE_URL="$DB_URL" njstars-backend $1
