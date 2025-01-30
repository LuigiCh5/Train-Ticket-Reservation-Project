const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 4000;

// Read the WSDL file
const wsdlPath = path.join(__dirname, 'wsdl', 'trainBooking.wsdl');
const wsdlXML = fs.readFileSync(wsdlPath, 'utf8');

// Hardcoded credentials (For demo, replace with database validation)
const validUsers = {
  "admin": "password123",
  "user1": "securepass"
};

// Middleware for SOAP authentication
function authenticate(headers) {
    if (!headers || !headers.Auth || !headers.Auth.username || !headers.Auth.password) {
        throw new Error("Authentication required");
    }
    
    const { username, password } = headers.Auth;
    
    if (validUsers[username] && validUsers[username] === password) {
        console.log(`✅ Authentication successful for ${username}`);
        return true;
    } else {
        console.error("❌ Authentication failed");
        throw new Error("Invalid credentials");
    }
}

// Implement SOAP service methods
const service = {
  TrainBookingService: {
    TrainBookingPort: {
      searchTrains: async function (args, headers) {
        authenticate(headers);  // Check authentication

        console.log("Searching trains for:", args.departure, "to", args.destination);
        
        try {
          const response = await axios.get('http://localhost:5000/trains');
          const trains = response.data.filter(train => 
            train.departure === args.departure && train.destination === args.destination
          );

          return { trains: JSON.stringify(trains) };
        } catch (error) {
          console.error("Error fetching trains:", error);
          throw new Error("Service unavailable");
        }
      },

      bookTrain: async function (args, headers) {
        authenticate(headers);  // Check authentication

        console.log("Booking train ID:", args.trainId, "for user:", args.userId);

        try {
          await axios.post('http://localhost:5000/trains/reserve', { trainId: args.trainId });

          return { confirmation: `Booking confirmed for train ${args.trainId}` };
        } catch (error) {
          console.error("Error booking train:", error);
          throw new Error("Booking failed");
        }
      }
    }
  }
};

// Serve WSDL file
app.use('/wsdl', (req, res) => {
  res.type('application/xml').send(wsdlXML);
});

// Start SOAP server
const server = app.listen(port, () => {
  console.log(`🚀 SOAP Train Booking Service running on http://localhost:${port}/booking`);
});

soap.listen(server, '/booking', service, wsdlXML);
