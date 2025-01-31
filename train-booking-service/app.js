const express = require('express');
const soap = require('soap');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 4000;

const wsdlPath = path.join(__dirname, 'wsdl', 'trainBooking.wsdl');
const wsdlXML = fs.readFileSync(wsdlPath, 'utf8');

const validUsers = {
  "admin": "password123",
  "user1": "securepass",
  "user2": "securepass",
};

/**
 * 🔒 Function to authenticate users
 */
function authenticateUser(args, callback) {
  console.log("📥 Authentication request received:", args);

  const { username, password } = args;
  if (!username || !password) {
    return callback(null, { status: "fail" });
  }

  if (validUsers[username] === password) {
    console.log(`✅ User '${username}' authenticated successfully.`);
    return callback(null, { status: "success" });
  } else {
    console.log(`⛔ Invalid credentials for '${username}'`);
    return callback(null, { status: "fail" });
  }
}

/**
 * 🔑 Middleware to verify authentication headers
 */
function verifyAuth(headers) {
  console.log("🔍 Checking authentication headers:", headers);
  if (!headers || !headers.Authentication || !headers.Authentication.username || !headers.Authentication.password) {
    throw new Error("⚠️ Authentication Required");
  }

  const { username, password } = headers.Authentication;
  if (validUsers[username] !== password) {
    throw new Error("⛔ Invalid Credentials");
  }

  console.log(`✅ Authentication successful for ${username}`);
  return true;
}

/**
 * 🚆 SOAP Service
 */
const service = {
  TrainBookingService: {
    TrainBookingPort: {
      authenticateUser,

      searchTrains: async function (args, callback, headers) {
        try {
          verifyAuth(headers);
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
            arrivalTime: train.arrivalTime,
            availableTickets: {
              firstClass: train.availableSeats.firstClass,
              businessClass: train.availableSeats.businessClass,
              standardClass: train.availableSeats.standardClass
            }
          }));
      
          return callback(null, { trains: { train: trainsArray } });
      
        } catch (error) {
          if (error.response && error.response.status === 404) {
            return callback(null, { confirmation: "🚨 No trains available with the specified information." });
          }
          return callback(error);
        }
      },
      

      // ✅ Book train function with authentication
      bookTrain: async function (args, callback, headers) {
        try {
          verifyAuth(headers);
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
          await axios.post('http://localhost:3000/api/trains/book', {
            trainId: parseInt(trainId, 10),
            travelClass: travelClass || 'standard',
            tickets: tickets ? parseInt(tickets, 10) : 1
          });

          const soapResponse = {
            confirmation: `✅ Reservation confirmed for Train ${trainId} [User: ${userId}]`
          };

          const reservationData = {
            trainId: parseInt(trainId, 10),
            userId,
            travelClass: travelClass || 'standard',
            tickets: tickets ? parseInt(tickets, 10) : 1,
            bookedAt: new Date().toISOString()
          };

          const reservationsFile = path.join(__dirname, 'data', 'reservations.json');

          let reservations = [];
          if (fs.existsSync(reservationsFile)) {
            try {
              const fileData = fs.readFileSync(reservationsFile, 'utf8');
              reservations = JSON.parse(fileData);
            } catch (readErr) {
              console.error("🚨 Error reading or parsing reservations.json:", readErr.message);
              reservations = [];
            }
          }

          reservations.push(reservationData);

          try {
            fs.writeFileSync(reservationsFile, JSON.stringify(reservations, null, 2));
          } catch (writeErr) {
            console.error("🚨 Error writing reservations.json:", writeErr.message);
          }

          return callback(null, soapResponse);

        } catch (error) {
          if (error.response && error.response.status === 400) {
            return callback(null, { confirmation: "🚨 No tickets available for this train." });
          }
          return callback(error);
        }
      }
    }
  }
};

/**
 * 📡 Expose WSDL Endpoint
 */
app.use('/wsdl', (req, res) => {
  res.type('application/xml').send(wsdlXML);
});

/**
 * 🚀 Start the SOAP Service
 */
const server = app.listen(port, () => {
  console.log(`🚀 SOAP Service running at http://localhost:${port}/booking`);
});

soap.listen(server, '/booking', service, wsdlXML, () => {
  console.log("📡 SOAP Service Ready on /booking");
});
