const { ApolloError } = require('apollo-server'); // Pour gérer les erreurs Apollo
const Fournisseur = require('./fournisseur'); // Modèle Mongoose Fournisseur
const Produit = require('./produit'); // Modèle Mongoose Produit
const grpc = require('@grpc/grpc-js'); // Client gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf

const { sendSupplierMessage } = require('./FournisseurProducer'); // Producteur Kafka pour les fournisseurs
const { sendProduitMessage } = require('./ProductProducer'); // Producteur Kafka pour les produits

// Charger les fichiers Protobuf
const fournisseurProtoPath = './fournisseur.proto';
const produitProtoPath = './produit.proto';

// Charger les définitions Protobuf
const fournisseurProtoDefinition = protoLoader.loadSync(fournisseurProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Obtenir les services gRPC
const fournisseurProto = grpc.loadPackageDefinition(fournisseurProtoDefinition).fournisseur;
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;

// Créer les clients gRPC
const clientFournisseur = new fournisseurProto.FournisseurService(
  'localhost:50053', // Adresse du service Fournisseur
  grpc.credentials.createInsecure() // Credentials
);

const clientProduit = new produitProto.ProduitService(
  'localhost:50054', // Adresse du service Produit
  grpc.credentials.createInsecure() // Credentials
);


// Résolveurs GraphQL avec Kafka
const resolvers = {
  Query: {
    fournisseur: async (_, { id }) => {
      try {
        return await Fournisseur.findById(id); // Trouver le fournisseur par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    fournisseurs: async () => {
      try {
        return await Fournisseur.find(); // Trouver tous les fournisseurs
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des fournisseurs: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    produit: async (_, { id }) => {
      try {
        return await Produit.findById(id); // Trouver le produit par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    produits: async () => {
      try {
        return await Produit.find(); // Trouver tous les produits
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des produits: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
  
  Mutation: {
    createFournisseur: async (_, { nom, description }) => {
      try {
        const nouveauFournisseur = new Fournisseur({ nom, description });
        const fournisseur = await nouveauFournisseur.save(); // Sauvegarder le fournisseur
        
        // Envoyer un message Kafka pour l'événement de création de fournisseur
        await sendSupplierMessage('creation', { id: fournisseur._id, nom, description });

        return fournisseur; // Retourner le fournisseur créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteFournisseur: async (_, { id }) => {
      try {
        const fournisseur = await Fournisseur.findByIdAndDelete(id); // Supprimer par ID
        if (!fournisseur) {
          throw new ApolloError("Fournisseur non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de suppression de fournisseur
        await sendSupplierMessage('suppression', { id });

        return "Fournisseur supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    updateFournisseur: async (_, { id, nom, description }) => {
      try {
        const fournisseur = await Fournisseur.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le fournisseur mis à jour
        );
        
        if (!fournisseur) {
          throw new ApolloError("Fournisseur non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de fournisseur
        await sendSupplierMessage('modification', { id: fournisseur._id, nom, description });

        return fournisseur; // Fournisseur mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du fournisseur: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    createProduit: async (_, { nom, description }) => {
      try {
        const nouveauProduit = new Produit({ nom, description });
        const produit = await nouveauProduit.save(); // Sauvegarder le produit
        
        // Envoyer un message Kafka pour l'événement de création de produit
        await sendProduitMessage('creation', { id: produit._id, nom, description });

        return produit; // Retourner le produit créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteProduit: async (_, { id }) => {
      try {
        const produit = await Produit.findByIdAndDelete(id); // Supprimer par ID
        
        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de suppression de produit
        await sendProduitMessage('suppression', { id });

        return "Produit supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    updateProduit: async (_, { id, nom, description }) => {
      try {
        const produit = await Produit.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le produit mis à jour
        );
        
        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de produit
        await sendProduitMessage('modification', { id, nom, description });

        return produit; // Produit mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
};

module.exports = resolvers;