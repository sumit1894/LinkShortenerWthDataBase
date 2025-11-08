
import { Router } from "express";
import { getSortenerPage, postURLshortener, redirectToShortLink } from "../controllers/postshortenerController.js";


const router = Router();



//! function for reading html and Css file
router.get("/",getSortenerPage);


//! POST methods/data store/duplicate check
router.post("/",postURLshortener);




//! shortcode redirect page 
router.get("/:shortCode", redirectToShortLink)


// export default router;
export const shortenedRoutes = router;
