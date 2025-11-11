
import express from "express";
import { env } from "./config/env.js";
import { shortenedRoutes } from "./routes/shortenerRoutes.js";
import { authRoutes } from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import {verifyAuthentication} from "./middlewares/verify-auth-middleware.js"


const app = express();

app.use(express.static("public")); //! to access css file.
app.use(express.urlencoded({ extended: true }))


app.set("view engine", "ejs"); //! defining  using engine and which engine
// app.set("views","./Folder_name") if different folder then VIEWS use this too



//! shortenerRouter
app.use(cookieParser())

app.use(session({secret:"my-secrit",resave:true, saveUninitialized: false,}))
app.use(flash());

app.use(verifyAuthentication);

app.use((req,res, next)=>{
    res.locals.user=req.user
    return next();
})
app.use(authRoutes)
app.use(shortenedRoutes);



//todo Server create 
try {
    // await connectDB();
    app.listen(env.PORT, () => {
        console.log(`Server running at http://localhost:${env.PORT}`);
    })
} catch (error) {
    console.error(error)
}