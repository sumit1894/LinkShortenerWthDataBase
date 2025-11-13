import z from "zod"

export const loginUserSchema = z.object({

    email: z
        .string()
        .trim()
        .email({ message: "Please enter a valid Email address." })
        .max(100, { message: "Email must be no more than 100 characters." }),

    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long." })
        .max(100, { message: "Password should not be more than 100 characters" })
})


export const regesterUserSchema = loginUserSchema.extend({
    name: z
        .string()
        .trim()
        .min(3, { message: "Name must be 3 character long." })
        .max(100, { message: "Name must be no more than 100 characters" }),
})




