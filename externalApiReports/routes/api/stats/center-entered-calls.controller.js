const {
  EnterQueue, 
  ConsultConnectQueue,
} = require('../../../models/queue');

const {
  getEnterQueueKeys,
  getConsultQueueKeys,
  getSiteRepNumber,
  getSiteServiceName
} = require('../../../models/resource-keys/queue-resource-keys.js');

const {
  getResDataForNotMandatoryParam,
  filterArgumentsNumber,
  filterArgumentsTimeFormat,
  filterArgumentsIncludeKorean,
  filterArgumentsIncludeAlphabet,
  convertArgument,
} = require('../../../utils/common');

const {
  filterNone,
  filterByRepNumber,
  filterByServiceName,
  filterTwoSlot,
  leftJoinOnVqKey,
  leftJoinOnDTKeyAndPrevMappingIndex,
  fulfillServiceReqData
} = require('../../../utils/data-helper');

const {
  length,
  pluck,
  sum,
  prop,
  omit,
} = require('ramda')

// const R = require('ramda');
  
// const { 
//   leftJoinOnDIDResourceKey,
//   leftJoinOnServiceResourceKey,
//   summarizeServiceQueueData,
//   addSummarizedServiceQueueData,
//   addIvrProcessingColumnTo,
//   addServiceConnectReqColumnZeroValueTo,
//   mergeDIDAndServiceQueue,
//   sortReceiveCallInfos,
// } = require('../../../utils/data-helper');

  
//   const logger = require("../../../utils/logger")({
//     dirname: "",
//     filename: "",
//     sourcename: "v3/receive-call-infos.controller.js"
//   });
  
const getMappingIndex = async ({ data, service_name }) => {

  console.log("rep_number_data : " + JSON.stringify(data));
  var mapping_index;
  for(var i=0; i<length(data); i++) {
    if(data[i].REP_NUMBER && convertArgument(data[i].REP_NUMBER)  == service_name) mapping_index = data[i].REP_INDEX
    if(data[i].SERVICE_NAME && convertArgument(data[i].SERVICE_NAME)  == service_name) mapping_index = data[i].SERVICE_INDEX
  }

  return mapping_index;
}

const addColumnNum = (data) => {

  for(var i=0; i<length(data); i++) {
    data[i].NUM = i+1;
  }

  return data;
};

const omitColumn = (data) => {

  var filtered_data = new Array();
  for(var i=0; i<length(data); i++) {
    filtered_data[i] = omit(['DT_KEY', 'VQ_KEY', 'PREV_VQ_KEY', 'REP_INDEX', 'SERVICE_INDEX', 'RESPONSE_RATE'], data[i]);
  }

  return filtered_data;
};


const getSum = (data) => {

  var sum_data = new Object();

  var sumData = 0;

  sumData = sum(pluck('CONTACT_CENTER_ENTERED', data));
  sum_data.CONTACT_CENTER_ENTERED = sumData || 0;

  sumData = sum(pluck('AGENT_QUEUE_ENTERED', data));
  sum_data.AGENT_QUEUE_ENTERED = sumData || 0;

  sumData = sum(pluck('AGENT_CONNECTED', data));
  sum_data.AGENT_CONNECTED = sumData || 0;

  sumData = sum(pluck('AGENT_QUEUE_ABANDONED', data));
  sum_data.AGENT_QUEUE_ABANDONED = sumData || 0;

  sumData = sum(pluck('AGENT_RING_ABANDONED', data));
  sum_data.AGENT_RING_ABANDONED = sumData || 0;

  sumData = sum(pluck('SYSTEM_ABANDONED', data));
  sum_data.SYSTEM_ABANDONED = sumData || 0;

  sumData = sum(pluck('FORWARDED', data));
  sum_data.FORWARDED = sumData || 0;

  return sum_data;
};

const getAvg = (sorted_data, sum_data) => {

  // var data_length = length(sorted_data);
  var data_length;
  data_length = length(sorted_data) == 0 ? 1 : length(sorted_data);
  var avg_data = new Object();

  var avgData;

  avgData = prop('CONTACT_CENTER_ENTERED', sum_data)/data_length;
  avg_data.CONTACT_CENTER_ENTERED = avgData.toFixed(2);

  avgData = prop('AGENT_QUEUE_ENTERED', sum_data)/data_length;
  avg_data.CONSULT_ENTERED = avgData.toFixed(2); 

  avgData = prop('AGENT_CONNECTED', sum_data)/data_length;
  avg_data.AGENT_CONNECTED = avgData.toFixed(2); 

  avgData = prop('AGENT_QUEUE_ABANDONED', sum_data)/data_length;
  avg_data.AGENT_QUEUE_ABANDONED = avgData.toFixed(2); 

  avgData = prop('AGENT_RING_ABANDONED', sum_data)/data_length;
  avg_data.AGENT_RING_ABANDONED = avgData.toFixed(2); 

  avgData = prop('SYSTEM_ABANDONED', sum_data)/data_length;
  avg_data.SYSTEM_ABANDONED = avgData.toFixed(2); 

  avgData = prop('FORWARDED', sum_data)/data_length;
  avg_data.FORWARDED = avgData.toFixed(2); 

  avgData = prop('AGENT_CONNECTED', sum_data) / prop('AGENT_QUEUE_ENTERED', sum_data) *100;
  prop('AGENT_CONNECTED', sum_data) == 0 ? avg_data.RESPONSE_RATE = 0 : avg_data.RESPONSE_RATE = avgData.toFixed(2);

  return avg_data;
};


const readDatasource = async({ site_cd, date_unit, start_date, end_date, start_time, end_time, enter_queue_key, consult_queue_key }) => {
  return Promise.all([
    getSiteRepNumber({ site_cd, apply_date: end_date }),
    getSiteServiceName({ site_cd, apply_date: end_date }),
    EnterQueue.find({ site_cd, date_unit, start_date, end_date, start_time, end_time, enter_queue_key }),
    ConsultConnectQueue.find({ site_cd, date_unit, start_date, end_date, start_time, end_time, consult_queue_key })
  ])
};

  
const read = async (req, res, next) => {
  try {

    console.log("center-entered-calls")
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

    var start_date = filterArgumentsNumber(param.startdate).substring(0,8);
    var end_date = filterArgumentsNumber(param.enddate).substring(0,8);
    if(date_unit == 'monthly') {
      start_date = filterArgumentsNumber(param.startdate).substring(0,6) + '01';
      end_date = filterArgumentsNumber(param.enddate).substring(0,6) + '31';
    }

    if (length(start_date) != 8 || length(end_date) != 8) {
      console.log()
      res.status(418).send("Wrong Date Format");
      return;
    }

    var start_time = '';
    var end_time = '';
    if (date_unit == 'hourly' && param.starttime && param.endtime) {
      console.log("date_unit: " + date_unit);
      start_time = filterArgumentsTimeFormat(param.starttime);
      end_time = filterArgumentsTimeFormat(param.endtime);
    }

    var rep_number_index = '';
    var service_name_index = '';
    var enter_queue_key = '';
    var consult_queue_key = '';
    
    enter_queue_key = await getEnterQueueKeys({ site_cd, end_date });
    console.log('[consult-connected-calls.controller] enter_queue_key: ' + JSON.stringify(enter_queue_key));
    
    consult_queue_key = await getConsultQueueKeys({ site_cd, end_date });
    console.log('[consult-connected-calls.controller] consult_queue_key: ' + JSON.stringify(consult_queue_key));

    const [
      enter_queue_info,
      consult_queue_info,
      enter_queue_data,
      consult_queue_data
    ] = await readDatasource({ site_cd, date_unit, start_date, end_date, start_time, end_time, enter_queue_key, consult_queue_key });

    console.log('[consult-connected-calls.controller] enter_queue_info: ' + JSON.stringify(enter_queue_info));
    console.log('[consult-connected-calls.controller] consult_queue_info: ' + JSON.stringify(consult_queue_info));
    console.log('[consult-connected-calls.controller] enter_queue_data: ' + JSON.stringify(enter_queue_data));
    console.log('[consult-connected-calls.controller] consult_queue_data: ' + JSON.stringify(consult_queue_data));


    if(param.repnumber) {
      rep_number = convertArgument(param.repnumber);
      console.log("rep_number : " + rep_number);
      rep_number_index = await getMappingIndex({ data: enter_queue_info, service_name: rep_number });
      // rep_number_index = await getDatabaseServiceName({ site_cd, end_date, service_name: rep_number });
      console.log("rep_number_index : " + rep_number_index);
    }

    if(param.servicename) {
      service_name = convertArgument(param.servicename);
      console.log("service_name : " + service_name);
      service_name_index = await getMappingIndex({ data: consult_queue_info, service_name: service_name });
      // service_name_index = await getDatabaseServiceName({ site_cd, end_date, service_name: service_name });
      console.log("service_name_index : " + service_name_index);
    }

    const filterByParameter = filterTwoSlot(
      param.repnumber ? filterByRepNumber(rep_number_index) : filterNone,
      param.servicename ? filterByServiceName(service_name_index) : filterNone
    )


    const enter_queue_data_n_info = await leftJoinOnVqKey(enter_queue_data, enter_queue_info);
    console.log('[consult-connected-calls.controller] consult_queue_info_n_data: ' + JSON.stringify(enter_queue_data_n_info));

    const consult_queue_data_n_info = await leftJoinOnVqKey(consult_queue_data, consult_queue_info);
    console.log('[consult-connected-calls.controller] consult_queue_info_n_data: ' + JSON.stringify(consult_queue_data_n_info));

    const consult_queue_n_enter_queue = await leftJoinOnDTKeyAndPrevMappingIndex(enter_queue_data_n_info, consult_queue_data_n_info);
    console.log('[consult-connected-calls.controller] consult_queue_n_enter_queue: ' + JSON.stringify(consult_queue_n_enter_queue));

    const sum_data = getSum(consult_queue_n_enter_queue);
    console.log('[consult-connected-calls.controller] sum_data: ' + JSON.stringify(sum_data));
    // const avg_data = getAvg(consult_queue_n_enter_queue, sum_data);
    // console.log('[consult-connected-calls.controller] avg_data: ' + JSON.stringify(avg_data));
    
    const fulfilled_data = fulfillServiceReqData(consult_queue_n_enter_queue);
    console.log('[consult-connected-calls.controller] fulfilled_data: ' + JSON.stringify(fulfilled_data));

    var filtered_data = filterByParameter(fulfilled_data);
    console.log('[consult-connected-calls.controller] filtered_data: ' + JSON.stringify(filtered_data));
    filtered_data = addColumnNum(filtered_data);

    const final_data = omitColumn(filtered_data);
    console.log('[consult-connected-calls.controller] final_data: ' + JSON.stringify(final_data));  

    res.status(200).json({ data: final_data, sum: sum_data });
  } catch (error) {
    if (error.code === '418') {
      res.status(error.code).json({ errorCode: error.code, errorMessage: error.message });  
    }
    console.log(error);
    res.status(500).json({ errorCode: 500, errorMessage: '문제가 발생했습니다.' });
  }
};

module.exports = {
  read,
}