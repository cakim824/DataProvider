// var logger = require("../../../../utils/logger")({
//   dirname: "",
//   filename: "",
//   sourcename: "agent-outputs.controller.js"
// });

const {
    getAgentCenterOutputs
} = require('../../../models/agent/agent-center-outputs');

const {
    getInteractionTypeKeys
} = require('../../../models/resource-keys/interaction-type-keys.js');

const {
    getTenantKey
} = require('../../../models/resource-keys/tenant-keys.js');

const {
    getResDataForNotMandatoryParam,
    filterArgumentsNumber,
    filterArgumentsTimeFormat,
    filterArgumentsIncludeKorean,
    filterArgumentsIncludeAlphabet,

} = require('../../../utils/common');

const {
    pluck,
    sum,
} = require('ramda');

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

        if (!param.startdate) {
            existMandatoryParam = false;
            missingParamList.push("startdate");
        }

        if (!param.enddate) {
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
        if (date_unit == 'monthly') {
            start_date = filterArgumentsNumber(param.startdate).substring(0, 6);
            end_date = filterArgumentsNumber(param.enddate).substring(0, 6);
        }

        var start_time = '';
        var end_time = '';

        if (date_unit == 'hourly' && param.starttime && param.endtime) {
            console.log("date_unit: " + date_unit);
            start_time = filterArgumentsTimeFormat(param.starttime);
            end_time = filterArgumentsTimeFormat(param.endtime);
        }

        var tenant_key = await getTenantKey(site_cd);
        var inbound_type_keys = await getInteractionTypeKeys('INBOUND');
        var outbound_type_keys = await getInteractionTypeKeys('OUTBOUND');

        var agent_center_outputs;
        var sum_data;

        agent_center_outputs = await getAgentCenterOutputs({ date_unit, tenant_key, site_cd, start_date, end_date, start_time, end_time, inbound_type_keys, outbound_type_keys });
        sum_data = getSum(agent_center_outputs);

        console.log('[agent-center-outputs.controller] agent_center_outputs: ' + JSON.stringify(agent_center_outputs));
        res.status(200).json({ data: agent_center_outputs, sum: sum_data });
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