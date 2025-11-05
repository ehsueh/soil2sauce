#!/bin/bash

echo "Testing backend health endpoint..."
curl http://localhost:3001/health
echo -e "\n"

echo "Testing recipe evaluation endpoint..."
curl --max-time 60 \
  -X POST \
  http://localhost:3001/api/evaluate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Mix flour and sugar in a bowl. Bake at 350F for 20 minutes.",
    "ingredients": "2 cups flour, 1 cup sugar"
  }'
echo -e "\n"
