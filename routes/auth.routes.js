import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js"

const router = new Router;

router
    .route("/register")
    .get(authControllers.getRegisterPage)
    .post(authControllers.postRegister);

router
    .route("/login")
    .get(authControllers.getLoginPage)
    .post(authControllers.postLogin);


router.route("/me").get(authControllers.getMe);

router.route("/profile").get(authControllers.getProfilePage)

router.route("/verify-email").get(authControllers.getVerifyEmailPage)

router.route("/resend-verification-link").post(authControllers.resendVerificationLink)

router.route("/verify-email-token").get(authControllers.verifyEmailToken)

router.route("/edit-profile")
    .get(authControllers.getEditProfilePage)
    .post(authControllers.postEditProfilePage)

router.route("/change-password")
    .get(authControllers.getChangePassword)
    .post(authControllers.postChangePassword)

router.route("/reset-password")
    .get(authControllers.getResetPasswordPage)
    .post(authControllers.postForgetPassword)

router.route("/reset-password/:token")
.get(authControllers.getResetPasswordTokenPage)
.post(authControllers.PostResetPasswordTokens)

router.route("/google").get(authControllers.getGoogleLoginPage)
router.route("/google/callback").get(authControllers.getGoogleLoginCallback)

router.route("/github").get(authControllers.getGithubLoginPage)
router.route("/github/callback").get(authControllers.getGithubLoginCallback)

router.route("/set-password")
.get(authControllers.getSetPasswordPage)
.post(authControllers.postSetPassword)

router.route("/logOut").get(authControllers.LogoutUser);

export const authRoutes = router;