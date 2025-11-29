import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js"
import multer from "multer";
import path from "path";

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

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/avatar");
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}_${Math.random}${ext}`);
    },
});

const avatarFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};


const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});


router.route("/edit-profile")
    .get(authControllers.getEditProfilePage)
    .post(avatarUpload.single("avatar"),authControllers.postEditProfilePage)

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