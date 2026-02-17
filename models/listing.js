const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review =require("./review.js");

const listingSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },

    geometry: {
  type: {
    type: String,
    enum: ["Point"],
   
  },
  coordinates: {
    type: [Number],
    
  }
},


    
    image: {
   url: String,
   filename:String,
  },

    price:{
        type:Number,
    },
    location:{
        type:String,
    },
    country:{
        type:String,
    },
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    category:{
        type:String,
        enum:[
              "Trending",
            "Rooms",
            "Iconic Cities",
            "Mountains",
            "Castles",
            "Amazing Pools",
            "Camping",
            "Farms",
            "Arctic"
        ]
    }

});

listingSchema.post("/findOneAndDelete",async(listing)=>{
    if(listing){
            await Review.deleteMany({reviews:{$in: listing.reviews}});

    }

})

const Listing = mongoose.model("Listing",listingSchema);

module.exports=Listing;
