// var logger = require("../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const { getAgentGroupCode } = require('../../../../models/resource-keys/group-resource-keys.js');
  
const read = async (req, res, next) => {
    try {

        const site_cd = req.params.site_cd;
        const group_cd = '';
        console.log('[group-code.controller] site_cd: ' + site_cd + ' // group_cd: ' + group_cd);

        var group_infos;
        group_infos = await getAgentGroupCode({ site_cd, group_cd });

        console.log('[group-code.controller] group_cd: ' + JSON.stringify(group_infos));
        res.status(200).json(group_infos);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            errorCode: 500,
            errorMessage: '문제가 발생했습니다.'
        });
    }
};
  
  module.exports = {
    read
  }