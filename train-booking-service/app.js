const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 4000;

// Read the WSDL from the local file system
const wsdlPath = path.join(__dirname, 'wsdl', 'trainBooking.wsdl');
const wsdlXML = fs.readFileSync(wsdlPath, 'utf8');

// A simple user database
const validUsers = { 
  "admin": "password123", 
  "user1": "securepass" 
};

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
      throw new Error("⛔ Invalid Credentials");
  }
}

// Our service definition
const service = {
  TrainBookingService: {
    TrainBookingPort: {
      searchTrains: function (args, callback, headers /* or soapHeader */) {
        try {
          authenticate(headers);
        } catch (err) {
          return callback(err);
        }

        console.log("📥 Incoming request for searchTrains:", args);

        // Validate request arguments
        if (!args.departure || !args.destination) {
          return callback(new Error("⛔ Missing required parameters: departure or destination"));
        }

        console.log("🔎 Searching trains from:", args.departure, "to", args.destination);
        // Dummy response
        const response = { 
          trains: {
            train: [
              { trainId: 101, departure: args.departure, destination: args.destination }
            ]
          }
        };
        callback(null, response);
      },

      bookTrain: function (args, callback, headers /* or soapHeader */) {
        try {
          // Enforce authentication first
          authenticate(headers);
        } catch (err) {
          return callback(err); // Return an authentication error
        }

        console.log("📥 Incoming request for bookTrain:", args);

        // Validate request arguments
        if (!args.trainId || !args.userId) {
          return callback(new Error("⛔ Missing required parameters: trainId or userId"));
        }

        console.log("🛤️ Booking train ID:", args.trainId, "for user:", args.userId);
        const response = { confirmation: `✅ Booking confirmed for train ${args.trainId}` };
        callback(null, response);
      }
    }
  }
};

// Provide the WSDL file at /wsdl
app.use('/wsdl', (req, res) => {
  res.type('application/xml').send(wsdlXML);
});

// Start the server
const server = app.listen(port, () => {
  console.log(`🚀 SOAP Service running at http://localhost:${port}/booking`);
});

// Attach the SOAP service to '/booking'
soap.listen(server, '/booking', service, wsdlXML, () => {
  console.log("📡 SOAP Service Ready on /booking");
});
