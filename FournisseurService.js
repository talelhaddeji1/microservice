const Fournisseur = require('./fournisseur'); // Modèle Mongoose pour les fournisseurs
const { sendSupplierMessage } = require('./FournisseurProducer'); // Producteur Kafka

// Créer un nouveau fournisseur
const createFournisseur = async (nom, description) => {
  const nouveauFournisseur = new Fournisseur({ nom, description });
  const fournisseur = await nouveauFournisseur.save(); // Sauvegarder le fournisseur

  // Envoyer un message Kafka pour la création du fournisseur
  await sendSupplierMessage('creation', { id: fournisseur._id, nom, description });

  return fournisseur;
};

// Obtenir tous les fournisseurs
const getFournisseurs = async () => {
  return await Fournisseur.find(); // Utilisez `await` pour obtenir tous les fournisseurs
};

// Obtenir un fournisseur par ID
const getFournisseurById = async (id) => {
  return await Fournisseur.findById(id); // Utilisez `await` pour trouver un fournisseur par son ID
};

// Supprimer un fournisseur par ID
const deleteFournisseur = async (fournisseurId) => {
  const fournisseur = await Fournisseur.findByIdAndDelete(fournisseurId); // Utilisez `findByIdAndDelete`
  if (!fournisseur) {
    throw new Error("Fournisseur non trouvé"); // Si le fournisseur n'existe pas
  }

  // Envoyer un message Kafka pour la suppression du fournisseur
  await sendSupplierMessage('suppression', { id: fournisseurId });

  return fournisseur; // Retournez le fournisseur supprimé
};

// Exporter les services
module.exports = {
  createFournisseur,
  getFournisseurs,
  getFournisseurById,
  deleteFournisseur,
};
