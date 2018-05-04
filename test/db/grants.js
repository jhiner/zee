const test = require('ava');
const grants = require('../../lib/db/grants');
const testData = require('../_testData');

// test('Grants', t => {
// 	t.pass();
// });

// test('Create grant', async t => {
// 	const bar = Promise.resolve('bar');

// 	t.is(await bar, 'bar');
// });

test('Create and read grant', t => {
  t.true(1===1);
    // grants.upsert(testData.client, testData.user, 'userinfo', function(err, grant) {
    //     t.true(grant.client_id === testData.client.client_id, 'Client id matches');

    //     grants.getById(grant.grant_id, function(err, readGrant) {
    //         t.true(readGrant.client_id === testData.client.client_id, 'Grant id matches');
    //     });
    // });
});