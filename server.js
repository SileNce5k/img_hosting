require("dotenv").config();
const express = require('express');
const api = express();
const port = process.env.PORT;
const fs = require('fs');
const multer = require('multer');
const path = require('path')
const { execSync } = require('child_process');



const temporary_path = "temp/";
const domain_name = process.env.DOMAIN_NAME;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, temporary_path);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});



const file_filter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};


function verify_api_key(req, res, next) {
    if (req.headers["x-api-key"] === process.env.API_KEY) {
        next()
    } else {
        res.status(401).send("Invalid API key");
        return
    }
}


const upload = multer({
    storage: storage,
    fileFilter: file_filter,
    limits: { fileSize: 1024 * 1024 * 20 }

});

// TODO: Use a database to ensure no duplicates in the future
function generate_random_string(length = 4) { 
    let random_string = "";
    const valid_characters = "ABCDEFGHIJKLMNOPQRSTUVabcdefghijklmnopqrstuvwxyz123456789";
    let num_attempts = 0;
    do {
        random_string = "";
        for (let i = 0; i < length; i++) {
            random_string += valid_characters.charAt(Math.floor(Math.random() * valid_characters.length));
        }
        num_attempts++
        if(num_attempts >= 1000){
            random_string = "";
            break;
        }
    } while (fs.existsSync(`${process.env.IMAGE_LOCATION_PATH}${random_string}`));
    if(num_attempts > 1){
        console.log(`Generated ${random_string} after ${num_attempts} attempts`)
    }

    return random_string;
}




api.post('/api/v1/upload-image', verify_api_key, (req, res, next) => {
    upload.single('file')(req, res, function (err) {
        if (err) {
            console.error(err.message)            
            res.status(400).send(err.message);
            return
        } 
        const file = req.file;
    
        if (!file) {
            res.status(400).send('No file uploaded.');
            return
        }
    
        const command = `exiftool -overwrite_original_in_place -all= ${file.path}`
        execute_command(command);
    
        const random_str = generate_random_string();
        if(random_str === ""){
            console.error("Not enough characters to randomly create a string after 1000 attempts\nIncrease length of random string generated")
            res.status(500).send("Internal Server Error\nTell the owner of this website to check their server\nFile was deleted after upload")
            fs.unlinkSync(file.path)
            return
        }
    
        fs.renameSync(file.path, `${process.env.IMAGE_LOCATION_PATH}${random_str}`)
        res.status(200).send(`${domain_name}${random_str}`);
    })

})

function execute_command(command) {
    console.log("Executing:", command)
    try {
        const output = execSync(command, { encoding: 'utf-8' })
        if (output.length != 0)
            console.log(output)
    } catch (error) {
        console.error(`Error executing command:`, error);
        return { error: true };
    }
    return { error: false };
}

api.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
})