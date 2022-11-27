const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4gwnm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const categoryCollection = client.db("carResale").collection("catagory");
    const userCollection = client.db("carResale").collection("users");
    const bookedCategoryCollection = client
      .db("carResale")
      .collection("bookCategory");
    app.get("/", (req, res) => {
      res.send("server is running");
    });
    // all category get api section
    app.get("/category", async (req, res) => {
      const query = {};
      const categoryItem = await categoryCollection.find(query).toArray();
      res.send(categoryItem);
    });
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoryCollection.findOne(query);
      res.send(result);
    });

    app.get("/booked", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await bookedCategoryCollection.find(query).toArray();
      res.send(result);
    });
    // category post api section
    app.post("/category", async (req, res) => {
      const user = req.body;
      const result = await bookedCategoryCollection.insertOne(user);
      res.send(result);
    });

    // user post api section
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/user/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isSeller: user?.role === "Seller" });
    });
    app.get("/user/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isBuyer: user?.role === "Buyer" });
    });
    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    app.post("/product", async (req, res) => {
      const user = req.query.name;
      const filter = { name: user };
      const currentProduct = await categoryCollection.findOne(filter);
      const updateDoc = {
        $set: { category: [...currentProduct.category, req.body] },
      };
      const result = await categoryCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.get("/all/user", async (req, res) => {
      const query = {};
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });
    app.delete("/user/remove/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // code is fine
  }
}

run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
