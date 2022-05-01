const fs = require('fs');
const express = require('express');
const { ApolloServer, UserInputError } = require('apollo-server-express');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost/bookworm';

let db;

let aboutMessage = "Bookworm API v1.0";

const GraphQLDate = new GraphQLScalarType({
  name: 'GraphQLDate',
  description: 'A Date() type in GraphQL as a scalar',
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    const dateValue = new Date(value);
    return isNaN(dateValue) ? undefined : dateValue;
  },
  parseLiteral(ast) {
    if (ast.kind == Kind.STRING) {
      const value = new Date(ast.value);
      return isNaN(value) ? undefined : value;
    }
  },
});

const resolvers = {
  Query: {
    about: () => aboutMessage,
    usernum,
    userList,
    bookList,
    orderList,
  },
  Mutation: {
    setAboutMessage,
    userAdd,
    userCheck,
    bookAdd,
    orderAdd,
    reviewAdd,
    orderUpdate,
    orderReview,
  },
  GraphQLDate,
};

function setAboutMessage(_, { message }) {
  return aboutMessage = message;
}

async function usernum() {
  const usernum = await db.collection("users").find({}).count();
  return usernum;
}

async function userList() {
  const users = await db.collection("users").find({}).toArray();
  return users;
}

async function userAdd(_, { user }) {
  const count = await db
    .collection("users")
    .find({ email: user.email })
    .count();
  if (count > 0) {
    console.log("The email has been registered!");
    return "duplicated";
  }

  const result = await db.collection("users").insertOne(user);
  return "Done";
}

async function userCheck(_, { user }) {
  const passwordusers = await db
    .collection("users")
    .find({ email: user.email }).toArray();
  const password = passwordusers[0].password
  // console.log(password)
  if (password !== user.password) {
    console.log("password doesn't match");
    return "notmatch";
  }
  const currentuser = await db.collection('users')
    .findOne({ email: user.email });
  console.log(currentuser._id)
  return currentuser._id;
  // return "match";
}

async function bookList() {
  const books = await db.collection('books').find({}).toArray();
  return books;
}

async function getNextSequence(name) {
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { current: 1 } },
    { returnOriginal: false },
  );
  return result.value.current;
}

// function issueValidate(issue) {
//   const errors = [];
//   if (issue.title.length < 3) {
//     errors.push('Field "title" must be at least 3 characters long.');
//   }
//   if (issue.status === 'Assigned' && !issue.owner) {
//     errors.push('Field "owner" is required when status is "Assigned"');
//   }
//   if (errors.length > 0) {
//     throw new UserInputError('Invalid input(s)', { errors });
//   }
// }

async function bookAdd(_, { book }) {
  // bookValidate(book);
  // book.created = new Date();
  book.id = await getNextSequence('books');
  // book.ownerid = 1;

  const result = await db.collection('books').insertOne(book);
  const savedBook = await db.collection('books')
    .findOne({ _id: result.insertedId });
  return savedBook;
}


async function orderList() {
  const orders = await db.collection('orders').find({}).toArray();
  return orders;
}

async function orderAdd(_, { order }) {
  // orderValidate(order);
  order.created = new Date();
  order.id = await getNextSequence('orders');

  const result = await db.collection('orders').insertOne(order);
  const savedOrder = await db.collection('orders')
    .findOne({ _id: result.insertedId });
  return savedOrder;
}

async function orderUpdate(_, { order }) {

  const result = await db.collection('orders').updateOne(
    { id: order.id },
    {
      $set: {
        status: "Delivered",
      }
    }
  );
  const updatedOrder = await db.collection('orders')
    .findOne({ id: order.id });
  return updatedOrder;
}


async function orderReview(_, { orderid }) {

  const result = await db.collection('orders').updateOne(
    { id: orderid },
    {
      $set: {
        status: "Rated",
      }
    }
  );
  const updatedOrder = await db.collection('orders')
    .findOne({ id: orderid });
  return updatedOrder;
}

async function reviewAdd(_, { review }) {
  review.created = new Date();
  const result = await db.collection('review').insertOne(review);
  return "Done";
}

async function connectToDb() {
  const client = new MongoClient(url, { useNewUrlParser: true });
  await client.connect();
  console.log('Connected to MongoDB at', url);
  db = client.db();
}

const server = new ApolloServer({
  typeDefs: fs.readFileSync('./server/schema.graphql', 'utf-8'),
  resolvers,
  formatError: error => {
    console.log(error);
    return error;
  },
});

const app = express();

app.use(express.static('public'));

server.applyMiddleware({ app, path: '/graphql' });

(async function () {
  try {
    await connectToDb();
    app.listen(3000, function () {
      console.log('App started on port 3000');
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
})();