const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//MongoDB URL
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gikxdnx.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Server is running");
});
async function run() {
  try {
    await client.connect();
    const db = client.db("foodDB");
    const foodCollection = db.collection("foods");

    //  Add Food
    app.post("/foods", async (req, res) => {
      const food = req.body;
      //DeaFault food status
      food.food_status = "Available";
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    //reAd food Item

    app.get("/foods", async (req, res) => {
      const result = await foodCollection
        .find({ food_status: "Available" })
        .toArray();
      res.send(result);
    });

    //Read single Items
    app.get("/foods/:id", async (req, res) => {
      const result = await foodCollection
        .find({ food_status: "Available" })
        .toArray();
      res.send(result);
    });

    //reads food itesm by logged in User
    app.get("/my-foods/:email", async (req, res) => {
      const email = req.params.email;
      const result = await foodCollection
        .find({ donator_email: email })
        .toArray();
      res.send(result);
    });

    //Updated food item
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;

      const query = { _id: new ObjectId(id) };
      const update = { $set: updatedFood };
      const result = await foodCollection.updateOne(query, update);
      res.send(result);
    });

    //Delete food
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(" Successfully connected to MongoDB!");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
