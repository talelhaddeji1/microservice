const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fournisseurSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const Fournisseur = mongoose.model('Fournisseur', fournisseurSchema);

module.exports = Fournisseur; // Assurez-vous que le modèle est bien exporté
