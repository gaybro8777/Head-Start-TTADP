import {} from 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import axios from 'axios';
import session from 'express-session';
import memorystore from 'memorystore';
import unless from 'express-unless';
import _ from 'lodash';
import path from 'path';
import join from 'url-join';

import logger, { requestLogger } from './logger';
import authMiddleware, { hsesAuth } from './middleware/authMiddleware';
import { loginPath } from './routes/apiDirectory';

const app = express();
const MemoryStore = memorystore(session);
const oauth2CallbackPath = '/oauth2-client/login/oauth2/code/';

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(session({
  secret: process.env.SESSION_SECRET,
  key: 'session',
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
  },
  store: new MemoryStore({ // Potentially change this to a different store
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  saveUninitialized: false,
  resave: false,
}));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client')));
}

authMiddleware.unless = unless;
// TODO: update unless to replace `oauth1CallbackPath with `join('/api', oauth2CallbackPath)`
// once our oauth callback has been updated
app.use(authMiddleware.unless({ path: [oauth2CallbackPath, join('/api', loginPath)] }));

// TODO: change `app.get...` with `router.get...` once our oauth callback has been updated
app.get(oauth2CallbackPath, async (req, res) => {
  try {
    const user = await hsesAuth.code.getToken(req.originalUrl);
    // user will have accessToken and refreshToken
    const requestObj = user.sign({
      method: 'get',
      url: 'https://uat.hsesinfo.org/auth/user/me',
    });

    const { url } = requestObj;

    const response = await axios.get(url, requestObj);
    const { data } = response;
    const { authorities } = data;
    req.session.userId = 1; // temporary
    req.session.role = _.get(authorities[0], 'authority');
    logger.info(`role: ${req.session.role}`);
    res.redirect(process.env.TTA_SMART_HUB_URI);
  } catch (error) {
    // console.log(error);
  }
});

app.use('/api', require('./routes/apiDirectory').default);

module.exports = app;
