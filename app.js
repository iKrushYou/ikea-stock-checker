const checker = require('ikea-availability-checker');
const axios = require('axios');
const moment = require('moment');
var moment = require('moment-timezone');
const URLSearchParams = require('url').URLSearchParams;

const args = require('minimist')(process.argv.slice(2));
const slackKey = args['slack-key']
if (!slackKey) throw new Error('missing argument slackKey');

const slackWebhook = `https://slack.com/api/chat.postMessage`;
const slackChannel = "C01PTTE1M60";

const storeIds = ['156', '921']
const productId = "60360476";

const sendSlackMessage = async blocks => {
    const method = 'POST';
    try {
        console.log({blocks})
        const response = await axios({
            method,
            url: slackWebhook,
            headers: {Authorization: `Bearer ${slackKey}`},
            data: {channel: slackChannel, blocks}
        })
        console.log({response})
    } catch (e) {
        console.error({e})
    }
}

const blockSectionText = (text) => ({
    type: "section",
    text: {
        type: "mrkdwn",
        text
    }
});

const blockDivider = () => ({
    type: "divider"
});

const blockSectionFields = (fieldTexts) => ({
    type: "section",
    fields: fieldTexts.map(fieldText => ({
        type: "mrkdwn",
        text: fieldText
    }))
});

(async function main() {

        console.log('starting')

        const blocks = []
        blocks.push(blockSectionText(`*${moment().tz("America/New_York").format('LLL')}*`))
        blocks.push(blockSectionText(`*Product:*\n${productId}`))

        for (const storeId of storeIds) {
            const store = checker.stores.findOneById(storeId);
            console.log({store})
            blocks.push(blockDivider())
            blocks.push(blockSectionText(`*Store: *\n${store.name}`))
            const result = await checker.availability(store.buCode, productId);
            console.log('RESULT', result);
            blocks.push(blockSectionText(`*Stock: *\n${result.stock}`))
            blocks.push(blockSectionText(`*Forecast: *\n${result.forecast.map(forecast => `\t${moment(forecast.date).tz("America/New_York").format('LL')} - ${forecast.stock}\n`).join('')}`))
        }

        sendSlackMessage(blocks).then()

    }
)();
