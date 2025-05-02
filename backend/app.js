const express = require("express");
const fs = require("fs");
const csv = require("csvtojson");
const path = require("path");
const converter = require("json-2-csv");
const cors = require("cors");
var http = require("http");

var https = require("https");
var privateKey = fs.readFileSync(
  "C:\\windows\\system32\\192.168.0.178-key.pem",
  "utf8"
);
var certificate = fs.readFileSync(
  "C:\\windows\\system32\\192.168.0.178.pem",
  "utf8"
);

var credentials = { key: privateKey, cert: certificate };

const app = express();
app.use(cors());

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

app.use(express.json());
let jsonDB;

const start = async () => {
  jsonDB = await csv().fromFile("./DB.csv");
  httpServer.listen(5001);
  httpsServer.listen(8443);

  //app.listen(port, console.log(`app is listening on port ${port}`));
};
app.get("/api/v1/getData", (req, res) => {
  try {
    const file = fs.readFileSync("./DB.csv", "utf8");
    res.status(200).send(file);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/v1/postData", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "please provide an ID" });
    }
    let found = false;
    let person;
    for (let i = 0; i < jsonDB.length; i++) {
      if (id === jsonDB[i].id) {
        found = true;
        if (jsonDB[i].checked === "true") {
          return res.status(300).json({ message: "Person already checked" });
        }
        jsonDB[i].checked = "true";
        person = jsonDB[i];
      }
    }
    if (!found) {
      return res.status(404).json({ message: "Person not found!" });
    }
    converter.json2csv(jsonDB, (err, csv) => {
      fs.writeFileSync("./DB.csv", csv);
    });
    res.status(200).json({
      number: person.number,
      email: person.email,
      name: person.name,
      university: person.university,
      // attending: person.attending,
      // gizNumb: person.gizNumb,
      // firstname: person.firstname,
      // lastname: person.lastname,
      // workshop: person.domain,
      // message: `${person.email} : ${person.firstname} ${person.lastname} ${person.domain}`
    });
  } catch (error) {
    console.log(error);
  }
});

app.use(express.static(path.join(__dirname, "build")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const port = 5001;
start();
