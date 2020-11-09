const router = require('express').Router();

const agentOutputsController = require('./agent-outputs.controller');
const agentGroupOutputsController = require('./agent-group-outputs.controller');
const agentCenterOutputsController = require('./agent-center-outputs.controller');

router.use('/:site_cd/agent-outputs/:date_unit', agentOutputsController.read);
router.use('/:site_cd/agent-group-outputs/:date_unit', agentGroupOutputsController.read);
router.use('/:site_cd/agent-center-outputs/:date_unit', agentCenterOutputsController.read);

module.exports = router;
