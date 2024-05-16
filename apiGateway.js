const express = require('express'); // Framework Express
const bodyParser = require('body-parser'); // Pour traiter le JSON
const cors = require('cors'); // Pour autoriser les requêtes cross-origin

const connectDB = require('./database'); // Connexion à MongoDB
const Fournisseur = require('./fournisseur'); // Modèle Fournisseur
const Produit = require('./produit'); // Modèle Produit
const { sendSupplierMessage } = require('./FournisseurProducer'); // Producteur Kafka pour les fournisseurs
const { sendProduitMessage } = require('./ProductProducer'); // Producteur Kafka pour les produits

const app = express(); // Créer l'application Express

// Connexion à MongoDB
connectDB();

app.use(cors()); // Autoriser les requêtes cross-origin
app.use(bodyParser.json()); // Traiter le JSON

// Endpoints pour les fournisseurs
app.get('/fournisseur', async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.find(); // Obtenir tous les fournisseurs
    res.json(fournisseurs);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des fournisseurs: " + err.message);
  }
});

app.get('/fournisseur/:id', async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id); // Obtenir le fournisseur par ID
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    res.json(fournisseur);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du fournisseur: " + err.message);
  }
});

app.post('/fournisseur', async (req, res) => {
  try {
    const { nom, description } = req.body; // Obtenir les données du corps de la requête
    const nouveauFournisseur = new Fournisseur({ nom, description });
    const fournisseur = await nouveauFournisseur.save(); // Sauvegarder le fournisseur
// Envoyer un message Kafka pour l'événement de création
await sendSupplierMessage('creation', { id: fournisseur._id, nom, description });
    res.json(fournisseur); // Retourner le fournisseur créé
  } catch (err) {
    res.status(500).send("Erreur lors de la création du fournisseur: " + err.message);
  }
});

// Suppression d'un fournisseur par ID
app.delete('/fournisseur/:id', async (req, res) => {
  try {
    const fournisseurId = req.params.id;
    const fournisseur = await Fournisseur.findByIdAndDelete(fournisseurId); // Supprimer par ID

    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé"); 
    }
 // Envoyer un message Kafka pour l'événement de suppression
 await sendSupplierMessage('suppression', { id: fournisseur._id });
    res.send("Fournisseur supprimé avec succès"); 
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du fournisseur: " + err.message); 
  }
});


// Endpoints pour les produits
app.get('/produit', async (req, res) => {
  try {
    const produits = await Produit.find(); // Obtenir tous les produits
    res.json(produits);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des produits: " + err.message);
  }
});

app.get('/produit/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id); // Obtenir le produit par ID
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }
    res.json(produit);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du produit: " + err.message);
  }
});

app.post('/produit', async (req, res) => {
  try {
    const { nom, description } = req.body;
    const nouveauProduit = new Produit({ nom, description });
    const produit = await nouveauProduit.save(); // Sauvegarder le produit
// Envoyer un message Kafka pour l'événement de création de produit
await sendProduitMessage('creation', { id: produit._id, nom, description });
    res.json(produit); // Retourner le produit créé
  } catch (err) {
    res.status(500).send("Erreur lors de la création du produit: " + err.message);
  }
});
// Endpoint pour supprimer un produit par ID
app.delete('/produit/:id', async (req, res) => {
  try {
    const produitId = req.params.id; // ID du produit
    const produit = await Produit.findByIdAndDelete(produitId); // Supprimer par ID

    if (!produit) {
      return res.status(404).send("Produit non trouvé"); // Gérer le cas où le produit n'existe pas
    }
// Envoyer un message Kafka pour l'événement de suppression de produit
await sendProduitMessage('suppression', { id: produit._id });
    res.send("Produit supprimé avec succès"); // Message de confirmation
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du produit: " + err.message); // Gérer les erreurs
  }
});
// Endpoint pour mettre à jour un fournisseur par ID
app.put('/fournisseur/:id', async (req, res) => {
  try {
    const fournisseurId = req.params.id; // Obtenir l'ID du fournisseur
    const { nom, description } = req.body; // Obtenir les données de mise à jour

    const fournisseur = await Fournisseur.findByIdAndUpdate(
      fournisseurId, // Identifier le fournisseur à mettre à jour
      { nom, description }, // Données à mettre à jour
      { new: true } // Retourner le fournisseur mis à jour
    );

    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé"); // Gérer le cas où le fournisseur n'est pas trouvé
    }
 // Envoyer un message Kafka pour l'événement de modification
 await sendSupplierMessage('modification', { id: fournisseur._id, nom, description });
    res.json(fournisseur); // Retourner le fournisseur mis à jour
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du fournisseur: " + err.message); // Gérer les erreurs
  }
});
// Endpoint pour mettre à jour un produit par ID
app.put('/produit/:id', async (req, res) => {
  try {
    const produitId = req.params.id; // Obtenir l'ID du produit
    const { nom, description } = req.body; // Obtenir les données de mise à jour

    const produit = await Produit.findByIdAndUpdate(
      produitId, // Identifier le produit à mettre à jour
      { nom, description }, // Données à mettre à jour
      { new: true } // Retourner le produit mis à jour
    );

    if (!produit) {
      return res.status(404).send("Produit non trouvé"); // Gérer le cas où le produit n'est pas trouvé
    }
// Envoyer un message Kafka pour l'événement de modification de produit
await sendProduitMessage('modification', { id: produit._id, nom, description });
    res.json(produit); // Retourner le produit mis à jour
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du produit: " + err.message); // Gérer les erreurs
  }
});


// Démarrer le serveur Express
const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway opérationnel sur le port ${port}`); 
});
