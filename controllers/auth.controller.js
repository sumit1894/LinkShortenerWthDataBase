
import { authentication, clearUserSession, clearVerifyEmailToken, comparePassword, createUser, createVerifyEmailLink, findUserById, findVerificationEmailToken, generateRandomToken, getAllShortLinks, getUserByEmail, hashPassword, insertVerifyEmailToken, sendNewVerifyEmailLink, updateUserByName, updateUserPassword, verifyUserEmailAndUpdate } from "../services/auth.services.js";
import { loginUserSchema, regesterUserSchema, verifyEmailSchema, verifyPasswordSchema, verifyUserSchema } from "../validators/auth-validator.js";



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

        await authentication({ req, res, user, name, email });
        await sendNewVerifyEmailLink({ userId: user.id, email });

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
        await authentication({ req, res, user })
        // res.redirect("/")

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

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.send("not logged in");

    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");

    const userShortLink = await getAllShortLinks(user.id);

    return res.render("auth/profile", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,
            createdAt: user.createdAt,
            links: userShortLink,
        },
    });


}

//! getVerifyEmailPage
export const getVerifyEmailPage = async (req, res) => {

    if (!req.user) return res.render("/");
    const user = await findUserById(req.user.id);
    if (!user || user.isEmailValid) return res.redirect("/");

    return res.render("auth/verify-email", {
        email: req.user.email,
    });
}

export const resendVerificationLink = async (req, res) => {

    if (!req.user) return res.redirect("/");
    const user = await findUserById(req.user.id);
    if (!user || user.isEmailValid) return res.redirect("/");

    await sendNewVerifyEmailLink({ userId: req.user.id, email: req.user.email })

    res.redirect('/verify-email')
}

//! verifyEmailToken

export const verifyEmailToken = async (req, res) => {
    try {
        // const data = verifyEmailSchema.parse(req.body);
        const data = verifyEmailSchema.parse(req.query);
        // const { token,email} = data;
        console.log("Verification Email Token", data.token, "and", data.email);


        const [token] = await findVerificationEmailToken(data);
        if (!token) res.send("Verification link inValid or expired!");

        await verifyUserEmailAndUpdate(token.email);

        clearVerifyEmailToken(token.userId).catch(console.error)

        return res.redirect("/profile");
        // return res.redirect('/profile?verified=true');


    } catch (error) {
        console.log(error)
        if (error.name === 'ZodError') {
            const errors = error.issues.map(err => err.message);
            req.flash("errors", errors);
            return res.redirect("/profile");
        }
        throw error;
    }
}

//!getEditProfilePage

export const getEditProfilePage = async (req, res) => {
    if (!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).send("user not found");

    return res.render("auth/edit-profile", {
        name: user.name,
        errors: req.flash("errors"),
    })


}

//! postEditProfilePage

export const postEditProfilePage = async (req, res) => {
    if (!req.user) return res.redirect("/");

    try {
        // Parse and validate data
        const data = verifyUserSchema.safeParse(req.body);

        // Check if validation failed
        if (!data.success) {
            const errors = data.error.issues.map(err => err.message);
            req.flash("errors", errors);
            return res.redirect("/edit-profile");
        }

        // Update user with validated data
        await updateUserByName({ userId: req.user.id, name: data.data.name });

        // Success message
        req.flash("success", "Profile updated successfully!");
        return res.redirect("/profile");

    } catch (error) {
        console.error("Error updating profile:", error);
        req.flash("errors", ["Something went wrong. Please try again."]);
        return res.redirect("/edit-profile");
    }
}

//! getChangePassword

export const getChangePassword = async (req, res) => {
    if (!req.user) return res.redirect("/");
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).send("user not found");

    return res.render("auth/change-password", {
        errors: req.flash("errors"),
    })
}

//! postChnagePassword

export const postChangePassword = async (req, res) => {
    if (!req.user) return res.redirect("/");

    try {
        // Using parse() and storing in "data"
        const data = verifyPasswordSchema.parse(req.body);

        // Now extract values from data
        const { currentPassword, newPassword } = data;

        // Find user
        const user = await findUserById(req.user.id);
        if (!user) return res.status(404).send("user not found");

        // Check old password
        const isPasswordValid = comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            req.flash("errors", "Current password that you entered is invalid");
            return res.redirect("/change-password");
        }

        // Update password
        await updateUserPassword({ userId: user.id, newPassword });

        // Success message
        req.flash("success", "Password updated successfully!");
        return res.redirect("/profile");

    } catch (error) {
        console.log(error);

        // Zod validation error (parse())
        if (error.errors) {
            const errors = error.errors.map(err => err.message);
            req.flash("errors", errors);
        } else {
            req.flash("errors", ["Something went wrong. Please try again."]);
        }

        return res.redirect("/change-password");
    }
};



