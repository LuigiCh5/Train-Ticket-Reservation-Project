const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/trains.json');

// Fonction pour lire la base de données JSON
const readData = () => {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

// Fonction pour écrire dans la base de données JSON
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));
};

// ✏️ Modifier le nombre de places disponibles pour un train donné
router.patch('/update-seats/:trainId', (req, res) => {
    const { trainId } = req.params;
    const { travelClass, newSeats } = req.body;
    let trains = readData();

    // Trouver l'index du train dans le fichier JSON
    const trainIndex = trains.findIndex(t => t.id === parseInt(trainId));

    if (trainIndex === -1) {
        return res.status(404).json({ message: 'Train non trouvé' });
    }

    if (!trains[trainIndex].availableSeats.hasOwnProperty(travelClass)) {
        return res.status(400).json({ message: 'Classe de voyage invalide' });
    }

    // Mettre à jour le nombre de places
    trains[trainIndex].availableSeats[travelClass] = newSeats;
    writeData(trains);

    res.json({ message: 'Nombre de places mis à jour avec succès', train: trains[trainIndex] });
});

// 🔍 Recherche de trains disponibles
router.get('/search', (req, res) => {
    const { departureStation, arrivalStation, departureDate, tickets, travelClass } = req.query;
    const trains = readData();

    const results = trains.filter(train =>
        train.departureStation === departureStation &&
        train.arrivalStation === arrivalStation &&
        train.departureTime.startsWith(departureDate) &&
        train.availableSeats[travelClass] >= tickets
    );

    if (results.length === 0) {
        return res.status(404).json({ message: 'Aucun train disponible' });
    }

    res.json(results);
});

// 🎟️ Réservation de places
router.post('/book', (req, res) => {
    const { trainId, travelClass, tickets } = req.body;
    let trains = readData();

    const trainIndex = trains.findIndex(t => t.id === trainId);
    if (trainIndex === -1) {
        return res.status(404).json({ message: 'Train non trouvé' });
    }

    if (trains[trainIndex].availableSeats[travelClass] < tickets) {
        return res.status(400).json({ message: 'Pas assez de places disponibles' });
    }

    // Mise à jour des places disponibles
    trains[trainIndex].availableSeats[travelClass] -= tickets;
    writeData(trains);

    res.json({ message: 'Réservation réussie', train: trains[trainIndex] });
});

module.exports = router;