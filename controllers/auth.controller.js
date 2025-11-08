
export const getRegisterPage=(req,res)=>{
       return res.render("auth/register")
}


export const getLoginPage=(req,res)=>{
   return  res.render("auth/login")
}

export const postLogin=(req,res)=>{
    res.setHeader("set-cookie","isLoggedIn=true; path=/")
    res.redirect("/")
}


