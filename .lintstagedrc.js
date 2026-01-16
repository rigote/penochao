module.exports = {
  '**/*.{js,jsx,ts,tsx}': [
    'prettier --write',
    'eslint --fix',
    'jest --bail --findRelatedTests',
  ],
  '**/*.{json,css,scss,md}': ['prettier --write'],
}
