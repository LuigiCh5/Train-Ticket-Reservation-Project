const soap = require('soap');
const prompt = require('prompt-sync')({ sigint: true });

//
// CONFIGURATION : URL du WSDL et du service SOAP
//
const WSDL_URL = 'http://localhost:4000/wsdl';  // URL du service WSDL
const SOAP_ENDPOINT = 'http://localhost:4000/booking'; // Endpoint réel du service SOAP

async function main() {
  try {
    console.log("=== Client de réservation de train (SOAP) ===\n");

    // 1) Demande des identifiants de connexion
    const username = prompt('🔑 Nom d’utilisateur : ');
    const password = prompt('🔒 Mot de passe : ', { echo: '*' });

    // 2) Création du client SOAP
    console.log("\n🔄 Connexion au service SOAP...");
    const client = await soap.createClientAsync(WSDL_URL);

    // 3) Ajout des identifiants dans l'en-tête SOAP
    const soapHeader = {
      Authentication: {
        username: username,
        password: password,
      },
    };
    client.addSoapHeader(soapHeader, '', 'tns', '');
    console.log("✅ Connexion réussie !\n");

    // 4) Recherche de trains
    console.log("=== 🚆 Recherche de trains ===\n");
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
    const [result] = await client.searchTrainsAsync(searchRequest);

    if (!result || !result.trains || !result.trains.train || result.trains.train.length === 0) {
      console.log("❌ Aucun train trouvé pour cette recherche.\n");
      return;
    }

    console.log("\n=== 🚆 Trains disponibles ===");
    const trains = result.trains.train;
    trains.forEach(t => {
      console.log(`🔹 Train ID: ${t.trainId} | Départ : ${t.departure} ➡️  Destination : ${t.destination} 📅Date de départ ${t.departureTime} 📅 Date d'arrivée: ${t.arrivalTime}`);
    });

    // 5) Sélection du train à réserver
    const trainId = prompt("\n✏️ Entrez l'ID du train à réserver : ");
    const userId = prompt('👤 Identifiant utilisateur (ex: votre nom) : ');
    const bookClass = travelClass || 'standard';
    const bookTickets = tickets || 1;

    // 6) Réservation du train
    console.log("\n📌 Réservation en cours...");
    const bookRequest = {
      trainId: parseInt(trainId, 10),
      userId: userId,
      travelClass: bookClass,
      tickets: parseInt(bookTickets, 10)
    };

    const [bookResult] = await client.bookTrainAsync(bookRequest);
    console.log("\n=== ✅ Résultat de la réservation ===");
    console.log(bookResult.confirmation || "❌ Erreur lors de la réservation.");
  
  } catch (error) {
    console.error("\n❌ Erreur :", error.message || error);
  }
}

main();