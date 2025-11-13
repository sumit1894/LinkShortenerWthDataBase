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

export const urlShortenerSchema = z.object({
    url: z
        .string()
        .trim()
        .url({ message: "Please enter a valid URL" })
        .min(1, { message: "URL is required" })
        .max(2048, { message: "URL is too long" })
        .refine(
            (url) => url.startsWith('http://') || url.startsWith('https://'),
            { message: "URL must start with http:// or https://" }
        ),
    shortCode: z
        .string()
        .trim()
        .min(1, { message: "Short code must be at least 4 characters" })
        .max(8, { message: "Short code must be no more than 8 characters" })
        .regex(/^[a-zA-Z0-9]+$/, { 
            message: "Short code can only contain letters and numbers" 
        })
        .optional() // Make it optional so users can leave it blank for auto-generation
        .or(z.literal("")) // Allow empty string from form input
});


