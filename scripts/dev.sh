#!/bin/bash

# Start server in background
echo "Starting server..."
yarn workspace @server/api dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Start client
echo "Starting client..."
yarn workspace @client/web dev &
CLIENT_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
