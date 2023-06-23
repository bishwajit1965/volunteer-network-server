const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Mongo db connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l3p6wcn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    /**@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
     * CODE BELOW
     **@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/

    // Collections
    const usersCollection = client
      .db("volunteer-network-users")
      .collection("volunteers");

    const eventsCollection = client
      .db("volunteer-network-users")
      .collection("events");

    /**=========================================
     * VOLUNTEERS APIS
     **=========================================*/
    // Fetch all volunteers
    app.get("/volunteers", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Find a volunteer by id
    app.get("/volunteers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: {
          _id: 1,
          email: 1,
          date: 1,
          imageUrl: 1,
          description: 1,
          phone: 1,
          country: 1,
        },
      };
      const result = await usersCollection.findOne(query, options);
      res.send(result);
    });

    // Insert a volunteer
    app.post("/volunteers", async (req, res) => {
      const volunteer = req.body;
      const result = await usersCollection.insertOne(volunteer);
      res.send(result);
    });

    // Update a volunteer
    app.patch("/volunteers/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = req.body;
      const updatedVolunteer = {
        $set: {
          name: update.name,
          email: update.email,
          date: update.date,
          imageUrl: update.imageUrl,
          description: update.description,
          phone: update.phone,
          country: update.country,
        },
      };
      const result = usersCollection.updateOne(filter, updatedVolunteer);
      res.send(result);
    });

    // Delete a volunteer
    app.delete("/volunteers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    /**=========================================
     * EVENTS APIS
     **=========================================*/

    // Add an event

    // Create a multer storage configuration
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        // Access request-related information
        const userId = req.user.id; // Example: Accessing the user ID from the request object
        const uploadPath = `uploads/${userId}`; // Example: Constructing the upload path based on user ID
        cb(null, uploadPath); // Set the destination folder where the image will be saved
      },
      // Access the uploaded image file details
      // if(image) {
      //   // Save the image file to a specific location
      //   const imagePath = path.join(__dirname, "public/images", image.filename);
      //   // Move the uploaded file to the desired location
      //   fs.renameSync(image.path, imagePath);
      //   // Store the image file path or URL in the event object
      //   event.image = `/images/${image.filename}`;
      // },

      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileExtension = file.originalname.split(".").pop();
        cb(null, uniqueSuffix + "." + fileExtension); // Set a unique filename for the uploaded image
      },
    });

    // Create a multer instance with the storage configuration
    const upload = multer({ storage: storage });

    app.post("/events", upload.single("image"), async (req, res) => {
      try {
        const event = req.body;
        const image = req.file;
        const result = await eventsCollection.insertOne(event, image);
        res
          .status(201)
          .json({ message: "Event inserted successfully", result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
      }
    });

    // Fetch all events
    app.get("/events", async (req, res) => {
      const cursor = eventsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Fetch an event by id
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `event`, 'date', 'imageUrl' and `description` fields in the returned document
        projection: {
          _id: 0,
          event: 1,
          date: 1,
          imageUrl: 1,
          description: 1,
        },
      };
      const result = await eventsCollection.findOne(query, options);
      res.send(result);
    });

    /**@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
     * CODE ABOVE
     **@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*/

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("", (req, res) => {
  res.send("Volunteer network server is running");
});

app.listen(port, () => {
  console.log(`Volunteer network server id running on port: ${port}`);
});
