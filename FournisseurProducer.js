const { Kafka } = require('kafkajs'); // Importez le module Kafka

const kafka = new Kafka({
  clientId: 'fournisseur-producer', // Identifiant du client Kafka
  brokers: ['localhost:9092'], // Adresse des brokers Kafka
});

const producer = kafka.producer(); // Créez le producteur Kafka

const sendSupplierMessage = async (eventType, fournisseurData) => {
  try {
    await producer.connect(); // Connectez-vous au broker Kafka
    await producer.send({
      topic: 'fournisseur-events', // Le topic où envoyer les événements liés aux fournisseurs
      messages: [{ value: JSON.stringify({ eventType, fournisseurData }) }], // Message sous forme de JSON
    });
    console.log('Message Kafka envoyé avec succès pour l\'événement:', eventType);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Kafka:', error);
  } finally {
    await producer.disconnect(); // Déconnectez-vous du broker Kafka
  }
};

module.exports = {
  sendSupplierMessage,
};
