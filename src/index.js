import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
import joi from 'joi'
dotenv.config();

const PORT = 5000;

const server = express();
server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db(); //Não adicione nenhum nome customizado para o banco de dados
}).catch(() => {
    console.log('db está zoado!')
});


function userLogged(userName, participants) {
    for (let elem of participants) {
        if (userName === elem.name) {
            return true;
        }
    }
    return false;
}

function formatTime() {
    let hour = dayjs().hour();
    let minute = dayjs().minute();
    let second = dayjs().second();
    if (hour < 10) {
        hour = `0${hour}`;
    }
    if (minute < 10) {
        minute = `0${minute}`;
    }
    if (second < 10) {
        second = `0${second}`;
    }
    return `${hour}:${minute}:${second}`;
}

//post /participants

server.post("/participants", async (req, res) => {
    const participant = req.body;
    const participants = await db.collection("participants").find().toArray();
    if (validParticipantName(participant)) {
        if (nameUsed(participant, participants)) {
            res.sendStatus(409);
        } else {
            db.collection("participants").insertOne({
                name: participant.name,
                lastStatus: Date.now()
            });
            db.collection("messages").insertOne({
                from: participant.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: formatTime()
            })
            res.sendStatus(201);
        }
    } else {
        res.sendStatus(422);
    }
})

function validParticipantName(participant) {
    const participantSchema = joi.object({
        name: joi.string().required()
    })
    const validation = participantSchema.validate(participant);
    return !validation.error;
}

function nameUsed(participant, participants) {
    if (participants.length >= 0) {
        for (let elem of participants) {
            if (elem.name === participant.name) {
                return true;
            }
        }
        return false;
    };
    return false;
}

function loginMessage(participant) {

}

//post /participants

server.get("/participants", async (req, res) => {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
})

//POST /messages
server.post("/messages", async (req, res) => {
    const message = {
        from: req.headers.user,
        to: req.body.to,
        text: req.body.text,
        type: req.body.type
    };
    const participants = await db.collection("participants").find().toArray();
    if (validMessage(message)) {
        if (userLogged(message.from, participants)) {
            db.collection("messages").insertOne({
                from: message.from,
                to: message.to,
                text: message.text,
                type: message.type,
                time: formatTime()
            })
            res.sendStatus(201);
        } else {
            res.sendStatus(422);
        }
    } else {
        res.sendStatus(422);
    }
})

function validMessage(message) {
    const messageSchema = joi.object({
        from: joi.string().required(),
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required(),
    })

    const validation = messageSchema.validate(message);

    return (!validation.error && validMessageType(message.type));
}

function validMessageType(type) {
    return !!(type === "message" || type === "private_message");
}

//POST /messages

//GET /messages
server.get("/messages", async (req, res) => {
    const user = req.headers.user;
    const limitStr = req.query.limit;
    if (limitStr !== undefined) {
        const limit = Number(limitStr);
        if (!validLimit(limit)) {
            res.sendStatus(422);
        } else {
            const messages = await db.collection("messages").find().toArray();
            const participants = await db.collection("participants").find().toArray();
            if (userLogged(user, participants)) {
                const messagesFromDB = filterSendMessages(user, limit, messages);
                const messagesToSend = prepareMessagesToSend(messagesFromDB);
                res.status(200).send(messagesToSend.reverse());
            } else {
                res.sendStatus(401);
            }
        }
    } else {
        const messages = await db.collection("messages").find().toArray();
        const participants = await db.collection("participants").find().toArray();
        if (userLogged(user, participants)) {
            const messagesFromDB = filterSendMessages(user, limitStr, messages);
            const messagesToSend = prepareMessagesToSend(messagesFromDB);
            res.status(200).send(messagesToSend.reverse());
        } else {
            res.sendStatus(401);
        }
    }

})

function prepareMessagesToSend(messagesFromDB) {
    const messagesTosend = [];
    for (let message of messagesFromDB) {
        messagesTosend.push({
            to: message.to,
            text: message.text,
            type: message.type,
            from: message.from,
            time: message.time
        })
    }
    return messagesTosend;
}

function filterSendMessages(user, limit, messages) {
    const messagesToSend = [];
    for (let i in messages) {
        if (messages[i].type === "message" || messages[i].type === "status") {
            messagesToSend.push(messages[i])
        } else {
            if (messages[i].from === user) {
                messagesToSend.push(messages[i])
            }
            if (messages[i].to === user) {
                messagesToSend.push(messages[i])
            }
        }
    }
    if (typeof limit === "number") {
        if (limit > 0) {
            return (messagesToSend.slice(-limit));
        } else {
            return messagesToSend;
        }
    } else {
        return messagesToSend;
    }
}


function validLimit(limit) {
    const limitSchema = joi.object({
        number: joi.number().required()
    })
    const validation = limitSchema.validate({ number: limit });
    return (validation && (limit > 0));
}

//GET /messages

//POST /status
server.post("/status", async (req, res) => {
    const userName = req.headers.user;
    const participants = await db.collection("participants").find().toArray();
    if (userLogged(userName, participants)) {
        const user = getParticipant(userName, participants);
        //updateStatus(user);
        const updatedUser = {
            name: user.name,
            lastStatus: Date.now()
        }
        db.collection('participants').updateOne({
            _id: user._id
        },
            {
                $set: updatedUser
            });
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
})

function updateStatus(user) {
    const updatedUser = {
        name: user.name,
        lastStatus: Date.now()
    }
    db.collection('participants').updateOne({
        _id: user._id
    },
        {
            $set: updatedUser
        });
}

function getParticipant(name, participants) {
    for (let i in participants) {
        if (participants[i].name === name) {
            return participants[i];
        }
    }
    return null;
}




//POST /status

//Remove inactive users 
function removeInactiveUsers() {
    db.collection("participants").find().toArray().then(participants => {
        const inactiveIds = [];
        for (let participant of participants) {
            if ((Date.now() - participant.lastStatus) >= 10000) {
                inactiveIds.push(participant);
            }
        }
        for (let inactive of inactiveIds) {
            db.collection('participants').deleteOne({ name: inactive.name })
            db.collection("messages").insertOne({
                from: inactive.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: formatTime()
            })
        }
    })
}

setInterval(removeInactiveUsers, 15000);
//Remove inactive users 


server.listen(PORT, () => console.log(`Este servidor roda na porta: ${PORT}`));