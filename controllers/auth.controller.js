
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { getHtmlFromMjmlTemplate } from "../lib/get-Html-From-Mjml-Template.js";
import { sendEmail } from "../lib/send-email.js";
import { authentication, clearResetPasswordToken, clearUserSession, clearVerifyEmailToken, comparePassword, createResetPasswordLink, createUser, createUserWithOauth, createVerifyEmailLink, findUserByEmail, findUserById, findVerificationEmailToken, generateRandomToken, getAllShortLinks, getResetPasswordToken, getUserByEmail, getUserWithOauthId, hashPassword, insertVerifyEmailToken, linkUserWithOauth, sendNewVerifyEmailLink, updateUserByName, updateUserPassword, verifyUserEmailAndUpdate } from "../services/auth.services.js";
import { forgetPasswordSchema, loginUserSchema, regesterUserSchema, setPasswwordSchema, verifyEmailSchema, verifyPasswordSchema, verifyResetPasswordSchema, verifyUserSchema } from "../validators/auth-validator.js";
import { OAUTH_EXCHANGE_EXPIRY } from "../config/constants.js";
import { google } from "../lib/oauth/google.js";
import { github } from "../lib/oauth/github.js";



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
        console.log(user)
        if (!user) {
            req.flash("errors", "Invalid Users or Password")
            return res.redirect("/login")
        }

        if (!user.password) {
            req.flash("errors", "you have created account using social login. pleased login with your social account.");
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
        res.redirect("/")

    } catch (error) {
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
            avatarUrl: user.avatarUrl,
            isEmailValid: user.isEmailValid,
            hasPassword: Boolean(user.password),
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
        avatarUrl:user.avatarUrl,
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

        const fileUrl = req.file ? `uploads/avatar/${req.file.filename}` : undefined;

        await updateUserByName({ 
            userId: req.user.id, 
            name: data.name, 
            avatarUrl:fileUrl
        });

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

//! postChangePassword

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


//! getResetPasswordPage

export const getResetPasswordPage = async (req, res) => {
    return res.render("auth/forgot-password", {
        formSubmitted: req.flash("formSubmitted")[0],
        errors: req.flash("errors"),
    })
}

//! postForgetPassword

export const postForgetPassword = async (req, res) => {
    try {
        const data = forgetPasswordSchema.parse(req.body);

        const user = await findUserByEmail(data.email);

        if (user) {
            const resetPasswordLink = await createResetPasswordLink({ userId: user.id })

            const html = await getHtmlFromMjmlTemplate("reset-password-email", {
                name: user.name,
                link: resetPasswordLink,
            });

            sendEmail({
                to: user.email,
                subject: "Reset Your Password",
                html,
            });
        };

        req.flash("formSubmitted", true)
        return res.redirect("/reset-password")

    } catch (error) {
        console.log(error);

        // Zod validation error (parse())
        if (error.errors) {
            const errors = error.errors.map(err => err.message);
            req.flash("errors", errors);
        } else {
            req.flash("errors", ["Something went wrong .  Please try again."]);
        }

        return res.redirect("/change-password");
    }
}

//!getResetPasswordTokenPage
export const getResetPasswordTokenPage = async (req, res) => {

    const { token } = req.params;

    const passwordResetData = await getResetPasswordToken(token);

    if (!passwordResetData) return res.render("auth/wrong-reset-password-token");

    return res.render("auth/reset-password", {
        formSubmitted: req.flash("formSubmitted")[0],
        errors: req.flash("errors"),
        token,
    })



}

//! PostResetPasswordToken
export const PostResetPasswordTokens = async (req, res) => {
    const { token } = req.params;
    const passwordResetData = await getResetPasswordToken(token);
    if (!passwordResetData) {
        req.flash("errors", ["Password Token is not matching"]); // Fixed: array format
        return res.render("auth/wrong-reset-password-token");
    }

    try {
        const data = verifyResetPasswordSchema.parse(req.body);

        const { newPassword } = data;

        const user = await findUserById(passwordResetData.userId);

        if (!user) { // Added: check if user exists
            req.flash("errors", ["User not found"]);
            return res.redirect("/forgot-password");
        }

        // Update password BEFORE clearing token
        await updateUserPassword({ userId: user.id, newPassword });

        // Clear token after successful password update
        await clearResetPasswordToken(user.id);

        req.flash("success", "Password reset successfully!"); // Added success message
        return res.redirect("/login");

    } catch (error) {
        console.error("Error resetting password:", error);

        // Zod validation error (parse())
        if (error.errors) {
            const errors = error.errors.map(err => err.message);
            req.flash("errors", errors);
        } else {
            req.flash("errors", ["Something went wrong. Please try again."]);
        }

        return res.redirect(`/reset-password/${token}`); // Fixed: removed colon
    }
}

//! getGoogleLoginPage
export const getGoogleLoginPage = async (req, res) => {
    if (req.user) return res.redirect("/");

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, [
        "openid",
        "profile",
        "email",
    ]);

    const cookieConfig = {
        httpOnly: true,
        secure: true,
        maxAge: OAUTH_EXCHANGE_EXPIRY,
        sameSite: "lax",
    };

    res.cookie("google_oauth_state", state, cookieConfig);
    res.cookie("google_oauth_verifier", codeVerifier, cookieConfig);

    res.redirect(url.toString())

}

//! getGoogleLoginCallback
export const getGoogleLoginCallback = async (req, res) => {

    const { code, state } = req.query;
    const { google_oauth_state: storedState, google_oauth_verifier: codeVerifier } = req.cookies;

    if (
        !code ||
        !state ||
        !storedState ||
        !codeVerifier ||
        state !== storedState
    ) {
        rq.flash("errors", "couldn't login with Google because of invalid login attemp.Pleased Try again!");
        return res.redirect("/login");
    }

    let tokens;

    try {
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
        rq.flash("errors", "couldn't login with Google because of invalid login attemp.Pleased Try again!");
        return res.redirect("/login");
    }

    const claims = decodeIdToken(tokens.idToken());
    console.log(claims);
    const { sub: googleUserId, name, email, picture } = claims;

    //todo if user is already linked then we will get the user
    let user = await getUserWithOauthId({
        provider: "google",
        email,
    });


    //todo if user exists but user is not linked with oauth
    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "google",
            providerAccountId: googleUserId,
            avatarUrl: picture,
        })
    }

    //todo if user doesn't exist

    if (!user) {
        user = await createUserWithOauth({
            name, email, provider: "google", providerAccountId: googleUserId, avatarUrl: picture,
        })
    }

    await authentication({ req, res, user, name, email });

    res.redirect("/");


}

//! getGithubLoginPage
export const getGithubLoginPage = async (req, res) => {
    if (req.user) return res.redirect("/");

    const state = generateState();
    const url = github.createAuthorizationURL(state, ["user:email"]);

    const cookieConfig = {
        httpOnly: true,
        secure: true,
        maxAge: OAUTH_EXCHANGE_EXPIRY,
        sameSite: "lax",
    };

    res.cookie("github_oauth_state", state, cookieConfig);

    res.redirect(url.toString())

}

//! getGithubLoginCallback
export const getGithubLoginCallback = async (req, res) => {

    const { code, state } = req.query;

    const { github_oauth_state: storedState } = req.cookies;

    function handleFailedLogin() {
        rq.flash("errors", "couldn't login with Google because of invalid login attemp.Pleased Try again!");
        return res.redirect("/login");
    }

    if (!code || !state || !storedState || state !== storedState) {
        return handleFailedLogin()
    }

    let tokens;

    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch (error) {
        return handleFailedLogin()

    }

    const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`
        },
    });

    if (!githubUserResponse.ok) return handleFailedLogin();

    const githubUser = await githubUserResponse.json();
    console.log("githubUser", githubUser);

    const { id: githubUserId, name, avatar_url } = githubUser;


    const githubEmailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
            headers: {
                Authorization: `Bearer ${tokens.accessToken()}`
            },
        }
    );
    if (!githubEmailResponse.ok) return handleFailedLogin();

    const emails = await githubEmailResponse.json();
    const email = emails.filter((e) => e.primary)[0].email;

    if (!email) return handleFailedLogin();


    //todo if user is already linked then we will get the user
    let user = await getUserWithOauthId({
        provider: "github",
        email,
    });


    //todo if user exists but user is not linked with oauth
    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "github",
            avatarUrl: avatar_url,
            providerAccountId: githubUserId,
        })
    }

    //todo if user doesn't exist

    if (!user) {
        user = await createUserWithOauth({
            name, email, provider: "github", avatarUrl: avatar_url, providerAccountId: githubUserId,
        })
    }

    await authentication({ req, res, user, name, email });

    res.redirect("/");


}

//! getSetPasswordPage
export const getSetPasswordPage = async (req, res) => {
    if (!req.user) return res.redirect("/");

    return res.render("auth/set-password", {
        errors: req.flash("errors"),
    });
}

//! postSetPassword

export const postSetPassword = async (req, res) => {
    if (!req.user) return res.redirect("/");

    const { data, error } = setPasswwordSchema.safeParse(req.body);

    if (error) {
        const errorMessage = error.issues.map((err) => err.message);
        console.log(errorMessage);
        req.flash("errors", errorMessage);
        return res.redirect("/set-password");
    }

    const { newPassword } = data;
    const user = await findUserById(req.user.id);
    if (user.password) {
        req.flash(
            "errors", "you already have your password, Instead chnage your password"
        );
        return res.render("/set-password")
    }
    await updateUserPassword({ userId: req.user.id, newPassword })

    return res.redirect("/profile");
}



