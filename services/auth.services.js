import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { eq, and, lt, sql, gte, gt, isNull } from "drizzle-orm"
import { db } from "../config/db.js"
import { oauthAccountsTable, passwordResetTokenTable, sessionsTable, shortLinksTable, usersTable, verifyEmailTokenTable } from "../drizzle/schema.js"
import { sendEmail } from "../lib/send-email.js"

import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import mjml2html from "mjml";
import ejs from "ejs";



export const getUserByEmail = async (email) => {
    const [user] = await db.select().from(usersTable).where(eq(
        usersTable.email, email
    ))
    return user;
};

export const createUser = async ({ name, email, password }) => {
    return await db.insert(usersTable).values({ name, email, password }).$returningId();
};

export const getUserByEmailPaassword = async ({ email, password }) => {
    const [user] = await db
        .select()
        .from(usersTable)
        .where(
            and(
                eq(usersTable.email, email),
                eq(usersTable.password, password)
            )
        );
    return user;
}

export const hashPassword = async (password) => {
    return await argon2.hash(password);
}

export const comparePassword = async (password, hash) => {
    return await argon2.verify(hash, password);
}

export const generateToken = ({ id, name, email }) => {
    return jwt.sign({ id, name, email }, process.env.JWT_SICRIT, { expiresIn: "30d", })
}

//!createSession
export const createSession = async (userId, { ip, userAgent }) => {
    const [session] = await db.insert(sessionsTable).values({ userId, ip, userAgent }).$returningId();
    return session;
}

//!createAccessToken
export const createAccessToken = ({ id, name, email, sessionId }) => {
    return jwt.sign({ id, name, email, sessionId },
        process.env.JWT_SICRIT, {
        expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, //expiresIn:"15min"
    }
    )
}


export const createRefreshToken = (sessionId) => {
    return jwt.sign({ sessionId },
        process.env.JWT_SICRIT, {
        expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, //expiresIn:"1w"
    }
    )
}


//! verifyJwtToken
export const verifyJwtToken = (token) => {
    return jwt.verify(token, process.env.JWT_SICRIT);
}

export const findSessionById = async (sessionId) => {
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return session
}

export const findUserById = async (userId) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user;
}

//!refreshTokens

export const refreshTokens = async (refreshToken) => {

    try {
        const decodedToken = verifyJwtToken(refreshToken);
        const currentSession = await findSessionById(decodedToken.sessionId);

        if (!currentSession || !currentSession.valid) {
            throw new Error("Invalid session");
        }

        const user = await findUserById(currentSession.userId)

        if (!user) throw new Error("Invalid user");

        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,
            sessionId: currentSession.id,
        };

        const newAccessToken = createAccessToken(userInfo);
        const newRefreshToken = createRefreshToken(currentSession.id);

        return {
            newAccessToken, newRefreshToken, user: userInfo,
        };


    } catch (error) {
        console.log(error.message);

    }

}

//!clearUserSession
export const clearUserSession = async (sessionId) => {
    return db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}


export const authentication = async ({ req, res, user, name, email }) => {

    const session = await createSession(user.id, {
        ip: req.clientIp,
        userAgent: req.headers["user-agent"],
    });

    const accessToken = createAccessToken({
        id: user.id,
        name: user.name || name,
        email: user.email || email,
        isEmailValid: false,
        sessionId: session.id,
    });

    const RefreshToken = createRefreshToken(session.id)
    const baseConfig = { httpOnly: true, secure: true };

    res.cookie("access_token", accessToken, {
        ...baseConfig,
        maxAge: ACCESS_TOKEN_EXPIRY,
    })

    res.cookie("refresh_token", RefreshToken, {
        ...baseConfig,
        maxAge: REFRESH_TOKEN_EXPIRY,
    })


}


export const getAllShortLinks = async (userId) => {
    return db.select().from(shortLinksTable).where(eq(shortLinksTable.userId, userId));
}

//! generateRandomToken
export const generateRandomToken = (digit = 8) => {
    const min = 10 ** (digit - 1); //10000000
    const max = 10 ** (digit);  //100000000

    return crypto.randomInt(min, max).toString()

}

//! insertVerifyEmailToken
export const insertVerifyEmailToken = async ({ userId, token }) => {

    return db.transaction(async (tx) => { //*if Curd or more then one operation in one table then transaction 
        try {
            await tx.delete(verifyEmailTokenTable).where(lt(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`))
            //* Delete any existing  for the specific user
            await tx.delete(verifyEmailTokenTable).where(eq(verifyEmailTokenTable.userId, userId));

            await tx.insert(verifyEmailTokenTable).values({ userId, token });
        } catch (error) {
            console.error("Failed to insert Verification token:", error);
            throw new Error("Unable to create Verification token");
        }
    })



}


//! createVerifyEmailLink
export const createVerifyEmailLink = async ({ email, token }) => {

    // const uriEncodedEmail = encodeURIComponent(email);
    // return `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;


    const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);

    url.searchParams.append("token", token);
    url.searchParams.append("email", email);

    return url.toString();
}


//! findVerificationEmailToken
/*
export const findVerificationEmailToken = async ({ token, email }) => {
    const tokenData = await db
        .select({
            userId: verifyEmailTokenTable.userId,
            token: verifyEmailTokenTable.token,
            expiresAt: verifyEmailTokenTable.expiresAt,
        })
        .from(verifyEmailTokenTable)
        .where(and(eq(verifyEmailTokenTable.token, token), gte(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`))
        );

    if (!tokenData.length) {
        return null;
    }

    const { userId } = tokenData[0];

    const userData = await db.select({
        userId: usersTable.id,
        email: usersTable.email,
    }).from(usersTable).where(eq(usersTable.id, userId))


    if (!userData.length) {
        return null;
    }


    return {
        userId: userData[0].userId,
        email: userData[0].email,
        token: tokenData[0].token,
        expiresAt: tokenData[0].expiresAt,
    }

}
*/

//! findVerificationEmailToken + inner join
export const findVerificationEmailToken = async ({ token, email }) => {
    return db
        .select({
            userId: verifyEmailTokenTable.userId,
            email: usersTable.email,
            token: verifyEmailTokenTable.token,
            expiresAt: verifyEmailTokenTable.expiresAt,
        })
        .from(verifyEmailTokenTable)
        .where(
            and(
                eq(verifyEmailTokenTable.token, token),
                eq(usersTable.email, email),
                gte(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`))
        ).innerJoin(usersTable, eq(verifyEmailTokenTable.userId, usersTable.id))
}

//!verifyUserEmailAndUpdate
export const verifyUserEmailAndUpdate = async (email) => {
    return db.update(usersTable).set({ isEmailValid: true }).where(eq(usersTable.email, email))
}

//! clearVerifyEmailToken
export const clearVerifyEmailToken = async (userId) => {
    return await db.delete(verifyEmailTokenTable).where(eq(verifyEmailTokenTable.userId, userId));
}

//! sendNewVerifyEmailLink
export const sendNewVerifyEmailLink = async ({ userId, email }) => {
    const randomToken = generateRandomToken();

    await insertVerifyEmailToken({ userId, token: randomToken })

    const verifyEmailLink = await createVerifyEmailLink({
        email,
        token: randomToken,
    })

    //* path define
    const mjmlTmeplate = await fs.readFile(
        path.join(import.meta.dirname, "..", "emails", "verify-email.mjml"), "utf8"
    );

    //* replace the placeholder with actual value
    const filledTemplate = ejs.render(mjmlTmeplate, { code: randomToken, link: verifyEmailLink, })

    //* convert mjml into html
    const htmlOutput = mjml2html(filledTemplate).html;


    sendEmail({
        to: email,
        subject: "Verify your email",
        html: htmlOutput,
    }).catch(console.error);
}

//! updateUserByName
export const updateUserByName = async ({ userId, name,avatarUrl }) => {
    return await db.update(usersTable).set({ name,avatarUrl }).where(eq(usersTable.id, userId));
}

//! updateUserPassword
export const updateUserPassword = async ({ userId, newPassword }) => {
    const newHashPassword = await hashPassword(newPassword);

    return await db.update(usersTable).set({ password: newHashPassword }).where(eq(usersTable.id, userId));
}

//! findUserByEmail
export const findUserByEmail = async (email) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user;
}

//! createResetPasswordLink
export const createResetPasswordLink = async ({ userId }) => {
    const randomToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(randomToken).digest("hex");

    await db.delete(passwordResetTokenTable).where(eq(passwordResetTokenTable.userId, userId));

    await db.insert(passwordResetTokenTable).values({ userId, tokenHash });

    return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;
}

//! getResetPasswordTokenPage
export const getResetPasswordToken = async (token) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [data] = await db
        .select()
        .from(passwordResetTokenTable)
        .where(
            and(
                eq(passwordResetTokenTable.tokenHash, tokenHash),
                gt(passwordResetTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`)
            )
        );

    return data;
}

//! clearResetPasswordToken
export const clearResetPasswordToken = async (userId) => {
    return await db
        .delete(passwordResetTokenTable)
        .where(eq(passwordResetTokenTable.userId, userId));
}

//! getUserWithOauthId
export const getUserWithOauthId = async ({ email, provider }) => {
    const [user] = await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            isEmailValid: usersTable.isEmailValid,
            providerAccountId: oauthAccountsTable.providerAccountId,
            provider: oauthAccountsTable.provider,
        })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .leftJoin(
            oauthAccountsTable,
            and(
                eq(oauthAccountsTable.userId, usersTable.id),
                eq(oauthAccountsTable.provider, provider)
            )
        );

    return user;
}

//!linkUserWithOauth
export const linkUserWithOauth = async ({userId, provider, providerAccountId,avatarUrl}) => {
    
    await db.insert(oauthAccountsTable).values({
        userId, provider, providerAccountId,
    });
    if (avatarUrl) {
        await db
        .update(usersTable)
        .set({ avatarUrl })
        .where(and(eq(usersTable.id, userId), isNull(usersTable.avatarUrl)))
    }
}

//! createUserWithOauth
export const createUserWithOauth = async ({ name, email, provider, providerAccountId, avatarUrl }) => {
    const user = await db.transaction(async (trx) => {
        const [user] = await trx.insert(usersTable).values({
            name, email, avatarUrl, isEmailValid: true,
        }).$returningId();

        await trx.insert(oauthAccountsTable).values({
            userId: user.id, provider, providerAccountId,
        })
        return {
            id: user.id,
            name,
            email,
            isEmailValid: true,
            provider,
            providerAccountId,
        };
    });

    return user
};









