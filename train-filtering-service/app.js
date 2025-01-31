const express = require('express');
const trainRoutes = require('./routes/trains');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

app.use('/api/trains', trainRoutes);
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur le port ${PORT}`);
});