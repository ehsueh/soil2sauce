#!/bin/bash

# Load environment variables
source .env

echo "📝 Submitting test recipe to RecipeSystem contract..."
echo "Contract: 0xa606151dA41AE7C1Eef6c48949bEd4a8e6dd7a6c"
echo ""

# Submit recipe
cast send 0xa606151dA41AE7C1Eef6c48949bEd4a8e6dd7a6c \
  "requestRecipe(string,string)" \
  "Mix flour, sugar, eggs, and butter in a bowl. Pour into greased pan. Bake at 350F for 30 minutes until golden brown and a toothpick comes out clean." \
  "2 cups all-purpose flour, 1 cup sugar, 3 eggs, 1 stick butter, 1 tsp vanilla extract, 1 tsp baking powder" \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY

echo ""
echo "✅ Recipe submitted! Watch the AgentKit terminal for processing logs."
echo "The agent should detect and process this recipe within 15 seconds."
