
const router = require("express").Router();

const agentIdController = require("./agent-id.controller");
const groupCodeController = require("./group-code.controller");
const reportsListController = require("./reports-list.controller");

router.get('/agents/:site_cd', agentIdController.read);
router.get('/groups/:site_cd', groupCodeController.read);
router.get('/reports/:site_cd', reportsListController.read);



const agentInfos = require('./agent-id.controller');
const groupInfos = require('./group-code.controller');
router.get('/:site_cd/agents', agentInfos.read);
router.get('/:site_cd/groups', groupInfos.read);


module.exports = router;
