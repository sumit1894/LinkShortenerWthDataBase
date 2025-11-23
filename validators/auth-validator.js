import z from "zod"


const emailSchema = z
    .string()
    .trim()
    .email({ message: "Please enter a valid Email address." })
    .max(100, { message: "Email must be no more than 100 characters." });
const passwordSchema = z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password should not be more than 100 characters" });

const nameSchema = z
    .string()
    .trim()
    .min(3, { message: "Name must be 3 character long." })
    .max(100, { message: "Name must be no more than 100 characters" })





export const loginUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
})


export const regesterUserSchema = loginUserSchema.extend({
    name: nameSchema,
})


export const verifyEmailSchema = z.object({
    token: z.string().trim().length(8),
    email: z.string().trim().email(),
});

export const verifyUserSchema = z.object({
    name: nameSchema,
})

export const verifyPasswordSchema=z.object({
    currentPassword:z
    .string()
    .min(1,{message:"Current password is required!"}),

    newPassword:z
    .string()
    .min(6,{message:"new password must be atleast 6 character long."})
    .max(100,{message:"New password must be no longer than 100 word character"}),

    confirmPassword:z
    .string()
    .min(6,{message:"Confirm Password must be atleast 6 character long."})
    .max(100,{message:"Confirm password must ne no longer than 100 word character"})

}).refine((data)=>data.newPassword===data.confirmPassword,{
    message:"Password don't match",
    path:["confirmPassword"],
})



