// var logger = require("../../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const {
  getAgentNotReadyInfos
} = require('../../../models/agent/agent-notready-infos.js');

const {
  getMediaTypeKeys,
} = require('../../../models/resource-keys/media-type-keys.js');

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
  getStateReasonKeys
} = require('../../../models/resource-keys/state-reason-keys.js');

const {
  getResDataForNotMandatoryParam,
  filterArgumentsNumber,
  filterArgumentsTimeFormat,
  filterArgumentsIncludeKorean,
  filterArgumentsIncludeAlphabet,
  filterArgumentsCharacterList,
} = require('../../../utils/common');

const {
  length,
  omit,
  merge,
  mergeAll,
  mergeDeepLeft,
  zipObj,
  assoc,
  toString,
  groupBy,
  keys,
  props,
} = require('ramda');

var isNotEmpty = value => value != "";

const byIndexKey = groupBy(function(data) {
  return data.index;
})

const addColumnNum = async ({ zero_state_data, data }) => {

  for(var i=0; i<length(data); i++) {
    data[i] = mergeDeepLeft(data[i], zero_state_data);
    data[i].NUM = i+1;
  }

  return data;
};

const fulfillZeroData = async (agent_state_reason_keys) => {

  var fulfilled_state_data = new Object();
  var state_time_zero = new Array();

  for(var i=0; i<length(agent_state_reason_keys); i++) {
    state_time_zero[i] = 0;
  }
    
  fulfilled_state_data = zipObj(agent_state_reason_keys, state_time_zero);

  console.log("fulfilled_state_data", fulfilled_state_data)
  return fulfilled_state_data;
};

const processData = async ( data ) => {

  var processed_data = new Array();
  // const onAgentStateResource = props(["DT_KEY", "TENANT_KEY", "RESOURCE_KEY", "MEDIA_TYPE_KEY"]);

  for(var i=0; i<length(data); i++) {

    var index_key = toString(props(["DT_KEY", "TENANT_KEY", "RESOURCE_KEY", "MEDIA_TYPE_KEY"], data[i]));
   //   var index_key = prop("DT_KEY", data[i]) + "-" + prop("RESOURCE_KEY", data[i]) + "-" + prop("MEDIA_TYPE_KEY", data[i]) + "-" + prop("TENANT_KEY", data[i]);
   //   console.log("index_key: ", index_key);

    var mapping_value = data[i].STATE_NAME;
    new_key_value = zipObj([mapping_value], [data[i].STATE_TIME]);
    processed_data[i] = merge(data[i], new_key_value);
    processed_data[i] = omit(['STATE_NAME', 'STATE_TIME'], processed_data[i]);
    processed_data[i] = assoc('index', index_key, processed_data[i]);
  }

  // console.log("processed_data: " + JSON.stringify(processed_data));

  index_processed_data = byIndexKey(processed_data);
  var index_list = keys(index_processed_data);
  console.log("index_list: " + JSON.stringify(index_list));
  console.log("index_processed_data: " + JSON.stringify(index_processed_data));


  var agent_state_time = new Array();
  for(var i=0; i<length(index_list); i++) {
    var index = index_list[i];
    agent_state_time[i] = mergeAll(index_processed_data[index]);
    agent_state_time[i] = omit(['DT_KEY', 'TENANT_KEY', 'RESOURCE_KEY', 'MEDIA_TYPE_KEY', 'index'], agent_state_time[i]);
  }
  console.log("agent_state_time: " + JSON.stringify(agent_state_time)); 
  return agent_state_time;
}

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
        .status(418)
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
      console.log('[agent-notready-infos.controller] media_type_key: ' + JSON.stringify(media_type_key));
    }

    var agent_key = ''
    if (isNotEmpty(agent_id)) {
      agent_key = await getAgentKey({ site_cd, group_cd, agent_id });
      console.log('[agent-notready-infos.controller] agent_key: ' + JSON.stringify(agent_key));
    }
    
    var group_key = ''
    if (isNotEmpty(group_cd)) {
      group_key = await getAgentGroupKey({ site_cd, group_cd });
      agent_key = await getAgentKey({ site_cd, group_cd });
      console.log('[agent-notready-infos.controller] agent_group_key: ' + JSON.stringify(group_key));
      console.log('[agent-notready-infos.controller] agent_key: ' + JSON.stringify(agent_key));
    }

    var agent_state_reason_keys = await getStateReasonKeys({ date_unit, site_cd, tenant_key, start_date, end_date });
    var zero_state_data = await fulfillZeroData(agent_state_reason_keys);
    var agent_notready_infos = await getAgentNotReadyInfos({ date_unit, site_cd, tenant_key, group_key, agent_key, media_type_key, start_date, end_date, start_time, end_time });
    var agent_notready_infos_statename = await processData(agent_notready_infos);
    var final_agent_notready_infos = await addColumnNum({ zero_state_data, data: agent_notready_infos_statename });

    console.log('[agent-notready-infos.controller] agent_state_reason_keys: ' + JSON.stringify(agent_state_reason_keys));
    console.log('[agent-notready-infos.controller] zero_state_data: ' + JSON.stringify(zero_state_data));
    console.log('[agent-notready-infos.controller] agent_notready_infos: ' + JSON.stringify(agent_notready_infos));
    console.log('[agent-notready-infos.controller] agent_notready_infos_statename: ' + JSON.stringify(agent_notready_infos_statename));
    console.log('[agent-notready-infos.controller] final_agent_notready_infos: ' + JSON.stringify(final_agent_notready_infos));
 
    res.status(200).json({data: final_agent_notready_infos});
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
  }
};

module.exports = {
  read
}