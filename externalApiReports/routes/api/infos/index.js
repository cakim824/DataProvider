
const router = require("express").Router();

// const agentIdController = require("./agent-id.controller");
// const groupCodeController = require("./group-code.controller");
// const reportsListController = require("./reports-list.controller");

// router.get('/agents/:site_cd', agentIdController.read);
// router.get('/groups/:site_cd', groupCodeController.read);
// router.get('/reports/:site_cd', reportsListController.read);


const reportsInfos = require('./reports-list.controller');
const agentInfos = require('./agent-id.controller');
const groupInfos = require('./group-code.controller');
const channelInfos = require('./channel-type.controller');
router.get('/:site_cd/reports', reportsInfos.read);
router.get('/:site_cd/agents', agentInfos.read);
router.get('/:site_cd/groups', groupInfos.read);
router.get('/:site_cd/channels', channelInfos.read);


module.exports = router;
