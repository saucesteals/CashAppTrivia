const WebSocket = require("ws");
const events = require("./cashEvents");
const fetch = require("node-fetch");

var cashTrivia;

module.exports = class CashTrivia {
  constructor(wssURI, authToken, topics) {
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

    this.socket.on("open", function () {
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
          console.log("Invalid auth-token!")
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

  handleMessage(data) {
    try {
      //Handles New WSS Messages. Raw message is at event.data
      var twitchMessage = JSON.parse(data);
      switch (twitchMessage.type) {
        case this.types.message:
          var rawMessage = JSON.parse(twitchMessage.data.message);
          events.emit("message", rawMessage);

          var content = JSON.parse(rawMessage.content[0]);

          switch (content.messageType) {
            case this.types.question:
              events.emit("question", content.messageBody);
              break;
            case this.types.result:
              events.emit("result", content.messageBody);
              break;
            default:
              break;
          }
          break;

        case this.types.response:
          twitchMessage.error ? console.log(twitchMessage.error) : null;
          break;
        case this.types.pong:
          events.emit("pong");
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }
};
