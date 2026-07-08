#!/usr/bin/env bash
# install-and-test.sh - one-command local install + live-test launcher
# Usage:  bash install-and-test.sh
set -e

echo "ZombieSweep - install & live test"
echo "======================================"

NODE_MAJOR=$(node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node >=18 required (found $(node --version)). Aborting."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Running unit tests..."
npm run test

echo "Starting dev server at http://localhost:5173"
echo "     Press Ctrl+C to stop."
npm run dev
