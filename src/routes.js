import { Router } from 'express'
import { signIn, signUp } from "./controllers/auth.js"
import { listTransfers, registerTransfer } from './controllers/transfer.js'
import { validateSchema } from "./middlewares/validateSchema.js"
import { userSchema, loginSchema } from './validations/authSchema.js'
import { transferSchema } from './validations/transferSchema.js'

const serverRouter = Router();


serverRouter.post("/sign-up", validateSchema(userSchema), signUp);
serverRouter.post("/sign-in", validateSchema(loginSchema), signIn);

serverRouter.post("/transfer", validateSchema(transferSchema), registerTransfer);
serverRouter.get("/transfers", listTransfers);

export default serverRouter;