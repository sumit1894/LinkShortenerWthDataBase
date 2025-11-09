import bcrypt from "bcrypt"
import argon2 from "argon2"

async function hashPassword(password) {
    // return bcrypt.hash(password,12);
    return argon2.hash(password)
}

async function verifyPassword(password,hashedPassword) {
    return argon2.verify(hashedPassword,password)
    // return bcrypt.compare(password,hashedPassword);
}



const password1=Array.from({length:75}).fill("x").join("");
const password2=Array.from({length:75}).fill("x").join("")+Math.random();
console.log({password1,password2})

const hashedPassword1=await hashPassword(password1)
const hashedPassword2=await hashPassword(password2)


console.log("1-1", await verifyPassword(password1,hashedPassword1))
console.log("2-1", await verifyPassword(password2,hashedPassword1))
console.log("2-2", await verifyPassword(password2,hashedPassword2))
console.log("1-2", await verifyPassword(password1,hashedPassword2))


