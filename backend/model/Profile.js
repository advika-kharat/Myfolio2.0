const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const profileSchema = new Schema({
    username: {
        type: String,
        unique: true
    },
    personalInformation: {
        name: String,
        email: String,
        contactNumber: String,
        profession: String,
        linkedin: String,
        github: String,
        bio: String,
    },
    profilePicture: {
        filename: String,
        url: String,
    },
    resume: {
        filename: String,
        url: String,
    },
    experience: [
        {
            position: String,
            company: String,
            description: String
        }
    ],
    projects: [
        {
            name: String,
            description: String,
            techstack: String,
            link: String
        }
    ],
    skills: [
        {
            name: String,
            proficiency: String
        }
   ]
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;