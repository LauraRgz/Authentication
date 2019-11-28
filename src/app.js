import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";

import "babel-polyfill";
import { rejects } from "assert";
import { json } from "express";

const usr = "Laura";
const pwd = "Pabl11";
const url = "cluster0-eqbhg.gcp.mongodb.net/test?retryWrites=true&w=majority";

/**
 * Connects to MongoDB Server and returns connected client
 * @param {string} usr MongoDB Server user
 * @param {string} pwd MongoDB Server pwd
 * @param {string} url MongoDB Server url
 */

const connectToDb = async function(usr, pwd, url) {
  const uri = `mongodb+srv://${usr}:${pwd}@${url}`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await client.connect();
  return client;
};

const runGraphQLServer = function(context) {
  const typeDefs = `
    type Bill{
        id: ID!
        description: String!
        date: String!
        user: User!
    }
    type User{
        id: ID!
        name: String!
        password: String!
        bills: [Bill]!
    }
    
    type Query{
        getBills(): [Bill]!
    }
    type Mutation{
        addUser(): Author!
        login(): String!
        logout(): String!
        removeUser(): String!
        
    }
      `;

  const resolvers = {
      Query: {},

      Mutation: {}


  }
};

const runApp = async function() {
    const client = await connectToDb(usr, pwd, url);
    console.log("Connect to Mongo DB");
  
    runGraphQLServer({ client });
  };
  
  runApp();
