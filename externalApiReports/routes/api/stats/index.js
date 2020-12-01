const router = require('express').Router();

const agentOutputsController = require('./agent-outputs.controller');
const agentGroupOutputsController = require('./agent-group-outputs.controller');
const agentCenterOutputsController = require('./agent-center-outputs.controller');
const agentStateInfosController = require('./agent-state-infos.controller');
const agentDailyLoginInfosController = require('./agent-daily-login-infos.controller');
const centerEnteredCallsController = require('./center-entered-calls.controller');
const consultConnectedCallsController = require('./consult-connected-calls.controller');
const agentNotreadyInfosController = require('./agent-notready-infos.controller');
 
router.use('/:site_cd/agent-outputs/:date_unit', agentOutputsController.read);
router.use('/:site_cd/agent-group-outputs/:date_unit', agentGroupOutputsController.read);
router.use('/:site_cd/agent-center-outputs/:date_unit', agentCenterOutputsController.read);
router.use('/:site_cd/agent-state-infos/:date_unit', agentStateInfosController.read);
router.use('/:site_cd/agent-daily-login-infos', agentDailyLoginInfosController.read);
router.use('/:site_cd/center-entered-calls/:date_unit', centerEnteredCallsController.read);
router.use('/:site_cd/consult-connected-calls/:date_unit', consultConnectedCallsController.read);
router.use('/:site_cd/agent-notready-infos/:date_unit', agentNotreadyInfosController.read);

module.exports = router;
