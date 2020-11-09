const router = require('express').Router();
const reports = require('./reports');
const infos = require('./infos');

router.use('/reports', reports);
router.use('/infos', infos);

module.exports = router;
