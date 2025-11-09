import { createUser, getUserByEmail, getUserByEmailPaassword } from "../services/auth.services.js";


export const getRegisterPage = (req, res) => {
    return res.render("auth/register")
}

export const postRegister = async (req, res) => {

    const { name, email, password } = req.body;

    const userExists = await getUserByEmail(email);
    if (userExists) return res.redirect("/register")

    const [user] = await createUser({ name, email, password });
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

    if (user.password !== password) return res.redirect("/login")

    res.cookie("isLoggedIn", true);
    res.redirect("/")
}





