import express from "express";
import http from "http";
import { Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

interface User {
  name: string;
  socket: Socket;
}

let userSockets: User[] = [];

const onConnection = (socket: Socket) => {
  console.log("connected");

  socket.on("join", (name: string) => {
    userSockets.push({ name, socket });
    console.log(name + " joined");
    socket.emit("status", "connected");

    // send the list of users to all the users
    const users = userSockets.map((u) => u.name);
    io.emit("users", users);
  });

  socket.on("message", (msg: string, user: string) => {
    console.log(msg + " to " + user);
    // find the user in the users array
    const userSocket = userSockets.find((u) => u.name === user);

    if (!userSocket) {
      console.log("user not found");
      return;
    }

    userSocket.socket.emit("message", msg, user, false);
    socket.emit("message", msg, user, true);
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
    // remove the user from the users array
    userSockets = userSockets.filter((u) => u.socket.id !== socket.id);
  });
};

io.on("connection", onConnection);

server.listen(3000, () => {
  console.log("listening on *:3000");
});
