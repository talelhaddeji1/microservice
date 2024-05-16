const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Produit = require('./produit'); // Modèle Mongoose pour les produits
const { sendProduitMessage } = require('./ProductProducer'); // Producteur Kafka pour les produits

// Chemin vers le fichier Protobuf des produits
const produitProtoPath = './produit.proto'; 

// Charger le Protobuf
const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Produit du package gRPC
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/microservices') // Connexion à MongoDB
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitter si la connexion échoue
  });

// Implémentation du service gRPC pour les produits
const produitService = {
  getProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findById(produitId);

      if (!produit) {
        return callback(new Error("Produit non trouvé"));
      }

      callback(null, { produit }); // Retourner le produit trouvé
    } catch (err) {
      callback(new Error("Erreur lors de la recherche du produit: " + err.message)); // Gérer les erreurs
    }
  },

  searchProduits: async (call, callback) => {
    try {
      const produits = await Produit.find(); // Obtenir tous les produits
      callback(null, { produits });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des produits: " + err.message));
    }
  },

  createProduit: async (call, callback) => {
    try {
      const { nom, description } = call.request;
      const nouveauProduit = new Produit({ nom, description });
      const produit = await nouveauProduit.save();

      // Envoyer un événement Kafka pour la création d'un produit
      await sendProduitMessage('creation', produit);

      callback(null, { produit });
    } catch (err) {
      callback(new Error("Erreur lors de la création du produit: " + err.message));
    }
  },

  updateProduit: async (call, callback) => {
    try {
      const { produit_id, nom, description } = call.request;
      const produit = await Produit.findByIdAndUpdate(
        produit_id,
        { nom, description },
        { new: true } // Retourner le produit mis à jour
      );

      if (!produit) {
        return callback(new Error("Produit non trouvé"));
      }

      // Envoyer un événement Kafka pour la mise à jour d'un produit
      await sendProduitMessage('modification', produit);

      callback(null, { produit });
    } catch (err) {
      callback(new Error("Erreur lors de la mise à jour du produit: " + err.message));
    }
  },

  deleteProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findByIdAndDelete(produitId);

      if (!produit) {
        return callback(new Error("Produit non trouvé"));
      }

      // Envoyer un événement Kafka pour la suppression d'un produit
      await sendProduitMessage('suppression', produit);

      callback(null, { message: "Produit supprimé avec succès" });
    } catch (err) {
      callback(new Error("Erreur lors de la suppression du produit: " + err.message));
    }
  },
};

// Créer le serveur gRPC
const server = new grpc.Server();
server.addService(produitProto.ProduitService.service, produitService); 

server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Produit opérationnel sur le port ${boundPort}`); // Confirmation du démarrage
});
