import express from 'express';
import cors from 'cors';
import parksRouter from './routes/parks.js';

const app = express();
app.use(cors());

app.use('/api/parks', parksRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});