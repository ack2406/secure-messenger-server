import express from "express";
import http from "http";
import { Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
  maxHttpBufferSize: 1e8,
});

let users: { [name: string]: Socket } = {};

const onConnection = (socket: Socket) => {
  console.log(`${socket.id} connected`);

  // when a user logs in, we add him to the users object
  socket.on("join", (name: string) => {
    console.log(`${socket.id} joined as ${name}`);

    users[name] = socket;

    socket.emit("join", name);
  });

  socket.on("invite", (inviter: string, invitee: string) => {
    console.log(`"${inviter}" invited user "${invitee}"`);

    // if the user is not connected, we send a message to the sender
    if (!users[invitee]) {
      socket.emit("unavailable");
    }
    // if the user is connected, we send a message to the sender and to the receiver
    else {
      users[invitee].emit("invite", inviter, invitee);
    }
  });

  socket.on("accept", (inviter: string, invitee: string) => {
    console.log(`"${invitee}" accepted "${inviter}"`);

    // we send a message to the sender and to the receiver
    users[inviter].emit("accept", inviter, invitee);
  });

  // when invitee accepted the invitation, we send details to the inviter
  socket.on("sendDetails", (inviter: string, invitee: string) => {
    console.log(`"${invitee}" accepted "${inviter}"`);

    // we send a message to the sender and to the receiver
    users[invitee].emit("sendDetails", inviter);
  });

  socket.on("decline", (inviter: string, invitee: string) => {
    console.log(`"${inviter}" declined "${invitee}"`);

    // we send a message to the sender and to the receiver
    users[inviter].emit("decline", invitee);
  });

  // when a user sends a message, we send it to the receiver and back to the sender for confirmation
  socket.on("message", (msg: string, sender: string, receiver: string) => {
    console.log(`"${sender}" sent "${msg}" to "${receiver}"`);

    console.log(users[receiver]);

    users[receiver].emit("getMessage", msg, sender);
  });

  socket.on(
    "file",
    (file: File, sender: string, receiver: string, fileName: string) => {
      console.log(`"${sender}" sent file: "${file.name}" to "${receiver}"`);

      users[receiver].emit("getFile", file, sender, fileName);
    }
  );

  // when a user disconnects, we remove him from the users object
  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);

    // we loop through the users object to find the user that disconnected
    for (const [name, user] of Object.entries(users)) {
      if (user.id === socket.id) {
        delete users[name];
        break;
      }
    }
  });
};

io.on("connection", onConnection);

server.listen(3000, () => {
  console.log("listening on *:3000");
});
