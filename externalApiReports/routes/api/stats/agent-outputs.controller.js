// var logger = require("../../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const {
    getAgentOutputs,
    getInboundOutputs,
    getOutboundOutputs,
    getInternalOutputs
} = require('../../../models/agent/agent-outputs');

const {
    getInteractionTypeKeys
} = require('../../../models/resource-keys/interaction-type-keys.js');

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

const {
    pluck,
    sum,
} = require('ramda')

var isNotEmpty = value => value != "";

const getSum = (data) => {

  var sum_data = new Object();

  var sumData = 0;

  sumData = sum(pluck('IB_OFFERED', data));
  sum_data.IB_OFFERED = sumData;

  sumData = sum(pluck('IB_ENGAGE', data));
  sum_data.IB_ENGAGE = sumData;

  sumData = sum(pluck('OB_OFFERED', data));
  sum_data.OB_OFFERED = sumData;

  sumData = sum(pluck('OB_ENGAGE', data));
  sum_data.OB_ENGAGE = sumData;

  sumData = sum(pluck('IN_OFFERED', data));
  sum_data.IN_OFFERED = sumData;

  sumData = sum(pluck('IN_ENGAGE', data));
  sum_data.IN_ENGAGE = sumData;

  sumData = sum(pluck('TRANSFER_INIT_AGENT', data));
  sum_data.TRANSFER_INIT_AGENT = sumData;

  sumData = sum(pluck('TRANSFER_ACCEPTED', data));
  sum_data.TRANSFER_ACCEPTED = sumData;

  return sum_data;
};

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

    var group_cd = '';
    var agent_id = '';

    var start_time = '';
    var end_time = '';

    if(date_unit == 'hourly' && param.starttime && param.endtime) {
      console.log("date_unit: " + date_unit);
      start_time = filterArgumentsTimeFormat(param.starttime);
      end_time = filterArgumentsTimeFormat(param.endtime);
    }

    if(param.groupcd) {
      group_cd = filterArgumentsCharacterList(param.groupcd);
    }

    if(param.agentid) {
      agent_id = filterArgumentsCharacterList(param.agentid);
    }

    var tenant_key = await getTenantKey(site_cd);
    var inbound_type_keys = await getInteractionTypeKeys('INBOUND');
    var outbound_type_keys = await getInteractionTypeKeys('OUTBOUND');
    var internal_type_keys = await getInteractionTypeKeys('INTERNAL');


    var group_key = ''
    if (isNotEmpty(group_cd)) {
      group_key = await getAgentGroupKey({ site_cd, group_cd });
      console.log('[agent-group-outputs.controller] agent_group_key: ' + JSON.stringify(group_key));
    }

    var agent_key = ''
    if (isNotEmpty(agent_id)) {
      agent_key = await getAgentKey({ site_cd, group_cd, agent_id });
      console.log('[agent-group-outputs.controller] agent_key: ' + JSON.stringify(agent_key));
    }

    var agent_output_data;
    var sum_data;

    agent_output_data = await getAgentOutputs({ date_unit, site_cd, group_key, tenant_key, agent_key, start_date, end_date, start_time, end_time, inbound_type_keys, outbound_type_keys, internal_type_keys });
    console.log('[agent-outputs.controller] agent_output_data: ' + JSON.stringify(agent_output_data));
    sum_data = getSum(agent_output_data);
    console.log('[agent-outputs.controller] sum_data: ' + JSON.stringify(sum_data));
 
    res.status(200).json({data: agent_output_data, sum: sum_data});
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
  }
};

module.exports = {
  read
}