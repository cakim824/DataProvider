// var logger = require("../../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const {
    getAgentDailyLoginInfos
} = require('../../../models/agent/agent-daily-login-infos');

const {
  getTenantKey
} = require('../../../models/resource-keys/tenant-keys.js');

const {
  getAgentKey,
} = require('../../../models/resource-keys/agent-resource-keys.js');

const {
  getAgentGroupKey
} = require('../../../models/resource-keys/group-resource-keys.js');

const {
  getResDataForNotMandatoryParam,
  filterArgumentsNumber,
  filterArgumentsTimeFormat,
  filterArgumentsIncludeKorean,
  filterArgumentsIncludeAlphabet,
  filterArgumentsCharacterList,
} = require('../../../utils/common');

var isNotEmpty = value => value != "";

const read = async (req, res, next) => {
  try {
    
    const site_cd = filterArgumentsIncludeKorean(req.params.site_cd);
    const param = req.query || {};

    var existMandatoryParam = true;
    var mandatoryParamList = ["startdate", "enddate"];
    var missingParamList = [];

    if (!param.startdate || param.startdate == '') {
      existMandatoryParam = false;
      missingParamList.push("startdate");
    }

    if (!param.enddate || param.enddate == '') {
      existMandatoryParam = false;
      missingParamList.push("enddate");
    }

    if (!existMandatoryParam) {
      res
        .status(418)
        .send(
          getResDataForNotMandatoryParam(mandatoryParamList, missingParamList)
        );
      return;
    }

    var start_date = filterArgumentsNumber(param.startdate);
    var end_date = filterArgumentsNumber(param.enddate);

    var group_cd = '';
    var agent_id = '';

    if(param.groupcd) {
      group_cd = filterArgumentsCharacterList(param.groupcd);
    }
    if(param.agentid) {
      agent_id = filterArgumentsCharacterList(param.agentid);
    }

    var tenant_key = await getTenantKey(site_cd);

    var group_key = ''
    if (isNotEmpty(group_cd)) {
      group_key = await getAgentGroupKey({ site_cd, group_cd });
      console.log('[agent-daily-login-infos.controller] agent_group_key: ' + JSON.stringify(group_key));
    }

    var agent_key = ''
    if (isNotEmpty(agent_id)) {
      agent_key = await getAgentKey({ site_cd, group_cd, agent_id });
      console.log('[agent-daily-login-infos.controller] agent_key: ' + agent_key);
    }

    var agent_login_infos;

    agent_login_infos = await getAgentDailyLoginInfos({ site_cd, tenant_key, group_key, agent_key, start_date, end_date });
    console.log('[agent-daily-login-infos.controller] agent_login_infos: ' + JSON.stringify(agent_login_infos));
 
    res.status(200).json({data: agent_login_infos});
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
  }
};

module.exports = {
  read
}