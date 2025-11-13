import z from "zod"


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
        .min(2, { message: "Short code must be at least 2 characters" })
        .max(8, { message: "Short code must be no more than 8 characters" })
});