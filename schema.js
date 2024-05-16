const { gql } = require('@apollo/server');

const typeDefs = `#graphql
  type Fournisseur {
    id: String!
    nom: String!
    description: String!
  }

  type Produit {
    id: String!
    nom: String!
    description: String!
  }

  type Query {
    fournisseur(id: String!): Fournisseur
    fournisseurs: [Fournisseur]
    produit(id: String!): Produit
    produits: [Produit]
  }
  
  type Mutation {
    createFournisseur(nom: String!, description: String!): Fournisseur
    deleteFournisseur(id: String!): String
    createProduit(nom: String!, description: String!): Produit
    deleteProduit(id: String!): String
    updateFournisseur(id: String!, nom: String!, description: String!): Fournisseur # Mutation pour mettre à jour un fournisseur
    updateProduit(id: String!, nom: String!, description: String!): Produit
  }
`;

module.exports = typeDefs;
