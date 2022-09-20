const express = require('express');
const cors = require('cors');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
