
import crypto from "crypto";
import { getAllShortLinks, getShortLinkByShortCode, insertShortLink } from "../services/shortener.services.js";






//! function for reading html and Css file
export const getSortenerPage = async (req, res) => {
    try {
        //! no need to read because of res.render();

        const links = await getAllShortLinks();


        return res.render("index", { links, hosts: req.host });
    } catch (error) {
        console.log(error)
        return res.status(500).send("internal server Error")
    }
};



//! POST methods/data store/duplicate check

export const postURLshortener = async (req, res) => {
    try {
        const { url, shortCode } = req.body;
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

        const link = await getShortLinkByShortCode(finalShortCode);

        if (link) {
            return res.status(400).send("Sort code already exist. Pleased choose another.")
        }

        //! if not present
        // link[finalShortCode] = url;
        // await saveLinks(link)

        await insertShortLink({ url, finalShortCode })

        return res.redirect("/");

    } catch (error) {
        console.log(error)
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