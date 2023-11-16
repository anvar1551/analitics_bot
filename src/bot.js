const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");
const cron = require('node-cron');
const bot = new Telegraf("6411667856:AAHpejLGYEtTLLn8qJQMwOSKTbdYZC3WhIY");

const filterByRegion = require('../utils/bot/filterByRegions');



// app.use(bodyParser.json());
const url = "https://api.pochtomat.tech/v1/limited-terminals/?limit=200";
const headers = {
  Authorization: "Token 2637f00f-5ad8-473b-abdd-53e8c01b52b7",
};



bot.command("start", (ctx) => {
  ctx.reply("Welcome to control Fargo parcels bot!");
});

bot.on("message", async (ctx) => {
  console.log(ctx.message.chat.id)
});

// Define the job to run every 4 hours
cron.schedule("*/10 * * * * *", async () => {
  try {
    // Fetch data from your API (replace with your API endpoint)
    const { data } = await axios.get(url, { headers });

    // Check if the API request was successful and data is an array of objects
    if (data) {
      // Initialize the table header
      let table = `<pre>The offline postamats:\n--------------------\n| Number |  Status |</pre>`;
      let numberOfOffline = 0;
      
      // Create an array to store the table rows
      const tableRows = [];

      const postamByRegion = filterByRegion(data.results);
      
      
      data.results.forEach((item) => {
        if (item.status !== "ОК") {
          const row = `<pre>| ${item.number} | offline |</pre>`;
          tableRows.push(row);
          numberOfOffline++
        }
      });
      
      let allPostam = `<pre>Postamats:\n---------------------\n|   All  | online  |  Offline |\n|   ${data.count}  |   ${data.count-numberOfOffline}   |     ${numberOfOffline}    |</pre>`
      
      // Combine the table header, separator, and rows
      table += tableRows.join('');
      

      // Send the table as an HTML-formatted message
      bot.telegram.sendMessage('376657492', {parse_mode: 'HTML', text:allPostam});
      bot.telegram.sendMessage('376657492', {parse_mode: 'HTML', text: postamByRegion});
      bot.telegram.sendMessage('376657492', {parse_mode: 'HTML', text: table});
    } else {
      // ctx.reply("Failed to fetch or format data.");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});


// Schedule tasks
cron.schedule('0 9 * * *', () => {
  // This will run everyday at 9am
  sendMessageFunction();
});

cron.schedule('0 13 * * *', () => {
  // This will run everyday at 1pm
  sendMessageFunction();
});

cron.schedule('0 17 * * *', () => {
  // This will run everyday at 5pm
  sendMessageFunction();
});

cron.schedule('0 20 * * *', () => {
  // This will run everyday at 8pm
  sendMessageFunction();
});

bot.launch();
