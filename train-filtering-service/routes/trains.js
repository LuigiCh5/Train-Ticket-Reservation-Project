const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/trains.json');

const readData = () => {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));
};

router.patch('/update-seats/:trainId', (req, res) => {
    const { trainId } = req.params;
    const { travelClass, newSeats } = req.body;
    let trains = readData();

    const trainIndex = trains.findIndex(t => t.id === parseInt(trainId));

    if (trainIndex === -1) {
        return res.status(404).json({ message: 'Train non trouvé' });
    }

    if (!trains[trainIndex].availableSeats.hasOwnProperty(travelClass)) {
        return res.status(400).json({ message: 'Classe de voyage invalide' });
    }

    trains[trainIndex].availableSeats[travelClass] = newSeats;
    writeData(trains);

    res.json({ message: 'Nombre de places mis à jour avec succès', train: trains[trainIndex] });
});

router.get('/search', (req, res) => {
    const { departureStation, arrivalStation, departureDate, tickets, travelClass } = req.query;
    const trains = readData();

    // Convert tickets to number (default = 1)
    const ticketCount = parseInt(tickets, 10) || 1;

    const results = trains.filter(train =>
        train.departureStation === departureStation &&
        train.arrivalStation === arrivalStation &&
        (!departureDate || train.departureTime.startsWith(departureDate)) &&
        train.availableSeats[travelClass] >= ticketCount
    );

    if (results.length === 0) {
        return res.status(404).json({ message: 'Aucun train disponible' });
    }

    res.json(results);
});


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

    trains[trainIndex].availableSeats[travelClass] -= tickets;
    writeData(trains);

    res.json({ message: 'Réservation réussie', train: trains[trainIndex] });
});

module.exports = router;