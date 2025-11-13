
import { Router } from "express";
import { getSortenerPage, postURLshortener, redirectToShortLink,getShortenerEditPage,postShortenerEditPage, errorPage } from "../controllers/postshortenerController.js";


const router = Router();


router.get("/404",errorPage);

//! function for reading html and Css file
router.get("/",getSortenerPage);


//! POST methods/data store/duplicate check
router.post("/",postURLshortener);




//! shortcode redirect page 
router.get("/:shortCode", redirectToShortLink)


router.route("/edit/:id").get(getShortenerEditPage).post(postShortenerEditPage);


// export default router;
export const shortenedRoutes = router;
