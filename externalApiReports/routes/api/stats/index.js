const router = require('express').Router();

const agentOutputsController = require('./agent-outputs.controller');
const agentGroupOutputsController = require('./agent-group-outputs.controller');
const agentCenterOutputsController = require('./agent-center-outputs.controller');
const agentStateInfosController = require('./agent-state-infos.controller');

router.use('/:site_cd/agent-outputs/:date_unit', agentOutputsController.read);
router.use('/:site_cd/agent-group-outputs/:date_unit', agentGroupOutputsController.read);
router.use('/:site_cd/agent-center-outputs/:date_unit', agentCenterOutputsController.read);
router.use('/:site_cd/agent-state-infos/:date_unit', agentStateInfosController.read);

module.exports = router;
