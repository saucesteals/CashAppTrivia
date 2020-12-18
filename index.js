const CashTrivia = require("./backend/cashTrivia");
const events = require("./backend/cashEvents");

const authToken = "auth-token here"; // Auth-token can be found in twitch.com COOKIES
const trivia = new CashTrivia(authToken);

function handleQuestion(questionBody) {

}

function handleResult(resultBody) {

}

events.on("question", (questionBody) => handleQuestion(questionBody));

events.on("result", (resultBody) => handleResult(resultBody));

trivia.sendTestEvents();
