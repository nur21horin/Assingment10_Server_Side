const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//MongoDB URL
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gikxdnx.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const foodCollection = client.db("foodDB").collection("foods");

    //  Create (Add Food)
    app.post("/foods", async (req, res) => {
      const food = req.body;
      food.food_status = "Available"; 
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

   

    console.log(" Successfully connected to MongoDB!");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
