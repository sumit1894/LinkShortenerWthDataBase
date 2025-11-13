
import crypto from "crypto";
import z from "zod"
import { getAllShortLinks, getShortLinkByShortCode, insertShortLink, findShortLinkById, UpdateShortCode } from "../services/shortener.services.js";
import { urlShortenerSchema } from "../validators/shortener-validation.js";




export const errorPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    return res.redirect("/404")
}


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
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

        const link = await getShortLinkByShortCode(finalShortCode);

        if (link) {
            req.flash("errors", "Url with that shortCode already exists,please choose another ");
            return res.redirect("/");
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

// getShortenerEditPage

export const getShortenerEditPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    const result = z.coerce.number().int().safeParse(req.params.id)
    if (!result.success) {
        console.log("getShortenerEditPage")
        return res.redirect("/404");
    }

    const id = result.data;
    try {
        const shortLink = await findShortLinkById(id);
        if (!shortLink) return res.redirect("/404");

        res.render("edit-shortLink", {
            id: shortLink.id,
            url: shortLink.url,
            shortCode: shortLink.shortCode,
            errors: req.flash("errors")
        })



    } catch (error) {
        console.error("Error in getShortenerEditPage:", error);
        return res.status(500).send("Internal server error")
    }
}

//postShortenerEditPage

export const postShortenerEditPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    const result = z.coerce.number().int().safeParse(req.params.id)
    
    // Add this check back!
    if (!result.success) {
        console.log("postShortenerEditPage - Invalid ID");
        return res.redirect("/404");
    }

    const id = result.data;
    try {
        const { url, shortCode } = req.body;
        const newUpdateShortCode = await UpdateShortCode({ id, url, shortCode });
        if (!newUpdateShortCode) return res.redirect("/404");
        res.redirect("/")

    } catch (error) {
        // Check both error.code and error.cause.code for Drizzle ORM
        const errorCode = error.code || error.cause?.code;
        
        if (errorCode === "ER_DUP_ENTRY") {
            req.flash("errors", "Shortcode already exists, please choose another");
            return res.redirect(`/edit/${id}`);
        }
        
        console.error("Error in postShortenerEditPage:", error);
        return res.status(500).send("Internal server error");
    }
}