import { eq,and } from "drizzle-orm"
import { db } from "../config/db.js"
import { usersTable } from "../drizzle/schema.js"



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


// export const getUserByEmailPaassword = async ({ email, password }) => {
//     const [user] = await db
//         .select()
//         .from(usersTable)
//         .where({
//             email,
//             password,
//         })
//     return user;
// }


