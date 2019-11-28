import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import * as uuid from "uuid";

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
      amount: Float!
      date: String!
      user: User!
    }
    type User{
      id: ID!
      name: String!
      password: String!
      bills: [Bill]!
      token: ID
    }
    type Query{
      getUsers: [User] 
    }

    type Mutation{
      addUser(name: String!, password: String!): User!
      addBill(name: String!, token: ID!, description: String!, amount: Float!): Bill!
      login(name: String!, password: String!): String!
      logout(name: String!, token: String!): String
    }
      `;

  const resolvers = {

    Query:{
      getUsers: async (parent, args, ctx, info) => {
        const { client } = ctx;
        const db = client.db("authentication");
        const collection = db.collection("users");
        const result = await collection.find({}).toArray();
        return result;
      }
    },
    Mutation: {
      addUser: async (parent, args, ctx, info) => {
        const { name, password } = args;
        const { client } = ctx;

        const db = client.db("authentication");
        const collection = db.collection("users");

        const notOk = await collection.findOne({name});
        if(!notOk){
          
          const token = null;
          const result = await collection.insertOne({ name, password });
  
          return {
            name,
            password,
            token,
            id: result.ops[0]._id
          };
        } 
        else{
          return new Error("Username already in use");
        }
      },

      addBill: async (parent, args, ctx, info) => {
        const { name, token, description, amount } = args;
        const { client } = ctx;

        const db = client.db("authentication");
        const collectionBills = db.collection("bills");
        const collectionUsers = db.collection("users");

        const date = new Date().getDate();

        const ok = await collectionUsers.findOne({name, token});
        if (ok){
          const user = ok._id;
          const result = await collectionBills.insertOne({
            user,
            description,
            amount
          });
  
          return {
            user,
            description,
            amount,
            date,
            id: result.ops[0]._id
          };
        }
        else{
          return new Error("Could not add bill");
        }
        
      },

      login: async (parent, args, ctx, info) => {
        const {name, password} = args;
        const { client } = ctx;

        const db = client.db("authentication");
        const collection = db.collection("users");
        
        const ok = await collection.findOne({name, password});
        
        if (ok){
          const token = uuid.v4();
          await collection.updateOne(
            { name: name },
            { $set: {token: token}}
          );
         return token;
        }
        else{
          return new Error("Error: User not found");
        }
      },

      logout: async (parent, args, ctx, info) => {
        const {name, token} = args;
        const { client } = ctx;

        const db = client.db("authentication");
        const collection = db.collection("users");
        
        const ok = await collection.findOne({name, token});
        
        if (ok){
          const token = null;
          await collection.updateOne(
            { name: name },
            { $set: {token: token}}
          );
         return "Logout successfuly";
        }
        else{
          return new Error("Error: User not found");
        }
      },

    }
  };
  const server = new GraphQLServer({ typeDefs, resolvers, context });
  const options = {
    port: 8000
  };

  try {
    server.start(options, ({ port }) =>
      console.log(
        `Server started, listening on port ${port} for incoming requests.`
      )
    );
  } catch (e) {
    console.info(e);
    server.close();
  }
};

const runApp = async function() {
  const client = await connectToDb(usr, pwd, url);
  console.log("Connect to Mongo DB");
  try {
    runGraphQLServer({ client });
  } catch (e) {
    console.log(e);
    client.close();
  }
};

runApp();
