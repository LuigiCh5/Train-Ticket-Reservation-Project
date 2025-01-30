const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
    departureStation: String,
    arrivalStation: String,
    departureTime: Date,
    arrivalTime: Date,
    availableSeats: {
        firstClass: Number,
        businessClass: Number,
        standardClass: Number
    }
});

module.exports = mongoose.model('Train', trainSchema);