
const router = require("express").Router();

const reportsInfos = require('./reports-list.controller');
const agentInfos = require('./agent-id.controller');
const groupInfos = require('./group-code.controller');
const channelInfos = require('./channel-type.controller');
const repServiceInfos = require('./repnumber-services.controller');
const reasonCodeInfos = require('./reason-code.controller');

router.get('/:site_cd/reports', reportsInfos.read);
router.get('/:site_cd/agents', agentInfos.read);
router.get('/:site_cd/groups', groupInfos.read);
router.get('/:site_cd/channels', channelInfos.read);
router.get('/:site_cd/repnumbers', repServiceInfos.readRepnumbers);
router.get('/:site_cd/services', repServiceInfos.readServices);
router.get('/:site_cd/notready-reason-codes', reasonCodeInfos.read);


module.exports = router;
