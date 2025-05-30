import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('Hello, InfluencerFlow API User!');
});


app.listen(PORT, () => {
  console.log(`InfluencerFlow Server is running on http://localhost:${PORT}`);
});