const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/myfolio',{
      useNewUrlParser: true,
      useUnifiedTopology: true
      //createIndexes: true
    }).then(()=>{
    console.log(`Connection Successful`);
}).catch((e)=>{
    console.log(`Not connected`);
    console.log(e);
})

//export
// module.exports=conn;
