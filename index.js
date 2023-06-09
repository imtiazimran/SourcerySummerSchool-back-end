const express = require('express');
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 4214
require('dotenv').config()


// middleware
app.use(cors())
app.use(express.json())


const varifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({ error: true, message: "Unauthorized Access" })
    }
  
    // barer token
    const token = authorization.split(" ")[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: true, message: "Unauthorized Access: Invalide Token" })
      }
      req.decoded = decoded
      next()
    })
  }


app.get('/', (req, res) =>{
    res.send("learning magic start from here")
})



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5ujci4u.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1, 
    strict: true,
    deprecationErrors: true,
  }
}); 

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const DB = client.db('SorcerySummerSchool')
    const popularCollection = DB.collection('populerClass')
    const instructorsCollection = DB.collection('instructors')
    const cartCollection = DB.collection('cart')
    const usersCollection = DB.collection('users')



    // save user
    app.post('/user', async(req, res) =>{
        const user = req.body;
        const query = {email: user.email}
        const matchUser = await usersCollection.findOne(query)
        if(matchUser){
            return res.send({message: "user already exist on the data base"})
        }
        const result = await usersCollection.insertOne(user)
        res.send(result)
    })



    // jwt oparations
    app.post("/jwt", (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "100h" })
        res.send(token)
      })

    app.get("/populerClass", async(req,res) =>{
        const result = await popularCollection.find().toArray()
        res.send(result)
    }) 

    app.get("/instructors", async(req,res) =>{
        const result = await instructorsCollection.find().sort({ numberOfStudents: -1 }).toArray()
        res.send(result)
    }) 


    // cartItem
    app.post("/cart", async(req, res) =>{
        const item = req.body;
        const result = await cartCollection.insertOne(item)
        res.send(result)
    })
    app.get("/cart/:email", async(req, res) =>{
        const email = req.params.email
        const query = {email: email}
        const result = cartCollection.find(query).toArray()
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, ()=>{
    console.log(`server is running on ${port}`)
})