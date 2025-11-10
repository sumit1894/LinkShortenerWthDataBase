
import { comparePassword, createUser, generateToken, getUserByEmail, hashPassword } from "../services/auth.services.js";


export const getRegisterPage = (req, res) => {
    return res.render("auth/register")
}

export const postRegister = async (req, res) => {

    const { name, email, password } = req.body;

    const userExists = await getUserByEmail(email);
    if (userExists) return res.redirect("/register")

    const hashedPassword = await hashPassword(password);

    const [user] = await createUser({ name, email, password: hashedPassword });
    console.log(user);


    res.redirect("/login")

}


export const getLoginPage = (req, res) => {
    return res.render("auth/login")
}

export const postLogin = async (req, res) => {


    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) return res.redirect("/login")

    //todo bcrypt.compare(plaintext,hashedPassword)
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) return res.redirect("/login");

    const token = generateToken({
        id: user.id,
        name: user.name,
        email: user.email
    })
    res.cookie("access_token", token);
    res.redirect("/")
}


export const getMe=(req,res)=>{
    if(!req.user) return res.send("not login in");
    return res.send(`<h1>hey ${req.user.name}- ${req.user.email} </h1>`)
}





