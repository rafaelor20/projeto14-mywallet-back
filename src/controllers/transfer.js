import db from "../database.js"

export async function listTransfers(req, res) {
  const userName = req.body.name;
  const transfer = req.body.transfer;
  console.log(transfer);
  try {

    const checkUser = await db.collection('users').findOne({ userName })

    if (!checkUser) return res.status(400).send("Usuário não cadastrado")

    const transfers = checkUser.transfers;

    return res.status(200).send(transfers)

  } catch (error) {
    res.status(500).send(error.message)
  }
}

export async function registerTransfer(req, res) {
  const userName = req.body.name;
  const transfer = {
    date: req.body.date, 
    value: req.body.value, 
    description: req.body.description
  };
  try {

    const checkUser = await db.collection('users').findOne({ name: userName })
    
    if (!checkUser) return res.status(400).send("Usuário não cadastrado")

    const updatedTransfers = checkUser.transfers
    updatedTransfers.push(transfer)

    const updatedUser = {
      email: checkUser.email,
      name: checkUser.name,
      password: checkUser.password,
      confirmPassword: checkUser.confirmPassword,
      transfers: updatedTransfers
    };
    console.log(updatedUser);

    db.collection('users').updateOne({
      _id: checkUser._id
  },
      {
          $set: updatedUser
      });

    return res.sendStatus(200);

  } catch (error) {
    res.status(500).send(error.message)
  }
}