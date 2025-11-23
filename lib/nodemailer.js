import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();



const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        // user: "	malvina.gleason@ethereal.email",
        // pass: "CXsAGGtchMt8pAHXWH",
        user:testAccount.user,
        pass:testAccount.pass,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: ` "URL SHORTENER" <${testAccount.user}>`,
        to,
        subject,
        html,
    })
    const testEmailURL = nodemailer.getTestMessageUrl(info);
    console.log("verify Email:", testEmailURL)
}


