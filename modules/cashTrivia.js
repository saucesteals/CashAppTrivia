const WebSocket = require("ws");
const fetch = require("node-fetch");
const EventEmitter = require("events");

var cashTrivia;

module.exports = class CashTrivia extends EventEmitter {
  constructor(authToken, wssURI="wss://pubsub-edge.twitch.tv", topics=["channel-ext-v1.471239022-qm552050p10oeisvzryhtjj2w9zm4z-broadcast",]) {
    super();

    cashTrivia = this;
    this.authToken = authToken;
    this.bear = "";
    this.wssURI = wssURI;
    this.topics = topics;
    this.types = {
      message: "MESSAGE",
      response: "RESPONSE",
      pong: "PONG",
      question: "START_EVENT",
      result: "SHOW_RESULTS",
    };

    this.newSocket();
  }

  newSocket() {
    //Creates a new socket and closes a previous one if there was one. Connection may drop at any time, so you can just reconnect with this
    if (this.socket) {
      try {
        this.socket.close();
      } catch (error) {}
    }

    this.socket = new WebSocket(this.wssURI, { perMessageDeflate: false });

    this.socket.on("open", () => {
      cashTrivia.sendListenInterval();
      cashTrivia.startPinger();
    }); //Open Handler

    this.socket.on("message", (data) => cashTrivia.handleMessage(data)); //Message Handler
    this.socket.on("close", () => cashTrivia.newSocket()); // Close Handler
  }

  ping() {
    //Sends a ping
    return this.socket.send('{"type": "PING"}');
  }

  sendListenInterval() {
    if (this.listenInterval) clearInterval(this.listenInterval); // Clears previous pinger if there was one
    this.sendListen();
    this.listenInterval = setInterval(() => this.sendListen(), 10 * 60 * 1000);
  }

  startPinger() {
    //Sends a PING to the WSS connection every 10 minutes -- required

    if (this.pinger) clearInterval(this.pinger); // Clears previous pinger if there was one
    this.pinger = setInterval(() => this.ping(), 10 * 60 * 1000);
    this.ping();
  }

  sendListen() {
    //Sends LISTEN with the topic to be able to recieve messages from that topic. Ex. recieve messages from cashTrivia's extenesion's topic\
    fetch("https://api.twitch.tv/v5/channels/471239022/extensions", {
      headers: {
        authorization: `OAuth ${this.authToken}`,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
        "client-id": "b31o4btkqth5bzbvr9ub2ovr79umhh",
      },
    })
      .then((resp) => resp.json())
      .then((json) => {
        if (!json.tokens) {
          console.log("Invalid auth-token!");
          process.exit();
        }
        this.socket.send(
          JSON.stringify({
            type: "LISTEN",
            data: {
              topics: this.topics,
              auth_token: json.tokens[0].token,
            },
          })
        );
      });
  }

  handleMessage(data, test) {
    try {
      //Handles New WSS Messages. Raw message is at event.data
      var twitchMessage = JSON.parse(data);

      switch (twitchMessage.type) {
        case this.types.message:
          var rawMessage = test ? twitchMessage.data.message : JSON.parse(twitchMessage.data.message) ;
          this.emit("message", rawMessage);

          var content = JSON.parse(rawMessage.content[0]);
          switch (content.messageType) {
            case this.types.question:
              this.emit("question", content.messageBody);
              break;
            case this.types.result:
              this.emit("result", content.messageBody);
              break;
            default:
              break;
          }
          break;

        case this.types.response:
          twitchMessage.error ? console.log(twitchMessage.error) : null;
          break;
        case this.types.pong:
          this.emit("pong");
          console.log("Ponged!")
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  sendTestEvents() {
    var testQMessage = String.raw`{"content_type":"application/json","content":["{\"messageBody\":{\"fetchDataFromUrl\":false,\"eventId\":\"282954d2-71d7-4f61-a2ff-003098093779\",\"experienceId\":\"7f055f48-ab26-484a-adf1-6474704493af\",\"module\":\"TRIVIA\",\"submodule\":\"MULTIPLE_CHOICE\",\"duration\":12000,\"endDate\":\"2020-11-18T20:38:05.683Z\",\"useCanvas\":false,\"startedAt\":\"2020-11-18T20:37:53.683Z\",\"isAsync\":false,\"position\":3,\"themeId\":\"CASH_APP\",\"moduleSpecificMetadata\":{\"question\":\"What is the fictional city where Batman lives?\",\"options\":[{\"Position\":1,\"Text\":\"Bat City\"},{\"Position\":2,\"Text\":\"Gotham City\"},{\"Position\":3,\"Text\":\"Dark City\"},{\"Position\":4,\"Text\":\"Angel City\"}],\"acceptedChatPrefixes\":[\"#\"],\"totalPlayers\":12623,\"playersRemaining\":12623,\"questionNumber\":1}},\"messageType\":\"START_EVENT\"}"],"num_messages":1,"request_numbers":[]}`
    var testQData = {type:"MESSAGE", data:{topics:["channel-ext-v1.471239022-qm552050p10oeisvzryhtjj2w9zm4z-broadcast"], message:JSON.parse(testQMessage)}}
    this.handleMessage(JSON.stringify(testQData), true)

    var testRMessage = String.raw`{"content_type":"application/json","content":["{\"messageBody\":{\"eventId\":\"9bf6eeff-9399-4531-9a04-608ab7abd7e2\",\"experienceId\":\"7f055f48-ab26-484a-adf1-6474704493af\",\"module\":\"TRIVIA\",\"submodule\":\"RESULTS\",\"duration\":12000,\"endDate\":\"2020-11-18T20:39:25.844Z\",\"useCanvas\":false,\"startedAt\":\"2020-11-18T20:38:54.351Z\",\"isAsync\":false,\"position\":4,\"themeId\":\"CASH_APP\",\"moduleSpecificMetadata\":{\"question\":\"What do you call a baby goat?\",\"options\":[{\"Position\":1,\"Text\":\"Kid\"},{\"Position\":2,\"Text\":\"Goatee\"},{\"Position\":3,\"Text\":\"Child\"},{\"Position\":4,\"Text\":\"Lamb\"}],\"correctAnswerId\":1,\"totalPlayers\":12623,\"playersRemaining\":9513,\"questionNumber\":2,\"activePlayersAtStartOfRound\":9513},\"results\":{\"1\":{\"Audience\":688,\"Active\":6201,\"Total\":6889},\"2\":{\"Audience\":123,\"Active\":414,\"Total\":537},\"3\":{\"Audience\":63,\"Active\":209,\"Total\":272},\"4\":{\"Audience\":613,\"Active\":2376,\"Total\":2989}}},\"messageType\":\"SHOW_RESULTS\"}"],"num_messages":1,"request_numbers":[]}`
    var testRData = {type:"MESSAGE", data:{topics:["channel-ext-v1.471239022-qm552050p10oeisvzryhtjj2w9zm4z-broadcast"], message:JSON.parse(testRMessage)}}
    this.handleMessage(JSON.stringify(testRData), true)
  }
};
