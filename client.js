const soap = require('soap');
const prompt = require('prompt-sync')({ sigint: true });

const WSDL_URL = 'http://localhost:4000/wsdl'; 
const SOAP_ENDPOINT = 'http://localhost:4000/booking';

async function main() {
  try {
    console.log("=== 🛤️   Client de réservation de train  ===\n");

    // 1) Authentication
    const username = prompt('🔑 Nom d’utilisateur : ');
    const password = prompt('🔒 Mot de passe : ', { echo: '*' });

    console.log("\n🔄 Connexion au service SOAP...");
    const client = await soap.createClientAsync(WSDL_URL);
    const authArgs = { username, password };

    const [authResult] = await client.authenticateUserAsync(authArgs);

    if (!authResult || !authResult.status) {
      console.log("Unexpected authenticateUser response:", authResult);
      return;
    }

    if (authResult.status !== 'success') {
      console.log("⛔ Authentication failed. Status:", authResult.status);
      return;
    }

    console.log("✅ Authentication successful!");

    const soapHeader = {
      Authentication: {
        username: username,
        password: password,
      },
    };
    client.addSoapHeader(soapHeader, '', 'tns', '');
    console.log("✅ Connexion réussie !\n");

    let continueUsing = true;
    while (continueUsing) {
      console.log("\n=== 🚉 Menu Principal ===");
      console.log("1️⃣  Voir les trains disponibles");
      console.log("2️⃣  Réserver un billet");
      console.log("3️⃣  Quitter");

      const choice = prompt("➡️  Choisissez une option (1/2/3) : ");

      if (choice === "1") {
        await searchTrains(client);
      } else if (choice === "2") {
        await bookTrain(client);
      } else if (choice === "3") {
        console.log("👋  Merci d'utiliser le service de réservation. À bientôt !");
        continueUsing = false;
      } else {
        console.log("❌ Option invalide. Veuillez choisir entre 1, 2 ou 3.");
      }
    }
  } catch (error) {
    console.error("\n❌ Erreur :", error.message || error);
  }
}

async function searchTrains(client) {
  console.log("\n=== 🚆 Recherche de trains ===");
  
  const departure = prompt('📍 Gare de départ : ');
  const destination = prompt('🎯 Gare d’arrivée : ');
  const travelClass = prompt('💺 Classe (firstClass / businessClass / standardClass) : ');
  const tickets = prompt('🎟️ Nombre de billets (optionnel, défaut=1) : ');
  const departureDate = prompt('📅 Date de départ (optionnel, ex: 2025-02-01) : ');

  const searchRequest = {
    departure,
    destination,
    travelClass,
    tickets: tickets ? parseInt(tickets, 10) : 1,
    departureDate,
  };

  console.log("\n🔍 Recherche en cours...");
  try {
    const [result] = await client.searchTrainsAsync(searchRequest);

    if (!result || !result.trains || !result.trains.train || result.trains.train.length === 0) {
      console.log("❌ Aucun train trouvé pour cette recherche.");
      return;
    }

    console.log("\n=== 🚆 Trains disponibles ===");
    result.trains.train.forEach(t => {
      console.log(`🔹 Train ID: ${t.trainId} | Départ : ${t.departure} ➡️ Destination : ${t.destination} 📅 Départ: ${t.departureTime} 📅 Arrivée: ${t.arrivalTime}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de la recherche :", error.message || error);
  }
}

async function bookTrain(client) {
  console.log("\n=== 🎟️ Réservation de billets ===");

  const trainId = prompt("\n✏️ Entrez l'ID du train à réserver : ");
  const userId = prompt('👤 Identifiant utilisateur (ex: votre nom) : ');
  const travelClass = prompt('💺 Classe (firstClass / businessClass / standardClass) : ');
  const tickets = prompt('🎟️ Nombre de billets (optionnel, défaut=1) : ');

  const bookRequest = {
    trainId: parseInt(trainId, 10),
    userId: userId,
    travelClass: travelClass || 'standard',
    tickets: tickets ? parseInt(tickets, 10) : 1
  };

  console.log("\n📌 Réservation en cours...");
  try {
    const [bookResult] = await client.bookTrainAsync(bookRequest);
    console.log("\n=== ✅ Résultat de la réservation ===");
    console.log(bookResult.confirmation || "❌ Erreur lors de la réservation.");
  } catch (error) {
    console.error("❌ Erreur lors de la réservation :", error.message || error);
  }
}

main();
