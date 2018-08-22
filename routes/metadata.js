const express = require('express');
const router = express.Router();
const configs = require('config');
var axios = require('axios');
const Utilities = require('../Utilities/utilities');
const Joi = require('joi');
const { poolPromise } = require('../database/db')
const winston = require('winston');
const moment = require('moment');

router.post('/', async (req, res) => {

    const { error } = validate(req.body);

    if (error) {
        winston.error('Error occurred ', error.message);
        res.status(400).send(error.details[0].message);
        return;
    }

    let Subject = req.body.Subject;
    let ConversationId = req.body.ConversationId;
    let Sender = req.body.From;
    let ToList = Utilities.extractEmails(req.body.ToList);
    let CCList = req.body.CCList != undefined ? Utilities.extractEmails(req.body.CCList) : req.body.CCList;
    let Domain = Utilities.extractDomain(Sender);
    //let AccountName = Utilities.extractAccountName(Domain);
    let AccountName = Utilities.extractAccountNameWithoutDomain(Domain);

    let LocalTimeStamp = req.body.ReceivedDate;
    let GMTTimeStamp = undefined;

    const response = await axios.post(configs.get('sentimentApiUrl'), {
        "Subject": Subject,
        "Body": req.body.Body
    })

    const SentimentScore = response.data.BodyScore.toFixed(2);
    const Sentiment = Utilities.extractSentiment(SentimentScore);
    const SubjectScore = response.data.SubjectScore.toFixed(2);
    const Keywords = response.data.BodyKeywords;
    const Subjectivity = response.data.BodySubjectivity.toFixed(2);
    const Intent = response.data.BodyIntentActions;

    var query = 'Insert into dbo.SentimentAnalysisMetadata(Sentiment, ConversationId, Subject, Sender, ToList, CCList, SentimentScore, SubjectScore, Domain, AccountName,LocalTimeStamp, GMTTimeStamp, Keywords, Subjectivity, Intent, CreatedAt )values' +
        '(@Sentiment, @ConversationId,@Subject,@Sender,@ToList,@CCList,@SentimentScore, @SubjectScore , @Domain, @AccountName, @LocalTimeStamp, @GMTTimeStamp,@Keywords ,@Subjectivity,@Intent,@CreatedAt)';

    const pool = await poolPromise;

    const result = await pool.request()
        .input('Sentiment', Sentiment)
        .input('ConversationId', ConversationId)
        .input('Subject', Subject)
        .input('Sender', Sender)
        .input('ToList', ToList)
        .input('CCList', CCList)
        .input('SentimentScore', SentimentScore)
        .input('SubjectScore', SubjectScore)
        .input('Domain', Domain)
        .input('AccountName', AccountName)
        .input('LocalTimeStamp', LocalTimeStamp)
        .input('GMTTimeStamp', GMTTimeStamp)
        .input('Keywords', Keywords)
        .input('Subjectivity', Subjectivity)
        .input('Intent', Intent)
        .input('CreatedAt', new Date())
        .query(query);

    res.status(201).send(response.data);
});


router.post('/test', async (req, res) => {

    const { error } = validate(req.body);

    if (error) {
        winston.error('Error occurred ', error.message);
        res.status(400).send(error.details[0].message);
        return;
    }

    let Subject = req.body.Subject;
    let ConversationId = req.body.ConversationId;
    let Sender = req.body.From;
    let ToList = Utilities.extractEmails(req.body.ToList);
    let CCList = req.body.CCList != undefined ? Utilities.extractEmails(req.body.CCList) : req.body.CCList;
    let Domain = Utilities.extractDomain(Sender);
    //let AccountName = Utilities.extractAccountName(Domain);
    let AccountName = Utilities.extractAccountNameWithoutDomain(Domain);
    let LocalTimeStamp = req.body.ReceivedDate;
    let GMTTimeStamp = undefined;

    const response = await axios.post(configs.get('sentimentApiUrl'), {
        "Subject": Subject,
        "Body": req.body.Body
    })

    const SentimentScore = response.data.BodyScore.toFixed(2);
    const Sentiment = Utilities.extractSentiment(SentimentScore);
    const SubjectScore = response.data.SubjectScore.toFixed(2);
    const Keywords = response.data.BodyKeywords;
    const Subjectivity = response.data.BodySubjectivity.toFixed(2);
    const Intent = response.data.BodyIntentActions;

    var query = 'Insert into dbo.SentimentAnalysisMetadataTest(Sentiment, ConversationId, Subject, Sender, ToList, CCList, SentimentScore, SubjectScore, Domain, AccountName,LocalTimeStamp, GMTTimeStamp, Keywords, Subjectivity, Intent, CreatedAt )values' +
        '(@Sentiment, @ConversationId,@Subject,@Sender,@ToList,@CCList,@SentimentScore, @SubjectScore , @Domain, @AccountName, @LocalTimeStamp, @GMTTimeStamp,@Keywords ,@Subjectivity,@Intent,@CreatedAt)';

    const pool = await poolPromise;

    const result = await pool.request()
        .input('Sentiment', Sentiment)
        .input('ConversationId', ConversationId)
        .input('Subject', Subject)
        .input('Sender', Sender)
        .input('ToList', ToList)
        .input('CCList', CCList)
        .input('SentimentScore', SentimentScore)
        .input('SubjectScore', SubjectScore)
        .input('Domain', Domain)
        .input('AccountName', AccountName)
        .input('LocalTimeStamp', LocalTimeStamp)
        .input('GMTTimeStamp', GMTTimeStamp)
        .input('Keywords', Keywords)
        .input('Subjectivity', Subjectivity)
        .input('Intent', Intent)
        .input('CreatedAt', new Date())
        .query(query);

    res.status(201).send(response.data);
});


router.get('/lastSync', async (req, res) => {
    var query = 'select max(LocalTimeStamp) as LastSyncTime from dbo.SentimentAnalysisMetadata';
    const pool = await poolPromise;
    const result = await pool.request()
        .query(query);
    res.send(result.recordset[0]);
})

function validate(email) {

    const schema = {
        Subject: Joi.string().required(),
        Body: Joi.string().required(),
        From: Joi.string().email(),
        ConversationId: Joi.string().required(),
        ToList: Joi.string().required(),
        CCList: Joi.string().allow('').optional(),
        ReceivedDate: Joi.any().optional(),

    }
    return Joi.validate(email, schema);
}

module.exports = router;
