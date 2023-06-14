const express = require('express');
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 4214
require('dotenv').config()
const Stripe = require('stripe')(process.env.PAYMENT_TOKEN)



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


app.get('/', (req, res) => {
    res.send("learning magic start from here")
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const classCollection = DB.collection('populerClass')
        const instructorsCollection = DB.collection('instructors')
        const cartCollection = DB.collection('cart')
        const usersCollection = DB.collection('users')
        const paidClassCollection = DB.collection('paymentHistory')



        // save user
        app.post('/user', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const matchUser = await usersCollection.findOne(query)
            if (matchUser) {
                return res.send({ message: "user already exist on the data base" })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.get("/user", async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        //Update user role as admin

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateToAdmin = {
                $set: {
                    role: "admin"
                },

            }
            const result = await usersCollection.updateOne(filter, updateToAdmin)
            res.send(result)
        })
        //   update user role as instructor
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateToAdmin = {
                $set: {
                    role: "instructor"
                },

            }
            const result = await usersCollection.updateOne(filter, updateToAdmin)
            res.send(result)
        })

        //   check user Authorization
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;

            // if (req.decoded.email !== email) {
            //   res.send({ admin: false }); 
            // }
            //  if {
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { role: user?.role };
            res.send(result);
            // }
        });




        // jwt oparations
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "100h" })
            res.send(token)
        })

        app.get("/populerClass", async (req, res) => {
            try {
              const result = await classCollection.find().sort({ enrolled: -1 }).toArray();
              res.send(result);
            } catch (error) {
              console.error(error);
              res.status(500).send("Internal Server Error");
            }
          });

        app.post('/class', async (req, res) => {
            const newClass = req.body;
            const result = await classCollection.insertOne(newClass)
            res.send(result)
        })

        // added class api
        app.get("/addedClass/:email", varifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { instructorEmail: email };
            const result = await classCollection.find(query).toArray()
            res.send(result)
        })

        // approve api
        app.patch('/class/approve/:id', async (req, res) => {
            try {
                const classId = req.params.id;
                const query = { _id: new ObjectId(classId) };
                const update = { $set: { status: 'approved' } };

                const result = await classCollection.updateOne(query, update);

                if (result.modifiedCount === 0) {
                    return res.status(404).send('Class not found');
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });
        //   deny api

        app.patch('/class/deny/:id', async (req, res) => {
            try {
                const classId = req.params.id;
                const query = { _id: new ObjectId(classId) };
                const update = { $set: { status: 'denied' } };

                const result = await classCollection.updateOne(query, update);

                if (result.modifiedCount === 0) {
                    return res.status(404).send('Class not found');
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        // feedback api
        // ...

        // Add feedback to class
        app.post('/class/:id/feedback', async (req, res) => {
            try {
                const classId = req.params.id;
                const feedback = req.body;
                const query = { _id: new ObjectId(classId) };
                const update = { $set: { feedback } };

                const result = await classCollection.updateOne(query, update);

                if (result.modifiedCount === 0) {
                    return res.status(404).send('Class not found');
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        // ...



        // update api
        app.patch('/update-class/:id', async (req, res) => {
            try {
                const classId = req.params.id;
                const updatedClass = req.body;

                const query = { _id: new ObjectId(classId) };
                const update = { $set: updatedClass };

                const result = await classCollection.updateOne(query, update);

                if (result.modifiedCount === 0) {
                    return res.status(404).send('Class not found');
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });


        // instructors
        app.get("/instructors", async (req, res) => {
            const result = await instructorsCollection.find().sort({ numberOfStudents: -1 }).toArray()
            res.send(result)
        })

        // 
        // create payment intent api
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;
            const paymentIntent = await Stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        app.post('/payment', varifyJWT, async (req, res) => {
            const paidItems = req.body;
            const result = await paidClassCollection.insertOne(paidItems);
            const query = {
                _id: { $in: paidItems.cartItems.map(id => new ObjectId(id)) },
            };
            const update = { $inc: { enrolled: 1 } };
            
            await classCollection.updateMany(query, update);
            
            const deleteQuery = {
                classId: { $in: paidItems.cartItems.map(id => id) },
              };
              
              const deleteCart = await cartCollection.deleteMany(deleteQuery);
            res.send({ result, deleteCart });
        });

        app.get("/payment/:email", async(req,res) =>{
            const email = req.params.email;
            const query = {email: email}
            const result = await paidClassCollection.find(query).sort({data: -1}).toArray()
            res.send(result)
        })





        // cartItem
        app.post("/cart", async (req, res) => {
            const item = req.body;
            const result = await cartCollection.insertOne(item);

            // Subtract 1 seat from the popularClass collection
            const classId = item.classId; // Assuming you have a classId field in the item object
            const query = { _id: new ObjectId(classId) };
            const update = { $inc: { availableSeats: -1 } };
            await classCollection.updateOne(query, update);

            res.send(result);
        });

        app.get("/cart", varifyJWT, async (req, res) => {
            try {
                const email = req.query.email;
                const query = { user: email };
                const result = await cartCollection.find(query).toArray();

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.delete("/cart/:id", async (req, res) => {
            try {
                const cartItemId = req.params.id;

                const cartQuery = { _id: new ObjectId(cartItemId) };
                const cartItem = await cartCollection.findOne(cartQuery);
                console.log(cartItem)

                if (!cartItem) {
                    return res.status(404).send("Cart item not found");
                }

                const classId = cartItem.classId; // Assuming id field in the cart item corresponds to _id field of the class
                const classQuery = { _id: new ObjectId(classId) };
                const update = { $inc: { availableSeats: 1 } };

                //   Update the availableSeats in the popularClass collection
                await classCollection.updateOne(classQuery, update);
                const result = await cartCollection.deleteOne(cartQuery);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`server is running on ${port}`)
})
