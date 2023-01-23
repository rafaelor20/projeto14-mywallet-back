import express from "express";
import cors from "cors";
import serverRouter from "./routes.js"

const PORT = 5000;

const server = express();
server.use(express.json());
server.use(cors());
server.use(serverRouter);


server.listen(PORT, () => console.log(`Este servidor roda na porta: ${PORT}`));