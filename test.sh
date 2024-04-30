echo 'Run test with tailwindcss 3'
npm install tailwindcss@^3
npm run test run

echo 'Run test with tailwindcss 4'
npm install tailwindcss@^4.0.0-alpha.11
npm run test run

echo 'Restore package.json'
git checkout package.json
git checkout package-lock.json
npm ci
