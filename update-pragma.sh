#!/bin/bash

# Update all Solidity files to use pragma solidity ^0.8.24

echo "🔄 Updating all Solidity files to use pragma solidity ^0.8.24..."

# Find all .sol files and update pragma statements
find . -name "*.sol" -type f -exec sed -i '' 's/pragma solidity \^0\.8\.25;/pragma solidity ^0.8.24;/g' {} +
find . -name "*.sol" -type f -exec sed -i '' 's/pragma solidity \^0\.8\.28;/pragma solidity ^0.8.24;/g' {} +
find . -name "*.sol" -type f -exec sed -i '' 's/pragma solidity \^0\.8\.13;/pragma solidity ^0.8.24;/g' {} +

echo "✅ All Solidity files updated to use pragma solidity ^0.8.24"

# Test compilation
echo "🔧 Testing compilation..."
forge build --force

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed. Please check the errors above."
fi