
export const getRegisterPage=(req,res)=>{
    try {
       return res.render("auth/register")
    } catch (error) {
        console.log("register error",error)
    }
}


export const getLoginPage=(req,res)=>{
try {
   return  res.render("auth/login")
} catch (error) {
    console.log("Login Error",error)
}}