const express = require('express');
const trainRoutes = require('./routes/trains');

const app = express();
app.use(express.json());

app.use('/api/trains', trainRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur le port ${PORT}`);
});