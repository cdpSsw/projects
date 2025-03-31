const express = require('express');
const cors = require('cors');
const path = require('path');
const initMYSQL = require('./config/db');
const cookieParser = require('cookie-parser');

require('dotenv').config(); 
const port = process.env.port || 3000;

// api
// const highlight = require('./api/highlight');
// const activitiesSelected = require('./api/activitiesSelected')
// const showcase = require('./api/showcase');
// const careerP = require('./api/careerP');
// const faqs = require('./api/faqs');
// const tools = require('./api/borrowReturn/tools');

// admin

// ... selected
const selectedShowcase = require('./api/selected/selectedShowcase');
const selectedShowTiktok = require('./api/selected/selectedShowTiktok');

// ... sign in / up
const signIn = require('./api/signInUpOut/SignIn');
const signUp = require('./api/signInUpOut/SignUp');
const signOut = require('./api/signInUpOut/SignOut')

// student
const stu_main = require('./api/student/Stu_Main');
const stu_showcase = require('./api/student/pages/Stu_Showcase');
const stu_showtiktok = require('./api/student/pages/Stu_ShowTiktok');


const app = express();
app.use(cookieParser());
app.use(cors(
    {
        // origin: process.env.CORS_ORIGIN,
        origin: 'http://localhost:5173',
        credentials: true,
    }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/', (req, res) => {
    res.send('Hello Worlds!');
});

// app.use('/highlight', highlight);
// app.use('/activities', activities);
// app.use('/activitiesSelected', activitiesSelected);
// app.use('/showcase', showcase);
// app.use('/careerPath', careerP);
// app.use('/faqs', faqs);
// app.use('/tools', tools);


// admin
// ... selected
app.use('/selectedShowcase', selectedShowcase);
app.use('/selectedShowTiktok', selectedShowTiktok);

// ... sign in / up
app.use('/signUp', signUp);
app.use('/signIn', signIn);
app.use('/signOut', signOut);

// ... student [ +admin ]
app.use('/student', stu_main);
app.use('/studentShowcase', stu_showcase);
app.use('/studentShowTiktok', stu_showtiktok);

app.listen(port, async () => {
    try{
        await initMYSQL();
        console.log(`Example app listening at http://localhost:${port}`);

    } catch (err) {
        console.error('Error starting the app: ', err);
    }
});