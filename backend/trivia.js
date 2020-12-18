const CashTrivia = require("./cashTrivia");
const events = require("./cashEvents");

const twitchPubSub = "wss://pubsub-edge.twitch.tv"; // Twitch PubSub server
const authToken = "auth-token here"; // Auth-token can be found in twitch.com COOKIES
const topics = [
  "channel-ext-v1.471239022-qm552050p10oeisvzryhtjj2w9zm4z-broadcast",
];

new CashTrivia(twitchPubSub, authToken, topics);

var _triviaHandler;

class TriviaHandler {
  constructor() {
    _triviaHandler = this;
    events.on("question", (questionBody) => {
      triviaHandler.handleQuestion(questionBody);
    });
    events.on("result", (resultBody) => {
      triviaHandler.handleResult(resultBody);
    });
  }

  handleQuestion(questionBody) {
    console.log("Handling question...");
    var duration = questionBody.duration; // In MS

    var questionModule = questionBody.moduleSpecificMetadata;

    var alivePlayers = questionModule.playersRemaining; //Ex. 1000
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
    console.log("Handling result...");
    var duration = resultBody.duration; // In MS

    var resultModule = resultBody.moduleSpecificMetadata;

    var alivePlayers = resultBody.playersRemaining; //Ex. 1000
    var totalPlayers = resultBody.totalPlayers; //Ex. 2000

    var question = resultBody.question; //Ex. What do you call a baby goat?
    var questionNumber = resultBody.questionNumber; //Ex. 2

    var options = resultBody.options;
    var results = resultBody.results;

    // Ex.
    // 1: {Audience: 688, Active: 6201, Total: 6889}
    // 2: {Audience: 123, Active: 414, Total: 537}
    // 3: {Audience: 63, Active: 209, Total: 272}
    // 4: {Audience: 613, Active: 2376, Total: 2989}
  }

  test() {
    var testMessage = JSON.parse(
      String.raw`{"content_type":"application/json","content":["{\"messageBody\":{\"fetchDataFromUrl\":false,\"eventId\":\"282954d2-71d7-4f61-a2ff-003098093779\",\"experienceId\":\"7f055f48-ab26-484a-adf1-6474704493af\",\"module\":\"TRIVIA\",\"submodule\":\"MULTIPLE_CHOICE\",\"duration\":12000,\"endDate\":\"2020-11-18T20:38:05.683Z\",\"useCanvas\":false,\"startedAt\":\"2020-11-18T20:37:53.683Z\",\"isAsync\":false,\"position\":3,\"themeId\":\"CASH_APP\",\"moduleSpecificMetadata\":{\"question\":\"What is the fictional city where Batman lives?\",\"options\":[{\"Position\":1,\"Text\":\"Bat City\"},{\"Position\":2,\"Text\":\"Gotham City\"},{\"Position\":3,\"Text\":\"Dark City\"},{\"Position\":4,\"Text\":\"Angel City\"}],\"acceptedChatPrefixes\":[\"#\"],\"totalPlayers\":12623,\"playersRemaining\":12623,\"questionNumber\":1}},\"messageType\":\"START_EVENT\"}"],"num_messages":1,"request_numbers":[]}`
    );
    var question = JSON.parse(testMessage.content).messageBody;
    this.handleQuestion(question);
  }
}

var triviaHandler = new TriviaHandler();

triviaHandler.test();
