import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

console.log(`Server will start on port ${PORT}`);
console.log('Backend project initialized successfully!');
