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
const UserPhoto = require('./models/microsoftUserPhoto');
const secretKey = crypto.randomBytes(32).toString('hex');
const {rateLimit} = require('express-rate-limit')
const todoNotifier = require('./middlewares/eventScheduler');


const app = express();
const port = process.env.PORT || 3000;
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
})
todoNotifier.setupSSERoute(app);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    app.use(limiter)

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
app.use('/api/v1/friends', require('./routes/friendRoutes'));


// Google Calendar Routes
app.get('/googlelogin', (req, res) => {
    const url = googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'openid'],
    });
    res.redirect(url);
});

app.get('/redirect', async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await googleOAuth2Client.getToken(code);
        googleOAuth2Client.setCredentials(tokens);

        // Fetch user info using the Google API client
        const oauth2 = google.oauth2({
            auth: googleOAuth2Client,
            version: 'v2'
        });

        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        if (!email) {
            console.error('Could not extract email from user info');
            res.send('Error extracting email');
            return;
        }

        // Assuming req.session.googleTokens is an array of token objects
        req.session.googleTokens = req.session.googleTokens || [];

        const tokenExists = req.session.googleTokens.some(token => token.email === email);

        if (!tokenExists) {
            req.session.googleTokens.push({ ...tokens, email });
            res.redirect('http://localhost:5173/?login=success');
        } else {
            res.redirect('http://localhost:5173/?login=alreadyloggedin');
        }

    } catch (error) {
        console.error('Error during Google OAuth flow:', error);
        res.send('Error');
        res.redirect('http://localhost:5173/?login=failed');
    }
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

app.put('/editEvent', async (req, res) => {
    const { eventId, updatedEvent } = req.body;
    const tokens = req.session.googleTokens;

    if (!tokens) {
        console.error('Google access token is missing');
        res.status(401).send('Unauthorized');
        return;
    }
    googleOAuth2Client.setCredentials({
        access_token: tokens[0].access_token
    });
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });

    try {
        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: updatedEvent,
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error updating Google event', error);
        res.status(500).send('Error updating event');
    }
});

app.delete('/deleteEvent/:id', async (req, res) => {

    const tokens = req.session.googleTokens;

    if (!tokens) {
        console.error('Google access token is missing');
        res.status(401).send('Unauthorized');
        return;
    }
    console.log(tokens)

    googleOAuth2Client.setCredentials({
        access_token: tokens[0].access_token
    });
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: req.params.id,
        });
        res.send('Event deleted successfully');
    } catch (error) {
        console.error('Error deleting Google event', error);
        res.status(500).send('Error deleting event');
    }
});

app.put('/editMicrosoftEvent', async (req, res) => {
    const { eventId, updatedEvent } = req.body;
    const accessToken = req.session.microsoftTokens ? req.session.microsoftTokens[0].access_token : null;

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
        const response = await client.api(`/me/events/${eventId}`).patch(updatedEvent);
        res.json(response);
    } catch (error) {
        console.error('Error updating Microsoft event', error);
        res.status(500).send('Error updating event');
    }
});

app.delete('/deleteMicrosoftEvent/:id', async (req, res) => {
    const eventId = req.params.id;
    const accessToken = req.session.microsoftTokens ? req.session.microsoftTokens[0].access_token : null;
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
        await client.api(`/me/events/${eventId}`).delete();
        res.send('Event deleted successfully');
    } catch (error) {
        console.error('Error deleting Microsoft event', error);
        res.status(500).send('Error deleting event');
    }
});


app.get('/events', async (req, res) => {
    const googleTokens = req.session.googleTokens || [];
    const microsoftTokens = req.session.microsoftTokens || [];

  const allEvents = [];
  const defaultImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/1200px-Windows_10_Default_Profile_Picture.svg.png";

// Function to fetch and save Microsoft profile photo
  const fetchAndSaveProfilePhoto = async (accessToken, email) => {
      try {
          // Fetch the profile photo from Microsoft Graph API
          const profilePhotoResponse = await axios.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
              headers: {
                  Authorization: `Bearer ${accessToken}`
              },
              responseType: 'arraybuffer'
          });

          const photoBuffer = Buffer.from(profilePhotoResponse.data, 'binary');
          const photoContentType = profilePhotoResponse.headers['content-type'];

          // Upsert the photo in the database (insert if not exists, otherwise update)
          await UserPhoto.findOneAndUpdate(
              { email },
              { photo: photoBuffer, contentType: photoContentType },
              { upsert: true }
          );

          // Return a base64-encoded data URL
          const base64Photo = photoBuffer.toString('base64');
          return `data:${photoContentType};base64,${base64Photo}`;

      } catch (error) {
          if (error.response && error.response.status === 404) {
              // Profile photo not found, return default image URL
              return defaultImage;
          } else {
              console.error('Error fetching or saving Microsoft profile photo:', error.response ? error.response.data : error.message);
              throw error;
          }
      }
  };

  // Fetch Google events
  for (const tokens of googleTokens) {
    googleOAuth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
    const oauth2 = google.oauth2({auth: googleOAuth2Client, version: 'v2'});

    try {
      const userInfo = await oauth2.userinfo.get();
      const picture = userInfo.data.picture;
      const name = userInfo.data.name;
      const email = userInfo.data.email;
      
      // By uncommenting  the for loop we can access all events and default calendars.
      // const calendarResponse = await calendar.calendarList.list();
      // const calendars = calendarResponse.data.items;
      // for (const cal of calendars) {
        const eventsResponse = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 15,
            singleEvents: true,
            orderBy: 'startTime'
        });
        const events = eventsResponse.data.items;

        if (events.length === 0) {
            const widldcardEmail = {
                email:email,
                picture: picture,
                name: name,
                origin: 'google'
            };
            allEvents.push(widldcardEmail);
        }

        const transformedEvents = events.map(event => ({
            id: event.id,
            email: event.creator.email,
            title: event.summary,
            description: event.description,
            dueDate: event.end.dateTime,
            createdAt: event.created,
            picture: picture,
            name: name,
            email: email,
            origin: 'google'
        }));
        allEvents.push(...transformedEvents);
        process.nextTick(() => todoNotifier.scheduleTodoNotification(allEvents));

          // }
    } catch (err) {
        console.error('Error fetching Google events', err);
    }
  }

    // Fetch Microsoft events
    for (const token of microsoftTokens) {
        const accessToken = token.access_token;

      try {
          const client = Client.init({
              authProvider: (done) => {
                  done(null, accessToken);
              },
          });

          const userInfo = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const email = 'Microsoft: '+ userInfo.data.mail || 'Microsoft: '+ userInfo.data.userPrincipalName;
          const name = userInfo.data.displayName || userInfo.data.givenName

          // Fetch and save profile photo
          const photoUrl = await fetchAndSaveProfilePhoto(accessToken, email);

          const calendarResponse = await client.api('/me/calendars').get();
          const calendars = calendarResponse.value;

          // By uncommenting  the for loop we can access all events and default calendars.
          // for (const calendar of calendars) {
          const calendarId = calendars[0].id;
          const eventsResponse = await client.api(`/me/calendars/${calendarId}/events`).get();
          const events = eventsResponse.value;

          if (events.length ===0) {
            const widldcardEmail = {
                email:email,
                picture: photoUrl,
                name: name,
                origin: 'microsoft',
            };
            allEvents.push(widldcardEmail);
            }

              const transformedEvents = events.map(event => ({
                  id: event.id,
                  email: email,
                  title: event.subject,
                  description: event.bodyPreview,
                  dueDate: event.end.dateTime,
                  createdAt: event.createdDateTime,
                  name: name,
                  picture: photoUrl, // Base64-encoded data URL or default icon URL
                  origin: 'microsoft'
              }));
              allEvents.push(...transformedEvents);
          // }
      } catch (error) {
          console.error('Error fetching Microsoft events:', error.response ? error.response.data : error.message);
      }
  }

    res.json(allEvents);
});

app.get('/logout', (req, res) => {
  const email = req.query.email;
  try {
    if (req.session.googleTokens) {
      req.session.googleTokens = req.session.googleTokens.filter(token => token.email !== email);
    }
    if (req.session.microsoftTokens) {
      req.session.microsoftTokens = req.session.microsoftTokens.filter(token => 'Microsoft: '+token.email !== email);
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(201);
  }
});

// Microsoft Calendar Routes
app.get('/microsoftlogin', (req, res) => {
    const authorizationUri = microsoftOAuth2Client.authorizeURL({
        redirect_uri: process.env.MICROSOFT_REDIRECT,
        scope: 'openid profile offline_access user.read calendars.readwrite',
    });
    res.redirect(authorizationUri);
});

app.get('/microsoft/redirect', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await getMicrosoftToken(code);
        const accessToken = tokenResponse.access_token;
        const userInfo = await getMicrosoftUserInfo(accessToken);
        const email = userInfo.mail || userInfo.userPrincipalName;

        req.session.microsoftTokens = req.session.microsoftTokens || [];

        const tokenExists = req.session.microsoftTokens.some(token => token.email === email);

        if (!tokenExists) {
            req.session.microsoftTokens.push({ ...tokenResponse, email });
            res.redirect('http://localhost:5173?login=success');
        } else {
            res.redirect('http://localhost:5173?login=alreadyloggedin');
        }

    } catch (err) {
        res.redirect('http://localhost:5173?login=failed');
        console.error('Error during Microsoft OAuth flow', err);
        res.send('Error');
    }

    async function getMicrosoftToken(code) {
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

            return response.data;
        } catch (error) {
            console.error('Error fetching Microsoft token:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async function getMicrosoftUserInfo(accessToken) {
        try {
            const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching Microsoft user info:', error.response ? error.response.data : error.message);
            throw error;
        }
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
