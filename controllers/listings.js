
const axios = require("axios");


const Listing=require("../models/listing");
const { cloudinary } = require("../cloudConfig");


async function geocodeLocation(location) {
  const res = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: location,
        format: "json",
        limit: 1
      },
      headers: {
        "User-Agent": "airbnb-clone"
      }
    }
  );

  if (!res.data.length) return null;

return {
  type: "Point",
  coordinates: [
    parseFloat(res.data[0].lon),
    parseFloat(res.data[0].lat)
  ]
};

}



module.exports.index=async (req,res)=>{
  let {search,category}=req.query;
  let allListings;
  let filter={};
  if(category){
    filter.category=category;
  }
  if(search){
    filter.$or=[
      {title:{$regex: search,$options: "i"}},
      {location:{$regex:search,$options:"i"}},
      {country:{$regex:search,$options:"i"}}
    ];
  }

  allListings=await Listing.find(filter).lean();

  res.render("./listings/index.ejs",{allListings});
}
 module.exports.renderNewForm=(req,res)=>{res.render("./listings/new.ejs");}

module.exports.createListing=async(req,res,next)=>{
   console.log("REQ.FILE =", req.file);
    const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  
const fullLocation = `${req.body.listing.location}, ${req.body.listing.country}`;
const coords = await geocodeLocation(fullLocation);

if (coords) {
  newListing.geometry = coords;
}



  if (req.file) {
    newListing.image = {
      url: req.file.secure_url,
      filename: req.file.public_id,
    };
  }

  await newListing.save();
  req.flash("success", "New listing created!");
  res.redirect("/listings");
};

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
       return res.redirect("/listings");
    }
    // console.log(listing);
  
    res.render("listings/show.ejs",{listing});
};

module.exports.editListing=async(req,res)=>{
      const {id}=req.params;
 const listing=await Listing.findById(id);

  let originalImage = null;
  if (listing.image && listing.image.url) {
    originalImage = listing.image.url.replace(
      "/upload",
      "/upload/h_300,w_250,c_fill/"
    );
  }
 res.render("./listings/edit.ejs",{listing,originalImage});
};


module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) {
    throw new ExpressError(400, "send valid data for listing");
  }

  const { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
  );
  if (req.body.listing.location) {
const fullLocation = `${req.body.listing.location}, ${req.body.listing.country}`;
const coords = await geocodeLocation(fullLocation);

  if (coords) {
    listing.geometry = coords;
    await listing.save();
  }
}


  if (req.file) {
    listing.image = {
      url: req.file.secure_url,
      filename: req.file.public_id,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};


// module.exports.destroyListing=async(req,res)=>{
    // let {id}=req.params;
    // let deletedListing=await Listing.findByIdAndDelete(id);
    // console.log(deletedListing);
    //  req.flash("success"," Listing Deleted!");
    // res.redirect("/listings");
// };
// 

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);

 
  if (listing.image && listing.image.filename) {
    await cloudinary.uploader.destroy(listing.image.filename);
  }

 
  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};


