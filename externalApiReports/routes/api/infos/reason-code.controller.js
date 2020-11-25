
const { getSiteReasonCodes } = require('../../../models/resource-keys/state-reason-keys.js');

const {
    length,
    pickAll,
  } = require('ramda')

const pickColumn = async (data) => {

    var filtered_data = new Array();
    for(var i=0; i<length(data); i++) {
      filtered_data[i] = pickAll(['NUM', 'STATE_NAME', 'STATE_ENAME'], data[i]);
    }
  
    return filtered_data;
};

const read = async (req, res, next) => {
    try {

        const site_cd = req.params.site_cd;
        console.log('[group-code.controller] site_cd: ' + site_cd );

        var action_code_infos = await getSiteReasonCodes( site_cd );
        console.log('[group-code.controller] action_code_infos: ' + JSON.stringify(action_code_infos));

        const final_action_code_infos = await pickColumn(action_code_infos)
        console.log('[group-code.controller] final_action_code_infos: ' + JSON.stringify(final_action_code_infos));
        
        res.status(200).json(final_action_code_infos);
    } catch (error) {
        console.log(error);
        res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
    }
};
  
  module.exports = {
    read
  }