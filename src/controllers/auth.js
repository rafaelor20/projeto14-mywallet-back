import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import db from "../database.js"

export async function signUp(req, res) {
  const { name, email, password, transfers } = req.body;
  const passwordHashed = bcrypt.hashSync(password, 10);

  try {
    await db.collection("users").insertOne({ name, email, password: passwordHashed, transfers })
    res.status(201).send("Usuário cadastrado com sucesso!")

  } catch (error) {
    res.status(500).send(error.message)
  }
}

export async function signIn(req, res) {
  const { email, password } = req.body

  try {

    const checkUser = await db.collection('users').findOne({ email })

    if (!checkUser) return res.status(400).send("Usuário ou senha incorretos")

    const isCorrectPassword = bcrypt.compareSync(password, checkUser.password)

    if (!isCorrectPassword) return res.status(400).send("Usuário ou senha incorretos")

    console.log(checkUser)
    const token = uuidV4();
    const login = {name: checkUser.name, token: token}
    await db.collection("sessoes").insertOne({ idUsuario: checkUser._id, token })

    return res.status(200).send(login)

  } catch (error) {
    res.status(500).send(error.message)
  }
}