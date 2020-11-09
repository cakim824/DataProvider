// var logger = require("../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const { filterArgumentsCharacterList } = require('../../../../utils/common');

const { getAgentId } = require('../../../../models/resource-keys/agent-resource-keys.js');


const read = async (req, res, next) => {
    try {

        const site_cd = req.params.site_cd;
        const param = req.query || {};
        var group_cd = '';
        var agent_name = '';

        if (param.groupcd) {
            group_cd = filterArgumentsCharacterList(param.groupcd);
            console.log('[agent-id.controller] site_cd: ' + site_cd + ' group_cd: ' + group_cd + '///');
        }

        if (param.agentname) {
            agent_name = filterArgumentsCharacterList(param.agentname);
            console.log('[agent-id.controller] site_cd: ' + site_cd + ' agent_name: ' + agent_name + '///');
        }

        var agent_infos;
        agent_infos = await getAgentId({ site_cd, group_cd, agent_name });

        console.log('[agent-id.controller] agent_infos: ' + JSON.stringify(agent_infos));
        //   res.status(200).json({ data: agent_infos });
        res.status(200).json(agent_infos);
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