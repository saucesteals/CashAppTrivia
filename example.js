const CashTrivia = require("./modules/cashTrivia");

const authToken = "auth-token here"; // Auth-token can be found in twitch.com COOKIES
const trivia = new CashTrivia(authToken);

function handleQuestion(questionBody) {
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

function handleResult(resultBody) {
  console.log("Handling result...");
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

CashTrivia.on("question", (questionBody) => handleQuestion(questionBody));

CashTrivia.on("result", (resultBody) => handleResult(resultBody));

trivia.sendTestEvents();
