const TwitchPubSub = require("./twitch");
const WebSocket = require("ws");

//Events
const events = require("./twitchEvents");

//Twitch Stuff
const twitchPubSub = "wss://pubsub-edge.twitch.tv"; // Twitch PubSub server
const authToken = "auth_token_goes_here"; // Auth token can be found in twitch.com COOKIES
const topics = ['channel-ext-v1.471239022-qm552050p10oeisvzryhtjj2w9zm4z-broadcast']
const Twitch = new TwitchPubSub(twitchPubSub, authToken, topics);

var wss;

class ApiServer {
  constructor() {
    wss = this;
    this.wss = new WebSocket.Server({
      port: 8080,
    });

    this.wss.on("connection", (ws) => {
      ws.on("message", (data) => console.log(data));
      console.log("New Connection!");
    });

    events.on("question", (questionBody) => {
      wss.handleQuestion(questionBody);
    });
    events.on("result", (resultBody) => {
      wss.handleResult(resultBody);
    });

    events.on("pong", () => console.log("Ponged!"));

    events.on("error", (errorMessage) =>
      console.log(`Error from Twitch Socket: ${errorMessage}`)
    );
  }
  handleQuestion(questionBody) {
    var duration = questionBody.duration; // In MS

    var questionModule = questionBody.moduleSpecificMetadata;

    var alivePlays = questionModule.playersRemaining; //Ex. 1000
    var totalPlayers = questionModule.totalPlayers; //Ex. 2000

    var question = questionModule.question; //Ex. What do you call a baby goat?
    var questionNumber = questionModule.questionNumber; //Ex. 2

    var options = questionModule.options; //Ex.
    // 0: {Position: 1, Text: "Kid"}
    // 1: {Position: 2, Text: "Goatee"}
    // 2: {Position: 3, Text: "Child"}
    // 3: {Position: 4, Text: "Lamb"}
  }

  handleResult(resultBody) {
    var duration = resultBody.duration; // In MS

    var resultModule = resultBody.moduleSpecificMetadata;

    var alivePlayers = resultBody.playersRemaining; //Ex. 1000
    var totalPlayers = resultBody.totalPlayers; //Ex. 2000

    var question = resultBody.question; //Ex. What do you call a baby goat?
    var questionNumber = resultBody.questionNumber; //Ex. 2

    var options = resultBody.options;
    var results = resultBody.results; // Ex.
    // 1: {Audience: 688, Active: 6201, Total: 6889}
    // 2: {Audience: 123, Active: 414, Total: 537}
    // 3: {Audience: 63, Active: 209, Total: 272}
    // 4: {Audience: 613, Active: 2376, Total: 2989}
  }

  sendQuestion(
    duration,
    alivePlayers,
    totalPlayers,
    question,
    questionNumber,
    options
  ) {
    if (!wss.clients) return; // Return if there are no clients

    //Build Data
    var data = {
      type: "EVENT",
      duration: duration,
      alivePlayers: alivePlayers,
      totalPlayers: totalPlayers,
      question: question,
      questionNumber: questionNumber,
      options: options,
    };

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  sendResult(
    duration,
    alivePlayers,
    totalPlayers,
    question,
    questionNumber,
    options,
    results
  ) {
    if (!wss.clients) return;

    var data = {
      type: "RESULTS",
      duration: duration,
      alivePlayers: alivePlayers,
      totalPlayers: totalPlayers,
      question: question,
      questionNumber: questionNumber,
      options: options,
      results: results,
    };

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

new ApiServer();
