import coreJoi from "joi";
import joiDate from "@joi/date";

const joi = coreJoi.extend(joiDate) //as typeof coreJoi;

export const transferSchema = joi.object({
    name: joi.string().required(),
    date: joi.date().format("DD/MM").required(),
    value: joi.number().required(),
    description: joi.string().required(),
})