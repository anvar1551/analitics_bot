const axios = require("axios");
const admin = require("firebase-admin");
const serviceAccount = require("../credentials/firebase.json");

const { formatDate } = require("../utils/formatDate");
const { getOrdersAndHistory } = require("../utils/writeOrdersToFirestore");
const { readToken } = require("../utils/readTokenFromFirestore");
const { getToken } = require("../utils/getToken");

require("dotenv").config();
const ordersUrl = process.env.GET_ID_URL;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shipbox-orders-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

// Get the current date and time
const currentDate = new Date();

// Get the date and time for 24 hours ago
const twentyFourHoursAgo = new Date(currentDate);
twentyFourHoursAgo.setHours(currentDate.getHours() - 24);

// Format the dates
const statusToDateTime = formatDate(currentDate);
const statusFromDateTime = formatDate(twentyFourHoursAgo);

async function main() {
  try {
    // await getHistory();
    // await getToken(admin);
    await getOrdersAndHistory(admin, statusToDateTime, statusFromDateTime);
    // console.log(await readToken(admin));
    console.log();
  } catch (error) {
    console.error("Main error:", error);
  }
}

main();

module.exports = {
  // getToken,
};
