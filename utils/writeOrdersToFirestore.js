const axios = require("axios");
const admin = require("firebase-admin");
const { readToken } = require("./readTokenFromFirestore");



// Initialize Firebase Admin with your service account credentials

const getOrdersAndHistory = async (
  admin,
  statusToDateTime,
  statusFromDateTime
) => {
  const { token } = await readToken(admin);
  const pageSize = 200;
  const maxConcurrentRequests = 10;

  const database = admin.database();
  const ordersRef = database.ref("orders");
  const historyRef = database.ref("history_orders");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  let currentPage = 0;
  let noPages = true;

  while (noPages) {
    const pagePromises = [];

    for (let i = 0; i < maxConcurrentRequests; i++) {
      const url = `https://prodapi.shipox.com/api/v2/admin/orders?page=${currentPage}&size=${pageSize}&search_type=order_numbers&status_to_date_time=${statusToDateTime}&status_from_date_time=${statusFromDateTime}&use_solr=true&search_history=true`;
      pagePromises.push(axios.get(url, { headers }));
      currentPage++;
    }

    try {
      const responses = await Promise.all(pagePromises);

      for (const response of responses) {
        const data = response.data.data.list;
        const total = response.data.data.total;
        console.log(total);

        if (data.length === 0) {
          noPages = false;
        } else {
          const orderBatch = {};
          const historyPromises = [];

          for (const document of data) {
            const documentId = document.order_number;

            // Check if the order exists before writing it
            if (!orderBatch[documentId]) {
              orderBatch[documentId] = document;
              console.log("Adding order to batch");
            } else {
              console.log("Order already exists in batch");
            }

            // Check if the history exists before fetching it
            if (
              !(await historyRef
                .child(documentId)
                .once("value")
                .then((snapshot) => snapshot.exists()))
            ) {
              const historyUrl = `https://prodapi.shipox.com/api/v1/public/order/${documentId}/history_items`;
              const historyPromise = axios.get(historyUrl, { headers });
              historyPromises.push(historyPromise);
            } else {
              console.log("History already exists");
            }
          }

          // Await all history requests in parallel
          const historyResponses = await Promise.all(historyPromises);

          // Write order batch to the Realtime Database
          await ordersRef.update(orderBatch);
          console.log("Writing orders batch");

          // Write history data to the Realtime Database
          for (const [index, response] of historyResponses.entries()) {
            const document = data[index];
            const documentId = document.order_number;
            const historyData = response.data.data.list;

            await historyRef.child(documentId).set(historyData);
            console.log("Writing history for", documentId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      break;
    }
  }
};

module.exports = { getOrdersAndHistory };
