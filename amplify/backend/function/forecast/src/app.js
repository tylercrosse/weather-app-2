const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const fetch = require("isomorphic-fetch");
const moment = require("moment");
const _ = require("lodash");

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.get("/api/forecast/:latlng", async function (req, res) {
  const currentUnixTime = moment().format("X");
  const historicURI = `https://api.darksky.net/forecast/1780bf38f274f706e6a341962cfa4f60/${req.params.latlng},${currentUnixTime}?exclude=[currently,minutely,flags]&extend=hourly`;
  const forecastURI = `https://api.darksky.net/forecast/1780bf38f274f706e6a341962cfa4f60/${req.params.latlng}?exclude=[flags]&extend=hourly`;

  try {
    const historicJSON = await fetch(historicURI).then((response) =>
      response.json()
    );
    const forecastJSON = await fetch(forecastURI).then((response) =>
      response.json()
    );

    const historicHourly = _.keyBy(historicJSON.hourly.data, "time");
    const forecastHourly = _.keyBy(forecastJSON.hourly.data, "time");
    const mergedHourly = _.merge(forecastHourly, historicHourly);

    forecastJSON.hourly.data = Object.values(mergedHourly);

    res.json(forecastJSON);
  } catch (err) {
    // TODO improve error handling (response codes)
    console.log("❌", err);
  }
});

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
