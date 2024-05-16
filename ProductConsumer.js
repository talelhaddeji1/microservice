const { Kafka } = require('kafkajs'); // Importer le module Kafka

// Configuration du client Kafka
const kafka = new Kafka({
  clientId: 'produit-consumer', // Identifiant du client Kafka
  brokers: ['localhost:9092'], // Liste des brokers Kafka
});

// Création du consommateur Kafka
const consumer = kafka.consumer({ groupId: 'produit-group' }); // Groupe de consommateurs

// Fonction pour exécuter le consommateur Kafka
const run = async () => {
  try {
    await consumer.connect(); // Connexion au broker Kafka
    await consumer.subscribe({ topic: 'produit-events', fromBeginning: true }); // S'abonner au topic des événements de produit
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString()); // Convertir le message en JSON
        console.log('Received produit event:', event); // Afficher le message reçu

        // Traiter l'événement de produit en fonction du type d'événement
        switch (event.eventType) {
          case 'creation':
            handleProduitCreation(event.produitData); // Gérer la création de produit
            break;
          case 'modification':
            handleProduitModification(event.produitData); // Gérer la modification de produit
            break;
          case 'suppression':
            handleProduitSuppression(event.produitData); // Gérer la suppression de produit
            break;
          default:
            console.warn('Event type not recognized:', event.eventType); // Avertir en cas de type inconnu
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error); // Gérer les erreurs
  }
};

// Logique pour gérer la création de produit
const handleProduitCreation = (produitData) => {
  console.log('Handling produit creation event:', produitData);
  // Ajoutez votre logique pour gérer la création de produit ici
};

// Logique pour gérer la modification de produit
const handleProduitModification = (produitData) => {
  console.log('Handling produit modification event:', produitData);
  // Ajoutez votre logique pour gérer la modification de produit ici
};

// Logique pour gérer la suppression de produit
const handleProduitSuppression = (produitData) => {
  console.log('Handling produit suppression event:', produitData);
  // Ajoutez votre logique pour gérer la suppression de produit ici
};

// Exécuter le consommateur Kafka
run().catch(console.error); // Gérer les erreurs globales
