const express = require('express')
const dontenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dontenv.config()
const app = express()

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI
const PORT = process.env.PORT


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
    const db = client.db("studynook");
    const roomsCollection = db.collection("rooms");


    app.get('/rooms', async(req,res) => {
      const result = await roomsCollection.find().toArray();
      res.json(result);
    })

    app.get('/rooms/:id', async(req,res) => {
       const { id } = req.params;
      console.log(id)
      const result = await roomsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.json(result);
    })

    app.post("/rooms", async (req, res) => {
      const roomsdata = req.body;
      console.log(roomsdata);
      const result = await roomsCollection.insertOne(roomsdata);

      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) => {
    res.send("Server is running fine")
})

app.listen(PORT, ()=>{
    console.log(PORT)
})