const WebSocket = require("ws");
const events = require("./twitchEvents");
var PubSub;

class TwitchPubSub {
  constructor(wssURI, authToken, topics) {
    PubSub = this;
    this.wssURI = wssURI;
    this.authToken = authToken;
    this.topics = topics;
    this.types = {
      message: "MESSAGE",
      response: "RESPONSE",
      pong: "PONG",
      question: "START_EVENT",
      result: "SHOW_RESULTS",
    };

    this.listenMessage = {
      type: "LISTEN",
      data: {
        topics: this.topics,
        auth_token: this.authToken,
      },
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
      PubSub.sendListen();
      PubSub.startPinger();
    }); //Open Handler

    this.socket.on("message", (data) => PubSub.handleMessage(data)); //Message Handler
    this.socket.on("close", () => PubSub.newSocket()); // Close Handler
  }

  ping() {
    //Sends a ping
    return this.socket.send('{"type": "PING"}');
  }

  startPinger() {
    //Sends a PING to the WSS connection every 10 minutes -- required

    if (this.pinger) clearInterval(this.pinger); // Clears previous pinger if there was one
    this.pinger = setInterval(() => this.ping(), 10 * 60 * 1000);
    this.ping();
  }

  sendListen() {
    //Sends LISTEN with the topic to be able to recieve messages from that topic. Ex. recieve messages from cashapp's extenesion's topic
    return this.socket.send(JSON.stringify(this.listenMessage));
  }

  handleMessage(data) {
    //Handles New WSS Messages. Raw message is at event.data
    var twitchMessage = JSON.parse(data);
    switch (twitchMessage.type) {
      case this.types.message:
        var rawMessage = JSON.parse(twitchMessage.data.message);
        events.emit("message", rawMessage);

        var message = JSON.parse(rawMessage);
        var content = JSON.parse(message.content);

        switch (content.messageType) {
          case this.types.question:
            events.emit("question", content.messageBody);
            break;
          case this.types.result:
            events.emit("result", content.messageBody);
            break;
        }
        break;

      case this.types.response:
        twitchMessage.error ? events.emit("error", twitchMessage.error) : null;
        break;
      case this.types.pong:
        events.emit("pong");
    }
  }
}

module.exports = TwitchPubSub;
