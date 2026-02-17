// if(process.env.NODE_ENV !="production"){
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


require('dotenv').config();


// console.log("ENV TEST:", process.env);
// console.log("DB URL:", process.env.MONGOATLAS_DB);

// console.log(process.env.SECRET);
// }
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const session=require("express-session");
const MongoStore = require('connect-mongo').default;
const ExpressError=require("./utils/ExpressError.js");
const flash=require("connect-flash");

const User=require("./models/user.js");
const passport=require("passport");
const localStrategy=require("passport-local");
const { serialize } = require("v8");



// 
// const MONGO_URL="mongodb://127.0.0.1:27017/wanderLust";
const dbUrl = process.env.MONGOATLAS_DB;
console.log("DB URL =", process.env.MONGOATLAS_DB);


const Listing = require("./models/listing");



async function main() {
  await mongoose.connect(dbUrl);
  console.log("connected to DB");
   console.log("DB Host:", mongoose.connection.host);
   console.log("Database name:", mongoose.connection.name);




  app.listen(8080, () => {
    console.log("server is listening to port 8080");
  });
}

main().catch((err) => console.log(err));

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));


app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error",()=>{
    console.log("ERROR IN MONGO SESSION STORE");
})


const sessionOptions={
    store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        expires: Date.now()+7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true,
        sameSite: "lax"
    },
};
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})


app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.get("/whoami", (req,res)=>{
    console.log("WHO AM I =", req.user);
    res.send(req.user);
});




app.use((req,res,next)=>{
    next(new ExpressError(404,"page not found"));
});
app.use((err,req,res,next)=>{
    let{statusCode=500,message="Something went wrong"}=err;
    //res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{message});
});



