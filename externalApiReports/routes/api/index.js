const router = require('express').Router();
const stats = require('./stats');
const infos = require('./infos');

router.use('/stats/v1', stats);
router.use('/infos/v1', infos);

module.exports = router;
