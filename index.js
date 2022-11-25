const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

// tEpCPkhvIU3r5wGm
//  carResale

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4gwnm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const categoryCollection = client.db("carResale").collection("catagory");
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
    // category post api section
    app.post("/category", async (req, res) => {
      const user = req.body;
      const result = await bookedCategoryCollection.insertOne(user);
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
