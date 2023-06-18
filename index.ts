import express from "express";
import http from "http";
import { Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
  maxHttpBufferSize: 1e9,
});

let users: { [name: string]: Socket } = {};

function onConnection(socket: Socket) {
  console.log(`${socket.id} connected`);

  function onLogin(name: string) {
    console.log(`${name} connected`);

    users[name] = socket;
  }

  function onInvite(inviter: string, invitee: string) {
    console.log(`${inviter} invited ${invitee}`);

    if (!users[invitee]) {
      return;
    }

    users[invitee].emit("invite", inviter);
  }

  function onAccept(inviter: string, invitee: string, pubkey: string) {
    console.log(`${invitee} accepted ${inviter}`);

    if (!users[inviter]) {
      return;
    }

    users[inviter].emit("accept", invitee, pubkey);
  }

  function onReject(inviter: string, invitee: string) {
    console.log(`${invitee} rejected ${inviter}`);

    if (!users[inviter]) {
      return;
    }

    users[inviter].emit("reject", invitee);
  }

  function onAcceptResponse(inviter: string, invitee: string, pubkey: string) {
    console.log(`${inviter} accepted ${invitee}`);

    if (!users[invitee]) {
      return;
    }

    users[invitee].emit("accept-response", inviter, pubkey);
  }

  function onMessage(
    message: string,
    sender: string,
    receiver: string
  ) {
    if (!users[receiver]) {
      return;
    }

    console.log(`${sender} sent ${message} to ${receiver}`);

    users[receiver].emit("message", message, sender);
  }

  function onFileMessage(
    file: string,
    fileName: string,
    sender: string,
    receiver: string
  ) {
    if (!users[receiver]) {
      return;
    }

    console.log(`${sender} sent file ${fileName} to ${receiver}`);

    users[receiver].emit("file-message", file, fileName, sender);

    users[sender].emit("progress-bar");
    console.log(sender)
  }

  function onSessionCreate(
    sessionKey: string,
    sender: string,
    receiver: string
  ) {
    console.log(`${sender} created session with ${receiver}`);

    if (!users[receiver]) {
      return;
    }

    users[receiver].emit("session-create", sessionKey, sender);
  }

  function onSessionDestroy(sender: string, receiver: string) {
    console.log(`${sender} destroyed session with ${receiver}`);
    if (!users[receiver]) {
      return;
    }

    users[receiver].emit("session-destroy", sender);
  }

  function onDisconnect() {
    console.log(`${socket.id} disconnected`);

    for (let name in users) {
      if (users[name].id === socket.id) {
        delete users[name];
        break;
      }
    }
  }

  socket.on("login", onLogin);
  socket.on("invite", onInvite);
  socket.on("accept", onAccept);
  socket.on("reject", onReject);
  socket.on("accept-response", onAcceptResponse);
  socket.on("message", onMessage);
  socket.on("file-message", onFileMessage)
  socket.on("session-create", onSessionCreate);
  socket.on("session-destroy", onSessionDestroy);
  socket.on("disconnect", onDisconnect);
}

io.on("connection", onConnection);

server.listen(3000, () => {
  console.log("listening on *:3000");
});
