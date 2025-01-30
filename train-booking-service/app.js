const express = require('express');
const soap = require('soap');
const axios = require('axios'); 
const fs = require('fs');
const path = require('path');

const app = express();
const port = 4000;

// Read the WSDL from the local file system
const wsdlPath = path.join(__dirname, 'wsdl', 'trainBooking.wsdl');
const wsdlXML = fs.readFileSync(wsdlPath, 'utf8');

// user Database
const validUsers = {
  "admin": "password123",
  "user1": "securepass",
  "user2": "securepass",
};

// Authentication helper
function authenticate(headers) {
  console.log("🔍 Authentication Headers:", headers);
  if (!headers || !headers.Authentication || !headers.Authentication.username || !headers.Authentication.password) {
    console.log("⚠️ Authentication Required");
    throw new Error("⚠️ Authentication Required");
  }

  const { username, password } = headers.Authentication;
  if (validUsers[username] === password) {
    console.log(`✅ Authentication successful for ${username}`);
    return true;
  } else {
    console.log("⛔ Invalid Credentials");
    throw new Error("⛔ Invalid Credentials");
  }
}

const service = {
  TrainBookingService: {
    TrainBookingPort: {

      // ===================== searchTrains =====================
      // Calls the REST API (GET /api/trains/search) to find trains
      // with the following query parameters:
      // departureStation, arrivalStation, departureDate, tickets, travelClass
      searchTrains: async function (args, callback, headers) {
        try {
          authenticate(headers);
        } catch (err) {
          return callback(err);
        }

        console.log("📥 Incoming request for searchTrains:", args);

        const { departure, destination, travelClass, tickets, departureDate } = args;

        if (!departure || !destination) {
          return callback(new Error("⛔ Missing required parameters: departure or destination"));
        }

        try {
          console.log("🔎 Calling REST API to search trains...");

          const response = await axios.get('http://localhost:3000/api/trains/search', {
            params: {
              departureStation: departure,
              arrivalStation: destination,
              departureDate: departureDate || '',   
              tickets: tickets || 1,              
              travelClass: travelClass || ''        
            }
          });

          const trainsData = response.data;
          const trainsArray = trainsData.map(train => ({
            trainId: train.id,
            departure: train.departureStation,
            destination: train.arrivalStation,
            departureTime: train.departureTime,
            arrivalTime:train.arrivalTime,
            availableTickets: train.availableSeats,
            firstClassSeats: train.firstClass,
            businessClass: train.businessClass,
            standardClass: train.standardClass,
          }));

          const soapResponse = {
            trains: {
              train: trainsArray
            }
          };

          return callback(null, soapResponse);

        } catch (error) {
          if (error.response && error.response.status === 404) {
          console.log("🚨 Trains with the specified informations not available");
          const soapResponse = {
            confirmation:"🚨 Trains with the specified informations not available",
          }
          return callback(null,soapResponse);
          }
          console.error("🚨 Error from REST API:", error.message);
          return callback(error);
        }
      },

      // ===================== bookTrain =====================
      // Calls the REST API (POST /api/trains/book) to reserve seats
      // with the following JSON body:
      // { trainId, travelClass, tickets }
      bookTrain: async function (args, callback, headers) {
        try {
          authenticate(headers);
        } catch (err) {
          return callback(err);
        }

        console.log("📥 Incoming request for bookTrain:", args);

        const { trainId, userId, travelClass, tickets } = args;
        if (!trainId || !userId) {
          return callback(new Error("⛔ Missing required parameters: trainId or userId"));
        }

        try {
          console.log("🛤️ Calling REST API to book train...");

          const resp = await axios.post('http://localhost:3000/api/trains/book', {
            trainId: parseInt(trainId, 10),
            travelClass: travelClass || 'standardClass',
            tickets: tickets ? parseInt(tickets, 10) : 1
          });
          const soapResponse = {
            confirmation: `✅ Réservation confirmée pour le train ${trainId} [ ${userId} ]`
          };
          const newReservation = {
            trainId: parseInt(trainId, 10),
            userId,
            travelClass: travelClass || 'standard',
            tickets: tickets ? parseInt(tickets, 10) : 1,
            // You might also want a timestamp
            bookedAt: new Date().toISOString()
          };
          const reservationsFile = path.join(__dirname, 'data', 'reservations.json');
          let reservations = [];


          if (fs.existsSync(reservationsFile)) {
            try {
              const fileData = fs.readFileSync(reservationsFile, 'utf8');
              reservations = JSON.parse(fileData);
            } catch (err) {
              console.log("Le fichier reservations.json existant est vide !");
            }
          }


          reservations.push(newReservation);

          fs.writeFileSync(reservationsFile, JSON.stringify(reservations, null, 2));



          return callback(null, soapResponse);

        } catch (error) {
      
          //  Check if it was a 400 error, implying no more seats
          if (error.response && error.response.status === 400) {
            console.log(" 🚨 No tickets available for this train.")
            const soapResponse = {
              confirmation: "🚨 No tickets available for this train."
            };
            return callback(null, soapResponse);
          }
      
          // For other error types (404, 500, network error, etc.)
          return callback(error);
        }
      }
    }
  }
};

app.use('/wsdl', (req, res) => {
  res.type('application/xml').send(wsdlXML);
});

const server = app.listen(port, () => {
  console.log(`🚀 SOAP Service running at http://localhost:${port}/booking`);
});

soap.listen(server, '/booking', service, wsdlXML, () => {
  console.log("📡 SOAP Service Ready on /booking");
});
