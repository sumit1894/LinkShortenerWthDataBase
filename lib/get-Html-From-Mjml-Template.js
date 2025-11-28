import fs from "fs/promises";
import mjml2html from "mjml";
import path from "path";
import ejs from "ejs";

export const getHtmlFromMjmlTemplate=async(template,data)=>{
    //* read data
    const mjmlTemplate=await fs.readFile(
        path.join(import.meta.dirname,"..","emails",`${template}.mjml`),"utf-8"
    );

    //* data replace dynamic 
    const filledTemplate=ejs.render(mjmlTemplate,data);

    //* convert file into html
    return mjml2html(filledTemplate).html;
}