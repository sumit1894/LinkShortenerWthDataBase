
import { authentication, clearUserSession, comparePassword, createUser, findUserById, getAllShortLinks, getUserByEmail, hashPassword } from "../services/auth.services.js";
import { loginUserSchema, regesterUserSchema } from "../validators/auth-validator.js";


export const getRegisterPage = (req, res) => {
    if (req.user) return res.redirect("/")
    return res.render("auth/register", { errors: req.flash("errors") })
}

export const postRegister = async (req, res) => {
    if (req.user) return res.redirect("/")

    try {
        // In Zod v4, safeParse throws on validation failure
        const data = regesterUserSchema.parse(req.body);

        const { name, email, password } = data;

        const userExists = await getUserByEmail(email);
        if (userExists) {
            req.flash("errors", "User already exists");
            return res.redirect("/register")
        }

        const hashedPassword = await hashPassword(password);

        const [user] = await createUser({ name, email, password: hashedPassword });
        console.log(user);

        await authentication ({req,res,user,name,email})

        res.redirect("/")

    } catch (error) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            const errors = error.issues.map(err => err.message);
            req.flash("errors", errors);
            return res.redirect("/register");
        }

        // Handle other errors
        throw error;
    }
}

export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/")
    return res.render("auth/login", { errors: req.flash("errors") })
}

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/")

    try {
        // const { email, password } = req.body;

        const data = loginUserSchema.parse(req.body);
        const { email, password } = data;

        const user = await getUserByEmail(email);
        if (!user) {
            req.flash("errors", "Invalid Users or Password")
            return res.redirect("/login")
        }

        //todo bcrypt.compare(plaintext,hashedPassword)
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            req.flash("errors", "Invalid Users or Password")
            return res.redirect("/login");
        }


        //create session

        await authentication({req,res,user})

        res.redirect("/")

    } catch (error) {
        console.log(error)
        if (error.name === 'ZodError') {
            const errors = error.issues.map(err => err.message);
            req.flash("errors", errors);
            return res.redirect("/login");
        }
        throw error;
    }


}

export const getMe = (req, res) => {
    if (!req.user) return res.send("not login in");
    return res.send(`<h1>hey ${req.user.name}- ${req.user.email} </h1>`)
}

export const LogoutUser = async (req, res) => {

    await clearUserSession(req.user.sessionId)
    res.clearCookie("access_token")
    res.clearCookie("refresh_token")
    res.redirect("/login")
}

export const getProfilePage=async(req,res)=>{
    if(!req.user) return res.send("not logged in");

    const user=await findUserById(req.user.id);
    if(!user) return res.redirect("/login");

    const userShortLink=await getAllShortLinks(user.id);

    return res.render("auth/profile",{
        user:{
            id:user.id,
            name:user.name,
            email:user.email,
            isEmailValid:user.isEmailValid,
            createdAt:user.createdAt,
            links:userShortLink,
        },
    });


}

export const getVerifyEmailPage=async(req,res)=>{
    if(!req.user || req.user.isEmailValid) return res.redirect("/");

    return res.render("auth/verify-email",{
        email:req.user.email,
    });
}



