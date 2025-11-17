import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { eq, and } from "drizzle-orm"
import { db } from "../config/db.js"
import { sessionsTable, shortLinksTable, usersTable } from "../drizzle/schema.js"

import argon2 from "argon2"
import jwt from "jsonwebtoken";



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
            isEmailValid:user.isEmailValid,
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


export const authentication = async ({req, res, user, name, email}) => {
    
    const session = await createSession(user.id,{
        ip: req.clientIp,
        userAgent: req.headers["user-agent"],
    });

    const accessToken = createAccessToken({
        id: user.id,
        name: user.name || name,
        email: user.email || email,
        isEmailValid:false,
        sessionId: session.id,
    })
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


export const getAllShortLinks=async(userId)=>{
    return db.select().from(shortLinksTable).where(eq(shortLinksTable.userId,userId));
}


