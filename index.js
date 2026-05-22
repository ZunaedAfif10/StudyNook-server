const express = require('express')
const dontenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  }
  catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};


async function run() {
  try {
    // await client.connect();
    const db = client.db("studynook");
    const roomsCollection = db.collection("rooms");
    const bookingCollection = db.collection("bookings");


    app.get('/rooms', async (req, res) => {
      const result = await roomsCollection.find().toArray();
      res.json(result);
    })


    app.get('/rooms/featured', async (req, res) => {
      const result = await roomsCollection.find()
      .sort({ createdAt: -1 }) 
      .limit(6).toArray();
      // console.log(result)              
      res.json(result);
    })

    app.get('/rooms/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      // console.log(id)
      const result = await roomsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.json(result);
    })

    app.get("/listing/:userId",verifyToken, async (req, res) => {
      const { userId } = req.params;

      const result = await roomsCollection.find({ user_Id: userId }).toArray();

      res.json(result);
    });


    app.post("/rooms",verifyToken, async (req, res) => {
      const roomsdata = req.body;
      // console.log(roomsdata);
      const result = await roomsCollection.insertOne(roomsdata);

      res.json(result);
    });

    app.get("/bookings/:userId",verifyToken, async (req, res) => {
      const { userId } = req.params;

      const result = await bookingCollection.find({ user_Id: userId }).toArray();

      res.json(result);
    });

    app.delete("/rooms/:id",verifyToken, async (req, res) => {
      const { id } = req.params;
      console.log(id)
      const result = await roomsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.patch("/rooms/:id",verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      // console.log(updatedData);

      const result = await roomsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      res.json(result);
    });


    app.patch("/bookings/:id",verifyToken, async (req, res) => {
      const { id } = req.params;

      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "cancelled"
          }
        }
      );

      res.json(result);
    });

    app.post('/bookings',verifyToken, async (req, res) => {
      const bookingData = req.body;
      const { roomName, date, startTime, endTime } = bookingData
      // console.log(date,startTime,endTime)

      const conflict = await bookingCollection.findOne({
        roomName,
        date,
        $and: [
          {
            startTime: { $lt: endTime },
          },
          {
            endTime: { $gt: startTime },
          },
        ],
      });

      if (conflict) {
        return res.status(400).json({
          message: "Time slot already booked",
        });
      }

      const result = await bookingCollection.insertOne(bookingData);

      res.json({
        message: "Booking successful",
        result,
      });
    })

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("Server is running fine")
})

app.listen(PORT, () => {
  console.log(PORT)
})