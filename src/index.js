const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("../credentials/firebase.json");
const cron = require("node-cron");

const ngrok = require("@ngrok/ngrok");
const port = 3030;

const { getToken } = require("../utils/getToken");
const { readToken } = require("../utils/readTokenFromFirestore");

const app = express();
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shipbox-orders-default-rtdb.firebaseio.com",
});

const database = admin.database();

const year = 2023; // Replace with your desired year
const month = 9; // Month (0-11), so 9 represents October
const day = 17; // Day of the month
const hour = 15; // Hour (24-hour format)
const minute = 30; // Minute
const second = 0; // Second
const millisecond = 0; // Millisecond

const specificDate = new Date(
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond
);

// Schedule the task to run every hour (0 * * * *)
cron.schedule("0 * * * *", () => {
  console.log("hello");
});

// app.use(function (req, res, next) {
//     res.setHeader(
//       "Access-Control-Allow-Origin",
//       "https://fargo-express.netlify.app"
//     );
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.setHeader("Access-Control-Allow-Credentials", true);
//     next();
//   });

app.post("/webhook", async (req, res) => {
  try {
    const { order_number } = req.body;
    const lastUpdate = req.body;
    // console.log(req.body);
    // await getToken(admin)

    const { token } = await readToken(admin);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const ordersRef = database.ref("orders");
    const historyRef = database.ref("history_orders");

    const orderExistsPromise = ordersRef.child(order_number).once("value");
    const historyExistsPromise = historyRef.child(order_number).once("value");

    const val = historyRef.child(16023784945550).once("value");
    const sort = (await val).val();
    console.log(sort)
    const innerObjectsArray = Object.values(sort);
    innerObjectsArray.map(val => console.log(val.date))

    const [orderSnapshot, historySnapshot] = await Promise.all([
      orderExistsPromise,
      historyExistsPromise,
    ]);

    const orderExists = orderSnapshot.exists();
    console.log(orderExists);
    const historyExists = historySnapshot.exists();
    console.log(historyExists);

    if (!orderExists) {
      const orderUrl = `https://prodapi.shipox.com/api/v2/admin/orders?search=${order_number}`;

      // Fetch order data from the external API
      const response = await fetch(orderUrl, { headers });

      if (response.status === 401) {
        // Handle 401 Unauthorized here
        console.error("Received a 401 Unauthorized error");

        // Fetch a new token and update it in the Realtime Database
        const newToken = await getToken(admin);
        const token = {
          token: newToken,
        };

        // // Save the updated access token securely to the Realtime Database
        // const accessTokenRef = database.ref("access-token/shipbox-token");
        // await accessTokenRef.set(token);

        // Make the request with the new token
        const newResponse = await axios.get(orderUrl, {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });

        const data = newResponse.data.data.list;
        ordersRef.child(order_number).set(data);
      } else {
        // Data was successfully retrieved
        const data = await response.json();
        const { list } = data.data;
        ordersRef.child(order_number).set(list);
        console.log("Order has written!");
      }
    }

    if (!historyExists) {
      const historyUrl = `https://prodapi.shipox.com/api/v1/public/order/${order_number}/history_items`;
      // Fetch history data from the external API
      const response = await axios.get(historyUrl, { headers });
      const historyData = response.data.data.list;
      // console.log(historyData);
      // Save the history data to the "history_orders" collection
      historyRef.child(order_number).set(historyData);
      console.log("History has written to database");
    }

    if (orderExists && historyExists) {
      // Create a reference to the "history_orders" collection
      const historyCollection = database.ref(
        `history_orders/${order_number}`
      );
      // const newKey = Date.now().toString(); 

      // Generate a unique key for the new data
      const newHistoryItemRef = historyCollection.push();
      // console.log(newKey)

      newHistoryItemRef.set(lastUpdate, (error) => {
        if (error) {
          console.error("Data could not be saved.", error);
        } else {
          console.log("Data saved successfully.");
        }
      });

      console.log("History updated!");
    }

    // console.log(data);
    res.status(200).send("Status successfuly updated");
  } catch (err) {
    console.log(err);
    res.send("Error updating history in database");
  }
});

app.listen(3030, () => {
  console.log("Server runs in port 3030");
});

(async function () {
  const listener = await ngrok.connect({
    addr: port,
    authtoken_from_env: true,
  });
  console.log(`Ingress established at: ${listener.url()}`);
})();
