const express = require('express');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const { AuthorizationCode } = require('simple-oauth2');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();
const { google } = require('googleapis');
const axios = require('axios');
const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Failed to connect to MongoDB:', error));

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

const googleOAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
);

const microsoftOAuth2Client = new AuthorizationCode({
    client: {
        id: process.env.MICROSOFT_CLIENT_ID,
        secret: process.env.MICROSOFT_CLIENT_SECRET,
    },
    auth: {
        tokenHost: 'https://login.microsoftonline.com',
        tokenPath: '/common/oauth2/v2.0/token',
        authorizePath: '/common/oauth2/v2.0/authorize',
    },
});

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/todoRoutes'));

// Google Calendar Routes
app.get('/googlelogin', (req, res) => {
    const url = googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/calendar.readonly'
    });
    res.redirect(url);
});

app.get('/redirect', (req, res) => {
    const code = req.query.code;
    googleOAuth2Client.getToken(code, (err, tokens) => {
        if (err) {
            console.error('Couldn\'t get token', err);
            res.send('Error');
            return;
        }
        googleOAuth2Client.setCredentials(tokens);
        if (!req.session.googleTokens) {
            req.session.googleTokens = [];
        }
        req.session.googleTokens.push(tokens);
        req.session.activeGoogleToken = tokens;
        res.redirect('http://localhost:5173/');
    });
});

app.get('/calendars', async (req, res) => {
    const tokens = req.session.activeGoogleToken;
    if (!tokens) {
        console.error('Google access token is missing');
        res.status(401).send('Unauthorized');
        return;
    }
    googleOAuth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
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

app.get('/events', async (req, res) => {
  const googleTokens = req.session.googleTokens || [];
  const microsoftTokens = req.session.microsoftTokens || [];

  const allEvents = [];

  // Fetch Google events
  for (const tokens of googleTokens) {
      googleOAuth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });

      try {
          const calendarResponse = await calendar.calendarList.list();
          const calendars = calendarResponse.data.items;

          for (const cal of calendars) {
              const eventsResponse = await calendar.events.list({
                  calendarId: cal.id,
                  timeMin: (new Date()).toISOString(),
                  maxResults: 15,
                  singleEvents: true,
                  orderBy: 'startTime'
              });
              const events = eventsResponse.data.items;

              const transformedEvents = events.map(event => ({
                  id: event.id,
                  email: event.creator.email,
                  title: event.summary,
                  description: event.description,
                  dueDate: event.end.dateTime,
                  origin: 'google'
              }));
              allEvents.push(...transformedEvents);
          }
      } catch (err) {
          console.error('Error fetching Google events', err);
      }
  }

  // Fetch Microsoft events
  for (const token of microsoftTokens) {
      const accessToken = token.access_token;

      const client = Client.init({
          authProvider: (done) => {
              done(null, accessToken);
          },
      });

      try {
          const calendarResponse = await client.api('/me/calendars').get();
          const calendars = calendarResponse.value;

          for (const calendar of calendars) {
              const calendarId = calendar.id;
              const eventsResponse = await client.api(`/me/calendars/${calendarId}/events`).get();
              const events = eventsResponse.value;

              const transformedEvents = events.map(event => ({
                  id: event.id,
                  email: event.organizer.emailAddress.address,
                  title: event.subject,
                  description: event.bodyPreview,
                  dueDate: event.end.dateTime,
                  origin: 'microsoft'
              }));
              allEvents.push(...transformedEvents);
          }
      } catch (error) {
          console.error('Error fetching Microsoft events', error);
      }
  }

  res.json(allEvents);
});

app.get('/logout', (req, res) => {
    const tokens = req.session.activeGoogleToken;
    if (!tokens) {
        console.error('Google access token is missing');
        res.status(401).send('Unauthorized');
        return;
    }
    googleOAuth2Client.setCredentials(tokens);
    googleOAuth2Client.revokeToken(googleOAuth2Client.credentials.access_token, (err, body) => {
        if (err) {
            console.error('Error revoking token', err);
            res.status(500).send('Error logging out');
            return;
        }
        res.clearCookie('connect.sid');
        req.session.destroy();
        res.send('Successfully logged out');
    });
});

// Microsoft Calendar Routes
app.get('/microsoftlogin', (req, res) => {
    const authorizationUri = microsoftOAuth2Client.authorizeURL({
        redirect_uri: process.env.MICROSOFT_REDIRECT,
        scope: 'openid profile offline_access user.read calendars.read',
    });
    res.redirect(authorizationUri);
});

app.get('/microsoft/redirect', async (req, res) => {
    const { code } = req.query;
    const tokenParams = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_SECRET_VALUE,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT,
        grant_type: 'authorization_code',
    });

    try {
        const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', tokenParams, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const accessToken = response.data;

        if (!req.session.microsoftTokens) {
            req.session.microsoftTokens = [];
        }
        req.session.microsoftTokens.push(accessToken);
        req.session.activeMicrosoftToken = accessToken;
        res.redirect('http://localhost:5173/');
    } catch (error) {
        console.error('Access Token Error:', error.message);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        res.send('Error logging in with Microsoft');
    }
});

app.get('/microsoft/calendars', async (req, res) => {
    const accessToken = req.session.activeMicrosoftToken ? req.session.activeMicrosoftToken.access_token : null;
    if (!accessToken) {
        console.error('Microsoft access token is missing');
        res.status(401).send('Unauthorized');
        return;
    }
    const client = Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });

    try {
        const result = await client.api('/me/calendars').get();
        res.json(result.value);
    } catch (error) {
        console.error('Error fetching Microsoft calendars', error);
        res.send('Error!');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
