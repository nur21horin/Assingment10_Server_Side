const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gikxdnx.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Root test route
app.get("/", (req, res) => {
  res.send("Food Sharing Server is Running...");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("foodDB");
    const foodCollection = db.collection("foods");
    const requestsCollection = db.collection("requests");

    //Add food item
    app.post("/foods", async (req, res) => {
      try {
        const food = req.body;
        food.food_status = "Available";
        const result = await foodCollection.insertOne(food);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add food", error });
      }
    });

    //CREATE FOOD REQUEST
     
    app.post("/requests", async (req, res) => {
      const { food_id, user_name, user_email } = req.body;

      if (!food_id || !user_email || !user_name) {
        return res.status(400).send({ message: "Missing required fields" });
      }

      try {
        // Check if food exists and available
        const food = await foodCollection.findOne({
          _id: new ObjectId(food_id),
          food_status: "Available",
        });

        if (!food) {
          return res.status(404).send({ message: "Food not available" });
        }

        // Check duplicate request
        const existing = await requestsCollection.findOne({
          food_id,
          user_email,
        });
        if (existing) {
          return res
            .status(409)
            .send({ message: "Already requested this food" });
        }

        // Insert new request
        const requestDoc = {
          food_id,
          user_name,
          user_email,
          requested_at: new Date(),
          status: "Pending",
        };
        const result = await requestsCollection.insertOne(requestDoc);

        // // Update food status to "Requested"
        // await foodCollection.updateOne(
        //   { _id: new ObjectId(food_id) },
        //   { $set: { food_status: "Requested" } }
        // );

        res.status(201).send({
          message: "Request submitted successfully",
          requestId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to submit request", error });
      }
    });
    //get all request by user email

    app.get("/requests/:email", async (req, res) => {
      const email = req.params.email;

      try {
        const requests = await requestsCollection
          .find({ user_email: email })
          .toArray();

        res.send(requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).send({ message: "Failed to fetch requests" });
      }
    });

    //get Avaubleble food 
    app.get("/foods", async (req, res) => {
      try {
        const foods = await foodCollection
          .find({ food_status: "Available" })
          .toArray();
        res.send(foods);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch foods", error });
      }
    });

    //Get featured foood j
    app.get("/foods/featured", async (req, res) => {
      try {
        const topFoods = await foodCollection
          .find({ food_status: "Available", featured: true })
          .limit(6)
          .toArray();
        res.send(topFoods);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch featured foods", error });
      }
    });

    //SIngle Food Item
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const food = await foodCollection.findOne({ _id: new ObjectId(id) });
        if (!food) return res.status(404).send({ message: "Food not found" });
        res.send(food);
      } catch (error) {
        res.status(500).send({ message: "Invalid ID format" });
      }
    });

    /*GET FOODS BY DONATOR*/
    app.get("/my-foods/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const result = await foodCollection
          .find({ donator_email: email })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch user foods", error });
      }
    });

    //Updated food donator
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const { _id, ...updatedFood } = req.body;

      try {
        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedFood }
        );
        if (result.matchedCount === 0)
          return res.status(404).send({ message: "Food not found" });
        res.send({ message: "Food updated successfully", result });
      } catch (error) {
        console.error("Update food error:", error);
        res.status(500).send({ message: "Failed to update food", error });
      }
    });

    // DELETE FOOD
      
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await foodCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0)
          return res.status(404).send({ message: "Food not found" });
        res.send({ message: "Food deleted successfully" });
      } catch (error) {
        res.status(500).send({ message: "Failed to delete food", error });
      }
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
