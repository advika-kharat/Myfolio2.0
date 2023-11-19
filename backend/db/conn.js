// const mongoose = require("mongoose");

// mongoose.connect('mongodb://localhost:27017/myfolio',{
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//       //createIndexes: true
//     }).then(()=>{
//     console.log(`Connection Successful`);
// }).catch((e)=>{
//     console.log(`Not connected`);
//     console.log(e);
// })

//this was already commented out
//export
// module.exports=conn;

const mongoose = require("mongoose");
require('dotenv').config();
const uri = process.env.MONGODB_URI
//const uri = "mongodb+srv://kharatadvika:advika123@cluster0.2ki5xcz.mongodb.net/";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // createIndexes: true // This option is not necessary, as it is not a valid option for mongoose.connect
}).then(() => {
  console.log(`Connection Successful`);
}).catch((e) => {
  console.log(`Not connected`);
  console.error(e);
});

// export
// module.exports=conn;

