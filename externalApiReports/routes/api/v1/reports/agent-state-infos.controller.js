// var logger = require("../../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const {
    getAgentStateInfos
} = require('../../../../models/agent/agent-state-infos');

const {
  getMediaTypeKeys
} = require('../../../../models/resource-keys/media-type-keys.js');

const {
  getTenantKey
} = require('../../../../models/resource-keys/tenant-keys.js');

const {
  getAgentKey,
} = require('../../../../models/resource-keys/agent-resource-keys.js');

const {
  getAgentGroupKey
} = require('../../../../models/resource-keys/group-resource-keys.js');

const {
  getResDataForNotMandatoryParam,
  filterArgumentsNumber,
  filterArgumentsTimeFormat,
  filterArgumentsIncludeKorean,
  filterArgumentsIncludeAlphabet,
  filterArgumentsCharacterList,
} = require('../../../../utils/common');


var isNotEmpty = value => value != "";


const read = async (req, res, next) => {
  try {
    
    const site_cd = filterArgumentsIncludeKorean(req.params.site_cd);
    const date_unit = filterArgumentsIncludeAlphabet(req.params.date_unit);
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
        .status(400)
        .send(
          getResDataForNotMandatoryParam(mandatoryParamList, missingParamList)
        );
      return;
    }

    var start_date = filterArgumentsNumber(param.startdate);
    var end_date = filterArgumentsNumber(param.enddate);
    if(date_unit == 'monthly') {
      start_date = filterArgumentsNumber(param.startdate).substring(0,6);
      end_date = filterArgumentsNumber(param.enddate).substring(0,6);
    }
    
    var tenant_key = await getTenantKey(site_cd);

    var media_type = '';
    var group_cd = '';
    var agent_id = '';

    var start_time = '';
    var end_time = '';

    if(date_unit == 'hourly' && param.starttime && param.endtime) {
      console.log("date_unit: " + date_unit);
      start_time = filterArgumentsTimeFormat(param.starttime);
      end_time = filterArgumentsTimeFormat(param.endtime);
    }

    if(param.channel) {
      media_type = filterArgumentsCharacterList(param.channel);
    }

    if(param.groupcd) {
      group_cd = filterArgumentsCharacterList(param.groupcd);
    }

    if(param.agentid) {
      agent_id = filterArgumentsCharacterList(param.agentid);
    }

    var media_type_key = ''
    if (isNotEmpty(media_type)) {
      media_type_key = await getMediaTypeKeys({ site_cd, media_type });
      console.log('[agent-state-infos.controller] media_type_key: ' + JSON.stringify(media_type_key));
    }

    var group_key = ''
    if (isNotEmpty(group_cd)) {
      group_key = await getAgentGroupKey({ site_cd, group_cd });
      console.log('[agent-state-infos.controller] agent_group_key: ' + JSON.stringify(group_key));
    }

    var agent_key = ''
    if (isNotEmpty(agent_id)) {
      agent_key = await getAgentKey({ site_cd, group_cd, agent_id });
      console.log('[agent-state-infos.controller] agent_key: ' + JSON.stringify(agent_key));
    }

    var agent_state_infos = await getAgentStateInfos({ date_unit, site_cd, tenant_key, group_key, agent_key, media_type_key, start_date, end_date, start_time, end_time });
    console.log('[agent-state-infos.controller] agent_state_infos: ' + JSON.stringify(agent_state_infos));
 
    res.status(200).json( agent_state_infos );
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
  }
};

module.exports = {
  read
}