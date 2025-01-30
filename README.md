# PROJET API : RESERVATION DE BILLET DE TRAIN

## 🚆 Système de réservation et de recherche de trains

### 📌 Auteurs 
- **CHAMAND Luigi**
- **CHEBIL Mohamed Nadhir**

---

## 🎯 Objectifs
Ce projet est une application web permettant :
1. **La recherche de trains disponibles** en fonction des critères de l'utilisateur.
2. **La réservation de billets de train** en mettant à jour la base de données.
3. **La gestion des places disponibles** dans chaque train.
4. **L'utilisation d'un service REST** pour la gestion et le filtrage des trains.

L'application est construite avec **Node.js** et utilise une base de données **JSON** locale au lieu de MongoDB pour stocker les informations des trains.

---

## 🏗️ Train Filtering Service (REST)

### 🔹 Fonctionnalités
✅ Recherche de trains disponibles  
✅ Réservation de billets avec mise à jour automatique des places restantes  
✅ Modification manuelle du nombre de places disponibles  
✅ Stockage des données en JSON (sans base de données externe)  

---

## 🛠️ Technologies utilisées
- **Node.js** : Serveur backend
- **Express.js** : Framework pour l'API REST
- **JSON** : Stockage des données des trains
- **Postman / cURL** : Test des requêtes API

---

## 🚀 Installation et exécution du projet

### 🔹 1️⃣ Installation des dépendances
Assure-toi d'avoir **Node.js** installé, puis installe les dépendances :
```bash
npm install
```
### 🔹 2️⃣ Lancer le serveur
```bash
node app.js
```
Le serveur démarre sur http://localhost:3000.

---

## 🔍 Endpoints de l'API

### 1️⃣ 📌 Rechercher des trains disponibles
**URL :** ```GET /api/trains/search```
**Paramètres requis :**
#### 📌 Paramètres requis

| Paramètre        | Type                 | Description                            |
|-----------------|----------------------|----------------------------------------|
| `departureStation` | `String`            | Ville de départ                        |
| `arrivalStation`   | `String`            | Ville d'arrivée                        |
| `departureDate`    | `String (YYYY-MM-DD)` | Date de départ                         |
| `tickets`         | `Number`            | Nombre de billets demandés             |
| `travelClass`     | `String` (`firstClass`, `businessClass`, `standardClass`) | Classe du voyage |

**Exemple de requête :**
```bash
curl -X GET "http://localhost:3000/api/trains/search?departureStation=Paris&arrivalStation=Lyon&departureDate=2025-02-01&tickets=2&travelClass=standardClass"
```
**Réponse attendue :**
```json
[
    {
        "id": 1,
        "departureStation": "Paris",
        "arrivalStation": "Lyon",
        "departureTime": "2025-02-01T08:00:00Z",
        "arrivalTime": "2025-02-01T10:00:00Z",
        "availableSeats": {
            "firstClass": 10,
            "businessClass": 20,
            "standardClass": 98
        }
    }
]
```

### 2️⃣ 🎟️ Réserver un billet
**URL :** ```POST /api/trains/book```
**Body requis (JSON) :**
```json
{
    "trainId": 1,
    "travelClass": "standardClass",
    "tickets": 2
}
```
**Exemple de requête :**
```bash
curl -X POST "http://localhost:3000/api/trains/book" \
     -H "Content-Type: application/json" \
     -d '{"trainId": 1, "travelClass": "standardClass", "tickets": 2}'
```
**Réponse attendue :**
```json
{
    "message": "Réservation réussie",
    "train": {
        "id": 1,
        "departureStation": "Paris",
        "arrivalStation": "Lyon",
        "departureTime": "2025-02-01T08:00:00Z",
        "arrivalTime": "2025-02-01T10:00:00Z",
        "availableSeats": {
            "firstClass": 10,
            "businessClass": 20,
            "standardClass": 96
        }
    }
}
```

### 3️⃣ ✏️ Modifier le nombre de places disponibles
**URL :** ```PATCH /api/trains/update-seats/:trainId```
**Body requis (JSON) :**
```json
{
    "travelClass": "standardClass",
    "newSeats": 50
}
```
**Exemple de requête :**
```bash
curl -X PATCH "http://localhost:3000/api/trains/update-seats/1" \
     -H "Content-Type: application/json" \
     -d '{"travelClass": "standardClass", "newSeats": 50}'
```
**Réponse attendue :**
```json
{
    "message": "Nombre de places mis à jour avec succès",
    "train": {
        "id": 1,
        "departureStation": "Paris",
        "arrivalStation": "Lyon",
        "departureTime": "2025-02-01T08:00:00Z",
        "arrivalTime": "2025-02-01T10:00:00Z",
        "availableSeats": {
            "firstClass": 10,
            "businessClass": 20,
            "standardClass": 50
        }
    }
}
```

---

## 📂 Structure du projet
```graphql
Train-Ticket-Reservation-Project/
├── train-filtering-service/
│   ├── data/
│   │   └── trains.json          # Base de données JSON
│   ├── routes/
│   │   └── trains.js            # Routes API pour les trains
│   ├── app.js                   # Point d'entrée du serveur
│   ├── package.json             # Fichier de configuration du projet
│   ├── README.md                # Documentation du projet
```

---

## 📜 Licence
Ce projet est open-source et peut être utilisé librement.

---

### **💡 Ce que ce README.md apporte :**
✅ Un **aperçu rapide** du projet  
✅ Des **instructions d'installation et d'utilisation** claires  
✅ Une **documentation API détaillée** avec des exemples  
✅ Une **organisation propre** du projet  