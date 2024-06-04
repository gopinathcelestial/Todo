const express = require('express');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const {google} = require('googleapis')




const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);


mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Failed to connect to MongoDB:', error));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/todoRoutes'));

app.get('/googlelogin', (req, res) => {
  console.log(oauth2Client)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/calendar.readonly' 
  });
 
  res.redirect(url);
});

app.get('/redirect', (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Couldn\'t get token', err);
      res.send('Error');
      return;
    }
    oauth2Client.setCredentials(tokens);
    res.send('Successfully logged in');
  });
});

app.get('/calendars', (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars', err);
      res.end('Error!');
      return;
    }
    const calendars = response.data.items;
    res.json(calendars);
  });
});

app.get('/events', (req, res) => {
  const calendarId = req.query.calendar ?? 'primary';
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.events.list({
    calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 15,
    singleEvents: true,
    orderBy: 'startTime'
  }, (err, response) => {
    if (err) {
      console.error(err);
      res.send('Error');
      return;
    }
    const events = response.data.items;
    const transformedEvents = events.map(event => ({
      id: event.id,
      email: event.creator.email,
      title: event.summary,
      dueDate: event.end.dateTime,
      origin: 'google'
    }));

    res.json(transformedEvents);
  });
});

app.get('/logout', (req, res) => {
  oauth2Client.revokeToken(oauth2Client.credentials.access_token, (err, body) => {
    if (err) {
      console.error('Error revoking token', err);
      res.status(500).send('Error logging out');
      return;
    }
    
    res.clearCookie('connect.sid');
    res.send('Successfully logged out');
  });
});


app.listen(port, () => {
    console.log('Server is running on port', port);
});
