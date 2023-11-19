const express = require("express");
const app = express();
const methodOverride = require('method-override');
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
// const session = require("express-session");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
require('dotenv').config();
const path = require("path");
const fileUpload = require('express-fileupload');

const CLOUDINARY_Secrete_Key = process.env.CLOUDINARY_Secrete_Key
const CLOUDINARY_URL=process.env.CLOUDINARY_URL

const cloudinary = require('cloudinary').v2;
const cloudinarySecret = CLOUDINARY_Secrete_Key;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: cloudinarySecret,
});

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//     { public_id: "olympic_flag", overwrite: true, faces: true }, 
//     function(error, result) {
//         if (error) {
//             console.error(error);
//         } else {
//             console.log(result);
//         }
//     }
// );

app.use(fileUpload({
    useTempFiles: true
}));
// console.log('Current Working Directory:', process.cwd());



require("./db/conn");

const User = require("./model/User");
const Profile = require("./model/Profile");


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../frontend/views'))
app.use(express.static(path.join(__dirname, '../frontend/public')))
app.use(express.static(path.join(__dirname, '../frontend/assets')))


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(methodOverride('_method', { methods: ['POST', 'DELETE'] }));
app.use(methodOverride('_method'));
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at port no ${port}`);
})




app.get("/error",function(req,res){
    res.render('error')
})

app.get("/", function (req, res) {
    res.render('home');
})

// app.all('*',(req,res,next)=>{
//     next(new ExpressError('Page Not Found',404));
// })



app.get("/register", function (req, res) {
    res.render('register');
})
//Create a new user in database
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        const hash = await bcrypt.hash(password, 12);
        if (password === cpassword) {
            const user = await User.create({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: hash
            });
            const profile = await Profile.create({
                username: req.body.username,
                personalInformation: {
                    name: req.body.name,
                    email: req.body.email,
                    // contactNumber: "",
                    // linkedin: "",
                    // github: "",
                    // bio: ""
                },
                profilePicture: {
                    filename: "",
                    url: ""
                },
                resume: {
                    filename: "",
                    url: ""
                },
                experience: [],
                projects: [],
                skills: []
            });

            // return res.status(200).json({success:true , user});
            res.redirect("/login")
        }
        else {
            res.send("Confirm password and Password not matching");
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
})




app.get("/login", function (req, res) {
    res.render('login');
})

// Handling user login
// JWT Configuration
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';
app.post("/login", async function (req, res) {
    try {
        // check if the user exists
        const { username, password } = req.body;
        const user = await User.findOne({ username: username });


        if (user) {
            //check if password matches
            const result = await bcrypt.compare(password, user.password);

            if (result) {
                // Generate a JWT token
                const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
                res.cookie('jwt-token', token);

                // res.json({ success: true, token });
                res.redirect(`Users/${user.username}`)
            } else {
                res.status(400).json({ error: "Password doesn't match" });
            }
        } else {
            res.status(400).json({ error: "User doesn't exist" });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});



//Handling user logout 
app.get("/logout", function (req, res) {
    // Clear JWT token on the client side (assuming it's stored in a cookie)
    res.clearCookie('jwt-token');

    // Passport.js session-based logout
    req.logout(function (err) {
        if (err) {
            // Handle the error, perhaps by logging it
            console.error('Error during logout:', err);
            return next(err); // If using this inside a middleware, pass the error to the next middleware
        }

        res.redirect('/login');
    });
});



function authenticateJWT(req, res, next) {
    const token = req.cookies['jwt-token']; // Get token from cookie (or headers, as per your setup)

    if (!token) {
        return res.redirect('/login'); // Redirect to login if no token is present
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.redirect('/login'); // Redirect to login if token is invalid
        }

        req.user = user;
        next(); // Continue to the next middleware/route
    });
}











app.get("/Users", async (req, res) => {
    const users = await User.find({});
    res.render("Users/users", { users })
});

app.get("/Users/:username", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username: `${username}` });
    res.render("Users/username", { user });
});

app.put("/Users/:username", async (req, res) => {
    const { username } = req.params;
    const user = await User.findOneAndUpdate({ username: `${username}` }, { name: req.body.name, username: req.body.username, email: req.body.email }, { new: true });
    const profile = await Profile.findOne({ username });
    profile.username=req.body.username;
    profile.personalInformation.name =req.body.name;
    profile.personalInformation.email =req.body.email;
    await profile.save();
    res.redirect('/Users/' + req.body.username);
})

app.delete("/Users/:username", async (req, res) => {
    const { username } = req.params;
    const user = await User.findOneAndDelete({ username: `${username}` });
    const profile = await Profile.findOneAndDelete({ username: `${username}` });
    res.redirect('/');
})

app.get("/Users/:username/edit", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username: `${username}` });
    res.render('Users/edit', { user });
})

app.get("/Users/:username/ProfileEdit", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username: `${username}` });
    res.render('Users/ProfileForm', { user });
})

app.put("/Users/:username/ProfileEdit", async (req, res) => {
    const { username } = req.params;

    try {
        const profile = await Profile.findOne({ username });
        const user = await User.findOne({ username });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Update personal information if provided
        const { personalInformation_name } = req.body;
        if (personalInformation_name) {
            profile.personalInformation.name = personalInformation_name;
            user.name = personalInformation_name;
        }
        const { personalInformation_email } = req.body;
        if (personalInformation_email) {
            profile.personalInformation.email = personalInformation_email;
            user.email = personalInformation_email;
        }
        const { personalInformation_number } = req.body;
        if (personalInformation_number) {
            profile.personalInformation.contactNumber = personalInformation_number;
        }
        const { personalInformation_linkedin } = req.body;
        if (personalInformation_linkedin) {
            profile.personalInformation.linkedin = personalInformation_linkedin
        }
        const { personalInformation_github } = req.body;
        if (personalInformation_github) {
            profile.personalInformation.github = personalInformation_github;
        }
        const { personalInformation_bio } = req.body;
        if (personalInformation_bio) {
            profile.personalInformation.bio = personalInformation_bio;
        }
        const { personalInformation_profession } = req.body;
        if (personalInformation_profession) {
            profile.personalInformation.profession = personalInformation_profession;
        }

        // Handle profile picture upload
        if (req.files && req.files.profilePicture) {
            const profilePicture = req.files.profilePicture; // Access the uploaded file
            const filePath = profilePicture.tempFilePath;
            cloudinary.uploader.upload(filePath, async (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, error: 'Error uploading profile picture' });
                }
                console.log(result);
                profile.profilePicture.url = result.secure_url;
                profile.profilePicture.filename = result.original_filename;
                console.log(profile);
                await profile.save();
            });
        }



        // Handle resume upload
        if (req.files && req.files.resume) {
            const resume = req.files.resume; // Access the uploaded file
            const filePath = resume.tempFilePath;

            cloudinary.uploader.upload(filePath, async (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, error: 'Error uploading profile picture' });
                }
                console.log(result);
                profile.resume.url = result.secure_url;
                profile.resume.filename = result.original_filename;
                await profile.save();
            });
        }


        // Update experiences if provided
        if (req.body[`experience_position_0`]) {
            profile.experience = [];
        }
        for (let i = 0; i < 10; i++) {
            const position = req.body[`experience_position_${i}`];
            const company = req.body[`experience_company_${i}`];
            const description = req.body[`experience_description_${i}`];

            if (!position && !company && !description) {
                // Exit loop if no more fields
                break;
            }

            profile.experience.push({ position, company, description });
        }

        // Update projects if provided
        if (req.body[`projects_name_0`]) {
            profile.projects = [];
        }
        for (let i = 0; i < 10; i++) {
            const name = req.body[`projects_name_${i}`];
            const description = req.body[`projects_description_${i}`];
            const techstack = req.body[`projects_techstack_${i}`];
            const link = req.body[`projects_link_${i}`];

            if (!name && !description && !techstack && !link) {
                // Exit loop if no more fields
                break;
            }

            profile.projects.push({ name, description, techstack, link });
        }

        // Update skills if provided
        if (req.body[`skills_name_0`]) {
            profile.skills = [];
        }
        for (let i = 0; i < 5; i++) {
            const name = req.body[`skills_name_${i}`];
            const proficiency = req.body[`skills_proficiency_${i}`];

            if (!name || !proficiency) {
                // Exit loop if no more fields
                break;
            }

            profile.skills.push({ name, proficiency });
        }

        // Save the updated profile
        await profile.save();
        await user.save();

        res.redirect(`/Users/${username}/choose-template`)
        // res.json({ success: true, profile });
        console.log("Profile updated successfully");

        // Log a message before the process exits (Nodemon restart)
        process.on('exit', (code) => {
            console.log(`Exiting process with code ${code}. Nodemon restarting...`);
        });

    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});



app.get("/Users/:username/Template1", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await Profile.findOne({ username: `${username}` });
    res.render("Templates/Template1", { user });
});


app.get("/Users/:username/Template2", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await Profile.findOne({ username: `${username}` });
    res.render("Templates/Template2", { user });
});


app.get("/Users/:username/Template3", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await Profile.findOne({ username: `${username}` });
    res.render("Templates/Template3", { user });
});


app.get("/Users/:username/Template4", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await Profile.findOne({ username: `${username}` });
    res.render("Templates/Template4", { user });
});

app.get("/Users/:username/Template5", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await Profile.findOne({ username: `${username}` });
    res.render("Templates/Template5", { user });
});

app.get("/Users/:username/Template6", authenticateJWT, async (req, res) => {
    const { username } = req.params;
    const user = await Profile.findOne({ username: `${username}` });
    res.render("Templates/Template6", { user });
});

app.get("/Users/:username/choose-template",authenticateJWT, async(req,res)=>{
    const {username} = req.params;
    const user = await Profile.findOne({username: `${username}`});
    res.render("Users/ChooseTemplate",{user})
})
















// Payment
const Razorpay = require('razorpay');
const razorpayKey = process.env.RAZORPAY_KEY
const razorpaySecret = process.env.RAZORPAY_SECRET

const razorpay = new Razorpay({
    key_id: razorpayKey,
    key_secret: razorpaySecret,
});


app.get("/Users/:username/process-payment", async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username: `${username}` });
    res.render('client-payment-mashup', { user });
})


app.post('/Users/:username/process-payment', async (req, res) => {
    const paymentId = req.body.payment_id;

    try {
        // Verify the payment using the payment ID
        const payment = await razorpay.payments.fetch(paymentId);

        // You can perform additional checks and business logic here

        // Send a response indicating success
        res.json({ success: true });
    } catch (err) {
        // Handle errors and send a response indicating failure
        console.error('Error processing payment:', err);
        res.json({ success: false, error: err.message });
    }
});




// const GoogleStrategy = require('passport-google-oauth2').Strategy;

// const GOOGLE_CLIENT_ID ="6699294550-hhm3oni219g3m1llgv1kjhr2svtmkiuj.apps.googleusercontent.com"
// const GOOGLE_CLIENT_SECRET = "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";

// passport.use(new GoogleStrategy({
//   clientID: "6699294550-hhm3oni219g3m1llgv1kjhr2svtmkiuj.apps.googleusercontent.com",
//   clientSecret: "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",
//   callbackURL: "http://localhost:3000/auth/google/callback",
//   passReqToCallback: true,
// },
// function(request, accessToken, refreshToken, profile, done) {
//   return done(null, profile);
// }));

// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(user, done) {
//   done(null, user);
// });


// const session = require('express-session');



// function isLoggedIn(req, res, next) {
//   req.user ? next() : res.sendStatus(401);
// }

// app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
// app.use(passport.initialize());
// app.use(passport.session());


// app.get('/auth/google',
//   passport.authenticate('google', { scope: [ 'email', 'profile' ] }
// ));

// app.get( '/auth/google/callback',
//   passport.authenticate( 'google', {
//     successRedirect: '/protected-google',
//     failureRedirect: '/auth/google/failure'
//   })
// );

// app.get('/protected-google', isLoggedIn, (req, res) => {
//   res.send(`Hello ${req.user.displayName}`);
// });

// app.get('/logout-google', (req, res) => {
//   req.logout();
//   req.session.destroy();
//   res.send('Goodbye!');
// });

// app.get('/auth/google/failure', (req, res) => {
//   res.send('Failed to authenticate..');
// });






// const request = require('supertest');

// const { expect } = require('chai');

// describe('User Registration', function() {
//   this.timeout(10000); // Extend the timeout for this test

//   it('Registers a new user', function(done) {
//     const userData = {
//       name: 'Test User',
//       username: 'testuser',
//       email: 'testuser@example.com',
//       password: 'password123',
//       cpassword: 'password123'
//     };

//     request(app)
//       .post('/register')
//       .send(userData)
//       .expect(500) 
//       .end((err, res) => {
//         if (err) return done(err);

        
//         setTimeout(() => {
//           done(); 
//         }, 1000); 
//       });
//   });
// });


// describe('User Login', () => {
//     it('Logs in an existing user', (done) => {
//       const userData = {
//         username: 'testuser',
//         password: 'password123'
//       };
  
//       request(app)
//         .post('/login')
//         .send(userData)
//         .expect(302) 
//         .end((err, res) => {
//           if (err) return done(err);
//           done();
//         });
//     });
//   });



//   describe('Profile Update', () => {
//     it('Updates user profile', (done) => {
//       const updatedUserData = {
//         name: 'Updated Name',
//         email: 'updatedemail@example.com'
//       };
  
//       request(app)
//         .put('/Users/testuser')
//         .send(updatedUserData)
//         .expect(302) 
//         .end((err, res) => {
//           if (err) return done(err);
//           done();
//         });
//     });
//   });
  
  
