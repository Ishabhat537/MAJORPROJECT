const User=require("../models/user");

module.exports.renderSignupForm=    (req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.signUp=async(req,res,next)=>{
    try{
         let {username,email,password}=req.body;
 const newUser=new User({email,username});
 const registeredUser=await User.register(newUser,password);
 console.log(registeredUser);
 req.login(registeredUser,(err)=>{
    if(err){
       return next(err);
    } req.flash("success","Welcome to WanderLust!");
      return res.redirect("/listings");
 });
    } catch(e){
        req.flash("error",e.message);
      return res.redirect("/signup");
    }      

}

module.exports.renderLoginForm=   (req,res)=>{
   res.render("users/login.ejs");
}

module.exports.login=   async(req,res)=>{
       req.flash("success","Welcome Back to WandurLust!");
       let redirectUrl=res.locals.redirectUrl || "/listings";
       res.redirect(redirectUrl);
}

module.exports.logout=(req,res,next)=>{
    req.logOut((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Logged you out!");
        res.redirect("/listings");
    });
}