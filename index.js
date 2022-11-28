const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const stripe = require("stripe")(
  "sk_test_51M8sIhC5A2QyBeq598oZ9wUv5EnQfEuwyFFxywcGElgRbBjhudTdlxS94AHSw50rcvksLAeFCR1XEbAas7c2vmaa00IFYbxTKD"
);

// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.ACCSESS_TOKEN);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4gwnm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// function verifyJWT(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send("unauthorized access");
//   }
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCSESS_TOKEN, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "forbidden access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// }

async function run() {
  try {
    const categoryCollection = client.db("carResale").collection("catagory");
    const userCollection = client.db("carResale").collection("users");
    const paymentsCollection = client.db("carResale").collection("payment");
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

    // jwt token api section
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCSESS_TOKEN, {
          expiresIn: "10d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    app.get("/booked", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await bookedCategoryCollection.find(query).toArray();
      res.send(result);
    });

    // payment api
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    app.get("/booked/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookedCategoryCollection.findOne(query);
      res.send(booking);
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

    app.post("/google/user", async (req, res) => {
      const filter = req.body;
      const option = { upsert: true };
      const update = {
        $set: {
          role: "Buyer",
        },
      };
      const result = await userCollection.updateOne(filter, update, option);
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

    app.put("/user/verify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const update = {
        $set: {
          verify: "true",
        },
      };
      const result = await userCollection.updateOne(filter, update, option);
      res.send(result);
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
