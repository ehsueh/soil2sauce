#!/bin/bash

echo "🧪 Testing backend logging..."
echo "1. Testing health endpoint..."
curl -s http://localhost:3001/health

echo -e "\n\n2. Testing evaluation endpoint..."
curl -X POST http://localhost:3001/api/evaluate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Mix ingredients and bake at 350F for 30 minutes", 
    "ingredients": "2 cups flour, 1 cup sugar, 3 eggs", 
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }'

echo -e "\n\n✅ Check your backend terminal - you should see logs with �� emojis!"
