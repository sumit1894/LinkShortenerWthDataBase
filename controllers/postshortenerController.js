
import crypto from "crypto";
import { getAllShortLinks, getShortLinkByShortCode, insertShortLink } from "../services/shortener.services.js";
import { urlShortenerSchema } from "../validators/auth-validator.js";






//! function for reading html and Css file
export const getSortenerPage = async (req, res) => {
    try {
        if (!req.user) return res.redirect("/login")

        const links = await getAllShortLinks(req.user.id);
        return res.render("index", { links, hosts: req.host, errors: req.flash("errors") });

    } catch (error) {
        console.log(error)
        return res.status(500).send("internal server Error")
    }
};



//! POST methods/data store/duplicate check

export const postURLshortener = async (req, res) => {
    try {
        
        const { url, shortCode } = urlShortenerSchema.parse(req.body);
        console.log("Parsed values:", url, shortCode);
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

        const link = await getShortLinkByShortCode(finalShortCode);

        if (link) {
            return res.status(400).send("Sort code already exist. Pleased choose another.")
        }

        //! if not present

        await insertShortLink({ url, finalShortCode, userId: req.user.id })
        return res.redirect("/");

    } catch (error) {
        if (error.name === 'ZodError') {
            const errors = error.issues.map(err => err.message);
            req.flash("errors", errors);
            return res.redirect("/");
        }
        return res.status(500).send("internal server Error file")
    }
};


//! shortcode redirect page 

export const redirectToShortLink = async (req, res) => {
    try {

        const { shortCode } = req.params;

        const link = await getShortLinkByShortCode(shortCode);
        console.log(link)


        if (!link) return res.status(404).send("404 Error Occurred");

        return res.redirect(link.url)
    } catch (error) {
        console.error(error)
        return res.status(500).send("Internal Server Error");
    }
};